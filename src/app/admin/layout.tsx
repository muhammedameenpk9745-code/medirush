'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Truck,
  Users,
  FileText,
  DollarSign,
  CreditCard,
  Tag,
  Settings,
  BarChart3,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Radio,
  History,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, role, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navGroups = [
    {
      group: 'Overview',
      items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
      group: 'Marketplace',
      items: [
        { label: 'Products Catalog', href: '/admin/products', icon: ShoppingBag },
        { label: 'Categories', href: '/admin/categories', icon: Tag },
        { label: 'Pharmacies & Sellers', href: '/admin/sellers', icon: Store },
      ],
    },
    {
      group: 'Operations',
      items: [
        { label: 'Orders Center', href: '/admin/orders', icon: ShoppingBag },
        { label: 'Customers', href: '/admin/customers', icon: Users },
        { label: 'Delivery Partners', href: '/admin/delivery', icon: Truck },
        { label: 'Live Delivery Monitor', href: '/admin/delivery/live', icon: Radio },
        { label: 'Prescriptions Review', href: '/admin/prescriptions', icon: FileText },
      ],
    },
    {
      group: 'Finance & Marketing',
      items: [
        { label: 'Payments & Transactions', href: '/admin/payments', icon: CreditCard },
        { label: 'Seller Settlements', href: '/admin/settlements', icon: DollarSign },
        { label: 'Coupons & Promos', href: '/admin/coupons', icon: Tag },
      ],
    },
    {
      group: 'System & Reports',
      items: [
        { label: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
        { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
        { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/medirush-logo.jpg"
              alt="MediRush Logo"
              width={120}
              height={36}
              className="object-contain h-8 w-auto bg-white p-1 rounded-lg"
              priority
            />
            <span className="bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-brand-500/30">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-6 text-xs">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{group.group}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="truncate max-w-[140px]">
            <p className="font-bold text-white truncate">{profile?.full_name || 'Admin User'}</p>
            <p className="text-[10px] text-slate-500 uppercase font-mono">{role}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="lg:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 p-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/medirush-logo.jpg"
            alt="MediRush Logo"
            width={120}
            height={36}
            className="object-contain h-8 w-auto bg-white p-1 rounded-lg"
          />
          <span className="bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase px-2 py-0.5 rounded">
            Admin
          </span>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 text-white border-b border-slate-800 p-4 space-y-4 text-xs z-40">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-2 text-[10px] font-black uppercase text-slate-500">{group.group}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl font-bold ${
                      isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Main Admin Content Container */}
      <main className="flex-1 min-w-0 p-4 sm:p-8">{children}</main>

    </div>
  );
}
