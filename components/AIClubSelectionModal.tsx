'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Mic, MicOff } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';

type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro' | 'Tour Pro';

interface AIClubSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIClubSelectionModal({ isOpen, onClose }: AIClubSelectionModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[AIClubSelectionModal] Conversation connected');
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log('[AIClubSelectionModal] Conversation disconnected');
    },
    onError: (error) => {
      console.error('[AIClubSelectionModal] Conversation error:', error);
      setAgentError(error.message || 'Failed to connect to AI agent');
      setIsConnecting(false);
    },
    onMessage: (message) => {
      console.log('[AIClubSelectionModal] Message:', message);
    },
  });

  // Start conversation when level is selected
  useEffect(() => {
    if (selectedLevel && isOpen) {
      startConversation();
    }
  }, [selectedLevel, isOpen]);

  // Stop conversation when modal closes
  useEffect(() => {
    if (!isOpen && conversation.status === 'connected') {
      conversation.endSession();
    }
  }, [isOpen]);

  const startConversation = async () => {
    try {
      setIsConnecting(true);
      setAgentError(null);

      const dynamicVariables = {
        golf_level: selectedLevel || 'Beginner'
      };

      console.log('[AIClubSelectionModal] Starting conversation with dynamic variables:', dynamicVariables);

      await conversation.startSession({
        agentId: 'agent_2401k6recqf9f63ak9v5ha7s4n6s',
        dynamicVariables,
      });

      console.log('[AIClubSelectionModal] Conversation started successfully');
    } catch (error) {
      console.error('[AIClubSelectionModal] Failed to start conversation:', error);
      setAgentError(error instanceof Error ? error.message : 'Failed to start conversation');
      setIsConnecting(false);
    }
  };

  const stopConversation = () => {
    if (conversation.status === 'connected') {
      conversation.endSession();
    }
  };

  const handleLevelSelect = (level: SkillLevel) => setSelectedLevel(level);

  const handleReset = () => {
    stopConversation();
    setSelectedLevel(null);
    setAgentError(null);
  };

  const handleClose = () => {
    stopConversation();
    setSelectedLevel(null);
    setAgentError(null);
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

            <div className="bg-white rounded-xl p-6 min-h-[400px] flex flex-col items-center justify-center">
              {agentError ? (
                <div className="text-center max-w-md">
                  <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Connection Error</h3>
                  <p className="text-sm text-gray-600 mb-4">{agentError}</p>
                  <Button onClick={startConversation} variant="primary">
                    Try Again
                  </Button>
                </div>
              ) : isConnecting || conversation.status === 'connecting' ? (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
                  <p className="text-sm text-gray-600">Connecting to AI Agent...</p>
                </div>
              ) : conversation.status === 'connected' ? (
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
                    <Mic className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI Agent Connected</h3>
                  <p className="text-gray-600 mb-6">The AI is listening. Describe your shot to get club recommendations.</p>
                  <Button onClick={stopConversation} variant="outline" className="gap-2">
                    <MicOff className="w-4 h-4" />
                    End Conversation
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Mic className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Start</h3>
                  <p className="text-gray-600 mb-6">Click below to start talking with the AI assistant</p>
                  <Button onClick={startConversation} variant="primary" className="gap-2">
                    <Mic className="w-4 h-4" />
                    Start Conversation
                  </Button>
                </div>
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

      <style jsx global>{`
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
