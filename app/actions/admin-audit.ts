'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { requireRole, inMemoryAuditLogs } from '@/lib/admin-auth';

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  diff: any;
  createdAt: string;
}

export async function getAuditLogsAction(filters?: {
  entity?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ success: boolean; logs: AuditLogItem[]; total: number; error?: string }> {
  try {
    await requireRole('manager');

    if (!isSupabaseConfigured()) {
      let filtered = [...inMemoryAuditLogs];
      if (filters?.entity && filters.entity !== 'all') {
        filtered = filtered.filter((l) => l.entity.toLowerCase() === filters.entity!.toLowerCase());
      }
      if (filters?.action && filters.action !== 'all') {
        filtered = filtered.filter((l) => l.action.toLowerCase() === filters.action!.toLowerCase());
      }

      return {
        success: true,
        logs: filtered.map((l) => ({
          id: l.id,
          actorId: l.actor_id,
          actorEmail: l.actor_name || 'Admin',
          action: l.action,
          entity: l.entity,
          entityId: l.entity_id,
          diff: l.diff,
          createdAt: l.created_at,
        })),
        total: filtered.length,
      };
    }

    const admin = getServiceRoleClient();
    let query = (admin as any).from('audit_log').select('*, profiles(email, full_name)', { count: 'exact' });

    if (filters?.entity && filters.entity !== 'all') {
      query = query.eq('entity', filters.entity);
    }
    if (filters?.action && filters.action !== 'all') {
      query = query.eq('action', filters.action);
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 30;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return { success: false, logs: [], total: 0, error: error.message };
    }

    const logs: AuditLogItem[] = (data || []).map((l: any) => ({
      id: l.id,
      actorId: l.actor_id,
      actorEmail: l.profiles?.email || l.actor_id || 'System',
      action: l.action,
      entity: l.entity,
      entityId: l.entity_id,
      diff: l.diff,
      createdAt: l.created_at,
    }));

    return {
      success: true,
      logs,
      total: count || logs.length,
    };
  } catch (err: any) {
    return { success: false, logs: [], total: 0, error: err.message };
  }
}

