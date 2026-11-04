'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Search,
  ChevronDown,
  X,
  Check,
  PlusCircle,
  AlertTriangle,
  Building2,
  Navigation2,
  Phone,
  User,
  Info,
} from 'lucide-react';
import {
  STARTER_PROVINCES,
  STARTER_CITIES,
  STARTER_AREAS,
  getProvinces,
  getCitiesForProvince,
  getAreasForCity,
  filterAreas,
  GeoProvince,
  GeoCity,
  GeoArea,
} from '@/lib/geo';

// Dynamically import Leaflet map with SSR disabled to prevent window object errors in Next.js
const LeafletMapPicker = dynamic(
  () => import('./LeafletMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 sm:h-64 rounded-2xl bg-neutral-100 animate-pulse flex items-center justify-center text-xs text-neutral-500">
        Loading Interactive OpenStreetMap...
      </div>
    ),
  }
);

export interface AddressPickerProps {
  // Form control values
  province: string;
  city: string;
  areaId?: string | null;
  areaName: string;
  isCustomArea?: boolean;
  customAreaName?: string;
  addressLine: string;
  landmark?: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string;
  customerName?: string;

  // Change handlers
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string, courierCode?: string) => void;
  onAreaChange: (areaId: string | null, areaName: string, isCustom: boolean) => void;
  onCustomAreaNameChange: (customName: string) => void;
  onAddressLineChange: (address: string) => void;
  onLandmarkChange: (landmark: string) => void;
  onCoordinatesChange: (lat: number | null, lng: number | null) => void;
  onPhoneChange?: (phone: string) => void;
  onCustomerNameChange?: (name: string) => void;

  // Errors from validation
  errors?: {
    province?: string;
    city?: string;
    areaName?: string;
    customAreaName?: string;
    address?: string;
    landmark?: string;
    phone?: string;
    customerName?: string;
  };
}

