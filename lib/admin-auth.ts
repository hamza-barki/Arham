import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { UserRole } from '@/types/database';

export interface AdminUserSession {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
}

// In-memory mock audit log for offline/demo development
export const inMemoryAuditLogs: Array<{
  id: string;
  actor_id: string | null;
  actor_name?: string;
  action: string;
  entity: string;
  entity_id: string | null;
  diff: any;
  created_at: string;
}> = [];

const ROLE_LEVELS: Record<UserRole, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

/**
 * Get currently authenticated admin user and their assigned role from session cookies.
 * Fail-closed: Never returns fake admin in production.
 */
export async function getCurrentAdminUser(): Promise<AdminUserSession | null> {
  const isDemo = process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';

  if (!isSupabaseConfigured()) {
    if (isDemo) {
      return {
        userId: 'demo-staff-id',
        email: 'demo@arhamcollection.pk',
        fullName: 'Demo Staff',
        role: 'staff',
        isSuperAdmin: false,
        isAdmin: false,
        isManager: false,
        isStaff: true,
      };
    }
    return null;
  }

  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from Server Components
          }
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      if (isDemo) {
        return {
          userId: 'demo-staff-id',
          email: 'demo@arhamcollection.pk',
          fullName: 'Demo Staff',
          role: 'staff',
          isSuperAdmin: false,
          isAdmin: false,
          isManager: false,
          isStaff: true,
        };
      }
      return null;
    }

    // Query user's real role from public.user_roles using service client
    const admin = getServiceRoleClient();
    const { data: roleRow, error: roleError } = await (admin as any)
      .from('user_roles')
      .select('role, profiles(full_name, email)')
      .eq('user_id', user.id)
      .order('role', { ascending: false })
      .limit(1)
      .single();

    if (roleError || !roleRow?.role) {
      return null;
    }

    const role = roleRow.role as UserRole;
    const level = ROLE_LEVELS[role] || 0;

    // Must be staff or above
    if (level < 1) {
      return null;
    }

    return {
      userId: user.id,
      email: roleRow.profiles?.email || user.email || 'staff@arhamcollection.pk',
      fullName: roleRow.profiles?.full_name || user.user_metadata?.full_name || 'Staff User',
      role,
      isSuperAdmin: level >= 4,
      isAdmin: level >= 3,
      isManager: level >= 2,
      isStaff: level >= 1,
    };
  } catch (err) {
    if (isDemo) {
      return {
        userId: 'demo-staff-id',
        email: 'demo@arhamcollection.pk',
        fullName: 'Demo Staff',
        role: 'staff',
        isSuperAdmin: false,
        isAdmin: false,
        isManager: false,
        isStaff: true,
      };
    }
    return null;
  }
}

/**
 * Enforce minimum role required for a server action.
 * Throws error if permission check fails.
 */
export async function requireRole(minRole: UserRole = 'staff'): Promise<AdminUserSession> {
  const user = await getCurrentAdminUser();
  if (!user) {
    throw new Error('401 Unauthorized: Admin authentication required.');
  }

  const currentLevel = ROLE_LEVELS[user.role] || 0;
  const requiredLevel = ROLE_LEVELS[minRole] || 1;

  if (currentLevel < requiredLevel) {
    throw new Error(`403 Forbidden: Insufficient permissions. Requires "${minRole}" role, current is "${user.role}".`);
  }

  return user;
}

/**
 * Record an entry into the centralized audit log
 */
export async function recordAuditLog(entry: {
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: any;
  actorId?: string | null;
  actorName?: string;
}): Promise<void> {
  const auditItem = {
    id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    actor_id: entry.actorId || 'admin',
    actor_name: entry.actorName || 'Admin Operator',
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId || null,
    diff: entry.diff || null,
    created_at: new Date().toISOString(),
  };

  inMemoryAuditLogs.unshift(auditItem);
  if (inMemoryAuditLogs.length > 200) {
    inMemoryAuditLogs.pop();
  }

  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const admin = getServiceRoleClient();
    await (admin as any).from('audit_logs').insert({
      actor_email: entry.actorName || 'staff@arhamcollection.pk',
      actor_role: 'staff',
      action: entry.action,
      target_type: entry.entity,
      target_id: entry.entityId || null,
      metadata: entry.diff || {},
    });
  } catch (err) {
    console.warn('Failed to persist audit log into database:', err);
  }
}
