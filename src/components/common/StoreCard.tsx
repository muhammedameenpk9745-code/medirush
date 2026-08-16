'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MedicalStore } from '@/types/store';
import { Star, Clock, MapPin, CheckCircle2, ChevronRight, Store as StoreIcon } from 'lucide-react';

export interface StoreCardProps {
  store: MedicalStore;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white border border-[#E2EAE6] rounded-2xl p-4 shadow-soft-sm hover:shadow-card-hover hover:border-[#16B67A] transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Banner / Store Image */}
        <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3.5 bg-[#F7FAF9] border border-[#E2EAE6] flex items-center justify-center">
          {!imageError && store.imageUrl ? (
            <Image
              src={store.imageUrl}
              alt={store.name}
              fill
              onError={() => setImageError(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
              <StoreIcon className="w-10 h-10 text-[#16B67A]/50" />
              <span className="text-xs font-bold text-[#0B2540]">Verified Local Pharmacy</span>
            </div>
          )}

          <div className="absolute top-2 left-2 flex gap-1 z-10">
            {store.isVerified !== false && (
              <span className="inline-flex items-center gap-1 bg-white/95 text-[#0B2540] text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs border border-[#E2EAE6]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16B67A]" />
                <span>Verified Chemist</span>
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2 z-10">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs ${
              store.isOpen !== false ? 'bg-[#16B67A] text-white' : 'bg-slate-700 text-slate-200'
            }`}>
              {store.isOpen !== false ? 'Open Now' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Store Title & Rating */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/stores/${store.id}`}>
            <h3 className="text-base font-bold text-[#0B2540] group-hover:text-[#16B67A] transition-colors line-clamp-1">
              {store.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 border border-amber-200">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{store.rating || '4.8'}</span>
            {store.totalRatings && (
              <span className="text-amber-600 font-normal">({store.totalRatings})</span>
            )}
          </div>
        </div>

        {/* License */}
        <p className="text-xs text-slate-500 mb-2 font-medium truncate">
          Lic No: {store.drugLicenseNumber || 'DL-MEDIRUSH-VERIFIED'}
        </p>

        {/* Distance & Delivery Estimate */}
        <div className="flex items-center justify-between text-xs text-[#0B2540] bg-[#E8F8F1]/60 p-2.5 rounded-xl mb-3 border border-[#E2EAE6]">
          <div className="flex items-center gap-1 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-[#16B67A]" />
            <span>{store.distanceKm ? `${store.distanceKm} km` : store.address || 'Nearby Local Store'}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-[#0F8F68]">
            <Clock className="w-3.5 h-3.5 text-[#16B67A]" />
            <span>{store.estimatedDeliveryMinutes || 30} mins delivery</span>
          </div>
        </div>
      </div>

      <Link href={`/stores/${store.id}`}>
        <div className="w-full inline-flex items-center justify-between bg-white hover:bg-[#E8F8F1] border border-[#E2EAE6] hover:border-[#16B67A] text-[#0B2540] hover:text-[#0F8F68] font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all duration-200 group-hover:shadow-soft-sm cursor-pointer">
          <span>Explore Medical Store</span>
          <ChevronRight className="w-4 h-4 text-[#16B67A]" />
        </div>
      </Link>
    </div>
  );
};
