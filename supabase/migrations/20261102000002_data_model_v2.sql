-- ==============================================================================
-- MIGRATION: Data Model V2
-- Phase 1: Extended schema with profiles, roles, product_private, areas hierarchy,
--           enriched orders, order_events, support_messages, settings, audit_log
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- ==============================================================================
-- 0. ENUMS
-- ==============================================================================
DO $$ BEGIN
  CREATE TYPE public.order_status_v2 AS ENUM (
    'pending_confirmation',
    'confirmed',
    'ordered_from_supplier',
    'shipped',
    'delivered',
    'returned_rto',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('customer', 'staff', 'manager', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 1. PROFILES  (mirrors auth.users, created via trigger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT,
  phone            TEXT,
  email            TEXT,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  consent_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Trigger: auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 2. USER ROLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.user_role NOT NULL DEFAULT 'customer',
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Helper: check if current user has a given role
CREATE OR REPLACE FUNCTION public.has_role(_role public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  );
$$;

-- Helper: check if current user has staff-level or above
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('staff', 'manager', 'admin', 'super_admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

-- Keep backward compat: is_admin() now delegates to is_staff() for admins only
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

-- ==============================================================================
-- 3. PRODUCT_PRIVATE  (admin-only sensitive data, separate table from products)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_private (
  product_id              UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_sku            TEXT,                      -- Markaz / supplier code
  cost_price              NUMERIC(10, 2),
  supplier_delivery_cost  NUMERIC(10, 2) DEFAULT 0,
  cod_fee                 NUMERIC(10, 2) DEFAULT 0,
  notes                   TEXT,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_product_private_updated_at ON public.product_private;
CREATE TRIGGER set_product_private_updated_at
  BEFORE UPDATE ON public.product_private
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Extend products with public-only extra columns (no cost data here)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'draft', 'archived')),
  ADD COLUMN IF NOT EXISTS tags   TEXT[] DEFAULT '{}';

-- ==============================================================================
-- 4. PRODUCT_IMAGES  – add color_tag column
-- ==============================================================================
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS color_tag TEXT;

-- ==============================================================================
-- 5. GEOGRAPHIC HIERARCHY: provinces → cities → areas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.provinces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  name_ur    TEXT,
  CONSTRAINT uq_province_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.cities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id        UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  name_ur            TEXT,
  courier_city_code  TEXT,           -- e.g. TCS, Leopards code
  CONSTRAINT uq_city_province UNIQUE (province_id, name)
);

CREATE INDEX IF NOT EXISTS idx_cities_province_id ON public.cities(province_id);

CREATE TABLE IF NOT EXISTS public.areas (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id  UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  name_ur  TEXT,
  active   BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT uq_area_city UNIQUE (city_id, name)
);

CREATE INDEX IF NOT EXISTS idx_areas_city_id ON public.areas(city_id);
CREATE INDEX IF NOT EXISTS idx_areas_active  ON public.areas(active);

-- ==============================================================================
-- 6. ADDRESSES  (saved or guest addresses)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,   -- nullable = guest
  full_name    TEXT NOT NULL,
  phone        TEXT NOT NULL,
  province     TEXT NOT NULL,
  city         TEXT NOT NULL,
  area_id      UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  address_line TEXT NOT NULL,
  landmark     TEXT,
  lat          NUMERIC(9, 6),
  lng          NUMERIC(9, 6),
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- ==============================================================================
-- 7. ORDERS  – extend existing table
-- ==============================================================================
-- Drop old narrow status constraint, add new enum column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_v2            public.order_status_v2 NOT NULL DEFAULT 'pending_confirmation',
  ADD COLUMN IF NOT EXISTS addr_province        TEXT,
  ADD COLUMN IF NOT EXISTS addr_city            TEXT,
  ADD COLUMN IF NOT EXISTS addr_area_name       TEXT,
  ADD COLUMN IF NOT EXISTS addr_address_line    TEXT,
  ADD COLUMN IF NOT EXISTS addr_landmark        TEXT,
  ADD COLUMN IF NOT EXISTS addr_lat             NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS addr_lng             NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS supplier_order_ref   TEXT,
  ADD COLUMN IF NOT EXISTS courier              TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number      TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes       TEXT,
  ADD COLUMN IF NOT EXISTS utm_source           TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium           TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign         TEXT,
  ADD COLUMN IF NOT EXISTS risk_flags           JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS confirmation_token   TEXT UNIQUE DEFAULT gen_random_uuid()::text;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id        ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_v2          ON public.orders(status_v2);
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_token ON public.orders(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_orders_tracking           ON public.orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- ==============================================================================
-- 8. ORDER_EVENTS  (audit timeline per order)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     public.order_status_v2,
  note       TEXT,
  actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);

-- ==============================================================================
-- 9. SUPPORT_MESSAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.support_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  message    TEXT NOT NULL,
  status     public.support_status NOT NULL DEFAULT 'open',
  order_ref  TEXT,           -- order_number or tracking reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER set_support_messages_updated_at
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status);

-- ==============================================================================
-- 10. SETTINGS  (key/value store for operational config)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_settings_updated_at ON public.settings;
CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 11. AUDIT_LOG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,         -- 'INSERT' | 'UPDATE' | 'DELETE' | custom
  entity     TEXT NOT NULL,         -- table name
  entity_id  TEXT,
  diff       JSONB,                 -- {old: {...}, new: {...}}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id  ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity    ON public.audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created   ON public.audit_log(created_at DESC);

-- Generic audit trigger function (attach to any table)
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _diff JSONB;
  _entity_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _diff := jsonb_build_object('old', to_jsonb(OLD));
    _entity_id := OLD.id::text;
  ELSIF TG_OP = 'INSERT' THEN
    _diff := jsonb_build_object('new', to_jsonb(NEW));
    _entity_id := NEW.id::text;
  ELSE
    _diff := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    _entity_id := NEW.id::text;
  END IF;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, _entity_id, _diff);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach audit trigger to orders
