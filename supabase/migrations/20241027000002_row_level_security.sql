-- ==============================================================================
-- Migration: 20241027000002_row_level_security.sql
-- Description: Row Level Security (RLS) policies for all e-commerce tables
-- Security Model:
--   - Public Read: categories, active products, product variants, product images
--   - Admin Write: full catalog management (categories, products, variants, images)
--   - Customers: read/write own orders and order items; guest orders supported
--   - Admins: read/write all orders and manage admins table
-- ==============================================================================

-- ==============================================================================
-- 1. Helper Function: is_admin()
-- Determines if the requesting authenticated user has an entry in public.admins
-- Uses SECURITY DEFINER to bypass RLS recursion on the admins table itself.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admins 
    WHERE user_id = auth.uid()
  );
$$;

-- ==============================================================================
-- 2. Admins Table RLS
-- ==============================================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can view other admins
CREATE POLICY "Admins can view admin list"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only admins can insert/update/delete admins
CREATE POLICY "Admins can manage admin list"
  ON public.admins
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 3. Categories Table RLS
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone (public/anonymous/authenticated) can view categories
CREATE POLICY "Allow public read access to categories"
  ON public.categories
  FOR SELECT
  TO public
  USING (true);

-- Only admins can modify categories
CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 4. Products Table RLS
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view active products; Admins can view all (active and inactive)
CREATE POLICY "Allow public read access to active products"
  ON public.products
  FOR SELECT
  TO public
  USING (is_active = true OR public.is_admin());

-- Admin-only catalog modifications
CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 5. Product Variants Table RLS
-- ==============================================================================
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Public can view all variants
CREATE POLICY "Allow public read access to product variants"
  ON public.product_variants
  FOR SELECT
  TO public
  USING (true);

-- Admin-only variant modifications
CREATE POLICY "Admins can insert product variants"
  ON public.product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update product variants"
  ON public.product_variants
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete product variants"
  ON public.product_variants
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 6. Product Images Table RLS
-- ==============================================================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Public can view images
CREATE POLICY "Allow public read access to product images"
  ON public.product_images
  FOR SELECT
  TO public
  USING (true);

-- Admin-only image modifications
CREATE POLICY "Admins can insert product images"
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update product images"
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete product images"
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 7. Orders Table RLS
-- Customers can only read/write their own orders; Admins can read/manage all orders.
-- Supports guest checkouts (user_id IS NULL) and authenticated checkouts.
-- ==============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Read policy:
-- Authenticated users see their own orders.
-- Admins see all orders.
CREATE POLICY "Users can read own orders, admins read all"
  ON public.orders
  FOR SELECT
  TO public
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
    OR public.is_admin()
  );

-- Insert policy:
-- Allows authenticated users to create orders attached to their user_id.
-- Allows guest checkouts where user_id IS NULL.
CREATE POLICY "Customers and guests can insert orders"
  ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (
    (user_id IS NULL) 
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- Update/Delete policies:
-- Only admins can modify order status, amounts, or cancel/delete orders.
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 8. Order Items Table RLS
-- Linked to orders security model.
-- ==============================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Read policy:
-- Customers see items for their own orders; admins see all items.
CREATE POLICY "Users can view order items for their own orders, admins view all"
  ON public.order_items
  FOR SELECT
  TO public
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
        AND auth.uid() IS NOT NULL
    )
  );

-- Insert policy:
-- Anyone placing an order can insert line items matching their created order.
CREATE POLICY "Allow customers and guests to insert order items"
  ON public.order_items
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.user_id IS NULL 
          OR orders.user_id = auth.uid()
        )
    )
  );

-- Update/Delete: admin only
CREATE POLICY "Admins can update order items"
  ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete order items"
  ON public.order_items
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
