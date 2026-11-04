'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requireRole, recordAuditLog } from '@/lib/admin-auth';
import {
  StoreSettings,
  DEFAULT_STORE_SETTINGS,
  inMemoryStoreSettings,
} from '@/lib/settings';
import {
  BlockedEntityRecord,
  inMemoryBlockedEntities,
} from '@/lib/risk-engine';
import { normalizePakistaniPhone } from '@/lib/utils';

/**
 * Fetch current store settings (shipping, COD fees, advance payment rules, open parcel flag)
 */
export async function getStoreSettingsAction(): Promise<{
  success: boolean;
  settings: StoreSettings;
  error?: string;
}> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, settings: inMemoryStoreSettings };
    }

    const admin = getServiceRoleClient();
    const { data, error } = await (admin as any)
      .from('store_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error || !data) {
      return { success: true, settings: DEFAULT_STORE_SETTINGS };
    }

    const settings: StoreSettings = {
      freeShippingThreshold: Number(data.free_shipping_threshold) || 3000,
      shippingFee: Number(data.shipping_fee) || 200,
      codFee: Number(data.cod_fee) || 50,
      allowOpenParcel: Boolean(data.allow_open_parcel),
      advancePayment: {
        enabled: Boolean(data.advance_payment_enabled),
        thresholdAmount: Number(data.advance_payment_threshold) || 8000,
        advanceAmount: Number(data.advance_payment_amount) || 500,
        accountDetails: data.advance_payment_account || DEFAULT_STORE_SETTINGS.advancePayment.accountDetails,
      },
      riskThresholds: {
        duplicateWindowMinutes: Number(data.duplicate_window_minutes) || DEFAULT_STORE_SETTINGS.riskThresholds.duplicateWindowMinutes,
        highValueThreshold: Number(data.high_value_threshold) || DEFAULT_STORE_SETTINGS.riskThresholds.highValueThreshold,
        highRiskScore: Number(data.high_risk_score) || DEFAULT_STORE_SETTINGS.riskThresholds.highRiskScore,
        mediumRiskScore: Number(data.medium_risk_score) || DEFAULT_STORE_SETTINGS.riskThresholds.mediumRiskScore,
      },
    };

    return { success: true, settings };
  } catch (err: any) {
    return { success: false, settings: DEFAULT_STORE_SETTINGS, error: err.message };
  }
}

/**
 * Update store settings (Admins only)
 */
export async function updateStoreSettingsAction(
  newSettings: StoreSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('admin');

    if (!isSupabaseConfigured()) {
      inMemoryStoreSettings.freeShippingThreshold = newSettings.freeShippingThreshold;
      inMemoryStoreSettings.shippingFee = newSettings.shippingFee;
      inMemoryStoreSettings.codFee = newSettings.codFee;
      inMemoryStoreSettings.allowOpenParcel = newSettings.allowOpenParcel;
      inMemoryStoreSettings.advancePayment = { ...newSettings.advancePayment };
      if (newSettings.riskThresholds) {
        inMemoryStoreSettings.riskThresholds = { ...newSettings.riskThresholds };
      }

      await recordAuditLog({
        action: 'UPDATE_STORE_SETTINGS',
        entity: 'store_settings',
        diff: newSettings,
        actorId: adminUser.userId,
        actorName: adminUser.fullName,
      });

      return { success: true };
    }

    const admin = getServiceRoleClient();
    const { error } = await (admin as any).from('store_settings').upsert({
      id: 'default',
      free_shipping_threshold: newSettings.freeShippingThreshold,
      shipping_fee: newSettings.shippingFee,
      cod_fee: newSettings.codFee,
      allow_open_parcel: newSettings.allowOpenParcel,
      advance_payment_enabled: newSettings.advancePayment.enabled,
      advance_payment_threshold: newSettings.advancePayment.thresholdAmount,
      advance_payment_amount: newSettings.advancePayment.advanceAmount,
      advance_payment_account: newSettings.advancePayment.accountDetails,
      updated_at: new Date().toISOString(),
      updated_by: adminUser.userId,
    });

    if (error) return { success: false, error: error.message };

    await recordAuditLog({
      action: 'UPDATE_STORE_SETTINGS',
      entity: 'store_settings',
      diff: newSettings,
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch blocked entities (phone & address blacklist)
 */
export async function getBlockedEntitiesAction(): Promise<{
  success: boolean;
  blockedList: BlockedEntityRecord[];
  error?: string;
}> {
  try {
    await requireRole('staff');

    if (!isSupabaseConfigured()) {
      return { success: true, blockedList: inMemoryBlockedEntities };
    }

    const admin = getServiceRoleClient();
    const { data, error } = await (admin as any)
      .from('blocked_entities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { success: false, blockedList: [], error: error.message };

    const mapped: BlockedEntityRecord[] = (data || []).map((b: any) => ({
      id: b.id,
      type: b.type,
      value: b.value,
      reason: b.reason || 'Flagged for return fraud',
      createdAt: b.created_at,
    }));

    return { success: true, blockedList: mapped };
  } catch (err: any) {
    return { success: false, blockedList: [], error: err.message };
  }
}

/**
 * Add a phone or address to the blocklist
 */
export async function addBlockedEntityAction(input: {
  type: 'phone' | 'address';
  value: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('manager');

    if (!input.value.trim() || !input.reason.trim()) {
      return { success: false, error: 'Value and reason are required.' };
    }

    const cleanValue =
      input.type === 'phone'
        ? normalizePakistaniPhone(input.value) || input.value.trim()
        : input.value.trim();

    if (!isSupabaseConfigured()) {
      inMemoryBlockedEntities.unshift({
        id: 'blk-' + Date.now(),
        type: input.type,
        value: cleanValue,
        reason: input.reason.trim(),
        createdAt: new Date().toISOString(),
      });

      await recordAuditLog({
        action: 'ADD_BLOCKED_ENTITY',
        entity: 'blocked_entities',
        diff: { type: input.type, value: cleanValue, reason: input.reason },
        actorId: adminUser.userId,
        actorName: adminUser.fullName,
      });

      return { success: true };
    }

    const admin = getServiceRoleClient();
    const { error } = await (admin as any).from('blocked_entities').insert({
      type: input.type,
      value: cleanValue,
      reason: input.reason.trim(),
      created_by: adminUser.userId,
    });

    if (error) return { success: false, error: error.message };

    await recordAuditLog({
      action: 'ADD_BLOCKED_ENTITY',
      entity: 'blocked_entities',
      diff: { type: input.type, value: cleanValue, reason: input.reason },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Remove an entity from the blocklist
 */
export async function removeBlockedEntityAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('manager');

    if (!isSupabaseConfigured()) {
      const idx = inMemoryBlockedEntities.findIndex((b) => b.id === id);
      if (idx !== -1) {
        const removed = inMemoryBlockedEntities.splice(idx, 1)[0];
        await recordAuditLog({
          action: 'REMOVE_BLOCKED_ENTITY',
          entity: 'blocked_entities',
          entityId: id,
          diff: removed,
          actorId: adminUser.userId,
          actorName: adminUser.fullName,
        });
      }
      return { success: true };
    }

    const admin = getServiceRoleClient();
    const { error } = await (admin as any).from('blocked_entities').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    await recordAuditLog({
      action: 'REMOVE_BLOCKED_ENTITY',
      entity: 'blocked_entities',
      entityId: id,
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

