'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  TrendingUp,
  Store,
  Bell,
  LogOut,
  Menu,
  X,
  Plus,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, sellerStore, signOut } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/seller', icon: LayoutDashboard },
    { label: 'Products Catalog', href: '/seller/products', icon: Package },
    { label: 'Inventory & Batches', href: '/seller/inventory', icon: Boxes },
    { label: 'Orders', href: '/seller/orders', icon: ShoppingBag },
    { label: 'Sales & Revenue', href: '/seller/sales', icon: TrendingUp },
    { label: 'Pharmacy Store', href: '/seller/store', icon: Store },
    { label: 'Notifications', href: '/seller/notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 shrink-0 min-h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex flex-col gap-3">
          <Link href="/" className="inline-block">
            <Image
              src="/medirush-logo.jpg"
              alt="MediRush Logo"
              width={160}
              height={50}
              className="object-contain h-10 w-auto bg-white p-1 rounded-xl"
              priority
            />
          </Link>
          
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center gap-2.5">
            <Store className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] uppercase font-bold text-slate-400">Pharmacy Portal</p>
              <p className="text-xs font-bold text-slate-100 truncate">
                {sellerStore?.store_name || profile?.full_name || 'Partner Store'}
              </p>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Store" />
          </div>
        </div>

        {/* Quick Add Product Button */}
        <div className="p-4">
          <Link href="/seller/products/new">
            <button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add New Medicine</span>
            </button>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xs">
              {profile?.full_name?.charAt(0) || 'P'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-200 truncate">{profile?.full_name || 'Owner'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/medirush-logo.jpg"
            alt="MediRush Logo"
            width={120}
            height={36}
            className="object-contain h-8 w-auto bg-white p-1 rounded-lg"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/30">
            Seller
          </span>
        </Link>

        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
        >
          {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div className="md:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-4 space-y-2 sticky top-[65px] z-40 animate-in slide-in-from-top-2">
          <div className="bg-slate-800 p-3 rounded-xl flex items-center gap-2.5 text-xs">
            <Store className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="font-bold text-slate-200 truncate">{sellerStore?.store_name || 'Pharmacy Portal'}</span>
          </div>

          <nav className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{user?.email}</span>
            <button
              onClick={() => {
                setIsMobileNavOpen(false);
                signOut();
              }}
              className="text-red-400 font-bold flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

    </div>
  );
}
