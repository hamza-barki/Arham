'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  getTeamMembersAction,
  inviteStaffAction,
  updateUserRoleAction,
  revokeStaffAction,
  TeamMember,
} from '@/app/actions/admin-team';
import { useAdminRole } from '@/hooks/useAdminRole';
import { UserRole } from '@/types/database';

export default function AdminTeamPage() {
  const { role: currentAdminRole } = useAdminRole();
  const isSuperAdmin = currentAdminRole === 'super_admin';

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('staff');

  // Action status message
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getTeamMembersAction();
      if (res.success) {
        setMembers(res.members);
      }
    } catch (err) {
      console.error('Failed to fetch team members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError('Please provide both full name and a valid email.');
      return;
    }

    setInviting(true);
    setInviteError(null);

    try {
      const res = await inviteStaffAction({
        email: inviteEmail.trim(),
        fullName: inviteName.trim(),
        role: inviteRole,
      });

      if (res.success) {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('staff');
        setStatusNotice(`Invited ${inviteName} successfully as ${inviteRole}.`);
        fetchMembers();
      } else {
        setInviteError(res.error || 'Failed to invite team member.');
      }
    } catch (err: any) {
      setInviteError(err.message || 'Invitation failed.');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: TeamMember, newRole: UserRole) => {
    if (!isSuperAdmin) {
      alert('Only Super Admins can alter roles.');
      return;
    }
    if (member.isCurrentUser) {
      alert('You cannot change your own role.');
      return;
    }

    try {
      const res = await updateUserRoleAction({
        userId: member.userId,
        roleId: member.id,
        newRole,
      });

      if (res.success) {
        setStatusNotice(`Updated ${member.fullName}'s role to ${newRole}.`);
        fetchMembers();
      } else {
        alert(res.error || 'Failed to update role');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleRevoke = async (member: TeamMember) => {
    if (!isSuperAdmin) {
      alert('Only Super Admins can revoke staff access.');
      return;
    }
    if (member.isCurrentUser) {
      alert('You cannot revoke your own access.');
      return;
    }
    if (!confirm(`Are you sure you want to revoke admin access for ${member.fullName}?`)) {
      return;
    }

    try {
      const res = await revokeStaffAction(member.userId);

      if (res.success) {
        setStatusNotice(`Revoked access for ${member.fullName}.`);
        fetchMembers();
      } else {
        alert(res.error || 'Failed to revoke member');
      }
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'staff':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-800" />
            Team & Role-Based Access (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Manage operational permissions for call center staff, inventory managers, and store administrators.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {statusNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {statusNotice}
          </span>
          <button onClick={() => setStatusNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Role Hierarchy Reference Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-700" />
          Role Permissions Matrix
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
            <div className="font-bold text-purple-900 mb-1">super_admin</div>
            <p className="text-purple-700 text-[11px] leading-relaxed">
              Full system ownership. Invites team, assigns roles, accesses net margin profit metrics, and views audit logs.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <div className="font-bold text-blue-900 mb-1">admin</div>
            <p className="text-blue-700 text-[11px] leading-relaxed">
              Operational executive. Can manage catalog, order statuses, courier bookings, and customer directory.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="font-bold text-emerald-900 mb-1">manager</div>
            <p className="text-emerald-700 text-[11px] leading-relaxed">
              Inventory & Markaz imports. Can calculate wholesale margins, add products, and review audit trail.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="font-bold text-amber-900 mb-1">staff (CSR)</div>
            <p className="text-amber-700 text-[11px] leading-relaxed">
              Call center operations. Confirms customer orders, updates tracking numbers. Net profit & team settings are hidden.
            </p>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">
            Active Team Members ({members.length})
          </h2>
          {!isSuperAdmin && (
            <span className="text-[11px] text-neutral-400 italic">
              Viewing in read-only mode (Requires super_admin to modify)
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-800 mb-2" />
            <p className="text-xs text-neutral-500 font-bold">Loading team roster...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">No team members found.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/80 transition"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {member.fullName.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900">
                        {member.fullName}
                      </span>
                      {member.isCurrentUser && (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-bold text-[9px]">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-neutral-700">{member.email}</span>
                      <span>•</span>
                      <span className="text-[11px]">
                        Since {new Date(member.grantedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Badge / Role Selector */}
                <div className="flex items-center gap-3">
                  {isSuperAdmin && !member.isCurrentUser ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value as UserRole)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800 bg-white focus:outline-emerald-800"
                    >
                      <option value="staff">staff</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${getRoleBadge(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                  )}

                  {/* Revoke Button */}
                  {isSuperAdmin && !member.isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(member)}
                      title="Revoke access"
                      className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-800" />
                Invite Staff Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-neutral-400 hover:text-neutral-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Asad Rizvi"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="staff@brandname.pk"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800 focus:outline-emerald-800"
                >
                  <option value="staff">Staff (Call Center / Order Fulfillment)</option>
                  <option value="manager">Manager (Inventory & Markaz Catalog)</option>
                  <option value="admin">Admin (Operations Executive)</option>
                  <option value="super_admin">Super Admin (Full Ownership)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold disabled:opacity-50"
                >
                  {inviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Grant Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

