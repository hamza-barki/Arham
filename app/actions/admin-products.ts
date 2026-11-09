'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requireRole, recordAuditLog } from '@/lib/admin-auth';
import { INITIAL_PRODUCTS, CATEGORIES } from '@/lib/constants';

export interface AdminProductFormInput {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  categoryId: string;
  status: 'active' | 'draft' | 'archived';
  // Private / supplier pricing (Markaz)
  supplierSku?: string | null;
  costPrice: number;
  supplierDeliveryCost: number;
  codFee: number;
  notes?: string | null;
  // Images
  images: Array<{
    id?: string;
    url: string;
    publicId?: string;
    position: number;
    colorTag?: string | null;
    isSizeChart: boolean;
  }>;
  // Variants
  variants: Array<{
    id?: string;
    size?: string | null;
    color?: string | null;
    stockQuantity: number;
    skuSuffix: string;
  }>;
}

// In-memory mock store for products in offline dev
let inMemoryAdminProducts: any[] = INITIAL_PRODUCTS.map((p, idx) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  price: p.price,
  compareAtPrice: p.compare_at_price || null,
  categoryId: p.category_id,
  status: p.is_active ? 'active' : 'draft',
  stockQuantity: p.stock_quantity,
  supplierSku: `MKZ-APP-${100 + idx}`,
  costPrice: Math.round(p.price * 0.6),
  supplierDeliveryCost: 150,
  codFee: 50,
  notes: 'Imported from Markaz Supplier Catalog',
  images: (p.images || []).map((img, i) => ({
    url: typeof img === 'string' ? img : (img as any).url,
    position: i,
    colorTag: i === 0 ? 'Primary' : null,
    isSizeChart: i === (p.images || []).length - 1,
  })),
  variants: (p.variants || []).map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    stockQuantity: v.stock_quantity,
    skuSuffix: v.sku_suffix,
  })),
}));

/**
 * Fetch all products for the admin panel with category and supplier SKU
 */
export async function getAdminProductsAction(filters?: {
  search?: string;
  categoryId?: string;
  status?: string;
  lowStockOnly?: boolean;
}): Promise<{ success: boolean; products: any[]; error?: string }> {
  try {
    await requireRole('staff');

    if (!isSupabaseConfigured()) {
      let list = [...inMemoryAdminProducts];
      if (filters?.search) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q) ||
            (p.supplierSku && p.supplierSku.toLowerCase().includes(q))
        );
      }
      if (filters?.categoryId && filters.categoryId !== 'all') {
        list = list.filter((p) => p.categoryId === filters.categoryId);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((p) => p.status === filters.status);
      }
      if (filters?.lowStockOnly) {
        list = list.filter((p) => p.stockQuantity <= 5);
      }
      return { success: true, products: list };
    }

    const admin = getServiceRoleClient();
    let query = (admin as any).from('products').select(`
      id,
      name,
      slug,
      price,
      compare_at_price,
      stock_quantity,
      status,
      category_id,
      categories(name),
      product_private(supplier_sku, cost_price, supplier_delivery_cost, cod_fee),
      product_images(cloudinary_url, color_tag, is_size_chart, position),
      product_variants(id, size, color, stock_quantity, sku_suffix)
    `);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.categoryId && filters.categoryId !== 'all') {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.search) {
      const q = filters.search.trim();
      query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return { success: false, products: [], error: error.message };

    const mapped = (data || []).map((p: any) => {
      const priv = p.product_private;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
        stockQuantity: p.stock_quantity,
        status: p.status || 'active',
        categoryId: p.category_id,
        categoryName: p.categories?.name || 'General',
        supplierSku: priv?.supplier_sku || null,
        costPrice: priv?.cost_price ? Number(priv.cost_price) : null,
        supplierDeliveryCost: priv?.supplier_delivery_cost ? Number(priv.supplier_delivery_cost) : 0,
        codFee: priv?.cod_fee ? Number(priv.cod_fee) : 0,
        images: (p.product_images || []).sort((a: any, b: any) => a.position - b.position),
        variants: p.product_variants || [],
      };
    });

    return { success: true, products: mapped };
  } catch (err: any) {
    return { success: false, products: [], error: err.message };
  }
}

/**
 * Fetch full product detail for edit form
 */
