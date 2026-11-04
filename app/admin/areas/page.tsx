'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Download,
  FileSpreadsheet,
  Check,
  Edit2,
  Trash2,
  Eye,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCheck,
} from 'lucide-react';
import {
  getAdminAreasAction,
  createAreaAction,
  updateAreaAction,
  toggleAreaStatusAction,
  deleteAreaAction,
  importAreasFromCsvAction,
  getAreaReviewOrdersAction,
  approveCustomAreaFromOrderAction,
  dismissAreaReviewOrderAction,
} from '@/app/actions/admin-areas';
import {
  STARTER_PROVINCES,
  STARTER_CITIES,
  AdminAreaItem,
  parseAreaCsv,
} from '@/lib/geo';
import { Button } from '@/components/ui/Button';

export default function AdminAreasPage() {
  // Tabs: 'areas' | 'review' | 'csv' | 'postex'
  const [activeTab, setActiveTab] = useState<'areas' | 'review' | 'csv' | 'postex'>('areas');

  // Areas list state
  const [areas, setAreas] = useState<AdminAreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Orders needing review
  const [reviewOrders, setReviewOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    provinceName: 'Punjab',
    cityName: 'Lahore',
    name: '',
    nameUr: '',
    active: true,
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // CSV Importer state
  const [csvText, setCsvText] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportResult, setCsvImportResult] = useState<{
    success: boolean;
    total: number;
    inserted: number;
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // PostEx sync state
  const [isSyncingPostEx, setIsSyncingPostEx] = useState(false);
  const [postExResult, setPostExResult] = useState<any | null>(null);

  // Fetch areas
  const fetchAreas = useCallback(async () => {
    setLoading(true);
    const res = await getAdminAreasAction({
      provinceName: selectedProvince || undefined,
      cityName: selectedCity || undefined,
      search: search || undefined,
      activeOnly: statusFilter === 'active',
    });

    if (res.success) {
      let filtered = res.data;
      if (statusFilter === 'disabled') {
        filtered = filtered.filter((a) => !a.active);
      }
      setAreas(filtered);
    }
    setLoading(false);
  }, [selectedProvince, selectedCity, search, statusFilter]);

  // Fetch review orders
  const fetchReviewOrders = useCallback(async () => {
    setLoadingOrders(true);
    const res = await getAreaReviewOrdersAction();
    if (res.success) {
      setReviewOrders(res.orders);
    }
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    fetchAreas();
    fetchReviewOrders();
  }, [fetchAreas, fetchReviewOrders]);

  // Filter cities by selected province in add/edit modal
  const modalCities = useMemo(() => {
    const prov = STARTER_PROVINCES.find((p) => p.name === formData.provinceName);
    return STARTER_CITIES.filter((c) => (prov ? c.provinceId === prov.id : true));
  }, [formData.provinceName]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingAreaId(null);
    setFormData({
      provinceName: selectedProvince || 'Punjab',
      cityName: selectedCity || 'Lahore',
      name: '',
      nameUr: '',
      active: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (area: AdminAreaItem) => {
    setModalMode('edit');
    setEditingAreaId(area.id);
    setFormData({
      provinceName: area.provinceName || 'Punjab',
      cityName: area.cityName || 'Lahore',
      name: area.name,
      nameUr: area.nameUr || '',
      active: area.active,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Submit modal form
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Area name is required');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    if (modalMode === 'create') {
      const res = await createAreaAction({
        provinceName: formData.provinceName,
        cityName: formData.cityName,
        name: formData.name,
        nameUr: formData.nameUr,
        active: formData.active,
      });

      if (!res.success) {
        setModalError(res.error || 'Failed to create area');
        setModalSubmitting(false);
        return;
      }
    } else if (editingAreaId) {
      const res = await updateAreaAction(editingAreaId, {
        name: formData.name,
        nameUr: formData.nameUr,
        active: formData.active,
      });

      if (!res.success) {
        setModalError(res.error || 'Failed to update area');
        setModalSubmitting(false);
        return;
      }
    }

    setModalSubmitting(false);
    setIsModalOpen(false);
    fetchAreas();
  };

  // Toggle active/disable
  const handleToggleActive = async (areaId: string, currentActive: boolean) => {
    await toggleAreaStatusAction(areaId, !currentActive);
    fetchAreas();
  };

  // Delete area
  const handleDeleteArea = async (areaId: string, areaName: string) => {
    if (!confirm(`Are you sure you want to delete "${areaName}"?`)) return;
    await deleteAreaAction(areaId);
    fetchAreas();
  };

  // Handle CSV file drop or select
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text || '');
    };
    reader.readAsText(file);
  };

  // Execute CSV import
  const handleExecuteCsvImport = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    setCsvImportResult(null);

    const res = await importAreasFromCsvAction(csvText);
    setCsvImportResult(res);
    setIsImporting(false);
    if (res.inserted > 0) {
      fetchAreas();
    }
  };

  // Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const sampleCsv = `province,city,area,courier_city_code,area_ur
Punjab,Lahore,DHA Phase 6,LHE,ڈی ایچ اے فیز 6
Punjab,Lahore,Bahria Orchard,LHE,بحریہ آرچرڈ
Sindh,Karachi,Gulshan-e-Maymar,KHI,گلشن معمار
Sindh,Karachi,Buffer Zone Sector 15,KHI,بفر زون سیکٹر 15
Islamabad Capital Territory,Islamabad,Sector B-17 Multi Gardens,ISB,سیکٹر بی 17 ملٹی گارڈنز
Khyber Pakhtunkhwa,Peshawar,Hayatabad Phase 8,PEW,حیات آباد فیز 8
Punjab,Rawalpindi,Gulraiz Housing Scheme Phase 2,RWP,گلریز فیز 2`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_pakistan_areas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run PostEx Sync
  const handleSyncPostEx = async () => {
    setIsSyncingPostEx(true);
    try {
      const res = await fetch('/api/admin/sync-postex', { method: 'POST' });
      const data = await res.json();
      setPostExResult(data);
      fetchAreas();
    } catch (err: any) {
      setPostExResult({ success: false, error: err.message });
    }
    setIsSyncingPostEx(false);
  };

  // Approve custom area from order review
  const handleApproveCustomArea = async (order: any) => {
    const res = await approveCustomAreaFromOrderAction(
      order.id,
      order.customAreaName,
      order.city,
      order.province
    );
    if (res.success) {
      alert(`✓ Area "${order.customAreaName}" added to ${order.city} database and order verified.`);
      fetchReviewOrders();
      fetchAreas();
    } else {
      alert(`Error approving area: ${res.error}`);
    }
  };

  // Dismiss order area review
  const handleDismissReview = async (orderId: string) => {
    await dismissAreaReviewOrderAction(orderId);
    fetchReviewOrders();
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-emerald-800" />
            Pakistan Logistics & Delivery Areas
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage delivery areas, courier city codes, bulk CSV imports, and customer unlisted area reviews.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncPostEx}
            disabled={isSyncingPostEx}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-2xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPostEx ? 'animate-spin text-emerald-700' : ''}`} />
            <span>{isSyncingPostEx ? 'Syncing PostEx...' : 'Sync PostEx Cities'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Area</span>
          </button>
        </div>
      </div>

      {/* PROMINENT MANDATORY NOTICE (Incomplete Area List Notice) */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-950 shadow-xs">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm sm:text-base text-amber-950">
            ⚠️ Logistics Notice: Starter Area Database (Incomplete by Design)
          </p>
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            This database is pre-seeded with a <strong>starter list</strong> of major cities and well-known areas across Pakistan. 
            Because Pakistan has thousands of residential societies, towns, and sectors, <strong>this list is incomplete and must be actively extended and maintained by store administrators</strong>.
            Customers can choose <em>&ldquo;My area is not listed&rdquo;</em> at checkout, which routes their unlisted area to the 
            <strong> Area Review Queue</strong> below so you can verify and add it with one click.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('areas')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'areas'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Area Database ({areas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'review'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Orders Needing Area Review</span>
          {reviewOrders.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              {reviewOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'csv'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>CSV Importer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('postex')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'postex'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>PostEx Operational Cities API</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: AREA DATABASE TABLE */}
      {/* ===================================================================== */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search area (English/Urdu/City)..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            {/* Province Filter */}
            <div>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedCity('');
                }}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
              >
                <option value="">All Provinces & Territories</option>
                {STARTER_PROVINCES.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} {p.nameUr ? `(${p.nameUr})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
              >
                <option value="">All Cities in Pakistan</option>
                {STARTER_CITIES.filter((c) => {
                  if (!selectedProvince) return true;
                  const prov = STARTER_PROVINCES.find((p) => p.name === selectedProvince);
                  return prov ? c.provinceId === prov.id : true;
                }).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.courierCityCode ? `[${c.courierCityCode}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
              >
                <option value="all">All Statuses (Active & Disabled)</option>
                <option value="active">Active Zones Only</option>
                <option value="disabled">Disabled Zones Only</option>
              </select>
            </div>
          </div>

          {/* Areas Table Container (Table on Desktop, Cards on Mobile) */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Area / Sector Name</th>
                    <th className="py-3 px-4">Urdu Name (اردو)</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Courier Code</th>
                    <th className="py-3 px-4">Province</th>
                    <th className="py-3 px-4">Delivery Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        Loading areas catalog...
                      </td>
                    </tr>
                  ) : areas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        No areas match your search filters. Tap &ldquo;Add New Area&rdquo; or import a CSV to expand.
                      </td>
                    </tr>
                  ) : (
                    areas.map((area) => (
                      <tr key={area.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          {area.name}
                        </td>
                        <td className="py-3 px-4 font-serif text-neutral-600 text-sm">
                          {area.nameUr || '—'}
                        </td>
                        <td className="py-3 px-4 text-neutral-800 font-medium">
                          {area.cityName || 'Lahore'}
                        </td>
                        <td className="py-3 px-4">
                          {area.courierCityCode ? (
                            <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                              {area.courierCityCode}
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {area.provinceName || 'Punjab'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(area.id, area.active)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                              area.active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {area.active ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Disabled</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(area)}
                            className="p-1.5 text-neutral-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit Area"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArea(area.id, area.name)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Area"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< md screens) */}
            <div className="md:hidden divide-y divide-neutral-100">
              {loading ? (
                <p className="p-8 text-center text-xs text-neutral-500">Loading areas catalog...</p>
              ) : areas.length === 0 ? (
                <p className="p-8 text-center text-xs text-neutral-500">No areas found.</p>
              ) : (
                areas.map((area) => (
                  <div key={area.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm">{area.name}</h4>
                        {area.nameUr && <p className="font-serif text-neutral-500 text-xs">{area.nameUr}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(area.id, area.active)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          area.active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {area.active ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-600 flex-wrap">
                      <span className="font-semibold">{area.cityName || 'Lahore'}</span>
                      <span>•</span>
                      <span>{area.provinceName || 'Punjab'}</span>
                      {area.courierCityCode && (
                        <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                          {area.courierCityCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(area)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArea(area.id, area.name)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span>Showing {areas.length} delivery areas</span>
              <span>Provinces &bull; Cities &bull; Areas</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ORDERS NEEDING AREA REVIEW */}
      {/* ===================================================================== */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                Customer-Entered Unlisted Areas (Manual Review Queue)
              </p>
              <p className="text-amber-800 mt-0.5">
                These orders were placed by customers who tapped <em>&ldquo;My area is not listed&rdquo;</em> and typed their exact colony, village, or housing scheme. 
                Verify the location with the courier or customer, and click <strong>&ldquo;Approve & Add Area&rdquo;</strong> to automatically save it into your permanent area database so future customers can simply select it.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">City / Province</th>
                    <th className="py-3 px-4">Customer-Entered Area</th>
                    <th className="py-3 px-4">Street Address</th>
                    <th className="py-3 px-4">Order Total</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-neutral-500">
                        Checking orders queue...
                      </td>
                    </tr>
                  ) : reviewOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        <CheckCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="font-bold text-neutral-800">All Clear!</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          No orders currently pending unlisted area verification.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    reviewOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-neutral-900">{ord.customerName}</p>
                          <p className="font-mono text-neutral-500 text-[11px]">{ord.phone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-neutral-800">{ord.city}</span>
                          <span className="text-neutral-400 block text-[11px]">{ord.province}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block bg-amber-100 text-amber-900 font-bold px-2 py-1 rounded-md border border-amber-200">
                            {ord.customAreaName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-700 max-w-xs truncate">
                          {ord.addressLine}
                          {ord.landmark && (
                            <span className="block text-[11px] text-neutral-400 italic">
                              Near: {ord.landmark}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          Rs. {ord.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleApproveCustomArea(ord)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-2xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Areas & Verify</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissReview(ord.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition"
                          >
                            Dismiss
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: BULK CSV IMPORTER */}
      {/* ===================================================================== */}
      {activeTab === 'csv' && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
                  Bulk Area CSV Importer
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Import hundreds of areas in bulk with courier city codes. Automatically associates cities and provinces.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {/* CSV Specification Box */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 text-xs space-y-2">
              <p className="font-bold text-neutral-800">
                Required CSV Column Headers (case-insensitive):
              </p>
              <code className="block bg-white p-2.5 rounded-xl border border-neutral-200 text-neutral-800 font-mono text-[11px]">
                province, city, area, courier_city_code, area_ur
              </code>
              <p className="text-neutral-500 text-[11px]">
                Example: <code>Punjab, Lahore, Model Town Extension, LHE, ماڈل ٹاؤن</code>
              </p>
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2">
                Option A: Upload .CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="block w-full text-xs text-neutral-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 cursor-pointer"
              />
              {csvFile && (
                <p className="mt-1 text-xs text-emerald-700 font-semibold">
                  ✓ Selected file: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Raw CSV Text Paste */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2">
                Option B: Paste Raw CSV Text
              </label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="province,city,area,courier_city_code&#10;Punjab,Lahore,DHA Phase 7,LHE&#10;Sindh,Karachi,Gulshan-e-Iqbal Block 13,KHI"
                className="w-full font-mono text-xs p-3.5 rounded-2xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            {/* Execute Button */}
            <div className="pt-2 flex items-center justify-between">
              <Button
                variant="primary"
                onClick={handleExecuteCsvImport}
                disabled={isImporting || !csvText.trim()}
              >
                {isImporting ? 'Processing CSV Import...' : 'Import Areas Now'}
              </Button>
            </div>

            {/* Results Feedback */}
            {csvImportResult && (
              <div
                className={`p-4 rounded-2xl border ${
                  csvImportResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {csvImportResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <span>
                    Import Complete: {csvImportResult.inserted} areas added/updated successfully
                    (Total rows: {csvImportResult.total})
                  </span>
                </div>

                {csvImportResult.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-200/60 text-xs space-y-1">
                    <p className="font-semibold text-rose-700">Notice / Warnings:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-rose-600 max-h-32 overflow-y-auto">
                      {csvImportResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: POSTEX OPERATIONAL CITIES REFERENCE API */}
      {/* ===================================================================== */}
      {activeTab === 'postex' && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-800" />
                  PostEx Reference API & Courier City Codes
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  PostEx Official Reference Endpoint: <code>/services/integration/api/order/v2/get-operational-city</code>
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleSyncPostEx}
                  disabled={isSyncingPostEx || !process.env.NEXT_PUBLIC_POSTEX_TOKEN_CONFIGURED}
                  title={!process.env.NEXT_PUBLIC_POSTEX_TOKEN_CONFIGURED ? 'Disabled: POSTEX_API_TOKEN is not configured in .env.local' : 'Trigger live sync with PostEx API'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-neutral-200 text-neutral-500 cursor-not-allowed transition shadow-xs disabled:opacity-70"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPostEx ? 'animate-spin' : ''}`} />
                  <span>Sync Disabled (No Token)</span>
                </button>
                <span className="text-[10px] text-neutral-400">Couriers handled via CSV Booking Export</span>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2 text-xs">
              <p className="font-bold text-neutral-800">
                Official PostEx Merchant Integration Setup:
              </p>
              <p className="text-neutral-600 leading-relaxed">
                PostEx provides an API to dynamically query all active delivery zones and operational cities.
                If you have an active PostEx merchant account, simply add your merchant token to <code>.env.local</code>:
              </p>
              <pre className="bg-neutral-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
POSTEX_API_TOKEN=your_postex_token_here
POSTEX_BASE_URL=https://api.postex.pk
              </pre>
              <p className="text-[11px] text-neutral-500">
                You can also run the sync CLI script anytime from the terminal: <code>node scripts/sync-postex-cities.mjs</code>.
              </p>
            </div>

            {postExResult && (
              <div className="bg-neutral-900 text-neutral-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto">
                <p className="text-emerald-400 font-bold mb-1">=== PostEx Sync Output ===</p>
                <pre>{JSON.stringify(postExResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADD / EDIT AREA MODAL DIALOG */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                {modalMode === 'create' ? 'Add New Delivery Area' : 'Edit Delivery Area'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              {/* Province (Only on create) */}
              {modalMode === 'create' && (
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">
                    Province / Territory <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.provinceName}
                    onChange={(e) => {
                      setFormData({ ...formData, provinceName: e.target.value, cityName: 'Lahore' });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    {STARTER_PROVINCES.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.nameUr ? `(${p.nameUr})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* City (Only on create) */}
              {modalMode === 'create' && (
                <div>
                  <label className="block font-semibold text-neutral-800 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.cityName}
                    onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    {modalCities.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.courierCityCode ? `[${c.courierCityCode}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Area Name (English) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Area Name (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. DHA Phase 6 or Sector G-13"
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  required
                />
              </div>

              {/* Area Name (Urdu - Optional) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Area Name in Urdu (اردو) <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.nameUr}
                  onChange={(e) => setFormData({ ...formData, nameUr: e.target.value })}
                  placeholder="مثال: گلبرگ، ڈی ایچ اے، ماڈل ٹاؤن"
                  dir="rtl"
                  className="w-full font-serif px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="areaActiveCheckbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-emerald-800 focus:ring-emerald-800"
                />
                <label htmlFor="areaActiveCheckbox" className="font-semibold text-neutral-800">
                  Enable active delivery to this area
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 transition"
                >
                  {modalSubmitting ? 'Saving...' : modalMode === 'create' ? 'Add Area' : 'Update Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

