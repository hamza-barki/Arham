'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentAdminUser, requireRole, recordAuditLog } from '@/lib/admin-auth';
import { UserRole } from '@/types/database';

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  grantedAt: string;
  isCurrentUser: boolean;
}

// In-memory mock team members for offline dev
let mockTeamStore: TeamMember[] = [
  {
    id: 'role-1',
    userId: 'mock-super-admin-id',
    email: 'admin@brandname.pk',
    fullName: 'Hamza Malik (Owner)',
    role: 'super_admin',
    grantedAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    isCurrentUser: true,
  },
  {
    id: 'role-2',
    userId: 'user-manager-1',
    email: 'ops.manager@brandname.pk',
    fullName: 'Saad Ahmed (Operations Lead)',
    role: 'manager',
    grantedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    isCurrentUser: false,
  },
  {
    id: 'role-3',
    userId: 'user-staff-1',
    email: 'callcenter1@brandname.pk',
    fullName: 'Maryam Bibi (CSR & Orders)',
    role: 'staff',
    grantedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    isCurrentUser: false,
  },
];

/**
 * Fetch team members (staff, managers, admins, super_admins)
 */
export async function getTeamMembersAction(): Promise<{
  success: boolean;
  members: TeamMember[];
  currentUserRole?: UserRole;
  error?: string;
}> {
  try {
    const adminUser = await requireRole('manager');

    if (!isSupabaseConfigured()) {
      return {
        success: true,
        members: mockTeamStore,
        currentUserRole: adminUser.role,
      };
    }

    const admin = getServiceRoleClient();
    const { data, error } = await (admin as any)
      .from('user_roles')
      .select('id, user_id, role, granted_at, profiles(email, full_name)')
      .order('granted_at', { ascending: false });

    if (error) {
      return { success: false, members: [], error: error.message };
    }

    const members: TeamMember[] = (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      email: r.profiles?.email || 'user@brandname.pk',
      fullName: r.profiles?.full_name || 'Staff Member',
      role: r.role as UserRole,
      grantedAt: r.granted_at,
      isCurrentUser: r.user_id === adminUser.userId,
    }));

    return {
      success: true,
      members,
      currentUserRole: adminUser.role,
    };
  } catch (err: any) {
    return { success: false, members: [], error: err.message };
  }
}

/**
 * Invite / Grant Role to Staff Member (Super Admin only)
 */