export async function getAdminProductDetailAction(productId: string): Promise<{
  success: boolean;
  product?: AdminProductFormInput;
  error?: string;
}> {
  try {
    await requireRole('staff');

    if (!isSupabaseConfigured()) {
      const found = inMemoryAdminProducts.find((p) => p.id === productId);
      if (found) return { success: true, product: found };
      return { success: false, error: 'Product not found' };
    }

    const admin = getServiceRoleClient();
    const { data: p, error } = await (admin as any)
      .from('products')
      .select(`
        *,
        product_private(*),
        product_images(*),
        product_variants(*)
      `)
      .eq('id', productId)
      .single();

    if (error || !p) return { success: false, error: error?.message || 'Product not found' };

    const priv = p.product_private;
    const detail: AdminProductFormInput = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      price: Number(p.price),
      compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
      categoryId: p.category_id,
      status: p.status || 'active',
      supplierSku: priv?.supplier_sku || null,
      costPrice: priv?.cost_price ? Number(priv.cost_price) : 0,
      supplierDeliveryCost: priv?.supplier_delivery_cost ? Number(priv.supplier_delivery_cost) : 0,
      codFee: priv?.cod_fee ? Number(priv.cod_fee) : 0,
      notes: priv?.notes || null,
      images: (p.product_images || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((img: any) => ({
          id: img.id,
          url: img.cloudinary_url,
          publicId: img.cloudinary_public_id,
          position: img.position,
          colorTag: img.color_tag,
          isSizeChart: Boolean(img.is_size_chart),
        })),
      variants: (p.product_variants || []).map((v: any) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stockQuantity: v.stock_quantity,
        skuSuffix: v.sku_suffix,
      })),
    };

    return { success: true, product: detail };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Save product (Create or Update) with private cost data, variants, and images
 */
