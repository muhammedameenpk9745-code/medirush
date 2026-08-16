'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, ShieldCheck, Power, Store, MapPin, DollarSign, Clock, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { fetchAvailableDeliveryJobs, toggleRiderAvailability, acceptDeliveryJob, fetchRiderEarnings } from '@/lib/supabase/delivery';
import { createClient } from '@/lib/supabase/client';

export default function RiderDashboardPage() {
  const router = useRouter();
  const { user, profile, deliveryPartner } = useAuth();
  const supabase = createClient();

  const [partner, setPartner] = useState<any | null>(deliveryPartner);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Fetch Latest Delivery Partner Profile
      const { data: pData } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (pData) setPartner(pData);

      if (pData?.verification_status === 'APPROVED') {
        // 2. Fetch Available Jobs
        const { jobs: availJobs } = await fetchAvailableDeliveryJobs(user.id);
        setJobs(availJobs);

        // 3. Fetch Active Assigned Order (if any)
        const { data: actOrd } = await supabase
          .from('orders')
          .select('*, medical_stores(store_name, address, city), addresses(*)')
          .eq('delivery_partner_id', pData.id)
          .in('order_status', ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'])
          .maybeSingle();

        if (actOrd) setActiveOrder(actOrd);

        // 4. Fetch Earnings Summary
        const earningsRes = await fetchRiderEarnings(user.id);
        setTodayEarnings(earningsRes.today);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Online / Offline Toggle Handler
  const handleToggleOnline = async () => {
    if (!user || !partner) return;
    setIsToggling(true);
    const newStatus = partner.availability_status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    const res = await toggleRiderAvailability(user.id, newStatus);
    if (res.success) {
      setPartner({ ...partner, availability_status: newStatus });
      await loadDashboardData();
    }
    setIsToggling(false);
  };

  // Job Acceptance Handler (Atomic)
  const handleAcceptJob = async (orderId: string) => {
    if (!user) return;
    setIsAcceptingId(orderId);
    setErrorMessage(null);

    const res = await acceptDeliveryJob(orderId, user.id);
    if (res.success && res.order) {
      router.push(`/delivery/jobs/${orderId}`);
    } else {
      setErrorMessage(res.error || 'Failed to accept delivery job.');
      await loadDashboardData();
    }
    setIsAcceptingId(null);
  };

  const isVerified = partner?.verification_status === 'APPROVED';
  const isOnline = partner?.availability_status === 'ONLINE' || partner?.availability_status === 'BUSY';

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-soft-lg border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{profile?.full_name || 'Rider Partner'}</h1>
              <p className="text-xs text-slate-400">
                Vehicle: {partner?.vehicle_type || '2-Wheeler'} ({partner?.vehicle_number || 'N/A'})
              </p>
            </div>
          </div>

          {/* Online Toggle Switch */}
          {isVerified && (
            <Button
              variant={isOnline ? 'primary' : 'outline'}
              size="md"
              isLoading={isToggling}
              onClick={handleToggleOnline}
              leftIcon={<Power className="w-4 h-4" />}
            >
              {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
            </Button>
          )}
        </div>

        {/* Rider Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <p className="text-slate-400">Today&apos;s Earnings</p>
            <p className="text-lg font-black text-white">₹{todayEarnings}</p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <p className="text-slate-400">Status</p>
            <p className={`text-sm font-extrabold uppercase ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              {partner?.availability_status || 'OFFLINE'}
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 col-span-2 sm:col-span-1">
            <p className="text-slate-400">Account Status</p>
            <p className="text-sm font-extrabold uppercase text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{partner?.verification_status || 'PENDING'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Account Verification Pending Alert */}
      {!isVerified && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Delivery Account Verification Pending</span>
          </div>
          <p className="text-amber-700">
            Your rider application is currently under review by MediRush admin. You will be able to receive delivery jobs once approved.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Assigned Delivery Card */}
      {activeOrder && (
        <div className="bg-emerald-950/80 text-white border border-emerald-500/40 rounded-3xl p-6 shadow-soft-lg space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Active Job in Progress ({activeOrder.order_status})
            </span>
            <span className="font-mono font-black text-sm text-emerald-200">
              #{activeOrder.order_number || activeOrder.id.substring(0, 8)}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-extrabold text-sm text-white">{activeOrder.medical_stores?.store_name}</p>
            <p className="text-emerald-300">Deliver to: {activeOrder.addresses?.full_name} ({activeOrder.addresses?.city})</p>
          </div>

          <Link href={`/delivery/jobs/${activeOrder.id}`} className="block pt-2">
            <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Active Job Execution & OTP
            </Button>
          </Link>
        </div>
      )}

      {/* Available Delivery Jobs Section */}
      {isVerified && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Available Delivery Jobs ({jobs.length})</h2>
            <Button variant="outline" size="sm" onClick={loadDashboardData}>
              Refresh Queue
            </Button>
          </div>

          {!isOnline ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Power className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-900">You are currently OFFLINE</p>
              <p className="text-xs text-slate-500">Toggle your status to ONLINE to start receiving delivery requests.</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-900">No available delivery jobs</p>
              <p className="text-xs text-slate-500">New medicine orders ready for pickup will appear here in real time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm hover:border-brand-200 transition-all space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="text-xs font-extrabold text-slate-900">{j.medical_stores?.store_name}</span>
                    </div>
                    <span className="font-extrabold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full text-xs border border-brand-200">
                      Earn ₹{j.delivery_fee || 40}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Pickup Location</p>
                      <p className="font-bold text-slate-800">{j.medical_stores?.address}, {j.medical_stores?.city}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Delivery Area</p>
                      <p className="font-bold text-slate-800">{j.addresses?.city || 'Local Customer'} — {j.addresses?.pincode}</p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={isAcceptingId === j.id}
                    onClick={() => handleAcceptJob(j.id)}
                    leftIcon={<Truck className="w-4 h-4" />}
                  >
                    Accept Delivery Job
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
