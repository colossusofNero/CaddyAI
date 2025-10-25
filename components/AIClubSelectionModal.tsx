/**
 * AI Powered Club Selection Modal
 * Allows users to select their skill level and interact with ElevenLabs voice AI
 */

'use client';

import { useState, useEffect } from 'react';
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
  }, []);

  const handleLevelSelect = (level: SkillLevel) => {
    setSelectedLevel(level);
  };

  const handleReset = () => {
    setSelectedLevel(null);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-secondary border-2 border-primary rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {!selectedLevel ? (
          /* Level Selection View */
          <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-bold text-text-primary text-center mb-3">
              AI Powered Club Selection
            </h2>
            <p className="text-lg text-text-secondary text-center mb-8">
              Select your skill level to get personalized club recommendations
            </p>

            {/* Level Buttons */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skillLevels.map(({ level, description }) => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className="group relative overflow-hidden bg-secondary-700 hover:bg-secondary-600 border-2 border-secondary-600 hover:border-primary rounded-xl p-6 transition-all duration-300 text-left"
                >
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {level}
                    </h3>
                    <p className="text-sm text-text-secondary">{description}</p>
                  </div>
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="mt-8 bg-secondary-700 rounded-lg p-4">
              <p className="text-sm text-text-secondary text-center">
                Our AI-powered voice assistant will help you choose the perfect club
                based on your skill level, shot conditions, and distance requirements.
              </p>
            </div>
          </>
        ) : (
          /* ElevenLabs Widget View */
          <>
            {/* Header with Back Button */}
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="mb-4"
              >
                Change Level
              </Button>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {selectedLevel} Level Selected
              </h2>
              <p className="text-text-secondary">
                Tell the AI assistant about your shot and get personalized recommendations
              </p>
            </div>

            {/* ElevenLabs Widget Container */}
            <div className="bg-secondary-700 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
              {isScriptLoaded ? (
                <div
                  id="elevenlabs-widget-container"
                  dangerouslySetInnerHTML={{
                    __html: `
                      <elevenlabs-convai
                        agent-id="agent_2401k6recqf9f63ak9v5ha7s4n6s"
                        dynamic-variables='{"golf_level":"${selectedLevel}"}'
                        override-first-message="Tell me about your shot?"
                      ></elevenlabs-convai>
                    `,
                  }}
                />
              ) : (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-text-secondary">Loading AI assistant...</p>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 bg-secondary-800 rounded-lg p-4">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Tip:</strong> Describe your
                shot including distance to target, lie condition, wind, and any hazards.
                The AI will recommend the best club and shot strategy.
              </p>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
