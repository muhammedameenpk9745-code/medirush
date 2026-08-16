'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MapPin, Navigation, Search, RefreshCw, AlertCircle, Building2, Check, User, Phone, Home, Briefcase, Tag } from 'lucide-react';
import { lookupPincode, PincodeDetails, PostOfficeInfo } from '@/lib/pincode';
import { InteractiveMap } from '@/components/location/InteractiveMap';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSaved: (savedAddress: any) => void;
  addressToEdit?: any | null;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  isOpen,
  onClose,
  onAddressSaved,
  addressToEdit,
}) => {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [houseBuilding, setHouseBuilding] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [instructions, setInstructions] = useState('');

  // Location / PIN State
  const [pincode, setPincode] = useState('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeDetails, setPincodeDetails] = useState<PincodeDetails | null>(null);
  const [selectedPostOffice, setSelectedPostOffice] = useState<PostOfficeInfo | null>(null);
  const [locality, setLocality] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Map & GPS State
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>({ lat: 28.6139, lng: 77.2090 });
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prefill form when addressToEdit changes
  useEffect(() => {
    if (addressToEdit) {
      setLabel((addressToEdit.label as any) || 'Home');
      setFullName(addressToEdit.full_name || '');
      setPhone(addressToEdit.phone || '');
      setHouseBuilding(addressToEdit.address_line_1 || '');
      setStreetArea(addressToEdit.address_line_2 || addressToEdit.street_area || '');
      setLandmark(addressToEdit.landmark || '');
      setInstructions(addressToEdit.instructions || '');
      setPincode(addressToEdit.pincode || '');
      setLocality(addressToEdit.locality || addressToEdit.city || '');
      setDistrict(addressToEdit.district || addressToEdit.city || '');
      setState(addressToEdit.state || '');
      if (addressToEdit.latitude && addressToEdit.longitude) {
        setCoords({ lat: addressToEdit.latitude, lng: addressToEdit.longitude });
      }
    } else {
      setLabel('Home');
      setFullName(profile?.full_name || '');
      setPhone(profile?.phone || '');
      setHouseBuilding('');
      setStreetArea('');
      setLandmark('');
      setInstructions('');
      setPincode('');
      setLocality('');
      setDistrict('');
      setState('');
      setPincodeDetails(null);
      setSelectedPostOffice(null);
      setCoords({ lat: 28.6139, lng: 77.2090 });
    }
  }, [addressToEdit, profile]);

  // Forward Geocode helper function
  const geocodeLocation = useCallback(async (
    poName?: string,
    dist?: string,
    st?: string,
    pin?: string
  ) => {
    try {
      const params = new URLSearchParams();
      if (poName) params.append('postOffice', poName);
      if (dist) params.append('district', dist);
      if (st) params.append('state', st);
      if (pin) params.append('pincode', pin);

      const res = await fetch(`/api/location/geocode?${params.toString()}`);
      const data = await res.json();

      if (data.valid && typeof data.lat === 'number' && typeof data.lng === 'number') {
        setCoords({ lat: data.lat, lng: data.lng });
      }
    } catch {
      // Keep existing coords
    }
  }, []);

  // Handle PIN Code Lookup
  const handlePincodeLookup = useCallback(async (pinToSearch: string) => {
    const cleanPin = pinToSearch.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanPin);

    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setPincodeError('Please enter a valid 6-digit Indian numeric PIN code.');
      setPincodeDetails(null);
      return;
    }

    setIsCheckingPincode(true);
    setPincodeError(null);
    setGpsError(null);

    try {
      const res = await lookupPincode(cleanPin);
      setIsCheckingPincode(false);

      if (res.valid && res.district && res.state) {
        setPincodeDetails(res);
        setDistrict(res.district);
        setState(res.state);
        setLocality(res.district);

        const poList = res.postOffices || [];
        const primary = poList[0] || { name: res.primaryPostOffice || 'Post Office', branchType: 'Sub Office', deliveryStatus: 'Delivery' };
        setSelectedPostOffice(primary);

        // Geocode coordinates
        geocodeLocation(primary.name, res.district, res.state, cleanPin);
      } else {
        setPincodeDetails(null);
        setSelectedPostOffice(null);
        setPincodeError('Please enter a valid Indian PIN code.');
      }
    } catch {
      setIsCheckingPincode(false);
      setPincodeDetails(null);
      setPincodeError('Please enter a valid Indian PIN code.');
    }
  }, [geocodeLocation]);

  // Handle Post Office selection change
  const handlePostOfficeChange = (po: PostOfficeInfo) => {
    setSelectedPostOffice(po);
    if (pincodeDetails) {
      geocodeLocation(po.name, pincodeDetails.district, pincodeDetails.state, pincodeDetails.pincode);
    }
  };

  // Handle Browser GPS Location
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Unable to detect your location. Please enter your PIN code instead.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);
    setPincodeError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();

          setIsDetectingGps(false);

          if (data.valid) {
            if (data.pincode && data.pincode.length === 6) {
              handlePincodeLookup(data.pincode);
            }
            if (data.locality) setLocality(data.locality);
            if (data.district) setDistrict(data.district);
            if (data.state) setState(data.state);
          }
        } catch {
          setIsDetectingGps(false);
        }
      },
      () => {
        setIsDetectingGps(false);
        setGpsError('Unable to detect your location. Please enter your PIN code instead.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Save Address Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSubmitError('You must be logged in to save a delivery address.');
      return;
    }

    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (!fullName.trim() || !phone.trim() || !houseBuilding.trim() || !streetArea.trim()) {
      setSubmitError('Please fill in all required contact and address details.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const addressData = {
      profile_id: user.id,
      label,
      full_name: fullName.trim(),
      phone: phone.trim(),
      address_line_1: houseBuilding.trim(),
      address_line_2: streetArea.trim(),
      landmark: landmark.trim() || null,
      post_office: selectedPostOffice?.name || null,
      locality: locality.trim() || district.trim(),
      city: district.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
      instructions: instructions.trim() || null,
      is_default: true,
    };

    try {
      let savedRecord: any = null;

      if (saveForFuture) {
        if (addressToEdit?.id) {
          const { data, error } = await supabase
            .from('addresses')
            .update(addressData)
            .eq('id', addressToEdit.id)
            .select()
            .single();

          if (error) throw error;
          savedRecord = data;
        } else {
          const { data, error } = await supabase
            .from('addresses')
            .insert(addressData)
            .select()
            .single();

          if (error) throw error;
          savedRecord = data;
        }
      } else {
        // Ephemeral address payload for this order only
        savedRecord = { id: `temp-${Date.now()}`, ...addressData };
      }

      setIsSubmitting(false);
      onAddressSaved(savedRecord);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'Failed to save delivery address. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={addressToEdit ? 'Edit Delivery Address' : 'Add Delivery Address'}
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        
        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{submitError}</span>
          </div>
        )}

        {/* SECTION 1: Contact Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-[#16B67A]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0B2540]">
              1. Contact Information
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                placeholder="Receiver Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-semibold text-[#0B2540] focus:outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Mobile Number *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-11 pr-3.5 py-2.5 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-mono font-bold text-[#0B2540] focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Address Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Home className="w-4 h-4 text-[#16B67A]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0B2540]">
              2. Address Details
            </h4>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">House / Building / Flat / Door No. *</label>
              <input
                type="text"
                placeholder="Flat 4B, Emerald Heights, Building B"
                value={houseBuilding}
                onChange={(e) => setHouseBuilding(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-semibold text-[#0B2540] focus:outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Street / Road / Area *</label>
              <input
                type="text"
                placeholder="MG Road, Near Bus Stand, Sector 4"
                value={streetArea}
                onChange={(e) => setStreetArea(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-semibold text-[#0B2540] focus:outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="Behind Apollo Pharmacy, Opposite Metro Pillar 42"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-semibold text-[#0B2540] focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Location & PIN Code */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-[#16B67A]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0B2540]">
              3. Location & Postal Registry
            </h4>
          </div>

          <div className="space-y-3">
            
            {/* GPS Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingGps}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#16B67A]/40 bg-[#E8F8F1] hover:bg-[#E8F8F1]/80 text-[#0F8F68] font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {isDetectingGps ? (
                  <RefreshCw className="w-4 h-4 text-[#16B67A] animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 text-[#16B67A]" />
                )}
                <span>{isDetectingGps ? 'Detecting GPS location...' : 'Use Current Location (Browser GPS)'}</span>
              </div>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#16B67A]/40 font-mono">
                Auto GPS
              </span>
            </button>

            {gpsError && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                {gpsError}
              </p>
            )}

            {/* PIN Code Input & Check */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[11px] font-bold text-slate-700">6-Digit PIN Code *</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 679338"
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPincode(val);
                      setPincodeError(null);
                      if (val.length === 6) {
                        handlePincodeLookup(val);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-mono font-bold text-[#0B2540] focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handlePincodeLookup(pincode)}
                    disabled={isCheckingPincode || pincode.length !== 6}
                    className="bg-[#16B67A] hover:bg-[#0F8F68] text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {isCheckingPincode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-1 space-y-1">
                <label className="text-[11px] font-bold text-slate-700">District / City *</label>
                <input
                  type="text"
                  placeholder="Auto-detected"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-semibold text-[#0B2540] focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="sm:col-span-1 space-y-1">
                <label className="text-[11px] font-bold text-slate-700">State *</label>
                <input
                  type="text"
                  placeholder="Auto-detected"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-semibold text-[#0B2540] focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {pincodeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{pincodeError}</span>
              </div>
            )}

            {/* Post Office Selector */}
            {pincodeDetails && pincodeDetails.postOffices && pincodeDetails.postOffices.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-[#0B2540]">
                  Select Post Office ({pincodeDetails.postOffices.length} Available):
                </label>
                <select
                  value={selectedPostOffice?.name || ''}
                  onChange={(e) => {
                    const po = pincodeDetails.postOffices?.find((p) => p.name === e.target.value);
                    if (po) handlePostOfficeChange(po);
                  }}
                  className="w-full bg-white border border-[#E2EAE6] rounded-xl px-3 py-2 text-xs font-semibold text-[#0B2540] focus:border-[#16B67A] focus:outline-none"
                >
                  {pincodeDetails.postOffices.map((po) => (
                    <option key={po.name} value={po.name}>
                      {po.name} ({po.branchType}) — {po.deliveryStatus}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fixed Country Badge */}
            <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <span>Country</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[#0B2540]">India</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: Interactive Map */}
        {coords && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#0B2540]">
              <span>Interactive OpenStreetMap</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
              </span>
            </div>
            <InteractiveMap
              lat={coords.lat}
              lng={coords.lng}
              popupText={selectedPostOffice ? `${selectedPostOffice.name}, ${district}, ${state} — ${pincode}` : 'Delivery Location'}
            />
          </div>
        )}

        {/* SECTION 5: Delivery Instructions & Label */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Tag className="w-4 h-4 text-[#16B67A]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0B2540]">
              4. Instructions & Save Preference
            </h4>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Delivery Instructions (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Leave with security guard, ring bell twice, call before arriving"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F7FAF9] border border-[#E2EAE6] focus:border-[#16B67A] focus:bg-white rounded-xl text-xs font-semibold text-[#0B2540] focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700">Address Label</label>
            <div className="flex gap-2">
              {(['Home', 'Work', 'Other'] as const).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setLabel(tag)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    label === tag
                      ? 'bg-[#16B67A] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tag === 'Home' && <Home className="w-3.5 h-3.5" />}
                  {tag === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                  {tag === 'Other' && <Tag className="w-3.5 h-3.5" />}
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#0B2540] pt-1">
            <input
              type="checkbox"
              checked={saveForFuture}
              onChange={(e) => setSaveForFuture(e.target.checked)}
              className="w-4 h-4 rounded text-[#16B67A] focus:ring-[#16B67A] border-slate-300"
            />
            <span>Save this address for future orders</span>
          </label>
        </div>

        {/* STICKY BOTTOM ACTION FOOTER */}
        <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-3.5 sm:p-4 bg-white/95 backdrop-blur-md border-t border-[#E2EAE6] flex items-center justify-between gap-3 z-30 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all shrink-0 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isCheckingPincode || Boolean(pincodeError)}
            className="grow bg-[#16B67A] hover:bg-[#0F8F68] text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-soft-sm hover:shadow-card-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{addressToEdit ? 'Update Address & Continue' : 'Save Address & Continue'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
};
