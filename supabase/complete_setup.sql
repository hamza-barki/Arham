-- ==============================================================================
-- ARHAM COLLECTION (AH E-COMMERCE) — COMPLETE SUPABASE DATABASE SETUP
-- Run this entire file in Supabase Dashboard -> SQL Editor
-- ==============================================================================


-- ==============================================================================
-- FILE: 20241027000001_initial_schema.sql
-- ==============================================================================

-- ==============================================================================
-- Migration: 20241027000001_initial_schema.sql
-- Description: Core Schema for Pakistani E-Commerce Platform ([BRAND_NAME])
-- Target Stack: Supabase (PostgreSQL 15+)
-- Categories supported: Clothes, Bags, and extensible hierarchical subcategories
-- ==============================================================================

-- Enable UUID extension (enabled by default on Supabase, but ensured here)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Helper function: auto-update updated_at timestamp
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. Admins Table
-- Links to Supabase auth.users to provide granular role-based access control
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.admins IS 'Stores authorized administrative users linked to Supabase auth';
COMMENT ON COLUMN public.admins.user_id IS 'Foreign key referencing auth.users';

-- ==============================================================================
-- 3. Categories Table
-- Supports hierarchical categories (parent_id) for Clothes -> Eastern / Western,
-- Bags -> Tote / Crossbody / Clutches, and future product lines.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

COMMENT ON TABLE public.categories IS 'Product categories with self-referencing parent_id for subcategories';

-- ==============================================================================
-- 4. Products Table
-- Price stored in PKR (Pakistani Rupee). Supports compare_at_price for discounts.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.products IS 'Core catalog products with PKR pricing';

-- ==============================================================================
-- 5. Product Variants Table
-- Supports Clothes (sizes: XS, S, M, L, XL, unstitched) and Bags (colors/straps)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku_suffix TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_product_variant UNIQUE (product_id, sku_suffix)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

COMMENT ON TABLE public.product_variants IS 'Product variations such as size, color, and specific stock levels';

-- ==============================================================================
-- 6. Product Images Table
-- Stores Cloudinary public ID and delivery URLs. Includes size chart flag.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_size_chart BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON public.product_images(product_id, position);

COMMENT ON TABLE public.product_images IS 'Cloudinary hosted product imagery with gallery ordering and size charts';

