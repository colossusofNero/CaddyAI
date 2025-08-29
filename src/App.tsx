// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic, MicOff, Volume2, Send, MessageSquare, Settings, Plus, X, Menu, User, Bot, Loader2,
} from 'lucide-react';

import { useVoiceChat } from './hooks/useVoiceChat';
import { useGptCaddie } from './hooks/useGptCaddie';
import { useTheme } from './hooks/useTheme';

import Controls from './components/Controls';
import Recommendations from './components/Recommendations';

import PlayerProfileModal from './components/PlayerProfileModal'; // <-- default import
import { usePlayerProfiles } from './hooks/usePlayerProfiles';

// ---- Local types
type HazardType = 'bunker' | 'greenside' | 'water';
type HazardSide = 'left' | 'right' | 'front_left' | 'front_right' | 'back_left' | 'back_right';
type Hazard = { type: HazardType; side: HazardSide; startYds: number; clearYds: number; risk: number; };
type PPM = Record<string, { carry: number; total: number }>;

interface Message { id: string; content: string; role: 'user' | 'assistant'; timestamp: Date; }
interface Conversation { id: string; title: string; messages: Message[]; createdAt: Date; updatedAt: Date; }

// --- dummy responses (typed chat)
const AI_RESPONSES = [
  "Based on the conditions, I'd recommend a 7-iron with a slight draw. The wind is helping, so club down one.",
  "That's a tough pin position. I'd suggest aiming for the center of the green with an 8-iron for safety.",
  "With that yardage and the elevated green, take one more club. A smooth 6-iron should get you there.",
  "The bunker short is in play. I'd go with a 5-iron and make sure you get it to the back of the green.",
  "Perfect yardage for your pitching wedge. Just make a smooth swing and trust your distance.",
  "That's right in your wheelhouse. 9-iron with confidence - you've got this shot.",
  "The green is running fast today. I'd take a 7-iron and land it short, let it release to the pin.",
  "With the crosswind, aim a little left and let the wind bring it back. 8-iron should be perfect.",
];

// ---------------- Recommendation Engine ----------------
const recommend = ({
  distanceToHole,
  ppm,
  q,
  env,
}: {
  distanceToHole: number;
  ppm: PPM;
  q: { lie: string; hazards?: Hazard[]; };
  env: { windSpeed: number; windDir: 'head' | 'tail' | 'cross_left' | 'cross_right'; elevationFt: number; };
}) => {
  const clubs = Object.keys(ppm).filter((k) => ppm[k] && Number.isFinite(ppm[k].carry));
  if (clubs.length === 0) return { best: undefined as any, backup: undefined as any };

  const liePenalty =
    q?.lie === 'light_rough' ? 0.05 :
    q?.lie === 'heavy_rough' ? 0.10 :
    q?.lie === 'sand'        ? 0.05 :
    q?.lie === 'recovery'    ? 0.12 : 0;

  const elevAdj = (env?.elevationFt || 0) / 3;
  const windAdj =
    env?.windDir === 'head' ? +(env?.windSpeed || 0) * 0.5 :
    env?.windDir === 'tail' ? -(env?.windSpeed || 0) * 0.3 : 0;

  const targetEff = (Number(distanceToHole) || 0) + elevAdj + windAdj;
  const hazards: Hazard[] = Array.isArray(q?.hazards) ? q!.hazards! : [];

  const hazardImpact = (carry: number) => {
    let penalty = 0; let disqualify = false; const notes: string[] = [];
    for (const hz of hazards) {
      const min = Math.min(hz.startYds, hz.clearYds);
      const max = Math.max(hz.startYds, hz.clearYds);
      const inBand = carry >= min && carry < max;
      const tagSide = { left: 'left', right: 'right', front_left: 'front-left', front_right: 'front-right', back_left: 'back-left', back_right: 'back-right' }[hz.side];
      notes.push(`${hz.type === 'water' ? 'Water' : hz.type === 'greenside' ? 'Greenside bunker' : 'Bunker'} ${tagSide} ${min}-${max}y`);
      if (hz.type === 'water') { if (inBand) disqualify = true; }
      else if (hz.type === 'greenside') { const nearGreen = targetEff <= 60 || distanceToHole <= 60; if (nearGreen && inBand) penalty += 0.20 * (hz.risk || 3); }
      else { if (inBand) penalty += 0.25 * (hz.risk || 3); }
    }
    return { penalty, disqualify, notes };
  };

  const items = clubs.map((club) => {
    const carryBase = Number(ppm[club]?.carry); if (!Number.isFinite(carryBase)) return null;
    const baseCarry = carryBase * (1 - liePenalty);
    const { penalty, disqualify, notes: hzNotes } = hazardImpact(baseCarry);
    if (disqualify) return null;
    const leaveYds = Math.max(0, targetEff - baseCarry);
    const miss = Math.abs(baseCarry - targetEff);
    const e = 2.5 + 0.004 * miss + penalty;

    const notes: string[] = [];
    if (liePenalty > 0) notes.push(`Lie reduces carry by ${(liePenalty * 100).toFixed(0)}%.`);
    if (env?.windDir === 'head' && env?.windSpeed > 0) notes.push(`Headwind adds ~${(env.windSpeed * 0.5).toFixed(0)}y.`);
    if (env?.windDir === 'tail' && env?.windSpeed > 0) notes.push(`Tailwind saves ~${(env.windSpeed * 0.3).toFixed(0)}y.`);
    notes.push(...hzNotes);

    return { club, carry: Math.round(baseCarry), expectedStrokes: e, leaveYds: Math.max(0, Math.round(leaveYds)), notes };
  }).filter(Boolean) as Array<{ club: string; carry: number; expectedStrokes: number; leaveYds: number; notes: string[] }>;

  if (items.length === 0) return { best: undefined as any, backup: undefined as any };
  items.sort((a, b) => a.expectedStrokes - b.expectedStrokes);
  return { best: items[0], backup: items[1] };
};

