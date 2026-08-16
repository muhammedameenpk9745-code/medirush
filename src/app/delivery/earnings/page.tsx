'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Calendar, TrendingUp, CheckCircle2, History } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchRiderEarnings } from '@/lib/supabase/delivery';

export default function RiderEarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<{
    today: number;
    week: number;
    month: number;
    total: number;
    count: number;
    earningsList: any[];
  }>({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    count: 0,
    earningsList: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadEarnings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await fetchRiderEarnings(user.id);
    setEarnings(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Rider Delivery Earnings</h1>
        <p className="text-xs text-slate-500">Realtime revenue summary from completed medicine dispatches</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Today&apos;s Earnings</p>
          <p className="text-2xl font-black text-emerald-600">₹{earnings.today}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">This Week</p>
          <p className="text-2xl font-black text-slate-900">₹{earnings.week}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">This Month</p>
          <p className="text-2xl font-black text-slate-900">₹{earnings.month}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Completed Orders</p>
          <p className="text-2xl font-black text-brand-600">{earnings.count}</p>
        </div>
      </div>

      {/* Detailed Earnings List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-brand-600" />
          <span>Earnings Log ({earnings.earningsList.length})</span>
        </h3>

        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading earnings history...</p>
        ) : earnings.earningsList.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No completed deliveries recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {earnings.earningsList.map((e) => (
              <div key={e.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    Order #{e.orders?.order_number || e.order_id?.substring(0, 8)}
                  </p>
                  <p className="text-slate-500">
                    {e.orders?.medical_stores?.store_name} • {new Date(e.created_at).toLocaleString('en-IN')}
                  </p>
                </div>

                <span className="font-black text-emerald-600 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  +₹{e.total_earned || e.delivery_fee || 40}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
