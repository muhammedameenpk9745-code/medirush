import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Mail, Phone, ExternalLink, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';

export const Footer: React.FC = () => {
  const { user, role } = useAuth();

  const sellerHref = user && (role === 'SELLER' || role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/seller' : '/login?role=SELLER';
  const riderHref = user && (role === 'DELIVERY_PARTNER' || role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/delivery' : '/login?role=DELIVERY_PARTNER';
  const adminHref = user && (role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/login?role=ADMIN';

  return (
    <footer className="bg-[#0B2540] text-slate-300 border-t border-[#0B2540]">
      {/* Trust Strip Banner above footer */}
      <div className="bg-[#0F8F68] text-white py-6 px-4 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold">100% Genuine Medicines & Verified Chemists</h4>
              <p className="text-xs text-emerald-100">All prescription products audited by qualified pharmacists before dispatch</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">⚡ 30-Min Fast Delivery</span>
            <span className="bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">🔒 Secure Payments</span>
          </div>
        </div>
      </div>

      {/* In-Page Portal Switcher Block */}
      <RoleSwitcher />

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">

          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-2.5 rounded-2xl inline-block shadow-md">
              <Image
                src="/medirush-logo.jpg"
                alt="MediRush — Medicine. Fast. Reliable."
                width={160}
                height={50}
                className="object-contain h-10 w-auto"
              />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#16B67A]">
              MEDICINE. FAST. RELIABLE.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              MediRush connects customers with licensed local pharmacies and verified medical stores for ultra-fast, reliable doorstep delivery of prescription medicines and healthcare products.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#16B67A] bg-[#E8F8F1]/10 border border-[#16B67A]/30 px-3 py-2 rounded-xl w-fit">
              <Lock className="w-4 h-4 text-[#16B67A] shrink-0" />
              <span>Registered Platform: kochunddappi.shop</span>
            </div>
          </div>

          {/* Col 2: Customer Care */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4 text-[#16B67A]">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">Browse Medicines</Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">Upload Prescription</Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">Track Orders</Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">Cart & Checkout</Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">My Profile</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Healthcare Categories */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4 text-[#16B67A]">
              Healthcare
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <Link href="/products?category=Medicines" className="hover:text-white transition-colors">Essential Medicines</Link>
              </li>
              <li>
                <Link href="/products?category=First%20Aid" className="hover:text-white transition-colors">First Aid Kits</Link>
              </li>
              <li>
                <Link href="/products?category=Personal%20Care" className="hover:text-white transition-colors">Personal Care</Link>
              </li>
              <li>
                <Link href="/products?category=Baby%20Care" className="hover:text-white transition-colors">Baby Care</Link>
              </li>
              <li>
                <Link href="/products?category=Medical%20Devices" className="hover:text-white transition-colors">Medical Devices</Link>
              </li>
              <li>
                <Link href="/products?category=Wellness" className="hover:text-white transition-colors">Wellness & Vitamins</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: For Sellers & Riders */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4 text-[#16B67A]">
              Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <Link href={sellerHref} className="hover:text-white transition-colors">
                  <span>Seller Portal</span>
                </Link>
              </li>
              <li>
                <Link href="/seller/register" className="hover:text-white transition-colors">Register Pharmacy</Link>
              </li>
              <li>
                <Link href={riderHref} className="hover:text-white transition-colors">
                  <span>Rider Portal</span>
                </Link>
              </li>
              <li>
                <Link href="/delivery/register" className="hover:text-white transition-colors">Become a Rider</Link>
              </li>
              <li>
                <Link href={adminHref} className="hover:text-white transition-colors">
                  <span>Admin Console</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Support & Contact */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4 text-[#16B67A]">
              Support & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-[#16B67A] shrink-0" />
                <span>support@kochunddappi.shop</span>
              </li>
              <li className="flex items-center gap-2 text-white font-bold">
                <Phone className="w-3.5 h-3.5 text-[#16B67A] shrink-0" />
                <span>+91 1800-MEDIRUSH</span>
              </li>
              <li className="pt-2 text-slate-400 text-[11px] leading-snug">
                Privacy Policy • Terms of Service • Drug License Compliance
              </li>
            </ul>
          </div>

        </div>

        {/* Lower Footer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} MediRush Online Pharmacy Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-3 text-slate-400 font-semibold text-[11px]">
            <span>Razorpay Secure</span>
            <span>•</span>
            <span>UPI & NetBanking</span>
            <span>•</span>
            <span>Cards Accepted</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
