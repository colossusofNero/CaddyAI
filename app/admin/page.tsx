'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'scott.roelofs@rcgvaluation.com';

const PLATFORM_CONFIG = [
  { id: 'twitter',  label: 'X / Twitter',  icon: '𝕏',  detail: '@copperline13520',       note: 'API v2 — OAuth 1.0a',         color: '#1DA1F2', border: 'border-t-[#1DA1F2]' },
  { id: 'linkedin', label: 'LinkedIn',      icon: 'in', detail: 'Scott Roelofs',           note: 'UGC Posts API — OAuth 2.0',   color: '#0077B5', border: 'border-t-[#0077B5]' },
  { id: 'meta',     label: 'Facebook + IG', icon: 'f',  detail: 'Page ID: ...305797',      note: 'Graph API v25.0',             color: '#4267B2', border: 'border-t-[#4267B2]' },
  { id: 'youtube',  label: 'YouTube',       icon: '▶',  detail: 'Copperline Golf',         note: 'Data API v3 — OAuth 2.0',     color: '#FF0000', border: 'border-t-[#FF0000]' },
  { id: 'slack',    label: 'Slack',         icon: '#',  detail: '#social (C0ALUJ43PJ8)',   note: 'Bot Token — chat:write',      color: '#4A154B', border: 'border-t-[#4A154B]' },
];

const TEMPLATES = [
  { label: '🔧 Test Post',       text: 'Copperline Golf AI System — Platform Test\n\nThis is an automated test post from our AI-powered social media pipeline.\n\n⛳ Powered by CaddyAI' },
  { label: '🌅 Morning Tee',     text: '🌅 Good morning golfers! Ready to lower your score today?\n\nYour AI Caddy has analyzed thousands of rounds — here\'s today\'s top tip:\n\n📍 Play to the fat part of the green, not the pin. Save strokes, save your round. ⛳\n\n#Golf #CopperlineGolf #AICaddy' },
  { label: '⛳ Pro Tip',         text: '🏌️ Pro Tip from your AI Caddy:\n\nWhen the wind is in your face, club up and swing easy. A smooth 6-iron beats a forced 8 every time.\n\nLess effort. More control. Lower scores.\n\n#GolfTips #CopperlineGolf #AICaddy' },
  { label: '🚀 Course Promo',    text: '📍 Copperline Golf — Your AI Caddy is waiting.\n\n✅ 15,000+ mapped courses\n✅ Real-time club recommendations\n✅ Shot analysis powered by AI\n\nDownload free at copperlinegolf.com 🏌️\n\n#Golf #GolfApp #AICaddy #CopperlineGolf' },
  { label: '🌤️ Weather Update', text: '⛅ Perfect conditions on the course today!\n\nYour AI Caddy adjusts club recommendations based on:\n🌡️ Temperature\n💨 Wind speed & direction\n⛰️ Elevation changes\n\nPlay smarter. Play Copperline Golf. ⛳\n\n#Golf #WeatherGolf #CopperlineGolf' },
];

