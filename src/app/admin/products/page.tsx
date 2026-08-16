'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Search, AlertTriangle, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createAuditLog } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';
import { fetchProductCategories, getCategoryMap } from '@/lib/categories';

export default function AdminProductsPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const catData = await fetchProductCategories(supabase);
      setCategories(catData);

      const { data } = await supabase
        .from('products')
        .select('*, product_categories(id, name, slug), medical_stores(store_name)')
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleProductStatus = async (productId: string, currentIsActive: boolean) => {
    setUpdatingId(productId);
    const nextIsActive = !currentIsActive;

    await supabase.from('products').update({ is_active: nextIsActive }).eq('id', productId);
    await createAuditLog(`PRODUCT_${nextIsActive ? 'ACTIVE' : 'INACTIVE'}`, 'PRODUCT', productId);
    await fetchProducts();
    setUpdatingId(null);
  };

  const filteredProducts = products.filter((p) => {
    const isActive = p.is_active !== undefined ? p.is_active : p.status === 'ACTIVE';
    if (statusFilter === 'ACTIVE' && !isActive) return false;
    if (statusFilter === 'INACTIVE' && isActive) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const prodName = p.product_name || p.name || '';
    const genName = p.generic_name || p.generic_composition || '';
    return prodName.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || genName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Products & Expiry Monitoring Catalog</h1>
          <p className="text-xs text-slate-500">Audit pharmacy listings, stock availability, and medicine status</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Search medicine, composition..."
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading products catalog...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No product records found.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredProducts.map((p) => {
              const isActive = p.is_active !== undefined ? p.is_active : p.status === 'ACTIVE';
              const displayName = p.product_name || p.name || 'Medicine';
              const displayGeneric = p.generic_name || p.generic_composition || p.brand;
              const catMap = getCategoryMap(categories);
              const categoryName = p.product_categories?.name || catMap.get(p.category_id) || 'Uncategorized';

              return (
                <div key={p.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{displayName}</span>
                      <span className="bg-brand-50 text-brand-700 font-extrabold text-[9px] px-2 py-0.5 rounded border border-brand-200 uppercase">
                        {categoryName}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {p.prescription_required && (
                        <span className="bg-red-50 text-red-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded border border-red-200 uppercase">
                          Rx
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 font-medium">{displayGeneric} • Pack: {p.pack_size || 'Strip'}</p>
                    <p className="text-slate-500">
                      Pharmacy: <strong className="text-slate-800">{p.medical_stores?.store_name}</strong> • Selling Price: <strong className="text-slate-900">₹{p.selling_price}</strong>
                    </p>
                  </div>

                  <Button
                    variant={isActive ? 'outline' : 'primary'}
                    size="sm"
                    isLoading={updatingId === p.id}
                    onClick={() => handleToggleProductStatus(p.id, isActive)}
                  >
                    {isActive ? 'Deactivate Listing' : 'Activate Product'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
