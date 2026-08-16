'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, MapPin, Phone, Star, ShieldCheck, Clock, ArrowLeft, Search, Package, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const { addToCart } = useCart();
  const supabase = createClient();

  const [store, setStore] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchStoreAndProducts = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Store Info
      const { data: storeData } = await supabase
        .from('medical_stores')
        .select('*')
        .eq('id', params.id)
        .single();

      if (storeData) setStore(storeData);

      // 2. Fetch Store Products
      const { data: prodData } = await supabase
        .from('products')
        .select('*, product_categories(id, name, slug)')
        .eq('seller_store_id', params.id)
        .eq('is_active', true)
        .order('product_name', { ascending: true });

      if (prodData) setProducts(prodData);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    fetchStoreAndProducts();
  }, [fetchStoreAndProducts]);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const prodName = p.product_name || p.name || '';
    const genName = p.generic_name || p.generic_composition || '';
    return (
      prodName.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      genName.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="grow max-w-7xl mx-auto w-full p-8 text-center text-xs text-slate-500">
          Loading pharmacy store details...
        </main>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="grow max-w-7xl mx-auto w-full p-12 text-center space-y-4">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Pharmacy Store Not Found</h2>
          <Link href="/stores">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Stores Directory
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <Link href="/stores" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Stores</span>
        </Link>

        {/* Store Banner Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-soft-lg border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-2xl">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{store.store_name}</h1>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Drug License: <strong className="font-mono text-slate-200">{store.medical_license_number}</strong></p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-extrabold text-white">{store.rating || 5.0}</span>
              <span className="text-slate-400">Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{store.address}, {store.city} — {store.pincode}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{store.phone || store.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Hours: {store.opening_time || '08:00'} - {store.closing_time || '22:00'}</span>
            </div>
          </div>
        </div>

        {/* In-Store Medicine Search */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder={`Search medicines in ${store.store_name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <span className="text-xs font-semibold text-slate-500">{filteredProducts.length} medicines available in store</span>
        </div>

        {/* Store Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-900">No medicines found in this pharmacy</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const isOutStock = p.is_active === false;
              const displayName = p.product_name || p.name || 'Medicine';
              const displayGeneric = p.generic_name || p.generic_composition || p.brand;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm hover:shadow-soft-lg hover:border-brand-200 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <Link href={`/products/${p.id}`} className="block">
                      <div className="w-full h-40 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden flex items-center justify-center">
                        {p.image_url ? (
                          <Image src={p.image_url} alt={displayName} fill className="object-cover" />
                        ) : (
                          <Package className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                    </Link>

                    <div>
                      <Link href={`/products/${p.id}`}>
                        <h3 className="font-extrabold text-slate-900 text-sm hover:text-brand-600 transition-colors leading-tight">
                          {displayName}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{displayGeneric}</p>
                      {p.product_categories?.name && (
                        <span className="inline-block text-[10px] text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md font-extrabold mt-1">
                          {p.product_categories.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-black text-slate-900">₹{p.selling_price}</p>
                      {p.mrp && Number(p.mrp) > Number(p.selling_price) && (
                        <p className="text-[10px] text-slate-400 line-through">MRP ₹{p.mrp}</p>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isOutStock}
                      onClick={() => addToCart({ ...p, store_name: store.store_name }, 1)}
                      leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
