'use client';

import React, { useEffect, useRef } from 'react';

interface InteractiveMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  popupText?: string;
  radiusKm?: number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  lat,
  lng,
  zoom = 13,
  popupText = 'Selected Delivery Location',
  radiusKm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const circleInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Load Leaflet dynamically to avoid Next.js SSR window errors
    const initLeaflet = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Inject Leaflet CSS dynamically if not present
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!isMounted) return;

      // Create Custom MediRush Emerald Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-medirush-marker',
        html: `
          <div style="
            width: 38px;
            height: 38px;
            background-color: #16B67A;
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(11, 37, 64, 0.25);
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

      // Initialize map instance if not already created
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        if (popupText) {
          marker.bindPopup(popupText).openPopup();
        }

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;

        // Draw delivery radius circle if radiusKm provided
        if (radiusKm && radiusKm > 0) {
          const circle = L.circle([lat, lng], {
            radius: radiusKm * 1000,
            color: '#16B67A',
            fillColor: '#16B67A',
            fillOpacity: 0.18,
            weight: 2,
          }).addTo(map);
          circleInstanceRef.current = circle;
          map.fitBounds(circle.getBounds(), { padding: [20, 20] });
        }
      } else {
        const map = mapInstanceRef.current;
        map.setView([lat, lng], zoom);

        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([lat, lng]);
          if (popupText) {
            markerInstanceRef.current.setPopupContent(popupText).openPopup();
          }
        }

        // Update radius circle
        if (circleInstanceRef.current) {
          map.removeLayer(circleInstanceRef.current);
          circleInstanceRef.current = null;
        }

        if (radiusKm && radiusKm > 0) {
          const circle = L.circle([lat, lng], {
            radius: radiusKm * 1000,
            color: '#16B67A',
            fillColor: '#16B67A',
            fillOpacity: 0.18,
            weight: 2,
          }).addTo(map);
          circleInstanceRef.current = circle;
          map.fitBounds(circle.getBounds(), { padding: [20, 20] });
        }
      }
    };

    initLeaflet();

    return () => {
      isMounted = false;
    };
  }, [lat, lng, zoom, popupText, radiusKm]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[260px] sm:h-[320px] rounded-2xl overflow-hidden border border-[#E2EAE6] shadow-soft-sm bg-[#F7FAF9] z-0">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#E2EAE6] text-[10px] font-bold text-[#0B2540] shadow-xs pointer-events-none z-[1000]">
        OpenStreetMap • Leaflet {radiusKm ? `(${radiusKm} km radius)` : ''}
      </div>
    </div>
  );
};
