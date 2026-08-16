'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, Store, MapPin, CheckCircle2, ShieldAlert, KeyRound, ArrowLeft, MessageSquare, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderChatModal } from '@/components/chat/OrderChatModal';
import { useAuth } from '@/context/AuthContext';
import { updateDeliveryProgress, verifyDeliveryOTPAndComplete, updateRiderLiveLocation } from '@/lib/supabase/delivery';
import { createClient } from '@/lib/supabase/client';
import { LiveTrackingMap } from '@/components/location/LiveTrackingMap';
import { Compass, Navigation } from 'lucide-react';

export default function ActiveJobExecutionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [otpInput, setOtpInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live GPS Tracking State
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number; heading?: number | null } | null>(null);
  const [gpsPermissionError, setGpsPermissionError] = useState<string | null>(null);

  const fetchJobData = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Order
      const { data: ord } = await supabase
        .from('orders')
        .select('*, medical_stores(*), addresses(*), customers(profile_id)')
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
    fetchJobData();
  }, [fetchJobData]);

  // Continuously watch rider GPS position and broadcast to Supabase
  useEffect(() => {
    if (!user || !order || order.order_status === 'DELIVERED' || order.order_status === 'CANCELLED') {
      return;
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsPermissionError('Geolocation is not supported by your browser.');
      return;
    }

    let lastBroadcastMs = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed, accuracy } = pos.coords;
        setRiderCoords({ lat: latitude, lng: longitude, heading: heading || 0 });
        setGpsPermissionError(null);

        const now = Date.now();
        // Throttle database broadcasts to every 5 seconds to avoid excessive DB writes
        if (now - lastBroadcastMs > 5000) {
          lastBroadcastMs = now;
          updateRiderLiveLocation({
            orderId: order.id,
            profileId: user.id,
            latitude,
            longitude,
            heading: heading || null,
            speed: speed || null,
            accuracy: accuracy || null,
          });
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsPermissionError('Location access is required for live delivery tracking. Please grant GPS permission.');
        } else {
          setGpsPermissionError('Unable to detect current GPS location. Please check device location settings.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user, order]);

  // Status Step Progress Handler
  const handleProgress = async (nextStatus: string) => {
    setIsUpdating(true);
    setErrorMessage(null);

    const res = await updateDeliveryProgress(params.id, nextStatus);
    if (res.success) {
      await fetchJobData();
    } else {
      setErrorMessage(res.error || 'Failed to update delivery progress.');
    }
    setIsUpdating(false);
  };

  // OTP Verification & Completion Handler
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !otpInput.trim()) return;

    setIsUpdating(true);
    setErrorMessage(null);

    const res = await verifyDeliveryOTPAndComplete(params.id, otpInput, user.id);
    if (res.success) {
      setSuccessMessage('Delivery verified & completed! Earnings updated.');
      setTimeout(() => {
        router.push('/delivery/earnings');
      }, 2000);
    } else {
      setErrorMessage(res.error || 'Failed to verify OTP.');
    }
    setIsUpdating(false);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
        Loading active delivery details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Delivery Job Not Found</h2>
        <Link href="/delivery">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Rider Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <Link href="/delivery" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<MessageSquare className="w-4 h-4 text-brand-600" />}
          onClick={() => setIsChatOpen(true)}
        >
          Customer Chat
        </Button>
      </div>

      {/* Main Delivery Workflow Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-soft-lg space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              Status: {order.order_status}
            </span>
            <h1 className="text-2xl font-black text-white mt-2">
              Order #{order.order_number || order.id.substring(0, 8)}
            </h1>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Delivery Earning</p>
            <p className="text-2xl font-black text-brand-400">₹{order.delivery_fee || 40}</p>
          </div>
        </div>

        {/* GPS Permission Warning Banner */}
        {gpsPermissionError && (
          <div className="p-4 bg-rose-950/80 border border-rose-700 rounded-2xl text-xs text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{gpsPermissionError}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-white text-rose-900 font-extrabold px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer"
            >
              Enable GPS Location
            </button>
          </div>
        )}

        {/* Rider Navigation Map */}
        {order.order_status !== 'DELIVERED' && order.order_status !== 'CANCELLED' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Navigation className="w-4 h-4" />
                <span>
                  {order.order_status === 'ASSIGNED' || order.order_status === 'READY_FOR_PICKUP'
                    ? 'Navigating to Pharmacy Store for Pickup'
                    : 'Navigating to Customer Delivery Location'}
                </span>
              </span>
              <span className="text-[10px] text-slate-400">Live GPS Broadcasting Active</span>
            </div>

            <LiveTrackingMap
              riderLat={riderCoords?.lat}
              riderLng={riderCoords?.lng}
              heading={riderCoords?.heading}
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
                  ? `Pharmacy Pickup: ${order.medical_stores?.store_name}`
                  : `Customer: ${order.delivery_name || order.addresses?.full_name}`
              }
              height="300px"
            />
          </div>
        )}

        {/* Workflow Action Buttons */}
        <div className="space-y-4 pt-2">
          {order.order_status === 'ASSIGNED' && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isUpdating}
              onClick={() => handleProgress('PICKED_UP')}
              leftIcon={<Store className="w-5 h-5" />}
            >
              1. Confirm Medicine Pickup at Pharmacy
            </Button>
          )}

          {order.order_status === 'PICKED_UP' && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isUpdating}
              onClick={() => handleProgress('OUT_FOR_DELIVERY')}
              leftIcon={<Truck className="w-5 h-5" />}
            >
              2. Start Delivery (Mark Out for Delivery)
            </Button>
          )}

          {order.order_status === 'OUT_FOR_DELIVERY' && (
            <form onSubmit={handleVerifyOTP} className="bg-slate-800 border border-slate-700 p-6 rounded-2xl space-y-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-sm text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Enter Customer 4-Digit Delivery OTP</span>
                </p>
                <p className="text-slate-400">Ask the customer for their 4-digit security OTP to complete delivery.</p>
              </div>

              <Input
                placeholder="Enter 4-digit OTP (e.g. 1234)"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                required
              />

              <Button variant="primary" size="lg" className="w-full" isLoading={isUpdating} type="submit">
                Verify OTP & Complete Delivery
              </Button>
            </form>
          )}

          {order.order_status === 'DELIVERED' && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-extrabold text-sm text-white">Delivery Completed!</p>
                <p>This order has been verified and delivered.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Pickup & Delivery Location Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Pharmacy Pickup */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <Store className="w-4 h-4 text-brand-600" />
            <span>Pickup Pharmacy Store</span>
          </div>
          <p className="font-extrabold text-slate-900">{order.medical_stores?.store_name}</p>
          <p className="text-slate-600">{order.medical_stores?.address}, {order.medical_stores?.city} — {order.medical_stores?.pincode}</p>
        </div>

        {/* Customer Delivery */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>Customer Delivery Location</span>
          </div>
          <p className="font-extrabold text-slate-900">{order.addresses?.full_name} ({order.addresses?.phone})</p>
          <p className="text-slate-600">{order.addresses?.address_line_1}, {order.addresses?.city} — {order.addresses?.pincode}</p>
        </div>

      </div>

      {/* Ordered Items Summary */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Order Items ({items.length})</h3>
        <div className="divide-y divide-slate-100">
          {items.map((i) => (
            <div key={i.id} className="py-2 flex justify-between">
              <span>{i.product_name_snapshot} (Qty: {i.quantity})</span>
              <span className="font-bold">₹{i.total_price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Chat Modal */}
      <OrderChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderId={order.id}
        deliveryPartnerId={order.delivery_partner_id}
      />

    </div>
  );
}
