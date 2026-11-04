'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { normalizePakistaniPhone } from '@/lib/utils';

export interface UnsubscribeResult {
  success: boolean;
  message: string;
}

export async function processUnsubscribe(rawIdentifier: string): Promise<UnsubscribeResult> {
  const clean = rawIdentifier.trim();
  if (!clean) {
    return { success: false, message: 'Please provide an email or phone number.' };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: `You have been unsubscribed from ${clean}. You will no longer receive promotional alerts.`,
    };
  }

  try {
    const supabase = getServiceRoleClient();

    if (clean.includes('@')) {
      // Email unsubscribe
      await (supabase as any)
        .from('profiles')
        .update({ marketing_consent: false })
        .ilike('email', clean);
    } else {
      // Phone unsubscribe
      const phoneNorm = normalizePakistaniPhone(clean);
      if (phoneNorm) {
        await (supabase as any)
          .from('profiles')
          .update({ marketing_consent: false })
          .eq('phone', phoneNorm);
      }
    }

    return {
      success: true,
      message: `Your preferences have been updated. ${clean} will no longer receive promotional emails or WhatsApp broadcasts.`,
    };
  } catch (err: any) {
    console.error('Unsubscribe error:', err);
    return {
      success: false,
      message: 'Could not process unsubscribe request. Please contact our WhatsApp helpline.',
    };
  }
}
