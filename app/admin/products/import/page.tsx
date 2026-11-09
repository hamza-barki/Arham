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
  Edit3,
  ExternalLink,
  X,
  Check,
  ImageIcon,
  RefreshCw,
  LogIn,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { batchImportMarkazAction } from '@/app/actions/admin-products';
import { CATEGORIES } from '@/lib/constants';
import cloudinaryLoader from '@/lib/image-loader';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';

export interface ParsedProduct {
  name: string;
  supplierSku: string;
  costPrice: number;
  sellingPrice: number;
  sizes: string;
  colors: string;
  description: string;
  imageFileName: string;
  imageUrl?: string;
  images?: string[];
  categoryId: string;
}

interface ImportResult {
  success: boolean;
  inserted: number;
  errors: string[];
  importedProducts?: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    costPrice: number;
    imageUrl?: string;
  }>;
}

export default function ImportMarkazPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useAdminRole();

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProduct[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsingMessage, setParsingMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Edit modal state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ParsedProduct | null>(null);

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
        'Description':
          'Premium lawn fabric with traditional chunri print, organza neckline patch, and dyed cambric trouser.',
        'Image Filename': 'chunri-suit-1.jpg',
      },
      {
        'Product Name': 'Embroidered Net Formal Dupatta',
        'Supplier SKU': 'MKZ-DUP-205',
        'Wholesale Cost Price': 850,
        'Target Selling Price': 1650,
        'Sizes': 'Standard',
        'Colors': 'Gold / Ivory',
        'Description':
          'Four-sided embroidered border with sequin spray work. Perfect for festive events.',
        'Image Filename': 'net-dupatta-2.jpg',
      },
      {
        'Product Name': 'Embossed Leather Khussa - Royal Maroon',
        'Supplier SKU': 'MKZ-KHS-312',
        'Wholesale Cost Price': 1400,
        'Target Selling Price': 2750,
        'Sizes': '36, 37, 38, 39, 40, 41',
        'Colors': 'Maroon',
        'Description':
          'Handmade genuine leather khussa with cushioned sole and tilla embroidery.',
        'Image Filename': 'khussa-maroon.jpg',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Markaz Products');
    XLSX.writeFile(workbook, 'markaz_sample_catalog.xlsx');
  };

  // Core parser: processes Excel, ZIP, or both
  const processFiles = async (excel: File | null, zip: File | null) => {
    if (!excel && !zip) return;
    setParsing(true);
    setResult(null);
    setParsingMessage(null);

    try {
      let zipImageMap = new Map<string, string>();
      let allZipImages: Array<{ name: string; base: string; folder: string; dataUrl: string }> = [];
      let textDescription = '';
      let embeddedSpreadsheetBuffer: ArrayBuffer | null = null;

      // 1. Unpack ZIP if present
      if (zip) {
        const zipBuffer = await zip.arrayBuffer();
        const zipArchive = await JSZip.loadAsync(zipBuffer);
        const entries = Object.keys(zipArchive.files);

        for (const filename of entries) {
          const entry = zipArchive.files[filename];
          if (entry.dir || filename.includes('__MACOSX') || filename.startsWith('.')) {
            continue;
          }

          // Check if ZIP contains an embedded spreadsheet (if no excel uploaded separately)
          if (!excel && !embeddedSpreadsheetBuffer && /\.(xlsx|xls|csv)$/i.test(filename)) {
            embeddedSpreadsheetBuffer = await entry.async('arraybuffer');
          }

          // Check for text / details file
          if (!textDescription && /\.(txt|json)$/i.test(filename)) {
            try {
              const textContent = await entry.async('string');
              textDescription = textContent.trim();
            } catch {
              // Ignore read errors
            }
          }

          // Extract images
          if (/\.(jpg|jpeg|png|webp)$/i.test(filename)) {
            const parts = filename.split('/');
            const base = (parts.pop() || '').toLowerCase();
            const folder = parts.join('/');
            const base64Data = await entry.async('base64');
            const ext = base.endsWith('.png') ? 'png' : base.endsWith('.webp') ? 'webp' : 'jpeg';
            const dataUrl = `data:image/${ext};base64,${base64Data}`;

            zipImageMap.set(base, dataUrl);
            const withoutExt = base.replace(/\.[^/.]+$/, '');
            zipImageMap.set(withoutExt, dataUrl);

            allZipImages.push({
              name: filename,
              base,
              folder,
              dataUrl,
            });
          }
        }
      }

      // 2. Check if we have an Excel/CSV spreadsheet to parse
      const spreadsheetData = excel ? await excel.arrayBuffer() : embeddedSpreadsheetBuffer;

      if (spreadsheetData) {
        const workbook = XLSX.read(spreadsheetData, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

        const cleaned: ParsedProduct[] = rawRows.map((r) => {
          const name = String(
            r['Product Name'] || r['Title'] || r['Name'] || r['product_name'] || r['Item Name'] || ''
          ).trim();
          const supplierSku = String(
            r['Supplier SKU'] ||
              r['SKU'] ||
              r['sku'] ||
              r['Markaz SKU'] ||
              r['supplier_sku'] ||
              r['Product Code'] ||
              ''
          ).trim();
          const costPrice = Number(
            r['Wholesale Cost Price'] ||
              r['Cost Price'] ||
              r['Cost'] ||
              r['cost_price'] ||
              r['Wholesale Price'] ||
              0
          );
          const rawSellingPrice = Number(
            r['Target Selling Price'] ||
              r['Selling Price'] ||
              r['Retail Price'] ||
              r['Price'] ||
              r['selling_price'] ||
              0
          );
          const sellingPrice =
            rawSellingPrice > 0 ? rawSellingPrice : costPrice > 0 ? Math.round(costPrice * 1.4) : 0;
          const sizes = String(r['Sizes'] || r['Size'] || r['sizes'] || 'Free Size').trim();
          const colors = String(r['Colors'] || r['Color'] || r['colors'] || 'Standard').trim();
          const description = String(
            r['Description'] || r['Details'] || r['description'] || textDescription || ''
          ).trim();
          const imageFileName = String(
            r['Image Filename'] || r['Image'] || r['Photo'] || r['image'] || r['image_url'] || ''
          ).trim();

          // Match image from ZIP or URL
          let imageUrl: string | undefined = undefined;
          let productImages: string[] = [];

          if (imageFileName.startsWith('http')) {
            imageUrl = imageFileName;
            productImages = [imageFileName];
          } else if (imageFileName && zipImageMap.has(imageFileName.toLowerCase())) {
            imageUrl = zipImageMap.get(imageFileName.toLowerCase());
          } else if (supplierSku && zipImageMap.has(supplierSku.toLowerCase())) {
            imageUrl = zipImageMap.get(supplierSku.toLowerCase());
          } else if (supplierSku && zipImageMap.has(`${supplierSku.toLowerCase()}.jpg`)) {
            imageUrl = zipImageMap.get(`${supplierSku.toLowerCase()}.jpg`);
          }

          // Match all images containing supplier SKU
          if (supplierSku) {
            const matches = allZipImages.filter((img) =>
              img.base.includes(supplierSku.toLowerCase())
            );
            if (matches.length > 0) {
              productImages = matches.map((m) => m.dataUrl);
              if (!imageUrl) imageUrl = productImages[0];
            }
          }

          if (imageUrl && productImages.length === 0) {
            productImages = [imageUrl];
          }

          return {
            name,
            supplierSku,
            costPrice,
            sellingPrice,
            sizes,
            colors,
            description,
            imageFileName,
            imageUrl,
            images: productImages,
            categoryId: CATEGORIES[0].id,
          };
        });

        const valid = cleaned.filter((p) => p.name.length > 0);
        setParsedRows(valid);
        setParsingMessage(
          `Successfully loaded ${valid.length} product(s) from spreadsheet with ${allZipImages.length} photo(s) matched.`
        );
      } else if (zip && allZipImages.length > 0) {
        // 3. User uploaded ONLY a ZIP file (e.g. MZ2321200427WT-media.zip)
        const cleanZipSku = zip.name
          .replace(/[-_]media.*$/i, '')
          .replace(/\.zip$/i, '')
          .trim();

        const folders = Array.from(
          new Set(allZipImages.map((img) => img.folder).filter(Boolean))
        );

        let productsFromZip: ParsedProduct[] = [];

        if (folders.length > 1) {
          // Multiple products in separate folders
          productsFromZip = folders.map((folderName, idx) => {
            const folderImages = allZipImages.filter((img) => img.folder === folderName);
            const firstImg = folderImages[0];
            const cleanTitle = folderName.replace(/[-_]/g, ' ');
            return {
              name: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
              supplierSku: `${cleanZipSku}-${idx + 1}`,
              costPrice: 0,
              sellingPrice: 0,
              sizes: 'Free Size',
              colors: 'Standard',
              description: textDescription || `Markaz collection item imported from ${folderName}`,
              imageFileName: firstImg ? firstImg.base : '',
              imageUrl: firstImg ? firstImg.dataUrl : undefined,
              images: folderImages.map((img) => img.dataUrl),
              categoryId: CATEGORIES[0].id,
            };
          });
        } else {
          // Single product media zip (e.g. MZ2321200427WT-media.zip)
          let defaultTitle = cleanZipSku ? `Markaz Product ${cleanZipSku}` : 'Markaz Imported Product';
          let defaultDesc = textDescription || `Product media archive imported from ${zip.name}`;

          if (textDescription) {
            const lines = textDescription.split('\n').map((l) => l.trim()).filter(Boolean);
            if (lines.length > 0) {
              defaultTitle = lines[0].slice(0, 100);
              if (lines.length > 1) {
                defaultDesc = lines.slice(1).join('\n');
              }
            }
          }

          const allUrls = allZipImages.map((img) => img.dataUrl);

          productsFromZip = [
            {
              name: defaultTitle,
              supplierSku: cleanZipSku || 'MKZ-MEDIA',
              costPrice: 0,
              sellingPrice: 0,
              sizes: 'Free Size',
              colors: 'Standard',
              description: defaultDesc,
              imageFileName: allZipImages[0]?.base || '',
              imageUrl: allZipImages[0]?.dataUrl,
              images: allUrls,
              categoryId: CATEGORIES[0].id,
            },
          ];
        }

        setParsedRows(productsFromZip);
        setParsingMessage(
          `Extracted ${allZipImages.length} image(s) from ZIP archive! Products are listed below. Click "Edit Details" or update prices to import.`
        );
      } else {
        if (zip && allZipImages.length === 0) {
          alert(
            'The uploaded ZIP file does not contain any images (.jpg, .png, .webp) or spreadsheet (.xlsx, .csv).'
          );
        }
      }
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
      processFiles(excelFile, file);
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

  const handleUpdateCost = (index: number, newCost: number) => {
    const updated = [...parsedRows];
    updated[index].costPrice = newCost;
    if (updated[index].sellingPrice === 0 && newCost > 0) {
      updated[index].sellingPrice = Math.round(newCost * 1.4);
    }
    setParsedRows(updated);
  };

  const handleUpdateTitle = (index: number, newName: string) => {
    const updated = [...parsedRows];
    updated[index].name = newName;
    setParsedRows(updated);
  };

  // Open Edit Modal for a row
  const handleOpenEditModal = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...parsedRows[index] });
  };

  // Save changes from Edit Modal
  const handleSaveEditModal = () => {
    if (editingIndex === null || !editForm) return;
    const updated = [...parsedRows];
    updated[editingIndex] = { ...editForm };
    setParsedRows(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  // Reset all state to import another file
  const handleReset = () => {
    setExcelFile(null);
    setZipFile(null);
    setParsedRows([]);
    setResult(null);
    setParsingMessage(null);
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  // Execute Batch Import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    // Validate that all products have names and selling prices
    const missingPriceIndex = parsedRows.findIndex((p) => !p.sellingPrice || p.sellingPrice <= 0);
    if (missingPriceIndex !== -1) {
      const item = parsedRows[missingPriceIndex];
      alert(
        `Please set a valid Selling Price for "${item.name || 'Product ' + (missingPriceIndex + 1)}" before importing.`
      );
      handleOpenEditModal(missingPriceIndex);
      return;
    }

    const missingNameIndex = parsedRows.findIndex((p) => !p.name.trim());
    if (missingNameIndex !== -1) {
      alert(`Please enter a Product Name for row ${missingNameIndex + 1} before importing.`);
      handleOpenEditModal(missingNameIndex);
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const payload = parsedRows.map((r) => ({
        name: r.name,
        supplierSku: r.supplierSku,
        costPrice: r.costPrice,
        sellingPrice: r.sellingPrice,
        categoryId: r.categoryId,
        sizes: r.sizes,
        colors: r.colors,
        description: r.description,
        imageUrl: r.imageUrl,
        images: r.images,
      }));

      const res = await batchImportMarkazAction(payload);
      setResult(res);
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
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
          Upload Markaz media ZIP archives or Excel sheets (`.xlsx`, `.csv`). You can edit every product detail before and after uploading.
        </p>
      </div>

      {/* Admin Auth Notice if not logged in */}
      {(!user || role === 'customer') && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-amber-700 shrink-0" />
            <div className="text-xs text-amber-950">
              <span className="font-bold">Admin Login Zaroori Hai: </span>
              Products ko database mein import karne ke liye aapka Admin account (<code>admin@arhamcollection.pk</code>) se sign in hona zaroori hai.
            </div>
          </div>
          <Link
            href="/login?redirect=/admin/products/import"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login as Admin</span>
          </Link>
        </div>
      )}

      {/* Experimental Notice Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-950 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-900 uppercase tracking-wide text-xs bg-amber-200/80 px-2 py-0.5 rounded-md">
              Status: Live Importer Ready
            </span>
            <span className="text-[11px] text-amber-800 font-semibold">
              Supports Direct ZIP Media and Excel Exports
            </span>
          </div>
          <p className="leading-relaxed">
            Upload either a Markaz media ZIP archive (like <code>MZ...-media.zip</code>) or an Excel export. Products and pictures will automatically appear below with full editing controls.
          </p>
        </div>
      </div>

      {/* Upload Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Excel File (Optional) */}
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
              <div className="text-sm font-bold text-emerald-900 truncate max-w-xs">
                {excelFile.name}
              </div>
              <div className="text-xs text-emerald-700 font-medium">
                {(excelFile.size / 1024).toFixed(1)} KB • Click to change
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-bold text-neutral-800">1. Markaz Excel / CSV</div>
              <p className="text-xs text-neutral-500 max-w-xs">
                Upload .xlsx or .csv containing Product Name, SKU, Cost Price, Selling Price.
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
              <div className="text-sm font-bold text-indigo-900 truncate max-w-xs">
                {zipFile.name}
              </div>
              <div className="text-xs text-indigo-700 font-medium">
                {(zipFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-bold text-neutral-800">2. Product Media ZIP</div>
              <p className="text-xs text-neutral-500 max-w-xs">
                Add <code>MZ...-media.zip</code> archive. Products and photos will load automatically!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Dropshipping Automation Tip */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Automated Net Margin Calculation:</span>
          <p>
            Estimated margins automatically deduct supplier wholesale cost, courier delivery buffer (Rs. 150), and COD return reserve (Rs. 50).
          </p>
        </div>
      </div>

      {/* Parsing indicator */}
      {parsing && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-800 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-800">
            Unpacking ZIP archive and preparing product catalog...
          </p>
          <p className="text-xs text-neutral-500 mt-1">Extracting high-resolution photos and details</p>
        </div>
      )}

      {/* Parsing feedback message */}
      {parsingMessage && !parsing && !result && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-indigo-900 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{parsingMessage}</span>
          </div>
          <button
            onClick={() => setParsingMessage(null)}
            className="text-indigo-600 hover:text-indigo-900 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PREVIEW TABLE OF EXTRACTED / PARSED PRODUCTS */}
      {parsedRows.length > 0 && !parsing && !result?.success && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-neutral-900">
                Catalog Preview ({parsedRows.length} {parsedRows.length === 1 ? 'Product' : 'Products'} Ready)
              </h2>
              <p className="text-xs text-neutral-500">
                You can edit titles, prices, and details below. Click <strong>Edit Details</strong> for full variant and category editing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition"
              >
                Clear
              </button>

              <button
                onClick={handleExecuteImport}
                disabled={importing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading & Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Save ({parsedRows.length} Products)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/75 text-neutral-600 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4 min-w-[220px]">Product Title & SKU</th>
                  <th className="py-3 px-4">Wholesale Cost</th>
                  <th className="py-3 px-4">Selling Price (PKR)</th>
                  <th className="py-3 px-4">Est. Net Margin</th>
                  <th className="py-3 px-4">Category & Variants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {parsedRows.map((row, idx) => {
                  const cost = Number(row.costPrice) || 0;
                  const sell = Number(row.sellingPrice) || 0;
                  const netProfit = sell > 0 ? sell - (cost + 150 + 50) : 0;
                  const marginPct = sell > 0 ? Math.round((netProfit / sell) * 100) : 0;
                  const categoryName =
                    CATEGORIES.find((c) => c.id === row.categoryId)?.name || 'Default';

                  const needsPrice = sell <= 0;

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-neutral-50/80 transition ${
                        needsPrice ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => handleOpenEditModal(idx)}
                          className="relative w-14 h-14 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200 shrink-0 cursor-pointer group"
                          title="Click to view/change photos"
                        >
                          {row.imageUrl ? (
                            <Image
                              src={row.imageUrl}
                              alt={row.name}
                              fill
                              unoptimized={row.imageUrl.startsWith('data:')}
                              loader={cloudinaryLoader}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-medium">
                              <ImageIcon className="w-5 h-5 text-neutral-300" />
                            </div>
                          )}

                          {row.images && row.images.length > 1 && (
                            <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              +{row.images.length - 1}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Product Title & SKU */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleUpdateTitle(idx, e.target.value)}
                          placeholder="Enter product title"
                          className="w-full px-2 py-1 rounded-lg border border-neutral-200 font-bold text-neutral-900 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                        />
                        <div className="text-[11px] text-indigo-700 font-mono font-bold mt-1 flex items-center gap-1.5">
                          <span>SKU: {row.supplierSku || 'NO-SKU'}</span>
                        </div>
                      </td>

                      {/* Wholesale Cost Input */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-neutral-400 text-[11px]">Rs.</span>
                          <input
                            type="number"
                            value={cost || ''}
                            placeholder="0"
                            onChange={(e) => handleUpdateCost(idx, Number(e.target.value))}
                            className="w-20 px-2 py-1 rounded-lg border border-neutral-300 font-bold text-xs"
                          />
                        </div>
                      </td>

                      {/* Selling Price Input */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-neutral-500 font-bold text-xs">Rs.</span>
                          <input
                            type="number"
                            value={sell || ''}
                            placeholder="Required"
                            onChange={(e) => handleUpdatePrice(idx, Number(e.target.value))}
                            className={`w-24 px-2 py-1 rounded-lg border font-bold text-xs ${
                              needsPrice
                                ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-300/60'
                                : 'border-neutral-300 text-neutral-900'
                            }`}
                          />
                        </div>
                        {needsPrice && (
                          <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                            Required to import
                          </div>
                        )}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4">
                        {sell > 0 ? (
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
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Category & Variants */}
                      <td className="py-3 px-4 text-neutral-600 text-[11px]">
                        <div className="font-semibold text-neutral-800">{categoryName}</div>
                        <div className="text-neutral-500 text-[10px]">
                          {row.sizes} • {row.colors}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                            title="Edit details (sizes, colors, description, category)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Upload Action Bar */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
            <div className="text-xs text-neutral-600">
              Total products: <strong>{parsedRows.length}</strong>
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={importing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading & Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Import All ({parsedRows.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS & POST-UPLOAD EDIT OPTIONS (Task 2) */}
      {result && result.success && (
        <div className="bg-white rounded-2xl border-2 border-emerald-300 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-emerald-950">
                Successfully Uploaded & Imported {result.inserted} Product(s)!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1">
                Your Markaz products are now saved in the catalog. You can edit any product below, view the catalog, or import another file.
              </p>
            </div>
          </div>

          {/* If single product was imported (e.g. from MZ...-media.zip) */}
          {result.importedProducts && result.importedProducts.length === 1 && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative w-16 h-16 rounded-xl bg-white border border-emerald-200 overflow-hidden shrink-0">
                  {result.importedProducts[0].imageUrl ? (
                    <Image
                      src={result.importedProducts[0].imageUrl}
                      alt={result.importedProducts[0].name}
                      fill
                      unoptimized={result.importedProducts[0].imageUrl.startsWith('data:')}
                      loader={cloudinaryLoader}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 text-sm">
                    {result.importedProducts[0].name}
                  </h3>
                  <div className="text-xs text-indigo-700 font-mono font-bold mt-0.5">
                    SKU: {result.importedProducts[0].sku || 'N/A'}
                  </div>
                  <div className="text-xs font-bold text-neutral-700 mt-0.5">
                    Rs. {result.importedProducts[0].price.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Direct Edit Button */}
              <Link
                href={`/admin/products/${result.importedProducts[0].id}/edit`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Open & Edit Product Now</span>
              </Link>
            </div>
          )}

          {/* If multiple products were imported */}
          {result.importedProducts && result.importedProducts.length > 1 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Imported Products ({result.importedProducts.length})
              </h3>
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                {result.importedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-white hover:bg-neutral-50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            unoptimized={p.imageUrl.startsWith('data:')}
                            loader={cloudinaryLoader}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px]">
                            Pic
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900 text-xs">{p.name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {p.sku} • Rs. {p.price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Product</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons footer */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-200">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-xs shadow-xs transition"
            >
              <span>View in Product Catalog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
              <span>Import Another File</span>
            </button>
          </div>
        </div>
      )}

      {/* ERROR FEEDBACK */}
      {result && !result.success && (
        <div className="p-6 rounded-2xl border bg-rose-50 border-rose-200 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="text-sm font-black text-rose-900">Import Failed</h3>
          </div>

          <div className="space-y-3">
            {result.errors.map((err, i) => {
              const isAuthError =
                err.toLowerCase().includes('unauthorized') ||
                err.toLowerCase().includes('admin authentication required') ||
                err.toLowerCase().includes('forbidden');

              return (
                <div key={i} className="text-xs text-rose-800 space-y-2">
                  <p className="font-semibold">{err}</p>

                  {isAuthError && (
                    <div className="bg-white rounded-2xl border border-rose-200 p-4 space-y-3 shadow-2xs text-neutral-800">
                      <div className="flex items-start gap-2.5">
                        <KeyRound className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-sm text-neutral-900">
                            Admin Account Login Required
                          </div>
                          <p className="text-xs text-neutral-600 mt-0.5">
                            Markaz products import aur database mein save karne ke liye aapko Admin / Manager account se login hona zaroori hai.
                          </p>
                        </div>
                      </div>

                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 font-mono text-xs space-y-1">
                        <div>
                          Email: <strong className="text-neutral-900">admin@arhamcollection.pk</strong>
                        </div>
                        <div>
                          Password: <strong className="text-neutral-900">AdminPK@2026!</strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Link
                          href="/login?redirect=/admin/products/import"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Login as Admin Now</span>
                        </Link>
                        <span className="text-[11px] text-neutral-500">
                          (Login karne ke baad aap wapas isi page par aa jayenge)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT MODAL FOR PRODUCT DETAILS (Task 2) */}
      {editingIndex !== null && editForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">Edit Product Details</h3>
                  <p className="text-xs text-neutral-500">
                    Customize titles, prices, categories, and photos before importing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingIndex(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Product Title */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Royal Embroidered 3-Piece Stitched Suit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* SKU & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Supplier SKU</label>
                  <input
                    type="text"
                    value={editForm.supplierSku}
                    onChange={(e) => setEditForm({ ...editForm, supplierSku: e.target.value })}
                    placeholder="e.g. MKZ-CHN-101"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Store Category</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Margin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Wholesale Cost Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={editForm.costPrice || ''}
                    placeholder="0"
                    onChange={(e) => {
                      const cost = Number(e.target.value);
                      const sell =
                        editForm.sellingPrice === 0 && cost > 0
                          ? Math.round(cost * 1.4)
                          : editForm.sellingPrice;
                      setEditForm({ ...editForm, costPrice: cost, sellingPrice: sell });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono font-bold text-xs"
                  />
                  <div className="text-[10px] text-neutral-500 mt-1">Wholesale supplier price</div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Target Selling Price (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editForm.sellingPrice || ''}
                    placeholder="e.g. 3850"
                    onChange={(e) =>
                      setEditForm({ ...editForm, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono font-bold text-xs"
                  />
                  {/* Live Profit Preview */}
                  {editForm.sellingPrice > 0 && (
                    <div className="text-[10px] font-bold text-emerald-800 mt-1">
                      Est. Profit: Rs.{' '}
                      {editForm.sellingPrice - (editForm.costPrice + 150 + 50)}{' '}
                      (Buffer Rs. 200 included)
                    </div>
                  )}
                </div>
              </div>

              {/* Sizes & Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Sizes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.sizes}
                    onChange={(e) => setEditForm({ ...editForm, sizes: e.target.value })}
                    placeholder="e.g. S, M, L, XL or Free Size"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Colors</label>
                  <input
                    type="text"
                    value={editForm.colors}
                    onChange={(e) => setEditForm({ ...editForm, colors: e.target.value })}
                    placeholder="e.g. Mustard Yellow, Maroon"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Fabric details, stitching details, styling notes..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Photos Gallery from ZIP */}
              {editForm.images && editForm.images.length > 0 && (
                <div>
                  <label className="block font-bold text-neutral-800 mb-1.5">
                    Extracted Photos ({editForm.images.length}) • Click thumbnail to choose primary
                    image
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {editForm.images.map((imgUrl, i) => {
                      const isPrimary = editForm.imageUrl === imgUrl;
                      return (
                        <div
                          key={i}
                          onClick={() => setEditForm({ ...editForm, imageUrl: imgUrl })}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                            isPrimary
                              ? 'border-emerald-600 ring-2 ring-emerald-500/50 scale-105'
                              : 'border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <Image
                            src={imgUrl}
                            alt={`Photo ${i + 1}`}
                            fill
                            unoptimized={imgUrl.startsWith('data:')}
                            loader={cloudinaryLoader}
                            className="object-cover"
                          />
                          {isPrimary && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 border-t border-neutral-200 pt-3">
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditModal}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
