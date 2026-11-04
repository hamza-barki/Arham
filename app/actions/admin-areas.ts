'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { areaSchema, csvAreaRowSchema, AreaInput, CsvAreaRow } from '@/lib/validations/area';
import {
  STARTER_PROVINCES,
  STARTER_CITIES,
  STARTER_AREAS,
  getAllAdminAreas,
  addAreaRecord,
  updateAreaRecord,
  toggleAreaRecordActive,
  deleteAreaRecord,
  parseAreaCsv,
  AdminAreaItem,
} from '@/lib/geo';

// Mock in-memory orders needing area review (persisted across server action invocations in memory)
const inMemoryReviewOrders: Array<{
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  province: string;
  city: string;
  customAreaName: string;
  addressLine: string;
  landmark?: string;
  createdAt: string;
  totalAmount: number;
}> = [
  {
    id: 'ord-review-mock-1',
    orderNumber: 'PK-88401',
    customerName: 'Zainab Tariq',
    phone: '03214567890',
    province: 'Punjab',
    city: 'Lahore',
    customAreaName: 'Central Park Housing Scheme Block D',
    addressLine: 'Plot 412, Lane 5, Sector D',
    landmark: 'Opposite Central Park Medical College',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    totalAmount: 3450,
  },
  {
    id: 'ord-review-mock-2',
    orderNumber: 'PK-88402',
    customerName: 'Kamran Ashraf',
    phone: '03009876543',
    province: 'Sindh',
    city: 'Karachi',
    customAreaName: 'Saadi Town Block 4',
    addressLine: 'House 89, Street 12',
    landmark: 'Near Saadi Garden Gate',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    totalAmount: 5200,
  },
];

/**
 * Fetch all areas for the admin screen
 */
export async function getAdminAreasAction(filters?: {
  provinceName?: string;
  cityName?: string;
  search?: string;
  activeOnly?: boolean;
}): Promise<{ success: boolean; data: AdminAreaItem[]; error?: string }> {
  try {
    const areas = await getAllAdminAreas(filters);
    return { success: true, data: areas };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || 'Failed to fetch areas' };
  }
}

/**
 * Create a new area
 */
export async function createAreaAction(input: {
  provinceName: string;
  cityName: string;
  name: string;
  nameUr?: string;
  active?: boolean;
}): Promise<{ success: boolean; error?: string; area?: any }> {
  // 1. Validate
  if (!input.provinceName || !input.cityName || !input.name || input.name.trim().length < 2) {
    return { success: false, error: 'Province, city, and area name (at least 2 chars) are required.' };
  }

  const cleanName = input.name.trim();
  const cleanNameUr = input.nameUr?.trim() || null;
  const isActive = input.active ?? true;

  if (!isSupabaseConfigured()) {
    // Add to local geo store
    const city = STARTER_CITIES.find(
      (c) => c.name.toLowerCase() === input.cityName.toLowerCase()
    );
    const cityId = city ? city.id : 'city-' + input.cityName.toLowerCase().replace(/\s+/g, '-');
    const res = await addAreaRecord({
      cityId,
      cityName: input.cityName,
      name: cleanName,
      nameUr: cleanNameUr || undefined,
      active: isActive,
    });
    return res;
  }

  try {
    const admin = getServiceRoleClient();

    // 1. Ensure Province exists
    let { data: provData } = await (admin as any)
      .from('provinces')
      .select('id')
      .ilike('name', input.provinceName)
      .maybeSingle();

    if (!provData) {
      const { data: newProv, error: provErr } = await (admin as any)
        .from('provinces')
        .insert({ name: input.provinceName })
        .select('id')
        .single();
      if (provErr) return { success: false, error: 'Failed to verify province: ' + provErr.message };
      provData = newProv;
    }

    // 2. Ensure City exists
    let { data: cityData } = await (admin as any)
      .from('cities')
      .select('id')
      .ilike('name', input.cityName)
      .maybeSingle();

    if (!cityData) {
      const { data: newCity, error: cityErr } = await (admin as any)
        .from('cities')
        .insert({
          province_id: provData.id,
          name: input.cityName,
          courier_city_code: input.cityName.slice(0, 3).toUpperCase(),
        })
        .select('id')
        .single();
      if (cityErr) return { success: false, error: 'Failed to verify city: ' + cityErr.message };
      cityData = newCity;
    }

    // 3. Upsert Area
    const { data: areaData, error: areaErr } = await (admin as any)
      .from('areas')
      .upsert(
        {
          city_id: cityData.id,
          name: cleanName,
          name_ur: cleanNameUr,
          active: isActive,
        },
        { onConflict: 'city_id,name' }
      )
      .select()
      .single();

    if (areaErr) {
      return { success: false, error: areaErr.message };
    }

    // Also update in-memory cache for immediate read
    await addAreaRecord({
      cityId: cityData.id,
      name: cleanName,
      nameUr: cleanNameUr || undefined,
      active: isActive,
    });

    return { success: true, area: areaData };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create area.' };
  }
}

