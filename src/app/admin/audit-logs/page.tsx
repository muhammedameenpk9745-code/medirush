'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, ShieldCheck, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminAuditLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (data) setLogs(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Append-Only Administrative Audit Logs</h1>
        <p className="text-xs text-slate-500">Immutable trail of administrative changes, approvals, suspensions, and settings modifications</p>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        {isLoading ? (
          <p className="text-center text-xs text-slate-400 py-8">Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No audit events recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs font-mono">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="font-black text-brand-600 font-sans text-sm">{log.action}</span>
                  <p className="text-slate-600 font-sans text-xs">
                    Target Entity: <strong className="font-mono text-slate-800">{log.entity_type}</strong> (ID: {log.entity_id || 'N/A'})
                  </p>
                  <p className="text-slate-400 text-[10px] font-sans">
                    Executed by: {log.profiles?.full_name || 'System Admin'}
                  </p>
                </div>

                <span className="text-[10px] text-slate-400 font-sans">
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
