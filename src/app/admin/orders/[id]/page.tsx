'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Store, Truck, MapPin, ShieldCheck, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Order
      const { data: ord } = await supabase
        .from('orders')
        .select('*, medical_stores(*), addresses(*), customers(*, profiles(full_name, phone, email)), delivery_partners(*, profiles(full_name))')
        .eq('id', params.id)
        .single();

      if (ord) setOrder(ord);

      // 2. Fetch Order Items
      const { data: itms } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', params.id);

      if (itms) setItems(itms);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading order lifecycle details...</div>;
  }

  if (!order) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Order Record Not Found</h2>
        <Link href="/admin/orders">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Orders Control Center
          </Button>
        </Link>
      </div>
    );
  }

  const platformCommission = Number(order.subtotal || 0) * 0.10;
  const sellerEarnings = Number(order.subtotal || 0) - platformCommission;

  return (
    <div className="space-y-6">
      
      {/* Back Link */}
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Orders</span>
      </Link>

      {/* Main Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-soft-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 bg-brand-500/20 px-3 py-1 rounded-full border border-brand-500/30">
              Order Status: {order.order_status}
            </span>
            <h1 className="text-2xl font-black text-white mt-2">
              Order #{order.order_number || order.id.substring(0, 8)}
            </h1>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Total Amount</p>
            <p className="text-2xl font-black text-emerald-400">₹{order.total_amount}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
          <div>
            <p className="text-slate-500 uppercase font-bold text-[10px]">Payment Status</p>
            <p className="font-extrabold text-white">{order.payment_status}</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase font-bold text-[10px]">Delivery OTP</p>
            <p className="font-mono font-black text-emerald-400">{order.delivery_otp || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase font-bold text-[10px]">Platform Commission (10%)</p>
            <p className="font-bold text-brand-400">₹{platformCommission.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase font-bold text-[10px]">Seller Net Payable</p>
            <p className="font-bold text-white">₹{sellerEarnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        
        {/* Left 2 Columns: Items Snapshot */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Ordered Items ({items.length})</h3>

          <div className="divide-y divide-slate-100">
            {items.map((i) => (
              <div key={i.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{i.product_name_snapshot}</p>
                  <p className="text-slate-500">{i.manufacturer_snapshot} • Qty: {i.quantity} x ₹{i.unit_price}</p>
                </div>
                <span className="font-black text-slate-900 text-sm">₹{i.total_price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Stakeholders Info */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Stakeholders</h3>

          <div className="space-y-3">
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Customer</p>
              <p className="font-bold text-slate-900">{order.customers?.profiles?.full_name}</p>
              <p className="text-slate-500">{order.customers?.profiles?.phone || order.customers?.profiles?.email}</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-slate-400 uppercase font-bold text-[10px]">Pharmacy Store</p>
              <p className="font-bold text-slate-900">{order.medical_stores?.store_name}</p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-slate-400 uppercase font-bold text-[10px]">Delivery Partner</p>
              <p className="font-bold text-slate-900">{order.delivery_partners?.profiles?.full_name || 'Unassigned'}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
