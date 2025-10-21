/**
 * Course Map Component
 *
 * 2D interactive map for golf course holes using Leaflet
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CourseHoleExtended } from '@/types/courseExtended';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CourseMapProps {
  hole: CourseHoleExtended;
  userPosition?: { lat: number; lng: number };
  className?: string;
}

export default function CourseMap({ hole, userPosition, className = '' }: CourseMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [distanceToGreen, setDistanceToGreen] = useState<number | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !hole.geometry) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [hole.geometry.greenCenter.lat, hole.geometry.greenCenter.lng],
        zoom: 16,
        zoomControl: true,
      });

      // Add satellite tile layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add labels overlay
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
        attribution: '&copy; CARTO',
        maxZoom: 19,
        pane: 'shadowPane',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing layers (except base layers)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polygon || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds: L.LatLngBoundsExpression = [];

    // Draw fairway
    if (hole.geometry.fairway.length > 0) {
      const fairwayLatLngs = hole.geometry.fairway.map((p) => [p.lat, p.lng] as L.LatLngTuple);
      L.polygon(fairwayLatLngs, {
        color: '#4ade80',
        fillColor: '#86efac',
        fillOpacity: 0.5,
        weight: 2,
      }).addTo(map);
      bounds.push(...fairwayLatLngs);
    }

    // Draw green
    if (hole.geometry.green.length > 0) {
      const greenLatLngs = hole.geometry.green.map((p) => [p.lat, p.lng] as L.LatLngTuple);
      L.polygon(greenLatLngs, {
        color: '#22c55e',
        fillColor: '#4ade80',
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(map);
      bounds.push(...greenLatLngs);
    }

    // Draw bunkers
    if (hole.geometry.bunkers) {
      hole.geometry.bunkers.forEach((bunker) => {
        const bunkerLatLngs = bunker.map((p) => [p.lat, p.lng] as L.LatLngTuple);
        L.polygon(bunkerLatLngs, {
          color: '#d97706',
          fillColor: '#fbbf24',
          fillOpacity: 0.7,
          weight: 1,
        }).addTo(map);
        bounds.push(...bunkerLatLngs);
      });
    }

    // Draw water hazards
    if (hole.geometry.water) {
      hole.geometry.water.forEach((water) => {
        const waterLatLngs = water.map((p) => [p.lat, p.lng] as L.LatLngTuple);
        L.polygon(waterLatLngs, {
          color: '#0ea5e9',
          fillColor: '#38bdf8',
          fillOpacity: 0.6,
          weight: 2,
        }).addTo(map);
        bounds.push(...waterLatLngs);
      });
    }

    // Draw tee boxes
    if (hole.geometry.teeBoxes.length > 0) {
      const teeLatLngs = hole.geometry.teeBoxes.map((p) => [p.lat, p.lng] as L.LatLngTuple);
      L.polygon(teeLatLngs, {
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(map);
      bounds.push(...teeLatLngs);

      // Add tee marker
      const teeCenter = teeLatLngs[0];
      L.marker(teeCenter, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background: #dc2626; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">T</div>',
          iconSize: [32, 32],
        }),
      })
        .bindPopup(`<b>Hole ${hole.holeNumber}</b><br>Par ${hole.par}<br>Tee Box`)
        .addTo(map);
    }

    // Add green center marker
    L.marker([hole.geometry.greenCenter.lat, hole.geometry.greenCenter.lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #22c55e; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">G</div>',
        iconSize: [32, 32],
      }),
    })
      .bindPopup(`<b>Hole ${hole.holeNumber} Green</b><br>Par ${hole.par}`)
      .addTo(map);
    bounds.push([hole.geometry.greenCenter.lat, hole.geometry.greenCenter.lng]);

    // Add user position if available
    if (userPosition) {
      L.marker([userPosition.lat, userPosition.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background: #3b82f6; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); animation: pulse 2s infinite;">📍</div>',
          iconSize: [36, 36],
        }),
      })
        .bindPopup('<b>Your Location</b>')
        .addTo(map);
      bounds.push([userPosition.lat, userPosition.lng]);

      // Calculate distance to green
      const distance = map.distance(
        [userPosition.lat, userPosition.lng],
        [hole.geometry.greenCenter.lat, hole.geometry.greenCenter.lng]
      );
      setDistanceToGreen(Math.round(distance * 1.09361)); // Convert meters to yards
    }

    // Fit bounds to show all features
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      // Cleanup handled by component unmount
    };
  }, [hole, userPosition]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Distance Overlay */}
      {distanceToGreen !== null && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
          <div className="text-xs text-gray-600 font-semibold">Distance to Green</div>
          <div className="text-2xl font-bold text-primary">{distanceToGreen} yds</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
        <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#86efac] border border-[#4ade80] rounded" />
            <span className="text-gray-700">Fairway</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#4ade80] border border-[#22c55e] rounded" />
            <span className="text-gray-700">Green</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#fbbf24] border border-[#d97706] rounded" />
            <span className="text-gray-700">Bunker</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#38bdf8] border border-[#0ea5e9] rounded" />
            <span className="text-gray-700">Water</span>
          </div>
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
