'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Store, User, Mail, Phone, MapPin, FileCheck, Lock, ArrowRight, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { lookupPincode } from '@/lib/pincode';

export default function SellerRegisterPage() {
  const router = useRouter();
  const { signUpSeller } = useAuth();

  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    setPincodeError(null);

    if (clean.length === 6) {
      setIsCheckingPincode(true);
      const res = await lookupPincode(clean);
      setIsCheckingPincode(false);

      if (res.valid) {
        setCity(res.district || '');
        setState(res.state || '');
        setPincodeError(null);
      } else {
        setPincodeError(res.message || 'Invalid or unavailable PIN code');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Validation
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !/^[6-9]/.test(phoneClean)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      setIsLoading(false);
      return;
    }

    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setErrorMessage('Please enter a valid 6-digit Indian pincode.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: ownerName,
          storeName,
          email,
          phone: phoneClean,
          address,
          city,
          state,
          pincode,
          medicalLicenseNumber,
          gstNumber,
          password,
          role: 'SELLER',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(email)}&role=SELLER`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit seller registration.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 py-8">
      <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-soft-lg space-y-6">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>Back</span>
          </button>

          <Link href="/login?role=SELLER" className="text-xs font-bold text-emerald-600 hover:underline">
            Already registered? Seller Login
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block mb-1">
            <Image
              src="/medirush-logo.jpg"
              alt="MediRush Logo"
              width={160}
              height={50}
              className="object-contain h-12 w-auto mx-auto"
              priority
            />
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Pharmacy Onboarding
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Partner Pharmacy Registration</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Join MediRush as a licensed medical store partner to receive local medicine delivery orders
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              1. Owner & Pharmacy Credentials
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registered Owner Name"
                placeholder="Dr. Rajesh Kumar"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />
              <Input
                label="Medical Pharmacy / Store Name"
                placeholder="Apollo Pharmacy — Connaught Place"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                leftIcon={<Store className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Email Address"
                type="email"
                placeholder="pharmacy@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />
              <Input
                label="Contact Mobile Number"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              2. Drug License & Compliance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="State Drug License Number"
                placeholder="DL-DLH-2024-88912"
                value={medicalLicenseNumber}
                onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                leftIcon={<FileCheck className="w-4 h-4 text-slate-400" />}
                required
              />
              <Input
                label="GST Registration Number (Optional)"
                placeholder="07AAAAA0000A1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              3. Store Location Details
            </h3>

            <Input
              label="Street Address / Market Location"
              placeholder="Shop No. 12, Inner Circle, Connaught Place"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              required
            />

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
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              4. Account Security
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Submit Pharmacy Registration for Approval
          </Button>
        </form>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>New seller registrations require Drug License verification by an Administrator before store activation.</span>
        </div>

        <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span>Already have a Pharmacy Seller account? </span>
          <Link href="/login?role=SELLER" className="text-emerald-600 font-bold hover:underline">
            Seller Login
          </Link>
        </div>

      </div>
    </div>
  );
}
