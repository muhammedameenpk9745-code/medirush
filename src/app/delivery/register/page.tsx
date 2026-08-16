'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Truck, User, Mail, Phone, MapPin, Lock, ArrowRight, AlertCircle, ShieldCheck, CreditCard, ArrowLeft } from 'lucide-react';
import { lookupPincode } from '@/lib/pincode';

export default function DeliveryRegisterPage() {
  const router = useRouter();
  const { signUpDeliveryPartner } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [vehicleType, setVehicleType] = useState('Scooter / Motorcycle');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
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
          fullName,
          email,
          phone: phoneClean,
          address,
          city,
          state,
          pincode,
          vehicleType,
          vehicleNumber,
          drivingLicenseNumber: licenseNumber,
          password,
          role: 'DELIVERY_PARTNER',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Delivery partner registration failed. Please check your details.');
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || `/verify-otp?email=${encodeURIComponent(email)}&role=DELIVERY_PARTNER`);
    } catch {
      setErrorMessage('Network connection error. Please try again.');
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

          <Link href="/login?role=DELIVERY_PARTNER" className="text-xs font-bold text-emerald-600 hover:underline">
            Already registered? Rider Login
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
            Rider Onboarding
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Delivery Partner Registration</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Become a MediRush rider partner to deliver fast prescription medicines in your city
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
              1. Personal Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>

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

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              2. Vehicle & Driving License Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-700">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500 min-h-[44px]"
                >
                  <option value="Scooter / Motorcycle">Scooter / Motorcycle</option>
                  <option value="Electric Scooter (EV)">Electric Scooter (EV)</option>
                  <option value="Bicycle">Bicycle</option>
                </select>
              </div>

              <Input
                label="Vehicle Registration No."
                placeholder="DL 01 EX 8840"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                leftIcon={<Truck className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Driving License No."
                placeholder="DL-1420110012345"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                leftIcon={<CreditCard className="w-4 h-4 text-slate-400" />}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              3. Residence Location
            </h3>

            <Input
              label="Street Address"
              placeholder="House No. 45, Lajpat Nagar"
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
              4. Account Password
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
            Submit Delivery Partner Registration
          </Button>
        </form>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Rider applications are reviewed by Administrators before delivery dispatch permissions are enabled.</span>
        </div>

        <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span>Already have a Rider account? </span>
          <Link href="/login?role=DELIVERY_PARTNER" className="text-emerald-600 font-bold hover:underline">
            Rider Login
          </Link>
        </div>

      </div>
    </div>
  );
}
