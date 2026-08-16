'use client';

import React, { useState, useCallback } from 'react';
import { MapPin, Navigation, Check, AlertCircle, RefreshCw, Building2, Search, CheckCircle2 } from 'lucide-react';
import { lookupPincode, PincodeDetails, PostOfficeInfo } from '@/lib/pincode';
import { InteractiveMap } from './InteractiveMap';

export interface LocationPickerProps {
  initialLocation?: string;
  onClose?: () => void;
  onSelectLocation: (locationStr: string, details?: {
    pincode?: string;
    postOffice?: string;
    district?: string;
    state?: string;
    lat?: number;
    lng?: number;
  }) => void;
}

const POPULAR_ZONES = [
  { label: 'Connaught Place, New Delhi', pin: '110001' },
  { label: 'Indiranagar, Bengaluru', pin: '560038' },
  { label: 'Bandra West, Mumbai', pin: '400050' },
  { label: 'Gachibowli, Hyderabad', pin: '500032' },
  { label: 'Park Street, Kolkata', pin: '700016' },
  { label: 'Malappuram, Kerala', pin: '679338' },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onClose,
  onSelectLocation,
}) => {
  const [pincodeInput, setPincodeInput] = useState('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeDetails, setPincodeDetails] = useState<PincodeDetails | null>(null);
  const [selectedPostOffice, setSelectedPostOffice] = useState<PostOfficeInfo | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Map & Coordinates State (null initially until geocoded or GPS detected)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocodingMap, setIsGeocodingMap] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // GPS State
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [resolvedLocationTag, setResolvedLocationTag] = useState<string | null>(null);

  // Forward Geocode helper function
  const geocodeLocation = useCallback(async (
    postOfficeName?: string,
    dist?: string,
    st?: string,
    pin?: string
  ) => {
    setIsGeocodingMap(true);
    setGeocodingError(null);

    try {
      const params = new URLSearchParams();
      if (postOfficeName) params.append('postOffice', postOfficeName);
      if (dist) params.append('district', dist);
      if (st) params.append('state', st);
      if (pin) params.append('pincode', pin);

      const res = await fetch(`/api/location/geocode?${params.toString()}`);
      const data = await res.json();

      setIsGeocodingMap(false);

      if (data.valid && typeof data.lat === 'number' && typeof data.lng === 'number') {
        setCoords({ lat: data.lat, lng: data.lng });
      } else {
        setGeocodingError('Unable to locate this PIN on the map. Please select another location or try again.');
      }
    } catch {
      setIsGeocodingMap(false);
      setGeocodingError('Unable to locate this PIN on the map. Please select another location or try again.');
    }
  }, []);

  // Handle 6-digit Indian PIN Code Lookup
  const handlePincodeSubmit = useCallback(async (pinToSearch: string) => {
    const cleanPin = pinToSearch.replace(/\D/g, '').slice(0, 6);
    setPincodeInput(cleanPin);

    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setPincodeError('Please enter a valid 6-digit Indian numeric PIN code.');
      setPincodeDetails(null);
      setResolvedLocationTag(null);
      setCoords(null);
      return;
    }

    setIsCheckingPincode(true);
    setPincodeError(null);
    setGpsError(null);
    setGeocodingError(null);

    try {
      const res = await lookupPincode(cleanPin);
      setIsCheckingPincode(false);

      if (res.valid && res.district && res.state) {
        setPincodeDetails(res);
        
        // Auto-select primary post office
        const poList = res.postOffices || [];
        const primary = poList[0] || { name: res.primaryPostOffice || 'Post Office', branchType: 'Sub Office', deliveryStatus: 'Delivery' };
        setSelectedPostOffice(primary);

        const newTag = `${primary.name}, ${res.district}, ${res.state} — ${cleanPin}`;
        setResolvedLocationTag(newTag);

        // Perform real forward geocoding to position map at real Kerala/local coordinates
        geocodeLocation(primary.name, res.district, res.state, cleanPin);
      } else {
        setPincodeDetails(null);
        setSelectedPostOffice(null);
        setResolvedLocationTag(null);
        setCoords(null);
        setPincodeError("We couldn't find this PIN code. Please check and try again.");
      }
    } catch {
      setIsCheckingPincode(false);
      setPincodeDetails(null);
      setResolvedLocationTag(null);
      setCoords(null);
      setPincodeError("We couldn't find this PIN code. Please check and try again.");
    }
  }, [geocodeLocation]);

  // Handle Post Office selection & update map
  const handleSelectPostOffice = (po: PostOfficeInfo) => {
    if (!pincodeDetails) return;
    setSelectedPostOffice(po);
    const newTag = `${po.name}, ${pincodeDetails.district}, ${pincodeDetails.state} — ${pincodeDetails.pincode}`;
    setResolvedLocationTag(newTag);

    // Update map to selected post office coordinates
    geocodeLocation(po.name, pincodeDetails.district, pincodeDetails.state, pincodeDetails.pincode);
  };

  // Handle Native Browser GPS Location Detection + Reverse Geocoding
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Unable to detect your location. Please enter your PIN code instead.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);
    setPincodeError(null);
    setGeocodingError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoords(newCoords);

        try {
          const res = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();

          setIsDetectingGps(false);

          if (data.valid && data.locationTag) {
            setResolvedLocationTag(data.locationTag);
            if (data.pincode && data.pincode.length === 6) {
              setPincodeInput(data.pincode);
            }
          } else {
            const fallbackTag = `GPS Location (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`;
            setResolvedLocationTag(fallbackTag);
          }
        } catch {
          setIsDetectingGps(false);
          const fallbackTag = `GPS Location (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`;
          setResolvedLocationTag(fallbackTag);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        setGpsError('Unable to detect your location. Please enter your PIN code instead.');
      },
      options
    );
  };

  const handleConfirmLocation = () => {
    if (!resolvedLocationTag) return;
    
    onSelectLocation(resolvedLocationTag, {
      pincode: pincodeDetails?.pincode || pincodeInput,
      postOffice: selectedPostOffice?.name,
      district: pincodeDetails?.district,
      state: pincodeDetails?.state,
      lat: coords?.lat,
      lng: coords?.lng,
    });
  };

  return (
    <div className="relative pb-16 space-y-5">
      
      {/* 1. Browser GPS Button */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={isDetectingGps}
        className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#16B67A]/40 bg-[#E8F8F1] hover:bg-[#E8F8F1]/80 text-[#0F8F68] font-bold text-xs transition-all shadow-xs disabled:opacity-60 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          {isDetectingGps ? (
            <RefreshCw className="w-4 h-4 text-[#16B67A] animate-spin shrink-0" />
          ) : (
            <Navigation className="w-4 h-4 text-[#16B67A] shrink-0" />
          )}
          <span>{isDetectingGps ? 'Detecting your location...' : 'Use Current Location (GPS)'}</span>
        </div>
        <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-[#16B67A]/40 font-mono shrink-0">
          Auto GPS
        </span>
      </button>

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Separator */}
      <div className="relative flex items-center">
        <div className="grow border-t border-[#E2EAE6]" />
        <span className="shrink-0 px-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
          Or Enter 6-Digit Indian PIN Code
        </span>
        <div className="grow border-t border-[#E2EAE6]" />
      </div>

      {/* 2. PIN Code Input Box & Check Button */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative grow">
            <MapPin className="w-4 h-4 text-[#16B67A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit PIN Code (e.g. 679338)"
              value={pincodeInput}
              disabled={isCheckingPincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPincodeInput(val);
                setPincodeError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pincodeInput.length === 6 && !isCheckingPincode) {
                  e.preventDefault();
                  handlePincodeSubmit(pincodeInput);
                }
              }}
              className="w-full pl-10 pr-4 py-3 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-bold text-[#0B2540] placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => handlePincodeSubmit(pincodeInput)}
            disabled={isCheckingPincode || pincodeInput.length !== 6}
            className="bg-[#16B67A] hover:bg-[#0F8F68] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isCheckingPincode ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Check</span>
              </>
            )}
          </button>
        </div>

        {/* Loading Indicator Text */}
        {isCheckingPincode && (
          <p className="text-[11px] text-[#16B67A] font-bold flex items-center gap-1 pl-1">
            <RefreshCw className="w-3 h-3 animate-spin text-[#16B67A]" />
            <span>Checking PIN code with India Post registry...</span>
          </p>
        )}

        {/* PIN Code Error */}
        {pincodeError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{pincodeError}</span>
          </div>
        )}
      </div>

      {/* 3. Popular Delivery Zones */}
      {!pincodeDetails && !resolvedLocationTag && (
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Popular Delivery Zones
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {POPULAR_ZONES.map((zone) => (
              <button
                key={zone.pin}
                type="button"
                onClick={() => handlePincodeSubmit(zone.pin)}
                className="flex items-center justify-between p-2.5 bg-white border border-[#E2EAE6] hover:border-[#16B67A] rounded-xl text-left text-xs font-semibold text-[#0B2540] hover:bg-[#E8F8F1]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#16B67A] shrink-0" />
                  <span className="truncate">{zone.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                  {zone.pin}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Fetched Real Location & Post Office Selection Card */}
      {pincodeDetails && pincodeDetails.valid && (
        <div className="bg-[#E8F8F1]/40 border border-[#16B67A]/30 rounded-2xl p-4 space-y-3 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16B67A]" />
              <span className="text-xs font-black text-[#0B2540]">
                Location Found ✓
              </span>
            </div>
            <span className="bg-[#16B67A] text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
              PIN: {pincodeDetails.pincode}
            </span>
          </div>

          <div className="text-xs space-y-1 text-[#0B2540] border-t border-[#16B67A]/20 pt-2 font-medium">
            <div><strong>Area / Post Office:</strong> {selectedPostOffice?.name || pincodeDetails.primaryPostOffice}</div>
            <div><strong>District:</strong> {pincodeDetails.district}</div>
            <div><strong>State:</strong> {pincodeDetails.state}</div>
          </div>

          {/* Multiple Post Offices Selector */}
          {pincodeDetails.postOffices && pincodeDetails.postOffices.length > 0 && (
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-[#0B2540] mb-1.5">
                Select your area / post office ({pincodeDetails.postOffices.length} available):
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {pincodeDetails.postOffices.map((po) => {
                  const isSelected = selectedPostOffice?.name === po.name;
                  return (
                    <button
                      key={po.name}
                      type="button"
                      onClick={() => handleSelectPostOffice(po)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#16B67A] bg-white text-[#0F8F68] font-bold shadow-2xs'
                          : 'border-[#E2EAE6] bg-white/60 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-[#16B67A]' : 'text-slate-400'}`} />
                        <span>{po.name} <span className="text-[10px] text-slate-400 font-normal">({po.branchType})</span></span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#16B67A]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Geocoding Status / Error */}
      {isGeocodingMap && (
        <p className="text-xs text-[#16B67A] font-bold flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Locating coordinates on OpenStreetMap...</span>
        </p>
      )}

      {geocodingError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{geocodingError}</span>
        </div>
      )}

      {/* 6. Interactive OpenStreetMap + Leaflet Map */}
      {coords && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#0B2540]">
            <span>Interactive OpenStreetMap</span>
            <span className="text-[10px] text-slate-400 font-normal font-mono">
              {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
            </span>
          </div>

          <InteractiveMap
            lat={coords.lat}
            lng={coords.lng}
            popupText={resolvedLocationTag || 'Selected Delivery Location'}
          />
        </div>
      )}

      {/* 7. Confirmed Location Summary */}
      {resolvedLocationTag && (
        <div className="p-3 bg-[#F7FAF9] border border-[#E2EAE6] rounded-2xl text-xs space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Selected Delivery Location</span>
          <span className="font-bold text-[#0B2540] block">{resolvedLocationTag}</span>
        </div>
      )}

      {/* 8. STICKY BOTTOM ACTION FOOTER */}
      <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-3.5 sm:p-4 bg-white/95 backdrop-blur-md border-t border-[#E2EAE6] flex items-center justify-between gap-3 z-30 shadow-lg">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all shrink-0 cursor-pointer"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleConfirmLocation}
          disabled={!resolvedLocationTag}
          className="grow bg-[#16B67A] hover:bg-[#0F8F68] text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-soft-sm hover:shadow-card-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          <span>Use This Location</span>
        </button>
      </div>

    </div>
  );
};
