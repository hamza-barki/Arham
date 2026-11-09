'use server';

import { revalidatePath } from 'next/cache';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requireRole, recordAuditLog } from '@/lib/admin-auth';
import { INITIAL_PRODUCTS, CATEGORIES } from '@/lib/constants';
import { uploadProductImage, isCloudinaryConfigured } from '@/lib/cloudinary';

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

    // Build a unique SKU for the products table (TEXT UNIQUE NOT NULL)
    // Format: MKZ-<supplierSku> or slug-based fallback, timestamp-suffixed for uniqueness
    const productSku =
      input.supplierSku && input.supplierSku.trim()
        ? `MKZ-${input.supplierSku.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '-').slice(0, 40)}`
        : `${slug.toUpperCase().replace(/[^A-Z0-9\-]/g, '-').slice(0, 40)}-${Date.now()}`;

    // 1. Upsert product
    const productPayload: any = {
      name: input.name.trim(),
      slug,
      sku: productSku,
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
      // For updates, don't overwrite sku (it's unique and set at creation)
      const { sku: _sku, ...updatePayload } = productPayload;
      const { error: updErr } = await (admin as any)
        .from('products')
        .update(updatePayload)
        .eq('id', savedProductId);
      if (updErr) return { success: false, error: updErr.message };
    } else {
      // For new products: attempt insert; if SKU collision (UNIQUE), suffix with timestamp
      let insErr: any = null;
      let newProd: any = null;

      const firstAttempt = await (admin as any)
        .from('products')
        .insert(productPayload)
        .select('id')
        .single();

      insErr = firstAttempt.error;
      newProd = firstAttempt.data;

      // If SKU uniqueness violation, retry with timestamp suffix
      if (insErr && (insErr.code === '23505' || insErr.message?.includes('sku'))) {
        const retryPayload = {
          ...productPayload,
          sku: `${productPayload.sku}-${Date.now()}`,
          slug: `${slug}-${Date.now()}`,
        };
        const secondAttempt = await (admin as any)
          .from('products')
          .insert(retryPayload)
          .select('id')
          .single();
        insErr = secondAttempt.error;
        newProd = secondAttempt.data;
      }

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
 * Batch import products parsed from Markaz Excel / CSV or Media ZIP.
 * Handles Cloudinary upload of base64 images server-side so the client
 * never needs to send large payloads through Server Action body limits.
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
    // These may be base64 data URLs from ZIP extraction
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

    const cloudinaryEnabled = isCloudinaryConfigured();

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

        // ---------------------------------------------------------------
        // Upload images to Cloudinary (server-side, handles base64 URLs)
        // Falls back to storing the URL as-is if Cloudinary not configured
        // ---------------------------------------------------------------
        const rawImages = (item.images && item.images.length > 0)
          ? item.images
          : item.imageUrl
          ? [item.imageUrl]
          : [];

        const imagesList: Array<{
          url: string;
          publicId?: string;
          position: number;
          colorTag: string | null;
          isSizeChart: boolean;
        }> = [];

        let primaryImageUrl: string | undefined;

        for (let i = 0; i < rawImages.length; i++) {
          const rawUrl = rawImages[i];
          if (!rawUrl) continue;

          let finalUrl = rawUrl;
          let publicId: string | undefined;

          // Upload base64 or remote image to Cloudinary if available
          if (cloudinaryEnabled) {
            try {
              const skuSlug = (item.supplierSku || 'mkz')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-');
              const uploadResult = await uploadProductImage(
                rawUrl,
                `ecommerce/products/markaz/${skuSlug}`,
                { public_id: `${skuSlug}-${i + 1}-${Date.now()}` }
              );
              finalUrl = uploadResult.secureUrl;
              publicId = uploadResult.publicId;
            } catch (uploadErr: any) {
              // Upload failed — keep original URL (base64 or remote)
              console.warn(`[Markaz Import] Cloudinary upload failed for image ${i}: ${uploadErr.message}`);
            }
          }

          if (i === 0) primaryImageUrl = finalUrl;

          imagesList.push({
            url: finalUrl,
            publicId,
            position: i,
            colorTag: i === 0 ? 'Primary' : null,
            isSizeChart: false,
          });
        }

        // Match category
        let targetCategoryId = item.categoryId;
        if (!targetCategoryId || !CATEGORIES.some((c) => c.id === targetCategoryId)) {
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
            imageUrl: primaryImageUrl,
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

/**
 * Delete a product. If it has existing orders, safely archive it
 * instead to preserve database foreign key integrity and order history.
 */
export async function deleteProductAction(productId: string): Promise<{
  success: boolean;
  archivedInstead?: boolean;
  error?: string;
}> {
  try {
    const adminUser = await requireRole('manager');

    if (!isSupabaseConfigured()) {
      inMemoryAdminProducts = inMemoryAdminProducts.filter((p) => p.id !== productId);
      revalidatePath('/admin/products');
      revalidatePath('/');
      return { success: true };
    }

    const admin = getServiceRoleClient();

    // Check if product exists in order_items
    const { data: orderItemRows } = await (admin as any)
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (orderItemRows && orderItemRows.length > 0) {
      // Cannot hard delete without violating FK; safely archive it
      await (admin as any)
        .from('products')
        .update({ status: 'archived', is_active: false })
        .eq('id', productId);

      await recordAuditLog({
        action: 'ARCHIVE_PRODUCT',
        entity: 'products',
        entityId: productId,
        diff: { reason: 'Has associated customer orders; archived to protect history' },
        actorId: adminUser.userId,
        actorName: adminUser.fullName,
      });

      revalidatePath('/admin/products');
      revalidatePath('/');
      revalidatePath('/category/[slug]', 'page');
      return { success: true, archivedInstead: true };
    }

    // Safe to hard delete: delete child rows first
    await (admin as any).from('product_images').delete().eq('product_id', productId);
    await (admin as any).from('product_variants').delete().eq('product_id', productId);
    await (admin as any).from('product_private').delete().eq('product_id', productId);

    const { error: delErr } = await (admin as any)
      .from('products')
      .delete()
      .eq('id', productId);

    if (delErr) {
      // Fallback archive if any other constraint triggered
      await (admin as any)
        .from('products')
        .update({ status: 'archived', is_active: false })
        .eq('id', productId);

      return { success: true, archivedInstead: true };
    }

    await recordAuditLog({
      action: 'DELETE_PRODUCT',
      entity: 'products',
      entityId: productId,
      diff: { deleted: true },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath('/category/[slug]', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Quick 1-click status toggle (active <-> draft or specific status)
 */
export async function toggleProductStatusAction(
  productId: string,
  newStatus?: 'active' | 'draft' | 'archived'
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const adminUser = await requireRole('manager');

    if (!isSupabaseConfigured()) {
      const p = inMemoryAdminProducts.find((x) => x.id === productId);
      if (p) {
        p.status = newStatus || (p.status === 'active' ? 'draft' : 'active');
        revalidatePath('/admin/products');
        return { success: true, status: p.status };
      }
      return { success: false, error: 'Product not found' };
    }

    const admin = getServiceRoleClient();

    let targetStatus = newStatus;
    if (!targetStatus) {
      const { data: cur } = await (admin as any)
        .from('products')
        .select('status')
        .eq('id', productId)
        .single();
      targetStatus = cur?.status === 'active' ? 'draft' : 'active';
    }

    const { error } = await (admin as any)
      .from('products')
      .update({
        status: targetStatus,
        is_active: targetStatus === 'active',
      })
      .eq('id', productId);

    if (error) return { success: false, error: error.message };

    await recordAuditLog({
      action: 'TOGGLE_PRODUCT_STATUS',
      entity: 'products',
      entityId: productId,
      diff: { status: targetStatus },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath('/category/[slug]', 'page');
    return { success: true, status: targetStatus };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Duplicate a product (cloning images, variants, wholesale pricing)
 */
export async function duplicateProductAction(productId: string): Promise<{
  success: boolean;
  newProductId?: string;
  error?: string;
}> {
  try {
    await requireRole('manager');
    const detail = await getAdminProductDetailAction(productId);
    if (!detail.success || !detail.product) {
      return { success: false, error: detail.error || 'Source product not found' };
    }

    const orig = detail.product;
    const timestamp = Date.now().toString().slice(-4);
    const newName = `${orig.name} (Copy)`;
    const newSku = orig.supplierSku ? `${orig.supplierSku}-COPY-${timestamp}` : `COPY-${timestamp}`;

    const res = await saveProductAction({
      name: newName,
      slug: '',
      description: orig.description,
      price: orig.price,
      compareAtPrice: orig.compareAtPrice,
      categoryId: orig.categoryId,
      status: 'draft',
      supplierSku: newSku,
      costPrice: orig.costPrice,
      supplierDeliveryCost: orig.supplierDeliveryCost,
      codFee: orig.codFee,
      notes: orig.notes ? `${orig.notes} (Duplicated)` : 'Duplicated product',
      images: orig.images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
        position: img.position,
        colorTag: img.colorTag,
        isSizeChart: img.isSizeChart,
      })),
      variants: orig.variants.map((v, i) => ({
        size: v.size,
        color: v.color,
        stockQuantity: v.stockQuantity,
        skuSuffix: `${v.skuSuffix || 'V'}-${timestamp}`,
      })),
    });

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidatePath('/admin/products');
    return { success: true, newProductId: res.productId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Bulk delete products
 */
export async function bulkDeleteProductsAction(productIds: string[]): Promise<{
  success: boolean;
  deletedCount: number;
  archivedCount: number;
  error?: string;
}> {
  try {
    let deletedCount = 0;
    let archivedCount = 0;

    for (const id of productIds) {
      const res = await deleteProductAction(id);
      if (res.success) {
        if (res.archivedInstead) archivedCount++;
        else deletedCount++;
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath('/category/[slug]', 'page');
    return { success: true, deletedCount, archivedCount };
  } catch (err: any) {
    return { success: false, deletedCount: 0, archivedCount: 0, error: err.message };
  }
}

/**
 * Bulk update product status (Active, Draft, Archived)
 */
export async function bulkUpdateStatusAction(
  productIds: string[],
  status: 'active' | 'draft' | 'archived'
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const adminUser = await requireRole('manager');

    if (!isSupabaseConfigured()) {
      inMemoryAdminProducts.forEach((p) => {
        if (productIds.includes(p.id)) p.status = status;
      });
      revalidatePath('/admin/products');
      return { success: true, count: productIds.length };
    }

    const admin = getServiceRoleClient();
    const { error } = await (admin as any)
      .from('products')
      .update({
        status,
        is_active: status === 'active',
      })
      .in('id', productIds);

    if (error) return { success: false, count: 0, error: error.message };

    await recordAuditLog({
      action: 'BULK_UPDATE_PRODUCT_STATUS',
      entity: 'products',
      diff: { count: productIds.length, status },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath('/category/[slug]', 'page');
    return { success: true, count: productIds.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}

