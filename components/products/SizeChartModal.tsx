'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Ruler, Table, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import cloudinaryLoader from '@/lib/image-loader';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChartImageUrl?: string | null;
  categorySlug?: string;
}

export function SizeChartModal({
  isOpen,
  onClose,
  sizeChartImageUrl,
  categorySlug = 'clothes',
}: SizeChartModalProps) {
  const [viewMode, setViewMode] = useState<'image' | 'table'>(sizeChartImageUrl ? 'image' : 'table');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBags = categorySlug === 'bags';

  // Standard Pakistani measurement charts
  const clothesSizes = [
    { size: 'XS', chestIn: '36', lengthIn: '37', shoulderIn: '14.0', hipsIn: '38' },
    { size: 'S', chestIn: '38', lengthIn: '38', shoulderIn: '14.5', hipsIn: '40' },
    { size: 'M', chestIn: '40', lengthIn: '39', shoulderIn: '15.0', hipsIn: '43' },
    { size: 'L', chestIn: '43', lengthIn: '40', shoulderIn: '15.5', hipsIn: '46' },
    { size: 'XL', chestIn: '46', lengthIn: '41', shoulderIn: '16.5', hipsIn: '50' },
  ];

  const bagSizes = [
    { model: 'Everyday Tote', widthIn: '16.0', heightIn: '12.5', depthIn: '5.5', dropIn: '9.5' },
    { model: 'Crossbody Mini', widthIn: '8.5', heightIn: '6.0', depthIn: '2.5', dropIn: '22.0' },
    { model: 'Shoulder Bag', widthIn: '11.0', heightIn: '8.0', depthIn: '3.5', dropIn: '12.0' },
  ];

  const toCm = (inches: string) => (parseFloat(inches) * 2.54).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 z-10 animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-emerald-800" />
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                {isBags ? 'Dimensions & Capacity Guide' : 'Standard Pakistani Size Guide'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls: View Mode & Units */}
          <div className="px-6 py-3 bg-white border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-100 p-1 rounded-lg">
              {sizeChartImageUrl && (
                <button
                  type="button"
                  onClick={() => setViewMode('image')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors',
                    viewMode === 'image'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  )}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Chart Image
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors',
                  viewMode === 'table'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                <Table className="w-3.5 h-3.5" />
                Measurement Table
              </button>
            </div>

            {/* Units Toggle */}
            {viewMode === 'table' && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-medium">Unit:</span>
                <div className="flex bg-neutral-100 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setUnit('inches')}
                    className={cn(
                      'px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors',
                      unit === 'inches' ? 'bg-white text-emerald-900 shadow-xs' : 'text-neutral-600'
                    )}
                  >
                    Inches
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('cm')}
                    className={cn(
                      'px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors',
                      unit === 'cm' ? 'bg-white text-emerald-900 shadow-xs' : 'text-neutral-600'
                    )}
                  >
                    CM
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {viewMode === 'image' && sizeChartImageUrl ? (
              <div className="relative w-full h-[400px] sm:h-[500px]">
                <Image
                  src={sizeChartImageUrl}
                  alt="Product Size Chart"
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  loader={cloudinaryLoader}
                  className="object-contain rounded-xl border border-neutral-200"
                />
              </div>
            ) : isBags ? (
              /* Bags Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-neutral-200 rounded-xl overflow-hidden">
                  <thead className="bg-neutral-100 text-neutral-800 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 border-b">Silhouette</th>
                      <th className="p-3 border-b">Width ({unit})</th>
                      <th className="p-3 border-b">Height ({unit})</th>
                      <th className="p-3 border-b">Depth ({unit})</th>
                      <th className="p-3 border-b">Strap Drop ({unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-700">
                    {bagSizes.map((row) => (
                      <tr key={row.model} className="hover:bg-neutral-50">
                        <td className="p-3 font-semibold text-neutral-900">{row.model}</td>
                        <td className="p-3">{unit === 'inches' ? `${row.widthIn}"` : `${toCm(row.widthIn)} cm`}</td>
                        <td className="p-3">{unit === 'inches' ? `${row.heightIn}"` : `${toCm(row.heightIn)} cm`}</td>
                        <td className="p-3">{unit === 'inches' ? `${row.depthIn}"` : `${toCm(row.depthIn)} cm`}</td>
                        <td className="p-3">{unit === 'inches' ? `${row.dropIn}"` : `${toCm(row.dropIn)} cm`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Clothes Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-neutral-200 rounded-xl overflow-hidden">
                  <thead className="bg-neutral-100 text-neutral-800 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 border-b">Size</th>
                      <th className="p-3 border-b">Chest ({unit})</th>
                      <th className="p-3 border-b">Length ({unit})</th>
                      <th className="p-3 border-b">Shoulder ({unit})</th>
                      <th className="p-3 border-b">Hips ({unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-700">
                    {clothesSizes.map((row) => (
                      <tr key={row.size} className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-emerald-900 bg-emerald-50/50">{row.size}</td>
                        <td className="p-3">{unit === 'inches' ? `${row.chestIn}"` : `${toCm(row.chestIn)} cm`}</td>
                        <td className="p-3">{unit === 'inches' ? `${row.lengthIn}"` : `${toCm(row.lengthIn)} cm`}</td>
                        <td className="p-3">{unit === 'inches' ? `${row.shoulderIn}"` : `${toCm(row.shoulderIn)} cm`}</td>
                        <td className="p-3">{unit === 'inches' ? `${row.hipsIn}"` : `${toCm(row.hipsIn)} cm`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-500 space-y-1">
              <p>• <strong>Fitting Tip:</strong> All measurements are in {unit === 'inches' ? 'inches' : 'centimeters'} for ready garments. For loose or relaxed fit, please select one size up.</p>
              <p>• <strong>Exchange Guarantee:</strong> If the size does not fit comfortably, we offer a hassle-free 7-day nationwide size exchange.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
