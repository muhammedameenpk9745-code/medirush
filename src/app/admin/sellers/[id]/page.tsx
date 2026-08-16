'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Store, ShieldCheck, CheckCircle2, XCircle, ArrowLeft, FileText, MapPin, Phone, Mail, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createAuditLog } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

export default function AdminSellerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [store, setStore] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [coverageSettings, setCoverageSettings] = useState<any | null>(null);
  const [coverageAreas, setCoverageAreas] = useState<any[]>([]);

  const fetchStore = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('medical_stores')
        .select('*')
        .eq('id', params.id)
        .single();

      if (data) setStore(data);

      const { data: covSet } = await supabase
        .from('seller_delivery_settings')
        .select('*')
        .eq('store_id', params.id)
        .maybeSingle();

      if (covSet) setCoverageSettings(covSet);

      const { data: covAreas } = await supabase
        .from('seller_delivery_areas')
        .select('*')
        .eq('store_id', params.id);

      if (covAreas) setCoverageAreas(covAreas);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    setIsUpdating(true);
    await supabase.from('medical_stores').update({ verification_status: status }).eq('id', params.id);
    await createAuditLog(`SELLER_${status}`, 'MEDICAL_STORE', params.id);
    await fetchStore();
    setIsUpdating(false);
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading pharmacy audit details...</div>;
  }

  if (!store) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Pharmacy Store Not Found</h2>
        <Link href="/admin/sellers">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Sellers Roster
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/admin/sellers" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Pharmacies</span>
        </Link>

        <div className="flex items-center gap-2">
          {store.verification_status !== 'APPROVED' && (
            <Button
              variant="primary"
              size="sm"
              isLoading={isUpdating}
              onClick={() => handleUpdateStatus('APPROVED')}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Approve Store
            </Button>
          )}

          {store.verification_status !== 'SUSPENDED' && (
            <Button
              variant="danger"
              size="sm"
              isLoading={isUpdating}
              onClick={() => handleUpdateStatus('SUSPENDED')}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Suspend Store
            </Button>
          )}
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">{store.store_name}</h1>
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {store.verification_status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Owner: <strong className="text-slate-800">{store.owner_name}</strong></p>
            </div>
          </div>
        </div>

        {/* License Credentials Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Drug License & Legal Verification</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 uppercase font-bold text-[10px]">Medical Drug License No.</p>
              <p className="font-mono font-black text-slate-900 text-sm">{store.medical_license_number}</p>
            </div>

            <div>
              <p className="text-slate-500 uppercase font-bold text-[10px]">GST Registration No.</p>
              <p className="font-mono font-black text-slate-900 text-sm">{store.gst_number || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Contact Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{store.address}, {store.city} — {store.pincode}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{store.phone}</span>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{store.email}</span>
          </div>
        </div>

        {/* Delivery Coverage & Service Area Audit Section */}
        <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-600" />
            <span>Configured Delivery Coverage & Service Area</span>
          </h3>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 font-medium">Coverage Type: </span>
                <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 uppercase">
                  {coverageSettings?.coverage_type || 'INDIA_WIDE (Default)'}
                </span>
              </div>

              {coverageSettings?.coverage_type === 'RADIUS' && (
                <div>
                  <span className="text-slate-500 font-medium">Maximum Radius: </span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {coverageSettings.radius_km || 5} KM
                  </span>
                </div>
              )}
            </div>

            {coverageAreas.length > 0 && (
              <div className="pt-2 space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Configured Allowed Locations ({coverageAreas.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {coverageAreas.map((area, i) => (
                    <span key={i} className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-800 font-bold text-[11px]">
                      {area.area_value} <span className="text-slate-400 text-[9px]">({area.area_type})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
