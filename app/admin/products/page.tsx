'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Plus,
  FileSpreadsheet,
  Search,
  Filter,
  AlertTriangle,
  ExternalLink,
  Edit,
  DollarSign,
  Layers,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Sparkles,
  Trash2,
  Copy,
  CheckSquare,
  Square,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  getAdminProductsAction,
  deleteProductAction,
  toggleProductStatusAction,
  duplicateProductAction,
  bulkDeleteProductsAction,
  bulkUpdateStatusAction,
} from '@/app/actions/admin-products';
import { useAdminRole } from '@/hooks/useAdminRole';
import { CATEGORIES } from '@/lib/constants';
import cloudinaryLoader from '@/lib/image-loader';

export default function AdminProductsPage() {
  const { role } = useAdminRole();
  const isManagerOrAbove = role === 'manager' || role === 'admin' || role === 'super_admin';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Selection & Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{ [id: string]: boolean }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; product: any | null }>({
    isOpen: false,
    product: null,
  });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchProducts = useCallback(
    async (
      searchQuery = search,
      cat = selectedCategory,
      st = selectedStatus,
      low = lowStockOnly
    ) => {
      setLoading(true);
      try {
        const res = await getAdminProductsAction({
          search: searchQuery,
          categoryId: cat,
          status: st,
          lowStockOnly: low,
        });
        if (res.success) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    },
    [search, selectedCategory, selectedStatus, lowStockOnly]
  );

  useEffect(() => {
    fetchProducts(search, selectedCategory, selectedStatus, lowStockOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus, lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Selection toggles
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  // Toggle single product status (active <-> draft)
  const handleToggleStatus = async (product: any) => {
    if (!isManagerOrAbove) return;
    const targetStatus = product.status === 'active' ? 'draft' : 'active';
    setActionLoading((prev) => ({ ...prev, [product.id]: true }));

    try {
      const res = await toggleProductStatusAction(product.id, targetStatus);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: res.status } : p))
        );
        showNotification(
          'success',
          `Product marked as ${res.status?.toUpperCase()}`
        );
      } else {
        showNotification('error', res.error || 'Failed to update status');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Status update failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  // Duplicate single product
  const handleDuplicate = async (product: any) => {
    if (!isManagerOrAbove) return;
    setActionLoading((prev) => ({ ...prev, [`dup-${product.id}`]: true }));

    try {
      const res = await duplicateProductAction(product.id);
      if (res.success) {
        showNotification('success', `Created duplicate: "${product.name} (Copy)"`);
        fetchProducts();
      } else {
        showNotification('error', res.error || 'Duplicate failed');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Duplicate failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`dup-${product.id}`]: false }));
    }
  };

  // Delete single product
  const confirmDeleteProduct = async () => {
    const product = deleteConfirm.product;
    if (!product) return;

    setActionLoading((prev) => ({ ...prev, [`del-${product.id}`]: true }));
    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        if (res.archivedInstead) {
          showNotification(
            'success',
            `Product archived (has customer orders in history).`
          );
        } else {
          showNotification('success', `Product "${product.name}" deleted permanently.`);
        }
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        setSelectedIds((prev) => prev.filter((id) => id !== product.id));
      } else {
        showNotification('error', res.error || 'Failed to delete product');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Delete failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`del-${product.id}`]: false }));
      setDeleteConfirm({ isOpen: false, product: null });
    }
  };

  // Bulk actions
  const handleBulkStatus = async (status: 'active' | 'draft' | 'archived') => {
    if (!selectedIds.length) return;
    setActionLoading((prev) => ({ ...prev, bulk: true }));

    try {
      const res = await bulkUpdateStatusAction(selectedIds, status);
      if (res.success) {
        showNotification('success', `Updated ${res.count} products to ${status.toUpperCase()}`);
        setProducts((prev) =>
          prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status } : p))
        );
        setSelectedIds([]);
      } else {
        showNotification('error', res.error || 'Bulk update failed');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Bulk update failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, bulk: false }));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setActionLoading((prev) => ({ ...prev, bulk: true }));

    try {
      const res = await bulkDeleteProductsAction(selectedIds);
      if (res.success) {
        showNotification(
          'success',
          `Processed: ${res.deletedCount} deleted, ${res.archivedCount} archived.`
        );
        setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
        setSelectedIds([]);
      } else {
        showNotification('error', res.error || 'Bulk delete failed');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Bulk delete failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, bulk: false }));
      setBulkDeleteConfirm(false);
    }
  };

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => (p.stockQuantity ?? 0) <= 5).length;
  const activeCount = products.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 relative">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold transition transform animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-800" />
            Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Manage wholesale products, Markaz supplier SKUs, private margins, and live stock.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isManagerOrAbove && (
            <Link
              href="/admin/products/import"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Import Markaz</span>
            </Link>
          )}

          {isManagerOrAbove && (
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Product</span>
            </Link>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-neutral-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500">Total Items</div>
            <div className="text-base sm:text-lg font-black text-neutral-900">{totalProducts}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500">Active Live</div>
            <div className="text-base sm:text-lg font-black text-emerald-800">{activeCount}</div>
          </div>
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            lowStockOnly
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-neutral-200/80 hover:border-amber-200 shadow-xs'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500">Low Stock (&le; 5)</div>
            <div className="text-base sm:text-lg font-black text-amber-600">{lowStockCount}</div>
          </div>
        </button>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500">Markaz Synced</div>
            <div className="text-base sm:text-lg font-black text-indigo-700">
              {products.filter((p) => p.supplierSku).length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, slug, or Markaz SKU..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-emerald-800 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-black transition shrink-0"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => fetchProducts()}
            title="Refresh Products"
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 focus:outline-emerald-800"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 focus:outline-emerald-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Live)</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Low Stock Toggle Pill */}
          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              lowStockOnly
                ? 'bg-amber-600 text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Low Stock Only</span>
          </button>

          {(search || selectedCategory !== 'all' || selectedStatus !== 'all' || lowStockOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setLowStockOnly(false);
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Select All / Bulk Action Bar */}
      {products.length > 0 && isManagerOrAbove && (
        <div className="flex items-center justify-between px-2 py-1 text-xs">
          <button
            onClick={handleSelectAll}
            className="inline-flex items-center gap-2 font-bold text-neutral-700 hover:text-neutral-900 transition"
          >
            {selectedIds.length === products.length && products.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-700" />
            ) : (
              <Square className="w-4 h-4 text-neutral-400" />
            )}
            <span>
              {selectedIds.length === products.length && products.length > 0
                ? 'Deselect All'
                : `Select All (${products.length})`}
            </span>
          </button>

          {selectedIds.length > 0 && (
            <span className="font-semibold text-neutral-500">
              {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      )}

      {/* Floating Bulk Action Bar when items selected */}
      {selectedIds.length > 0 && isManagerOrAbove && (
        <div className="sticky top-4 z-40 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 flex-wrap border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-neutral-900 font-black text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">Selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkStatus('active')}
              disabled={actionLoading.bulk}
              className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Active</span>
            </button>

            <button
              onClick={() => handleBulkStatus('draft')}
              disabled={actionLoading.bulk}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Mark Draft</span>
            </button>

            <button
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={actionLoading.bulk}
              className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-neutral-400 hover:text-white transition"
              title="Cancel Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-2xl border border-neutral-200 animate-pulse flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-neutral-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/3" />
                <div className="h-3 bg-neutral-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">No products found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              No products match your current filters. Try resetting the filters or add a new product.
            </p>
          </div>
          {isManagerOrAbove && (
            <div className="flex justify-center gap-3">
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Link>
              <Link
                href="/admin/products/import"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Import Markaz</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* Product Cards List */
        <div className="space-y-3">
          {products.map((product) => {
            const primaryImg =
              product.images && product.images.length > 0
                ? typeof product.images[0] === 'string'
                  ? product.images[0]
                  : product.images[0].url || product.images[0].cloudinary_url
                : 'https://placehold.co/100x100?text=No+Photo';

            const isLowStock = (product.stockQuantity ?? 0) <= 5;
            const variantsCount = product.variants ? product.variants.length : 0;
            const isSelected = selectedIds.includes(product.id);
            const isToggling = actionLoading[product.id];
            const isDuplicating = actionLoading[`dup-${product.id}`];

            // Margin calculations
            const sellingPrice = Number(product.price) || 0;
            const costPrice = Number(product.costPrice) || 0;
            const suppDelivery = Number(product.supplierDeliveryCost) || 150;
            const codFee = Number(product.codFee) || 50;
            const estNetProfit = sellingPrice - (costPrice + suppDelivery + codFee);
            const marginPct = sellingPrice > 0 ? Math.round((estNetProfit / sellingPrice) * 100) : 0;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-500'
                    : 'border-neutral-200/90 hover:border-emerald-200 hover:shadow-xs'
                }`}
              >
                {/* Left side: Checkbox + Thumbnail & Product Info */}
                <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
                  {/* Selection Checkbox */}
                  {isManagerOrAbove && (
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(product.id)}
                      className="mt-4 sm:mt-5 p-1 text-neutral-400 hover:text-emerald-700 transition shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                    <Image
                      src={primaryImg}
                      alt={product.name}
                      fill
                      sizes="80px"
                      loader={cloudinaryLoader}
                      className="w-full h-full object-cover"
                    />
                    {product.images && product.images.length > 1 && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white">
                        +{product.images.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Clickable 1-click status badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(product)}
                        disabled={isToggling}
                        title={`Click to change status to ${product.status === 'active' ? 'Draft' : 'Active'}`}
                        className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider transition ${
                          product.status === 'active'
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                            : product.status === 'draft'
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span>{product.status || 'Active'}</span>
                        )}
                        <span className="text-[9px] opacity-60 font-normal lowercase">(click to toggle)</span>
                      </button>

                      {product.supplierSku && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-100">
                          MKZ: {product.supplierSku}
                        </span>
                      )}

                      {isLowStock && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock ({product.stockQuantity ?? 0})
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1 flex-wrap">
                      <span>{product.categoryName || 'General'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-neutral-400" />
                        {variantsCount} variant{variantsCount !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span className={isLowStock ? 'text-rose-600 font-bold' : 'text-neutral-700'}>
                        Stock: {product.stockQuantity ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center / Pricing & Margins */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-neutral-500 font-medium">Retail Price</div>
                    <div className="text-base sm:text-lg font-black text-neutral-900">
                      Rs. {sellingPrice.toLocaleString()}
                    </div>
                    {product.compareAtPrice && product.compareAtPrice > sellingPrice && (
                      <div className="text-[11px] text-neutral-400 line-through">
                        Rs. {product.compareAtPrice.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Wholesale Profit Preview */}
                  {isManagerOrAbove && costPrice > 0 && (
                    <div className="text-right bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <div className="text-[10px] font-bold uppercase text-emerald-700">Net Profit</div>
                      <div className="text-xs sm:text-sm font-black text-emerald-900">
                        Rs. {estNetProfit.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600">{marginPct}% margin</div>
                    </div>
                  )}

                  {/* Actions: View, Clone, Edit, Delete */}
                  <div className="flex items-center gap-1.5">
                    {/* View on live store */}
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      title="Preview on Store"
                      className="p-2 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {/* Duplicate button */}
                    {isManagerOrAbove && (
                      <button
                        type="button"
                        onClick={() => handleDuplicate(product)}
                        disabled={isDuplicating}
                        title="Duplicate Product (Clone)"
                        className="p-2 rounded-xl text-neutral-500 hover:text-emerald-700 hover:bg-neutral-100 transition disabled:opacity-50"
                      >
                        {isDuplicating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Edit button */}
                    {isManagerOrAbove && (
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                    )}

                    {/* Delete button */}
                    {isManagerOrAbove && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, product })}
                        title="Delete Product"
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-neutral-900">Delete Product?</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-neutral-800">
                    &quot;{deleteConfirm.product.name}&quot;
                  </span>
                  ?
                </p>
                <div className="mt-2 text-[11px] bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-neutral-600">
                  <strong>Note:</strong> If this product has customer order history, it will be safely{' '}
                  <strong>archived</strong> to preserve accounting records without breaking database integrity.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, product: null })}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={actionLoading[`del-${deleteConfirm.product.id}`]}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                {actionLoading[`del-${deleteConfirm.product.id}`] ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-neutral-900">Delete Multiple Products?</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  You are about to delete{' '}
                  <span className="font-bold text-neutral-900">{selectedIds.length}</span> selected
                  products.
                </p>
                <div className="mt-2 text-[11px] bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-neutral-600">
                  Products with existing customer orders will be safely archived instead of hard deleted.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={actionLoading.bulk}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                {actionLoading.bulk ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete ({selectedIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
