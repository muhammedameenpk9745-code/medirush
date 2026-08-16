'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Store,
  Truck,
  ShoppingBag,
  Clock,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  FileText,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fetchAdminDashboardMetrics } from '@/lib/supabase/admin';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<{
    customersCount: number;
    pharmaciesCount: number;
    pendingPharmaciesCount: number;
    partnersCount: number;
    pendingPartnersCount: number;
    productsCount: number;
    activeDeliveriesCount: number;
    ordersToday: number;
    gmvTotal: number;
    revenueTotal: number;
  }>({
    customersCount: 0,
    pharmaciesCount: 0,
    pendingPharmaciesCount: 0,
    partnersCount: 0,
    pendingPartnersCount: 0,
    productsCount: 0,
    activeDeliveriesCount: 0,
    ordersToday: 0,
    gmvTotal: 0,
    revenueTotal: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchAdminDashboardMetrics();
    setMetrics(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-brand-50 text-brand-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-brand-200">
            Marketplace Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Platform Performance & SaaS KPIs</h1>
          <p className="text-xs text-slate-500">Realtime database metrics across customers, pharmacies, riders, and sales</p>
        </div>

        <Button variant="outline" size="sm" onClick={loadMetrics}>
          Refresh Metrics
        </Button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Gross Merchandise Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">₹{metrics.gmvTotal.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-500">Total gross customer orders volume</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Platform Net Revenue</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-black text-brand-600">₹{metrics.revenueTotal.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-500">10% Platform commission + Delivery fees</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Orders Today</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.ordersToday}</p>
          <p className="text-[11px] text-slate-500">Placed in last 24 hours</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Active Dispatches</span>
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-600">{metrics.activeDeliveriesCount}</p>
          <p className="text-[11px] text-slate-500">Currently out on delivery</p>
        </div>

      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pb-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Customers</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{metrics.customersCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pb-1">
            <Store className="w-4 h-4 text-slate-400" />
            <span>Approved Pharmacies</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{metrics.pharmaciesCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pb-1">
            <Truck className="w-4 h-4 text-slate-400" />
            <span>Approved Riders</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{metrics.partnersCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pb-1">
            <ShoppingBag className="w-4 h-4 text-slate-400" />
            <span>Active Medicines</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{metrics.productsCount}</p>
        </div>

      </div>

      {/* Pending Action Queues Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm">Pharmacy Verification Queue</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {metrics.pendingPharmaciesCount} Pending
              </span>
            </div>
            <p className="text-xs text-slate-500">Review new medical store registration applications and drug license credentials.</p>
          </div>

          <Link href="/admin/sellers">
            <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Review Pharmacies
            </Button>
          </Link>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm">Rider Verification Queue</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {metrics.pendingPartnersCount} Pending
              </span>
            </div>
            <p className="text-xs text-slate-500">Review delivery partner vehicle registrations and driving license documents.</p>
          </div>

          <Link href="/admin/delivery">
            <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Review Delivery Partners
            </Button>
          </Link>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm">Prescription Review Queue</span>
              <FileText className="w-4 h-4 text-brand-600" />
            </div>
            <p className="text-xs text-slate-500">Audit customer doctor prescriptions uploaded for prescription-only medicines.</p>
          </div>

          <Link href="/admin/prescriptions">
            <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Audit Prescriptions
            </Button>
          </Link>
        </div>

      </div>

    </div>
  );
}
