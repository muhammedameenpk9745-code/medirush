'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, CheckCircle2, XCircle, ArrowLeft, Clock, MapPin, User, FileText } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function AdminDeliveryManagementPage() {
  const supabase = createClient();

  const [partners, setPartners] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAdminDeliveryData = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Delivery Partners
      const { data: pData } = await supabase
        .from('delivery_partners')
        .select('*, profiles(full_name, phone)')
        .order('created_at', { ascending: false });

      if (pData) setPartners(pData);

      // 2. Fetch Active Dispatches
      const { data: ordData } = await supabase
        .from('orders')
        .select('*, medical_stores(store_name), delivery_partners(*, profiles(full_name))')
        .in('order_status', ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'])
        .order('created_at', { ascending: false });

      if (ordData) setActiveOrders(ordData);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAdminDeliveryData();
  }, [fetchAdminDeliveryData]);

  // Approval / Rejection Handler
  const handleUpdateStatus = async (partnerId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(partnerId);
    await supabase
      .from('delivery_partners')
      .update({ verification_status: status })
      .eq('id', partnerId);

    await fetchAdminDeliveryData();
    setUpdatingId(null);
  };

  const pendingPartners = partners.filter((p) => p.verification_status === 'PENDING');
  const approvedPartners = partners.filter((p) => p.verification_status === 'APPROVED');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="bg-brand-50 text-brand-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-brand-200">
              Admin Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Delivery Management & Approvals</h1>
            <p className="text-xs text-slate-500">Review rider partner applications and monitor active delivery dispatches</p>
          </div>

          <Link href="/admin">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Admin Overview
            </Button>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Registered Riders</p>
            <p className="text-2xl font-black text-slate-900">{partners.length}</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Pending Verification</p>
            <p className="text-2xl font-black text-amber-600">{pendingPartners.length}</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Approved Active Riders</p>
            <p className="text-2xl font-black text-emerald-600">{approvedPartners.length}</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Active Dispatches</p>
            <p className="text-2xl font-black text-brand-600">{activeOrders.length}</p>
          </div>
        </div>

        {/* Section 1: Pending Rider Verification Applications */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Pending Rider Applications ({pendingPartners.length})</span>
          </h2>

          {pendingPartners.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">No pending rider applications to review.</p>
          ) : (
            <div className="space-y-4">
              {pendingPartners.map((p) => (
                <div key={p.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 text-sm">{p.profiles?.full_name}</p>
                    <p className="text-slate-600">Phone: {p.profiles?.phone || p.phone}</p>
                    <p className="text-slate-500">
                      Vehicle: <strong className="text-slate-800">{p.vehicle_type}</strong> ({p.vehicle_number}) • License: <strong className="font-mono text-slate-800">{p.license_number}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={updatingId === p.id}
                      onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Approve Rider
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={updatingId === p.id}
                      onClick={() => handleUpdateStatus(p.id, 'REJECTED')}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Approved Rider Roster */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4 text-xs">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Approved Delivery Partners Roster ({approvedPartners.length})</span>
          </h2>

          <div className="divide-y divide-slate-100">
            {approvedPartners.map((ap) => (
              <div key={ap.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{ap.profiles?.full_name}</p>
                  <p className="text-slate-500">Vehicle: {ap.vehicle_type} ({ap.vehicle_number}) • License: {ap.license_number}</p>
                </div>

                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                  {ap.availability_status || 'OFFLINE'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
