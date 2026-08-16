'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface MapProviderProps {
  latitude?: number | null;
  longitude?: number | null;
  pickupAddress?: string;
  deliveryAddress?: string;
  riderName?: string;
  className?: string;
}

export const MapProvider: React.FC<MapProviderProps> = ({
  latitude,
  longitude,
  pickupAddress,
  deliveryAddress,
  riderName,
  className = '',
}) => {
  const mapKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between ${className}`}>
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 z-10">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-brand-400 animate-pulse" />
          <span className="font-bold text-sm text-white">Live Logistics Map</span>
        </div>

        {latitude && longitude && (
          <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            GPS Locked
          </span>
        )}
      </div>

      <div className="py-8 text-center space-y-3 z-10">
        <MapPin className="w-10 h-10 text-brand-400 mx-auto" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-white">
            {riderName ? `${riderName}'s Current Location` : 'Live Delivery Dispatch Route'}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {latitude && longitude
              ? `Coordinates: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`
              : 'Live map will appear when tracking is available.'}
          </p>
        </div>
      </div>

      {(pickupAddress || deliveryAddress) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-3 border-t border-slate-800 z-10">
          {pickupAddress && (
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-slate-500">Pickup: </span>
              <span>{pickupAddress}</span>
            </div>
          )}
          {deliveryAddress && (
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-slate-500">Delivery: </span>
              <span>{deliveryAddress}</span>
            </div>
          )}
        </div>
      )}

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20 pointer-events-none" />
    </div>
  );
};
