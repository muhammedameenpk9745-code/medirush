'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Users, Store, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminReportsPage() {
  const supabase = createClient();
  const [reportData, setReportData] = useState<any>({
    totalSales: 0,
    totalOrders: 0,
    totalCommission: 0,
    deliveredCount: 0,
    cancelledCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Dynamic Platform Commission Percentage
      const { data: settingData } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'platform_commission_percent')
        .maybeSingle();

      let commRate = 10;
      if (settingData?.value) {
        try {
          commRate = typeof settingData.value === 'number' ? settingData.value : JSON.parse(settingData.value as any);
        } catch {
          commRate = 10;
        }
      }

      const { data: orders } = await supabase.from('orders').select('subtotal, total_amount, order_status');

      let sales = 0;
      let comm = 0;
      let del = 0;
      let can = 0;

      if (orders) {
        orders.forEach((o) => {
          if (o.order_status === 'DELIVERED') {
            del += 1;
            sales += Number(o.total_amount || 0);
            comm += Number(o.subtotal || 0) * (commRate / 100);
          } else if (o.order_status === 'CANCELLED') {
            can += 1;
          }
        });
      }

      setReportData({
        totalSales: sales,
        totalOrders: orders?.length || 0,
        totalCommission: comm,
        deliveredCount: del,
        cancelledCount: can,
      });
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Platform Analytics & Reports</h1>
        <p className="text-xs text-slate-500">Realtime database analytics aggregation across sales, dispatches, and commission</p>
      </div>

      {/* Reports Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Completed Sales</p>
          <p className="text-2xl font-black text-slate-900">₹{reportData.totalSales.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Platform Commission Earned</p>
          <p className="text-2xl font-black text-brand-600">₹{reportData.totalCommission.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Successful Deliveries</p>
          <p className="text-2xl font-black text-emerald-600">{reportData.deliveredCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Cancelled Orders</p>
          <p className="text-2xl font-black text-red-600">{reportData.cancelledCount}</p>
        </div>
      </div>

    </div>
  );
}
