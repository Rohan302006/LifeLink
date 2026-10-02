import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix standard Leaflet default icon paths in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MarkerItem {
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: 'hospital' | 'donor' | 'approx_donor';
  isRevealed?: boolean;
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MarkerItem[];
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 13,
  markers = [],
  className = 'h-72 w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // Add markers
    markers.forEach(m => {
      if (m.type === 'hospital') {
        const hospitalIcon = L.divIcon({
          html: `<div class="bg-brand-600 text-white p-1.5 rounded-full shadow-md border-2 border-white flex items-center justify-center font-bold text-xs" style="width: 28px; height: 28px;">🏥</div>`,
          className: 'custom-hospital-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([m.lat, m.lng], { icon: hospitalIcon })
          .addTo(map)
          .bindPopup(`<strong>${m.title}</strong><br/>${m.subtitle || 'Verified Hospital'}`);
      } else if (m.type === 'donor') {
        // Direct donor marker (only when accepted)
        const donorIcon = L.divIcon({
          html: `<div class="bg-emerald-600 text-white p-1 rounded-full shadow-md border-2 border-white flex items-center justify-center font-bold text-xs" style="width: 26px; height: 26px;">🩸</div>`,
          className: 'custom-donor-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker([m.lat, m.lng], { icon: donorIcon })
          .addTo(map)
          .bindPopup(`<strong>${m.title}</strong><br/>${m.subtitle || 'Accepted Donor'}`);
      } else if (m.type === 'approx_donor') {
        // Approximate donor area (Privacy protected before acceptance!)
        L.circle([m.lat, m.lng], {
          radius: 800, // 800m approximate radius
          color: '#3b82f6',
          fillColor: '#93c5fd',
          fillOpacity: 0.35,
          weight: 1,
        })
          .addTo(map)
          .bindPopup(`<strong>${m.title}</strong><br/>Exact contact & location locked until match acceptance (Privacy Protected).`);
      }
    });

    return () => {
      // Keep instance alive on simple re-renders
    };
  }, [center, zoom, markers]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
