'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, User, Store, Truck, Shield, ArrowLeft } from 'lucide-react';

const ROLES_CONFIG: {
  id: UserRole;
  label: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  defaultRedirect: string;
  registerLink?: string;
  registerText?: string;
}[] = [
  {
    id: 'CUSTOMER',
    label: 'Customer',
    badge: 'Customer Portal',
    title: 'Sign In to MediRush',
    subtitle: 'Access prescription medicines, order tracking, and local pharmacy delivery.',
    icon: User,
    defaultRedirect: '/',
    registerLink: '/register',
    registerText: 'Create Customer Account',
  },
  {
    id: 'SELLER',
    label: 'Seller',
    badge: 'Pharmacy Partner',
    title: 'Seller Pharmacy Portal',
    subtitle: 'Manage medicine inventory, fulfill customer orders, and update store status.',
    icon: Store,
    defaultRedirect: '/seller',
    registerLink: '/seller/register',
    registerText: 'Register New Pharmacy Store',
  },
  {
    id: 'DELIVERY_PARTNER',
    label: 'Rider',
    badge: 'Delivery Partner',
    title: 'Rider Partner Portal',
    subtitle: 'Accept active delivery jobs, view optimized routes, and track daily earnings.',
    icon: Truck,
    defaultRedirect: '/delivery',
    registerLink: '/delivery/register',
    registerText: 'Register as Delivery Rider',
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    badge: 'Platform Admin',
    title: 'MediRush Control Console',
    subtitle: 'Marketplace oversight, store approval workflows, and commission settings.',
    icon: Shield,
    defaultRedirect: '/admin',
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRedirect = searchParams.get('redirect');
  const queryRole = searchParams.get('role') as UserRole | null;

  const initialRole: UserRole =
    queryRole && ['CUSTOMER', 'SELLER', 'DELIVERY_PARTNER', 'ADMIN'].includes(queryRole)
      ? queryRole
      : 'CUSTOMER';

  const { signIn, authError, clearAuthError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  React.useEffect(() => {
    if (queryRole && ['CUSTOMER', 'SELLER', 'DELIVERY_PARTNER', 'ADMIN'].includes(queryRole)) {
      setSelectedRole(queryRole);
    }
  }, [queryRole]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeConfig = ROLES_CONFIG.find((r) => r.id === selectedRole) || ROLES_CONFIG[0];
  const IconComponent = activeConfig.icon;

  const displayError = errorMessage || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    if (clearAuthError) clearAuthError();

    try {
      const { error, role: userRole, verificationStatus } = await signIn(email, password, selectedRole);

      if (error) {
        setErrorMessage(error.message || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Role-Aware Redirection Strategy
      let targetPath = queryRedirect || activeConfig.defaultRedirect;

      if (userRole === 'SELLER') {
        targetPath = verificationStatus === 'PENDING' ? '/seller/pending' : '/seller';
      } else if (userRole === 'DELIVERY_PARTNER') {
        targetPath = verificationStatus === 'PENDING' ? '/delivery/pending' : '/delivery';
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        targetPath = '/admin';
      }

      // Use window.location.href to perform clean browser navigation and synchronize cookies to server headers
      window.location.href = targetPath;
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected login error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Unified Role Selector Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-4 gap-1 border border-slate-200/80">
        {ROLES_CONFIG.map((roleTab) => {
          const isSelected = selectedRole === roleTab.id;
          const TabIcon = roleTab.icon;
          return (
            <button
              key={roleTab.id}
              type="button"
              onClick={() => {
                setSelectedRole(roleTab.id);
                setErrorMessage(null);
                if (clearAuthError) clearAuthError();
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 ${
                isSelected
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/60 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <TabIcon className={`w-4 h-4 mb-0.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{roleTab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Role Context Subheader */}
      <div className="text-center space-y-1 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300/80">
          <IconComponent className="w-3.5 h-3.5" />
          <span>{activeConfig.badge}</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 pt-1">{activeConfig.title}</h2>
        <p className="text-xs text-slate-500 leading-relaxed">{activeConfig.subtitle}</p>
      </div>

      {/* Error Alert Box */}
      {displayError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-2.5 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-normal font-medium">{displayError}</span>
          </div>
          
          {(displayError.toLowerCase().includes('verify') || displayError.toLowerCase().includes('unverified') || displayError.toLowerCase().includes('confirm')) && (
            <div className="pt-2 flex items-center gap-2">
              <Link
                href={`/verify-otp?email=${encodeURIComponent(email)}&role=${selectedRole}`}
                className="text-[11px] font-bold bg-[#16B67A] text-white hover:bg-[#0F8F68] px-3.5 py-1.5 rounded-xl transition-colors shadow-xs"
              >
                Verify Email Now
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (!email) return;
                  await fetch('/api/auth/resend-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  });
                  setErrorMessage('A new verification code has been sent to your email.');
                }}
                className="text-[11px] font-bold bg-white text-[#16B67A] hover:bg-[#E8F8F1] px-3 py-1.5 rounded-xl border border-[#16B67A]/40 transition-colors"
              >
                Resend OTP
              </button>
            </div>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                if (clearAuthError) clearAuthError();
              }}
              className="text-[11px] font-bold bg-white text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-300 shadow-2xs transition-colors inline-flex items-center gap-1"
            >
              <span>← Dismiss Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <span>Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-emerald-600 hover:underline font-bold">
            Forgot password?
          </Link>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full justify-center shadow-md shadow-emerald-900/10"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In as {activeConfig.label}
        </Button>
      </form>

      {/* Registration Navigation */}
      {!!activeConfig.registerLink && (
        <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span>Need a {activeConfig.label} account? </span>
          <Link href={activeConfig.registerLink || '#'} className="text-emerald-600 font-bold hover:underline">
            {activeConfig.registerText}
          </Link>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-soft-lg space-y-6">
        
        {/* Top Navigation / Back Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
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

          <Link href="/" className="text-xs font-bold text-emerald-600 hover:underline">
            Home
          </Link>
        </div>

        {/* Brand Header */}
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
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
            MEDICINE. FAST. RELIABLE.
          </p>
        </div>

        <Suspense fallback={<div className="text-xs text-center py-6 text-slate-500">Loading sign in form...</div>}>
          <LoginForm />
        </Suspense>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Encrypted Supabase Auth session & role-based route security enabled.</span>
        </div>

      </div>
    </div>
  );
}
