'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { normalizePakistaniPhone } from '@/lib/utils';
import { OrderStatusV2 } from '@/types';

export interface TrackingTimelineEvent {
  status: OrderStatusV2 | string;
  label: string;
  note?: string | null;
  date: string;
  completed: boolean;
}

export interface TrackOrderResult {
  success: boolean;
  order?: {
    orderNumber: string;
    status: OrderStatusV2;
    statusLabel: string;
    createdAt: string;
    paymentMethod: string;
    totalAmount: number;
    city: string;
    province?: string;
    courier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    timeline: TrackingTimelineEvent[];
    eventsList?: Array<{
      id: string;
      status: string;
      note?: string | null;
      createdAt: string;
    }>;
  };
  error?: string;
}

function getCourierTrackingUrl(courier?: string | null, trackingNumber?: string | null): string | null {
  if (!courier || !trackingNumber) return null;
  const c = courier.toLowerCase();
  if (c.includes('tcs')) return `https://www.tcsexpress.com/tracking?track=${trackingNumber}`;
  if (c.includes('leopard')) return `https://www.leopardscourier.com/tracking?track=${trackingNumber}`;
  if (c.includes('trax')) return `https://sonic.pk/tracking?tracking_number=${trackingNumber}`;
  if (c.includes('call courier') || c.includes('callcourier')) return `https://callcourier.com.pk/tracking/?tc=${trackingNumber}`;
  if (c.includes('postex')) return `https://postex.pk/tracking?trackingNo=${trackingNumber}`;
  return null;
}

const STATUS_PROGRESSION: Array<{ key: OrderStatusV2; label: string }> = [
  { key: 'pending_confirmation', label: 'Order Placed' },
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'ordered_from_supplier', label: 'Dispatched from Supplier' },
  { key: 'shipped', label: 'In Transit with Courier' },
  { key: 'delivered', label: 'Delivered' },
];

export async function trackOrder(
  orderRef: string,
  rawPhone: string
): Promise<TrackOrderResult> {
  const cleanRef = orderRef.trim().toUpperCase();
  const cleanPhone = normalizePakistaniPhone(rawPhone);

  if (!cleanPhone) {
    return {
      success: false,
      error: 'Please enter a valid Pakistani mobile number (e.g. 03001234567).',
    };
  }

  if (!cleanRef) {
    return {
      success: false,
      error: 'Please enter your Order Number (e.g. PK-10001) or Confirmation Token.',
    };
  }

  // 1. Supabase Connected Flow
  if (isSupabaseConfigured()) {
    try {
      const supabase = getServiceRoleClient();

      const { data: order, error }: any = await (supabase as any)
        .from('orders')
        .select(`
          id,
          order_number,
          phone,
          status,
          status_v2,
          payment_method,
          total_amount,
          created_at,
          city,
          addr_city,
          addr_province,
          courier,
          tracking_number,
          confirmation_token
        `)
        .or(`order_number.eq.${cleanRef},confirmation_token.eq.${orderRef.trim()}`)
        .single();

      if (error || !order) {
        return {
          success: false,
          error: 'No order found with this reference number. Please check the spelling and try again.',
        };
      }

      // Security check: Verify Phone Number match
      const orderPhoneNormalized = normalizePakistaniPhone(order.phone);
      if (orderPhoneNormalized !== cleanPhone) {
        return {
          success: false,
          error: 'The mobile number does not match the records for this order.',
        };
      }

      // Fetch items
      const { data: items }: any = await (supabase as any)
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          product:products(name)
        `)
        .eq('order_id', order.id);

      // Fetch events
      const { data: events }: any = await (supabase as any)
        .from('order_events')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      const currentStatus: OrderStatusV2 = (order.status_v2 as OrderStatusV2) || 'pending_confirmation';

      // Build timeline
      const statusIndex = STATUS_PROGRESSION.findIndex((s) => s.key === currentStatus);
      const timeline: TrackingTimelineEvent[] = STATUS_PROGRESSION.map((step, idx) => {
        const isCompleted = statusIndex >= idx;
        const matchingEvent = events?.find((e: any) => e.status === step.key);
        return {
          status: step.key,
          label: step.label,
          note: matchingEvent?.note || null,
          date: matchingEvent?.created_at || (isCompleted ? order.created_at : ''),
          completed: isCompleted,
        };
      });

      return {
        success: true,
        order: {
          orderNumber: order.order_number,
          status: currentStatus,
          statusLabel: STATUS_PROGRESSION.find((s) => s.key === currentStatus)?.label || currentStatus,
          createdAt: order.created_at,
          paymentMethod: order.payment_method,
          totalAmount: Number(order.total_amount),
          city: order.addr_city || order.city,
          province: order.addr_province || undefined,
          courier: order.courier,
          trackingNumber: order.tracking_number,
          trackingUrl: getCourierTrackingUrl(order.courier, order.tracking_number),
          items: (items || []).map((i: any) => ({
            id: i.id,
            productName: i.product?.name || 'Item',
            quantity: i.quantity,
            price: Number(i.price),
          })),
          timeline,
          eventsList: (events || []).map((e: any) => ({
            id: e.id,
            status: e.status,
            note: e.note || null,
            createdAt: e.created_at,
          })),
        },
      };
    } catch (err: any) {
      console.error('Track order error:', err);
      return {
        success: false,
        error: 'Unable to reach the tracking system. Please try again shortly.',
      };
    }
  }

  // 2. Demo / Fallback Flow (when running locally without live DB credentials)
  if (cleanRef.startsWith('PK-') || cleanRef.length >= 6) {
    const demoStatus: OrderStatusV2 = 'confirmed';
    return {
      success: true,
      order: {
        orderNumber: cleanRef,
        status: demoStatus,
        statusLabel: 'Order Confirmed',
        createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        paymentMethod: 'COD',
        totalAmount: 4850,
        city: 'Lahore',
        province: 'Punjab',
        courier: 'Leopards Courier',
        trackingNumber: 'LPD-98231451',
        trackingUrl: 'https://www.leopardscourier.com/tracking?track=LPD-98231451',
        items: [
          {
            id: 'item-1',
            productName: 'Royal Emerald Embroidered Kurta (Size: M)',
            quantity: 1,
            price: 4850,
          },
        ],
        timeline: [
          { status: 'pending_confirmation', label: 'Order Placed', date: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), completed: true },
          { status: 'confirmed', label: 'Order Confirmed', note: 'Customer verified order via WhatsApp', date: new Date(Date.now() - 3600 * 1000 * 12).toISOString(), completed: true },
          { status: 'ordered_from_supplier', label: 'Dispatched from Supplier', date: '', completed: false },
          { status: 'shipped', label: 'In Transit with Courier', date: '', completed: false },
          { status: 'delivered', label: 'Delivered', date: '', completed: false },
        ],
        eventsList: [
          {
            id: 'ev-mock-1',
            status: 'pending_confirmation',
            note: 'Order placed by customer via Cash on Delivery (COD).',
            createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
          },
          {
            id: 'ev-mock-2',
            status: 'confirmed',
            note: 'Customer confirmed parcel address details over WhatsApp call.',
            createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
          },
        ],
      },
    };
  }

  return {
    success: false,
    error: 'No order found with this reference number. Example format: PK-10001',
  };
}
