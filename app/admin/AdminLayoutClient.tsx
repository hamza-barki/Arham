'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MapPin,
  Users,
  ShieldCheck,
  History,
  Store,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  LogOut,
  Bell,
  LifeBuoy,
  TrendingDown,
  Sliders,
} from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, isSuperAdmin, canManageTeam, canManageProducts, allowedNav } = useAdminRole();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard': return LayoutDashboard;
      case 'ShoppingBag': return ShoppingBag;
      case 'Package': return Package;
      case 'MapPin': return MapPin;
      case 'LifeBuoy': return LifeBuoy;
      case 'TrendingDown': return TrendingDown;
      case 'Sliders': return Sliders;
      case 'Users': return Users;
      case 'ShieldCheck': return ShieldCheck;
      case 'History': return History;
      default: return LayoutDashboard;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 flex flex-col antialiased">
      {/* Top Header */}
      <header className="bg-emerald-950 text-white sticky top-0 z-40 shadow-sm border-b border-emerald-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-emerald-200 hover:text-white hover:bg-emerald-900 rounded-xl transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-2xs ring-1 ring-emerald-700 bg-emerald-900 flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo-icon.png"
                  alt="Admin Console"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-white block leading-none">
                  Admin Console
                </span>
                <span className="text-[10px] text-emerald-300 font-mono font-medium">
                  Pakistan COD Operations
                </span>
              </div>
            </Link>

            {/* Role Badge */}
            <span className="hidden sm:inline-block ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-900 text-emerald-300 border border-emerald-700/80">
              {role}
            </span>
          </div>

          {/* Quick Actions & Storefront Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-200 hover:text-white bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-800 transition shadow-2xs"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Storefront</span>
            </Link>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Horizontal Strip) */}
        <div className="hidden md:block bg-emerald-900/50 border-t border-emerald-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-1">
            {allowedNav.map((item) => {
              const Icon = getIcon(item.icon);
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-emerald-800 text-white font-bold shadow-2xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Drawer (When Open) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-emerald-950 text-white w-4/5 max-w-xs h-full p-6 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center font-bold text-emerald-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-sm">Navigation Menu</p>
                    <p className="text-[10px] text-emerald-400 font-mono uppercase font-bold">Role: {role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-emerald-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {allowedNav.map((item) => {
                  const Icon = getIcon(item.icon);
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'text-emerald-200 hover:text-white hover:bg-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-emerald-300" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-emerald-900 space-y-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-300 hover:text-white"
              >
                <Store className="w-4 h-4" />
                <span>Open Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mb-16 md:mb-0">
        {children}
      </main>

      {/* Mobile Sticky Bottom Nav Bar (Quick 1-Tap Switching) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
        <Link
          href="/admin"
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
            pathname === '/admin' ? 'text-emerald-800' : 'text-neutral-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Overview</span>
        </Link>

        <Link
          href="/admin/orders"
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
            pathname.startsWith('/admin/orders') ? 'text-emerald-800' : 'text-neutral-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Orders</span>
        </Link>

        {canManageProducts && (
          <Link
            href="/admin/products"
            className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
              pathname.startsWith('/admin/products') ? 'text-emerald-800' : 'text-neutral-500'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Products</span>
          </Link>
        )}

        <Link
          href="/admin/areas"
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
            pathname.startsWith('/admin/areas') ? 'text-emerald-800' : 'text-neutral-500'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Areas</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold text-neutral-500"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>
    </div>
  );
}
