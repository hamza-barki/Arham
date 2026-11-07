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
  ArrowUpDown,
} from 'lucide-react';
import { getAdminProductsAction } from '@/app/actions/admin-products';
import { useAdminRole } from '@/hooks/useAdminRole';
import { CATEGORIES } from '@/lib/constants';
import cloudinaryLoader from '@/lib/image-loader';

export default function AdminProductsPage() {
  const { role, isStaff } = useAdminRole();
  const isManagerOrAbove = role === 'manager' || role === 'admin' || role === 'super_admin';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const fetchProducts = useCallback(async (searchQuery = search, cat = selectedCategory, st = selectedStatus, low = lowStockOnly) => {
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
  }, [search, selectedCategory, selectedStatus, lowStockOnly]);

  useEffect(() => {
    fetchProducts(search, selectedCategory, selectedStatus, lowStockOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus, lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => (p.stockQuantity ?? 0) <= 5).length;
  const activeCount = products.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
        /* Product Cards List (Mobile-first with Desktop Table) */
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
                className="bg-white rounded-2xl border border-neutral-200/90 hover:border-emerald-200 hover:shadow-xs transition p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left side: Thumbnail & Product Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
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

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          product.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : product.status === 'draft'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {product.status || 'Active'}
                      </span>

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
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
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

                  {/* Private Wholesale Profit Preview (Restricted from Staff) */}
                  {isManagerOrAbove && costPrice > 0 && (
                    <div className="text-right bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <div className="text-[10px] font-bold uppercase text-emerald-700">Net Profit</div>
                      <div className="text-xs sm:text-sm font-black text-emerald-900">
                        Rs. {estNetProfit.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600">{marginPct}% margin</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      title="Preview on Store"
                      className="p-2 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {isManagerOrAbove && (
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

