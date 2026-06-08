'use client';

import { Fragment, useCallback, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Patches L.Map to support `rotate: true` + `bearing: deg`. Must be imported
// before any L.map() is created — placed at module top so the side effect
// runs once on first import.
import 'leaflet-rotate';
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

// Memoize icons by (lie, isLast). Creating a new L.divIcon on every render
// causes react-leaflet to call marker.setIcon(), which swaps the marker's
// DOM element mid-drag — interrupting Leaflet's Draggable handler and
// making the drag stutter.
const iconCache = new Map<string, L.DivIcon>();
function getLandingIcon(lie: string, isLast: boolean): L.DivIcon {
  const key = `${lie}|${isLast ? 'last' : ''}`;
  let icon = iconCache.get(key);
  if (icon) return icon;
  icon = L.divIcon({
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
  iconCache.set(key, icon);
  return icon;
}

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

// Fit the map exactly ONCE per hole change AND set the bearing so the
// tee→pin axis points up the screen ("player view"). We deliberately don't
// list `bounds`/`bearing` as deps — otherwise every landing drag triggers a
// refit and the whole map appears to follow the cursor.
function BoundsFitter({
  holeKey,
  bounds,
  bearing,
}: {
  holeKey: number | string;
  bounds: [[number, number], [number, number]];
  bearing: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    // The hole's compass bearing is "where the pin is from the tee" (0=N).
    // To make that direction point UP the screen, set the map's bearing to
    // -hole.bearing (leaflet-rotate convention: positive bearing rotates
    // the view clockwise, so we negate to spin counter-clockwise).
    const m = map as unknown as { setBearing?: (deg: number) => void };
    if (typeof m.setBearing === 'function') m.setBearing(-bearing);
    // Pad bounds generously because rotated content can be cropped at the
    // corners; ~60% extra padding ensures the inscribed circle of the
    // rotated rectangle contains everything we care about.
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 19 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, holeKey]);
  return null;
}

interface Props {
  hole: ResolvedHole;
  landings: HoleLanding[];
  /** Called continuously as the user drags a landing marker. */
  onLandingChange?: (shotIndex: number, latLng: LatLng) => void;
}

export default function HoleChainMap({ hole, landings, onLandingChange }: Props) {
  // Throttle drag state updates to one per animation frame. The marker
  // itself moves smoothly because Leaflet updates it directly; what was
  // jumpy is React re-rendering the 57-label dispersion chart + lines on
  // every drag tick. rAF coalesces those to ~60fps.
  const onLandingChangeRef = useRef(onLandingChange);
  useEffect(() => {
    onLandingChangeRef.current = onLandingChange;
  });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ shotIndex: number; latLng: LatLng } | null>(null);
  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);
  const queueDrag = useCallback((shotIndex: number, latLng: LatLng) => {
    pendingRef.current = { shotIndex, latLng };
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const p = pendingRef.current;
      if (p) {
        onLandingChangeRef.current?.(p.shotIndex, p.latLng);
        pendingRef.current = null;
      }
    });
  }, []);
  const flushDrag = useCallback((shotIndex: number, latLng: LatLng) => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingRef.current = null;
    onLandingChangeRef.current?.(shotIndex, latLng);
  }, []);
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
      dragging={false}
      boxZoom={false}
      keyboard={false}
      doubleClickZoom={false}
      // leaflet-rotate options — passed through to L.map()
      {...({ rotate: true, bearing: -hole.bearing } as Record<string, unknown>)}
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

      <BoundsFitter holeKey={hole.holeNumber} bounds={[[south, west], [north, east]]} bearing={hole.bearing} />

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
        // Defensive: if landings is shorter than shots (e.g. a stale array from
        // a just-switched round, before the parent rebuilds), skip rather than
        // crash on landings[i].land.
        const landing = landings[i];
        if (!landing) return null;
        const origin = origins[i];
        const land = landing.land;
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
            <Marker
              position={toLL(land)}
              icon={getLandingIcon(landing.lie, isLast)}
              draggable={!!onLandingChange}
              eventHandlers={
                onLandingChange
                  ? {
                      drag: (e: L.LeafletEvent) => {
                        const ll = (e.target as L.Marker).getLatLng();
                        queueDrag(i, { lat: ll.lat, lng: ll.lng });
                      },
                      dragend: (e: L.LeafletEvent) => {
                        const ll = (e.target as L.Marker).getLatLng();
                        flushDrag(i, { lat: ll.lat, lng: ll.lng });
                      },
                    }
                  : undefined
              }
            >
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <strong>
                    H{hole.holeNumber} · Shot {i + 1} — {shot.club}
                  </strong>
                  <br />
                  Lie: {landing.lie || '—'}
                  {onLandingChange && (
                    <>
                      <br />
                      <em>Drag to reposition</em>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
