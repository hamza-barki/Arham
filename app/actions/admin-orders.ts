'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentAdminUser, requireRole, recordAuditLog } from '@/lib/admin-auth';
import { OrderStatusV2 } from '@/types/database';
import {
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from '@/lib/email';

export interface AdminOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  city: string;
  province?: string | null;
  areaName?: string | null;
  addressLine?: string | null;
  landmark?: string | null;
  lat?: number | null;
  lng?: number | null;
  status: OrderStatusV2;
  totalAmount: number;
  paymentMethod: string;
  supplierOrderRef?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  internalNotes?: string | null;
  requiresAreaReview?: boolean;
  isCustomArea?: boolean;
  riskFlags?: {
    riskLevel?: 'low' | 'medium' | 'high';
    riskScore?: number;
    flags?: Array<{
      code: string;
      severity: string;
      label: string;
      description: string;
    }>;
  } | null;
  createdAt: string;
  itemCount: number;
}

export interface AdminOrderDetailFull extends AdminOrderItem {
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    variantId?: string | null;
    size?: string | null;
    color?: string | null;
    quantity: number;
    price: number;
    supplierSku?: string | null;
    image?: string | null;
  }>;
  timeline: Array<{
    id: string;
    status: OrderStatusV2;
    note?: string | null;
    actorName?: string | null;
    createdAt: string;
  }>;
  markazOrderText: string;
  whatsappUrl: string;
  callUrl: string;
  mapPinUrl?: string | null;
}

