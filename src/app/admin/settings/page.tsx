'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getPlatformSettings, PlatformSettings } from '@/lib/constants/settings';
import { createAuditLog } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const data = await getPlatformSettings();
    setSettings(data);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setSuccessMsg(null);

    const updates = [
      { key: 'delivery_fee', value: settings.deliveryFee },
      { key: 'free_delivery_threshold', value: settings.freeDeliveryThreshold },
      { key: 'platform_commission_percent', value: settings.platformCommissionPercent },
      { key: 'min_order_amount', value: settings.minOrderAmount },
      { key: 'max_order_amount', value: settings.maxOrderAmount },
      { key: 'cod_enabled', value: settings.codEnabled },
      { key: 'online_payment_enabled', value: settings.onlinePaymentEnabled },
      { key: 'marketplace_name', value: settings.marketplaceName },
      { key: 'support_email', value: settings.supportEmail },
      { key: 'support_phone', value: settings.supportPhone },
    ];

    for (const u of updates) {
      await supabase.from('platform_settings').upsert({
        key: u.key,
        value: JSON.stringify(u.value),
        updated_at: new Date().toISOString(),
      });
    }

    await createAuditLog('SETTINGS_UPDATE', 'SYSTEM', 'GLOBAL_SETTINGS');
    setSuccessMsg('Platform settings updated successfully!');
    setIsSaving(false);
  };

  if (!settings) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading platform settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Central Platform Settings</h1>
        <p className="text-xs text-slate-500">Configure delivery fees, free threshold, platform commission, and payment method switches</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6 text-xs">
        
        {/* Marketplace Info */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h3 className="font-bold text-slate-900 text-sm">Marketplace Identity & Support</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Marketplace Name" value={settings.marketplaceName} onChange={(e) => setSettings({ ...settings, marketplaceName: e.target.value })} required />
            <Input label="Support Email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} required />
            <Input label="Support Phone" value={settings.supportPhone} onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })} required />
          </div>
        </div>

        {/* Financial & Delivery Config */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h3 className="font-bold text-slate-900 text-sm">Financial & Delivery Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Default Delivery Fee (₹)" type="number" value={settings.deliveryFee} onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })} required />
            <Input label="Free Delivery Threshold (₹)" type="number" value={settings.freeDeliveryThreshold} onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })} required />
            <Input label="Platform Commission (%)" type="number" value={settings.platformCommissionPercent} onChange={(e) => setSettings({ ...settings, platformCommissionPercent: Number(e.target.value) })} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input label="Min Order Value (₹)" type="number" value={settings.minOrderAmount} onChange={(e) => setSettings({ ...settings, minOrderAmount: Number(e.target.value) })} required />
            <Input label="Max Order Value (₹)" type="number" value={settings.maxOrderAmount} onChange={(e) => setSettings({ ...settings, maxOrderAmount: Number(e.target.value) })} required />
          </div>
        </div>

        {/* Payment Switches */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Payment Method Switches</h3>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={settings.codEnabled}
                onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span>Cash / UPI on Delivery (COD) Enabled</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={settings.onlinePaymentEnabled}
                onChange={(e) => setSettings({ ...settings, onlinePaymentEnabled: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span>Online Payment Gateway Enabled</span>
            </label>
          </div>
        </div>

        <Button variant="primary" size="lg" isLoading={isSaving} type="submit" leftIcon={<Save className="w-4 h-4" />}>
          Save Platform Settings
        </Button>
      </form>

    </div>
  );
}
