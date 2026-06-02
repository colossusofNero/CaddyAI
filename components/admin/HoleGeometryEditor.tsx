'use client';

import { useEffect, useMemo, Fragment } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Polyline,
  useMapEvents,
  useMap,
} from 'react-leaflet';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface TeeBox {
  color: string;
  position: LatLng;
}

export interface Hazard {
  type: 'sand' | 'water';
  polygon: LatLng[];
  name?: string;
}

export interface HoleGeometryState {
  teeBoxes: TeeBox[];
  greenCenter: LatLng | null;
  greenPolygon: LatLng[];
  fairwayPolygon: LatLng[];
  hazards: Hazard[];
}

export type EditMode =
  | 'idle'
  | 'fairway'
  | 'green'
  | 'tee'
  | 'green-center'
  | 'hazard-sand'
  | 'hazard-water';

interface HoleGeometryEditorProps {
  state: HoleGeometryState;
  onChange: (next: HoleGeometryState) => void;
  mode: EditMode;
  activeHazardIndex: number | null;
  center: [number, number];
}

const VERTEX_ICON = L.divIcon({
  className: '',
  html: '<div style="width:10px;height:10px;background:#fff;border:2px solid #111;border-radius:50%;box-sizing:border-box;"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const TEE_ICON = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#fde047;border:2px solid #b45309;border-radius:50%;box-sizing:border-box;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const PIN_ICON = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#ef4444;border:2px solid #7f1d1d;border-radius:50%;box-sizing:border-box;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const toLL = (p: LatLng): [number, number] => [p.latitude, p.longitude];

function ClickCapture({
  mode,
  state,
  onChange,
  activeHazardIndex,
}: {
  mode: EditMode;
  state: HoleGeometryState;
  onChange: (s: HoleGeometryState) => void;
  activeHazardIndex: number | null;
}) {
  useMapEvents({
    click(e) {
      const ll: LatLng = { latitude: e.latlng.lat, longitude: e.latlng.lng };
      switch (mode) {
        case 'fairway':
          onChange({ ...state, fairwayPolygon: [...state.fairwayPolygon, ll] });
          break;
        case 'green':
          onChange({ ...state, greenPolygon: [...state.greenPolygon, ll] });
          break;
        case 'tee':
          // Single white tee for v1; replace position
          onChange({ ...state, teeBoxes: [{ color: 'white', position: ll }] });
          break;
        case 'green-center':
          onChange({ ...state, greenCenter: ll });
          break;
        case 'hazard-sand':
        case 'hazard-water': {
          const type: 'sand' | 'water' = mode === 'hazard-sand' ? 'sand' : 'water';
          if (activeHazardIndex == null || !state.hazards[activeHazardIndex] || state.hazards[activeHazardIndex].type !== type) {
            // No active hazard of this type — append a new one
            onChange({
              ...state,
              hazards: [...state.hazards, { type, polygon: [ll] }],
            });
          } else {
            const next = state.hazards.slice();
            next[activeHazardIndex] = {
              ...next[activeHazardIndex],
              polygon: [...next[activeHazardIndex].polygon, ll],
            };
            onChange({ ...state, hazards: next });
          }
          break;
        }
      }
    },
  });
  return null;
}

function ViewCenterer({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() < 17 ? 18 : map.getZoom());
    // Belt-and-suspenders: nudge after layout settles
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [center, map]);
  return null;
}

interface VertexProps {
  position: LatLng;
  onDrag: (p: LatLng) => void;
  onDelete: () => void;
}

function Vertex({ position, onDrag, onDelete }: VertexProps) {
  return (
    <Marker
      position={toLL(position)}
      icon={VERTEX_ICON}
      draggable
      eventHandlers={{
        dragend(e) {
          const ll = (e.target as L.Marker).getLatLng();
          onDrag({ latitude: ll.lat, longitude: ll.lng });
        },
        contextmenu() {
          onDelete();
        },
      }}
    />
  );
}

export default function HoleGeometryEditor({
  state,
  onChange,
  mode,
  activeHazardIndex,
  center,
}: HoleGeometryEditorProps) {
  const fairwayLL = useMemo(() => state.fairwayPolygon.map(toLL), [state.fairwayPolygon]);
  const greenLL = useMemo(() => state.greenPolygon.map(toLL), [state.greenPolygon]);

  const updateFairwayVertex = (i: number, p: LatLng) => {
    const next = state.fairwayPolygon.slice();
    next[i] = p;
    onChange({ ...state, fairwayPolygon: next });
  };
  const deleteFairwayVertex = (i: number) => {
    onChange({ ...state, fairwayPolygon: state.fairwayPolygon.filter((_, j) => j !== i) });
  };
  const updateGreenVertex = (i: number, p: LatLng) => {
    const next = state.greenPolygon.slice();
    next[i] = p;
    onChange({ ...state, greenPolygon: next });
  };
  const deleteGreenVertex = (i: number) => {
    onChange({ ...state, greenPolygon: state.greenPolygon.filter((_, j) => j !== i) });
  };
  const updateHazardVertex = (hIdx: number, vIdx: number, p: LatLng) => {
    const next = state.hazards.slice();
    const poly = next[hIdx].polygon.slice();
    poly[vIdx] = p;
    next[hIdx] = { ...next[hIdx], polygon: poly };
    onChange({ ...state, hazards: next });
  };
  const deleteHazardVertex = (hIdx: number, vIdx: number) => {
    const next = state.hazards.slice();
    next[hIdx] = {
      ...next[hIdx],
      polygon: next[hIdx].polygon.filter((_, j) => j !== vIdx),
    };
    onChange({ ...state, hazards: next });
  };
  const updateTee = (p: LatLng) => {
    onChange({ ...state, teeBoxes: [{ color: 'white', position: p }] });
  };
  const updateGreenCenter = (p: LatLng) => {
    onChange({ ...state, greenCenter: p });
  };

  return (
    <MapContainer
      center={center}
      zoom={18}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={20}
      />
      <ViewCenterer center={center} />
      <ClickCapture mode={mode} state={state} onChange={onChange} activeHazardIndex={activeHazardIndex} />

      {/* Target line tee → green center, if both set */}
      {state.teeBoxes[0] && state.greenCenter && (
        <Polyline
          positions={[toLL(state.teeBoxes[0].position), toLL(state.greenCenter)]}
          pathOptions={{ color: '#fbbf24', weight: 1, opacity: 0.6, dashArray: '4 6' }}
        />
      )}

      {/* Fairway polygon */}
      {fairwayLL.length >= 2 && (
        <Polygon
          positions={fairwayLL}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.25, weight: 2 }}
        />
      )}
      {state.fairwayPolygon.map((v, i) => (
        <Vertex
          key={`f${i}`}
          position={v}
          onDrag={p => updateFairwayVertex(i, p)}
          onDelete={() => deleteFairwayVertex(i)}
        />
      ))}

      {/* Green polygon */}
      {greenLL.length >= 2 && (
        <Polygon
          positions={greenLL}
          pathOptions={{ color: '#15803d', fillColor: '#15803d', fillOpacity: 0.45, weight: 2 }}
        />
      )}
      {state.greenPolygon.map((v, i) => (
        <Vertex
          key={`g${i}`}
          position={v}
          onDrag={p => updateGreenVertex(i, p)}
          onDelete={() => deleteGreenVertex(i)}
        />
      ))}

      {/* Hazards */}
      {state.hazards.map((h, hIdx) => {
        const color = h.type === 'water' ? '#3b82f6' : '#eab308';
        return (
          <Fragment key={`h${hIdx}`}>
            {h.polygon.length >= 2 && (
              <Polygon
                positions={h.polygon.map(toLL)}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.45, weight: 2 }}
              />
            )}
            {h.polygon.map((v, vIdx) => (
              <Vertex
                key={`h${hIdx}-${vIdx}`}
                position={v}
                onDrag={p => updateHazardVertex(hIdx, vIdx, p)}
                onDelete={() => deleteHazardVertex(hIdx, vIdx)}
              />
            ))}
          </Fragment>
        );
      })}

      {/* Tee marker */}
      {state.teeBoxes[0] && (
        <Marker
          position={toLL(state.teeBoxes[0].position)}
          icon={TEE_ICON}
          draggable
          eventHandlers={{
            dragend(e) {
              const ll = (e.target as L.Marker).getLatLng();
              updateTee({ latitude: ll.lat, longitude: ll.lng });
            },
          }}
        />
      )}

      {/* Green center */}
      {state.greenCenter && (
        <Marker
          position={toLL(state.greenCenter)}
          icon={PIN_ICON}
          draggable
          eventHandlers={{
            dragend(e) {
              const ll = (e.target as L.Marker).getLatLng();
              updateGreenCenter({ latitude: ll.lat, longitude: ll.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}

