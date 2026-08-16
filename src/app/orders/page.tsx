'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Clock, Store, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerOrders = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch customer record
      const { data: cust } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (cust) {
        const { data: ords } = await supabase
          .from('orders')
          .select('*, medical_stores(store_name)')
          .eq('customer_id', cust.id)
          .order('created_at', { ascending: false });

        if (ords) setOrders(ords);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchCustomerOrders();
  }, [fetchCustomerOrders]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Your Medicine Orders</h1>
          <p className="text-sm text-slate-500">Track current medicine dispatches and view past order invoices</p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            Loading your orders history...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">No Orders Found</h2>
            <p className="text-xs text-slate-500">You haven&apos;t placed any medicine orders yet.</p>
            <Link href="/products" className="inline-block pt-2">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Pharmacy Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm hover:border-brand-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      #{ord.order_number || ord.id.substring(0, 8)}
                    </span>
                    <span className="bg-brand-50 text-brand-700 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-brand-200 uppercase">
                      {ord.order_status}
                    </span>
                  </div>

                  <p className="text-slate-600 font-medium">
                    Store: <strong className="text-slate-900">{ord.medical_stores?.store_name || 'Partner Store'}</strong>
                  </p>

                  <p className="text-slate-500">
                    Placed on {new Date(ord.created_at).toLocaleString('en-IN')} • Amount: <strong className="text-slate-900">₹{ord.total_amount}</strong> ({ord.payment_status})
                  </p>
                </div>

                <Link href={`/orders/${ord.id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Track Order & Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
