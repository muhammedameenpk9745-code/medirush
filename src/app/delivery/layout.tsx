'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Truck, LayoutDashboard, DollarSign, History, User, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, deliveryPartner, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isOnline = deliveryPartner?.availability_status === 'ONLINE' || deliveryPartner?.availability_status === 'BUSY';

  const navItems = [
    { label: 'Rider Dashboard', href: '/delivery', icon: LayoutDashboard },
    { label: 'Earnings', href: '/delivery/earnings', icon: DollarSign },
    { label: 'History', href: '/delivery/history', icon: History },
    { label: 'My Profile', href: '/delivery/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* Rider Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/delivery" className="flex items-center gap-2">
            <Image
              src="/medirush-logo.jpg"
              alt="MediRush Logo"
              width={120}
              height={36}
              className="object-contain h-8 w-auto bg-white p-1 rounded-lg"
              priority
            />
            <span className="bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-brand-500/30">
              Rider Portal
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                    isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>{profile?.full_name || user?.email}</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
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
      </header>

      {/* Main Rider Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">{children}</main>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="bg-slate-900 text-white border-t border-slate-800 sticky bottom-0 z-40 flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
