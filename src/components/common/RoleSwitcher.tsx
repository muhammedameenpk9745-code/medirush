'use client';

import React from 'react';
import { useRole } from '@/context/RoleContext';
import { UserRole } from '@/types/auth';
import Link from 'next/link';
import { Shield, Store, Truck, ShoppingBag } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setRole } = useRole();
  const { user, role } = useAuth();

  const getRoleHref = (targetRole: UserRole) => {
    if (targetRole === 'CUSTOMER') return '/';

    if (targetRole === 'SELLER') {
      return user && (role === 'SELLER' || role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/seller' : '/login?role=SELLER';
    }

    if (targetRole === 'DELIVERY_PARTNER') {
      return user && (role === 'DELIVERY_PARTNER' || role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/delivery' : '/login?role=DELIVERY_PARTNER';
    }

    if (targetRole === 'ADMIN') {
      return user && (role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/login?role=ADMIN';
    }

    return '/';
  };

  const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'CUSTOMER', label: 'Customer Portal', icon: <ShoppingBag className="w-4 h-4 text-[#16B67A]" /> },
    { role: 'SELLER', label: 'Pharmacy Seller', icon: <Store className="w-4 h-4 text-[#16B67A]" /> },
    { role: 'DELIVERY_PARTNER', label: 'Rider Partner', icon: <Truck className="w-4 h-4 text-[#16B67A]" /> },
    { role: 'ADMIN', label: 'Admin Portal', icon: <Shield className="w-4 h-4 text-[#16B67A]" /> },
  ];

  return (
    <div className="bg-[#081B30] text-slate-300 py-6 px-4 border-t border-[#0B2540] text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="bg-[#16B67A]/20 text-[#16B67A] border border-[#16B67A]/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
            Portal Switcher
          </span>
          <span className="text-slate-300 font-bold text-xs hidden sm:inline">Switch MediRush Platform View:</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {roles.map((item) => {
            const isActive = currentRole === item.role;
            return (
              <Link
                key={item.role}
                href={getRoleHref(item.role)}
                onClick={() => setRole(item.role)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold whitespace-nowrap border ${
                  isActive
                    ? 'bg-[#16B67A] text-white border-[#16B67A] shadow-soft-sm'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
