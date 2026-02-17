'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { MapPin, Navigation, CheckCircle, XCircle } from 'lucide-react';
import { useShotOutcomeTracking } from '@/hooks/useShotOutcomeTracking';

interface GPSOutcomeTrackerProps {
  onOutcomeTracked?: (outcome: any) => void;
}

/**
 * GPS Outcome Tracker Component
 *
 * Demonstrates automatic shot outcome tracking using GPS.
 * Tracks player movement and automatically records shot outcomes.
 */
export function GPSOutcomeTracker({ onOutcomeTracked }: GPSOutcomeTrackerProps) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>('Ready to track');

  const outcomeTracking = useShotOutcomeTracking({
    greenRadius: 10, // 10 meters
    fairwayWidth: 30, // 30 meters
  });

  const handleToggleTracking = async () => {
    if (isActive) {
      // Stop tracking
      outcomeTracking.stopTracking();
      setIsActive(false);
      setStatus('Tracking stopped');
    } else {
      // Start tracking
      const started = await outcomeTracking.startTracking();
      if (started) {
        setIsActive(true);
        setStatus('GPS tracking active - awaiting shot...');
      } else {
        setStatus('Failed to start GPS tracking');
      }
    }
  };

  // Update status based on GPS state
  useEffect(() => {
    if (outcomeTracking.error) {
      setStatus(`Error: ${outcomeTracking.error}`);
    } else if (outcomeTracking.isTracking && outcomeTracking.currentPosition) {
      setStatus('Tracking position - ready for shot detection');
    } else if (outcomeTracking.isTracking) {
      setStatus('Acquiring GPS signal...');
    }
  }, [
    outcomeTracking.error,
    outcomeTracking.isTracking,
    outcomeTracking.currentPosition,
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          GPS Outcome Tracking
        </h3>

        {outcomeTracking.isSupported ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <span className={`font-medium ${
            outcomeTracking.error
              ? 'text-red-500'
              : isActive
              ? 'text-green-500'
              : 'text-gray-500'
          }`}>
            {status}
          </span>
        </div>

        {outcomeTracking.currentPosition && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Position:</span>
              <span className="font-mono text-xs text-gray-900 dark:text-white">
                {outcomeTracking.currentPosition.latitude.toFixed(6)}, {outcomeTracking.currentPosition.longitude.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ±{Math.round(outcomeTracking.currentPosition.accuracy)}m
              </span>
            </div>
          </>
        )}

        {outcomeTracking.previousPosition && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Last shot:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.round(
                outcomeTracking.calculateDistance(
                  outcomeTracking.previousPosition,
                  outcomeTracking.currentPosition!
                ) * 1.09361
              )}{' '}
              yards
            </span>
          </div>
        )}
      </div>

      <Button
        onClick={handleToggleTracking}
        disabled={!outcomeTracking.isSupported || outcomeTracking.permissionStatus === 'denied'}
        variant={isActive ? 'outline' : 'primary'}
        className="w-full gap-2"
      >
        <MapPin className="w-4 h-4" />
        {isActive ? 'Stop Tracking' : 'Start GPS Tracking'}
      </Button>

      {outcomeTracking.permissionStatus === 'denied' && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          Location permission denied. Please enable location access in your browser settings.
        </div>
      )}

      {!outcomeTracking.isSupported && (
        <div className="text-sm text-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          GPS tracking is not supported by your browser.
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
        <p className="font-medium mb-1">How it works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>GPS automatically detects when you move 10+ meters</li>
          <li>Shot outcomes are recorded (green, fairway, rough, etc.)</li>
          <li>Distance to target is calculated</li>
          <li>Data is linked to your recommendation for analysis</li>
        </ul>
      </div>
    </div>
  );
}
