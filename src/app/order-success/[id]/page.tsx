'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Clock, MapPin, Store, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function OrderSuccessPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await supabase
        .from('orders')
        .select('*, medical_stores(store_name), addresses(*)')
        .eq('id', params.id)
        .single();

      if (data) setOrder(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-soft-lg text-center space-y-6">
          
          {/* Check Circle Icon */}
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Order Confirmed
            </span>
            <h1 className="text-3xl font-black text-slate-900 pt-2">Medicine Order Placed!</h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your order has been transmitted to partner pharmacy <strong className="text-slate-900">{order?.medical_stores?.store_name || 'Partner Store'}</strong> for packing and fast delivery dispatch.
            </p>
          </div>

          {order && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <span className="text-slate-500 font-semibold">Order Reference No.</span>
                <span className="font-mono font-black text-slate-900 text-sm">#{order.order_number || order.id.substring(0, 8)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fulfilled By</span>
                <span className="font-bold text-slate-900">{order.medical_stores?.store_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount Payable (COD)</span>
                <span className="font-black text-slate-900 text-sm">₹{order.total_amount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Estimated Delivery Time</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>30–45 Mins Fast Dispatch</span>
                </span>
              </div>

              {(order.delivery_name || order.addresses) && (
                <div className="pt-2 border-t border-slate-200/80 space-y-0.5">
                  <p className="text-slate-500 font-medium">Delivery Address Snapshot:</p>
                  <p className="font-bold text-slate-800">
                    {order.delivery_name || order.addresses?.full_name} • +91 {order.delivery_phone || order.addresses?.phone}
                  </p>
                  <p className="text-slate-600">
                    {order.delivery_address_line1 || order.addresses?.address_line_1}
                    {order.delivery_address_line2 ? `, ${order.delivery_address_line2}` : ''}
                  </p>
                  <p className="text-slate-600">
                    {order.delivery_post_office ? `${order.delivery_post_office} P.O., ` : ''}
                    {order.delivery_district || order.delivery_locality || order.addresses?.city}, {order.delivery_state || order.addresses?.state} — <strong className="text-slate-900">{order.delivery_pincode || order.addresses?.pincode}</strong>
                  </p>
                  {order.delivery_instructions && (
                    <p className="text-[11px] text-slate-500 italic">Instructions: {order.delivery_instructions}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link href={`/orders/${params.id}`}>
              <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Track Live Order Status
              </Button>
            </Link>

            <Link href="/products">
              <Button variant="outline" size="lg" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
