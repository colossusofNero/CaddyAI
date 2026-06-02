'use client';

import { Fragment } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from 'react-leaflet';
import type { ShotEventGeoPoint, ShotEventType } from '@/lib/api/shotEventGeo';

const COLORS: Record<ShotEventType, string> = {
  optimizer_run: '#22c55e',
  ai_conversation: '#3b82f6',
  ellipse_target: '#f97316',
};

const PREDICTED_COLOR = '#a78bfa'; // violet — easy to distinguish from origin/landing

interface ShotEventMapProps {
  points: ShotEventGeoPoint[];
}

function centerFromPoints(points: ShotEventGeoPoint[]): [number, number] {
  if (points.length === 0) return [39.8283, -98.5795]; // continental US fallback
  const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
  return [lat, lng];
}

export default function ShotEventMap({ points }: ShotEventMapProps) {
  const center = centerFromPoints(points);

  return (
    <MapContainer
      center={center}
      zoom={points.length > 0 ? 16 : 4}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {points.map(p => {
        const originColor = COLORS[p.eventType] ?? '#888';
        const dropped = p.agentDecision?.kept === false;
        return (
          <Fragment key={p.eventId}>
            {/* Origin (where the player stood when calling the optimizer) */}
            <CircleMarker
              center={[p.latitude, p.longitude]}
              radius={6}
              pathOptions={{
                color: dropped ? '#dc2626' : originColor,
                fillColor: originColor,
                fillOpacity: dropped ? 0.25 : 0.75,
                weight: dropped ? 2 : 1,
                dashArray: dropped ? '3 3' : undefined,
              }}
            >
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <strong>{p.eventType}</strong>
                  <br />
                  {new Date(p.timestamp).toLocaleString()}
                  {p.roundId && (
                    <>
                      <br />
                      Round: {p.roundId}
                    </>
                  )}
                  {p.holeNumber != null && (
                    <>
                      <br />
                      Hole: {p.holeNumber}
                    </>
                  )}
                  {p.predictedLanding && (
                    <>
                      <br />
                      Predicted landing recorded
                    </>
                  )}
                  {p.actualLanding && (
                    <>
                      <br />
                      Actual landing recorded
                    </>
                  )}
                  {p.agentDecision && (
                    <>
                      <br />
                      <strong>
                        Agent: {p.agentDecision.kept ? 'kept' : 'dropped'} ({p.agentDecision.confidence})
                      </strong>
                      {p.agentDecision.reason && (
                        <>
                          <br />
                          <em>{p.agentDecision.reason}</em>
                        </>
                      )}
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>

            {/* Predicted landing point (only set when bearing was known) */}
            {p.predictedLanding && (
              <CircleMarker
                center={[p.predictedLanding.latitude, p.predictedLanding.longitude]}
                radius={5}
                pathOptions={{
                  color: PREDICTED_COLOR,
                  fillColor: PREDICTED_COLOR,
                  fillOpacity: 0.5,
                  weight: 1,
                  dashArray: '3 3',
                }}
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <strong>Predicted landing</strong>
                    <br />
                    {new Date(p.timestamp).toLocaleString()}
                  </div>
                </Popup>
              </CircleMarker>
            )}

            {/* Dashed line: origin -> predicted */}
            {p.predictedLanding && (
              <Polyline
                positions={[
                  [p.latitude, p.longitude],
                  [p.predictedLanding.latitude, p.predictedLanding.longitude],
                ]}
                pathOptions={{
                  color: PREDICTED_COLOR,
                  weight: 2,
                  opacity: 0.7,
                  dashArray: '6 6',
                }}
              />
            )}

            {/* Solid line: origin -> actual landing (filled in by the next call) */}
            {p.actualLanding && (
              <Polyline
                positions={[
                  [p.latitude, p.longitude],
                  [p.actualLanding.latitude, p.actualLanding.longitude],
                ]}
                pathOptions={{
                  color: originColor,
                  weight: 3,
                  opacity: 0.85,
                }}
              />
            )}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
