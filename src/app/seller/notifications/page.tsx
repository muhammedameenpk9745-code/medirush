'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock, ShoppingBag, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function SellerNotificationsPage() {
  const { user, sellerStore } = useAuth();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    await fetchNotifications();
  };

  const handleClearAll = async () => {
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    await fetchNotifications();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Pharmacy Notifications</h1>
          <p className="text-sm text-slate-500">Order alerts, stock warnings, and platform system updates</p>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Bell className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No new notifications</p>
            <p className="text-xs text-slate-500">You&apos;re all caught up! Order alerts and stock warnings will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.is_read ? 'bg-slate-50/50 border-slate-200/80' : 'bg-brand-50/30 border-brand-200 font-semibold'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-slate-900">{n.title || 'Pharmacy Notification'}</p>
                  <p className="text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400 pt-1">
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="p-1.5 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors text-xs font-bold shrink-0 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Read</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
