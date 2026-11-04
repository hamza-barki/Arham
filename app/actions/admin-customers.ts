'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requireRole, recordAuditLog } from '@/lib/admin-auth';

export interface AdminCustomerItem {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: string;
  marketingConsent: boolean;
  consentAt?: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string | null;
}

// In-memory mock customers for offline dev
let mockCustomersStore: AdminCustomerItem[] = [
  {
    id: 'cust-1',
    fullName: 'Ayesha Khan',
    phone: '03001234567',
    email: 'ayesha.k@example.pk',
    city: 'Lahore',
    marketingConsent: true,
    consentAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    orderCount: 3,
    totalSpent: 14850,
    lastOrderDate: new Date().toISOString(),
  },
  {
    id: 'cust-2',
    fullName: 'Fatima Zahra',
    phone: '03214567890',
    email: 'fatima@gmail.com',
    city: 'Karachi',
    marketingConsent: true,
    consentAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    orderCount: 2,
    totalSpent: 12200,
    lastOrderDate: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'cust-3',
    fullName: 'Kamran Ashraf',
    phone: '03339876543',
    email: 'kamran@yahoo.com',
    city: 'Rawalpindi',
    marketingConsent: false, // NOT CONSENTED
    consentAt: null,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    orderCount: 1,
    totalSpent: 3200,
    lastOrderDate: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'cust-4',
    fullName: 'Bilal Siddiqui',
    phone: '03451122334',
    email: 'bilal.s@hotmail.com',
    city: 'Islamabad',
    marketingConsent: true,
    consentAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    orderCount: 4,
    totalSpent: 26400,
    lastOrderDate: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: 'cust-5',
    fullName: 'Zainab Tariq',
    phone: '03123456789',
    email: 'zainab@gmail.com',
    city: 'Faisalabad',
    marketingConsent: true,
    consentAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    orderCount: 1,
    totalSpent: 5100,
    lastOrderDate: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
];

/**
 * Fetch customer list with search, marketing consent filter, order metrics
 */
export async function getAdminCustomersAction(filters?: {
  search?: string;
  consentOnly?: boolean;
}): Promise<{ success: boolean; customers: AdminCustomerItem[]; error?: string }> {
  try {
    await requireRole('staff');

    if (!isSupabaseConfigured()) {
      let list = [...mockCustomersStore];
      if (filters?.consentOnly) {
        list = list.filter((c) => c.marketingConsent);
      }
      if (filters?.search) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (c) =>
            c.fullName.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            c.city.toLowerCase().includes(q)
        );
      }
      return { success: true, customers: list };
    }

    const admin = getServiceRoleClient();

    // Query profiles and aggregate order stats
    const [profilesRes, ordersRes] = await Promise.all([
      (admin as any).from('profiles').select('*').order('created_at', { ascending: false }),
      (admin as any).from('orders').select('id, customer_id, customer_name, guest_name, phone, guest_phone, guest_email, total_amount, addr_city, city, risk_flags, created_at').order('created_at', { ascending: false }),
    ]);

    const profiles = profilesRes.data || [];
    const orders = ordersRes.data || [];

    const mapped: AdminCustomerItem[] = profiles.map((p: any) => {
      const userOrders = orders.filter(
        (o: any) =>
          o.customer_id === p.id ||
          (p.phone && o.phone && o.phone.replace(/\D/g, '') === p.phone.replace(/\D/g, ''))
      );

      const totalSpent = userOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
      const latestOrder = userOrders[0];

      return {
        id: p.id,
        fullName: p.full_name || 'Customer',
        phone: p.phone || '03001234567',
        email: p.email || null,
        city: latestOrder?.addr_city || latestOrder?.city || 'Lahore',
        marketingConsent: Boolean(p.marketing_consent),
        consentAt: p.consent_at || null,
        createdAt: p.created_at,
        orderCount: userOrders.length,
        totalSpent,
        lastOrderDate: latestOrder?.created_at || null,
      };
    });

    // Also collect guest orders whose phone is not in registered profiles
    const profilePhones = new Set(profiles.map((p: any) => p.phone?.replace(/\D/g, '')).filter(Boolean));
    const guestPhoneMap = new Map<string, any[]>();

    orders.forEach((o: any) => {
      const rawPhone = (o.guest_phone || o.phone || '').replace(/\D/g, '');
      if (rawPhone && !profilePhones.has(rawPhone)) {
        if (!guestPhoneMap.has(rawPhone)) {
          guestPhoneMap.set(rawPhone, []);
        }
        guestPhoneMap.get(rawPhone)!.push(o);
      }
    });

    guestPhoneMap.forEach((userOrders, rawPhone) => {
      const latestOrder = userOrders[0];
      const hasConsent = userOrders.some((o: any) => Boolean(o.risk_flags?.marketing_consent));
      const totalSpent = userOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);

      const formattedPhone = rawPhone.startsWith('92')
        ? '0' + rawPhone.slice(2)
        : rawPhone.startsWith('0')
        ? rawPhone
        : '0' + rawPhone;

      mapped.push({
        id: `guest-${rawPhone}`,
        fullName: latestOrder.guest_name || latestOrder.customer_name || 'Guest Shopper',
        phone: formattedPhone,
        email: latestOrder.guest_email || null,
        city: latestOrder.addr_city || latestOrder.city || 'Pakistan',
        marketingConsent: hasConsent,
        consentAt: latestOrder.risk_flags?.marketing_consent_at || latestOrder.created_at,
        createdAt: latestOrder.created_at,
        orderCount: userOrders.length,
        totalSpent,
        lastOrderDate: latestOrder.created_at,
      });
    });

    let result = mapped;
    if (filters?.consentOnly) {
      result = result.filter((c) => c.marketingConsent);
    }
    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          c.city.toLowerCase().includes(q)
      );
    }

    return { success: true, customers: result };
  } catch (err: any) {
    return { success: false, customers: [], error: err.message };
  }
}

/**
 * Export consented customers to CSV for marketing broadcasts (SMS, WhatsApp, Email)
 */
export async function exportConsentedCustomersCsvAction(): Promise<{
  success: boolean;
  csvContent?: string;
  filename?: string;
  count?: number;
  error?: string;
}> {
  try {
    const adminUser = await requireRole('manager');

    const res = await getAdminCustomersAction({ consentOnly: true });
    if (!res.success) return { success: false, error: res.error };

    const consented = res.customers;
    if (consented.length === 0) {
      return { success: false, error: 'No customers found with active marketing consent.' };
    }

    const headers = ['Full Name', 'Mobile Phone', 'Email', 'City', 'Total Orders', 'Total Spent (PKR)', 'Consent Opt-in Date'];

    const rows = consented.map((c) => {
      const cleanPhone = c.phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('92')
        ? '0' + cleanPhone.slice(2)
        : cleanPhone.startsWith('0')
        ? cleanPhone
        : '0' + cleanPhone;

      return [
        `"${c.fullName.replace(/"/g, '""')}"`,
        `"${formattedPhone}"`,
        `"${c.email || ''}"`,
        `"${c.city}"`,
        `${c.orderCount}`,
        `${c.totalSpent}`,
        `"${c.consentAt ? new Date(c.consentAt).toLocaleDateString() : 'Yes'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const filename = `consented_customers_marketing_${new Date().toISOString().slice(0, 10)}.csv`;

    await recordAuditLog({
      action: 'EXPORT_MARKETING_CUSTOMERS_CSV',
      entity: 'customers',
      diff: { count: consented.length, filename },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true, csvContent, filename, count: consented.length };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

