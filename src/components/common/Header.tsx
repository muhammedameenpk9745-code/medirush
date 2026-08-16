'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  MapPin,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Store,
  Package,
  LogOut,
  Shield,
  Truck,
  Search,
  FileText,
  Clock,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { LocationSelectorModal } from './LocationSelectorModal';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount } = useCart();
  const { user, profile, role, signOut } = useAuth();
  const { location, setLocation } = useLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Top Banner Notice */}
      <div className="bg-[#0B2540] text-white text-[11px] py-1.5 px-4 font-medium flex items-center justify-between border-b border-[#E2EAE6]/20">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#16B67A] text-white font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
              100% Verified
            </span>
            <span className="hidden sm:inline text-slate-200">
              Genuine medicines & health essentials delivered from licensed neighborhood pharmacies
            </span>
            <span className="sm:hidden text-slate-200 truncate">
              Express local pharmacy delivery
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-300 font-semibold">
            <Link href="/stores" className="hover:text-[#16B67A] transition-colors flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-[#16B67A]" />
              <span>Partner Pharmacies</span>
            </Link>
            <span>•</span>
            <Link href="/cart" className="hover:text-[#16B67A] transition-colors flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#16B67A]" />
              <span>Upload Prescription</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2EAE6] shadow-soft-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">

            {/* Brand Logo & Location */}
            <div className="flex items-center gap-5 shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative w-36 h-12 flex items-center">
                  <Image
                    src="/medirush-logo.jpg"
                    alt="MediRush — Medicine. Fast. Reliable."
                    width={180}
                    height={60}
                    className="object-contain max-h-12 w-auto"
                    priority
                  />
                </div>
              </Link>

              {/* Location Picker */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden xl:flex items-center gap-2 bg-[#F7FAF9] hover:bg-[#E8F8F1] border border-[#E2EAE6] hover:border-[#16B67A] px-3 py-2 rounded-xl text-left transition-all max-w-[210px] cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#16B67A] shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Deliver To</p>
                  <p className="text-xs font-bold text-[#0B2540] truncate leading-tight mt-0.5">{location}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
              </button>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-2">
              <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medicines, health products & brands..."
                  className="w-full bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white text-xs font-semibold text-[#0B2540] pl-10 pr-24 py-2.5 rounded-xl outline-hidden transition-all shadow-xs"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 bg-[#16B67A] hover:bg-[#0F8F68] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-[#0B2540]">
              <Link
                href="/products"
                className={`transition-colors hover:text-[#16B67A] ${
                  pathname === '/products' ? 'text-[#16B67A]' : ''
                }`}
              >
                Medicines
              </Link>
              <Link
                href="/stores"
                className={`transition-colors hover:text-[#16B67A] ${
                  pathname === '/stores' ? 'text-[#16B67A]' : ''
                }`}
              >
                Pharmacies
              </Link>
              <Link
                href="/cart"
                className="transition-colors hover:text-[#16B67A] flex items-center gap-1 text-[#16B67A]"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Prescription</span>
              </Link>
              {user && (
                <Link
                  href="/orders"
                  className={`transition-colors hover:text-[#16B67A] ${
                    pathname === '/orders' ? 'text-[#16B67A]' : ''
                  }`}
                >
                  Orders
                </Link>
              )}
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              {/* Cart Button */}
              <Link href="/cart">
                <button
                  type="button"
                  className="relative flex items-center gap-2 px-3 py-2 bg-[#F7FAF9] hover:bg-[#E8F8F1] text-[#0B2540] hover:text-[#16B67A] rounded-xl border border-[#E2EAE6] hover:border-[#16B67A] transition-all cursor-pointer font-bold text-xs"
                >
                  <ShoppingBag className="w-4 h-4 text-[#16B67A]" />
                  <span className="hidden sm:inline">Cart</span>
                  {totalCount > 0 && (
                    <span className="bg-[#16B67A] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                      {totalCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* Dynamic Auth Section */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {role === 'SELLER' && (
                    <Link href="/seller">
                      <span className="inline-flex items-center gap-1 bg-[#E8F8F1] border border-[#16B67A]/30 text-[#0F8F68] text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#16B67A] hover:text-white transition-all">
                        <Store className="w-3.5 h-3.5" />
                        <span>Seller Portal</span>
                      </span>
                    </Link>
                  )}

                  {role === 'DELIVERY_PARTNER' && (
                    <Link href="/delivery">
                      <span className="inline-flex items-center gap-1 bg-[#E8F8F1] border border-[#16B67A]/30 text-[#0F8F68] text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#16B67A] hover:text-white transition-all">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Rider Portal</span>
                      </span>
                    </Link>
                  )}

                  {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                    <Link href="/admin">
                      <span className="inline-flex items-center gap-1 bg-[#0B2540] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#16B67A] transition-all">
                        <Shield className="w-3.5 h-3.5 text-[#16B67A]" />
                        <span>Admin Portal</span>
                      </span>
                    </Link>
                  )}

                  <Link href="/profile">
                    <button type="button" className="flex items-center gap-2 p-1.5 bg-[#F7FAF9] hover:bg-[#E8F8F1] rounded-xl border border-[#E2EAE6] transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-[#16B67A] text-white flex items-center justify-center text-xs font-black">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-xs font-bold text-[#0B2540] max-w-[90px] truncate hidden md:inline">
                        {profile?.full_name?.split(' ')[0] || 'Account'}
                      </span>
                    </button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login">
                    <span className="inline-flex items-center justify-center border border-[#E2EAE6] hover:border-[#16B67A] bg-white text-[#0B2540] text-xs font-bold px-3.5 py-2 rounded-xl transition-all">
                      Sign In
                    </span>
                  </Link>
                  <Link href="/register">
                    <span className="inline-flex items-center justify-center bg-[#16B67A] hover:bg-[#0F8F68] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-soft-sm">
                      Register
                    </span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-[#0B2540] hover:text-[#16B67A] rounded-xl hover:bg-[#F7FAF9] cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicines & health products..."
                className="w-full bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] text-xs font-semibold text-[#0B2540] pl-9 pr-20 py-2 rounded-xl outline-hidden"
              />
              <button
                type="submit"
                className="absolute right-1 bg-[#16B67A] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#E2EAE6] px-4 py-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLocationModalOpen(true);
              }}
              className="w-full flex items-center justify-between bg-[#F7FAF9] p-3 rounded-xl border border-[#E2EAE6] text-left"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#16B67A]" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Deliver To</p>
                  <p className="text-xs font-bold text-[#0B2540]">{location}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-bold">
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#F7FAF9] text-[#0B2540] hover:bg-[#E8F8F1] hover:text-[#16B67A]"
              >
                <Package className="w-4 h-4 text-[#16B67A]" />
                <span>All Medicines</span>
              </Link>
              <Link
                href="/stores"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#F7FAF9] text-[#0B2540] hover:bg-[#E8F8F1] hover:text-[#16B67A]"
              >
                <Store className="w-4 h-4 text-[#16B67A]" />
                <span>Pharmacies</span>
              </Link>

              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#F7FAF9] text-[#0B2540] hover:bg-[#E8F8F1]"
                  >
                    <User className="w-4 h-4 text-[#16B67A]" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 font-bold"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#F7FAF9] text-[#0B2540]"
                  >
                    <User className="w-4 h-4 text-[#16B67A]" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#16B67A] text-white"
                  >
                    <User className="w-4 h-4" />
                    <span>Register</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Location Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={location}
        onSelectLocation={setLocation}
      />
    </>
  );
};
