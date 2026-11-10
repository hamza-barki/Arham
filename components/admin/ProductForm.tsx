'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Tag,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import { saveProductAction, deleteProductAction, AdminProductFormInput } from '@/app/actions/admin-products';
import { CATEGORIES } from '@/lib/constants';
import cloudinaryLoader from '@/lib/image-loader';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface ProductFormProps {
  initialData?: AdminProductFormInput;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<AdminProductFormInput>(
    initialData || {
      name: '',
      slug: '',
      description: '',
      price: 3450,
      compareAtPrice: 4200,
      categoryId: CATEGORIES[0].id,
      status: 'active',
      supplierSku: '',
      costPrice: 1950,
      supplierDeliveryCost: 150,
      codFee: 50,
      notes: '',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600',
          position: 0,
          colorTag: 'Primary',
          isSizeChart: false,
        },
      ],
      variants: [
        { size: 'S', color: 'Default', stockQuantity: 10, skuSuffix: 'S' },
        { size: 'M', color: 'Default', stockQuantity: 15, skuSuffix: 'M' },
        { size: 'L', color: 'Default', stockQuantity: 8, skuSuffix: 'L' },
      ],
    }
  );

  const [newImageUrl, setNewImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeleteProduct = async () => {
    if (!formData.id) return;
    setDeleting(true);
    try {
      const res = await deleteProductAction(formData.id);
      if (res.success) {
        router.push('/admin/products');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to delete product');
        setShowDeleteModal(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete product');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // Live Margin & Profit Calculations
  const sellingPrice = Number(formData.price) || 0;
  const costPrice = Number(formData.costPrice) || 0;
  const deliveryCost = Number(formData.supplierDeliveryCost) || 0;
  const codFee = Number(formData.codFee) || 0;

  const totalCost = costPrice + deliveryCost + codFee;
  const netProfit = sellingPrice - totalCost;
  const marginPercent = sellingPrice > 0 ? Number(((netProfit / sellingPrice) * 100).toFixed(1)) : 0;

  // Add image URL
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData({
      ...formData,
      images: [
        ...formData.images,
        {
          url: newImageUrl.trim(),
          position: formData.images.length,
          colorTag: null,
          isSizeChart: false,
        },
      ],
    });
    setNewImageUrl('');
  };

  // Reorder images
  const handleMoveImage = (idx: number, direction: 'up' | 'down') => {
    const list = [...formData.images];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    // re-assign positions
    list.forEach((img, i) => {
      img.position = i;
    });

    setFormData({ ...formData, images: list });
  };

  // Remove image
  const handleRemoveImage = (idx: number) => {
    const list = formData.images.filter((_, i) => i !== idx);
    list.forEach((img, i) => {
      img.position = i;
    });
    setFormData({ ...formData, images: list });
  };

  // Add variant
  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          size: 'XL',
          color: 'Default',
          stockQuantity: 10,
          skuSuffix: `V-${formData.variants.length + 1}`,
        },
      ],
    });
  };

  // Remove variant
  const handleRemoveVariant = (idx: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== idx),
    });
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) {
      setErrorMsg('Product name and selling price are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await saveProductAction(formData);
    setSubmitting(false);

    if (res.success) {
      alert(`✓ Product "${formData.name}" saved successfully!`);
      router.push('/admin/products');
    } else {
      setErrorMsg(res.error || 'Failed to save product');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-neutral-500">
              Optimized for mobile with live Markaz margin calculation and image reordering.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving...' : 'Save Product'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* 1. BASIC PRODUCT INFO */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100 flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-800" />
          1. Basic Product Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-neutral-800 mb-1">
              Product Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Embroidered Lawn 3-Piece Stitched Suit"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Store Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Catalog Status
            </label>
            <select
              value={formData.status}
              onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              <option value="active">Active (Visible in Store)</option>
              <option value="draft">Draft (Hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-neutral-800 mb-1">
              Product Description
            </label>
            <RichTextEditor
              value={formData.description || ''}
              onChange={(html) => setFormData({ ...formData, description: html })}
              placeholder="Detailed fabric specs, embroidery details, care instructions..."
              minHeight={200}
            />
          </div>
        </div>
      </div>

      {/* 2. PRICING & LIVE MARGIN PREVIEW (MARKAZ INTEGRATION) */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-800" />
          2. Wholesale Cost, Selling Price & Live Margin Calculator
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Markaz SKU / Code:
            </label>
            <input
              type="text"
              value={formData.supplierSku || ''}
              onChange={(e) => setFormData({ ...formData, supplierSku: e.target.value })}
              placeholder="e.g. MKZ-LWN-101"
              className="w-full font-mono px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Wholesale Cost (Rs):
            </label>
            <input
              type="number"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              className="w-full font-bold px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Selling Price (Rs): <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full font-bold text-emerald-950 px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Supplier Delivery + COD (Rs):
            </label>
            <input
              type="number"
              value={formData.supplierDeliveryCost + formData.codFee}
              onChange={(e) => {
                const total = Number(e.target.value);
                setFormData({ ...formData, supplierDeliveryCost: Math.round(total * 0.75), codFee: Math.round(total * 0.25) });
              }}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            />
          </div>
        </div>

        {/* LIVE MARGIN PREVIEW CARD */}
        <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Live Profit Margin Preview
            </span>
            <p className="text-xs text-neutral-300">
              Selling: <strong>Rs. {sellingPrice}</strong> &minus; Total Cost (Cost: {costPrice} + Fees: {deliveryCost + codFee}): <strong>Rs. {totalCost}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block uppercase">Net Profit / Unit</span>
              <span className="font-serif text-lg font-bold text-white">
                Rs. {netProfit.toLocaleString()}
              </span>
            </div>

            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                marginPercent >= 25
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : marginPercent >= 10
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {marginPercent}% Margin
            </span>
          </div>
        </div>
      </div>

      {/* 3. CLOUDINARY IMAGES WITH REORDER & COLOR TAGGING & SIZE CHART */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div>
            <h2 className="font-serif text-base font-bold text-neutral-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-800" />
              3. Cloudinary Product Images
            </h2>
            <p className="text-[11px] text-neutral-500">
              Reorder photos, designate color tags, and mark size-chart images.
            </p>
          </div>
        </div>

        {/* Add Image URL bar */}
        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Paste Cloudinary or web image URL (https://...)"
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shrink-0 transition"
          >
            Add Image
          </button>
        </div>

        {/* Images List with Controls */}
        <div className="space-y-3">
          {formData.images.map((img, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                {/* Thumbnail */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300">
                  <Image
                    src={img.url}
                    alt={`Preview ${idx}`}
                    fill
                    sizes="56px"
                    loader={cloudinaryLoader}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-neutral-800 font-semibold truncate max-w-xs">
                      {img.url}
                    </span>
                  </div>

                  {/* Color tag input & Size Chart Checkbox */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase">Color Tag:</span>
                      <input
                        type="text"
                        value={img.colorTag || ''}
                        onChange={(e) => {
                          const updated = [...formData.images];
                          updated[idx].colorTag = e.target.value;
                          setFormData({ ...formData, images: updated });
                        }}
                        placeholder="e.g. Mint Green"
                        className="px-2 py-0.5 text-[11px] rounded-lg border border-neutral-300 bg-white"
                      />
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={img.isSizeChart}
                        onChange={(e) => {
                          const updated = [...formData.images];
                          updated[idx].isSizeChart = e.target.checked;
                          setFormData({ ...formData, images: updated });
                        }}
                        className="rounded text-emerald-800"
                      />
                      <span className="text-[11px] font-bold text-neutral-700">Is Size Chart</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Order & Remove Controls */}
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveImage(idx, 'up')}
                  className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30"
                  title="Move Up"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === formData.images.length - 1}
                  onClick={() => handleMoveImage(idx, 'down')}
                  className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30"
                  title="Move Down"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 bg-white hover:bg-rose-50"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PRODUCT VARIANTS & STOCK */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <h2 className="font-serif text-base font-bold text-neutral-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-800" />
            4. Variants & Stock Quantities
          </h2>

          <button
            type="button"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Variant</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {formData.variants.map((v, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 grid grid-cols-12 gap-2.5 items-center text-xs"
            >
              <div className="col-span-3">
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-0.5">Size</label>
                <input
                  type="text"
                  value={v.size || ''}
                  onChange={(e) => {
                    const upd = [...formData.variants];
                    upd[idx].size = e.target.value;
                    setFormData({ ...formData, variants: upd });
                  }}
                  placeholder="S, M, L..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-0.5">Color</label>
                <input
                  type="text"
                  value={v.color || ''}
                  onChange={(e) => {
                    const upd = [...formData.variants];
                    upd[idx].color = e.target.value;
                    setFormData({ ...formData, variants: upd });
                  }}
                  placeholder="Mint, Red..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-0.5">Stock</label>
                <input
                  type="number"
                  value={v.stockQuantity}
                  onChange={(e) => {
                    const upd = [...formData.variants];
                    upd[idx].stockQuantity = Number(e.target.value);
                    setFormData({ ...formData, variants: upd });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-0.5">Suffix</label>
                <input
                  type="text"
                  value={v.skuSuffix}
                  onChange={(e) => {
                    const upd = [...formData.variants];
                    upd[idx].skuSuffix = e.target.value;
                    setFormData({ ...formData, variants: upd });
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 bg-white font-mono text-[10px]"
                />
              </div>

              <div className="col-span-1 text-right pt-3">
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(idx)}
                  className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons: Delete (if edit) & Save */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200">
        {isEdit && formData.id ? (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Product</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-sm transition"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving Product...' : 'Save Product'}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">Delete this product?</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Are you sure you want to delete &quot;{formData.name}&quot;? If customer orders exist for this item, it will be safely archived to protect order records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </form>
  );
}

