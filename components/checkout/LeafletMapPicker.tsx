'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface LeafletMapPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  cityName?: string;
  onLocationSelect: (lat: number | null, lng: number | null) => void;
}

export default function LeafletMapPicker({
  initialLat,
  initialLng,
  cityName,
  onLocationSelect,
}: LeafletMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;

      // Custom high-contrast SVG pin to avoid Leaflet asset 404s
      const customPinIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            background: #2563eb;
            color: #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            border: 2px solid #ffffff;
          ">
            <svg style="transform: rotate(45deg); width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
            </svg>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      // Default start coordinates: Pakistan / Lahore center
      const defaultCenter: [number, number] = coords
        ? [coords.lat, coords.lng]
        : [31.5204, 74.3587];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: coords ? 15 : 12,
        zoomControl: true,
      });

      // Free OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // If initial coords exist, add marker
      if (coords) {
        const marker = L.marker([coords.lat, coords.lng], {
          icon: customPinIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const newPos = { lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) };
          setCoords(newPos);
          onLocationSelect(newPos.lat, newPos.lng);
        });

        markerRef.current = marker;
      }

      // Map click handler to drop/move pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        const newCoords = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
        setCoords(newCoords);
        onLocationSelect(newCoords.lat, newCoords.lng);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], {
            icon: customPinIcon,
            draggable: true,
          }).addTo(map);

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const posCoords = { lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) };
            setCoords(posCoords);
            onLocationSelect(posCoords.lat, posCoords.lng);
          });

          markerRef.current = marker;
        }
      });

      if (isMounted) setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map center when cityName changes (if user hasn't explicitly placed custom pin)
  useEffect(() => {
    if (!mapInstanceRef.current || !cityName || coords) return;

    // Pan towards city center
    import('@/lib/geo').then(({ getCityCoordinates }) => {
      const cityCoords = getCityCoordinates(cityName);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(cityCoords, 12, { animate: true });
      }
    });
  }, [cityName, coords]);

  // GPS "Use My Location" Handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const newCoords = { lat, lng };

        setCoords(newCoords);
        onLocationSelect(lat, lng);
        setGpsLoading(false);

        if (mapInstanceRef.current) {
          const L = (await import('leaflet')).default;
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const customPinIcon = L.divIcon({
              className: 'custom-leaflet-marker',
              html: `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 38px;
                  height: 38px;
                  background: #2563eb;
                  color: #ffffff;
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  box-shadow: 0 4px 10px rgba(0,0,0,0.35);
                  border: 2px solid #ffffff;
                ">
                  <svg style="transform: rotate(45deg); width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
                  </svg>
                </div>
              `,
              iconSize: [38, 38],
              iconAnchor: [19, 38],
            });

            const marker = L.marker([lat, lng], {
              icon: customPinIcon,
              draggable: true,
            }).addTo(mapInstanceRef.current);

            marker.on('dragend', () => {
              const pos = marker.getLatLng();
              const posCoords = { lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) };
              setCoords(posCoords);
              onLocationSelect(posCoords.lat, posCoords.lng);
            });

            markerRef.current = marker;
          }
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location permission denied. You can tap anywhere on the map to pin manually.');
        } else {
          setGpsError('Unable to detect exact location. Please click on the map to drop pin.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleClearPin = () => {
    setCoords(null);
    onLocationSelect(null, null);
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gpsLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 transition shadow-sm"
        >
          {gpsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{gpsLoading ? 'Locating...' : 'Use My Current Location'}</span>
        </button>

        {coords && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              Pin Placed ({coords.lat}, {coords.lng})
            </span>
            <button
              type="button"
              onClick={handleClearPin}
              className="text-[11px] text-gray-500 hover:text-red-600 underline"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {gpsError && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner bg-gray-100 dark:bg-gray-800 h-52 sm:h-64">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {!coords && (
          <div className="absolute top-2 left-2 right-2 pointer-events-none z-[400] flex justify-center">
            <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-medium text-gray-700 dark:text-gray-300 shadow border border-gray-200 dark:border-gray-700">
              👉 Tap map or use GPS to pin exact doorstep
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
        OpenStreetMap &bull; 100% Free &bull; Pin is strictly optional and never stops you from placing your order.
      </p>
    </div>
  );
}
