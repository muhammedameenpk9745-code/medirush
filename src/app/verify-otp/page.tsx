'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const roleParam = searchParams.get('role') || 'CUSTOMER';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // 10-Minute Expiration Timer (600 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mask Email (e.g. muhammed***@gmail.com -> m***@gmail.com)
  const maskedEmail = useMemo(() => {
    if (!emailParam || !emailParam.includes('@')) return 'your email';
    const [local, domain] = emailParam.split('@');
    if (local.length <= 2) return `${local.substring(0, 1)}***@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
  }, [emailParam]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format Timer output (09:42)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Input Handlers
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '');
    if (!digit) return;

    const newOtp = [...otp];
    newOtp[index] = digit.substring(digit.length - 1);
    setOtp(newOtp);
    setError(null);

    // Auto-advance
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').trim();
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    setError(null);

    const focusIndex = Math.min(digits.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (timeLeft <= 0) {
      setError('Your verification code has expired. Please request a new code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailParam,
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Verification failed. Please check the code and try again.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Email verified successfully! Redirecting...');

      // Redirect based on backend recommendation or role
      setTimeout(() => {
        const dest = data.redirectTo || (roleParam === 'SELLER' ? '/seller/pending' : roleParam === 'DELIVERY_PARTNER' ? '/delivery/pending' : '/');
        router.push(dest);
      }, 1000);
    } catch {
      setError('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend verification code.');
      } else {
        setSuccessMsg('A new 6-digit verification code has been sent to your email.');
        setOtp(['', '', '', '', '', '']);
        setTimeLeft(600); // Reset timer to 10 mins
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }
    } catch {
      setError('Network error while resending verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Header Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <Image
            src="/logo.png"
            alt="MediRush Logo"
            width={160}
            height={50}
            className="h-12 w-auto mx-auto object-contain"
            priority
          />
        </Link>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-[#E8F8F1] text-[#0F8F68] text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-[#16B67A]/30">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16B67A]" />
          <span>Email Verification</span>
        </div>
      </div>

      {/* Main OTP Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-soft-lg rounded-3xl border border-[#E2EAE6] sm:px-10 text-center space-y-6">
          
          <div>
            <h2 className="text-2xl font-black text-[#0B2540] tracking-tight">
              Verify Your Email
            </h2>
            <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              We&apos;ve sent a 6-digit verification code to:
              <br />
              <span className="font-bold text-[#0B2540] bg-[#F7FAF9] px-2 py-0.5 rounded border border-[#E2EAE6] inline-block mt-1">
                {maskedEmail}
              </span>
            </p>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="bg-[#E8F8F1] border border-[#16B67A]/30 text-[#0F8F68] p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 6 OTP Input Boxes */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-2xl border ${
                    error ? 'border-rose-400 bg-rose-50/50' : digit ? 'border-[#16B67A] bg-[#E8F8F1]/40 text-[#0F8F68]' : 'border-[#E2EAE6] bg-[#F7FAF9] text-[#0B2540]'
                  } focus:outline-none focus:ring-2 focus:ring-[#16B67A] focus:border-transparent transition-all shadow-xs`}
                />
              ))}
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#16B67A]" />
              {timeLeft > 0 ? (
                <span>
                  Code expires in <span className="font-bold font-mono text-[#0B2540]">{formatTime(timeLeft)}</span>
                </span>
              ) : (
                <span className="text-rose-500 font-bold">Your verification code has expired.</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6 || timeLeft <= 0}
              className="w-full bg-[#16B67A] hover:bg-[#0F8F68] text-white font-bold text-sm py-3.5 px-4 rounded-2xl transition-all duration-200 shadow-soft-sm hover:shadow-card-hover flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="pt-2 border-t border-[#E2EAE6] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-bold text-[#16B67A] hover:text-[#0F8F68] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-[#16B67A]" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Resend OTP</span>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#F7FAF9] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-[#16B67A]" />
      </div>
    }>
      <VerifyOtpForm />
    </React.Suspense>
  );
}
