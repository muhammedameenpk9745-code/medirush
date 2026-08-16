'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, CheckCircle2, AlertCircle, Save, Plus, X, Globe, Compass, ShieldCheck, RefreshCw, Layers, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { InteractiveMap } from '@/components/location/InteractiveMap';
import { CoverageType } from '@/lib/delivery/coverage';

export interface DeliveryCoverageCardProps {
  store: {
    id: string;
    store_name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

const COVERAGE_OPTIONS: Array<{ type: CoverageType; label: string; desc: string }> = [
  { type: 'RADIUS', label: 'Radius Delivery', desc: 'Deliver within a specific kilometer radius from store coordinates' },
  { type: 'LOCAL_AREA', label: 'Selected Local Areas', desc: 'Deliver to specific villages, towns, or post office areas' },
  { type: 'PIN_CODE', label: 'Selected PIN Codes', desc: 'Deliver only to specific 6-digit Indian PIN codes' },
  { type: 'DISTRICT', label: 'Selected Districts', desc: 'Deliver to specific districts (e.g. Malappuram, Kozhikode)' },
  { type: 'STATE', label: 'Selected States', desc: 'Deliver to specific states (e.g. Kerala, Tamil Nadu)' },
  { type: 'COUNTRY', label: 'Selected Countries', desc: 'Deliver to specific countries (e.g. India, UAE)' },
  { type: 'INDIA_WIDE', label: 'Anywhere in India', desc: 'Deliver to all valid Indian delivery addresses' },
  { type: 'WORLDWIDE', label: 'Worldwide Delivery', desc: 'Deliver internationally across the globe' },
];

const RADIUS_PRESETS = [1, 2, 5, 10, 15, 25, 50];

export const DeliveryCoverageCard: React.FC<DeliveryCoverageCardProps> = ({ store }) => {
  const supabase = createClient();

  const [coverageType, setCoverageType] = useState<CoverageType>('RADIUS');
  const [matchMode, setMatchMode] = useState<'ANY_MATCH' | 'ALL_MATCH'>('ANY_MATCH');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [customRadiusInput, setCustomRadiusInput] = useState<string>('5');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Area Tags
  const [areasList, setAreasList] = useState<Array<{ id?: string; type: string; value: string }>>([]);
  const [newAreaValue, setNewAreaValue] = useState<string>('');
  const [bulkPinInput, setBulkPinInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Store coordinates fallback (default Malappuram 11.0428, 76.0807 if null)
  const storeLat = store.latitude || 11.0428;
  const storeLng = store.longitude || 76.0807;

  // Fetch Delivery Settings & Areas
  const fetchCoverageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: setting } = await supabase
        .from('seller_delivery_settings')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (setting) {
        setCoverageType(setting.coverage_type as CoverageType);
        setMatchMode(setting.match_mode || 'ANY_MATCH');
        setRadiusKm(setting.radius_km || 5);
        setCustomRadiusInput(String(setting.radius_km || 5));
        setIsActive(setting.is_active ?? true);
      }

      const { data: areas } = await supabase
        .from('seller_delivery_areas')
        .select('*')
        .eq('store_id', store.id);

      if (areas) {
        setAreasList(areas.map((a) => ({ id: a.id, type: a.area_type, value: a.area_value })));
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoading(false);
    }
  }, [store.id, supabase]);

  useEffect(() => {
    fetchCoverageData();
  }, [fetchCoverageData]);

  // Add Area Tag
  const handleAddAreaTag = (val: string, areaType: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (areasList.some((a) => a.type === areaType && a.value.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    setAreasList((prev) => [...prev, { type: areaType, value: trimmed }]);
    setNewAreaValue('');
  };

  // Remove Area Tag
  const handleRemoveAreaTag = (index: number) => {
    setAreasList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Handle Bulk PIN Entry
  const handleAddBulkPins = () => {
    if (!bulkPinInput.trim()) return;
    const pins = bulkPinInput
      .split(/[\s,]+/)
      .map((p) => p.replace(/\D/g, '').slice(0, 6))
      .filter((p) => p.length === 6);

    pins.forEach((pin) => {
      if (!areasList.some((a) => a.type === 'PIN_CODE' && a.value === pin)) {
        setAreasList((prev) => [...prev, { type: 'PIN_CODE', value: pin }]);
      }
    });
    setBulkPinInput('');
  };

  // Save Settings to Supabase DB
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Seller session expired.');

      const finalRadius = parseFloat(customRadiusInput) || radiusKm || 5.0;

      // 1. Upsert Settings
      const { error: setErr } = await supabase
        .from('seller_delivery_settings')
        .upsert(
          {
            store_id: store.id,
            seller_id: session.user.id,
            coverage_type: coverageType,
            match_mode: matchMode,
            radius_km: finalRadius,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'store_id' }
        );

      if (setErr) throw setErr;

      // 2. Delete existing areas and insert new ones
      await supabase.from('seller_delivery_areas').delete().eq('store_id', store.id);

      if (areasList.length > 0) {
        const areaInserts = areasList.map((a) => ({
          store_id: store.id,
          seller_id: session.user.id,
          area_type: a.type,
          area_value: a.value,
        }));

        const { error: areaErr } = await supabase
          .from('seller_delivery_areas')
          .insert(areaInserts);

        if (areaErr) throw areaErr;
      }

      setStatusMessage({ type: 'success', text: 'Delivery coverage settings updated successfully!' });
      await fetchCoverageData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save delivery coverage.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E2EAE6] rounded-3xl p-8 text-center text-xs font-bold text-slate-500">
        <RefreshCw className="w-5 h-5 text-[#16B67A] animate-spin mx-auto mb-2" />
        <span>Loading store delivery coverage settings...</span>
      </div>
    );
  }

