'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Store, MapPin, Phone, Star, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function StoresPage() {
  const supabase = createClient();
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('medical_stores')
        .select('*')
        .eq('verification_status', 'APPROVED')
        .order('store_name', { ascending: true });

      if (data) setStores(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-soft-lg border border-slate-800">
          <div className="space-y-2 max-w-xl z-10">
            <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[10px] uppercase font-black px-3 py-1 rounded-full">
              Licensed Medical Stores
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white">Partner Pharmacies Near You</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Order directly from verified local chemists and medical stores for fast 30-minute delivery.
            </p>
          </div>
        </div>

        {/* Store Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            Loading pharmacy stores directory...
          </div>
        ) : stores.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <Store className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-900">No partner stores active</p>
            <p className="text-xs text-slate-500">Verified medical stores will appear in this directory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm hover:shadow-soft-lg hover:border-brand-200 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0">
                      <Store className="w-6 h-6" />
                    </div>

                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified License</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{s.store_name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>{s.address}, {s.city} — {s.pincode}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{s.rating || 5.0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.opening_time || '08:00'} - {s.closing_time || '22:00'}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/stores/${s.id}`}>
                  <Button variant="outline" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Browse Store Medicines
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
