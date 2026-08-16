'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User, Package, FileText } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { totalCount } = useCart();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Catalog', href: '/products', icon: Search },
    { label: 'Upload Rx', href: '/cart', icon: FileText },
    { label: 'Cart', href: '/cart', icon: ShoppingBag, badge: totalCount },
    { label: 'Account', href: '/profile', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2EAE6] px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-[#16B67A] font-bold' : 'text-slate-500 hover:text-[#0B2540]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#16B67A]' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#16B67A] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
