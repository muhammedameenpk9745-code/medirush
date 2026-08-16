'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, Phone, MapPin, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { lookupPincode } from '@/lib/pincode';

export default function RegisterPage() {
  const router = useRouter();
  const { signUpCustomer } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);

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
          password,
          address,
          city,
          state,
          pincode,
          role: 'CUSTOMER',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Registration successful! Redirecting to email verification...');
      setTimeout(() => {
        router.push(data.redirectTo || `/verify-otp?email=${encodeURIComponent(email)}&role=CUSTOMER`);
      }, 800);
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-soft-lg space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block mb-2">
            <Image
              src="/medirush-logo.jpg"
              alt="MediRush Logo"
              width={160}
              height={50}
              className="object-contain h-12 w-auto mx-auto"
              priority
            />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create MediRush Account</h1>
          <p className="text-xs text-slate-500">Order medicines & track fast deliveries near you</p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Mobile Number (10-Digit Indian)"
            type="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Delivery Street Address"
            type="text"
            placeholder="Flat 402, Green Heights, Connaught Place"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
            required
          />

          {/* PINCODE Validation & Auto-Fill Section */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
                {pincodeError}
              </p>
            )}
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Customer Account
          </Button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span>Already have a MediRush account? </span>
          <Link href="/login" className="text-brand-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>

        <div className="bg-brand-50/70 border border-brand-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-brand-900">
          <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
          <span>Self-registration is restricted to CUSTOMER role.</span>
        </div>

      </div>
    </div>
  );
}