// Spoken line for GPT voice wrapper
const describeRecommendation = (best: any, backup: any, q: any) => {
  if (!best) return 'I need more information to make a recommendation.';
  const warns: string[] = [];
  if (Array.isArray(q?.hazards)) {
    const water = q.hazards.find((h: Hazard) => h.type === 'water');
    if (water) warns.push('Water is in play—commit to the line and distance.');
  }
  const tail = warns.length ? ` ${warns.join(' ')}` : '';
  return `I recommend ${best.club} for ${best.carry} yards carry. Backup option is ${backup?.club || 'one less club'}.${tail}`;
};

// ---- Simple typed chat generator (not the GPT wrapper) ----
async function generateAIResponse(messages: Message[]): Promise<string> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 900));
  const last = messages[messages.length - 1];
  const lower = last.content.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi')) return "Hello! I'm your AI golf caddie. What's your situation?";
  if (lower.includes('help')) return "Tell me your lie, distance, wind, and hazards. I’ll advise club + aim.";
  return AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
}
function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.split(' ').slice(0, 4);
  return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '');
}

// ========================= App =========================
export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { supported: voiceSupported, listening, transcript, start: startListening, stop: stopListening, speak } = useVoiceChat();

  // ---- Player Profiles (saved in localStorage)
  const {
    profiles,
    current: activeProfile,
    currentId,
    selectProfile,
    createProfile,
    deleteProfile,
    updateProfile,
    updateClub,
  } = usePlayerProfiles();
  const [profileOpen, setProfileOpen] = useState(false);

  // ---- Golf state
  const [distance, setDistance] = useState(152);
  const [q, setQ] = useState({
    lie: 'fairway',
    stance: 'flat',
    pinPos: 'middle',
    requiredShape: 'any',
    confidence: 3,
    fairwayWidthAtDriverYds: null as number | null,
    hazards: [] as Hazard[],
  });
  const [env, setEnv] = useState({
    windSpeed: 0,
    windDir: 'head' as 'head' | 'tail' | 'cross_left' | 'cross_right',
    temperatureF: 75,
    elevationFt: 0,
    altitudeFt: 0,
    greenFirm: 'medium',
  });

  // ---- Compute recs first
  const { best, backup } = useMemo(
    () => recommend({ distanceToHole: distance, ppm: activeProfile?.ppm || {}, env, q }),
    [distance, activeProfile?.ppm, env, q]
  );

  // ---- GPT wrapper
  const gpt = useGptCaddie({
    distance, q, env,
    setDistance, setQ, setEnv,
    speak,
    recommend: ({ distanceToHole, q, env }) => recommend({ distanceToHole, ppm: activeProfile?.ppm || {}, env, q }),
    describe: describeRecommendation,
  });

  // ---- Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false); // placeholder

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentConversation = currentConversationId ? conversations.find((c) => c.id === currentConversationId) : null;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [currentConversation?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // ESC closes sidebar; lock body scroll when open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (sidebarOpen) document.body.classList.add('overflow-hidden');
    else document.body.classList.remove('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, [sidebarOpen]);

  // ---- Conversation helpers
  const createConversation = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setSidebarOpen(false);
    return newConversation;
  };
  const selectConversationId = (id: string) => { setCurrentConversationId(id); setSidebarOpen(false); };
  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) setCurrentConversationId(null);
  };
  const addMessage = (conversationId: string, messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = { ...messageData, id: crypto.randomUUID(), timestamp: new Date() };
    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id === conversationId) {
          const updated = {
            ...conversation,
            messages: [...conversation.messages, newMessage],
            updatedAt: new Date(),
          };
          if (conversation.messages.length === 0 && messageData.role === 'user') {
            updated.title = generateConversationTitle(messageData.content);
          }
          return updated;
        }
        return conversation;
      })
    );
    return newMessage;
  };

  // ---- Chat send
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    let conversationId = currentConversationId;
    if (!conversationId) conversationId = createConversation().id;
    addMessage(conversationId, { content, role: 'user' });

    setIsLoading(true);
    try {
      const history = currentConversation?.messages || [];
      const response = await generateAIResponse([...history, { id: 'temp', content, role: 'user', timestamp: new Date() }]);
      addMessage(conversationId, { content: response, role: 'assistant' });
      if (voiceSupported) speak(response);
    } catch (e) {
      console.error('AI response error:', e);
      addMessage(conversationId, { content: "I'm sorry, I hit an error. Try again.", role: 'assistant' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (message.trim() && !isLoading) { handleSendMessage(message.trim()); setMessage(''); } };
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } };

  // ---- Voice input
  const onVoiceResult = async (text: string) => {
    try { await gpt.interpretAndApply(text); }
    catch (error) { console.error('GPT interpretation failed:', error); handleSendMessage(text); }
  };
  const toggleVoice = async () => { if (listening) await stopListening(); else await startListening(onVoiceResult); };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Overlay (click to close) */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        id="sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Recent conversations"
        className={`fixed left-0 top-0 h-screen w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Golf Caddie AI</h1>
            <button onClick={() => setSidebarOpen(false)} aria-label="Close conversations menu" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={20} />
            </button>
          </div>

          <button onClick={createConversation} className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
            <Plus size={16} className="mr-2" />
            New Conversation
          </button>

          <div className="flex-1 overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wider">Recent Conversations</h2>
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No conversations yet</p>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === c.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => { selectConversationId(c.id); setSidebarOpen(false); }}
                  >
                    <div className="flex items-start space-x-3">
                      <MessageSquare size={16} className="mt-0.5 text-gray-400 dark:text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.messages.length} messages</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-opacity"
                      aria-label="Delete conversation"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button onClick={() => setSettingsOpen(true)} className="w-full justify-start mt-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center transition-colors">
            <Settings size={16} className="mr-2" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open conversations menu" aria-expanded={sidebarOpen} aria-controls="sidebar" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">Golf Caddie AI</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProfileOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium"
              title={activeProfile ? `Active: ${activeProfile.name}` : 'Player profile'}
            >
              {activeProfile ? activeProfile.name : 'Profile'}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Volume2 size={20} />
            </button>
          </div>
        </div>

        {/* Planner */}
        <section className="p-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6">
            <Recommendations
              best={best}
              backup={backup ?? undefined}
              onUseBest={() => {
                if (!best) return;
                setDistance(Math.max(0, best.leaveYds));
                setQ((prev: any) => ({ ...prev, lie: prev.lie === 'tee' ? 'fairway' : prev.lie }));
              }}
              onUseBackup={() => {
                if (!backup) return;
                setDistance(Math.max(0, backup.leaveYds));
                setQ((prev: any) => ({ ...prev, lie: prev.lie === 'tee' ? 'fairway' : prev.lie }));
              }}
            />

            <Controls
              distance={distance}
              setDistance={setDistance}
              q={q}
              setQ={setQ}
              env={env}
              setEnv={setEnv}
              ppm={activeProfile?.ppm}
              updateClub={updateClub}
            />
          </div>
        </section>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto p-4 space-y-6">
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Bot size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Welcome to Golf Caddie AI</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Tell me your lie, distance, wind, and hazards; I’ll advise club + aim.
                </p>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Try: “Bunker right 250–270, water left 220–240, 152 yards, slight headwind.”
                </div>
              </div>
            </div>
          ) : (
            <>
              {currentConversation.messages.map((msg) => (
                <div key={msg.id} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm">
                      <div className="flex items-center space-x-2">
                        <Loader2 size={16} className="animate-spin text-gray-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Caddie is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </section>

        {/* Input */}
        <footer className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="flex items-end space-x-3">
            {voiceSupported && (
              <button
                type="button"
                onClick={async () => { if (listening) await stopListening(); else await startListening(onVoiceResult); }}
                disabled={isLoading}
                className={`flex-shrink-0 mb-2 p-2 rounded-full transition-colors ${
                  listening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={listening ? 'Listening...' : 'Ask your golf caddie... (Shift+Enter for new line)'}
                disabled={isLoading || listening}
                rows={1}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {transcript && (
                <div className="absolute -top-8 left-0 right-0 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  {transcript}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!message.trim() || isLoading || listening}
              className="flex-shrink-0 mb-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full p-0 flex items-center justify-center transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </footer>
      </main>

      {/* Player Profile Modal */}
      {/** Guard so React never tries to render an undefined component */}
      {PlayerProfileModal && (
        <PlayerProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          profiles={profiles}
          current={activeProfile}
          selectProfile={selectProfile}
          createProfile={createProfile}
          deleteProfile={deleteProfile}
          updateProfile={updateProfile}
        />
      )}
    </div>
  );
}