export async function inviteStaffAction(input: {
  email: string;
  fullName: string;
  role: UserRole;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('super_admin');

    if (!input.email.trim() || !input.fullName.trim()) {
      return { success: false, error: 'Email and full name are required.' };
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanRole = input.role;

    if (!isSupabaseConfigured()) {
      const newMember: TeamMember = {
        id: 'role-' + Date.now(),
        userId: 'user-' + Date.now(),
        email: cleanEmail,
        fullName: input.fullName.trim(),
        role: cleanRole,
        grantedAt: new Date().toISOString(),
        isCurrentUser: false,
      };
      mockTeamStore.push(newMember);

      await recordAuditLog({
        action: 'INVITE_STAFF',
        entity: 'user_roles',
        diff: { email: cleanEmail, role: cleanRole, fullName: input.fullName },
        actorId: adminUser.userId,
        actorName: adminUser.fullName,
      });

      return { success: true };
    }

    const admin = getServiceRoleClient();

    // 1. Check if user already exists in auth.users
    const { data: usersList } = await admin.auth.admin.listUsers();
    let targetUser = usersList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!targetUser) {
      // Create user invitation in auth
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: true,
        user_metadata: { full_name: input.fullName.trim() },
      });
      if (createErr) return { success: false, error: createErr.message };
      targetUser = newUser.user;
    }

    // 2. Ensure profile exists
    await (admin as any).from('profiles').upsert({
      id: targetUser.id,
      email: cleanEmail,
      full_name: input.fullName.trim(),
    });

    // 3. Assign role
    const { error: roleErr } = await (admin as any).from('user_roles').upsert(
      {
        user_id: targetUser.id,
        role: cleanRole,
        granted_by: adminUser.userId,
        granted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,role' }
    );

    if (roleErr) return { success: false, error: roleErr.message };

    await recordAuditLog({
      action: 'INVITE_STAFF',
      entity: 'user_roles',
      entityId: targetUser.id,
      diff: { email: cleanEmail, role: cleanRole, fullName: input.fullName },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update a user's role (Super Admin only)
 */
export async function updateUserRoleAction(input: {
  userId: string;
  roleId?: string;
  newRole: UserRole;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('super_admin');

    if (!isSupabaseConfigured()) {
      const found = mockTeamStore.find((m) => m.userId === input.userId || m.id === input.roleId);
      if (found) {
        if (found.role === 'super_admin' && input.newRole !== 'super_admin') {
          const superAdminCount = mockTeamStore.filter((m) => m.role === 'super_admin').length;
          if (superAdminCount <= 1) {
            return { success: false, error: 'Cannot demote the last remaining super_admin account.' };
          }
        }
        const oldRole = found.role;
        found.role = input.newRole;
        await recordAuditLog({
          action: 'UPDATE_STAFF_ROLE',
          entity: 'user_roles',
          entityId: input.userId,
          diff: { oldRole, newRole: input.newRole },
          actorId: adminUser.userId,
          actorName: adminUser.fullName,
        });
        return { success: true };
      }
      return { success: false, error: 'Team member not found' };
    }

    const admin = getServiceRoleClient();

    // Prevent demoting the last remaining super_admin
    const { data: targetRole } = await (admin as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', input.userId)
      .single();

    if (targetRole?.role === 'super_admin' && input.newRole !== 'super_admin') {
      const { count } = await (admin as any)
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      if ((count ?? 1) <= 1) {
        return { success: false, error: 'Cannot demote the last remaining super_admin account.' };
      }
    }

    const { error } = await (admin as any)
      .from('user_roles')
      .update({ role: input.newRole })
      .eq('user_id', input.userId);

    if (error) return { success: false, error: error.message };

    await recordAuditLog({
      action: 'UPDATE_STAFF_ROLE',
      entity: 'user_roles',
      entityId: input.userId,
      diff: { newRole: input.newRole },
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Revoke staff access (Super Admin only)
 */
export async function revokeStaffAction(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminUser = await requireRole('super_admin');

    if (userId === adminUser.userId) {
      return { success: false, error: 'You cannot revoke your own super admin account.' };
    }

    if (!isSupabaseConfigured()) {
      const idx = mockTeamStore.findIndex((m) => m.userId === userId || m.id === userId);
      if (idx !== -1) {
        if (mockTeamStore[idx].role === 'super_admin') {
          const superAdminCount = mockTeamStore.filter((m) => m.role === 'super_admin').length;
          if (superAdminCount <= 1) {
            return { success: false, error: 'Cannot revoke the last remaining super_admin account.' };
          }
        }
        mockTeamStore.splice(idx, 1);
        await recordAuditLog({
          action: 'REVOKE_STAFF',
          entity: 'user_roles',
          entityId: userId,
          actorId: adminUser.userId,
          actorName: adminUser.fullName,
        });
        return { success: true };
      }
      return { success: false, error: 'Member not found' };
    }

    const admin = getServiceRoleClient();

    // Prevent revoking the last remaining super_admin
    const { data: targetRole } = await (admin as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (targetRole?.role === 'super_admin') {
      const { count } = await (admin as any)
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      if ((count ?? 1) <= 1) {
        return { success: false, error: 'Cannot revoke the last remaining super_admin account.' };
      }
    }

    const { error } = await (admin as any)
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) return { success: false, error: error.message };

    await recordAuditLog({
      action: 'REVOKE_STAFF',
      entity: 'user_roles',
      entityId: userId,
      actorId: adminUser.userId,
      actorName: adminUser.fullName,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

