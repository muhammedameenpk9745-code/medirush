'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Phone, MapPin, FileText, Shield, LogOut, Plus, Check, Trash2 } from 'lucide-react';
import { lookupPincode, PostOfficeInfo } from '@/lib/pincode';

interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export default function ProfilePage() {
  const { user, profile, role, signOut } = useAuth();
  const supabase = createClient();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // New Address Form State
  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [postOffices, setPostOffices] = useState<PostOfficeInfo[]>([]);
  const [selectedPostOffice, setSelectedPostOffice] = useState<string>('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    setPincodeError(null);
    setPostOffices([]);
    setSelectedPostOffice('');

    if (clean.length === 6) {
      setIsCheckingPincode(true);
      const res = await lookupPincode(clean);
      setIsCheckingPincode(false);

      if (res.valid) {
        setCity(res.district || '');
        setState(res.state || '');
        if (res.postOffices && res.postOffices.length > 0) {
          setPostOffices(res.postOffices);
          setSelectedPostOffice(res.primaryPostOffice || res.postOffices[0].name);
        }
        setPincodeError(null);
      } else {
        setPincodeError(res.message || 'Invalid or unavailable PIN code');
      }
    }
  };

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', user.id)
      .order('is_default', { ascending: false });

    if (data) {
      setAddresses(data as SavedAddress[]);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (isCheckingPincode || pincodeError) {
      return;
    }

    setIsSubmitting(true);

    const finalAddressLine = selectedPostOffice
      ? `${addressLine1} (${selectedPostOffice} P.O.)`
      : addressLine1;

    const { error } = await supabase.from('addresses').insert({
      profile_id: user.id,
      label,
      full_name: fullName,
      phone,
      address_line_1: finalAddressLine,
      city,
      state,
      pincode,
      is_default: addresses.length === 0,
    });

    if (!error) {
      setIsAddingAddress(false);
      setAddressLine1('');
      setPincode('');
      setPostOffices([]);
      setPincodeError(null);
      await fetchAddresses();
    }
    setIsSubmitting(false);
  };

  const handleDeleteAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    await fetchAddresses();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Account Profile & Delivery Addresses</h1>
          <p className="text-sm text-slate-500">Manage personal details, saved delivery addresses, and prescriptions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Account Details */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xl">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{profile?.full_name || 'MediRush User'}</h3>
                <p className="text-xs text-slate-500">{profile?.email || user?.email}</p>
                <span className="inline-block mt-1 bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-brand-200 uppercase">
                  Role: {role}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Account ID</span>
                <span className="font-mono text-[10px] text-slate-800 truncate max-w-[140px]">{user?.id || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Account Status</span>
                <span className="font-bold text-emerald-600">ACTIVE</span>
              </div>
            </div>

            <Button
              variant="danger"
              size="sm"
              className="w-full justify-start"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={() => signOut()}
            >
              Sign Out Account
            </Button>
          </div>

          {/* Right Column: Address Manager */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Saved Delivery Addresses</h3>
                <p className="text-xs text-slate-500">Manage addresses for fast medicine deliveries</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddingAddress(!isAddingAddress)}
              >
                {isAddingAddress ? 'Cancel' : 'Add New Address'}
              </Button>
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleAddAddress} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Delivery Location</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Address Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home / Office" required />
                  <Input label="Recipient Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>

                <Input label="Street Address / Flat No." value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Flat 402, Green Heights, Connaught Place" required />

                {/* PINCODE Validation & Auto-Fill Section */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-slate-700">6-Digit PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 673001"
                        value={pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-500"
                        required
                      />
                    </div>
                    <Input label="City / District (Auto)" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Auto-detected" required />
                    <Input label="State (Auto)" value={state} onChange={(e) => setState(e.target.value)} placeholder="Auto-detected" required />
                  </div>

                  {isCheckingPincode && (
                    <p className="text-[11px] font-semibold text-brand-600 animate-pulse flex items-center gap-1.5">
                      <span>Checking PIN code with India Post...</span>
                    </p>
                  )}

                  {pincodeError && (
                    <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      {pincodeError}
                    </p>
                  )}

                  {postOffices.length > 0 && (
                    <div className="space-y-1 text-xs pt-1">
                      <label className="font-semibold text-slate-700">Select Post Office Area ({postOffices.length} Available):</label>
                      <select
                        value={selectedPostOffice}
                        onChange={(e) => setSelectedPostOffice(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {postOffices.map((po) => (
                          <option key={po.name} value={po.name}>
                            {po.name} ({po.branchType}) — {po.deliveryStatus}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <Input label="Contact Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required />

                <Button variant="primary" size="md" isLoading={isSubmitting} disabled={isCheckingPincode || Boolean(pincodeError)}>
                  Save Delivery Address
                </Button>
              </form>
            )}

            {/* Saved Addresses List */}
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No saved addresses found. Add an address to speed up checkout.</p>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {addr.label}
                        </span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-md">
                            Default Address
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800">{addr.full_name} • {addr.phone}</p>
                      <p className="text-slate-600">{addr.address_line_1}, {addr.city}, {addr.state} — {addr.pincode}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
