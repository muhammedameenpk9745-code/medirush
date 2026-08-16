'use client';

import React, { useState, useEffect } from 'react';
import { Store, User, Mail, Phone, MapPin, FileCheck, Clock, Truck, ShieldCheck, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { DeliveryCoverageCard } from '@/components/seller/DeliveryCoverageCard';

export default function PharmacyStorePage() {
  const { user, profile, sellerStore } = useAuth();
  const supabase = createClient();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [minOrderAmount, setMinOrderAmount] = useState('100');
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [isOpen, setIsOpen] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sellerStore) {
      setStoreName(sellerStore.store_name || '');
      setOwnerName(profile?.full_name || '');
      setPhone(sellerStore.phone || profile?.phone || '');
      setEmail(sellerStore.email || profile?.email || '');
      setAddress(sellerStore.address || '');
      setCity(sellerStore.city || '');
      setState(sellerStore.state || '');
      setPincode(sellerStore.pincode || '');
      setMedicalLicenseNumber(sellerStore.medical_license_number || '');
      setGstNumber(sellerStore.gst_number || '');
      if (sellerStore.opening_time) setOpeningTime(sellerStore.opening_time);
      if (sellerStore.closing_time) setClosingTime(sellerStore.closing_time);
      if (sellerStore.min_order_amount) setMinOrderAmount(String(sellerStore.min_order_amount));
      if (sellerStore.delivery_fee) setDeliveryFee(String(sellerStore.delivery_fee));
      if (sellerStore.store_status) setIsOpen(sellerStore.store_status === 'ACTIVE');
    }
  }, [sellerStore, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerStore) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const { error } = await supabase
      .from('medical_stores')
      .update({
        store_name: storeName,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        opening_time: openingTime,
        closing_time: closingTime,
        min_order_amount: Number(minOrderAmount),
        delivery_fee: Number(deliveryFee),
        store_status: isOpen ? 'ACTIVE' : 'INACTIVE',
      })
      .eq('id', sellerStore.id);

    if (error) {
      setErrorMessage(error.message || 'Failed to update store details.');
    } else {
      setSuccessMessage('Pharmacy store settings updated successfully!');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Pharmacy Store Profile & Timings</h1>
        <p className="text-sm text-slate-500">Manage store address, contact details, operating hours, and local delivery fees</p>
      </div>

      {/* Verification Shield Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-start gap-4 text-xs text-emerald-900">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-emerald-950">Verified Medical Store Partner</p>
          <p className="text-emerald-800 leading-relaxed">
            Your Drug License <strong className="font-mono text-emerald-900">{medicalLicenseNumber || 'DL-VERIFIED'}</strong> is registered and verified. Role changes & license modifications require official Compliance Admin approval.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            1. Pharmacy Branding & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Pharmacy Store Name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              leftIcon={<Store className="w-4 h-4 text-slate-400" />}
              required
            />
            <Input
              label="Owner Full Name (Read-Only)"
              value={ownerName}
              disabled
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Pharmacy Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />
            <Input
              label="Contact Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            2. License & Legal Credentials (Immutable)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Drug License Number"
              value={medicalLicenseNumber}
              disabled
              leftIcon={<FileCheck className="w-4 h-4 text-slate-400" />}
            />
            <Input
              label="GST Registration Number"
              value={gstNumber || 'Not Provided'}
              disabled
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            3. Store Location & Delivery Fees
          </h3>

          <Input
            label="Street Address / Market Location"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
            <Input label="State" value={state} onChange={(e) => setState(e.target.value)} required />
            <Input label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Order Amount (₹)"
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              required
            />
            <Input
              label="Local Delivery Fee (₹)"
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            4. Operating Hours & Live Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Opening Time"
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
              required
            />
            <Input
              label="Closing Time"
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
              required
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800">Store Currently Open for Online Orders</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deliveryAvailable}
                onChange={(e) => setDeliveryAvailable(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800">Enable Local Delivery Dispatch</span>
            </label>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Pharmacy Settings
        </Button>
      </form>

      {/* 5. DELIVERY COVERAGE & SERVICE AREA MANAGEMENT */}
      {sellerStore && (
        <DeliveryCoverageCard store={sellerStore} />
      )}
    </div>
  );
}
