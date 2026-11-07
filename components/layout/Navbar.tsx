'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, ChevronDown, User, ShieldCheck } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { BRAND_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { totalItemsCount, openCart } = useCart();
  const { user, profile } = useAuth();
  const { isStaff } = useAdminRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on admin console routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'All Products', href: '/products' },
    {
      name: 'Clothes',
      href: '/category/clothes',
      subcategories: [
        { name: 'All Clothes', href: '/category/clothes' },
        { name: 'Pret & Ready-to-Wear', href: '/category/clothes?sub=pret-ready-to-wear' },
        { name: 'Unstitched Lawn', href: '/category/clothes?sub=unstitched-lawn' },
      ],
    },
    {
      name: 'Bags',
      href: '/category/bags',
      subcategories: [
        { name: 'All Bags', href: '/category/bags' },
        { name: 'Tote Bags', href: '/category/bags?sub=tote-bags' },
        { name: 'Crossbody Bags', href: '/category/bags?sub=crossbody-bags' },
      ],
    },
    { name: 'Track Order', href: '/orders/track' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 rounded-lg text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm ring-1 ring-neutral-200 group-hover:scale-105 transition-transform duration-200 bg-white flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo-icon.png"
                  alt={BRAND_NAME}
                  width={40}
                  height={40}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-neutral-900 group-hover:text-emerald-950 transition-colors leading-none">
                  {BRAND_NAME}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium mt-0.5">
                  Pakistan
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              if (link.subcategories) {
                return (
                  <div key={link.name} className="relative group">
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'text-emerald-900 bg-emerald-50'
                          : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50'
                      )}
                    >
                      {link.name}
                      <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-transform group-hover:rotate-180" />
                    </Link>

                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full pt-2 w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                      <div className="bg-white rounded-xl shadow-xl border border-neutral-100 p-2 overflow-hidden">
                        {link.subcategories.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className="block px-3 py-2 text-sm text-neutral-700 hover:text-emerald-950 hover:bg-neutral-50 rounded-lg transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'text-emerald-900 bg-emerald-50'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50'
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Admin Console Shortcut (visible only to signed-in staff/admin) */}
            {mounted && isStaff && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-neutral-900 text-amber-300 hover:bg-neutral-800 rounded-xl transition shadow-xs border border-neutral-700"
                title="Open Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin</span>
              </Link>
            )}

            {/* Currency Pill */}
            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              PKR (Rs.)
            </div>

            {/* User Account Button */}
            <Link
              href={mounted && user ? '/account' : '/login'}
              className="p-2 text-neutral-800 hover:text-emerald-950 hover:bg-neutral-100 rounded-xl transition-colors focus:outline-none flex items-center gap-1.5 text-xs font-semibold"
              title={mounted && user ? 'My Account' : 'Sign In'}
            >
              <User className="w-5 h-5 text-neutral-700" />
              <span className="hidden md:inline">
                {mounted && user ? (profile?.full_name ? profile.full_name.split(' ')[0] : 'Account') : 'Sign In'}
              </span>
            </Link>

            {/* Shopping Cart Button */}
            <button
              onClick={openCart}
              type="button"
              className="relative p-2.5 text-neutral-800 hover:text-emerald-900 hover:bg-neutral-100 rounded-xl transition-colors focus:outline-none"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-6 h-6" />
              {mounted && totalItemsCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-5 h-5 px-1 text-[11px] font-bold text-white bg-emerald-800 rounded-full border-2 border-white shadow-sm animate-in zoom-in-50 duration-200">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-200 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200">
          {navLinks.map((link) => (
            <div key={link.name} className="py-1">
              <Link
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-neutral-900 hover:text-emerald-900 py-1"
              >
                {link.name}
              </Link>
              {link.subcategories && (
                <div className="pl-4 mt-1 space-y-1 border-l-2 border-neutral-100">
                  {link.subcategories.map((sub) => (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm text-neutral-600 hover:text-emerald-800 py-1"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Mobile Account & Admin Links */}
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            {mounted && isStaff && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-neutral-900 text-amber-300 font-bold text-sm shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Admin Console</span>
                </div>
                <span className="text-[10px] bg-neutral-800 text-amber-200 px-2 py-0.5 rounded-full border border-neutral-700">
                  Staff
                </span>
              </Link>
            )}

            <Link
              href={mounted && user ? '/account' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-emerald-950 py-1"
            >
              <User className="w-4 h-4 text-emerald-900" />
              {mounted && user ? `Account (${profile?.full_name || 'My Profile'})` : 'Sign In / Register'}
            </Link>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
            <span>Currency: <strong>PKR (Rs.)</strong></span>
            <span>COD Available</span>
          </div>
        </div>
      )}
    </header>
  );
}
