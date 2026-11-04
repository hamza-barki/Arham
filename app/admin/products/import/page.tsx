'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Download,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { batchImportMarkazAction } from '@/app/actions/admin-products';
import cloudinaryLoader from '@/lib/image-loader';

interface ParsedProduct {
  name: string;
  supplierSku: string;
  costPrice: number;
  sellingPrice: number;
  sizes: string;
  colors: string;
  description: string;
  imageFileName: string;
  imageUrl?: string;
}

export default function ImportMarkazPage() {
  const router = useRouter();

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProduct[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; inserted: number; errors: string[] } | null>(
    null
  );

  const excelInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Download sample Excel template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Product Name': 'Chunri Print Lawn 3-Piece Stitched Suit',
        'Supplier SKU': 'MKZ-CHN-101',
        'Wholesale Cost Price': 2200,
        'Target Selling Price': 3850,
        'Sizes': 'S, M, L, XL',
        'Colors': 'Mustard Yellow',
        'Description': 'Premium lawn fabric with traditional chunri print, organza neckline patch, and dyed cambric trouser.',
        'Image Filename': 'chunri-suit-1.jpg',
      },
      {
        'Product Name': 'Embroidered Net Formal Dupatta',
        'Supplier SKU': 'MKZ-DUP-205',
        'Wholesale Cost Price': 850,
        'Target Selling Price': 1650,
        'Sizes': 'Standard',
        'Colors': 'Gold / Ivory',
        'Description': 'Four-sided embroidered border with sequin spray work. Perfect for festive events.',
        'Image Filename': 'net-dupatta-2.jpg',
      },
      {
        'Product Name': 'Embossed Leather Khussa - Royal Maroon',
        'Supplier SKU': 'MKZ-KHS-312',
        'Wholesale Cost Price': 1400,
        'Target Selling Price': 2750,
        'Sizes': '36, 37, 38, 39, 40, 41',
        'Colors': 'Maroon',
        'Description': 'Handmade genuine leather khussa with cushioned sole and tilla embroidery.',
        'Image Filename': 'khussa-maroon.jpg',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Markaz Products');
    XLSX.writeFile(workbook, 'markaz_sample_catalog.xlsx');
  };

  // Process Excel and optional ZIP
  const processFiles = async (excel: File, zip: File | null) => {
    setParsing(true);
    setResult(null);

    try {
      // 1. Unpack ZIP images if present
      const zipImageMap = new Map<string, string>();
      if (zip) {
        const zipBuffer = await zip.arrayBuffer();
        const zipArchive = await JSZip.loadAsync(zipBuffer);
        const entries = Object.keys(zipArchive.files);

        for (const filename of entries) {
          const entry = zipArchive.files[filename];
          if (!entry.dir && /\.(jpg|jpeg|png|webp)$/i.test(filename)) {
            const base = filename.split('/').pop()?.toLowerCase();
            if (base) {
              const base64Data = await entry.async('base64');
              const ext = base.endsWith('.png') ? 'png' : base.endsWith('.webp') ? 'webp' : 'jpeg';
              zipImageMap.set(base, `data:image/${ext};base64,${base64Data}`);
            }
          }
        }
      }

      // 2. Read and parse Excel file
      const excelBuffer = await excel.arrayBuffer();
      const workbook = XLSX.read(excelBuffer, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

      const cleaned: ParsedProduct[] = rawRows.map((r) => {
        // Find values matching flexible keys
        const name = r['Product Name'] || r['Title'] || r['Name'] || r['product_name'] || '';
        const supplierSku =
          r['Supplier SKU'] || r['SKU'] || r['sku'] || r['Markaz SKU'] || r['supplier_sku'] || '';
        const costPrice = Number(
          r['Wholesale Cost Price'] || r['Cost Price'] || r['Cost'] || r['cost_price'] || 0
        );
        const rawSellingPrice = Number(
          r['Target Selling Price'] || r['Selling Price'] || r['Retail Price'] || r['Price'] || 0
        );
        // Default margin to 40% over wholesale if selling price was not set
        const sellingPrice = rawSellingPrice > 0 ? rawSellingPrice : Math.round(costPrice * 1.4);
        const sizes = r['Sizes'] || r['Size'] || r['sizes'] || 'Free Size';
        const colors = r['Colors'] || r['Color'] || r['colors'] || 'Default';
        const description = r['Description'] || r['Details'] || r['description'] || '';
        const imageFileName =
          r['Image Filename'] || r['Image'] || r['Photo'] || r['image'] || r['image_url'] || '';

        // Match with ZIP or remote URL
        let imageUrl: string | undefined = undefined;
        if (imageFileName.startsWith('http')) {
          imageUrl = imageFileName;
        } else if (imageFileName && zipImageMap.has(imageFileName.toLowerCase())) {
          imageUrl = zipImageMap.get(imageFileName.toLowerCase());
        } else if (supplierSku && zipImageMap.has(`${supplierSku.toLowerCase()}.jpg`)) {
          imageUrl = zipImageMap.get(`${supplierSku.toLowerCase()}.jpg`);
        }

        return {
          name: String(name).trim(),
          supplierSku: String(supplierSku).trim(),
          costPrice,
          sellingPrice,
          sizes: String(sizes).trim(),
          colors: String(colors).trim(),
          description: String(description).trim(),
          imageFileName: String(imageFileName).trim(),
          imageUrl,
        };
      });

      setParsedRows(cleaned.filter((p) => p.name.length > 0));
    } catch (err: any) {
      alert('Error parsing uploaded files: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setExcelFile(file);
      processFiles(file, zipFile);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setZipFile(file);
      if (excelFile) {
        processFiles(excelFile, file);
      }
    }
  };

  const handleRemoveRow = (index: number) => {
    setParsedRows(parsedRows.filter((_, i) => i !== index));
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    const updated = [...parsedRows];
    updated[index].sellingPrice = newPrice;
    setParsedRows(updated);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setResult(null);

    try {
      const payload = parsedRows.map((r) => ({
        name: r.name,
        supplierSku: r.supplierSku,
        costPrice: r.costPrice,
        sellingPrice: r.sellingPrice,
        sizes: r.sizes,
        colors: r.colors,
        description: r.description,
        imageUrl: r.imageUrl,
      }));

      const res = await batchImportMarkazAction(payload);
      setResult(res);

      if (res.success && res.errors.length === 0) {
        setTimeout(() => {
          router.push('/admin/products');
        }, 2000);
      }
    } catch (err: any) {
      setResult({
        success: false,
        inserted: 0,
        errors: [err.message || 'Import failed'],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-600 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>

        <button
          onClick={handleDownloadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>Download Sample Template (.xlsx)</span>
        </button>
      </div>

      {/* Header */}
      <div className="border-b border-neutral-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-800" />
          Import Markaz Supplier Catalog
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Upload Markaz wholesale Excel sheet (`.xlsx`, `.csv`) and optional image ZIP archive to automatically populate product titles, supplier SKUs, costs, margins, and galleries.
        </p>
      </div>

      {/* Untested Notice Banner (Requirement 9) */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-950 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-900 uppercase tracking-wide text-xs bg-amber-200/80 px-2 py-0.5 rounded-md">
              Status: UNTESTED with Live Markaz Export
            </span>
            <span className="text-[11px] text-amber-800 font-semibold">Column Mapping & Sample Verification Required</span>
          </div>
          <p className="leading-relaxed">
            This Markaz catalog parser is marked as experimental until verified against a real production CSV/Excel export from the Markaz Supplier App. Please review the column mappings and live preview table below before committing any imported items to the catalog database.
          </p>
        </div>
      </div>

      {/* Upload Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Excel File */}
        <div
          onClick={() => excelInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${
            excelFile
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-neutral-300 hover:border-emerald-700 bg-white'
          }`}
        >
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleExcelChange}
            className="hidden"
          />
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
              excelFile ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          {excelFile ? (
            <div className="space-y-1">
              <div className="text-sm font-bold text-emerald-900 truncate max-w-xs">{excelFile.name}</div>
              <div className="text-xs text-emerald-700 font-medium">
                {(excelFile.size / 1024).toFixed(1)} KB • Click to change
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-bold text-neutral-800">1. Select Markaz Excel / CSV</div>
              <p className="text-xs text-neutral-500 max-w-xs">
                Supports .xlsx or .csv containing Product Name, SKU, Cost Price, Selling Price.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Image ZIP Archive */}
        <div
          onClick={() => zipInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${
            zipFile
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-neutral-300 hover:border-indigo-600 bg-white'
          }`}
        >
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            onChange={handleZipChange}
            className="hidden"
          />
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
              zipFile ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            <FolderArchive className="w-6 h-6" />
          </div>
          {zipFile ? (
            <div className="space-y-1">
              <div className="text-sm font-bold text-indigo-900 truncate max-w-xs">{zipFile.name}</div>
              <div className="text-xs text-indigo-700 font-medium">
                {(zipFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-bold text-neutral-800">2. Select Image ZIP (Optional)</div>
              <p className="text-xs text-neutral-500 max-w-xs">
                Matches product photos matching image filenames or supplier SKUs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Informative Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Pakistani Dropshipping Automation Tip:</span>
          <p>
            The system automatically populates supplier wholesale cost and sets the supplier delivery buffer to Rs. 150 + COD buffer Rs. 50 so your estimated net margins reflect real Pakistani courier economics.
          </p>
        </div>
      </div>

      {/* Parsing indicator */}
      {parsing && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-800 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-700">Reading spreadsheets and matching images...</p>
        </div>
      )}

      {/* Preview Table of Parsed Products */}
      {parsedRows.length > 0 && !parsing && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-neutral-900">
                Catalog Preview ({parsedRows.length} Products Found)
              </h2>
              <p className="text-xs text-neutral-500">
                Review extracted titles, matched photos, and selling prices before importing.
              </p>
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={importing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Import ({parsedRows.length} Products)</span>
                </>
              )}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/75 text-neutral-600 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Product & SKU</th>
                  <th className="py-3 px-4">Wholesale Cost</th>
                  <th className="py-3 px-4">Selling Price (PKR)</th>
                  <th className="py-3 px-4">Est. Net Margin</th>
                  <th className="py-3 px-4">Variants</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {parsedRows.map((row, idx) => {
                  const cost = row.costPrice || 0;
                  const sell = row.sellingPrice || 0;
                  const netProfit = sell - (cost + 150 + 50);
                  const marginPct = sell > 0 ? Math.round((netProfit / sell) * 100) : 0;

                  return (
                    <tr key={idx} className="hover:bg-neutral-50/80 transition">
                      {/* Photo */}
                      <td className="py-3 px-4">
                        <div className="relative w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden border border-neutral-200 shrink-0">
                          {row.imageUrl ? (
                            <Image
                              src={row.imageUrl}
                              alt={row.name}
                              fill
                              sizes="48px"
                              loader={cloudinaryLoader}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-medium">
                              No Pic
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Product & SKU */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-neutral-900 truncate">{row.name}</div>
                        <div className="text-[11px] text-indigo-700 font-mono font-bold mt-0.5">
                          {row.supplierSku || 'NO-SKU'}
                        </div>
                      </td>

                      {/* Wholesale Cost */}
                      <td className="py-3 px-4 font-mono font-bold text-neutral-700">
                        Rs. {cost.toLocaleString()}
                      </td>

                      {/* Selling Price Input */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-neutral-500 font-bold">Rs.</span>
                          <input
                            type="number"
                            value={sell}
                            onChange={(e) => handleUpdatePrice(idx, Number(e.target.value))}
                            className="w-24 px-2 py-1 rounded-lg border border-neutral-300 font-bold text-xs"
                          />
                        </div>
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            marginPct >= 30
                              ? 'bg-emerald-100 text-emerald-800'
                              : marginPct > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Rs. {netProfit} ({marginPct}%)
                        </span>
                      </td>

                      {/* Variants */}
                      <td className="py-3 px-4 text-neutral-600 text-[11px]">
                        <div>Sizes: {row.sizes}</div>
                        <div>Color: {row.colors}</div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Result Feedback */}
      {result && (
        <div
          className={`p-5 rounded-2xl border ${
            result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <h3
              className={`text-sm font-bold ${
                result.success ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              {result.success
                ? `Successfully imported ${result.inserted} products!`
                : 'Import failed'}
            </h3>
          </div>

          {result.errors.length > 0 && (
            <ul className="text-xs text-rose-700 list-disc list-inside mt-2 space-y-1">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          {result.success && (
            <p className="text-xs text-emerald-700 mt-2">
              Redirecting you to the product catalog in 2 seconds...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

