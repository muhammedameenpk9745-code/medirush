'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Store, ShieldCheck, CheckCircle2, XCircle, Search, Clock, FileText, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createAuditLog } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

export default function AdminSellersPage() {
  const supabase = createClient();
  const [stores, setStores] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('medical_stores')
        .select('*')
        .order('created_at', { ascending: false });

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

  const handleUpdateStatus = async (storeId: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    setUpdatingId(storeId);
    await supabase.from('medical_stores').update({ verification_status: status }).eq('id', storeId);
    await createAuditLog(`SELLER_${status}`, 'MEDICAL_STORE', storeId);
    await fetchStores();
    setUpdatingId(null);
  };

  const filteredStores = stores.filter((s) => {
    if (statusFilter !== 'ALL' && s.verification_status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.store_name?.toLowerCase().includes(q) || s.medical_license_number?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Pharmacy Sellers Directory & Verification</h1>
          <p className="text-xs text-slate-500">Audit pharmacy credentials, drug licenses, and approve store applications</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Search pharmacy, license..."
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
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Rejected Only</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Stores List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading pharmacy stores...</p>
        ) : filteredStores.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No pharmacy seller records found.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredStores.map((s) => (
              <div key={s.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{s.store_name}</span>
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                      s.verification_status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : s.verification_status === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      {s.verification_status}
                    </span>
                  </div>

                  <p className="text-slate-600 font-medium">Owner: {s.owner_name} • Phone: {s.phone || s.email}</p>
                  <p className="text-slate-500">
                    License: <strong className="font-mono text-slate-800">{s.medical_license_number}</strong> • Address: {s.address}, {s.city} ({s.pincode})
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link href={`/admin/sellers/${s.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Details & Audit
                    </Button>
                  </Link>

                  {s.verification_status === 'PENDING' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={updatingId === s.id}
                        onClick={() => handleUpdateStatus(s.id, 'APPROVED')}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={updatingId === s.id}
                        onClick={() => handleUpdateStatus(s.id, 'REJECTED')}
                        leftIcon={<XCircle className="w-4 h-4" />}
                      >
                        Reject
                      </Button>
                    </>
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
