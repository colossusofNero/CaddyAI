'use client';

/**
 * iGolf 3D Course Viewer Component
 *
 * Embeds the iGolf 3D viewer for course flyovers and hole visualization
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Home, Maximize2 } from 'lucide-react';
import { igolfService } from '@/services/igolfService';
import type { IGolf3DViewerInstance, IGolf3DViewerConfig } from '@/types/course';

interface CourseViewer3DProps {
  courseId: string;
  initialHole?: number;
  onHoleChange?: (holeNumber: number) => void;
  height?: string;
  className?: string;
}

declare global {
  interface Window {
    IGolfViewer: {
      init: (config: IGolf3DViewerConfig) => IGolf3DViewerInstance;
    };
  }
}

export default function CourseViewer3D({
  courseId,
  initialHole = 1,
  onHoleChange,
  height = '500px',
  className = '',
}: CourseViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<IGolf3DViewerInstance | null>(null);
  const [currentHole, setCurrentHole] = useState(initialHole);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load iGolf 3D Viewer script
  useEffect(() => {
    const scriptSrc = igolfService.get3DViewerScriptUrl();

    // Check if script already exists
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => {
      console.log('[3D Viewer] Script loaded successfully');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('[3D Viewer] Failed to load script');
      setError('Failed to load 3D viewer');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize viewer
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.IGolfViewer) {
      return;
    }

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const viewer = window.IGolfViewer.init({
          apiKey: process.env.NEXT_PUBLIC_IGOLF_API_KEY || '',
          containerId: containerRef.current?.id || '',
          courseId,
          options: {
            initialHole: currentHole,
            showControls: true,
            autoRotate: false,
            height,
            width: '100%',
          },
        });

        viewerRef.current = viewer;
        console.log('[3D Viewer] Initialized successfully');
        setIsLoading(false);
      } catch (error: unknown) {
        console.error('[3D Viewer] Initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize viewer');
        setIsLoading(false);
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [scriptLoaded, courseId, height, currentHole]);

  const goToHole = (holeNumber: number) => {
    if (viewerRef.current && holeNumber >= 1 && holeNumber <= 18) {
      viewerRef.current.goToHole(holeNumber);
      setCurrentHole(holeNumber);
      onHoleChange?.(holeNumber);
    }
  };

  const previousHole = () => {
    if (currentHole > 1) {
      goToHole(currentHole - 1);
    }
  };

  const nextHole = () => {
    if (currentHole < 18) {
      goToHole(currentHole + 1);
    }
  };

  const goToFirstHole = () => {
    goToHole(1);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-[#0B1220] flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#05A146] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading 3D viewer...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div
          className="absolute inset-0 bg-[#0B1220] flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center max-w-md px-4">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Viewer Error</h3>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#05A146] text-white rounded-lg hover:bg-[#048A3A] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* 3D Viewer Container */}
      <div
        ref={containerRef}
        id="igolf-3d-viewer-container"
        className="w-full bg-[#0B1220] rounded-lg overflow-hidden"
        style={{ height }}
      />

      {/* Controls */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1E293B]/95 backdrop-blur-sm rounded-lg shadow-lg p-2 flex items-center gap-2">
          <button
            onClick={goToFirstHole}
            disabled={currentHole === 1}
            className="p-2 text-white hover:bg-[#0B1220] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="First Hole"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={previousHole}
            disabled={currentHole === 1}
            className="p-2 text-white hover:bg-[#0B1220] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Hole"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="px-4 py-1 bg-[#05A146] rounded-lg">
            <span className="text-white font-bold text-sm">
              Hole {currentHole}
            </span>
          </div>

          <button
            onClick={nextHole}
            disabled={currentHole === 18}
            className="p-2 text-white hover:bg-[#0B1220] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Hole"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          <button
            onClick={() => {
              // Toggle fullscreen
              const elem = containerRef.current;
              if (elem) {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  elem.requestFullscreen();
                }
              }
            }}
            className="p-2 text-white hover:bg-[#0B1220] rounded-lg transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Hole Quick Select */}
      {!isLoading && !error && (
        <div className="absolute top-4 right-4 bg-[#1E293B]/95 backdrop-blur-sm rounded-lg shadow-lg p-2 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
              <button
                key={hole}
                onClick={() => goToHole(hole)}
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                  currentHole === hole
                    ? 'bg-[#05A146] text-white'
                    : 'bg-[#0B1220] text-gray-400 hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                {hole}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
