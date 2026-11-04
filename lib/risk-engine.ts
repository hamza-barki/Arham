/**
 * Risk Assessment & Fraud Detection Engine for Cash on Delivery (COD)
 * 
 * Evaluates orders against Pakistani e-commerce risk signals:
 * 1. Blocked phone or address list (Admin-managed blacklist)
 * 2. Repeat phone with past Return-To-Origin (RTO) or cancellations
 * 3. Unusually high order value (> Rs. 10,000)
 * 4. Missing or unlisted courier delivery area
 * 5. Duplicate order placed from the same phone within 10 minutes
 */

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { normalizePakistaniPhone } from '@/lib/utils';
import { DEFAULT_STORE_SETTINGS } from '@/lib/settings';

export interface RiskFlag {
  code: 'blocked_entity' | 'past_rto_or_cancel' | 'high_value' | 'missing_area' | 'duplicate_order';
  severity: 'high' | 'medium' | 'low';
  label: string;
  description: string;
}

export interface RiskEvaluationResult {
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  flags: RiskFlag[];
  hasBlock: boolean;
  requiresReview: boolean;
}

export interface BlockedEntityRecord {
  id: string;
  type: 'phone' | 'address';
  value: string;
  reason: string;
  createdAt: string;
}

// In-memory blocked entities for offline / local dev
export let inMemoryBlockedEntities: BlockedEntityRecord[] = [
  {
    id: 'blk-1',
    type: 'phone',
    value: '03009999999',
    reason: 'Habitual doorstep rejection / refusal across 4 parcels',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'blk-2',
    type: 'address',
    value: 'Fake Village, Post Office Null',
    reason: 'Non-existent address in courier operational sector',
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
];

/**
 * Evaluates order risk factors
 */
export async function evaluateOrderRisk(input: {
  phone: string;
  address?: string | null;
  city?: string;
  totalAmount: number;
  isCustomArea?: boolean;
  areaId?: string | null;
  customAreaName?: string | null;
}): Promise<RiskEvaluationResult> {
  const flags: RiskFlag[] = [];
  let score = 0;
  const cleanPhone = normalizePakistaniPhone(input.phone) || input.phone.trim();
  const addressText = (input.address || '').toLowerCase().trim();

  // 1. Blocked Entity Check (Blacklist)
  let isBlocked = false;
  if (!isSupabaseConfigured()) {
    const match = inMemoryBlockedEntities.find((b) => {
      if (b.type === 'phone') {
        return normalizePakistaniPhone(b.value) === cleanPhone;
      }
      if (b.type === 'address') {
        return addressText && addressText.includes(b.value.toLowerCase().trim());
      }
      return false;
    });

    if (match) {
      isBlocked = true;
      flags.push({
        code: 'blocked_entity',
        severity: 'high',
        label: `Blacklisted ${match.type.toUpperCase()}`,
        description: `Entity is blocked: ${match.reason}`,
      });
      score += 80;
    }
  } else {
    try {
      const admin = getServiceRoleClient();
      const { data: blockedList } = await (admin as any).from('blocked_entities').select('*');
      const match = (blockedList || []).find((b: any) => {
        if (b.type === 'phone') return normalizePakistaniPhone(b.value) === cleanPhone;
        if (b.type === 'address') return addressText && addressText.includes(b.value.toLowerCase().trim());
        return false;
      });

      if (match) {
        isBlocked = true;
        flags.push({
          code: 'blocked_entity',
          severity: 'high',
          label: `Blacklisted ${match.type.toUpperCase()}`,
          description: `Entity is blocked: ${match.reason || 'Flagged for fraudulent orders'}`,
        });
        score += 80;
      }
    } catch (e) {
      console.warn('[RiskEngine Blocklist Check Error]', e);
    }
  }

  // 2. Past RTO or Cancellation Check
  if (!isSupabaseConfigured()) {
    // In mock data, phone '03339876543' has past RTO
    if (cleanPhone === '03339876543') {
      flags.push({
        code: 'past_rto_or_cancel',
        severity: 'high',
        label: 'Past RTO / Refusal History',
        description: 'Customer phone number has a record of returned / cancelled parcel.',
      });
      score += 45;
    }
  } else {
    try {
      const admin = getServiceRoleClient();
      const { data: pastOrders } = await (admin as any)
        .from('orders')
        .select('id, status_v2')
        .eq('phone', cleanPhone)
        .in('status_v2', ['returned_rto', 'cancelled']);

      if (pastOrders && pastOrders.length > 0) {
        flags.push({
          code: 'past_rto_or_cancel',
          severity: 'high',
          label: `Past RTO History (${pastOrders.length} failed)`,
          description: `Customer has ${pastOrders.length} previous returned or cancelled delivery.`,
        });
        score += 45;
      }
    } catch (e) {
      console.warn('[RiskEngine Past Orders Check Error]', e);
    }
  }

  // 3. Duplicate Order Check (Configurable Window from Store Settings, flags only - never auto-merges)
  const thresholds = DEFAULT_STORE_SETTINGS.riskThresholds;
  if (isSupabaseConfigured()) {
    try {
      const windowMs = (thresholds.duplicateWindowMinutes || 10) * 60 * 1000;
      const windowStart = new Date(Date.now() - windowMs).toISOString();
      const admin = getServiceRoleClient();
      const { data: recentOrders } = await (admin as any)
        .from('orders')
        .select('id, order_number, created_at')
        .eq('phone', cleanPhone)
        .gte('created_at', windowStart);

      if (recentOrders && recentOrders.length > 0) {
        flags.push({
          code: 'duplicate_order',
          severity: 'high',
          label: `Duplicate Order (${thresholds.duplicateWindowMinutes}m)`,
          description: `Customer placed another order (${recentOrders[0].order_number}) within the last ${thresholds.duplicateWindowMinutes} minutes. Flagged for review; not auto-merged.`,
        });
        score += 40;
      }
    } catch (e) {
      console.warn('[RiskEngine Duplicate Check Error]', e);
    }
  }

  // 4. Unusually High Order Value (Configurable threshold from Store Settings)
  if (input.totalAmount >= thresholds.highValueThreshold) {
    flags.push({
      code: 'high_value',
      severity: 'medium',
      label: `High Value Order (Rs. ${(thresholds.highValueThreshold / 1000).toFixed(0)}k+)`,
      description: `Order total of Rs. ${input.totalAmount.toLocaleString()} exceeds the standard COD limit. Verification or advance deposit advised.`,
    });
    score += 25;
  }

  // 5. Missing / Unlisted Delivery Area
  if (input.isCustomArea || !input.areaId) {
    flags.push({
      code: 'missing_area',
      severity: 'medium',
      label: 'Unlisted Custom Area',
      description: `Delivery area "${input.customAreaName || 'Unspecified'}" was manually entered and is not verified in courier database.`,
    });
    score += 20;
  }

  // Determine overall risk level using configurable thresholds
  const riskLevel: 'low' | 'medium' | 'high' =
    isBlocked || score >= thresholds.highRiskScore ? 'high' : score >= thresholds.mediumRiskScore ? 'medium' : 'low';

  return {
    riskLevel,
    riskScore: score,
    flags,
    hasBlock: isBlocked,
    requiresReview: riskLevel !== 'low',
  };
}

