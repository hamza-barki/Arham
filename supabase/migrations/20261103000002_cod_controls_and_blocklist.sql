-- ==============================================================================
-- Migration: COD Controls, Risk Blocklist, and Store Settings
-- Date: 2026-11-03
-- ==============================================================================

-- 1. Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  free_shipping_threshold NUMERIC NOT NULL DEFAULT 3000,
  shipping_fee NUMERIC NOT NULL DEFAULT 200,
  cod_fee NUMERIC NOT NULL DEFAULT 50,
  allow_open_parcel BOOLEAN NOT NULL DEFAULT false,
  advance_payment_enabled BOOLEAN NOT NULL DEFAULT false,
  advance_payment_threshold NUMERIC NOT NULL DEFAULT 8000,
  advance_payment_amount NUMERIC NOT NULL DEFAULT 500,
  advance_payment_account TEXT DEFAULT 'JazzCash / EasyPaisa / Bank Account: 0300-1234567 (Title: Brand Name)',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed default settings row if not exists
INSERT INTO public.store_settings (id, free_shipping_threshold, shipping_fee, cod_fee, allow_open_parcel)
VALUES ('default', 3000, 200, 50, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Blocked Entities Table (Blacklist for fraudulent phones & addresses)
CREATE TABLE IF NOT EXISTS public.blocked_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('phone', 'address')),
  value TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_blocked_entities_type_value ON public.blocked_entities (type, value);

-- 3. Ensure risk_flags JSONB exists on orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'risk_flags'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN risk_flags JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_entities ENABLE ROW LEVEL SECURITY;

-- Store Settings Policies
CREATE POLICY "Public read store_settings"
  ON public.store_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin update store_settings"
  ON public.store_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
  );

-- Blocked Entities Policies (Staff & Admins only)
CREATE POLICY "Staff manage blocked_entities"
  ON public.blocked_entities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('staff', 'manager', 'admin', 'super_admin')
    )
  );

