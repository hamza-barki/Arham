'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentAdminUser } from '@/lib/admin-auth';
import { OrderStatusV2 } from '@/types/database';

export interface DashboardMetrics {
  todayOrdersCount: number;
  pendingConfirmationsCount: number;
  pipelineRevenue: number; // in-flight unfulfilled orders: pending_confirmation, confirmed, ordered_from_supplier, shipped
  realizedRevenue: number; // strictly delivered orders only
  totalRevenue: number;
  realizedProfit: number | null; // strictly delivered orders: selling - (cost + supplier_delivery + cod_fee)
  estimatedProfit: number | null; // backward compatibility alias
  profitMarginPercent: number | null;
  rtoRate: number; // percentage (0 - 100)
  rtoCount: number;
  deliveredCount: number;
  shippedCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    variantName?: string;
    stock: number;
    price: number;
    supplierSku?: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    phone: string;
    city: string;
    status: OrderStatusV2;
    totalAmount: number;
    createdAt: string;
    requiresAreaReview: boolean;
  }>;
  statusBreakdown: Record<OrderStatusV2, number>;
  topCities: Array<{ city: string; count: number; total: number }>;
}

export async function getDashboardMetricsAction(): Promise<{
  success: boolean;
  data?: DashboardMetrics;
  error?: string;
}> {
  try {
    const adminUser = await getCurrentAdminUser();
    const canViewProfit = adminUser ? adminUser.role !== 'staff' : false;

    if (!isSupabaseConfigured()) {
      const isDemo = process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
      if (!isDemo) {
        return { success: false, error: 'Database unconfigured. Demo mock store is disabled in production.' };
      }

      // Offline / Demo seed data (Only when DEMO_MODE=true and not in production)
      const mockMetrics: DashboardMetrics = {
        todayOrdersCount: 14,
        pendingConfirmationsCount: 5,
        pipelineRevenue: 34500,
        realizedRevenue: 50000,
        totalRevenue: 84500,
        realizedProfit: canViewProfit ? 17500 : null,
        estimatedProfit: canViewProfit ? 17500 : null,
        profitMarginPercent: canViewProfit ? 35.0 : null,
        rtoRate: 4.8,
        rtoCount: 2,
        deliveredCount: 38,
        shippedCount: 12,
        lowStockItems: [
          {
            id: 'prod-low-1',
            name: 'Embroidered Lawn Kurti - Floral Mint',
            variantName: 'Size: S',
            stock: 2,
            price: 3450,
            supplierSku: 'MKZ-LWN-091',
          },
          {
            id: 'prod-low-2',
            name: 'Silk Jacquard Stole - Emerald',
            variantName: 'Standard',
            stock: 4,
            price: 1850,
            supplierSku: 'MKZ-STL-402',
          },
          {
            id: 'prod-low-3',
            name: 'Handcrafted Khussa - Gold Tilla',
            variantName: 'Size: 38',
            stock: 1,
            price: 2950,
            supplierSku: 'MKZ-KHS-118',
          },
        ],
        recentOrders: [
          {
            id: 'ord-rec-1',
            orderNumber: 'PK-99120',
            customerName: 'Ayesha Khan',
            phone: '03001234567',
            city: 'Lahore',
            status: 'pending_confirmation',
            totalAmount: 4950,
            createdAt: new Date().toISOString(),
            requiresAreaReview: false,
          },
          {
            id: 'ord-rec-2',
            orderNumber: 'PK-99119',
            customerName: 'Fatima Zahra',
            phone: '03214567890',
            city: 'Karachi',
            status: 'confirmed',
            totalAmount: 6800,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            requiresAreaReview: false,
          },
          {
            id: 'ord-rec-3',
            orderNumber: 'PK-99118',
            customerName: 'Kamran Ashraf',
            phone: '03339876543',
            city: 'Rawalpindi',
            status: 'pending_confirmation',
            totalAmount: 3200,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            requiresAreaReview: true,
          },
          {
            id: 'ord-rec-4',
            orderNumber: 'PK-99117',
            customerName: 'Bilal Siddiqui',
            phone: '03451122334',
            city: 'Islamabad',
            status: 'shipped',
            totalAmount: 9400,
            createdAt: new Date(Date.now() - 14400000).toISOString(),
            requiresAreaReview: false,
          },
          {
            id: 'ord-rec-5',
            orderNumber: 'PK-99116',
            customerName: 'Hina Tariq',
            phone: '03123456789',
            city: 'Faisalabad',
            status: 'delivered',
            totalAmount: 5100,
            createdAt: new Date(Date.now() - 28800000).toISOString(),
            requiresAreaReview: false,
          },
        ],
        statusBreakdown: {
          pending_confirmation: 5,
          confirmed: 18,
          ordered_from_supplier: 9,
          shipped: 12,
          delivered: 38,
          returned_rto: 2,
          cancelled: 3,
        },
        topCities: [
          { city: 'Lahore', count: 32, total: 148500 },
          { city: 'Karachi', count: 28, total: 132000 },
          { city: 'Islamabad', count: 14, total: 68400 },
          { city: 'Rawalpindi', count: 9, total: 41200 },
          { city: 'Faisalabad', count: 7, total: 32900 },
        ],
      };

      return { success: true, data: mockMetrics };
    }

    const admin = getServiceRoleClient();

    // Query live database with exact PKT (UTC+5) day boundary
    const nowUtc = new Date();
    const pktDateStr = nowUtc.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    const startOfToday = new Date(`${pktDateStr}T00:00:00+05:00`);

    const [ordersRes, itemsRes, privateRes, productsRes] = await Promise.all([
      (admin as any).from('orders').select('*').order('created_at', { ascending: false }).limit(200),
      (admin as any).from('order_items').select('*'),
      (admin as any).from('product_private').select('*'),
      (admin as any).from('products').select('id, name, price, stock_quantity, product_variants(id, size, color, stock_quantity)'),
    ]);

    const orders = ordersRes.data || [];
    const orderItems = itemsRes.data || [];
    const privates = privateRes.data || [];
    const products = productsRes.data || [];

    const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= startOfToday);
    const pendingOrders = orders.filter((o: any) => o.status_v2 === 'pending_confirmation' || o.status === 'pending');
    const returnedOrders = orders.filter((o: any) => o.status_v2 === 'returned_rto');
    const shippedOrders = orders.filter((o: any) => o.status_v2 === 'shipped');
    const deliveredOrders = orders.filter((o: any) => o.status_v2 === 'delivered');

    // Revenue metrics: Pipeline (in-flight orders) vs Realized (delivered only)
    const pipelineOrders = orders.filter((o: any) =>
      ['pending_confirmation', 'confirmed', 'ordered_from_supplier', 'shipped'].includes(o.status_v2) ||
      (o.status === 'pending' && !o.status_v2)
    );

    const pipelineRevenue = pipelineOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
    const realizedRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
    const totalRevenue = pipelineRevenue + realizedRevenue;

    // Realized Net Profit: Calculated ONLY on delivered orders
    const deliveredOrderIds = new Set(deliveredOrders.map((o: any) => o.id));
    const deliveredItems = orderItems.filter((i: any) => deliveredOrderIds.has(i.order_id));

    let realizedProfit: number | null = null;
    let profitMarginPercent: number | null = null;

    if (canViewProfit) {
      let totalCostAndFees = 0;
      let totalDeliveredSold = 0;

      for (const item of deliveredItems) {
        const priv = privates.find((p: any) => p.product_id === item.product_id);
        const costPrice = priv ? Number(priv.cost_price) || 0 : 0;
        const deliveryCost = priv ? Number(priv.supplier_delivery_cost) || 0 : 0;
        const codFee = priv ? Number(priv.cod_fee) || 0 : 0;

        const itemRevenue = Number(item.price) * item.quantity;
        const itemExpenses = (costPrice + deliveryCost + codFee) * item.quantity;

        totalDeliveredSold += itemRevenue;
        totalCostAndFees += itemExpenses;
      }

      if (totalDeliveredSold > 0) {
        realizedProfit = Math.round(totalDeliveredSold - totalCostAndFees);
        profitMarginPercent = Number(((realizedProfit / totalDeliveredSold) * 100).toFixed(1));
      } else {
        realizedProfit = 0;
        profitMarginPercent = 0;
      }
    }

    // RTO Rate: returned_rto / (delivered + returned_rto)
    const completedFulfillments = deliveredOrders.length + returnedOrders.length;
    const rtoRate = completedFulfillments > 0
      ? Number(((returnedOrders.length / completedFulfillments) * 100).toFixed(1))
      : 0;

    // Low stock items (stock <= 5)
    const lowStockItems: any[] = [];
    for (const prod of products) {
      if (prod.stock_quantity <= 5) {
        const priv = privates.find((p: any) => p.product_id === prod.id);
        lowStockItems.push({
          id: prod.id,
          name: prod.name,
          stock: prod.stock_quantity,
          price: Number(prod.price),
          supplierSku: priv?.supplier_sku || undefined,
        });
      }
      if (Array.isArray(prod.product_variants)) {
        for (const v of prod.product_variants) {
          if (v.stock_quantity <= 5) {
            lowStockItems.push({
              id: `${prod.id}-${v.id}`,
              name: prod.name,
              variantName: `${v.size || ''} ${v.color || ''}`.trim() || 'Variant',
              stock: v.stock_quantity,
              price: Number(prod.price),
            });
          }
        }
      }
    }

    // Status breakdown
    const statusBreakdown: any = {
      pending_confirmation: 0,
      confirmed: 0,
      ordered_from_supplier: 0,
      shipped: 0,
      delivered: 0,
      returned_rto: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      const st = (o.status_v2 || 'pending_confirmation') as OrderStatusV2;
      statusBreakdown[st] = (statusBreakdown[st] || 0) + 1;
    }

    // Top cities
    const cityMap: Record<string, { count: number; total: number }> = {};
    for (const o of orders) {
      const c = o.addr_city || o.city || 'Other';
      if (!cityMap[c]) cityMap[c] = { count: 0, total: 0 };
      cityMap[c].count += 1;
      cityMap[c].total += Number(o.total_amount) || 0;
    }
    const topCities = Object.entries(cityMap)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Recent orders
    const recentOrders = orders.slice(0, 10).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      phone: o.phone,
      city: o.addr_city || o.city || 'Lahore',
      status: o.status_v2 || 'pending_confirmation',
      totalAmount: Number(o.total_amount) || 0,
      createdAt: o.created_at,
      requiresAreaReview: Boolean(o.requires_area_review || o.is_custom_area),
    }));

    return {
      success: true,
      data: {
        todayOrdersCount: todayOrders.length,
        pendingConfirmationsCount: pendingOrders.length,
        pipelineRevenue,
        realizedRevenue,
        totalRevenue,
        realizedProfit,
        estimatedProfit: realizedProfit,
        profitMarginPercent,
        rtoRate,
        rtoCount: returnedOrders.length,
        deliveredCount: deliveredOrders.length,
        shippedCount: shippedOrders.length,
        lowStockItems: lowStockItems.slice(0, 6),
        recentOrders,
        statusBreakdown,
        topCities,
      },
    };
  } catch (err: any) {
    console.error('getDashboardMetricsAction error:', err);
    return { success: false, error: err.message || 'Failed to fetch dashboard metrics' };
  }
}

