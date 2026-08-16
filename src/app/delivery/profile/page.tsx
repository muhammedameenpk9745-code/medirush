'use client';

import React from 'react';
import { User, Truck, ShieldCheck, Phone, FileText, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RiderProfilePage() {
  const { user, profile, deliveryPartner } = useAuth();

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Rider Profile & Vehicle Specs</h1>
        <p className="text-xs text-slate-500">Your registered delivery partner credentials and vehicle details</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
        
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl">
            <User className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
              <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{deliveryPartner?.verification_status || 'PENDING'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{profile?.phone || user?.email}</p>
          </div>
        </div>

        {/* Vehicle & License Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-brand-600" />
              <span>Vehicle Type & Registration</span>
            </p>
            <p className="font-bold text-slate-900 text-sm">{deliveryPartner?.vehicle_type || '2-Wheeler'}</p>
            <p className="font-mono text-slate-600 font-bold">{deliveryPartner?.vehicle_number || 'N/A'}</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
            <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              <span>Driving License Number</span>
            </p>
            <p className="font-mono font-bold text-slate-900 text-sm">{deliveryPartner?.license_number || 'N/A'}</p>
            <p className="text-slate-500">Verified by MediRush Admin</p>
          </div>

        </div>

      </div>

    </div>
  );
}