/**
 * Update an existing area
 */
export async function updateAreaAction(
  areaId: string,
  updates: { name?: string; nameUr?: string; active?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await updateAreaRecord(areaId, updates);
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update area' };
  }
}

/**
 * Toggle an area active / disabled
 */
export async function toggleAreaStatusAction(
  areaId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await toggleAreaRecordActive(areaId, active);
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle area status' };
  }
}

/**
 * Delete an area
 */
export async function deleteAreaAction(areaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await deleteAreaRecord(areaId);
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete area' };
  }
}

/**
 * Import Areas from CSV Content
 * Supported format: province,city,area,courier_city_code[,area_ur]
 */
export async function importAreasFromCsvAction(csvText: string): Promise<{
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  errors: string[];
}> {
  const { rows, errors } = parseAreaCsv(csvText);

  if (rows.length === 0) {
    return {
      success: false,
      total: 0,
      inserted: 0,
      updated: 0,
      errors: errors.length > 0 ? errors : ['No valid data rows found in CSV.'],
    };
  }

  let inserted = 0;
  let updated = 0;
  const executionErrors: string[] = [...errors];

  for (const row of rows) {
    try {
      const res = await createAreaAction({
        provinceName: row.province,
        cityName: row.city,
        name: row.area,
        nameUr: row.area_ur,
        active: true,
      });

      if (res.success) {
        inserted++;
      } else {
        executionErrors.push(`Area "${row.area}" in ${row.city}: ${res.error}`);
      }
    } catch (e: any) {
      executionErrors.push(`Failed row (${row.area}, ${row.city}): ${e.message}`);
    }
  }

  return {
    success: inserted > 0,
    total: rows.length,
    inserted,
    updated,
    errors: executionErrors,
  };
}

/**
 * Get Orders requiring manual area review (customers selected "My area is not listed")
 */
export async function getAreaReviewOrdersAction(): Promise<{
  success: boolean;
  orders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    province: string;
    city: string;
    customAreaName: string;
    addressLine: string;
    landmark?: string;
    createdAt: string;
    totalAmount: number;
  }>;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: true, orders: inMemoryReviewOrders };
  }

  try {
    const admin = getServiceRoleClient();
    const { data, error } = await (admin as any)
      .from('orders')
      .select('id, order_number, customer_name, phone, addr_province, addr_city, addr_area_name, addr_address_line, addr_landmark, created_at, total_amount, requires_area_review')
      .or('requires_area_review.eq.true,is_custom_area.eq.true')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Orders review fetch fallback:', error);
      return { success: true, orders: inMemoryReviewOrders };
    }

    const mapped = (data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      phone: o.phone,
      province: o.addr_province || 'Punjab',
      city: o.addr_city || 'Lahore',
      customAreaName: o.addr_area_name || 'Unlisted Area',
      addressLine: o.addr_address_line || '',
      landmark: o.addr_landmark || undefined,
      createdAt: o.created_at,
      totalAmount: Number(o.total_amount) || 0,
    }));

    return { success: true, orders: [...mapped, ...inMemoryReviewOrders.filter(mo => !mapped.some((m: any) => m.id === mo.id))] };
  } catch (err: any) {
    return { success: true, orders: inMemoryReviewOrders };
  }
}

/**
 * Approve a customer's custom area from an order and add it as an official area
 */
export async function approveCustomAreaFromOrderAction(
  orderId: string,
  areaName: string,
  cityName: string,
  provinceName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Add area to database
    const addRes = await createAreaAction({
      provinceName,
      cityName,
      name: areaName,
      active: true,
    });

    if (!addRes.success) {
      return { success: false, error: addRes.error };
    }

    // 2. Mark order as reviewed
    if (!isSupabaseConfigured()) {
      const idx = inMemoryReviewOrders.findIndex((o) => o.id === orderId);
      if (idx !== -1) inMemoryReviewOrders.splice(idx, 1);
      return { success: true };
    }

    const admin = getServiceRoleClient();
    await (admin as any)
      .from('orders')
      .update({
        requires_area_review: false,
        internal_notes: `Area "${areaName}" approved and added to official database by administrator.`,
      })
      .eq('id', orderId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve area' };
  }
}

/**
 * Dismiss / Mark reviewed an order without adding area to database
 */
export async function dismissAreaReviewOrderAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const idx = inMemoryReviewOrders.findIndex((o) => o.id === orderId);
    if (idx !== -1) inMemoryReviewOrders.splice(idx, 1);
    return { success: true };
  }

  try {
    const admin = getServiceRoleClient();
    await (admin as any)
      .from('orders')
      .update({ requires_area_review: false })
      .eq('id', orderId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