// In-memory mock store for offline demo/dev
let mockOrdersStore: AdminOrderDetailFull[] = [
  {
    id: 'ord-mock-1',
    orderNumber: 'PK-99120',
    customerName: 'Ayesha Khan',
    phone: '03001234567',
    email: 'ayesha.k@example.pk',
    city: 'Lahore',
    province: 'Punjab',
    areaName: 'Gulberg III',
    addressLine: 'House 14-B, Street 3, Block G',
    landmark: 'Near Jamia Masjid Al-Falah',
    lat: 31.5123,
    lng: 74.3541,
    status: 'pending_confirmation',
    totalAmount: 4950,
    paymentMethod: 'COD',
    supplierOrderRef: '',
    courier: 'PostEx',
    trackingNumber: '',
    internalNotes: 'Customer requested delivery after 3 PM.',
    requiresAreaReview: false,
    isCustomArea: false,
    riskFlags: {
      riskLevel: 'low',
      riskScore: 0,
      flags: [],
    },
    createdAt: new Date().toISOString(),
    itemCount: 1,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Embroidered Lawn Kurti - Floral Mint',
        variantId: 'var-1',
        size: 'M',
        color: 'Mint Green',
        quantity: 1,
        price: 4950,
        supplierSku: 'MKZ-LWN-091',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=300',
      },
    ],
    timeline: [
      {
        id: 'ev-1',
        status: 'pending_confirmation',
        note: 'Order placed by customer via Cash on Delivery checkout.',
        actorName: 'System',
        createdAt: new Date().toISOString(),
      },
    ],
    markazOrderText: '',
    whatsappUrl: '',
    callUrl: '',
    mapPinUrl: 'https://www.google.com/maps?q=31.5123,74.3541',
  },
  {
    id: 'ord-mock-2',
    orderNumber: 'PK-99119',
    customerName: 'Fatima Zahra',
    phone: '03214567890',
    email: 'fatima@gmail.com',
    city: 'Karachi',
    province: 'Sindh',
    areaName: 'Clifton (Block 4)',
    addressLine: 'Apartment 402, Ocean Residency',
    landmark: 'Behind BBQ Tonight',
    lat: 24.8142,
    lng: 67.0289,
    status: 'confirmed',
    totalAmount: 6800,
    paymentMethod: 'COD',
    supplierOrderRef: 'MKZ-77410',
    courier: 'Leopards',
    trackingNumber: 'LEO-994120',
    internalNotes: 'Phone confirmation received. Markaz order placed.',
    requiresAreaReview: false,
    isCustomArea: false,
    riskFlags: {
      riskLevel: 'medium',
      riskScore: 25,
      flags: [
        {
          code: 'high_value',
          severity: 'medium',
          label: 'High Value (Rs. 6.8k+)',
          description: 'High value formal silk order.',
        },
      ],
    },
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    itemCount: 2,
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Pure Raw Silk 2-Piece Suit',
        variantId: 'var-2',
        size: 'L',
        color: 'Ruby Red',
        quantity: 1,
        price: 6800,
        supplierSku: 'MKZ-SLK-882',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=300',
      },
    ],
    timeline: [
      {
        id: 'ev-2',
        status: 'pending_confirmation',
        note: 'Order placed by customer.',
        actorName: 'System',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'ev-3',
        status: 'confirmed',
        note: 'Customer confirmed via WhatsApp call.',
        actorName: 'Staff Member',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
    markazOrderText: '',
    whatsappUrl: '',
    callUrl: '',
    mapPinUrl: 'https://www.google.com/maps?q=24.8142,67.0289',
  },
  {
    id: 'ord-mock-3',
    orderNumber: 'PK-99118',
    customerName: 'Kamran Ashraf',
    phone: '03339876543',
    email: '',
    city: 'Rawalpindi',
    province: 'Punjab',
    areaName: 'Gulraiz Phase 2',
    addressLine: 'House 89, Street 12',
    landmark: 'Near Shell Pump',
    lat: null,
    lng: null,
    status: 'pending_confirmation',
    totalAmount: 3200,
    paymentMethod: 'COD',
    supplierOrderRef: '',
    courier: 'PostEx',
    trackingNumber: '',
    internalNotes: 'Unlisted area flagged for review.',
    requiresAreaReview: true,
    isCustomArea: true,
    riskFlags: {
      riskLevel: 'high',
      riskScore: 70,
      flags: [
        {
          code: 'past_rto_or_cancel',
          severity: 'high',
          label: 'Past RTO History',
          description: 'Customer phone has 1 previous returned parcel.',
        },
        {
          code: 'missing_area',
          severity: 'medium',
          label: 'Unlisted Area',
          description: 'Custom area "Gulraiz Phase 2" not verified in courier database.',
        },
      ],
    },
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    itemCount: 1,
    items: [
      {
        id: 'item-3',
        productId: 'prod-3',
        productName: 'Chiffon Embroidered Dupatta',
        variantId: null,
        size: 'Standard',
        color: 'Gold',
        quantity: 1,
        price: 3200,
        supplierSku: 'MKZ-DUP-104',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=300',
      },
    ],
    timeline: [
      {
        id: 'ev-4',
        status: 'pending_confirmation',
        note: 'Customer entered unlisted custom area: "Gulraiz Phase 2".',
        actorName: 'System',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
    markazOrderText: '',
    whatsappUrl: '',
    callUrl: '',
    mapPinUrl: null,
  },
];

/**
 * Generate formatted text for Markaz order copy-pasting
 */
function generateMarkazText(order: any): string {
  const itemsText = (order.items || [])
    .map(
      (it: any, idx: number) =>
        `${idx + 1}. ${it.productName} [Code: ${it.supplierSku || 'N/A'}] - Size: ${it.size || 'Free'} | Qty: ${it.quantity} | Selling Price: Rs. ${it.price}`
    )
    .join('\n');

  return `📦 MARKAZ ORDER DETAILS
-----------------------------
Customer Name: ${order.customerName || order.customer_name}
Contact Phone: ${order.phone}
City: ${order.addr_city || order.city}
Province: ${order.addr_province || order.province || 'Pakistan'}
Area / Sector: ${order.addr_area_name || order.areaName || ''}
Street Address: ${order.addr_address_line || order.addressLine || order.address}
${order.addr_landmark || order.landmark ? `Landmark: ${order.addr_landmark || order.landmark}` : ''}
-----------------------------
COD Collect Amount: Rs. ${order.totalAmount || order.total_amount}
Items:
${itemsText}
-----------------------------
Store Order Reference: ${order.orderNumber || order.order_number}`;
}

/**
 * Generate formatted WhatsApp message URL for confirmation
 */
function generateWhatsAppUrl(phone: string, customerName: string, orderNumber: string, amount: number): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const pkPhone = cleanPhone.startsWith('92')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? '92' + cleanPhone.slice(1)
    : '92' + cleanPhone;

  const msg = encodeURIComponent(
    `Assalam-o-Alaikum ${customerName}! 🌸\n\n` +
    `Thank you for ordering with us. Your Order #${orderNumber} for Rs. ${amount.toLocaleString()} (Cash on Delivery) is ready for packing.\n\n` +
    `Please reply *YES* or *CONFIRM* to verify your shipping address so we can hand over your parcel to the courier for delivery in 2-3 working days.\n\n` +
    `JazakAllah Khair!`
  );

  return `https://wa.me/${pkPhone}?text=${msg}`;
}

/**
 * Fetch orders list with filters
 */
export async function getAdminOrdersAction(filters?: {
  status?: string;
  dateRange?: string;
  city?: string;
  courier?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  success: boolean;
  orders: AdminOrderItem[];
  total: number;
  error?: string;
}> {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) return { success: false, orders: [], total: 0, error: 'Unauthorized' };

    if (!isSupabaseConfigured()) {
      let result = [...mockOrdersStore];

      if (filters?.status && filters.status !== 'all') {
        result = result.filter((o) => o.status === filters.status);
      }
      if (filters?.city && filters.city !== 'all') {
        result = result.filter((o) => o.city.toLowerCase() === filters.city!.toLowerCase());
      }
      if (filters?.courier && filters.courier !== 'all') {
        result = result.filter((o) => (o.courier || '').toLowerCase() === filters.courier!.toLowerCase());
      }
      if (filters?.search) {
        const q = filters.search.trim().toLowerCase();
        result = result.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.phone.includes(q) ||
            o.customerName.toLowerCase().includes(q)
        );
      }

      return {
        success: true,
        orders: result,
        total: result.length,
      };
    }

    const admin = getServiceRoleClient();
    let query = (admin as any).from('orders').select('*', { count: 'exact' });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status_v2', filters.status);
    }
    if (filters?.city && filters.city !== 'all') {
      query = query.ilike('addr_city', filters.city);
    }
    if (filters?.courier && filters.courier !== 'all') {
      query = query.ilike('courier', filters.courier);
    }
    if (filters?.search) {
      const q = filters.search.trim();
      query = query.or(`order_number.ilike.%${q}%,phone.ilike.%${q}%,customer_name.ilike.%${q}%`);
    }

    // Date range filter
    if (filters?.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      if (filters.dateRange === 'today') {
        now.setHours(0, 0, 0, 0);
        query = query.gte('created_at', now.toISOString());
      } else if (filters.dateRange === 'yesterday') {
        const yStart = new Date(now);
        yStart.setDate(yStart.getDate() - 1);
        yStart.setHours(0, 0, 0, 0);
        const yEnd = new Date(now);
        yEnd.setHours(0, 0, 0, 0);
        query = query.gte('created_at', yStart.toISOString()).lt('created_at', yEnd.toISOString());
      } else if (filters.dateRange === 'this_week') {
        now.setDate(now.getDate() - 7);
        query = query.gte('created_at', now.toISOString());
      }
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return { success: false, orders: [], total: 0, error: error.message };
    }

    const mapped: AdminOrderItem[] = (data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      phone: o.phone,
      email: o.email || null,
      city: o.addr_city || o.city || 'Lahore',
      province: o.addr_province || null,
      areaName: o.addr_area_name || null,
      addressLine: o.addr_address_line || o.address || null,
      landmark: o.addr_landmark || null,
      lat: o.addr_lat ? Number(o.addr_lat) : null,
      lng: o.addr_lng ? Number(o.addr_lng) : null,
      status: o.status_v2 || 'pending_confirmation',
      totalAmount: Number(o.total_amount) || 0,
      paymentMethod: o.payment_method || 'COD',
      supplierOrderRef: o.supplier_order_ref || null,
      courier: o.courier || null,
      trackingNumber: o.tracking_number || null,
      internalNotes: o.internal_notes || null,
      requiresAreaReview: Boolean(o.requires_area_review || o.is_custom_area),
      isCustomArea: Boolean(o.is_custom_area),
      riskFlags: o.risk_flags || null,
      createdAt: o.created_at,
      itemCount: 1,
    }));

    return {
      success: true,
      orders: mapped,
      total: count || mapped.length,
    };
  } catch (err: any) {
    return { success: false, orders: [], total: 0, error: err.message };
  }
}

