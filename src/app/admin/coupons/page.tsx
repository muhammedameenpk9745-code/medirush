'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createAuditLog } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

export default function AdminCouponsPage() {
  const supabase = createClient();

  const [coupons, setCoupons] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(15);
  const [minOrderAmount, setMinOrderAmount] = useState(299);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(100);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setCoupons(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const uppercaseCode = code.toUpperCase().trim();
    const { data } = await supabase
      .from('coupons')
      .insert({
        code: uppercaseCode,
        discount_type: discountType,
        discount_value: discountValue,
        min_order_amount: minOrderAmount,
        max_discount_amount: maxDiscountAmount,
        is_active: true,
      })
      .select()
      .single();

    if (data) {
      await createAuditLog('COUPON_CREATE', 'COUPON', data.id);
      setCode('');
      setIsAdding(false);
      await fetchCoupons();
    }
  };

  const handleToggleCoupon = async (couponId: string, currentActive: boolean) => {
    await supabase.from('coupons').update({ is_active: !currentActive }).eq('id', couponId);
    await createAuditLog('COUPON_TOGGLE', 'COUPON', couponId);
    await fetchCoupons();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Coupons & Promotional Discount Engine</h1>
          <p className="text-xs text-slate-500">Create promotional discount codes and configure order validation limits</p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : 'Create Coupon Code'}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateCoupon} className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-soft-sm text-xs">
          <h3 className="font-bold text-slate-900 text-sm">New Coupon Rule</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Coupon Code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MEDI15" required />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none min-h-[42px]"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Discount Value" type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} required />
            <Input label="Min Order Amount (₹)" type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(Number(e.target.value))} required />
            <Input label="Max Discount (₹)" type="number" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(Number(e.target.value))} required />
          </div>

          <Button variant="primary" size="sm" type="submit">
            Publish Coupon Code
          </Button>
        </form>
      )}

      {/* Coupons List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-3 text-xs">
        {isLoading ? (
          <p className="text-center text-slate-400 py-8">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No coupon codes created yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {coupons.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="font-mono font-black text-slate-900 text-sm">{c.code}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                      c.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`} • Min Order: ₹{c.min_order_amount} • Max Discount: ₹{c.max_discount_amount}
                  </p>
                </div>

                <Button
                  variant={c.is_active ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleCoupon(c.id, c.is_active)}
                >
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