type LogEntry = { type: 'success' | 'error' | 'info' | 'warn' | 'system'; msg: string; time: string };
type Tab = 'generate' | 'media' | 'compose';

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('compose');
  const [enabledPlatforms, setEnabledPlatforms] = useState<Record<string, boolean>>({
    twitter: true, linkedin: true, meta: true, youtube: false, slack: true,
  });

  // Compose tab
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  // Generate tab
  const [sourceUrl, setSourceUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<any>(null);

  // Posting state
  const [posting, setPosting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'system', msg: 'Copperline Golf Social Command Center initialized', time: now() },
    { type: 'info',   msg: '6 platforms configured — ready to post',            time: now() },
    { type: 'info',   msg: 'Select a tab and compose your post',                time: now() },
  ]);

  const consoleRef = useRef<HTMLDivElement>(null);

  function now() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function log(type: LogEntry['type'], msg: string) {
    setLogs(prev => [...prev, { type, msg, time: now() }]);
    setTimeout(() => { consoleRef.current?.scrollTo(0, consoleRef.current.scrollHeight); }, 50);
  }

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/admin');
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-white">Loading...</div>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">⛔</div>
          <h1 className="text-white text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-400">This page is restricted to authorized users only.</p>
        </div>
      </div>
    );
  }

  const togglePlatform = (id: string) => setEnabledPlatforms(p => ({ ...p, [id]: !p[id] }));

  const activePlatforms = Object.entries(enabledPlatforms).filter(([, v]) => v).map(([k]) => k);

  const handlePost = async () => {
    const postText = tab === 'compose' ? text : tab === 'media' ? text : text;
    if (!postText.trim()) { log('warn', 'Post text is required'); return; }
    if (activePlatforms.length === 0) { log('warn', 'No platforms enabled'); return; }

    setPosting(true);
    log('info', `Publishing to: ${activePlatforms.join(', ')}...`);

    try {
      const res = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: audioUrl && !videoUrl ? `${postText}\n\n🎙️ Listen: ${audioUrl}` : postText,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
          audioUrl: audioUrl || undefined,
          platforms: activePlatforms,
        }),
      });

      const data = await res.json();
      if (data.results) {
        Object.entries(data.results).forEach(([platform, status]: [string, any]) => {
          if (status.startsWith('ok') || status.startsWith('https')) {
            log('success', `✅ ${platform}: ${status === 'ok' ? 'Posted successfully' : status}`);
          } else {
            log('error', `❌ ${platform}: ${status}`);
          }
        });
        setText(''); setImageUrl(''); setVideoUrl(''); setAudioUrl('');
      } else {
        log('error', data.error || 'Unknown error');
      }
    } catch (e: any) {
      log('error', e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleGenerate = async () => {
    if (!sourceUrl.trim()) { log('warn', 'Enter a URL to generate from'); return; }
    setGenerating(true);
    setGenerateResult(null);
    log('info', `Scraping & generating post from: ${sourceUrl}`);

    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl }),
      });
      const data = await res.json();
      if (data.error) {
        log('error', data.error);
      } else {
        setGenerateResult(data);
        log('success', `AI generation started — Thread: ${data.thread_id}`);
        log('info', 'Review the generated post in LangGraph Studio before publishing');
      }
    } catch (e: any) {
      log('error', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const logColors: Record<string, string> = {
    success: 'text-green-400', error: 'text-red-400', info: 'text-blue-400',
    warn: 'text-yellow-400', system: 'text-purple-400',
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8] font-sans">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a3a2a] to-[#0f1117] border-b border-[#2c6e49] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2c6e49] rounded-xl flex items-center justify-center text-2xl">⛳</div>
          <div>
            <h1 className="text-xl font-bold text-white">Copperline Golf — Social Command Center</h1>
            <p className="text-sm text-[#d4a843]">CaddyAI Social Media Pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-green-900/30 text-green-400 border border-green-500/30">● System Ready</span>
          <span className="text-sm text-gray-400">{user.email}</span>
          <button onClick={() => signOut().then(() => router.push('/login'))}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700">
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

        {/* Platform Cards */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Connected Platforms</div>
          <div className="grid grid-cols-5 gap-4">
            {PLATFORM_CONFIG.map(p => (
              <div key={p.id} className={`bg-[#1a1d27] border border-[#2a2d3a] border-t-4 rounded-xl p-4 transition-all ${enabledPlatforms[p.id] ? 'opacity-100' : 'opacity-50'}`}
                style={{ borderTopColor: p.color }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold mb-3"
                  style={{ background: `${p.color}22`, color: p.color }}>{p.icon}</div>
                <div className="font-semibold text-white text-sm mb-1">{p.label}</div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${enabledPlatforms[p.id] ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-gray-600'}`}></span>
                  <span className="text-xs text-gray-400">{enabledPlatforms[p.id] ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="text-[11px] text-gray-500 truncate">{p.detail}</div>
                <div className="text-[11px] text-gray-600 truncate mb-3">{p.note}</div>
                <button onClick={() => togglePlatform(p.id)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${enabledPlatforms[p.id] ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${enabledPlatforms[p.id] ? 'translate-x-4' : 'translate-x-0.5'}`}></span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2 gap-6">

          {/* Left — Composer */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-[#0f1117] rounded-lg p-1">
              {([['compose','✏️ Write Post'],['media','📎 Media / Links'],['generate','🤖 AI Generate']] as [Tab,string][]).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === t ? 'bg-[#2c6e49] text-white' : 'text-gray-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Templates */}
            {tab !== 'generate' && (
              <div className="flex flex-wrap gap-2 mb-4">
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => setText(t.text)}
                    className="px-3 py-1 rounded-full text-xs bg-[#d4a84320] border border-[#d4a84350] text-[#d4a843] hover:bg-[#d4a84340]">
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* AI Generate Tab */}
            {tab === 'generate' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Paste a URL — the AI will scrape it, generate a post, and send it for review before publishing.</p>
                <input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
                  placeholder="https://golfweek.com/article/..."
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2c6e49] text-sm" />
                <button onClick={handleGenerate} disabled={generating}
                  className="w-full py-3 rounded-lg font-bold bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white transition-all">
                  {generating ? '⏳ Generating...' : '🤖 Generate Post with AI'}
                </button>
                {generateResult && (
                  <div className="bg-[#0f1117] border border-purple-800 rounded-lg p-4 text-sm space-y-2">
                    <div className="text-purple-400 font-semibold">✅ Generation started</div>
                    <div className="text-gray-400">Thread: <span className="text-cyan-400 font-mono">{generateResult.thread_id}</span></div>
                    <div className="text-gray-400">Review & approve in LangGraph Studio, then it will auto-publish.</div>
                  </div>
                )}
              </div>
            )}

            {/* Compose / Media Tabs */}
            {tab !== 'generate' && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder={tab === 'media' ? 'Caption for your media...' : 'Write your post here...'}
                    rows={6}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#2c6e49] text-sm" />
                  <div className={`text-right text-xs mt-1 ${text.length > 250 ? 'text-yellow-400' : 'text-gray-600'}`}>{text.length} / 280</div>
                </div>

                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  placeholder="🖼️ Image URL (required for Instagram)"
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#2c6e49] text-sm" />

                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="🎬 Video URL (uploads to YouTube)"
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#2c6e49] text-sm" />

                <input type="url" value={audioUrl} onChange={e => setAudioUrl(e.target.value)}
                  placeholder="🎙️ Audio URL (NotebookLM podcast — link appended to post)"
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#2c6e49] text-sm" />

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setText(''); setImageUrl(''); setVideoUrl(''); setAudioUrl(''); }}
                    className="px-5 py-2.5 rounded-lg border border-[#2a2d3a] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium">
                    Clear
                  </button>
                  <button onClick={handlePost} disabled={posting || !text.trim() || activePlatforms.length === 0}
                    className="flex-1 py-2.5 rounded-lg font-bold bg-[#2c6e49] hover:bg-[#357a52] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all text-sm">
                    {posting ? '⏳ Publishing...' : `⚡ Publish to ${activePlatforms.length} Platform${activePlatforms.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — Live Console */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-white flex items-center gap-2">💻 Live Console</div>
              <button onClick={() => setLogs([])} className="text-xs px-3 py-1 border border-[#2a2d3a] rounded text-gray-500 hover:text-white">Clear</button>
            </div>
            <div ref={consoleRef} className="bg-[#0a0c10] border border-[#2a2d3a] rounded-lg p-4 h-[420px] overflow-y-auto font-mono text-xs space-y-1">
              {logs.map((entry, i) => (
                <div key={i} className={`${logColors[entry.type]} leading-relaxed`}>
                  <span className="text-gray-600 mr-2">[{entry.time}]</span>{entry.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row — Pipeline + Config */}
        <div className="grid grid-cols-2 gap-6">

          {/* Pipeline Architecture */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <div className="font-semibold text-white mb-4">⚙️ Pipeline Architecture</div>
            <div className="flex items-center justify-center gap-3 py-4 flex-wrap">
              {[['Source / URL','Trigger','bg-blue-900/30 border-blue-700/50 text-blue-400'],
                ['LangGraph Agent','Generate + Approve','bg-purple-900/30 border-purple-700/50 text-purple-400'],
                ['Platforms','Publish','bg-green-900/30 border-green-700/50 text-green-400']].map(([title, sub, cls], i, arr) => (
                <>
                  <div key={title} className={`border rounded-lg px-4 py-2 text-center text-sm font-semibold ${cls}`}>
                    {title}<br/><span className="text-xs opacity-60 font-normal">{sub}</span>
                  </div>
                  {i < arr.length - 1 && <span key={`arrow-${i}`} className="text-gray-600 text-lg">→</span>}
                </>
              ))}
            </div>
            <div className="mt-4 space-y-0 divide-y divide-white/5 text-sm">
              {[['Scheduled','Cron via LangGraph Cloud'],['Manual CLI','yarn generate_post'],['Slack Webhook','#social channel trigger'],['This Dashboard','Direct API calls']].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2.5">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-cyan-400 font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* API Config */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <div className="font-semibold text-white mb-4">🔑 API Configuration</div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Active Credentials</div>
            <div className="space-y-0 divide-y divide-white/5 text-sm">
              {[['Twitter API Key','30P4Q8...h2W1U'],['LinkedIn Token','AQW46E...LNMPA'],['Meta Page Token','EAANE...cRJ2mk'],['Slack Bot Token','xoxb-...MnPIp'],['Anthropic API','sk-ant-...SwAA'],['LangSmith','lsv2_pt_...aece'],['FireCrawl','fc-0fab...e0e']].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-cyan-400 font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-0 divide-y divide-white/5 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-gray-500">YouTube</span>
                <span className="text-green-400 text-xs">OAuth done — upload client ready</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">TikTok</span>
                <span className="text-yellow-400 text-xs">OAuth routes live — pending review</span>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <div className="font-semibold text-white mb-4">📖 How This Works</div>
          <div className="grid grid-cols-3 gap-6 text-sm text-gray-400 leading-relaxed">
            <div><strong className="text-white block mb-1">This Dashboard</strong>Posts directly via the Copperline Social API. Write a post, toggle platforms, and hit Publish. Add an image URL for Instagram. Add a video URL to upload to YouTube. Paste a NotebookLM audio link to append to posts.</div>
            <div><strong className="text-white block mb-1">AI Pipeline</strong>The full LangGraph agent scrapes URLs, generates posts with Claude, finds images via FireCrawl, and routes through human approval before publishing. Use the AI Generate tab to kick off a run.</div>
            <div><strong className="text-white block mb-1">Token Refresh</strong>LinkedIn tokens expire ~60 days. Meta tokens are long-lived. Twitter & Slack tokens are permanent. YouTube uses a permanent refresh token. Run <code className="text-cyan-400">npx tsx scripts/youtube-auth.ts</code> to regenerate YouTube tokens.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