/**
 * Get single order detail with items, supplier SKU, and events timeline
 */
export async function getAdminOrderDetailAction(orderId: string): Promise<{
  success: boolean;
  order?: AdminOrderDetailFull;
  error?: string;
}> {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) return { success: false, error: 'Unauthorized' };

    if (!isSupabaseConfigured()) {
      const found = mockOrdersStore.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (found) {
        found.markazOrderText = generateMarkazText(found);
        found.whatsappUrl = generateWhatsAppUrl(found.phone, found.customerName, found.orderNumber, found.totalAmount);
        found.callUrl = `tel:${found.phone}`;
        found.mapPinUrl = found.lat && found.lng ? `https://www.google.com/maps?q=${found.lat},${found.lng}` : null;
        return { success: true, order: found };
      }
      return { success: false, error: 'Order not found' };
    }

    const admin = getServiceRoleClient();

    const [orderRes, itemsRes, eventsRes, privateRes] = await Promise.all([
      (admin as any).from('orders').select('*').eq('id', orderId).maybeSingle(),
      (admin as any).from('order_items').select('*, product_variants(size, color), products(name, images)').eq('order_id', orderId),
      (admin as any).from('order_events').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
      (admin as any).from('product_private').select('*'),
    ]);

    if (!orderRes.data) {
      return { success: false, error: 'Order not found in database.' };
    }

    const o = orderRes.data;
    const privates = privateRes.data || [];

    const mappedItems = (itemsRes.data || []).map((it: any) => {
      const priv = privates.find((p: any) => p.product_id === it.product_id);
      return {
        id: it.id,
        productId: it.product_id,
        productName: it.products?.name || 'Product',
        variantId: it.variant_id,
        size: it.product_variants?.size || null,
        color: it.product_variants?.color || null,
        quantity: it.quantity,
        price: Number(it.price),
        supplierSku: priv?.supplier_sku || null,
        image: it.products?.images?.[0] || null,
      };
    });

    const mappedTimeline = (eventsRes.data || []).map((ev: any) => ({
      id: ev.id,
      status: ev.status,
      note: ev.note,
      actorName: ev.actor_id ? 'Staff' : 'System',
      createdAt: ev.created_at,
    }));

    const detail: AdminOrderDetailFull = {
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      phone: o.phone,
      email: o.email || null,
      city: o.addr_city || o.city || 'Lahore',
      province: o.addr_province || null,
      areaName: o.addr_area_name || null,
      addressLine: o.addr_address_line || o.address || null,
      landmark: o.addr_landmark || null,
      lat: o.addr_lat ? Number(o.addr_lat) : null,
      lng: o.addr_lng ? Number(o.addr_lng) : null,
      status: o.status_v2 || 'pending_confirmation',
      totalAmount: Number(o.total_amount) || 0,
      paymentMethod: o.payment_method || 'COD',
      supplierOrderRef: o.supplier_order_ref || null,
      courier: o.courier || null,
      trackingNumber: o.tracking_number || null,
      internalNotes: o.internal_notes || null,
      requiresAreaReview: Boolean(o.requires_area_review || o.is_custom_area),
      isCustomArea: Boolean(o.is_custom_area),
      riskFlags: o.risk_flags || null,
      createdAt: o.created_at,
      itemCount: mappedItems.length,
      items: mappedItems,
      timeline: mappedTimeline,
      markazOrderText: generateMarkazText({ ...o, items: mappedItems }),
      whatsappUrl: generateWhatsAppUrl(o.phone, o.customer_name, o.order_number, Number(o.total_amount)),
      callUrl: `tel:${o.phone}`,
      mapPinUrl: o.addr_lat && o.addr_lng ? `https://www.google.com/maps?q=${o.addr_lat},${o.addr_lng}` : null,
    };

    return { success: true, order: detail };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update order status with audit log and order_events timeline
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatusV2,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('staff');

    if (!isSupabaseConfigured()) {
      const found = mockOrdersStore.find((o) => o.id === orderId);
      if (found) {
        // Enforce supplier ordering guard: unconfirmed orders cannot be placed with supplier
        if (newStatus === 'ordered_from_supplier' && found.status === 'pending_confirmation') {
          return {
            success: false,
            error: 'Unconfirmed order cannot be ordered from supplier! Please verify with customer via WhatsApp or Call and confirm the order first.',
          };
        }

        const oldStatus = found.status;
        found.status = newStatus;
        found.timeline.push({
          id: 'ev-' + Date.now(),
          status: newStatus,
          note: note || `Status updated from ${oldStatus} to ${newStatus}.`,
          actorName: adminUser.fullName,
          createdAt: new Date().toISOString(),
        });

        // Trigger transactional email if customer email exists
        if (found.email && found.email.includes('@')) {
          const emailData = {
            orderNumber: found.orderNumber,
            customerName: found.customerName,
            customerEmail: found.email,
            phone: found.phone,
            city: found.city,
            totalAmount: found.totalAmount,
            courier: found.courier,
            trackingNumber: found.trackingNumber,
          };
          if (newStatus === 'confirmed') sendOrderConfirmedEmail(emailData).catch(() => {});
          if (newStatus === 'shipped') sendOrderShippedEmail(emailData).catch(() => {});
          if (newStatus === 'delivered') sendOrderDeliveredEmail(emailData).catch(() => {});
        }
      }
      await recordAuditLog({
        action: 'UPDATE_ORDER_STATUS',
        entity: 'orders',
        entityId: orderId,
        diff: { newStatus, note },
        actorId: adminUser.userId,
        actorName: adminUser.fullName,
      });
      return { success: true };
    }

    const admin = getServiceRoleClient();

    // 1. Get current status and details for diff & emails
    const { data: currentOrder } = await (admin as any)
      .from('orders')
      .select('status_v2, email, customer_name, order_number, phone, city, total_amount, courier, tracking_number')
      .eq('id', orderId)
      .single();

    // Enforce supplier ordering guard: unconfirmed orders cannot be placed with supplier
    if (newStatus === 'ordered_from_supplier' && currentOrder?.status_v2 === 'pending_confirmation') {
      return {
        success: false,
        error: 'Unconfirmed order cannot be ordered from supplier! Please verify with customer via WhatsApp or Call and confirm the order first.',
      };
    }

    // 2. Update status on order
    const { error: updateErr } = await (admin as any)
      .from('orders')
      .update({
        status_v2: newStatus,
        status: newStatus === 'pending_confirmation' ? 'pending' : newStatus === 'returned_rto' ? 'cancelled' : newStatus,
      })
      .eq('id', orderId);

    if (updateErr) return { success: false, error: updateErr.message };

    // 3. Add to order_events timeline
    await (admin as any).from('order_events').insert({
      order_id: orderId,
      status: newStatus,
      note: note || `Status changed from ${currentOrder?.status_v2 || 'pending'} to ${newStatus}`,
      actor_id: adminUser.userId,
    });

    // 4. Trigger transactional email if customer provided an email
    if (currentOrder?.email && currentOrder.email.includes('@')) {
      const emailPayload = {
        orderNumber: currentOrder.order_number,
        customerName: currentOrder.customer_name,
        customerEmail: currentOrder.email,
        phone: currentOrder.phone,
        city: currentOrder.city,
        totalAmount: Number(currentOrder.total_amount) || 0,
        courier: currentOrder.courier,
        trackingNumber: currentOrder.tracking_number,
      };

      if (newStatus === 'confirmed') sendOrderConfirmedEmail(emailPayload).catch(() => {});
      if (newStatus === 'shipped') sendOrderShippedEmail(emailPayload).catch(() => {});
      if (newStatus === 'delivered') sendOrderDeliveredEmail(emailPayload).catch(() => {});
    }

    // 5. Audit Log
    await recordAuditLog({
      action: 'UPDATE_ORDER_STATUS',
      entity: 'orders',
      entityId: orderId,
      diff: { oldStatus: currentOrder?.status_v2, newStatus, note },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update order fulfillment tracking fields
 */
export async function updateOrderFulfillmentAction(
  orderId: string,
  fields: {
    supplierOrderRef?: string;
    courier?: string;
    trackingNumber?: string;
    internalNotes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('staff');

    if (!isSupabaseConfigured()) {
      const found = mockOrdersStore.find((o) => o.id === orderId);
      if (found) {
        if (fields.supplierOrderRef !== undefined) found.supplierOrderRef = fields.supplierOrderRef;
        if (fields.courier !== undefined) found.courier = fields.courier;
        if (fields.trackingNumber !== undefined) found.trackingNumber = fields.trackingNumber;
        if (fields.internalNotes !== undefined) found.internalNotes = fields.internalNotes;

        if (fields.trackingNumber && found.email && found.email.includes('@')) {
          sendOrderShippedEmail({
            orderNumber: found.orderNumber,
            customerName: found.customerName,
            customerEmail: found.email,
            phone: found.phone,
            city: found.city,
            totalAmount: found.totalAmount,
            courier: found.courier,
            trackingNumber: found.trackingNumber,
          }).catch(() => {});
        }
      }
      await recordAuditLog({
        action: 'UPDATE_ORDER_FULFILLMENT',
        entity: 'orders',
        entityId: orderId,
        diff: fields,
        actorId: adminUser.userId,
        actorName: adminUser.fullName,
      });
      return { success: true };
    }

    const admin = getServiceRoleClient();
    const updatePayload: any = {};
    if (fields.supplierOrderRef !== undefined) updatePayload.supplier_order_ref = fields.supplierOrderRef;
    if (fields.courier !== undefined) updatePayload.courier = fields.courier;
    if (fields.trackingNumber !== undefined) updatePayload.tracking_number = fields.trackingNumber;
    if (fields.internalNotes !== undefined) updatePayload.internal_notes = fields.internalNotes;

    const { error } = await (admin as any)
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) return { success: false, error: error.message };

    // Trigger tracking email if tracking number was updated and customer provided email
    if (fields.trackingNumber) {
      const { data: o } = await (admin as any)
        .from('orders')
        .select('order_number, customer_name, email, phone, city, total_amount, courier, tracking_number')
        .eq('id', orderId)
        .single();

      if (o?.email && o.email.includes('@')) {
        sendOrderShippedEmail({
          orderNumber: o.order_number,
          customerName: o.customer_name,
          customerEmail: o.email,
          phone: o.phone,
          city: o.city,
          totalAmount: Number(o.total_amount) || 0,
          courier: o.courier || fields.courier,
          trackingNumber: fields.trackingNumber,
        }).catch(() => {});
      }
    }

    await recordAuditLog({
      action: 'UPDATE_ORDER_FULFILLMENT',
      entity: 'orders',
      entityId: orderId,
      diff: fields,
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Export selected orders as Courier Booking CSV (PostEx / Trax / Leopards format)
 */
export async function exportOrdersCourierCsvAction(orderIds: string[]): Promise<{
  success: boolean;
  csvContent?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const adminUser = await requireRole('manager');

    let ordersToExport: any[] = [];

    if (!isSupabaseConfigured()) {
      ordersToExport = mockOrdersStore.filter((o) => orderIds.includes(o.id));
      if (ordersToExport.length === 0) ordersToExport = mockOrdersStore;
    } else {
      const admin = getServiceRoleClient();
      let query = (admin as any).from('orders').select('*');
      if (orderIds && orderIds.length > 0) {
        query = query.in('id', orderIds);
      } else {
        query = query.limit(100);
      }
      const { data } = await query;
      ordersToExport = data || [];
    }

    if (ordersToExport.length === 0) {
      return { success: false, error: 'No orders selected for courier export.' };
    }

    // Build Courier CSV (Compliant with PostEx / Trax / Leopards / TCS bulk upload)
    const headers = [
      'Order Reference',
      'Customer Name',
      'Customer Phone',
      'Delivery Address',
      'City',
      'Destination Code',
      'Order Amount (COD)',
      'Item Description',
      'Pieces',
      'Weight (kg)',
      'Special Instructions',
    ];

    const rows = ordersToExport.map((o: any) => {
      const address = [
        o.addr_address_line || o.addressLine || o.address,
        o.addr_area_name || o.areaName,
        o.addr_landmark || o.landmark ? `Near: ${o.addr_landmark || o.landmark}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      const cleanPhone = (o.phone || '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('92')
        ? '0' + cleanPhone.slice(2)
        : cleanPhone.startsWith('0')
        ? cleanPhone
        : '0' + cleanPhone;

      return [
        `"${o.orderNumber || o.order_number || ''}"`,
        `"${(o.customerName || o.customer_name || '').replace(/"/g, '""')}"`,
        `"${formattedPhone}"`,
        `"${address.replace(/"/g, '""')}"`,
        `"${o.addr_city || o.city || 'Lahore'}"`,
        `"${o.courier_city_code || ''}"`,
        `${o.totalAmount || o.total_amount || 0}`,
        `"E-Commerce Apparel & Accessories"`,
        `1`,
        `0.5`,
        `"${(o.internalNotes || o.internal_notes || 'Call before delivery').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const filename = `courier_booking_${new Date().toISOString().slice(0, 10)}.csv`;

    await recordAuditLog({
      action: 'EXPORT_COURIER_CSV',
      entity: 'orders',
      diff: { count: ordersToExport.length, filename },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true, csvContent, filename };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

