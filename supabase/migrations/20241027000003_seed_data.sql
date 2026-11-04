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