DROP TRIGGER IF EXISTS audit_orders ON public.orders;
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Attach audit trigger to products
DROP TRIGGER IF EXISTS audit_products ON public.products;
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ==============================================================================
-- 12. ROW LEVEL SECURITY – New Tables
-- ==============================================================================

-- ── profiles ──────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_admin_all"   ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── user_roles ─────────────────────────────────────────────────────────────────
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select_own"   ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── product_private ────────────────────────────────────────────────────────────
ALTER TABLE public.product_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_private_admin_only" ON public.product_private;
CREATE POLICY "product_private_admin_only" ON public.product_private FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NO public/anon read policy – table is invisible to non-admins

-- ── provinces / cities / areas  (public read, admin write) ────────────────────
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provinces_public_read" ON public.provinces;
CREATE POLICY "provinces_public_read" ON public.provinces FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "provinces_admin_write" ON public.provinces;
CREATE POLICY "provinces_admin_write" ON public.provinces FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "cities_public_read" ON public.cities;
CREATE POLICY "cities_public_read" ON public.cities FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "cities_admin_write" ON public.cities;
CREATE POLICY "cities_admin_write" ON public.cities FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "areas_public_read" ON public.areas;
CREATE POLICY "areas_public_read" ON public.areas FOR SELECT TO public USING (active = true OR public.is_staff());

DROP POLICY IF EXISTS "areas_admin_write" ON public.areas;
CREATE POLICY "areas_admin_write" ON public.areas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── addresses ──────────────────────────────────────────────────────────────────
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select_own"   ON public.addresses;
CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "addresses_insert_own"   ON public.addresses;
CREATE POLICY "addresses_insert_own" ON public.addresses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_update_own"   ON public.addresses;
CREATE POLICY "addresses_update_own" ON public.addresses FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_delete_own"   ON public.addresses;
CREATE POLICY "addresses_delete_own" ON public.addresses FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ── order_events ───────────────────────────────────────────────────────────────
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_events_customer_read" ON public.order_events;
CREATE POLICY "order_events_customer_read" ON public.order_events FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_events.order_id
        AND orders.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_events_staff_write" ON public.order_events;
