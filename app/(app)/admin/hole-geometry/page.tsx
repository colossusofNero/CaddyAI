'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Download, Upload, Trash2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/hooks/useAuth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { loadHoleGeometry } from '@/lib/api/holeGeometry';
import type {
  HoleGeometryState,
  EditMode,
} from '@/components/admin/HoleGeometryEditor';

const HoleGeometryEditor = dynamic(
  () => import('@/components/admin/HoleGeometryEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center text-text-secondary">
        Loading map…
      </div>
    ),
  }
);

const DEFAULT_CENTER: [number, number] = [33.5921, -111.9082]; // mid Starfire King #1
const DEFAULT_STATE: HoleGeometryState = {
  teeBoxes: [],
  greenCenter: null,
  greenPolygon: [],
  fairwayPolygon: [],
  hazards: [],
};

export default function HoleGeometryAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [courseId, setCourseId] = useState('starfire-king');
  const [holeNumber, setHoleNumber] = useState(1);
  const [par, setPar] = useState(5);

  const [state, setState] = useState<HoleGeometryState>(DEFAULT_STATE);
  const [mode, setMode] = useState<EditMode>('idle');
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const activeHazardIndex =
    mode === 'hazard-sand' || mode === 'hazard-water'
      ? state.hazards.length > 0 &&
        state.hazards[state.hazards.length - 1].type ===
          (mode === 'hazard-sand' ? 'sand' : 'water')
        ? state.hazards.length - 1
        : null
      : null;

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const existing = await loadHoleGeometry(courseId, holeNumber);
      if (!existing) {
        setMsg({ kind: 'info', text: `No existing geometry for ${courseId}_h${holeNumber} — starting fresh.` });
        setState(DEFAULT_STATE);
        return;
      }
      setState({
        teeBoxes: existing.teeBoxes ?? [],
        greenCenter: existing.greenCenter ?? null,
        greenPolygon: existing.greenPolygon ?? [],
        fairwayPolygon: existing.fairwayPolygon ?? [],
        hazards: existing.hazards ?? [],
      });
      setPar(existing.par ?? 4);
      // Center the map on the green
      if (existing.greenCenter) {
        setCenter([existing.greenCenter.latitude, existing.greenCenter.longitude]);
      }
      setMsg({ kind: 'info', text: `Loaded ${courseId}_h${holeNumber}.` });
    } catch (err) {
      setMsg({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Load failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!app) {
      setMsg({ kind: 'error', text: 'Firebase app not initialized' });
      return;
    }
    if (state.teeBoxes.length === 0) {
      setMsg({ kind: 'error', text: 'Place at least one tee box' });
      return;
    }
    if (!state.greenCenter) {
      setMsg({ kind: 'error', text: 'Place the green center pin' });
      return;
    }
    if (state.greenPolygon.length < 3) {
      setMsg({ kind: 'error', text: 'Green polygon needs at least 3 vertices' });
      return;
    }
    if (state.fairwayPolygon.length < 3) {
      setMsg({ kind: 'error', text: 'Fairway polygon needs at least 3 vertices' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const fn = httpsCallable<unknown, { holeId: string }>(
        getFunctions(app),
        'saveHoleGeometry'
      );
      const { data } = await fn({
        courseId,
        holeNumber,
        par,
        teeBoxes: state.teeBoxes,
        greenCenter: state.greenCenter,
        greenPolygon: state.greenPolygon,
        fairwayPolygon: state.fairwayPolygon,
        hazards: state.hazards,
      });
      setMsg({ kind: 'info', text: `Saved /courseHoles/${data.holeId}` });
    } catch (err) {
      setMsg({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const clear = (target: 'fairway' | 'green' | 'hazards' | 'all') => {
    if (target === 'fairway') setState({ ...state, fairwayPolygon: [] });
    if (target === 'green') setState({ ...state, greenPolygon: [] });
    if (target === 'hazards') setState({ ...state, hazards: [] });
    if (target === 'all') setState(DEFAULT_STATE);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Hole Geometry</h1>

          <div className="flex items-center gap-2 ml-4">
            <label className="text-xs text-text-secondary">course</label>
            <input
              className="px-2 py-1 text-sm rounded border border-border bg-card w-44"
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              placeholder="starfire-king"
            />
            <label className="text-xs text-text-secondary">hole</label>
            <input
              type="number"
              min={1}
              max={18}
              className="px-2 py-1 text-sm rounded border border-border bg-card w-16"
              value={holeNumber}
              onChange={e => setHoleNumber(Number(e.target.value))}
            />
            <label className="text-xs text-text-secondary">par</label>
            <input
              type="number"
              min={3}
              max={6}
              className="px-2 py-1 text-sm rounded border border-border bg-card w-14"
              value={par}
              onChange={e => setPar(Number(e.target.value))}
            />
            <Button onClick={load} disabled={loading} variant="outline" size="sm" className="gap-1">
              <Download className="w-3.5 h-3.5" />
              {loading ? 'Loading…' : 'Load'}
            </Button>
            <Button onClick={save} disabled={saving} variant="primary" size="sm" className="gap-1">
              <Upload className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-secondary uppercase mr-2">Mode:</span>
          <ModeButton mode={mode} setMode={setMode} value="idle" label="Pan" color="#6b7280" />
          <ModeButton mode={mode} setMode={setMode} value="tee" label="Set tee" color="#eab308" />
          <ModeButton mode={mode} setMode={setMode} value="green-center" label="Set pin" color="#ef4444" />
          <ModeButton mode={mode} setMode={setMode} value="fairway" label="Add fairway pts" color="#22c55e" />
          <ModeButton mode={mode} setMode={setMode} value="green" label="Add green pts" color="#15803d" />
          <ModeButton mode={mode} setMode={setMode} value="hazard-sand" label="+ Sand" color="#eab308" />
          <ModeButton mode={mode} setMode={setMode} value="hazard-water" label="+ Water" color="#3b82f6" />

          <div className="ml-auto flex items-center gap-1 text-xs">
            <button onClick={() => clear('fairway')} className="px-2 py-1 rounded border border-border hover:border-red-400 text-text-secondary">
              <Trash2 className="w-3 h-3 inline mr-1" /> fairway
            </button>
            <button onClick={() => clear('green')} className="px-2 py-1 rounded border border-border hover:border-red-400 text-text-secondary">
              <Trash2 className="w-3 h-3 inline mr-1" /> green
            </button>
            <button onClick={() => clear('hazards')} className="px-2 py-1 rounded border border-border hover:border-red-400 text-text-secondary">
              <Trash2 className="w-3 h-3 inline mr-1" /> hazards
            </button>
            <button onClick={() => clear('all')} className="px-2 py-1 rounded border border-border hover:border-red-400 text-text-secondary">
              <Trash2 className="w-3 h-3 inline mr-1" /> all
            </button>
          </div>
        </div>

        {msg && (
          <div className={`max-w-7xl mx-auto px-4 pb-3 text-xs ${msg.kind === 'error' ? 'text-red-500' : 'text-text-secondary'}`}>
            {msg.text}
          </div>
        )}
      </nav>

      <div className="flex-1 min-h-0">
        <div className="h-[calc(100vh-180px)] min-h-[400px] relative">
          <HoleGeometryEditor
            state={state}
            onChange={setState}
            mode={mode}
            activeHazardIndex={activeHazardIndex}
            center={center}
          />
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 rounded-lg shadow-lg px-3 py-2 text-xs text-gray-800 max-w-xs">
            <div className="font-semibold mb-1">Tips</div>
            <ul className="space-y-0.5">
              <li>Click the map to add a vertex (when a polygon mode is active).</li>
              <li>Drag any vertex to move it.</li>
              <li>Right-click a vertex to delete it.</li>
              <li>Yellow dashed line is the tee → pin target line.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  mode,
  setMode,
  value,
  label,
  color,
}: {
  mode: EditMode;
  setMode: (m: EditMode) => void;
  value: EditMode;
  label: string;
  color: string;
}) {
  const active = mode === value;
  return (
    <button
      onClick={() => setMode(value)}
      className={`px-2.5 py-1 rounded text-xs border transition-colors ${
        active ? 'bg-primary text-white border-primary' : 'bg-card text-text-primary border-border hover:border-primary'
      }`}
    >
      <span
        className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
        style={{ background: color }}
      />
      {label}
    </button>
  );
}
