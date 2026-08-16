'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, ChevronRight, Store, Clock, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, medical_stores(store_name), delivery_partners(*, profiles(full_name))')
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.order_status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.order_number?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Marketplace Orders Control Center</h1>
          <p className="text-xs text-slate-500">Monitor all customer medicine orders across pharmacy partners</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Search order reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none min-h-[42px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading marketplace orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No order records found.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredOrders.map((o) => (
              <div key={o.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      #{o.order_number || o.id.substring(0, 8)}
                    </span>
                    <span className="bg-brand-50 text-brand-700 font-extrabold text-[9px] uppercase px-2.5 py-0.5 rounded-full border border-brand-200">
                      {o.order_status}
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                      {o.payment_status}
                    </span>
                  </div>

                  <p className="text-slate-600 font-medium">
                    Store: <strong className="text-slate-900">{o.medical_stores?.store_name}</strong> • Rider: <strong className="text-slate-900">{o.delivery_partners?.profiles?.full_name || 'Unassigned'}</strong>
                  </p>
                  <p className="text-slate-500">
                    Placed: {new Date(o.created_at).toLocaleString('en-IN')} • Amount: <strong className="text-slate-900">₹{o.total_amount}</strong>
                  </p>
                </div>

                <Link href={`/admin/orders/${o.id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Inspect Lifecycle & Audit
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