export async function saveProductAction(input: AdminProductFormInput): Promise<{
  success: boolean;
  productId?: string;
  error?: string;
}> {
  try {
    const adminUser = await requireRole('manager');

    // Basic validation
    if (!input.name.trim() || input.price <= 0) {
      return { success: false, error: 'Product name and valid selling price are required.' };
    }

    const slug =
      input.slug.trim() ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Calculate total stock from variants or default
    const totalStock = input.variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);

    if (!isSupabaseConfigured()) {
      const prodId = input.id || 'prod-' + Date.now();
      const newProd = {
        ...input,
        id: prodId,
        slug,
        stockQuantity: totalStock > 0 ? totalStock : 10,
      };

      const existingIdx = inMemoryAdminProducts.findIndex((p) => p.id === prodId);
      if (existingIdx !== -1) {
        inMemoryAdminProducts[existingIdx] = newProd;
      } else {
        inMemoryAdminProducts.unshift(newProd);
      }

      await recordAuditLog({
        action: input.id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
        entity: 'products',
        entityId: prodId,
        diff: { name: input.name, price: input.price, costPrice: input.costPrice },
        actorId: adminUser.userId,
        actorName: adminUser.fullName,
      });

      return { success: true, productId: prodId };
    }

    const admin = getServiceRoleClient();

    // 1. Upsert product
    const productPayload: any = {
      name: input.name.trim(),
      slug,
      description: input.description,
      price: input.price,
      compare_at_price: input.compareAtPrice || null,
      category_id: input.categoryId || CATEGORIES[0].id,
      status: input.status || 'active',
      stock_quantity: totalStock,
      is_active: input.status === 'active',
    };

    let savedProductId = input.id;

    if (savedProductId) {
      const { error: updErr } = await (admin as any)
        .from('products')
        .update(productPayload)
        .eq('id', savedProductId);
      if (updErr) return { success: false, error: updErr.message };
    } else {
      const { data: newProd, error: insErr } = await (admin as any)
        .from('products')
        .insert(productPayload)
        .select('id')
        .single();
      if (insErr) return { success: false, error: insErr.message };
      savedProductId = newProd.id;
    }

    // 2. Upsert product_private (cost price, supplier sku, cod fee)
    await (admin as any).from('product_private').upsert(
      {
        product_id: savedProductId,
        supplier_sku: input.supplierSku || null,
        cost_price: input.costPrice || 0,
        supplier_delivery_cost: input.supplierDeliveryCost || 0,
        cod_fee: input.codFee || 0,
        notes: input.notes || null,
      },
      { onConflict: 'product_id' }
    );

    // 3. Upsert product_images
    if (input.images && input.images.length > 0) {
      // Clear old and insert new
      await (admin as any).from('product_images').delete().eq('product_id', savedProductId);

      const imagesToInsert = input.images.map((img, idx) => ({
        product_id: savedProductId,
        cloudinary_url: img.url,
        cloudinary_public_id: img.publicId || 'manual-url-' + idx,
        position: idx,
        color_tag: img.colorTag || null,
        is_size_chart: Boolean(img.isSizeChart),
      }));

      await (admin as any).from('product_images').insert(imagesToInsert);
    }

    // 4. Upsert product_variants
    if (input.variants && input.variants.length > 0) {
      await (admin as any).from('product_variants').delete().eq('product_id', savedProductId);

      const variantsToInsert = input.variants.map((v, idx) => ({
        product_id: savedProductId,
        size: v.size || null,
        color: v.color || null,
        stock_quantity: Number(v.stockQuantity) || 0,
        sku_suffix: v.skuSuffix || `${input.supplierSku || 'ITEM'}-${idx + 1}`,
      }));

      await (admin as any).from('product_variants').insert(variantsToInsert);
    }

    // Audit log
    await recordAuditLog({
      action: input.id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
      entity: 'products',
      entityId: savedProductId,
      diff: { name: input.name, price: input.price, costPrice: input.costPrice },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true, productId: savedProductId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Batch import products parsed from Markaz Excel / CSV or Media ZIP
 */
export async function batchImportMarkazAction(
  products: Array<{
    name: string;
    supplierSku: string;
    costPrice: number;
    sellingPrice: number;
    categoryId?: string;
    category?: string;
    description?: string;
    sizes?: string;
    colors?: string;
    imageUrl?: string;
    images?: string[];
  }>
): Promise<{
  success: boolean;
  inserted: number;
  errors: string[];
  importedProducts: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    costPrice: number;
    imageUrl?: string;
  }>;
}> {
  try {
    const adminUser = await requireRole('manager');
    let inserted = 0;
    const errors: string[] = [];
    const importedProducts: Array<{
      id: string;
      name: string;
      sku: string;
      price: number;
      costPrice: number;
      imageUrl?: string;
    }> = [];

    for (const item of products) {
      try {
        if (!item.name || !item.sellingPrice) {
          errors.push(`Skipped row: missing name or selling price`);
          continue;
        }

        const variantsList: any[] = [];
        if (item.sizes) {
          const sizesArr = item.sizes.split(/[,/]/).map((s) => s.trim()).filter(Boolean);
          for (const s of sizesArr) {
            variantsList.push({
              size: s,
              color: item.colors || 'Standard',
              stockQuantity: 10,
              skuSuffix: `${item.supplierSku || 'MKZ'}-${s}`,
            });
          }
        } else {
          variantsList.push({
            size: 'Free Size',
            color: item.colors || 'Standard',
            stockQuantity: 10,
            skuSuffix: item.supplierSku || 'MKZ-STD',
          });
        }

        const imagesList =
          item.images && item.images.length > 0
            ? item.images.map((url, i) => ({
                url,
                position: i,
                colorTag: i === 0 ? 'Primary' : null,
                isSizeChart: false,
              }))
            : item.imageUrl
            ? [
                {
                  url: item.imageUrl,
                  position: 0,
                  colorTag: 'Primary',
                  isSizeChart: false,
                },
              ]
            : [];

        // Match category
        let targetCategoryId = item.categoryId;
        if (!targetCategoryId || !CATEGORIES.some((c) => c.id === targetCategoryId)) {
          // Try to match by category name if provided
          if (item.category) {
            const found = CATEGORIES.find(
              (c) => c.name.toLowerCase() === item.category!.toLowerCase()
            );
            if (found) targetCategoryId = found.id;
          }
          if (!targetCategoryId) {
            targetCategoryId = CATEGORIES[0]?.id;
          }
        }

        const res = await saveProductAction({
          name: item.name,
          slug: '',
          description: item.description || `Markaz Wholesale Product [${item.supplierSku || ''}]`,
          price: item.sellingPrice,
          compareAtPrice: Math.round(item.sellingPrice * 1.25),
          categoryId: targetCategoryId,
          status: 'active',
          supplierSku: item.supplierSku,
          costPrice: item.costPrice || Math.round(item.sellingPrice * 0.6),
          supplierDeliveryCost: 150,
          codFee: 50,
          notes: 'Batch imported from Markaz Supplier Catalog',
          images: imagesList,
          variants: variantsList,
        });

        if (res.success && res.productId) {
          inserted++;
          importedProducts.push({
            id: res.productId,
            name: item.name,
            sku: item.supplierSku || '',
            price: item.sellingPrice,
            costPrice: item.costPrice || 0,
            imageUrl: item.imageUrl || (item.images && item.images[0]) || '',
          });
        } else {
          errors.push(`"${item.name}": ${res.error || 'Failed to save'}`);
        }
      } catch (rowErr: any) {
        errors.push(`"${item.name}": ${rowErr.message}`);
      }
    }

    await recordAuditLog({
      action: 'BATCH_IMPORT_MARKAZ',
      entity: 'products',
      diff: { count: inserted, errorsCount: errors.length },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: inserted > 0, inserted, errors, importedProducts };
  } catch (err: any) {
    return { success: false, inserted: 0, errors: [err.message], importedProducts: [] };
  }
}

