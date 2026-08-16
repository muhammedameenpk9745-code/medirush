'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminPaymentsPage() {
  const supabase = createClient();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, payment_status, created_at, medical_stores(store_name)')
        .order('created_at', { ascending: false });

      if (data) setPayments(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Payments & Financial Transactions</h1>
        <p className="text-xs text-slate-500">Transaction history ledger across all customer medicine orders</p>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading transaction records...</p>
        ) : payments.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No transaction records found.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    Order #{p.order_number || p.id.substring(0, 8)}
                  </p>
                  <p className="text-slate-500">
                    Pharmacy: {p.medical_stores?.store_name} • {new Date(p.created_at).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="font-black text-slate-900 text-sm">₹{p.total_amount}</p>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                    p.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {p.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
