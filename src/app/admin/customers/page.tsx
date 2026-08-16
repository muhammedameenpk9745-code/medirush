'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, ShieldAlert, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createAuditLog } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

export default function AdminCustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*, customers(id, created_at)')
        .eq('role', 'CUSTOMER')
        .order('created_at', { ascending: false });

      if (data) setCustomers(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleStatus = async (profileId: string, currentStatus: string) => {
    setUpdatingId(profileId);
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

    await supabase.from('profiles').update({ status: newStatus }).eq('id', profileId);
    await createAuditLog(`CUSTOMER_${newStatus}`, 'CUSTOMER', profileId);
    await fetchCustomers();
    setUpdatingId(null);
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Customer Management</h1>
          <p className="text-xs text-slate-500">View registered customer profiles and manage account active/suspension status</p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* Customer Data Grid */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading customer roster...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No customer profiles found.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredCustomers.map((c) => {
              const isSuspended = c.status === 'SUSPENDED';

              return (
                <div key={c.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{c.full_name || 'Unnamed Customer'}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        isSuspended ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {c.status || 'ACTIVE'}
                      </span>
                    </div>
                    <p className="text-slate-600">{c.email} • {c.phone || 'No Phone'}</p>
                    <p className="text-slate-400 text-[10px]">Registered on {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>

                  <Button
                    variant={isSuspended ? 'primary' : 'danger'}
                    size="sm"
                    isLoading={updatingId === c.id}
                    onClick={() => handleToggleStatus(c.id, c.status || 'ACTIVE')}
                  >
                    {isSuspended ? 'Reactivate Account' : 'Suspend Customer'}
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
