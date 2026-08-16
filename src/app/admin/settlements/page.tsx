'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Store, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettlementsPage() {
  const supabase = createClient();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettlements = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Dynamic Platform Commission Percentage
      const { data: settingData } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'platform_commission_percent')
        .maybeSingle();

      let rate = 10;
      if (settingData?.value) {
        try {
          rate = typeof settingData.value === 'number' ? settingData.value : JSON.parse(settingData.value as any);
        } catch {
          rate = 10;
        }
      }
      setCommissionRate(rate);

      // 2. Aggregate completed orders per pharmacy store
      const { data: stores } = await supabase.from('medical_stores').select('id, store_name');
      const { data: orders } = await supabase
        .from('orders')
        .select('id, store_id, subtotal, total_amount, order_status')
        .eq('order_status', 'DELIVERED');

      if (stores) {
        const storeMap: Record<string, { storeName: string; gross: number; count: number }> = {};
        stores.forEach((s) => {
          storeMap[s.id] = { storeName: s.store_name, gross: 0, count: 0 };
        });

        if (orders) {
          orders.forEach((o) => {
            if (storeMap[o.store_id]) {
              storeMap[o.store_id].gross += Number(o.subtotal || 0);
              storeMap[o.store_id].count += 1;
            }
          });
        }

        const calculated = Object.entries(storeMap).map(([id, data]) => {
          const commission = data.gross * (rate / 100);
          const netPayable = data.gross - commission;
          return {
            storeId: id,
            storeName: data.storeName,
            orderCount: data.count,
            grossSales: data.gross,
            platformCommission: commission,
            netPayable,
          };
        });

        setSettlements(calculated);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Pharmacy Seller Payout Settlements</h1>
        <p className="text-xs text-slate-500">
          Financial ledger calculating gross pharmacy sales, active {commissionRate}% platform commission, and net seller payouts
        </p>
      </div>

      {/* Settlements Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4 text-xs">
        {isLoading ? (
          <p className="text-center text-slate-400 py-8">Calculating settlements...</p>
        ) : settlements.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No pharmacy settlement records found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {settlements.map((s) => (
              <div key={s.storeId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="font-extrabold text-slate-900 text-sm">{s.storeName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">({s.orderCount} Delivered Orders)</span>
                  </div>

                  <p className="text-slate-600">
                    Gross Sales: <strong className="text-slate-900">₹{s.grossSales.toFixed(2)}</strong> • Commission ({commissionRate}%): <strong className="text-brand-600">₹{s.platformCommission.toFixed(2)}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Net Seller Payable</p>
                  <p className="text-lg font-black text-emerald-600">₹{s.netPayable.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
