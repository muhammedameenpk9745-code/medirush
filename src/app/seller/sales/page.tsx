'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Calendar, Package, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function SellerSalesPage() {
  const { sellerStore } = useAuth();
  const supabase = createClient();

  const [salesSummary, setSalesSummary] = useState({
    todaysSales: 0,
    weeklySales: 0,
    monthlySales: 0,
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
  });

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesData = useCallback(async () => {
    if (!sellerStore) return;
    setIsLoading(true);

    try {
      // Fetch Orders for this store
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, brand, selling_price))')
        .eq('store_id', sellerStore.id)
        .order('created_at', { ascending: false });

      if (orderData) {
        let todaySum = 0;
        let weekSum = 0;
        let monthSum = 0;
        let totalSum = 0;
        let totalOrds = orderData.length;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const monthStr = now.toISOString().substring(0, 7);
        const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

        const productSalesMap: Record<string, { name: string; brand: string; qty: number; revenue: number }> = {};

        orderData.forEach((o: any) => {
          const amt = Number(o.total_amount || 0);
          totalSum += amt;

          const oDateStr = o.created_at?.split('T')[0];
          const oMonthStr = o.created_at?.substring(0, 7);
          const oTimeMs = new Date(o.created_at).getTime();

          if (oDateStr === todayStr) todaySum += amt;
          if (oMonthStr === monthStr) monthSum += amt;
          if (oTimeMs >= sevenDaysAgoMs) weekSum += amt;

          // Aggregating top-selling products
          if (o.order_items) {
            o.order_items.forEach((item: any) => {
              const pName = item.products?.name || 'Medicine Product';
              const pBrand = item.products?.brand || 'Brand';
              const itemQty = Number(item.quantity || 1);
              const itemRev = Number(item.total_price || 0);

              if (!productSalesMap[pName]) {
                productSalesMap[pName] = { name: pName, brand: pBrand, qty: 0, revenue: 0 };
              }
              productSalesMap[pName].qty += itemQty;
              productSalesMap[pName].revenue += itemRev;
            });
          }
        });

        const topProdList = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        setSalesSummary({
          todaysSales: todaySum,
          weeklySales: weekSum,
          monthlySales: monthSum,
          totalSales: totalSum,
          totalOrders: totalOrds,
          avgOrderValue: totalOrds > 0 ? Math.round(totalSum / totalOrds) : 0,
        });

        setTopProducts(topProdList);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [sellerStore, supabase]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sales & Revenue Reports</h1>
        <p className="text-sm text-slate-500">Track pharmacy order volumes, daily gross revenue, and top-selling medicines</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-soft-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today&apos;s Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">₹{salesSummary.todaysSales.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400">Gross sales today</p>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-soft-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Last 7 Days Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">₹{salesSummary.weeklySales.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400">Gross weekly sales</p>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-soft-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Month Sales</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">₹{salesSummary.monthlySales.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400">Monthly total revenue</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">All-Time Revenue</p>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{salesSummary.totalSales.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Customer Orders</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{salesSummary.totalOrders}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Order Value (AOV)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{salesSummary.avgOrderValue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Top-Selling Medicines</h3>
            <p className="text-xs text-slate-500">Highest grossing products in your store</p>
          </div>
          <Package className="w-5 h-5 text-brand-600" />
        </div>

        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 italic">No sales data recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Medicine Product</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {topProducts.map((tp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{tp.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{tp.brand}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{tp.qty} units</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">₹{tp.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
