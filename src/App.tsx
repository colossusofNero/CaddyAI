import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mic, MicOff, Volume2, Send, MessageSquare, Settings, Plus, X, Menu, User, Bot, Loader2,
} from 'lucide-react';

import { useVoiceChat } from './hooks/useVoiceChat';
import { useGptCaddie } from './hooks/useGptCaddie';
import { useTheme } from './hooks/useTheme';

import Controls from './components/Controls';
import Recommendations from './components/Recommendations';

import { usePlayerProfiles } from './hooks/usePlayerProfiles';
// Import modal in a way that tolerates either export style (default or named)
import * as PPMModal from './components/PlayerProfileModal';
// @ts-ignore: tolerate both export styles across branches
const PlayerProfileModal = (PPMModal as any).default ?? (PPMModal as any).PlayerProfileModal;

// ---- Local types to align with controls/reco ----
type HazardType = 'bunker' | 'greenside' | 'water';
type HazardSide = 'left' | 'right' | 'front_left' | 'front_right' | 'back_left' | 'back_right';
type Hazard = {
  type: HazardType;
  side: HazardSide;
  startYds: number;
  clearYds: number;
  risk: number; // 1-5
};

type PPM = Record<string, { carry: number; total: number }>;

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Simple typed-chat filler (voice uses the GPT wrapper)
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
  q: {
    lie: string;
    hazards?: Hazard[];
  };
  env: {
    windSpeed: number;
    windDir: 'head' | 'tail' | 'cross_left' | 'cross_right';
    elevationFt: number;
  };
}) => {
  const clubs = Object.keys(ppm).filter((k) => ppm[k] && Number.isFinite(ppm[k].carry));
  if (clubs.length === 0) return { best: undefined as any, backup: undefined as any };

  const liePenalty =
    q?.lie === 'light_rough' ? 0.05 :
    q?.lie === 'heavy_rough' ? 0.10 :
    q?.lie === 'sand'        ? 0.05 :
    q?.lie === 'recovery'    ? 0.12 : 0;

  const elevAdj = (env?.elevationFt || 0) / 3; // ~1 yd per 3 ft
  const windAdj =
    env?.windDir === 'head' ? +(env?.windSpeed || 0) * 0.5 :
    env?.windDir === 'tail' ? -(env?.windSpeed || 0) * 0.3 : 0;

  const targetEff = (Number(distanceToHole) || 0) + elevAdj + windAdj;
  const hazards: Hazard[] = Array.isArray(q?.hazards) ? q!.hazards! : [];

  const hazardImpact = (carry: number) => {
    let penalty = 0;
    let disqualify = false;
    const notes: string[] = [];

    for (const hz of hazards) {
      const min = Math.min(hz.startYds, hz.clearYds);
      const max = Math.max(hz.startYds, hz.clearYds);
      const inBand = carry >= min && carry < max;

      const tagSide = {
        left: 'left', right: 'right',
        front_left: 'front-left', front_right: 'front-right',
        back_left: 'back-left', back_right: 'back-right',
      }[hz.side];

      notes.push(`${hz.type === 'water' ? 'Water' : hz.type === 'greenside' ? 'Greenside bunker' : 'Bunker'} ${tagSide} ${min}-${max}y`);

      if (hz.type === 'water') {
        if (inBand) disqualify = true; // avoid at all cost
      } else if (hz.type === 'greenside') {
        const nearGreen = targetEff <= 60 || distanceToHole <= 60;
        if (nearGreen && inBand) penalty += 0.20 * (hz.risk || 3);
      } else {
        if (inBand) penalty += 0.25 * (hz.risk || 3);
      }
    }

    return { penalty, disqualify, notes };
  };

  const items = clubs.map((club) => {
    const carryBase = Number(ppm[club]?.carry);
    if (!Number.isFinite(carryBase)) return null;

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

    return {
      club,
      carry: Math.round(baseCarry),
      expectedStrokes: e,
      leaveYds: Math.max(0, Math.round(leaveYds)),
      notes,
    };
  }).filter(Boolean) as Array<{ club: string; carry: number; expectedStrokes: number; leaveYds: number; notes: string[] }>;

  if (items.length === 0) return { best: undefined as any, backup: undefined as any };

  items.sort((a, b) => a.expectedStrokes - b.expectedStrokes);
  const best = items[0];
  const backup = items[1];
  return { best, backup };
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

  // ---- Compute recs first (so “Your Caddie Says” renders first)
  const { best, backup } = useMemo(
    () => recommend({ distanceToHole: distance, ppm: activeProfile?.ppm || {}, env, q }),
    [distance, activeProfile?.ppm, env, q]
  );

  // ---- GPT wrapper: fills state + speaks our app’s recs
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
  const [settingsOpen, setSettingsOpen] = useState(false); // placeholder, no modal rendered

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
      c