-- ==============================================================================
-- 7. Orders Table
-- Tailored for Pakistan e-commerce:
-- - Cash on Delivery (COD) as default payment method
-- - Phone number mandatory for delivery courier confirmation
-- - Major Pakistani cities tracking
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD', 'BankTransfer', 'Card', 'EasyPaisa', 'JazzCash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-generate human-friendly order numbers (e.g., PK-10001)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 10001;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'PK-' || nextval('order_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

COMMENT ON TABLE public.orders IS 'Customer orders with Pakistani address, phone, and COD payment defaults';

-- ==============================================================================
-- 8. Order Items Table
-- Individual products or variants purchased within an order
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID NULL REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

COMMENT ON TABLE public.order_items IS 'Line items for each placed order capturing price snapshot';


-- ==============================================================================
-- FILE: 20241027000002_row_level_security.sql
-- ==============================================================================

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


-- ==============================================================================
-- FILE: 20241027000003_seed_data.sql
-- ==============================================================================

-- ==============================================================================
-- Migration: 20241027000003_seed_data.sql
-- Description: Initial seed data for Clothes and Bags categories, products,
--              variants, and Cloudinary imagery tailored for Pakistan.
-- ==============================================================================

-- 1. Insert Categories: Clothes & Bags (plus subcategories demonstrating architecture)
INSERT INTO public.categories (id, name, slug, parent_id, description, display_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Clothes', 'clothes', NULL, 'Premium handcrafted Eastern and Western Pakistani apparel, luxury lawn, and casual wear.', 1),
  ('c2000000-0000-0000-0000-000000000001', 'Bags', 'bags', NULL, 'Artisanal leather handbags, structured totes, crossbody bags, and evening clutches.', 2),
  -- Subcategories under Clothes
  ('c1000000-0000-0000-0000-000000000002', 'Pret & Ready-to-Wear', 'pret-ready-to-wear', 'c1000000-0000-0000-0000-000000000001', 'Stitched kurtas, two-piece sets, and formal ensembles.', 1),
  ('c1000000-0000-0000-0000-000000000003', 'Unstitched Lawn', 'unstitched-lawn', 'c1000000-0000-0000-0000-000000000001', '3-piece embroidered unstitched collections with chiffon and silk dupattas.', 2),
  -- Subcategories under Bags
  ('c2000000-0000-0000-0000-000000000002', 'Tote Bags', 'tote-bags', 'c2000000-0000-0000-0000-000000000001', 'Spacious everyday work and shopping totes crafted with genuine leather accents.', 1),
  ('c2000000-0000-0000-0000-000000000003', 'Crossbody Bags', 'crossbody-bags', 'c2000000-0000-0000-0000-000000000001', 'Compact, hands-free crossbody bags with adjustable straps.', 2)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Products for Clothes & Bags
INSERT INTO public.products (id, sku, name, slug, description, price, compare_at_price, category_id, stock_quantity, is_active)
VALUES
  -- Product 1: Clothes - Embroidered Lawn Kurta
  (
    'a1000000-0000-0000-0000-000000000001',
    'CLT-KRT-001',
    'Royal Emerald Embroidered Kurta',
    'royal-emerald-embroidered-kurta',
    'Exquisite pure cotton jacquard kurta featuring intricate zari and resham neckline embroidery. Perfect for festive and semi-formal gatherings across Pakistan.',
    4850.00,
    5990.00,
    'c1000000-0000-0000-0000-000000000001',
    45,
    true
  ),
  -- Product 2: Clothes - 3-Piece Festive Set
  (
    'a1000000-0000-0000-0000-000000000002',
    'CLT-ST3-002',
    'Noor-e-Kashmir 3-Piece Luxury Ensemble',
    'noor-e-kashmir-3-piece-luxury-ensemble',
    'Hand-crafted raw silk stitched suit with organza dupatta and embroidered straight trousers. Finished with delicate pearl border detailing.',
    12500.00,
    14900.00,
    'c1000000-0000-0000-0000-000000000001',
    20,
    true
  ),
  -- Product 3: Bags - Italian Leather Tote
  (
    'a2000000-0000-0000-0000-000000000001',
    'BAG-TOT-001',
    'Signature Cognac Leather Everyday Tote',
    'signature-cognac-leather-everyday-tote',
    'Handcrafted premium full-grain leather tote designed for modern Pakistani professionals. Fits up to a 15-inch laptop, makeup pouch, and daily essentials.',
    8950.00,
    10500.00,
    'c2000000-0000-0000-0000-000000000001',
    30,
    true
  ),
  -- Product 4: Bags - Structured Crossbody Bag
  (
    'a2000000-0000-0000-0000-000000000002',
    'BAG-CRB-002',
    'Mini Moon Quilted Crossbody',
    'mini-moon-quilted-crossbody',
    'Chic quilted design with gold hardware accents and detachable strap. The go-to accessory for dinner parties and weekend brunches.',
    5200.00,
    6400.00,
    'c2000000-0000-0000-0000-000000000001',
    25,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Product Variants (Sizes & Colors)
INSERT INTO public.product_variants (product_id, size, color, stock_quantity, sku_suffix)
VALUES
  -- Variants for Royal Emerald Kurta
  ('a1000000-0000-0000-0000-000000000001', 'Small', 'Emerald Green', 10, 'S-EMR'),
  ('a1000000-0000-0000-0000-000000000001', 'Medium', 'Emerald Green', 20, 'M-EMR'),
  ('a1000000-0000-0000-0000-000000000001', 'Large', 'Emerald Green', 15, 'L-EMR'),
  
  -- Variants for Noor-e-Kashmir 3-Piece
  ('a1000000-0000-0000-0000-000000000002', 'Small', 'Powder Ivory', 5, 'S-IVR'),
  ('a1000000-0000-0000-0000-000000000002', 'Medium', 'Powder Ivory', 10, 'M-IVR'),
  ('a1000000-0000-0000-0000-000000000002', 'Large', 'Powder Ivory', 5, 'L-IVR'),
  
  -- Variants for Signature Leather Tote
  ('a2000000-0000-0000-0000-000000000001', 'Standard', 'Cognac Tan', 20, 'STD-TAN'),
  ('a2000000-0000-0000-0000-000000000001', 'Standard', 'Midnight Black', 10, 'STD-BLK'),
  
  -- Variants for Mini Moon Crossbody
  ('a2000000-0000-0000-0000-000000000002', 'One Size', 'Blush Rose', 15, 'OS-BLS'),
  ('a2000000-0000-0000-0000-000000000002', 'One Size', 'Pearl White', 10, 'OS-WHT')
ON CONFLICT (product_id, sku_suffix) DO NOTHING;

-- 4. Insert Product Images (Cloudinary URLs & Public IDs)
INSERT INTO public.product_images (product_id, cloudinary_url, cloudinary_public_id, position, is_size_chart)
VALUES
  -- Kurta Images
  (
    'a1000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
    'products/clothes/kurta-emerald-main',
    0,
    false
  ),
  (
    'a1000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
    'products/clothes/kurta-emerald-detail',
    1,
    false
  ),
  -- 3-Piece Suit Images
  (
    'a1000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
    'products/clothes/noor-kashmir-main',
    0,
    false
  ),
  -- Tote Bag Images
  (
    'a2000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80',
    'products/bags/leather-tote-tan-main',
    0,
    false
  ),
  (
    'a2000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80',
    'products/bags/leather-tote-detail',
    1,
    false
  ),
  -- Crossbody Images
  (
    'a2000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1000&q=80',
    'products/bags/mini-moon-crossbody-main',
    0,
    false
  )
ON CONFLICT DO NOTHING;


-- ==============================================================================
-- FILE: 20261102000002_data_model_v2.sql
-- ==============================================================================

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
  ('bb000000-0000-0000-0000-000000000001', 'Punjab',               'پنجاب'),
  ('bb000000-0000-0000-0000-000000000002', 'Sindh',                'سندھ'),
  ('bb000000-0000-0000-0000-000000000003', 'Khyber Pakhtunkhwa',   'خیبر پختونخوا'),
  ('bb000000-0000-0000-0000-000000000004', 'Balochistan',          'بلوچستان')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.cities (id, province_id, name, name_ur, courier_city_code) VALUES
  ('cc000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', 'Lahore',    'لاہور',   'LHE'),
  ('cc000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000001', 'Faisalabad','فیصل آباد','FSD'),
  ('cc000000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000002', 'Karachi',   'کراچی',   'KHI'),
  ('cc000000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000002', 'Hyderabad', 'حیدرآباد', 'HYD'),
  ('cc000000-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000003', 'Peshawar',  'پشاور',   'PEW'),
  ('cc000000-0000-0000-0000-000000000006', 'bb000000-0000-0000-0000-000000000004', 'Quetta',    'کوئٹہ',   'UET')
ON CONFLICT DO NOTHING;

INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000001', 'DHA Phase 1',   'ڈی ایچ اے فیز 1',  true),
  ('cc000000-0000-0000-0000-000000000001', 'Gulberg III',   'گلبرگ 3',           true),
  ('cc000000-0000-0000-0000-000000000001', 'Johar Town',    'جوہر ٹاؤن',         true),
  ('cc000000-0000-0000-0000-000000000003', 'Clifton',       'کلفٹن',             true),
  ('cc000000-0000-0000-0000-000000000003', 'Gulshan-e-Iqbal','گلشن اقبال',       true),
  ('cc000000-0000-0000-0000-000000000003', 'PECHS',         'پی ای سی ایچ ایس',  true)
ON CONFLICT DO NOTHING;


-- ==============================================================================
-- FILE: 20261102000003_customer_accounts.sql
-- ==============================================================================

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


-- ==============================================================================
-- FILE: 20261102000004_areas_expansion.sql
-- ==============================================================================

-- ==============================================================================
-- PHASE 4: PAKISTAN GEOGRAPHIC HIERARCHY EXPANSION & AREAS SEED
-- Migration: 20261102000004_areas_expansion.sql
-- ==============================================================================

-- 1. Ensure columns exist on orders and addresses
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS requires_area_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_custom_area       BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS is_custom_area       BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_area_review ON public.orders(requires_area_review) WHERE requires_area_review = true;

-- 2. Seed All 7 Administrative Territories / Provinces of Pakistan
INSERT INTO public.provinces (id, name, name_ur) VALUES
  ('bb000000-0000-0000-0000-000000000001', 'Punjab',                         'پنجاب'),
  ('bb000000-0000-0000-0000-000000000002', 'Sindh',                          'سندھ'),
  ('bb000000-0000-0000-0000-000000000003', 'Khyber Pakhtunkhwa',             'خیبر پختونخوا'),
  ('bb000000-0000-0000-0000-000000000004', 'Balochistan',                    'بلوچستان'),
  ('bb000000-0000-0000-0000-000000000005', 'Islamabad Capital Territory',    'وفاقی دارالحکومت اسلام آباد'),
  ('bb000000-0000-0000-0000-000000000006', 'Azad Jammu and Kashmir',         'آزاد جموں و کشمیر'),
  ('bb000000-0000-0000-0000-000000000007', 'Gilgit-Baltistan',               'گلگت بلتستان')
ON CONFLICT (name) DO UPDATE SET name_ur = EXCLUDED.name_ur;

-- 3. Seed Major Cities with Official Courier Codes (PostEx, Leopards, TCS compatible)
INSERT INTO public.cities (id, province_id, name, name_ur, courier_city_code) VALUES
  -- Punjab
  ('cc000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', 'Lahore',       'لاہور',         'LHE'),
  ('cc000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000001', 'Faisalabad',   'فیصل آباد',     'FSD'),
  ('cc000000-0000-0000-0000-000000000007', 'bb000000-0000-0000-0000-000000000001', 'Rawalpindi',   'راولپنڈی',       'RWP'),
  ('cc000000-0000-0000-0000-000000000008', 'bb000000-0000-0000-0000-000000000001', 'Multan',       'ملتان',         'MUX'),
  ('cc000000-0000-0000-0000-000000000009', 'bb000000-0000-0000-0000-000000000001', 'Gujranwala',   'گوجرانوالہ',     'GWD'),
  ('cc000000-0000-0000-0000-000000000010', 'bb000000-0000-0000-0000-000000000001', 'Sialkot',      'سیالکوٹ',       'SKT'),
  ('cc000000-0000-0000-0000-000000000011', 'bb000000-0000-0000-0000-000000000001', 'Bahawalpur',   'بہاولپور',       'BHV'),
  ('cc000000-0000-0000-0000-000000000012', 'bb000000-0000-0000-0000-000000000001', 'Sargodha',     'سرگودھا',       'SGD'),
  ('cc000000-0000-0000-0000-000000000013', 'bb000000-0000-0000-0000-000000000001', 'Gujrat',       'گجرات',         'GRT'),
  ('cc000000-0000-0000-0000-000000000014', 'bb000000-0000-0000-0000-000000000001', 'Sahiwal',      'ساہیوال',       'SWL'),
  ('cc000000-0000-0000-0000-000000000015', 'bb000000-0000-0000-0000-000000000001', 'Sheikhupura',  'شیخوپورہ',      'SKP'),
  ('cc000000-0000-0000-0000-000000000016', 'bb000000-0000-0000-0000-000000000001', 'Jhelum',       'جہلم',          'JHM'),
  ('cc000000-0000-0000-0000-000000000017', 'bb000000-0000-0000-0000-000000000001', 'Rahim Yar Khan','رحیم یار خان',   'RYK'),

  -- Sindh
  ('cc000000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000002', 'Karachi',      'کراچی',         'KHI'),
  ('cc000000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000002', 'Hyderabad',    'حیدرآباد',       'HYD'),
  ('cc000000-0000-0000-0000-000000000018', 'bb000000-0000-0000-0000-000000000002', 'Sukkur',       'سکھر',          'SKR'),
  ('cc000000-0000-0000-0000-000000000019', 'bb000000-0000-0000-0000-000000000002', 'Larkana',      'لاڑکانہ',        'LRK'),
  ('cc000000-0000-0000-0000-000000000020', 'bb000000-0000-0000-0000-000000000002', 'Nawabshah',    'نواب شاہ',       'WNS'),

  -- Khyber Pakhtunkhwa
  ('cc000000-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000003', 'Peshawar',     'پشاور',         'PEW'),
  ('cc000000-0000-0000-0000-000000000021', 'bb000000-0000-0000-0000-000000000003', 'Abbottabad',   'ایبٹ آباد',     'AAT'),
  ('cc000000-0000-0000-0000-000000000022', 'bb000000-0000-0000-0000-000000000003', 'Mardan',       'مردان',         'MDN'),
  ('cc000000-0000-0000-0000-000000000023', 'bb000000-0000-0000-0000-000000000003', 'Swat',         'سوات',          'SWT'),

  -- Balochistan
  ('cc000000-0000-0000-0000-000000000006', 'bb000000-0000-0000-0000-000000000004', 'Quetta',       'کوئٹہ',         'UET'),
  ('cc000000-0000-0000-0000-000000000024', 'bb000000-0000-0000-0000-000000000004', 'Gwadar',       'گوادر',         'GWD'),

  -- Islamabad Capital Territory
  ('cc000000-0000-0000-0000-000000000025', 'bb000000-0000-0000-0000-000000000005', 'Islamabad',    'اسلام آباد',     'ISB'),

  -- Azad Jammu and Kashmir
  ('cc000000-0000-0000-0000-000000000026', 'bb000000-0000-0000-0000-000000000006', 'Mirpur',       'میرپور',        'MIR'),
  ('cc000000-0000-0000-0000-000000000027', 'bb000000-0000-0000-0000-000000000006', 'Muzaffarabad', 'مظفر آباد',     'MZD'),

  -- Gilgit-Baltistan
  ('cc000000-0000-0000-0000-000000000028', 'bb000000-0000-0000-0000-000000000007', 'Gilgit',       'گلگت',          'GLT')
ON CONFLICT (province_id, name) DO UPDATE SET
  courier_city_code = EXCLUDED.courier_city_code,
  name_ur = EXCLUDED.name_ur;

-- 4. Seed Well-Known Areas for Major Cities with English & Urdu Names
-- Lahore Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000001', 'Gulberg II & III',       'گلبرگ 2 اور 3',          true),
  ('cc000000-0000-0000-0000-000000000001', 'DHA Phase 1-4',          'ڈی ایچ اے فیز 1 تا 4',    true),
  ('cc000000-0000-0000-0000-000000000001', 'DHA Phase 5-8',          'ڈی ایچ اے فیز 5 تا 8',    true),
  ('cc000000-0000-0000-0000-000000000001', 'DHA Phase 9 Prism',      'ڈی ایچ اے فیز 9 پرزم',    true),
  ('cc000000-0000-0000-0000-000000000001', 'Johar Town (Phase 1 & 2)','جوہر ٹاؤن فیز 1 و 2',    true),
  ('cc000000-0000-0000-0000-000000000001', 'Model Town',              'ماڈل ٹاؤن',              true),
  ('cc000000-0000-0000-0000-000000000001', 'Bahria Town',            'بحریہ ٹاؤن',             true),
  ('cc000000-0000-0000-0000-000000000001', 'Lahore Cantt',           'لاہور کینٹ',             true),
  ('cc000000-0000-0000-0000-000000000001', 'Faisal Town',            'فیصل ٹاؤن',              true),
  ('cc000000-0000-0000-0000-000000000001', 'Garden Town',            'گارڈن ٹاؤن',             true),
  ('cc000000-0000-0000-0000-000000000001', 'Wapda Town',             'واپڈا ٹاؤن',             true),
  ('cc000000-0000-0000-0000-000000000001', 'Allama Iqbal Town',      'علامہ اقبال ٹاؤن',       true),
  ('cc000000-0000-0000-0000-000000000001', 'Askari 10 & 11',         'عسکری 10 اور 11',        true),
  ('cc000000-0000-0000-0000-000000000001', 'Cavalry Ground',         'کیولری گراؤنڈ',          true),
  ('cc000000-0000-0000-0000-000000000001', 'Valencia Town',          'ویلنشیا ٹاؤن',           true),
  ('cc000000-0000-0000-0000-000000000001', 'Lake City',              'لیک سٹی',                true),
  ('cc000000-0000-0000-0000-000000000001', 'Shadman',                'شادمان',                 true),
  ('cc000000-0000-0000-0000-000000000001', 'Samanabad',              'سمن آباد',               true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Karachi Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000003', 'Clifton (Blocks 1-9)',   'کلفٹن بلاک 1 تا 9',      true),
  ('cc000000-0000-0000-0000-000000000003', 'DHA Defence (Phase 1-8)','ڈی ایچ اے ڈیفنس فیز 1-8',true),
  ('cc000000-0000-0000-0000-000000000003', 'Gulshan-e-Iqbal',        'گلشن اقبال',             true),
  ('cc000000-0000-0000-0000-000000000003', 'Gulistan-e-Johar',       'گلستان جوہر',            true),
  ('cc000000-0000-0000-0000-000000000003', 'PECHS (Blocks 1-6)',     'پی ای سی ایچ ایس',       true),
  ('cc000000-0000-0000-0000-000000000003', 'North Nazimabad',        'نارتھ ناظم آباد',        true),
  ('cc000000-0000-0000-0000-000000000003', 'Nazimabad',              'ناظم آباد',              true),
  ('cc000000-0000-0000-0000-000000000003', 'Federal B Area (FB Area)','فیڈرل بی ایریا',         true),
  ('cc000000-0000-0000-0000-000000000003', 'Saddar & Tariq Road',    'صدر و طارق روڈ',         true),
  ('cc000000-0000-0000-0000-000000000003', 'Malir Cantt',            'ملیر کینٹ',              true),
  ('cc000000-0000-0000-0000-000000000003', 'Bahria Town Karachi',    'بحریہ ٹاؤن کراچی',       true),
  ('cc000000-0000-0000-0000-000000000003', 'Korangi Industrial Area','کورنگی انڈسٹریل ایریا',  true),
  ('cc000000-0000-0000-0000-000000000003', 'Scheme 33',              'اسکیم 33',               true),
  ('cc000000-0000-0000-0000-000000000003', 'Dhoraji Colony',         'دھوراجی کالونی',         true),
  ('cc000000-0000-0000-0000-000000000003', 'Jamshed Road',           'جمشید روڈ',              true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Islamabad Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000025', 'Sector F-6 & F-7',       'سیکٹر ایف 6 اور ایف 7',  true),
  ('cc000000-0000-0000-0000-000000000025', 'Sector F-8 & F-10',      'سیکٹر ایف 8 اور ایف 10', true),
  ('cc000000-0000-0000-0000-000000000025', 'Sector F-11 & E-11',     'سیکٹر ایف 11 اور ای 11', true),
  ('cc000000-0000-0000-0000-000000000025', 'Sector G-6, G-7, G-8',   'سیکٹر جی 6، 7، 8',       true),
  ('cc000000-0000-0000-0000-000000000025', 'Sector G-9, G-10, G-11', 'سیکٹر جی 9، 10، 11',     true),
  ('cc000000-0000-0000-0000-000000000025', 'Sector I-8 & I-9',       'سیکٹر آئی 8 اور آئی 9',  true),
  ('cc000000-0000-0000-0000-000000000025', 'DHA Phase 1 & 2',        'ڈی ایچ اے فیز 1 و 2',    true),
  ('cc000000-0000-0000-0000-000000000025', 'Bahria Enclave',         'بحریہ انکلیو',           true),
  ('cc000000-0000-0000-0000-000000000025', 'Bani Gala',              'بنی گالہ',               true),
  ('cc000000-0000-0000-0000-000000000025', 'PWD Housing Society',    'پی ڈبلیو ڈی ہاؤسنگ سوسائٹی',true),
  ('cc000000-0000-0000-0000-000000000025', 'Soan Gardens',           'سواں گارڈنز',            true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Rawalpindi Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000007', 'Bahria Town (Phase 1-8)','بحریہ ٹاؤن فیز 1 تا 8',  true),
  ('cc000000-0000-0000-0000-000000000007', 'Saddar Cantt',           'صدر کینٹ',               true),
  ('cc000000-0000-0000-0000-000000000007', 'Satellite Town',         'سیٹلائٹ ٹاؤن',           true),
  ('cc000000-0000-0000-0000-000000000007', 'Chaklala Scheme 3',      'چکلالہ اسکیم 3',         true),
  ('cc000000-0000-0000-0000-000000000007', 'Westridge',              'ویسٹریج',                true),
  ('cc000000-0000-0000-0000-000000000007', 'Askari 14',              'عسکری 14',               true),
  ('cc000000-0000-0000-0000-000000000007', 'Gulraiz Housing Scheme', 'گلریز ہاؤسنگ اسکیم',     true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Faisalabad Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000002', 'Madina Town',            'مدینہ ٹاؤن',             true),
  ('cc000000-0000-0000-0000-000000000002', 'Peoples Colony No 1 & 2','پیپلز کالونی نمبر 1 و 2',true),
  ('cc000000-0000-0000-0000-000000000002', 'D Ground',               'ڈی گراؤنڈ',              true),
  ('cc000000-0000-0000-0000-000000000002', 'Samanabad',              'سمن آباد فیصل آباد',      true),
  ('cc000000-0000-0000-0000-000000000002', 'Ghulam Muhammad Abad',   'غلام محمد آباد',         true),
  ('cc000000-0000-0000-0000-000000000002', 'Kohinoor City',          'کوہ نور سٹی',            true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Multan Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000008', 'Gulgasht Colony',        'گلگشت کالونی',           true),
  ('cc000000-0000-0000-0000-000000000008', 'Multan Cantt',           'ملتان کینٹ',             true),
  ('cc000000-0000-0000-0000-000000000008', 'Bosan Road',             'بوسن روڈ',               true),
  ('cc000000-0000-0000-0000-000000000008', 'Shah Rukn-e-Alam Colony','شاہ رکن عالم کالونی',    true),
  ('cc000000-0000-0000-0000-000000000008', 'DHA Multan',             'ڈی ایچ اے ملتان',        true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Peshawar Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000005', 'Hayatabad (Phases 1-7)', 'حیات آباد فیز 1 تا 7',   true),
  ('cc000000-0000-0000-0000-000000000005', 'University Town',        'یونیورسٹی ٹاؤن',         true),
  ('cc000000-0000-0000-0000-000000000005', 'Peshawar Cantt',         'پشاور کینٹ',             true),
  ('cc000000-0000-0000-0000-000000000005', 'Gulbahar',               'گل بہار',                true),
  ('cc000000-0000-0000-0000-000000000005', 'DHA Peshawar',           'ڈی ایچ اے پشاور',        true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Quetta Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000006', 'Quetta Cantt',           'کوئٹہ کینٹ',             true),
  ('cc000000-0000-0000-0000-000000000006', 'Jinnah Town',            'جناح ٹاؤن',              true),
  ('cc000000-0000-0000-0000-000000000006', 'Shahbaz Town',           'شہباز ٹاؤن',             true),
  ('cc000000-0000-0000-0000-000000000006', 'Samungli Road',          'سمونگلی روڈ',            true),
  ('cc000000-0000-0000-0000-000000000006', 'Zarghoon Road',          'زرغون روڈ',              true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Gujranwala Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000009', 'DC Colony',              'ڈی سی کالونی',           true),
  ('cc000000-0000-0000-0000-000000000009', 'Model Town Gujranwala',  'ماڈل ٹاؤن گوجرانوالہ',   true),
  ('cc000000-0000-0000-0000-000000000009', 'Master City',            'ماسٹر سٹی',              true),
  ('cc000000-0000-0000-0000-000000000009', 'Wapda Town Gujranwala',  'واپڈا ٹاؤن گوجرانوالہ',   true),
  ('cc000000-0000-0000-0000-000000000009', 'Satellite Town',         'سیٹلائٹ ٹاؤن گوجرانوالہ',true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Sialkot Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000010', 'Sialkot Cantt',          'سیالکوٹ کینٹ',           true),
  ('cc000000-0000-0000-0000-000000000010', 'Model Town Sialkot',     'ماڈل ٹاؤن سیالکوٹ',      true),
  ('cc000000-0000-0000-0000-000000000010', 'Paris Road',             'پیرس روڈ',               true),
  ('cc000000-0000-0000-0000-000000000010', 'Kashmir Road',           'کشمیر روڈ',              true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;

-- Hyderabad Areas
INSERT INTO public.areas (city_id, name, name_ur, active) VALUES
  ('cc000000-0000-0000-0000-000000000004', 'Latifabad (Units 1-12)', 'لطیف آباد یونٹس 1 تا 12', true),
  ('cc000000-0000-0000-0000-000000000004', 'Qasimabad',              'قاسم آباد',              true),
  ('cc000000-0000-0000-0000-000000000004', 'Hyderabad Cantt',        'حیدرآباد کینٹ',          true),
  ('cc000000-0000-0000-0000-000000000004', 'Autobhan Road',          'آٹوبھان روڈ',            true)
ON CONFLICT (city_id, name) DO UPDATE SET name_ur = EXCLUDED.name_ur, active = EXCLUDED.active;


-- ==============================================================================
-- FILE: 20261103000001_support_messages.sql
-- ==============================================================================

-- ==============================================================================
-- Migration: Customer Support Messages & Concierge Inquiries
-- Date: 2026-11-03
-- Description: Stores /contact submissions with honeypot, status, and staff reply.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  order_ref TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed')),
  staff_reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast status and query lookups
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages (status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_order_ref ON public.support_messages (order_ref) WHERE order_ref IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 1. Anonymous / Public users can INSERT contact messages (honeypot + rate limits verified in Server Action)
CREATE POLICY "Public insert support_messages"
  ON public.support_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. Staff, Managers, and Admins can view and update support messages
CREATE POLICY "Staff view support_messages"
  ON public.support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('staff', 'manager', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Staff update support_messages"
  ON public.support_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('staff', 'manager', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('staff', 'manager', 'admin', 'super_admin')
    )
  );



-- ==============================================================================
-- FILE: 20261103000002_cod_controls_and_blocklist.sql
-- ==============================================================================

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