  const activeTypeInfo = COVERAGE_OPTIONS.find((c) => c.type === coverageType);
  const activeAreas = areasList.filter((a) => {
    if (coverageType === 'LOCAL_AREA') return a.type === 'LOCAL_AREA';
    if (coverageType === 'PIN_CODE') return a.type === 'PIN_CODE';
    if (coverageType === 'DISTRICT') return a.type === 'DISTRICT';
    if (coverageType === 'STATE') return a.type === 'STATE';
    if (coverageType === 'COUNTRY') return a.type === 'COUNTRY';
    return true;
  });

  return (
    <div className="bg-white border border-[#E2EAE6] rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
      
      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-[#E2EAE6] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F8F1] text-[#16B67A] border border-[#16B67A]/30 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B2540]">Delivery Coverage & Service Area</h3>
            <p className="text-xs text-slate-500">Configure where your pharmacy store can deliver orders</p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs font-bold text-[#0B2540]">{isActive ? 'Status: Active' : 'Status: Disabled'}</span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-5 h-5 rounded text-[#16B67A] focus:ring-[#16B67A] cursor-pointer"
          />
        </label>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 font-bold ${
          statusMessage.type === 'success' ? 'bg-[#E8F8F1] text-[#0F8F68] border border-[#16B67A]/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16B67A]" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Verified Store Location Card */}
      <div className="p-4 bg-[#F7FAF9] border border-[#E2EAE6] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-[#16B67A] shrink-0" />
          <div>
            <span className="font-extrabold text-[#0B2540] block">{store.store_name} (Store Hub)</span>
            <span className="text-slate-500">{store.address}, {store.city}, {store.state} — {store.pincode}</span>
          </div>
        </div>
        <span className="text-[10px] bg-white px-2.5 py-1 rounded-lg border border-[#E2EAE6] font-mono font-bold text-slate-600 shrink-0">
          GPS: {storeLat.toFixed(4)}° N, {storeLng.toFixed(4)}° E
        </span>
      </div>

      {/* 1. SELECT COVERAGE TYPE */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-[#0B2540] block">
          Where do you deliver?
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COVERAGE_OPTIONS.map((opt) => {
            const isSelected = coverageType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => setCoverageType(opt.type)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#E8F8F1] border-[#16B67A] ring-1 ring-[#16B67A] shadow-2xs'
                    : 'bg-white border-[#E2EAE6] hover:bg-[#F7FAF9]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-extrabold ${isSelected ? 'text-[#0F8F68]' : 'text-[#0B2540]'}`}>
                    {opt.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#16B67A]" />}
                </div>
                <span className="text-[11px] text-slate-500 font-medium leading-tight">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTEXTUAL CONFIGURATION DEPENDING ON COVERAGE TYPE */}

      {/* A. RADIUS DELIVERY CONFIGURATION */}
      {coverageType === 'RADIUS' && (
        <div className="space-y-4 pt-2">
          <div className="bg-[#E8F8F1]/40 border border-[#16B67A]/30 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0B2540]">Set Maximum Delivery Radius (KM):</label>
              <span className="bg-[#16B67A] text-white font-extrabold text-xs px-3 py-1 rounded-xl">
                {customRadiusInput} KM
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Presets:</span>
              {RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setRadiusKm(preset);
                    setCustomRadiusInput(String(preset));
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    parseFloat(customRadiusInput) === preset
                      ? 'bg-[#16B67A] text-white'
                      : 'bg-white border border-[#E2EAE6] text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {preset} KM
                </button>
              ))}
            </div>

            {/* Custom Input & Slider */}
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={customRadiusInput}
                onChange={(e) => {
                  setCustomRadiusInput(e.target.value);
                  setRadiusKm(parseFloat(e.target.value) || 5);
                }}
                className="grow accent-[#16B67A] cursor-pointer"
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={0.5}
                  max={500}
                  step={0.5}
                  value={customRadiusInput}
                  onChange={(e) => setCustomRadiusInput(e.target.value)}
                  className="w-20 px-2.5 py-1.5 bg-white border border-[#E2EAE6] rounded-xl text-xs font-bold text-[#0B2540] text-center"
                />
                <span className="text-xs font-bold text-slate-500">KM</span>
              </div>
            </div>

            <p className="text-xs text-[#0F8F68] font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#16B67A]" />
              <span>Customers located within {customRadiusInput} km of store coordinates can order</span>
            </p>
          </div>

          {/* Map Visualizer with Dynamic Radius Circle Overlay */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#0B2540]">
              <span>Delivery Radius Visualizer</span>
              <span className="text-[10px] text-slate-400">Centered at Store GPS</span>
            </div>

            <InteractiveMap
              lat={storeLat}
              lng={storeLng}
              radiusKm={parseFloat(customRadiusInput) || radiusKm}
              popupText={`${store.store_name} • ${customRadiusInput} KM Radius`}
            />
          </div>
        </div>
      )}

      {/* B. GRANULAR AREA / PIN CODE / DISTRICT / STATE / COUNTRY CONFIGURATION */}
      {(coverageType === 'LOCAL_AREA' ||
        coverageType === 'PIN_CODE' ||
        coverageType === 'DISTRICT' ||
        coverageType === 'STATE' ||
        coverageType === 'COUNTRY') && (
        <div className="space-y-4 pt-2">
          <div className="bg-[#F7FAF9] border border-[#E2EAE6] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0B2540]">
                Configure Allowed {activeTypeInfo?.label}:
              </label>
              <span className="text-[10px] bg-[#E8F8F1] text-[#0F8F68] px-2.5 py-1 rounded-lg border border-[#16B67A]/30 font-bold">
                {activeAreas.length} Configured
              </span>
            </div>

            {/* Input Row */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={
                  coverageType === 'PIN_CODE'
                    ? 'Enter 6-digit Indian PIN Code (e.g. 679338)'
                    : coverageType === 'LOCAL_AREA'
                    ? 'Enter area name (e.g. Kondotty, Pulikkal)'
                    : coverageType === 'DISTRICT'
                    ? 'Enter district name (e.g. Malappuram)'
                    : coverageType === 'STATE'
                    ? 'Enter state name (e.g. Kerala)'
                    : 'Enter country name (e.g. India)'
                }
                value={newAreaValue}
                onChange={(e) => setNewAreaValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAreaTag(newAreaValue, coverageType);
                  }
                }}
                className="grow px-3.5 py-2.5 bg-white border border-[#E2EAE6] focus:border-[#16B67A] rounded-xl text-xs font-semibold text-[#0B2540] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddAreaTag(newAreaValue, coverageType)}
                className="bg-[#16B67A] hover:bg-[#0F8F68] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Bulk Entry for PIN Codes */}
            {coverageType === 'PIN_CODE' && (
              <div className="pt-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">Bulk PIN Entry (Comma or space separated):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 673001, 673002, 673003, 679338"
                    value={bulkPinInput}
                    onChange={(e) => setBulkPinInput(e.target.value)}
                    className="grow px-3.5 py-2 bg-white border border-[#E2EAE6] rounded-xl text-xs font-mono text-[#0B2540] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBulkPins}
                    className="bg-[#0B2540] hover:bg-[#0B2540]/90 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer shrink-0"
                  >
                    Add Bulk PINs
                  </button>
                </div>
              </div>
            )}

            {/* Active Tags List */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-500">Configured Allowed Locations:</span>
              {activeAreas.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-dashed border-[#E2EAE6]">
                  No specific locations added yet. Enter a location above and click Add.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {areasList.map((item, idx) => {
                    if (
                      (coverageType === 'LOCAL_AREA' && item.type !== 'LOCAL_AREA') ||
                      (coverageType === 'PIN_CODE' && item.type !== 'PIN_CODE') ||
                      (coverageType === 'DISTRICT' && item.type !== 'DISTRICT') ||
                      (coverageType === 'STATE' && item.type !== 'STATE') ||
                      (coverageType === 'COUNTRY' && item.type !== 'COUNTRY')
                    ) {
                      return null;
                    }

                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#16B67A]/40 text-[#0F8F68] font-bold text-xs rounded-xl shadow-2xs"
                      >
                        <span>{item.value}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAreaTag(idx)}
                          className="hover:bg-rose-100 text-rose-500 p-0.5 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* C. INDIA-WIDE & WORLDWIDE INFORMATION */}
      {(coverageType === 'INDIA_WIDE' || coverageType === 'WORLDWIDE') && (
        <div className="p-4 bg-[#E8F8F1] border border-[#16B67A]/30 rounded-2xl text-xs text-[#0F8F68] font-bold flex items-center gap-3">
          <Globe className="w-5 h-5 text-[#16B67A] shrink-0" />
          <div>
            <p className="font-extrabold">{coverageType === 'INDIA_WIDE' ? 'Deliver Anywhere in India' : 'Worldwide Delivery'}</p>
            <p className="font-medium text-[11px] text-slate-600">
              {coverageType === 'INDIA_WIDE'
                ? 'Your store products will be available for delivery to all valid customer addresses across India.'
                : 'Your store products will be available for international delivery worldwide.'}
            </p>
          </div>
        </div>
      )}

      {/* SAVE BUTTON */}
      <div className="pt-2 border-t border-[#E2EAE6] flex justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-[#16B67A] hover:bg-[#0F8F68] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-soft-sm hover:shadow-card-hover flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Delivery Coverage Settings</span>
        </button>
      </div>

    </div>
  );
};
