'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, Navigation, RefreshCw } from 'lucide-react';
import { fetchOSRMRoute } from '@/lib/delivery/tracking';

export interface LiveTrackingMapProps {
  riderLat?: number | null;
  riderLng?: number | null;
  destLat: number;
  destLng: number;
  heading?: number | null;
  destLabel?: string;
  height?: string;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  riderLat,
  riderLng,
  destLat,
  destLng,
  heading = 0,
  destLabel = 'Delivery Destination',
  height = '360px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; etaMins: number } | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Update or draw route polyline
  const updateRoute = useCallback(
    async (rLat: number, rLng: number, map: any, L: any) => {
      setIsRoutingLoading(true);
      try {
        const routeData = await fetchOSRMRoute(rLat, rLng, destLat, destLng);
        setRouteInfo({ distanceKm: routeData.distanceKm, etaMins: routeData.etaMins });

        if (polylineRef.current) {
          map.removeLayer(polylineRef.current);
          polylineRef.current = null;
        }

        const polyline = L.polyline(routeData.routePoints, {
          color: '#16B67A',
          weight: 5,
          opacity: 0.85,
          dashArray: routeData.isFallback ? '8, 8' : undefined,
        }).addTo(map);

        polylineRef.current = polyline;

        // Auto fit bounds to include both Rider & Destination
        const bounds = L.latLngBounds([
          [rLat, rLng],
          [destLat, destLng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch {
        // Fallback
      } finally {
        setIsRoutingLoading(false);
      }
    },
    [destLat, destLng]
  );

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Inject Leaflet CSS if missing
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!isMounted) return;

      const activeRiderLat = typeof riderLat === 'number' ? riderLat : destLat;
      const activeRiderLng = typeof riderLng === 'number' ? riderLng : destLng;

      // Rider Marker Icon (🚴 Bike with Rotation)
      const createRiderIcon = (bearing: number) =>
        L.divIcon({
          className: 'custom-rider-marker',
          html: `
            <div style="
              width: 44px;
              height: 44px;
              background-color: #0B2540;
              border: 3px solid #16B67A;
              border-radius: 50%;
              box-shadow: 0 4px 14px rgba(22, 182, 122, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${bearing}deg);
              transition: transform 0.3s ease;
            ">
              <span style="font-size: 22px;">🚴</span>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });

      // Destination Marker Icon (📍 Red Pin)
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div style="
            width: 38px;
            height: 38px;
            background-color: #EF4444;
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background-color: #ffffff;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [activeRiderLat, activeRiderLng],
          zoom: 14,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Add Rider & Destination Markers
        const rMarker = L.marker([activeRiderLat, activeRiderLng], {
          icon: createRiderIcon(heading || 0),
        }).addTo(map);
        rMarker.bindPopup('🚴 Delivery Partner Live Location');

        const dMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
        dMarker.bindPopup(`📍 ${destLabel}`);

        mapInstanceRef.current = map;
        riderMarkerRef.current = rMarker;
        destMarkerRef.current = dMarker;

        if (typeof riderLat === 'number' && typeof riderLng === 'number') {
          updateRoute(riderLat, riderLng, map, L);
        }
      } else {
        const map = mapInstanceRef.current;

        if (riderMarkerRef.current) {
          riderMarkerRef.current.setLatLng([activeRiderLat, activeRiderLng]);
          riderMarkerRef.current.setIcon(createRiderIcon(heading || 0));
        }

        if (destMarkerRef.current) {
          destMarkerRef.current.setLatLng([destLat, destLng]);
          destMarkerRef.current.setPopupContent(`📍 ${destLabel}`);
        }

        if (typeof riderLat === 'number' && typeof riderLng === 'number') {
          updateRoute(riderLat, riderLng, map, L);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [riderLat, riderLng, destLat, destLng, heading, destLabel, updateRoute]);

  // Center Map on Rider
  const handleCenterRider = () => {
    if (mapInstanceRef.current && typeof riderLat === 'number' && typeof riderLng === 'number') {
      mapInstanceRef.current.setView([riderLat, riderLng], 15);
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#E2EAE6] shadow-soft-md bg-[#F7FAF9] z-0" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Info Overlay */}
      {routeInfo && (
        <div className="absolute top-3 left-3 bg-[#0B2540]/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-slate-700 text-xs shadow-soft-lg z-[1000] flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-extrabold text-[#16B67A]">
            <Navigation className="w-4 h-4" />
            <span>ETA: {routeInfo.etaMins} Mins</span>
          </div>
          <span className="text-slate-400">•</span>
          <span className="font-bold text-slate-200">{routeInfo.distanceKm} KM Away</span>
        </div>
      )}

      {/* Center on Rider Button */}
      {typeof riderLat === 'number' && typeof riderLng === 'number' && (
        <button
          type="button"
          onClick={handleCenterRider}
          className="absolute bottom-3 right-3 bg-white hover:bg-slate-50 text-[#0B2540] border border-[#E2EAE6] font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-soft-sm flex items-center gap-1.5 transition-all cursor-pointer z-[1000]"
        >
          <Compass className="w-4 h-4 text-[#16B67A]" />
          <span>Center on Rider</span>
        </button>
      )}
    </div>
  );
};
