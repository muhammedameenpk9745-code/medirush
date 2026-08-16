'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Clock, ShieldCheck, Truck, CreditCard, Home } from 'lucide-react';

export default function DeliveryPendingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-8 shadow-soft-lg text-center space-y-6">
        
        {/* Logo */}
        <Link href="/" className="inline-block">
          <Image
            src="/medirush-logo.jpg"
            alt="MediRush Logo"
            width={160}
            height={50}
            className="object-contain h-12 w-auto mx-auto"
            priority
          />
        </Link>

        {/* Status Icon */}
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl border border-amber-200 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        {/* Title & Body */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
            Rider Verification Pending
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 pt-2">Rider Application Under Review</h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Thank you for registering as a MediRush delivery partner! Our operations team is currently reviewing your Driving License and Vehicle credentials.
          </p>
        </div>

        {/* Audit Steps */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <CreditCard className="w-4 h-4 text-brand-600 shrink-0" />
            <span>1. Driving License Verification</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700">
            <Truck className="w-4 h-4 text-brand-600 shrink-0" />
            <span>2. Vehicle Registration Audit</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
            <span>3. Administrator Activation & Rider Portal Access</span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Link href="/">
            <Button variant="outline" size="md" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Return to Customer Homepage
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
