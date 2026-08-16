'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Store, CheckCircle2, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function RiderHistoryPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: partner } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (partner) {
        const { data: ords } = await supabase
          .from('orders')
          .select('*, medical_stores(store_name), addresses(*)')
          .eq('delivery_partner_id', partner.id)
          .eq('order_status', 'DELIVERED')
          .order('updated_at', { ascending: false });

        if (ords) setHistory(ords);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Delivery History</h1>
        <p className="text-xs text-slate-500">Log of all completed medicine orders delivered by you</p>
      </div>

      {/* History Log */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          Loading delivery history...
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-900">No completed deliveries yet</p>
          <p className="text-xs text-slate-500">Completed jobs will be archived here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((h) => (
            <div
              key={h.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-mono font-black text-slate-900 text-sm">
                  #{h.order_number || h.id.substring(0, 8)}
                </span>
                <span className="bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DELIVERED</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Pharmacy</p>
                  <p className="font-bold text-slate-800">{h.medical_stores?.store_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Customer Location</p>
                  <p className="font-bold text-slate-800">{h.addresses?.city} — {h.addresses?.pincode}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                <span>Completed: {new Date(h.updated_at).toLocaleString('en-IN')}</span>
                <span className="font-black text-slate-900">Fee: ₹{h.delivery_fee || 40}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
