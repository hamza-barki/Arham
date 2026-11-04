-- ==============================================================================
-- MIGRATION: Customer Accounts & Order Linking
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. Function: Link past guest orders when a user registers or logs in
CREATE OR REPLACE FUNCTION public.link_guest_orders_to_customer(
  _user_id   UUID,
  _phone     TEXT,
  _email     TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _linked_count INTEGER := 0;
  _clean_phone  TEXT;
BEGIN
  -- Normalize phone if provided
  IF _phone IS NOT NULL AND _phone != '' THEN
    _clean_phone := regexp_replace(_phone, '[^0-9]', '', 'g');
    -- if 92... or +92... convert to 03...
    IF _clean_phone LIKE '92%' AND length(_clean_phone) = 12 THEN
      _clean_phone := '0' || substring(_clean_phone FROM 3);
    END IF;
  END IF;

  -- Link orders matching either phone or email where customer_id was previously NULL
  WITH updated AS (
    UPDATE public.orders
    SET customer_id = _user_id,
        user_id = COALESCE(user_id, _user_id)
    WHERE customer_id IS NULL
      AND (
        (_clean_phone IS NOT NULL AND _clean_phone != '' AND regexp_replace(phone, '[^0-9]', '', 'g') = _clean_phone)
        OR
        (_email IS NOT NULL AND _email != '' AND lower(trim(notes)) LIKE '%' || lower(trim(_email)) || '%')
      )
    RETURNING id
  )
  SELECT count(*) INTO _linked_count FROM updated;

  RETURN _linked_count;
END;
$$;

-- 2. Function: Update marketing consent
CREATE OR REPLACE FUNCTION public.update_marketing_consent(
  _consent BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET marketing_consent = _consent,
      consent_at = CASE WHEN _consent THEN now() ELSE consent_at END
  WHERE id = auth.uid();
END;
$$;

-- 3. Function: Unsubscribe by email or phone (public accessible for unsubscribe link)
CREATE OR REPLACE FUNCTION public.unsubscribe_contact(
  _identifier TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated BOOLEAN := false;
  _clean_id TEXT := lower(trim(_identifier));
BEGIN
  IF _clean_id LIKE '%@%' THEN
    UPDATE public.profiles
    SET marketing_consent = false
    WHERE lower(email) = _clean_id;
    _updated := FOUND;
  ELSE
    UPDATE public.profiles
    SET marketing_consent = false
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(_clean_id, '[^0-9]', '', 'g');
    _updated := FOUND;
  END IF;

  RETURN _updated;
END;
$$;

-- 4. Address default trigger: ensure only 1 address is default per user
CREATE OR REPLACE FUNCTION public.handle_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true AND NEW.user_id IS NOT NULL THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_default_address ON public.addresses;
CREATE TRIGGER trigger_default_address
  BEFORE INSERT OR UPDATE OF is_default ON public.addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.handle_default_address();
