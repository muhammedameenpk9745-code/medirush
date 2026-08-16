'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Boxes, Plus, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ArrowUpDown, RefreshCw, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function SellerInventoryPage() {
  const { sellerStore } = useAuth();
  const supabase = createClient();

  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [availableQuantity, setAvailableQuantity] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!sellerStore) return;
    setIsLoading(true);

    try {
      // 1. Fetch Products
      const { data: prods } = await supabase
        .from('products')
        .select('id, product_name, brand')
        .eq('seller_store_id', sellerStore.id);

      if (prods) {
        setProducts(prods);
        if (prods.length > 0 && !selectedProductId) {
          setSelectedProductId(prods[0].id);
        }
      }

      // 2. Fetch Batches from product_batches
      const { data: batchData } = await supabase
        .from('product_batches')
        .select('*, products!inner(product_name, brand, seller_store_id)')
        .eq('products.seller_store_id', sellerStore.id)
        .order('expiry_date', { ascending: true });

      if (batchData) setBatches(batchData);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [sellerStore, selectedProductId, supabase]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle New Batch Addition
  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerStore || !selectedProductId) return;

    setIsSubmitting(true);
    const qtyNum = Number(availableQuantity);

    // 1. Insert Batch into product_batches
    const { error: batchErr } = await supabase.from('product_batches').insert({
      product_id: selectedProductId,
      batch_number: batchNumber,
      manufacturing_date: mfgDate,
      expiry_date: expiryDate,
      selling_price: Number(sellingPrice) || 0,
      quantity: qtyNum,
      status: 'ACTIVE',
    });

    if (!batchErr) {
      setIsAddBatchOpen(false);
      setBatchNumber('');
      await fetchInventory();
    }

    setIsSubmitting(false);
  };

  // Helper for expiry classification
  const getExpiryStatus = (expiryDateStr: string) => {
    if (!expiryDateStr) return { label: 'SAFE', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

    const now = new Date();
    const exp = new Date(expiryDateStr);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: 'EXPIRED (UNSELLABLE)', color: 'bg-red-100 text-red-800 border-red-200 font-extrabold', days: diffDays };
    }
    if (diffDays <= 30) {
      return { label: `EXPIRING SOON (${diffDays}d)`, color: 'bg-amber-100 text-amber-800 border-amber-200', days: diffDays };
    }
    if (diffDays <= 90) {
      return { label: `EXPIRING IN ${diffDays}d`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', days: diffDays };
    }

    return { label: `SAFE (${diffDays}d)`, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', days: diffDays };
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Medicine Batch & Inventory Control</h1>
          <p className="text-sm text-slate-500">Track medicine manufacturing dates, expiry alerts, and stock safety limits</p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddBatchOpen(true)}
        >
          Add New Stock Batch
        </Button>
      </div>

      {/* Expiry Legend Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Expiry Protection System:</span>
        
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-red-100 text-red-800 font-extrabold px-3 py-1 rounded-full border border-red-200">
            EXPIRED (0 days) — Blocked from Sale
          </span>
          <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200">
            EXPIRING SOON (1–30 days)
          </span>
          <span className="bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full border border-yellow-200">
            EXPIRING (31–90 days)
          </span>
          <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
            SAFE (&gt; 90 days)
          </span>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-soft-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading inventory batches...</div>
        ) : batches.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No stock batches registered</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Register stock batch numbers with MFG and Expiry dates to track inventory safety.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddBatchOpen(true)}
            >
              Add First Batch
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Batch Number</th>
                  <th className="py-3.5 px-4">Medicine Product</th>
                  <th className="py-3.5 px-4">MFG Date</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Available Stock</th>
                  <th className="py-3.5 px-4">Expiry Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {batches.map((b) => {
                  const expStatus = getExpiryStatus(b.expiry_date);
                  const prodName = b.products?.product_name || b.products?.name || 'Medicine Product';
                  const mfgDateDisplay = b.manufacturing_date || b.mfg_date || '—';
                  const qtyDisplay = b.quantity !== undefined ? b.quantity : (b.available_quantity || 0);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">{b.batch_number}</td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 text-sm">{prodName}</p>
                        <p className="text-[11px] text-slate-500">{b.products?.brand}</p>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{mfgDateDisplay}</td>
                      <td className="py-4 px-4 font-semibold text-slate-800">{b.expiry_date || '—'}</td>
                      <td className="py-4 px-4 font-extrabold text-slate-900">{qtyDisplay} units</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase border ${expStatus.color}`}>
                          {expStatus.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Batch Modal */}
      <Modal
        isOpen={isAddBatchOpen}
        onClose={() => setIsAddBatchOpen(false)}
        title="Register New Inventory Stock Batch"
      >
        <form onSubmit={handleAddBatch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-slate-700">Select Medicine Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-brand-500 min-h-[42px]"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name || p.name} ({p.brand})
                </option>
              ))}
            </select>
          </div>

          <Input label="Batch Number" placeholder="BATCH-2024-9912" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Manufacturing Date" type="date" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} required />
            <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="MRP (₹)" type="number" placeholder="40.00" value={mrp} onChange={(e) => setMrp(e.target.value)} required />
            <Input label="Selling Price (₹)" type="number" placeholder="32.00" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
          </div>

          <Input label="Batch Stock Quantity" type="number" value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)} required />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddBatchOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Stock Batch
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