CREATE POLICY "order_events_staff_write" ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

-- ── support_messages ───────────────────────────────────────────────────────────
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_messages_anon_insert" ON public.support_messages;
CREATE POLICY "support_messages_anon_insert" ON public.support_messages FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "support_messages_staff_all"   ON public.support_messages;
CREATE POLICY "support_messages_staff_all" ON public.support_messages FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ── settings ───────────────────────────────────────────────────────────────────
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read"  ON public.settings;
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "settings_admin_write"  ON public.settings;
CREATE POLICY "settings_admin_write" ON public.settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── audit_log ──────────────────────────────────────────────────────────────────
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read" ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_admin());

-- Inserts via SECURITY DEFINER trigger function only; no direct user inserts
-- (No INSERT policy = blocked for all non-superusers)

-- ==============================================================================
-- 13. SEED: Default Settings
-- ==============================================================================
INSERT INTO public.settings (key, value) VALUES
  ('shipping_fee',            '{"amount": 200, "currency": "PKR"}'::jsonb),
  ('free_shipping_threshold', '{"amount": 3000, "currency": "PKR"}'::jsonb),
  ('cod_fee',                 '{"amount": 50, "currency": "PKR"}'::jsonb),
  ('whatsapp_number',         '"923001234567"'::jsonb),
  ('store_name',              '"My Store"'::jsonb),
  ('return_window_days',      '7'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 14. SEED: Pakistan Geography (sample)
-- ==============================================================================
INSERT INTO public.provinces (id, name, name_ur) VALUES
  ('prov0000-0000-0000-0000-000000000001', 'Punjab',               'پنجاب'),
  ('prov0000-0000-0000-0000-000000000002', 'Sindh',                'سندھ'),
  ('prov0000-0000-0000-0000-000000000003', 'Khyber Pakhtunkhwa',   'خیبر پختونخوا'),
  ('prov0000-0000-0000-0000-000000000004', 'Balochistan',          'بلوچستان')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.cities (id, province_id, name, name_ur, courier_city_code) VALUES
  ('city0000-0000-0000-0000-000000000001', 'prov0000-0000-0000-0000-000000000001', 'Lahore',    'لاہور',   'LHE'),
  ('city0000-0000-0000-0000-000000000002', 'prov0000-0000-0000-0000-000000000001', 'Faisalabad','فیصل آباد','FSD'),
  ('city0000-0000-0000-0000-000000000003', 'prov0000-0000-0000-0000-000000000002', 'Karachi',   'کراچی',   'KHI'),
  ('city0000-0000-0000-0000-000000000004', 'prov0000-0000-0000-0000-000000000002', 'Hyderabad', 'حیدرآباد', 'HYD'),
  ('city0000-0000-0000-0000-000000000005', 'prov0000-0000-0000-0000-000000000003', 'Peshawar',  'پشاور',   'PEW'),
  ('city0000-0000-0000-0000-000000000006', 'prov0000-0000-0000-0000-000000000004', 'Quetta',    'کوئٹہ',   'UET')
ON CONFLICT DO NOTHING;

INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('city0000-0000-0000-0000-000000000001', 'DHA Phase 1',   'ڈی ایچ اے فیز 1',  true),
  ('city0000-0000-0000-0000-000000000001', 'Gulberg III',   'گلبرگ 3',           true),
  ('city0000-0000-0000-0000-000000000001', 'Johar Town',    'جوہر ٹاؤن',         true),
  ('city0000-0000-0000-0000-000000000003', 'Clifton',       'کلفٹن',             true),
  ('city0000-0000-0000-0000-000000000003', 'Gulshan-e-Iqbal','گلشن اقبال',       true),
  ('city0000-0000-0000-0000-000000000003', 'PECHS',         'پی ای سی ایچ ایس',  true)
ON CONFLICT DO NOTHING;
