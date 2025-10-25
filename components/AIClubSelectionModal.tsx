'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro' | 'Tour Pro';

interface AIClubSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIClubSelectionModal({ isOpen, onClose }: AIClubSelectionModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [agentError, setAgentError] = useState(false);

  const widgetRef = useRef<HTMLDivElement | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('[AIClubSelectionModal] isOpen changed to:', isOpen);
  }, [isOpen]);

  // Load ElevenLabs script
  useEffect(() => {
    const script = document.querySelector('script[src*="elevenlabs"]');
    if (script) {
      setIsScriptLoaded(true);
    } else {
      const newScript = document.createElement('script');
      newScript.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      newScript.async = true;
      newScript.type = 'text/javascript';
      newScript.onload = () => setIsScriptLoaded(true);
      document.head.appendChild(newScript);
    }

    // Error handling
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('ConversationalAI')) {
        console.error('[AIClubSelectionModal] ElevenLabs agent error:', event.message);
        setAgentError(true);
      }
    };

    window.addEventListener('error', handleError);
    const originalConsoleError = console.error;
    console.error = function (...args) {
      if (typeof args[0] === 'string' && args[0].includes('ConversationalAI')) {
        setAgentError(true);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      window.removeEventListener('error', handleError);
      console.error = originalConsoleError;
    };
  }, []);

  // Inject widget when level is selected and script is loaded
  useEffect(() => {
    if (isScriptLoaded && selectedLevel && widgetRef.current) {
      widgetRef.current.innerHTML = '';
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', 'agent_2401k6recqf9f63ak9v5ha7s4n6s');
      widget.setAttribute('dynamic-variables', JSON.stringify({ golf_level: selectedLevel }));
      widget.setAttribute('override-first-message', 'Tell me about your shot?');
      widgetRef.current.appendChild(widget);
    }
  }, [isScriptLoaded, selectedLevel]);

  const handleLevelSelect = (level: SkillLevel) => setSelectedLevel(level);
  const handleReset = () => setSelectedLevel(null);
  const handleClose = () => {
    setSelectedLevel(null);
    onClose();
  };

  if (!isOpen) return null;

  const skillLevels: Array<{ level: SkillLevel; description: string }> = [
    { level: 'Beginner', description: 'New to golf, learning the basics' },
    { level: 'Intermediate', description: 'Comfortable with fundamentals' },
    { level: 'Advanced', description: 'Experienced player, low handicap' },
    { level: 'Pro', description: 'Competitive tournament player' },
    { level: 'Tour Pro', description: 'Professional level player' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 bg-white border-2 border-primary rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 animate-scale-in">
        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900" aria-label="Close modal">
          <X className="w-6 h-6" />
        </button>

        {!selectedLevel ? (
          <>
            {/* Level Selection View */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4..." />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">AI Powered Club Selection</h2>
            <p className="text-lg text-gray-600 text-center mb-8">Select your skill level to get personalized club recommendations</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skillLevels.map(({ level, description }) => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className="group relative overflow-hidden bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-primary rounded-xl p-6"
                >
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary">{level}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Widget View */}
            <div className="mb-6">
              <Button variant="outline" size="sm" onClick={handleReset} className="mb-4">Change Level</Button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedLevel} Level Selected</h2>
              <p className="text-gray-600">Tell the AI assistant about your shot and get personalized recommendations</p>
            </div>

            <div className="bg-white rounded-xl p-6 min-h-[400px] flex items-center justify-center">
              {agentError ? (
                <div className="text-center max-w-md">
                  <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2..." />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Configuration Required</h3>
                  <p className="text-sm text-gray-600">
                    The ElevenLabs AI agent needs to be configured. Please set up your agent at{' '}
                    <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      elevenlabs.io
                    </a>
                  </p>
                </div>
              ) : (
                <div ref={widgetRef} className="w-full" style={{ minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
              )}
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong className="text-gray-900">Tip:</strong> Describe your shot including distance to target, lie condition, wind, and any hazards.
              </p>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
