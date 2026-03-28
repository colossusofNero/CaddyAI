'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const PLATFORMS = [
  { id: 'twitter',   label: 'X / Twitter',  color: 'bg-black' },
  { id: 'linkedin',  label: 'LinkedIn',      color: 'bg-blue-700' },
  { id: 'meta',      label: 'Facebook + Instagram', color: 'bg-blue-600' },
  { id: 'youtube',   label: 'YouTube',       color: 'bg-red-600' },
  { id: 'slack',     label: 'Slack',         color: 'bg-purple-600' },
];

const TEMPLATES = [
  { label: '⛳ Pro Tip',       text: '🏌️ Pro Tip from your AI Caddy:\n\n' },
  { label: '🌅 Morning Tee',  text: '🌅 Good morning golfers! Tee time tip for today:\n\n' },
  { label: '📊 Course Update',text: '📍 Course update from Copperline Golf:\n\n' },
  { label: '🎙️ Podcast',      text: '🎙️ New episode of the AI Caddy podcast is live!\n\n' },
];

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['twitter', 'linkedin', 'meta', 'slack']);
  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');

  const ADMIN_EMAIL = 'scott.roelofs@rcgvaluation.com';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/admin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl">⛔</div>
          <h1 className="text-white text-xl font-bold">Access Denied</h1>
          <p className="text-gray-400 text-sm">This page is restricted to authorized users only.</p>
        </div>
      </div>
    );
  }

  const togglePlatform = (id: string) => {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const applyTemplate = (templateText: string) => {
    setText(templateText);
  };

  const handlePost = async () => {
    if (!text.trim()) {
      setError('Post text is required.');
      return;
    }
    if (platforms.length === 0) {
      setError('Select at least one platform.');
      return;
    }

    setPosting(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          audioUrl: audioUrl || undefined,
          platforms,
        }),
      });

      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setText('');
        setImageUrl('');
        setVideoUrl('');
        setAudioUrl('');
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-green-800 bg-gradient-to-r from-green-950 to-gray-950 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">⛳ Social Command Center</h1>
          <p className="text-sm text-yellow-500">Copperline Golf — Post to all platforms</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">{user.email}</div>
          <button
            onClick={() => signOut().then(() => router.push('/login'))}
            className="text-sm px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Platform toggles */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Platforms</h2>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  platforms.includes(p.id)
                    ? `${p.color} border-transparent text-white`
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compose */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Compose</h2>

          {/* Templates */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.label}
                onClick={() => applyTemplate(t.text)}
                className="px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your post here..."
            rows={6}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-green-600"
          />
          <div className="text-right text-xs text-gray-500">{text.length} chars</div>

          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-600 text-sm"
          />
          <input
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="Video URL (optional — uploads to YouTube)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-600 text-sm"
          />
          <input
            type="url"
            value={audioUrl}
            onChange={e => setAudioUrl(e.target.value)}
            placeholder="Audio URL (optional — NotebookLM podcast link)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-600 text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Results</h2>
            {Object.entries(results).map(([platform, status]) => (
              <div key={platform} className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-300">{platform}</span>
                <span className={status === 'ok' || status.startsWith('https') ? 'text-green-400' : 'text-red-400'}>
                  {status === 'ok' ? '✅ Posted' : status.startsWith('https') ? `✅ ${status}` : `❌ ${status}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Publish button */}
        <button
          onClick={handlePost}
          disabled={posting || !text.trim()}
          className="w-full py-4 rounded-xl font-bold text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
        >
          {posting ? 'Publishing...' : `⚡ Publish to ${platforms.length} Platform${platforms.length !== 1 ? 's' : ''}`}
        </button>

      </div>
    </div>
  );
}
