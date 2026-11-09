'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types/database';

export interface AdminRoleState {
  role: UserRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  canViewProfit: boolean;
  canManageTeam: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  allowedNav: Array<{
    href: string;
    label: string;
    icon: string;
  }>;
  isLoading: boolean;
}

const ALL_NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', minRole: 'staff' },
  { href: '/admin/orders', label: 'Orders & Dispatch', icon: 'ShoppingBag', minRole: 'staff' },
  { href: '/admin/products', label: 'Products & Markaz', icon: 'Package', minRole: 'manager' },
  { href: '/admin/areas', label: 'Delivery Areas', icon: 'MapPin', minRole: 'staff' },
  { href: '/admin/support', label: 'Support Inbox', icon: 'LifeBuoy', minRole: 'staff' },
  { href: '/admin/reports/rto', label: 'RTO Analytics', icon: 'TrendingDown', minRole: 'manager' },
  { href: '/admin/customers', label: 'Customers', icon: 'Users', minRole: 'staff' },
  { href: '/admin/settings', label: 'COD Settings', icon: 'Sliders', minRole: 'admin' },
  { href: '/admin/team', label: 'Team & RBAC', icon: 'ShieldCheck', minRole: 'super_admin' },
  { href: '/admin/audit-log', label: 'Audit Log', icon: 'History', minRole: 'manager' },
];

const ROLE_LEVEL: Record<UserRole, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

export function useAdminRole(): AdminRoleState {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserRole() {
      if (!user) {
        if (isMounted) {
          setRole('customer');
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (isMounted) {
          if (!error && data?.role) {
            setRole(data.role as UserRole);
          } else {
            // Fallback check: check public.admins table
            const { data: adminData } = await (supabase as any)
              .from('admins')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();

            if (isMounted && adminData?.role) {
              setRole(adminData.role as UserRole);
            } else if (isMounted) {
              setRole('customer');
            }
          }
        }
      } catch (err) {
        if (isMounted) setRole('customer');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchUserRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const level = ROLE_LEVEL[role] || 0;

  const allowedNav = ALL_NAV.filter((item) => {
    const requiredLevel = ROLE_LEVEL[item.minRole as UserRole] || 1;
    return level >= requiredLevel;
  });

  return {
    role,
    isSuperAdmin: level >= 4,
    isAdmin: level >= 3,
    isManager: level >= 2,
    isStaff: level >= 1,
    canViewProfit: level >= 2,
    canManageTeam: level >= 4,
    canManageProducts: level >= 2,
    canManageOrders: level >= 1,
    allowedNav,
    isLoading,
  };
}
