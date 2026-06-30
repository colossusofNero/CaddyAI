'use client';

import { Fragment, useCallback, useEffect, useRef } from 'react';
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

// "+" marker for where an optimizer recommendation ends (calls mode). Bright
// blue with a dark drop-shadow so it stands out on satellite imagery.
const RECOMMENDATION_COLOR = '#38bdf8';
const recommendationEndIcon = L.divIcon({
  className: '',
  html: `<svg width="16" height="16" viewBox="0 0 16 16" style="filter:drop-shadow(0 0 1.5px rgba(0,0,0,0.9))">
    <line x1="8" y1="1.5" x2="8" y2="14.5" stroke="${RECOMMENDATION_COLOR}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="${RECOMMENDATION_COLOR}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Reference line the dispersion chart measures against (the fairway centerline).
// White dotted so it reads as a target line, distinct from the green shot line
// and the sky-blue recommendation.
const CENTERLINE_COLOR = '#ffffff';

const toLL = (p: LatLng): [number, number] => [p.lat, p.lng];

// Fit the map exactly ONCE per hole change. We deliberately don't list
// `bounds` as a dep — otherwise every landing drag triggers a refit and the
// whole map appears to follow the cursor.
function BoundsFitter({
  holeKey,
  bounds,
}: {
  holeKey: number | string;
  bounds: [[number, number], [number, number]];
}) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, holeKey]);
  return null;
}

interface Props {
  hole: ResolvedHole;
  landings: HoleLanding[];
  /** Called continuously as the user drags a landing marker. */
  onLandingChange?: (shotIndex: number, latLng: LatLng) => void;
  /**
   * Real detected fairway shape, if available for this hole. When absent we
   * fall back to a clean hole-aligned corridor (a proper rectangle running
   * tee→green) instead of a lat/lng bounding box, which the map rotation would
   * otherwise skew into an odd diamond.
   */
  fairwayPolygon?: LatLng[];
  /**
   * Calls mode: the player never recorded a shot, only an optimizer
   * recommendation. Show ONLY the recommendation — a dashed line ending in a
   * plus marker — and not the solid "actual shot" line, which would imply a
   * tracked shot that doesn't exist.
   */
  recommendationOnly?: boolean;
}

export default function HoleChainMap({ hole, landings, onLandingChange, fairwayPolygon, recommendationOnly }: Props) {
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

  // Mask the hole ONLY when we have a REAL detected fairway polygon. We don't
  // fabricate a boundary — without real data we show the clean satellite and
  // let the recommendation overlay speak for itself, rather than drawing a
  // misleading rectangle.
  const HALO = 0.5;
  const fairwayMask: [number, number][][] | null =
    fairwayPolygon && fairwayPolygon.length >= 3
      ? [
          [
            [north + HALO, west - HALO],
            [north + HALO, east + HALO],
            [south - HALO, east + HALO],
            [south - HALO, west - HALO],
          ],
          fairwayPolygon.map(p => [p.lat, p.lng] as [number, number]),
        ]
      : null;

  const origins: LatLng[] = [hole.tee, ...landings.slice(0, -1).map(l => l.land)];

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
    <MapContainer
      center={[(north + south) / 2, (east + west) / 2]}
      zoom={17}
      scrollWheelZoom
      // Pan the map by dragging empty areas. Dragging a green landing marker
      // still repositions the shot, not the map — Leaflet routes a mousedown
      // that starts on a marker to the marker's own drag handler.
      dragging
      boxZoom={false}
      keyboard={false}
      doubleClickZoom={false}
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

      <BoundsFitter
        // Key on the actual tee coordinates, not just the hole number: switching
        // rounds reuses hole numbers (both have a "hole 1"), so a number-only key
        // would skip the refit and leave the view parked on the previous course.
        holeKey={`${hole.holeNumber}@${hole.tee.lat.toFixed(5)},${hole.tee.lng.toFixed(5)}`}
        bounds={[[south, west], [north, east]]}
      />

      {/* Dark mask outside the hole — only when we have a real fairway shape */}
      {fairwayMask && (
        <Polygon
          positions={fairwayMask}
          pathOptions={{
            color: 'transparent',
            fillColor: '#000',
            fillOpacity: 0.62,
            stroke: false,
            interactive: false,
          }}
        />
      )}

      {/* Fairway centerline — the reference axis the dispersion chart measures
          against, so a center-of-fairway shot on a dogleg reads ~0 offline.
          Spans tee→green through the real bend points when iGolf supplied them. */}
      {hole.centerline && hole.centerline.length >= 2 && (
        <Polyline
          positions={[hole.tee, ...hole.centerline, hole.green].map(toLL)}
          pathOptions={{ color: CENTERLINE_COLOR, weight: 2.5, opacity: 0.6, dashArray: '2 7', interactive: false }}
        />
      )}

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

      {/* Per-shot lines + markers. The recommendation (bright dashed line +
          "+") renders on EVERY round for consistency. Scorecard rounds also
          draw the solid green actual-shot line + landing dot; calls rounds omit
          that layer because no shot was tracked. */}
      {hole.shots.map((shot, i) => {
        // Defensive: if landings is shorter than shots (e.g. a stale array from
        // a just-switched round, before the parent rebuilds), skip rather than
        // crash on landings[i].land.
        const landing = landings[i];
        if (!landing) return null;
        const origin = origins[i];
        const land = landing.land;
        // Where the optimizer recommended this shot end up. In calls mode the
        // landing IS the recommendation; in scorecard mode it's the planned
        // carry straight down the target line.
        const recommendationEnd = recommendationOnly
          ? land
          : destinationPoint(origin, hole.bearing, shot.planned);
        const isLast = i === hole.shots.length - 1;
        return (
          <Fragment key={i}>
            {/* Recommendation — shown on all rounds */}
            <Polyline
              positions={[toLL(origin), toLL(recommendationEnd)]}
              pathOptions={{ color: RECOMMENDATION_COLOR, weight: 3, opacity: 0.9, dashArray: '8 8' }}
            />
            <Marker position={toLL(recommendationEnd)} icon={recommendationEndIcon}>
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <strong>H{hole.holeNumber} · recommendation</strong>
                  <br />
                  {shot.club}{shot.planned ? ` · ${Math.round(shot.planned)}y` : ''}
                </div>
              </Popup>
            </Marker>

            {/* Actual shot — scorecard rounds only */}
            {!recommendationOnly && (
              <>
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
              </>
            )}
          </Fragment>
        );
      })}
    </MapContainer>
    <MapLegend
      recommendationOnly={!!recommendationOnly}
      hasCenterline={!!(hole.centerline && hole.centerline.length >= 2)}
    />
    </div>
  );
}

// Static key for the marker colors so users aren't left guessing what the
// green/red dots mean. Positioned over the map's bottom-left corner with a
// z-index above Leaflet's panes (which top out around 700).
function LegendDot({ background, border }: { background: string; border: string }) {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background,
        border: `2px solid ${border}`,
        flex: '0 0 auto',
        boxSizing: 'border-box',
      }}
    />
  );
}

function MapLegend({ recommendationOnly, hasCenterline }: { recommendationOnly: boolean; hasCenterline: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        zIndex: 1000,
        background: 'rgba(255,255,255,0.92)',
        color: '#111',
        borderRadius: 6,
        padding: '6px 8px',
        fontSize: 11,
        lineHeight: 1.5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LegendDot background="#fde047" border="#b45309" />
        <span>Tee</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LegendDot background="#fde047" border="#eab308" />
        <span>Green / pin</span>
      </div>
      {!recommendationOnly && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LegendDot background="#22c55e" border="#fff" />
            <span>Shot landing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LegendDot background="#ef4444" border="#fde047" />
            <span>Final landing</span>
          </div>
        </>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 14,
            height: 0,
            flex: '0 0 auto',
            borderTop: '2px dashed #38bdf8',
          }}
        />
        <span>AI recommendation</span>
      </div>
      {hasCenterline && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 14,
              height: 0,
              flex: '0 0 auto',
              borderTop: '2px dotted #777',
            }}
          />
          <span>Fairway centerline</span>
        </div>
      )}
    </div>
  );
}
