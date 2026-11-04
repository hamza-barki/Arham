'use server';

import { headers } from 'next/headers';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { CartItem } from '@/types';
import { checkoutSchema, CheckoutInput } from '@/lib/validations/order';
import { normalizePakistaniPhone } from '@/lib/utils';
import { checkOrderRateLimit, extractTrustedIp } from '@/lib/rate-limit';
import { INITIAL_PRODUCTS } from '@/lib/constants';
import { sendOrderReceivedEmail } from '@/lib/email';
import { calculateHonestTotal } from '@/lib/settings';
import { evaluateOrderRisk } from '@/lib/risk-engine';
import crypto from 'crypto';

export type { CheckoutInput };

export interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  confirmationToken?: string;
  totalAmount?: number;
  error?: string;
}

/**
 * Server Action: Place Order
 * Security hardened:
 * 1. Validates honeypot and durable rate limits per IP & phone.
 * 2. Normalizes phone to standard Pakistani 03XXXXXXXXX format.
 * 3. Never trusts client prices - RPC reads all prices from the DB.
 * 4. Sends only variant_id + quantity to the RPC (no price field).
 * 5. Uses service_role client; anon cannot call place_order_atomic directly.
 * 6. IP extracted from a single trusted reverse-proxy header only.
 */
export async function placeOrder(
  formData: CheckoutInput,
  clientItems: CartItem[]
): Promise<PlaceOrderResult> {
  // 1. Edge Case: Empty Cart
  if (!clientItems || clientItems.length === 0) {
    return { success: false, error: 'Your shopping cart is empty. Please add items before checkout.' };
  }

  // 2. Validate Form Data with Zod
  const validation = checkoutSchema.safeParse(formData);
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join('. ');
    return { success: false, error: errorMsg };
  }

  const {
    customerName,
    phone,
    email,
    address,
    province,
    city,
    areaId,
    areaName,
    isCustomArea,
    customAreaName,
    postalCode,
    landmark,
    lat,
    lng,
    notes,
    paymentMethod,
    customerId,
    marketingConsent,
    website_url_hp,
    idempotencyKey,
  } = validation.data;

  // 3. Anti-Spam: Honeypot check
  if (website_url_hp && website_url_hp.length > 0) {
    console.warn('[Anti-Spam] Honeypot triggered. Rejecting automated request.');
    return { success: false, error: 'Invalid submission detected. Please refresh and try again.' };
  }

  // 4. Phone Normalization
  const normalizedPhone = normalizePakistaniPhone(phone);
  if (!normalizedPhone) {
    return {
      success: false,
      error: 'Please enter a valid Pakistani mobile number (e.g. 03001234567).',
    };
  }

  // 5. Extract trusted IP from a single reverse-proxy header
  const headerList = headers();
  const clientIp = extractTrustedIp(headerList);

  // 6. Handle Fallback / Mock Mode if Supabase is unconfigured
  if (!isSupabaseConfigured()) {
    let serverSubtotal = 0;
    for (const item of clientItems) {
      const dbProduct = INITIAL_PRODUCTS.find((p) => p.id === item.productId);
      if (!dbProduct || !dbProduct.is_active) {
        return { success: false, error: `Product "${item.name}" is currently unavailable.` };
      }
      if (item.variantId) {
        const dbVariant = dbProduct.variants?.find((v) => v.id === item.variantId);
        if (!dbVariant || dbVariant.stock_quantity < item.quantity) {
          return { success: false, error: `Selected variant for "${item.name}" is out of stock.` };
        }
      } else if (dbProduct.stock_quantity < item.quantity) {
        return { success: false, error: `Product "${item.name}" is out of stock.` };
      }
      serverSubtotal += dbProduct.price * item.quantity;
    }

    const honestPricing = calculateHonestTotal(serverSubtotal, paymentMethod || 'COD');
    const mockOrderNumber = 'PK-' + Math.floor(10000 + Math.random() * 90000);
    const mockTotal = honestPricing.grandTotal;

    const riskEvaluation = await evaluateOrderRisk({
      phone: normalizedPhone,
      address,
      city,
      totalAmount: mockTotal,
      isCustomArea: Boolean(isCustomArea),
      areaId: areaId || null,
      customAreaName: customAreaName || null,
    });

    // Send email only when an email exists
    if (email && email.includes('@')) {
      sendOrderReceivedEmail({
        orderNumber: mockOrderNumber,
        customerName,
        customerEmail: email,
        phone: normalizedPhone,
        city,
        address,
        totalAmount: mockTotal,
        paymentMethod: paymentMethod || 'COD',
        items: clientItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          variant: i.size ? `${i.size}${i.color ? ` / ${i.color}` : ''}` : undefined,
        })),
      }).catch((e) => console.warn('[Order Received Email Error]', e));
    }

    return {
      success: true,
      orderId: 'ord_' + crypto.randomBytes(8).toString('hex'),
      orderNumber: mockOrderNumber,
      confirmationToken: crypto.randomBytes(24).toString('hex'),
      totalAmount: mockTotal,
    };
  }

  // 7. Live Supabase Execution
  try {
    const admin = getServiceRoleClient();

    // 7a. Durable rate limiting (uses Supabase table, not in-memory Map)
    const rateCheck = await checkOrderRateLimit(admin, clientIp, normalizedPhone);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: rateCheck.reason || 'Order submission limit reached. Please wait a few minutes.',
      };
    }

    // 7b. Build RPC payload: ONLY variant_id + quantity per item (NO price).
    //     The DB function reads all prices from the products table.
    const rpcItems = clientItems.map((item) => ({
      variant_id: item.variantId || null,
      product_id: item.variantId ? null : item.productId,
      quantity: item.quantity,
      // NOTE: price is intentionally omitted - RPC reads from DB
    }));

    const customerPayload = {
      customer_name: customerName,
      phone: normalizedPhone,
      email: email || null,
      address,
      city,
      postal_code: postalCode || null,
      payment_method: paymentMethod || 'COD',
      notes: notes || null,
    };

    // 7c. Execute the RPC (service_role only - anon/authenticated are REVOKEd)
    const { data: rpcResult, error: rpcError } = await (admin as any).rpc('place_order_atomic', {
      p_customer:        customerPayload,
      p_items:           rpcItems,
      p_idempotency_key: idempotencyKey || crypto.randomUUID(),
    });

    if (rpcError) {
      console.error('Atomic order RPC error:', rpcError);
      if (rpcError.message?.includes('INSUFFICIENT_STOCK')) {
        return {
          success: false,
          error: 'One or more items just went out of stock. Please adjust your cart.',
        };
      }
      if (rpcError.message?.includes('PRODUCT_INACTIVE')) {
        return {
          success: false,
          error: 'One or more products are no longer available.',
        };
      }
      return {
        success: false,
        error: 'Unable to complete order placement. Please review your details and try again.',
      };
    }

    if (!rpcResult || !rpcResult.success) {
      return { success: false, error: rpcResult?.error || 'Order processing failed.' };
    }

    // Attach customer account & address snapshots
    if (rpcResult.order_id) {
      const finalAreaName = isCustomArea ? (customAreaName || areaName) : areaName;

      const orderUpdates: any = {
        addr_province: province || null,
        addr_city: city,
        addr_area_name: finalAreaName || null,
        addr_address_line: address,
        addr_landmark: landmark || null,
        addr_lat: typeof lat === 'number' ? lat : null,
        addr_lng: typeof lng === 'number' ? lng : null,
        requires_area_review: Boolean(isCustomArea),
        is_custom_area: Boolean(isCustomArea),
      };

      const riskEvaluation = await evaluateOrderRisk({
        phone: normalizedPhone,
        address,
        city,
        totalAmount: Number(rpcResult.total_amount) || 0,
        isCustomArea: Boolean(isCustomArea),
        areaId: areaId || null,
        customAreaName: customAreaName || null,
      });

      orderUpdates.risk_flags = {
        ...riskEvaluation,
        marketing_consent: Boolean(marketingConsent),
        marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
      };
      orderUpdates.status_v2 = 'pending_confirmation';
      orderUpdates.status = 'pending';

      if (customerId) {
        orderUpdates.customer_id = customerId;
        orderUpdates.user_id = customerId;

        // Save into customer address book for instant re-use
        try {
          await (admin as any).from('addresses').insert({
            user_id: customerId,
            full_name: customerName,
            phone: normalizedPhone,
            province: province,
            city: city,
            area_id: isCustomArea ? null : (areaId || null),
            address_line: address,
            landmark: landmark || null,
            lat: typeof lat === 'number' ? lat : null,
            lng: typeof lng === 'number' ? lng : null,
            is_custom_area: Boolean(isCustomArea),
            is_default: false,
          });
        } catch (e) {
          console.warn('Address auto-save notice:', e);
        }
      }

      await (admin as any).from('orders').update(orderUpdates).eq('id', rpcResult.order_id);

      // Record marketing consent if customer opted in
      if (marketingConsent && customerId) {
        await (admin as any).from('profiles').update({
          marketing_consent: true,
          consent_at: new Date().toISOString(),
        }).eq('id', customerId);
      }

      // Send email only when an email exists
      if (email && email.includes('@')) {
        sendOrderReceivedEmail({
          orderNumber: rpcResult.order_number,
          customerName,
          customerEmail: email,
          phone: normalizedPhone,
          city,
          address,
          totalAmount: rpcResult.total_amount,
          paymentMethod: paymentMethod || 'COD',
          items: clientItems.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            variant: i.size ? `${i.size}${i.color ? ` / ${i.color}` : ''}` : undefined,
          })),
        }).catch((e) => console.warn('[Order Received Email Error]', e));
      }
    }

    return {
      success: true,
      orderId: rpcResult.order_id,
      orderNumber: rpcResult.order_number,
      confirmationToken: rpcResult.confirmation_token,
      totalAmount: rpcResult.total_amount,
    };
  } catch (err: any) {
    console.error('Unexpected error in placeOrder:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again shortly.',
    };
  }
}
