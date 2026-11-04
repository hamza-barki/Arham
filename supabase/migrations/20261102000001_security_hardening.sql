-- ==============================================================================
-- Migration: 20261102000001_security_hardening.sql
-- Description:
--   Phase-1 Security hardening pass (fixes applied 2026-11-02):
--   1. Add confirmation_token and idempotency_key (DB-level UNIQUE constraint).
--   2. Remove anon/public INSERT on orders and order_items.
--   3. Enforce active-product-only reads on variants and images.
--   4. Rewrite place_order_atomic RPC:
--        - Accepts only variant_id + quantity + customer/address fields.
--        - Reads ALL prices from the DB (never trusts caller-supplied price).
--        - REVOKE EXECUTE from PUBLIC, anon, authenticated; allow only service_role.
--   5. Add rate_limit_buckets table for durable (non-memory) rate limiting.
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add confirmation_token and idempotency_key columns with DB-level UNIQUE
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmation_token TEXT
    UNIQUE
    DEFAULT encode(gen_random_bytes(24), 'hex'),
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT
    UNIQUE;

CREATE INDEX IF NOT EXISTS idx_orders_confirmation_token ON public.orders(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key    ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_phone_number       ON public.orders(order_number, phone);

UPDATE public.orders
   SET confirmation_token = encode(gen_random_bytes(24), 'hex')
 WHERE confirmation_token IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN confirmation_token SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Remove anon/public INSERT policies on orders & order_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers and guests can insert orders"            ON public.orders;
DROP POLICY IF EXISTS "Allow customers and guests to insert order items"  ON public.order_items;

-- ---------------------------------------------------------------------------
-- 3. Tighten product_variants & product_images: visible only for active products
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to product variants" ON public.product_variants;
CREATE POLICY "Allow public read access to active product variants"
  ON public.product_variants FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
       WHERE p.id = product_variants.product_id
         AND (p.is_active = true OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Allow public read access to product images" ON public.product_images;
CREATE POLICY "Allow public read access to active product images"
  ON public.product_images FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
       WHERE p.id = product_images.product_id
         AND (p.is_active = true OR public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Durable rate-limit table (replaces in-memory Map)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key          TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  hit_count    INTEGER     NOT NULL DEFAULT 1,
  CONSTRAINT pk_rate_limit_buckets PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.rate_limit_buckets(window_start);
ALTER TABLE public.rate_limit_buckets DISABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. Atomic Order Placement RPC — price-authoritative, service_role only
--
--   p_items    : [{variant_id?, product_id?, quantity}]  — NO price field accepted
--   p_customer : {customer_name, phone, address, city, postal_code?, notes?, payment_method?}
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_customer        JSONB,
  p_items           JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_order      RECORD;
  v_order_id            UUID;
  v_order_number        TEXT;
  v_confirmation_token  TEXT;
  v_item                JSONB;
  v_product_id          UUID;
  v_variant_id          UUID;
  v_quantity            INT;
  v_server_price        NUMERIC(10, 2);
  v_updated_rows        INT;
  v_calculated_subtotal NUMERIC(10, 2) := 0;
  v_shipping_fee        NUMERIC(10, 2);
  v_total_amount        NUMERIC(10, 2);
BEGIN
  -- A. Idempotency guard
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT id, order_number, confirmation_token, total_amount
      INTO v_existing_order
      FROM public.orders
     WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success',             true,
        'order_id',            v_existing_order.id,
        'order_number',        v_existing_order.order_number,
        'confirmation_token',  v_existing_order.confirmation_token,
        'total_amount',        v_existing_order.total_amount,
        'idempotent_replayed', true
      );
    END IF;
  END IF;

  -- B. Validate cart not empty
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'CART_EMPTY: Cart contains no items';
  END IF;

  -- C. Per-item: validate qty, lock rows, read SERVER price, decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_quantity   := (v_item->>'quantity')::INT;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY: Quantity must be at least 1';
    END IF;

    IF v_variant_id IS NOT NULL THEN
      -- Lock variant row and read parent product price
      SELECT p.id, p.price
        INTO v_product_id, v_server_price
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
       WHERE pv.id = v_variant_id
         AND p.is_active = true
       FOR UPDATE OF pv;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_INACTIVE: Variant % is inactive or missing', v_variant_id;
      END IF;

      UPDATE public.product_variants
         SET stock_quantity = stock_quantity - v_quantity
       WHERE id = v_variant_id
         AND stock_quantity >= v_quantity;

      GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
      IF v_updated_rows = 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: Variant % has insufficient stock', v_variant_id;
      END IF;

      UPDATE public.products
         SET stock_quantity = GREATEST(0, stock_quantity - v_quantity)
       WHERE id = v_product_id;

    ELSE
      -- Non-variant product
      SELECT id, price
        INTO v_product_id, v_server_price
        FROM public.products
       WHERE id = (v_item->>'product_id')::UUID
         AND is_active = true
       FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_INACTIVE: Product % is inactive or missing', (v_item->>'product_id');
      END IF;

      UPDATE public.products
         SET stock_quantity = stock_quantity - v_quantity
       WHERE id = v_product_id
         AND stock_quantity >= v_quantity;

      GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
      IF v_updated_rows = 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: Product % is out of stock', v_product_id;
      END IF;
    END IF;

    v_calculated_subtotal := v_calculated_subtotal + (v_server_price * v_quantity);
  END LOOP;

  -- D. Server-side shipping (Pakistani rule: free >= Rs.3000)
  v_shipping_fee := CASE WHEN v_calculated_subtotal >= 3000 THEN 0 ELSE 200 END;
  v_total_amount := v_calculated_subtotal + v_shipping_fee;
  v_confirmation_token := encode(gen_random_bytes(24), 'hex');

  -- E. Insert order
  INSERT INTO public.orders (
    customer_name, phone, address, city, postal_code,
    payment_method, status, total_amount, notes,
    idempotency_key, confirmation_token
  ) VALUES (
    p_customer->>'customer_name',
    p_customer->>'phone',
    p_customer->>'address',
    p_customer->>'city',
    NULLIF(p_customer->>'postal_code', ''),
    COALESCE(NULLIF(p_customer->>'payment_method', ''), 'COD'),
    'pending',
    v_total_amount,
    NULLIF(p_customer->>'notes', ''),
    NULLIF(p_idempotency_key, ''),
    v_confirmation_token
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- F. Insert order items with DB prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_quantity   := (v_item->>'quantity')::INT;

    IF v_variant_id IS NOT NULL THEN
      SELECT p.id, p.price INTO v_product_id, v_server_price
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
       WHERE pv.id = v_variant_id;
    ELSE
      SELECT id, price INTO v_product_id, v_server_price
        FROM public.products
       WHERE id = (v_item->>'product_id')::UUID;
    END IF;

    INSERT INTO public.order_items (order_id, product_id, variant_id, quantity, price)
    VALUES (v_order_id, v_product_id, v_variant_id, v_quantity, v_server_price);
  END LOOP;

  -- G. Return result
  RETURN jsonb_build_object(
    'success',            true,
    'order_id',           v_order_id,
    'order_number',       v_order_number,
    'confirmation_token', v_confirmation_token,
    'total_amount',       v_total_amount,
    'shipping_fee',       v_shipping_fee,
    'subtotal',           v_calculated_subtotal
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Lock down RPC permissions
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.place_order_atomic(JSONB, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.place_order_atomic(JSONB, JSONB, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.place_order_atomic(JSONB, JSONB, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.place_order_atomic(JSONB, JSONB, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 7. Helper RPC for durable rate limiter (called by server-side code only)
--    Returns the new hit count for the given key+window bucket.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rate_limit_increment(
  p_key          TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.rate_limit_buckets (key, window_start, hit_count)
  VALUES (p_key, p_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET hit_count = rate_limit_buckets.hit_count + 1
  RETURNING hit_count INTO v_count;

  -- Opportunistically prune buckets older than 2 hours to keep table small
  DELETE FROM public.rate_limit_buckets
   WHERE window_start < now() - INTERVAL '2 hours';

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rate_limit_increment(TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rate_limit_increment(TEXT, TIMESTAMPTZ) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rate_limit_increment(TEXT, TIMESTAMPTZ) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.rate_limit_increment(TEXT, TIMESTAMPTZ) TO service_role;
