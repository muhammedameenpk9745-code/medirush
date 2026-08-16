'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, Truck, Store, MapPin, ShieldAlert, MessageSquare, AlertCircle, XCircle } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { OrderChatModal } from '@/components/chat/OrderChatModal';
import { createClient } from '@/lib/supabase/client';
import { LiveTrackingMap } from '@/components/location/LiveTrackingMap';
import { fetchDeliveryTracking } from '@/lib/supabase/delivery';
import { formatStaleTime } from '@/lib/delivery/tracking';
import { Compass, Navigation } from 'lucide-react';

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const [liveTracking, setLiveTracking] = useState<{
    latitude: number;
    longitude: number;
    heading?: number | null;
    updated_at?: string;
  } | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Order
      const { data: ord } = await supabase
        .from('orders')
        .select('*, medical_stores(*), addresses(*), delivery_partners(*, profiles(full_name, avatar_url))')
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
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Subscribe to Supabase Realtime channel for live rider location updates
  useEffect(() => {
    if (!order?.id || order.order_status === 'DELIVERED' || order.order_status === 'CANCELLED') {
      return;
    }

    // 1. Initial fetch of active rider telemetry
    fetchDeliveryTracking(order.id).then((data) => {
      if (data) setLiveTracking(data);
    });

    // 2. Subscribe to realtime changes on delivery_tracking table for this order
    const channel = supabase
      .channel(`tracking:${order.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_tracking',
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          if (payload.new) {
            setLiveTracking(payload.new as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, order?.order_status, supabase]);

  // Order Cancellation Handler
  const handleCancelOrder = async () => {
    if (!order) return;
    if (confirm('Are you sure you want to cancel this order?')) {
      setIsCancelling(true);
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'CANCELLED' })
        .eq('id', order.id);

      if (!error) {
        await fetchOrderDetails();
      }
      setIsCancelling(false);
    }
  };

  // Timeline status steps
  const timelineSteps = [
    { label: 'Order Placed', status: 'PLACED' },
    { label: 'Pharmacy Accepted', status: 'SELLER_ACCEPTED' },
    { label: 'Packing Medicines', status: 'PREPARING' },
    { label: 'Ready for Pickup', status: 'READY_FOR_PICKUP' },
    { label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', status: 'DELIVERED' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'CANCELLED' || status === 'REJECTED') return -1;
    if (status === 'PLACED') return 0;
    if (status === 'CONFIRMED' || status === 'SELLER_ACCEPTED') return 1;
    if (status === 'PREPARING') return 2;
    if (status === 'READY_FOR_PICKUP' || status === 'ASSIGNED') return 3;
    if (status === 'GOING_TO_STORE' || status === 'AT_STORE' || status === 'PICKED_UP' || status === 'ON_THE_WAY' || status === 'OUT_FOR_DELIVERY') return 4;
    if (status === 'DELIVERED') return 5;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="grow max-w-5xl mx-auto w-full p-8 text-center text-xs text-slate-500">
          Loading live order status...
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="grow max-w-5xl mx-auto w-full p-12 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
          <Link href="/orders">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to My Orders
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.order_status);
  const isCancellable = order.order_status === 'PLACED' || order.order_status === 'CONFIRMED' || order.order_status === 'SELLER_ACCEPTED';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/orders" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Orders</span>
          </Link>

          {isCancellable && (
            <Button variant="danger" size="sm" isLoading={isCancelling} onClick={handleCancelOrder}>
              Cancel Order
            </Button>
          )}
        </div>

        {/* Live Order Timeline */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-soft-lg space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 bg-brand-500/20 px-3 py-1 rounded-full border border-brand-500/30">
                Order Status: {order.order_status}
              </span>
              <h1 className="text-2xl font-black text-white mt-2">
                Order #{order.order_number || order.id.substring(0, 8)}
              </h1>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<MessageSquare className="w-4 h-4" />}
              onClick={() => setIsChatOpen(true)}
            >
              Chat with Delivery Rider
            </Button>
          </div>

          {/* Timeline Visual Progress */}
          {order.order_status === 'CANCELLED' ? (
            <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-2xl text-xs text-red-200 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <p className="font-extrabold text-sm text-red-100">Order Cancelled</p>
                <p className="text-red-300 text-[11px]">This order has been cancelled.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
              {timelineSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div
                    key={step.status}
                    className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                      isCurrent
                        ? 'bg-brand-500/20 border-brand-400 ring-1 ring-brand-400'
                        : isPassed
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                        : 'bg-slate-900/50 border-slate-800 opacity-40 text-slate-500'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-[10px] font-bold">
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <p className="text-[11px] font-bold leading-tight">{step.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Real-Time Live Delivery Map for Customer */}
          {order.order_status !== 'DELIVERED' && order.order_status !== 'CANCELLED' && order.delivery_partner_id && (
            <div className="pt-4 space-y-2.5 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4" />
                  <span>
                    {order.order_status === 'ASSIGNED' || order.order_status === 'READY_FOR_PICKUP'
                      ? 'Rider is on the way to Pharmacy Store for pickup'
                      : 'Rider is on the way with your medicines!'}
                  </span>
                </span>
                <span className={`text-[11px] font-bold ${formatStaleTime(liveTracking?.updated_at).isStale ? 'text-amber-400' : 'text-slate-400'}`}>
                  {formatStaleTime(liveTracking?.updated_at).text}
                </span>
              </div>

              <LiveTrackingMap
                riderLat={liveTracking?.latitude}
                riderLng={liveTracking?.longitude}
                heading={liveTracking?.heading}
                destLat={
                  order.order_status === 'ASSIGNED' || order.order_status === 'READY_FOR_PICKUP'
                    ? order.medical_stores?.latitude || 11.0428
                    : order.delivery_latitude || order.addresses?.latitude || 11.0428
                }
                destLng={
                  order.order_status === 'ASSIGNED' || order.order_status === 'READY_FOR_PICKUP'
                    ? order.medical_stores?.longitude || 76.0807
                    : order.delivery_longitude || order.addresses?.longitude || 76.0807
                }
                destLabel={
                  order.order_status === 'ASSIGNED' || order.order_status === 'READY_FOR_PICKUP'
                    ? `Pharmacy Store: ${order.medical_stores?.store_name}`
                    : `Delivery Address: ${order.delivery_name || order.addresses?.full_name}`
                }
                height="340px"
              />
            </div>
          )}
        </div>

        {/* Customer Delivery OTP Display Card */}
        {order.delivery_otp && (order.order_status === 'OUT_FOR_DELIVERY' || order.order_status === 'PICKED_UP' || order.order_status === 'ASSIGNED') && (
          <div className="bg-emerald-900 text-white border border-emerald-700 rounded-3xl p-6 shadow-soft-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                Delivery Security Verification Code
              </span>
              <h3 className="text-lg font-bold text-white pt-1">Your 4-Digit Delivery OTP</h3>
              <p className="text-xs text-emerald-200">Share this code with your rider when they arrive to complete your delivery.</p>
            </div>

            <div className="bg-slate-950 text-emerald-400 font-mono font-black text-3xl tracking-widest px-6 py-3 rounded-2xl border border-emerald-500/40 shadow-inner">
              {order.delivery_otp}
            </div>
          </div>
        )}

        {/* Assigned Rider Info (If available) */}
        {order.delivery_partners && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-slate-900 text-sm">
                  {order.delivery_partners?.profiles?.full_name || 'Assigned Rider Partner'}
                </p>
                <p className="text-slate-500">
                  Vehicle: {order.delivery_partners?.vehicle_type} ({order.delivery_partners?.vehicle_number})
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageSquare className="w-4 h-4 text-brand-600" />}
              onClick={() => setIsChatOpen(true)}
            >
              Rider Chat
            </Button>
          </div>
        )}

        {/* Order Details & Address */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Items List */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Prescription & Ordered Items</h3>

            <div className="divide-y divide-slate-100 space-y-3 text-xs">
              {items.map((item) => (
                <div key={item.id} className="pt-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.product_name_snapshot}</p>
                    <p className="text-slate-500">{item.manufacturer_snapshot} • Qty: {item.quantity}</p>
                  </div>
                  <span className="font-black text-slate-900 text-sm">₹{item.total_price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Summary */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Payment & Delivery Summary</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Pharmacy Store</span>
                <span className="font-bold text-slate-900">{order.medical_stores?.store_name}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{order.subtotal}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-bold text-slate-900">₹{order.delivery_fee}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                <span>Total Paid (COD)</span>
                <span className="text-base text-slate-900">₹{order.total_amount}</span>
              </div>
            </div>

            {(order.delivery_name || order.addresses) && (
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <p className="font-bold text-slate-900">Delivery Address Snapshot:</p>
                <p className="text-slate-700 font-semibold">
                  {order.delivery_name || order.addresses?.full_name} • +91 {order.delivery_phone || order.addresses?.phone}
                </p>
                <p className="text-slate-500">
                  {order.delivery_address_line1 || order.addresses?.address_line_1}
                  {order.delivery_address_line2 ? `, ${order.delivery_address_line2}` : ''}
                </p>
                <p className="text-slate-500">
                  {order.delivery_post_office ? `${order.delivery_post_office} P.O., ` : ''}
                  {order.delivery_district || order.delivery_locality || order.addresses?.city}, {order.delivery_state || order.addresses?.state} — <strong className="text-slate-900">{order.delivery_pincode || order.addresses?.pincode}</strong>
                </p>
                {order.delivery_instructions && (
                  <p className="text-[11px] text-slate-500 italic pt-0.5">Instructions: {order.delivery_instructions}</p>
                )}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Chat Modal */}
      <OrderChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderId={order.id}
        deliveryPartnerId={order.delivery_partner_id}
        riderName={order.delivery_partners?.profiles?.full_name}
      />

      <Footer />
      <MobileNavigation />
    </div>
  );
}
