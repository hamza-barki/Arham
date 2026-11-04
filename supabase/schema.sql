-- ==============================================================================
-- COMPLETE SUPABASE SCHEMA & POLICIES FOR [BRAND_NAME] E-COMMERCE
-- Target: Supabase (PostgreSQL 15+)
-- Includes:
--   1. Extensions & updated_at trigger helper
--   2. Core Tables: admins, categories, products, product_variants, product_images,
--      orders, order_items
--   3. Row Level Security (RLS) policies for public and authenticated users
--   4. Pakistan-tailored order numbering sequence (PK-10001+)
--   5. Seed Data for initial Clothes & Bags catalog
-- ==============================================================================

-- Enable UUID extension
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
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 3. Categories Table (Hierarchical support for subcategories)
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

-- ==============================================================================
-- 4. Products Table (PKR pricing, SKU, compare_at_price)
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

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. Product Variants Table
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

-- ==============================================================================
-- 6. Product Images Table (Cloudinary integration)
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

-- ==============================================================================
-- 7. Orders Table (Pakistan COD defaults, order numbering)
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

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
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

DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- ==============================================================================
-- 8. Order Items Table
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

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Security helper function
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

-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Admins table policies
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admins;
CREATE POLICY "Admins can view admin list"
  ON public.admins FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage admin list" ON public.admins;
CREATE POLICY "Admins can manage admin list"
  ON public.admins FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Categories policies
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories"
  ON public.categories FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (public.is_admin());

-- Products policies
DROP POLICY IF EXISTS "Allow public read access to active products" ON public.products;
CREATE POLICY "Allow public read access to active products"
  ON public.products FOR SELECT TO public
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (public.is_admin());

-- Product Variants policies
DROP POLICY IF EXISTS "Allow public read access to product variants" ON public.product_variants;
CREATE POLICY "Allow public read access to product variants"
  ON public.product_variants FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
CREATE POLICY "Admins can insert product variants"
  ON public.product_variants FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;
CREATE POLICY "Admins can update product variants"
  ON public.product_variants FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;
CREATE POLICY "Admins can delete product variants"
  ON public.product_variants FOR DELETE TO authenticated
  USING (public.is_admin());

-- Product Images policies
DROP POLICY IF EXISTS "Allow public read access to product images" ON public.product_images;
CREATE POLICY "Allow public read access to product images"
  ON public.product_images FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
CREATE POLICY "Admins can insert product images"
  ON public.product_images FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
CREATE POLICY "Admins can update product images"
  ON public.product_images FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
CREATE POLICY "Admins can delete product images"
  ON public.product_images FOR DELETE TO authenticated
  USING (public.is_admin());

-- Orders policies
DROP POLICY IF EXISTS "Users can read own orders, admins read all" ON public.orders;
CREATE POLICY "Users can read own orders, admins read all"
  ON public.orders FOR SELECT TO public
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Customers and guests can insert orders" ON public.orders;
CREATE POLICY "Customers and guests can insert orders"
  ON public.orders FOR INSERT TO public
  WITH CHECK (
    (user_id IS NULL) 
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE TO authenticated
  USING (public.is_admin());

-- Order Items policies
DROP POLICY IF EXISTS "Users can view order items for their own orders, admins view all" ON public.order_items;
CREATE POLICY "Users can view order items for their own orders, admins view all"
  ON public.order_items FOR SELECT TO public
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
        AND auth.uid() IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Allow customers and guests to insert order items" ON public.order_items;
CREATE POLICY "Allow customers and guests to insert order items"
  ON public.order_items FOR INSERT TO public
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

DROP POLICY IF EXISTS "Admins can update order items" ON public.order_items;
CREATE POLICY "Admins can update order items"
  ON public.order_items FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete order items" ON public.order_items;
CREATE POLICY "Admins can delete order items"
  ON public.order_items FOR DELETE TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 10. SEED DATA (Categories, Products, Variants, Images)
-- ==============================================================================
INSERT INTO public.categories (id, name, slug, parent_id, description, display_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Clothes', 'clothes', NULL, 'Premium handcrafted Eastern and Western Pakistani apparel, luxury lawn, and casual wear.', 1),
  ('c2000000-0000-0000-0000-000000000001', 'Bags', 'bags', NULL, 'Artisanal leather handbags, structured totes, crossbody bags, and evening clutches.', 2),
  ('c1000000-0000-0000-0000-000000000002', 'Pret & Ready-to-Wear', 'pret-ready-to-wear', 'c1000000-0000-0000-0000-000000000001', 'Stitched kurtas, two-piece sets, and formal ensembles.', 1),
  ('c1000000-0000-0000-0000-000000000003', 'Unstitched Lawn', 'unstitched-lawn', 'c1000000-0000-0000-0000-000000000001', '3-piece embroidered unstitched collections with chiffon and silk dupattas.', 2),
  ('c2000000-0000-0000-0000-000000000002', 'Tote Bags', 'tote-bags', 'c2000000-0000-0000-0000-000000000001', 'Spacious everyday work and shopping totes crafted with genuine leather accents.', 1),
  ('c2000000-0000-0000-0000-000000000003', 'Crossbody Bags', 'crossbody-bags', 'c2000000-0000-0000-0000-000000000001', 'Compact, hands-free crossbody bags with adjustable straps.', 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, sku, name, slug, description, price, compare_at_price, category_id, stock_quantity, is_active)
VALUES
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

INSERT INTO public.product_variants (product_id, size, color, stock_quantity, sku_suffix)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Small', 'Emerald Green', 10, 'S-EMR'),
  ('a1000000-0000-0000-0000-000000000001', 'Medium', 'Emerald Green', 20, 'M-EMR'),
  ('a1000000-0000-0000-0000-000000000001', 'Large', 'Emerald Green', 15, 'L-EMR'),
  ('a1000000-0000-0000-0000-000000000002', 'Small', 'Powder Ivory', 5, 'S-IVR'),
  ('a1000000-0000-0000-0000-000000000002', 'Medium', 'Powder Ivory', 10, 'M-IVR'),
  ('a1000000-0000-0000-0000-000000000002', 'Large', 'Powder Ivory', 5, 'L-IVR'),
  ('a2000000-0000-0000-0000-000000000001', 'Standard', 'Cognac Tan', 20, 'STD-TAN'),
  ('a2000000-0000-0000-0000-000000000001', 'Standard', 'Midnight Black', 10, 'STD-BLK'),
  ('a2000000-0000-0000-0000-000000000002', 'One Size', 'Blush Rose', 15, 'OS-BLS'),
  ('a2000000-0000-0000-0000-000000000002', 'One Size', 'Pearl White', 10, 'OS-WHT')
ON CONFLICT (product_id, sku_suffix) DO NOTHING;

INSERT INTO public.product_images (product_id, cloudinary_url, cloudinary_public_id, position, is_size_chart)
VALUES
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
  (
    'a1000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
    'products/clothes/noor-kashmir-main',
    0,
    false
  ),
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
  (
    'a2000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1000&q=80',
    'products/bags/mini-moon-crossbody-main',
    0,
    false
  )
ON CONFLICT DO NOTHING;
