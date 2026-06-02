'use client';

import { Fragment, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet';
import {
  destinationPoint,
  type ResolvedHole,
  type HoleLanding,
  type LatLng,
} from '@/lib/demo/kingRound';

const landingIcon = (lie: string, isLast: boolean) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${isLast ? '#ef4444' : '#22c55e'};
      border:3px solid ${isLast ? '#fde047' : '#fff'};
      box-shadow:${LIE_RING[lie] ? `0 0 0 3px ${LIE_RING[lie]}, ` : ''}0 2px 6px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const LIE_RING: Record<string, string> = {
  fairway: '#16a34a',
  rough: '#ca8a04',
  'deep-rough': '#78350f',
  sand: '#eab308',
  water: '#3b82f6',
  fringe: '#86efac',
  green: '#15803d',
};

const teeIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#fde047;border:3px solid #b45309;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
const greenIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#fde047;border:3px solid #eab308;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const toLL = (p: LatLng): [number, number] => [p.lat, p.lng];

function BoundsFitter({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
  }, [map, bounds]);
  return null;
}

interface Props {
  hole: ResolvedHole;
  landings: HoleLanding[];
}

export default function HoleChainMap({ hole, landings }: Props) {
  // Bounds + dark mask geometry
  const points: [number, number][] = [
    [hole.tee.lat, hole.tee.lng],
    [hole.green.lat, hole.green.lng],
    ...landings.map(l => [l.land.lat, l.land.lng] as [number, number]),
  ];
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  const padLat = 40 * 0.0000082;
  const padLng = 40 * 0.0000099;
  const south = minLat - padLat;
  const north = maxLat + padLat;
  const west = minLng - padLng;
  const east = maxLng + padLng;

  const HALO = 0.5;
  const maskPositions: [number, number][][] = [
    [
      [north + HALO, west - HALO],
      [north + HALO, east + HALO],
      [south - HALO, east + HALO],
      [south - HALO, west - HALO],
    ],
    [
      [south, west],
      [south, east],
      [north, east],
      [north, west],
    ],
  ];

  const origins: LatLng[] = [hole.tee, ...landings.slice(0, -1).map(l => l.land)];

  return (
    <MapContainer
      center={[(north + south) / 2, (east + west) / 2]}
      zoom={17}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
      <TileLayer
        attribution="&copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        opacity={0.85}
        maxZoom={19}
      />

      <BoundsFitter bounds={[[south, west], [north, east]]} />

      {/* Dark mask outside the hole */}
      <Polygon
        positions={maskPositions}
        pathOptions={{
          color: 'transparent',
          fillColor: '#000',
          fillOpacity: 0.62,
          stroke: false,
          interactive: false,
        }}
      />

      {/* Tee + green */}
      <Marker position={toLL(hole.tee)} icon={teeIcon}>
        <Popup>
          <div style={{ fontSize: 12 }}>
            <strong>H{hole.holeNumber} · Tee (white)</strong>
          </div>
        </Popup>
      </Marker>
      <Marker position={toLL(hole.green)} icon={greenIcon}>
        <Popup>
          <div style={{ fontSize: 12 }}>
            <strong>H{hole.holeNumber} · Green / pin</strong>
          </div>
        </Popup>
      </Marker>

      {/* Per-shot lines + markers */}
      {hole.shots.map((shot, i) => {
        const origin = origins[i];
        const land = landings[i].land;
        const predicted = destinationPoint(origin, hole.bearing, shot.planned);
        const isLast = i === hole.shots.length - 1;
        return (
          <Fragment key={i}>
            <Polyline
              positions={[toLL(origin), toLL(predicted)]}
              pathOptions={{ color: '#a78bfa', weight: 2, opacity: 0.6, dashArray: '6 6' }}
            />
            <Polyline
              positions={[toLL(origin), toLL(land)]}
              pathOptions={{ color: '#22c55e', weight: 3, opacity: 0.9 }}
            />
            <Marker position={toLL(land)} icon={landingIcon(landings[i].lie, isLast)}>
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <strong>
                    H{hole.holeNumber} · Shot {i + 1} — {shot.club}
                  </strong>
                  <br />
                  Lie: {landings[i].lie || '—'}
                </div>
              </Popup>
            </Marker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
