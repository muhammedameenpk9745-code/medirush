'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LocationDetails {
  pincode?: string;
  postOffice?: string;
  district?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

interface LocationContextType {
  location: string;
  details: LocationDetails | null;
  setLocation: (locationStr: string, details?: LocationDetails) => void;
  resetLocation: () => void;
}

const DEFAULT_LOCATION = 'Connaught Place, New Delhi — 110001';
const DEFAULT_DETAILS: LocationDetails = {
  pincode: '110001',
  postOffice: 'Connaught Place SO',
  district: 'Central Delhi',
  state: 'Delhi',
  lat: 28.6139,
  lng: 77.2090,
};

const STORAGE_KEY = 'medirush_selected_location';

const LocationContext = createContext<LocationContextType>({
  location: DEFAULT_LOCATION,
  details: DEFAULT_DETAILS,
  setLocation: () => {},
  resetLocation: () => {},
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<string>(DEFAULT_LOCATION);
  const [details, setDetailsState] = useState<LocationDetails | null>(DEFAULT_DETAILS);

  // Load persisted location from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.location) {
            setLocationState(parsed.location);
            setDetailsState(parsed.details || null);
          }
        }
      } catch {
        // Fallback
      }
    }
  }, []);

  const setLocation = (locationStr: string, newDetails?: LocationDetails) => {
    setLocationState(locationStr);
    const finalDetails = newDetails || details || DEFAULT_DETAILS;
    setDetailsState(finalDetails);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            location: locationStr,
            details: finalDetails,
          })
        );
      } catch {
        // Fallback
      }
    }
  };

  const resetLocation = () => {
    setLocationState(DEFAULT_LOCATION);
    setDetailsState(DEFAULT_DETAILS);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Fallback
      }
    }
  };

  return (
    <LocationContext.Provider value={{ location, details, setLocation, resetLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
