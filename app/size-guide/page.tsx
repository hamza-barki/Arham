'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ruler, Sparkles, Check, HelpCircle } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';

type UnitType = 'inches' | 'cm';
type TabType = 'clothes' | 'bags';

export default function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState<TabType>('clothes');
  const [unit, setUnit] = useState<UnitType>('inches');

  const unitFactor = unit === 'inches' ? 1 : 2.54;
  const unitLabel = unit === 'inches' ? 'in' : 'cm';

  const formatMeasure = (val: number) => {
    return (val * unitFactor).toFixed(unit === 'inches' ? 1 : 0);
  };

  const clothesSizes = [
    { size: 'Small (S)', chest: 36, waist: 32, hips: 38, length: 39, shoulder: 14.0 },
    { size: 'Medium (M)', chest: 39, waist: 35, hips: 41, length: 40, shoulder: 14.5 },
    { size: 'Large (L)', chest: 42, waist: 38, hips: 44, length: 41, shoulder: 15.5 },
    { size: 'X-Large (XL)', chest: 45, waist: 41, hips: 48, length: 42, shoulder: 16.5 },
  ];

  const bagSizes = [
    {
      name: 'Signature Everyday Leather Tote',
      capacity: 'Fits up to 15" laptop, notebook, bottle & cosmetic pouch',
      height: 12.5,
      width: 16.0,
      depth: 5.5,
      handleDrop: 9.5,
    },
    {
      name: 'Mini Moon Quilted Crossbody',
      capacity: 'Fits all iPhone Pro Max models, cardholder, keys & lipstick',
      height: 6.5,
      width: 8.5,
      depth: 3.0,
      handleDrop: 22.0, // strap length
    },
    {
      name: 'Structured Shoulder Bag',
      capacity: 'Medium everyday essentials, sunglasses case & wallet',
      height: 8.0,
      width: 11.0,
      depth: 4.0,
      handleDrop: 10.0,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <nav className="flex items-center justify-center text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Size Guide</span>
          </nav>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold mb-3">
            <Ruler className="w-3.5 h-3.5 text-amber-500" />
            Accurate Fit Guarantee
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
            Comprehensive Sizing Guide
          </h1>
          <p className="text-neutral-600 text-sm mt-2">
            Tailored specifically for standard Pakistani silhouettes and bag volume capacities.
          </p>
        </div>

        {/* Tab & Unit Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/80 shadow-sm mb-8">
          
          {/* Tab Switcher */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('clothes')}
              className={`flex-1 sm:flex-initial px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'clothes'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Clothes & Kurtas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bags')}
              className={`flex-1 sm:flex-initial px-6 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bags'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Leather Bags & Clutches
            </button>
          </div>

          {/* Unit Switcher */}
          <div className="flex items-center gap-2 text-xs font-medium self-end sm:self-auto">
            <span className="text-neutral-500">Measurements in:</span>
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                type="button"
                onClick={() => setUnit('inches')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  unit === 'inches'
                    ? 'bg-emerald-950 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  unit === 'cm'
                    ? 'bg-emerald-950 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>
        </div>

        {/* Clothes Sizing Table */}
        {activeTab === 'clothes' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-10 overflow-hidden">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold text-neutral-950">
                Stitched Apparel & Pret Chart
              </h2>
              <p className="text-neutral-500 text-xs mt-1">
                Measurements shown are exact garment finished dimensions ({unitLabel}). For standard comfort fit, add 1-2 inches to your body measurements.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 rounded-l-xl">Size</th>
                    <th className="py-3 px-4">Chest ({unitLabel})</th>
                    <th className="py-3 px-4">Waist ({unitLabel})</th>
                    <th className="py-3 px-4">Hips ({unitLabel})</th>
                    <th className="py-3 px-4">Shirt Length ({unitLabel})</th>
                    <th className="py-3 px-4 rounded-r-xl">Shoulder ({unitLabel})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {clothesSizes.map((row) => (
                    <tr key={row.size} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-emerald-950">{row.size}</td>
                      <td className="py-4 px-4">{formatMeasure(row.chest)}</td>
                      <td className="py-4 px-4">{formatMeasure(row.waist)}</td>
                      <td className="py-4 px-4">{formatMeasure(row.hips)}</td>
                      <td className="py-4 px-4">{formatMeasure(row.length)}</td>
                      <td className="py-4 px-4">{formatMeasure(row.shoulder)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* How to measure tips */}
            <div className="mt-8 pt-6 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-600">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                <strong className="text-neutral-900 block mb-1">1. Chest Measurement:</strong>
                Measure around the fullest part of your bust while keeping the measuring tape comfortably loose and horizontal.
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                <strong className="text-neutral-900 block mb-1">2. Shirt Length:</strong>
                Measure straight down from the highest point of the shoulder seam to the bottom hemline.
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                <strong className="text-neutral-900 block mb-1">3. Shoulders:</strong>
                Measure across the back from the edge of one shoulder bone across to the edge of the other.
              </div>
            </div>
          </div>
        )}

        {/* Bags Sizing Table */}
        {activeTab === 'bags' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-10 overflow-hidden">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold text-neutral-950">
                Leather Bag Dimensions & Capacity
              </h2>
              <p className="text-neutral-500 text-xs mt-1">
                Outer dimensions ({unitLabel}) measured at the widest points.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 rounded-l-xl">Silhouette</th>
                    <th className="py-3 px-4">Capacity / Fits</th>
                    <th className="py-3 px-4">Height ({unitLabel})</th>
                    <th className="py-3 px-4">Width ({unitLabel})</th>
                    <th className="py-3 px-4">Depth ({unitLabel})</th>
                    <th className="py-3 px-4 rounded-r-xl">Handle / Strap ({unitLabel})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {bagSizes.map((row) => (
                    <tr key={row.name} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-emerald-950">{row.name}</td>
                      <td className="py-4 px-4 text-neutral-600 text-xs">{row.capacity}</td>
                      <td className="py-4 px-4">{formatMeasure(row.height)}</td>
                      <td className="py-4 px-4">{formatMeasure(row.width)}</td>
                      <td className="py-4 px-4">{formatMeasure(row.depth)}</td>
                      <td className="py-4 px-4">{formatMeasure(row.handleDrop)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
