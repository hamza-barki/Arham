'use server';

import { headers } from 'next/headers';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { normalizePakistaniPhone } from '@/lib/utils';
import { extractTrustedIp, checkContactRateLimit } from '@/lib/rate-limit';
import { sendStaffSupportNotificationEmail } from '@/lib/email';
import { inMemorySupportMessages, SupportMessageRecord } from '@/lib/support-store';

export interface ContactFormInput {
  name: string;
  email?: string;
  phone?: string;
  orderRef?: string;
  message: string;
  website_hp?: string; // Honeypot field
}

export interface ContactFormResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function submitContactForm(data: ContactFormInput): Promise<ContactFormResult> {
  // 1. Honeypot check: Bots fill this hidden input; humans do not
  if (data.website_hp && data.website_hp.trim().length > 0) {
    // Silently succeed for bots
    return {
      success: true,
      message: 'Thank you. Your message has been received.',
    };
  }

  // 2. Validate required inputs
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: 'Please provide your full name.' };
  }

  if (!data.message || data.message.trim().length < 10) {
    return { success: false, error: 'Message must be at least 10 characters long.' };
  }

  if (!data.email && !data.phone) {
    return { success: false, error: 'Please provide at least a phone number or email address so we can reach you.' };
  }

  let cleanPhone = data.phone?.trim() ? normalizePakistaniPhone(data.phone.trim()) : null;

  // 3. Rate Limit check
  const headerList = headers();
  const clientIp = extractTrustedIp(headerList);
  const supabase = isSupabaseConfigured() ? getServiceRoleClient() : null;

  const rateCheck = await checkContactRateLimit(supabase, clientIp, cleanPhone);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: rateCheck.reason || 'Too many messages sent. Please wait a few minutes or WhatsApp our support.',
    };
  }

  // 4. Insert into Supabase support_messages or In-Memory
  if (isSupabaseConfigured()) {
    try {
      const admin = getServiceRoleClient();
      const { error } = await (admin as any).from('support_messages').insert({
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: cleanPhone,
        message: data.message.trim(),
        order_ref: data.orderRef?.trim() || null,
        status: 'new',
      });

      if (error) {
        console.error('Supabase contact message error:', error);
        return {
          success: false,
          error: 'Could not submit your message at this moment. Please reach out via WhatsApp.',
        };
      }
    } catch (err: any) {
      console.error('Failed to save contact message:', err);
      return {
        success: false,
        error: 'Unable to reach support server. Please try again or WhatsApp us directly.',
      };
    }
  } else {
    // Local / offline fallback
    inMemorySupportMessages.unshift({
      id: 'msg-' + Date.now(),
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: cleanPhone,
      order_ref: data.orderRef?.trim() || null,
      message: data.message.trim(),
      status: 'new',
      staff_reply: null,
      replied_at: null,
      created_at: new Date().toISOString(),
    });
  }

  // 5. Notify Staff by Email (Asynchronous - never blocks user submission)
  sendStaffSupportNotificationEmail({
    name: data.name.trim(),
    email: data.email?.trim() || null,
    phone: cleanPhone,
    orderRef: data.orderRef?.trim() || null,
    messageText: data.message.trim(),
  }).catch((err) => console.warn('[Staff Email Notice Error]', err));

  return {
    success: true,
    message: 'Thank you! Your message has been forwarded to our support desk. We will respond within 4-8 business hours.',
  };
}