export default function AddressPicker({
  province,
  city,
  areaId,
  areaName,
  isCustomArea = false,
  customAreaName = '',
  addressLine,
  landmark = '',
  lat = null,
  lng = null,
  phone = '',
  customerName = '',
  onProvinceChange,
  onCityChange,
  onAreaChange,
  onCustomAreaNameChange,
  onAddressLineChange,
  onLandmarkChange,
  onCoordinatesChange,
  onPhoneChange,
  onCustomerNameChange,
  errors = {},
}: AddressPickerProps) {
  // Data lists
  const [provincesList, setProvincesList] = useState<GeoProvince[]>(STARTER_PROVINCES);
  const [citiesList, setCitiesList] = useState<GeoCity[]>([]);
  const [areasList, setAreasList] = useState<GeoArea[]>([]);

  // Mobile bottom-sheet modals for instant selection
  const [activeSheet, setActiveSheet] = useState<'province' | 'city' | 'area' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(Boolean(lat && lng));

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load provinces on mount
  useEffect(() => {
    getProvinces()
      .then(setProvincesList)
      .catch(() => setProvincesList(STARTER_PROVINCES));
  }, []);

  // Load cities when province changes
  useEffect(() => {
    if (!province) {
      setCitiesList([]);
      return;
    }
    getCitiesForProvince(province).then((cities) => {
      setCitiesList(cities);
    });
  }, [province]);

  // Load areas when city changes
  useEffect(() => {
    if (!city) {
      setAreasList([]);
      return;
    }
    getAreasForCity(city).then((areas) => {
      setAreasList(areas);
    });
  }, [city]);

  // Auto-focus search input when bottom sheet opens
  useEffect(() => {
    if (activeSheet) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [activeSheet]);

  // Instant filter for Provinces (Urdu + English)
  const filteredProvinces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return provincesList;
    return provincesList.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.nameUr && p.nameUr.includes(q))
    );
  }, [provincesList, searchQuery]);

  // Instant filter for Cities (Urdu + English + Courier Code)
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return citiesList;
    return citiesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameUr && c.nameUr.includes(q)) ||
        (c.courierCityCode && c.courierCityCode.toLowerCase().includes(q))
    );
  }, [citiesList, searchQuery]);

  // Instant filter for Areas (Urdu + English)
  const filteredAreas = useMemo(() => {
    return filterAreas(areasList, searchQuery);
  }, [areasList, searchQuery]);

  // Selected object lookups
  const selectedProvince = provincesList.find((p) => p.name.toLowerCase() === province?.toLowerCase());
  const selectedCity = citiesList.find((c) => c.name.toLowerCase() === city?.toLowerCase());
  const selectedArea = areasList.find((a) => a.id === areaId || a.name.toLowerCase() === areaName?.toLowerCase());

  return (
    <div className="space-y-4">
      {/* Visual Flow Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-emerald-950">
        <Navigation2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-emerald-950">
            Mobile-First 3-Tap Pakistani Address Flow
          </p>
          <p className="text-emerald-800 leading-relaxed">
            Select <strong>Province &rarr; City &rarr; Area</strong> with instant Urdu/English search.
            If your area isn&apos;t listed, choose <em>&ldquo;My area is not listed&rdquo;</em> and we will manually review it before dispatch.
          </p>
        </div>
      </div>

      {/* STEP 1 & 2: PROVINCE & CITY (GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* 1. PROVINCE PICKER */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1.5">
            1. Province / Territory <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setActiveSheet('province')}
            className={`w-full text-left px-3.5 py-3 rounded-xl border transition flex items-center justify-between text-sm ${
              errors.province
                ? 'border-rose-400 bg-rose-50/50'
                : 'border-neutral-300 bg-white hover:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-800'
            }`}
          >
            <div className="truncate">
              {province ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{province}</span>
                  {selectedProvince?.nameUr && (
                    <span className="text-xs text-neutral-500 font-serif">
                      ({selectedProvince.nameUr})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-neutral-400">Select Province</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>
          {errors.province && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.province}</p>
          )}
        </div>

        {/* 2. CITY PICKER */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1.5">
            2. City <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            disabled={!province}
            onClick={() => setActiveSheet('city')}
            className={`w-full text-left px-3.5 py-3 rounded-xl border transition flex items-center justify-between text-sm ${
              !province
                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                : errors.city
                ? 'border-rose-400 bg-rose-50/50'
                : 'border-neutral-300 bg-white hover:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-800'
            }`}
          >
            <div className="truncate">
              {city ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{city}</span>
                  {selectedCity?.courierCityCode && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                      {selectedCity.courierCityCode}
                    </span>
                  )}
                  {selectedCity?.nameUr && (
                    <span className="text-xs text-neutral-500 font-serif">
                      ({selectedCity.nameUr})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-neutral-400">
                  {province ? 'Select City' : 'Select province first'}
                </span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>
          {errors.city && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.city}</p>
          )}
        </div>
      </div>

      {/* STEP 3: AREA PICKER */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800">
            3. Delivery Area / Sector <span className="text-rose-500">*</span>
          </label>
          {city && (
            <span className="text-[11px] text-neutral-500">
              {areasList.length} verified areas in {city}
            </span>
          )}
        </div>

        {!isCustomArea ? (
          <button
            type="button"
            disabled={!city}
            onClick={() => setActiveSheet('area')}
            className={`w-full text-left px-3.5 py-3 rounded-xl border transition flex items-center justify-between text-sm ${
              !city
                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                : errors.areaName
                ? 'border-rose-400 bg-rose-50/50'
                : 'border-neutral-300 bg-white hover:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-800'
            }`}
          >
            <div className="truncate">
              {areaName ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-semibold text-neutral-900">{areaName}</span>
                  {selectedArea?.nameUr && (
                    <span className="text-xs text-neutral-500 font-serif">
                      ({selectedArea.nameUr})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-neutral-400">
                  {city ? 'Tap to search & select area' : 'Select city first'}
                </span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>
        ) : (
          /* Custom Area Input Mode */
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={customAreaName}
                onChange={(e) => onCustomAreaNameChange(e.target.value)}
                placeholder="Enter your exact area, society, village, or town name"
                className={`w-full px-3.5 py-3 pr-24 rounded-xl border text-sm transition ${
                  errors.customAreaName
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-emerald-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  onAreaChange(null, '', false);
                  onCustomAreaNameChange('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition"
              >
                Back to list
              </button>
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Unlisted Area Notice:</strong> We deliver everywhere across Pakistan! Your order will be flagged for a quick address verification call before courier booking.
              </span>
            </div>
          </div>
        )}

        {errors.areaName && !isCustomArea && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.areaName}</p>
        )}
        {errors.customAreaName && isCustomArea && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.customAreaName}</p>
        )}
      </div>

      {/* STEP 4: HOUSE / STREET ADDRESS */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1.5">
          4. House / Flat / Street Address <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={2}
          value={addressLine}
          onChange={(e) => onAddressLineChange(e.target.value)}
          placeholder="e.g. House # 14-B, Street 3, Block G"
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition ${
            errors.address
              ? 'border-rose-400 bg-rose-50/50'
              : 'border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent'
          }`}
        />
        {errors.address && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.address}</p>
        )}
      </div>

      {/* STEP 5: LANDMARK (OPTIONAL) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1.5">
          5. Nearby Famous Landmark <span className="text-neutral-400 font-normal lowercase">(optional)</span>
        </label>
        <input
          type="text"
          value={landmark}
          onChange={(e) => onLandmarkChange(e.target.value)}
          placeholder="e.g. Near Jamia Masjid, Opposite City Hospital, Behind Allied Bank"
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          Helps the delivery rider locate your doorstep immediately without repeated calls.
        </p>
      </div>

      {/* STEP 6: OPTIONAL MAP PIN (LEAFLET + OPENSTREETMAP) */}
      <div className="pt-1">
        <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                  Pin Exact Location on Map
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Optional
                  </span>
                </p>
                <p className="text-[11px] text-neutral-500">
                  {lat && lng
                    ? `Pinned: (${lat.toFixed(4)}, ${lng.toFixed(4)}) - tap to change`
                    : 'Free OpenStreetMap &bull; Tap to open GPS map'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 hover:text-emerald-950">
              {showMap ? 'Hide Map' : 'Open Map'}
            </span>
          </button>

          {showMap && (
            <div className="p-3.5 border-t border-neutral-200 bg-neutral-50/60">
              <LeafletMapPicker
                initialLat={lat}
                initialLng={lng}
                cityName={city}
                onLocationSelect={onCoordinatesChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* STEP 7: PHONE (IF CONTROLLED VIA PICKER) */}
      {onPhoneChange !== undefined && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1.5">
            7. Mobile Phone (For Courier Rider Call) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-neutral-500 pointer-events-none">
              🇵🇰 +92
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="300 1234567"
              className={`w-full text-sm pl-16 pr-4 py-2.5 rounded-xl border font-mono transition ${
                errors.phone
                  ? 'border-rose-400 bg-rose-50/50'
                  : 'border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent'
              }`}
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Format: 03001234567 or 3001234567. Rider will call prior to doorstep delivery.
          </p>
          {errors.phone && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone}</p>
          )}
        </div>
      )}

      {/* STEP 8: CUSTOMER NAME (IF CONTROLLED VIA PICKER) */}
      {onCustomerNameChange !== undefined && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1.5">
            8. Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="e.g. Ayesha Khan"
              className={`w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border transition ${
                errors.customerName
                  ? 'border-rose-400 bg-rose-50/50'
                  : 'border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent'
              }`}
            />
          </div>
          {errors.customerName && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{errors.customerName}</p>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MOBILE BOTTOM SHEET MODAL (SEARCHABLE LISTS) */}
      {/* ===================================================================== */}
      {activeSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-neutral-900 text-base sm:text-lg">
                  {activeSheet === 'province' && 'Select Province / Territory'}
                  {activeSheet === 'city' && `Select City in ${province}`}
                  {activeSheet === 'area' && `Select Area in ${city}`}
                </h3>
                <p className="text-xs text-neutral-500">
                  Search in English or Urdu (اردو)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="p-3 border-b border-neutral-100">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeSheet === 'province'
                      ? 'Search province (e.g. Punjab, Sindh, پنجاب)...'
                      : activeSheet === 'city'
                      ? 'Search city (e.g. Lahore, Karachi, کراچی, LHE)...'
                      : 'Search area (e.g. Gulberg, DHA, F-7, گلبرگ)...'
                  }
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* List Items Container */}
            <div className="overflow-y-auto p-2.5 divide-y divide-neutral-100 max-h-[55vh]">
              {/* SPECIAL OPTION FOR AREA: "My area is not listed" */}
              {activeSheet === 'area' && (
                <button
                  type="button"
                  onClick={() => {
                    onAreaChange(null, '', true);
                    setActiveSheet(null);
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 transition flex items-center justify-between mb-2 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-5 h-5 text-emerald-800 shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-emerald-950">
                        My area is not listed / میرا علاقہ لسٹ میں نہیں ہے
                      </p>
                      <p className="text-xs text-emerald-800">
                        Type your own area name &bull; We deliver all across Pakistan!
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs">
                    Custom
                  </span>
                </button>
              )}

              {/* 1. Provinces list */}
              {activeSheet === 'province' && (
                filteredProvinces.length > 0 ? (
                  filteredProvinces.map((p) => {
                    const isSelected = p.name.toLowerCase() === province?.toLowerCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onProvinceChange(p.name);
                          onCityChange('', '');
                          onAreaChange(null, '', false);
                          setActiveSheet(null);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'hover:bg-neutral-50 text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {p.nameUr && (
                            <span className="text-xs text-neutral-400 font-serif">
                              ({p.nameUr})
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-sm text-neutral-500">
                    No provinces found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                )
              )}

              {/* 2. Cities list */}
              {activeSheet === 'city' && (
                filteredCities.length > 0 ? (
                  filteredCities.map((c) => {
                    const isSelected = c.name.toLowerCase() === city?.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onCityChange(c.name, c.courierCityCode);
                          onAreaChange(null, '', false);
                          setActiveSheet(null);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'hover:bg-neutral-50 text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-neutral-400" />
                          <span>{c.name}</span>
                          {c.courierCityCode && (
                            <span className="text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-mono font-bold">
                              {c.courierCityCode}
                            </span>
                          )}
                          {c.nameUr && (
                            <span className="text-xs text-neutral-400 font-serif">
                              ({c.nameUr})
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-sm text-neutral-500">
                    No cities found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                )
              )}

              {/* 3. Areas list */}
              {activeSheet === 'area' && (
                filteredAreas.length > 0 ? (
                  filteredAreas.map((a) => {
                    const isSelected = !isCustomArea && (a.id === areaId || a.name.toLowerCase() === areaName?.toLowerCase());
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          onAreaChange(a.id, a.name, false);
                          setActiveSheet(null);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'hover:bg-neutral-50 text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-neutral-400" />
                          <span>{a.name}</span>
                          {a.nameUr && (
                            <span className="text-xs text-neutral-400 font-serif">
                              ({a.nameUr})
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-sm text-neutral-500">
                      No verified area found matching &ldquo;{searchQuery}&rdquo; in {city}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onAreaChange(null, searchQuery, true);
                        onCustomAreaNameChange(searchQuery);
                        setActiveSheet(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 shadow-sm transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Use &ldquo;{searchQuery}&rdquo; as Custom Area
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Footer with Notice */}
            <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-center rounded-b-3xl">
              <p className="text-[11px] text-neutral-500">
                ⚠️ Starter verified zones &bull; Incomplete list actively extended by store admins.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
