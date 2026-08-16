'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileText, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminPrescriptionsPage() {
  const supabase = createClient();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrescriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('prescriptions')
        .select('*, customers(*, profiles(full_name, phone))')
        .order('created_at', { ascending: false });

      if (data) setPrescriptions(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Doctor Prescription Compliance Monitoring</h1>
        <p className="text-xs text-slate-500">Platform-wide audit log of customer-uploaded prescriptions and pharmacy pharmacist reviews</p>
      </div>

      {/* Compliance Information Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Medical Regulations & Compliance Policy:</p>
          <p className="text-blue-800 leading-relaxed">
            Per healthcare marketplace regulations, doctor prescriptions are verified directly by licensed pharmacy pharmacists in the Seller Portal. Admin access is read-only for compliance auditing.
          </p>
        </div>
      </div>

      {/* Prescription Queue Grid */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading prescription records...</p>
        ) : prescriptions.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No doctor prescription records found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 text-xs">
                
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">
                      Customer: {rx.customers?.profiles?.full_name || 'Customer'}
                    </p>
                    <p className="text-slate-500">Uploaded: {new Date(rx.created_at).toLocaleString('en-IN')}</p>
                  </div>

                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                    rx.status === 'APPROVED' || rx.status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : rx.status === 'UNDER_REVIEW' || rx.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {rx.status}
                  </span>
                </div>

                {/* File Preview */}
                <div className="w-full h-44 rounded-xl bg-white border border-slate-200 relative overflow-hidden flex items-center justify-center">
                  {rx.file_url ? (
                    <a href={rx.file_url} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full">
                      <Image src={rx.file_url} alt="Prescription file" fill className="object-contain p-2" />
                    </a>
                  ) : (
                    <FileText className="w-10 h-10 text-slate-400" />
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={rx.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-brand-600 hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Full Prescription File</span>
                  </a>

                  {rx.review_notes && (
                    <span className="text-[11px] text-slate-500 italic max-w-[200px] truncate" title={rx.review_notes}>
                      Note: {rx.review_notes}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
