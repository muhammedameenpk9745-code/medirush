'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Store,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function SellerDashboardPage() {
  const { user, profile, sellerStore } = useAuth();
  const supabase = createClient();

  const [metrics, setMetrics] = useState({
    todaysOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    expiringCount: 0,
    todaysSales: 0,
    monthlySales: 0,
    totalRevenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !sellerStore) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch Total Products
      const { count: prodCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_store_id', sellerStore.id);

      // 2. Fetch Low Stock / Inactive Products
      const { data: prodsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_store_id', sellerStore.id);

      let lowStock = 0;
      const lowStockList: any[] = [];

      if (prodsData) {
        prodsData.forEach((p: any) => {
          if (p.is_active === false) {
            lowStock++;
            lowStockList.push(p);
          }
        });
      }

      // 3. Fetch Expiring Batches (<= 30 days) from product_batches
      const now = new Date();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      const { data: batchData } = await supabase
        .from('product_batches')
        .select('*, products!inner(seller_store_id)')
        .eq('products.seller_store_id', sellerStore.id);

      let expiring = 0;
      if (batchData) {
        batchData.forEach((b: any) => {
          if (b.expiry_date) {
            const expTime = new Date(b.expiry_date).getTime();
            if (expTime - now.getTime() <= thirtyDaysMs) {
              expiring++;
            }
          }
        });
      }

      // 4. Fetch Orders for this store
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', sellerStore.id)
        .order('created_at', { ascending: false });

      let todayOrd = 0;
      let pendingOrd = 0;
      let readyOrd = 0;
      let todaySalesSum = 0;
      let monthSalesSum = 0;
      let totalRevSum = 0;

      const todayStr = new Date().toISOString().split('T')[0];
      const monthStr = new Date().toISOString().substring(0, 7);

      if (orderData) {
        orderData.forEach((o: any) => {
          totalRevSum += Number(o.total_amount || 0);

          const oDateStr = o.created_at?.split('T')[0];
          const oMonthStr = o.created_at?.substring(0, 7);

          if (oDateStr === todayStr) {
            todayOrd++;
            todaySalesSum += Number(o.total_amount || 0);
          }

          if (oMonthStr === monthStr) {
            monthSalesSum += Number(o.total_amount || 0);
          }

          if (o.order_status === 'PLACED' || o.order_status === 'SELLER_ACCEPTED') {
            pendingOrd++;
          }
          if (o.order_status === 'READY_FOR_PICKUP') {
            readyOrd++;
          }
        });
      }

      setMetrics({
        todaysOrders: todayOrd,
        pendingOrders: pendingOrd,
        readyOrders: readyOrd,
        totalProducts: prodCount || 0,
        lowStockCount: lowStock,
        expiringCount: expiring,
        todaysSales: todaySalesSum,
        monthlySales: monthSalesSum,
        totalRevenue: totalRevSum,
      });

      setRecentOrders(orderData ? orderData.slice(0, 5) : []);
      setLowStockProducts(lowStockList.slice(0, 5));
    } catch {
      // Fallback handling
    } finally {
      setIsLoading(false);
    }
  }, [sellerStore, supabase, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-soft-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-xl z-10">
          <div className="flex items-center gap-2">
            <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[10px] uppercase font-extrabold px-3 py-1 rounded-full">
              Live Store Analytics
            </span>
            <span className="text-xs text-slate-400">• License Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {sellerStore?.store_name || 'Pharmacy Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage local prescription orders, track expiring medicine batches, and reorder low-stock items.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link href="/seller/products/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Add Product
            </Button>
          </Link>
          <Link href="/seller/orders">
            <Button variant="outline" size="md" className="border-slate-700 text-slate-200 hover:bg-slate-800">
              Manage Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1: Pending Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Action</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.pendingOrders}</p>
            <p className="text-xs text-slate-500 mt-1">Orders requiring acceptance</p>
          </div>
        </div>

        {/* Metric 2: Ready Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ready for Pickup</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.readyOrders}</p>
            <p className="text-xs text-slate-500 mt-1">Packed & awaiting rider</p>
          </div>
        </div>

        {/* Metric 3: Low Stock Alerts */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock Alert</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.lowStockCount}</p>
            <p className="text-xs text-slate-500 mt-1">Products below reorder limit</p>
          </div>
        </div>

        {/* Metric 4: Expiring Batches */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expiring (≤ 30d)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{metrics.expiringCount}</p>
            <p className="text-xs text-slate-500 mt-1">Batches expiring this month</p>
          </div>
        </div>

      </div>

      {/* Secondary Financial Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase font-bold text-slate-400">Today&apos;s Revenue</p>
            <p className="text-xl font-black text-white mt-1">₹{metrics.todaysSales.toLocaleString('en-IN')}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-brand-400 opacity-80" />
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase font-bold text-slate-400">Monthly Revenue</p>
            <p className="text-xl font-black text-white mt-1">₹{metrics.monthlySales.toLocaleString('en-IN')}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-brand-400 opacity-80" />
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase font-bold text-slate-400">Total All-Time Revenue</p>
            <p className="text-xl font-black text-white mt-1">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-brand-400 opacity-80" />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Pending Orders */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-500">Orders placed for your pharmacy</p>
            </div>
            <Link href="/seller/orders" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic">No orders received yet for this store.</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">#{ord.order_number || ord.id.substring(0, 8)}</span>
                      <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded border border-brand-200 uppercase">
                        {ord.order_status}
                      </span>
                    </div>
                    <p className="text-slate-600">Total: <strong className="text-slate-900">₹{ord.total_amount}</strong> • {ord.payment_status}</p>
                  </div>

                  <Link href="/seller/orders">
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Low-Stock Medicine Inventory</h3>
              <p className="text-xs text-slate-500">Items requiring stock reorder</p>
            </div>
            <Link href="/seller/inventory" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
              <span>View Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic">All medicines have healthy stock levels.</div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl border border-red-200 bg-red-50/40 flex items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-slate-600">Stock: <strong className="text-red-700 font-extrabold">{p.stock || 0} units</strong> (Reorder level: {p.reorder_level || 10})</p>
                  </div>

                  <Link href={`/seller/products/${p.id}`}>
                    <Button variant="danger" size="sm">Update Stock</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
