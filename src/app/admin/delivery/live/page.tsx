'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Radio, Truck, Store, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MapProvider } from '@/components/maps/MapProvider';
import { createClient } from '@/lib/supabase/client';

export default function AdminLiveDeliveryMonitorPage() {
  const supabase = createClient();

  const [activeDispatches, setActiveDispatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveDispatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, medical_stores(store_name, address, city), addresses(*), delivery_partners(*, profiles(full_name))')
        .in('order_status', ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'])
        .order('created_at', { ascending: false });

      if (data) setActiveDispatches(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchActiveDispatches();

    // Setup Realtime subscription
    const channel = supabase
      .channel('admin-live-deliveries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchActiveDispatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveDispatches, supabase]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Realtime Live Delivery Monitor</h1>
          </div>
          <p className="text-xs text-slate-500">Live monitoring of all active medicine delivery dispatches</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/delivery">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Riders Roster
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchActiveDispatches}>
            Refresh Dispatches
          </Button>
        </div>
      </div>

      {/* Live Map Provider */}
      <MapProvider className="h-64" />

      {/* Active Dispatches Cards Grid */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-600" />
          <span>Active Dispatches in Progress ({activeDispatches.length})</span>
        </h2>

        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading live active dispatches...</p>
        ) : activeDispatches.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No active delivery dispatches right now.</p>
        ) : (
          <div className="space-y-4">
            {activeDispatches.map((ord) => (
              <div key={ord.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      #{ord.order_number || ord.id.substring(0, 8)}
                    </span>
                    <span className="bg-brand-50 text-brand-700 font-extrabold text-[9px] uppercase px-2.5 py-0.5 rounded-full border border-brand-200">
                      {ord.order_status}
                    </span>
                  </div>

                  <span className="font-bold text-slate-700">
                    Rider: {ord.delivery_partners?.profiles?.full_name || 'Assigned Partner'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Pickup Pharmacy</p>
                    <p className="font-bold text-slate-800">{ord.medical_stores?.store_name} ({ord.medical_stores?.city})</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Customer Location</p>
                    <p className="font-bold text-slate-800">{ord.addresses?.full_name} ({ord.addresses?.city})</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
