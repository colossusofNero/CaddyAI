'use client';

/**
 * Launch Monitor Import — Review & Approve
 *
 * Upload a Garmin/Trackman session export, see each suggested change to your
 * bag, and apply only the ones you approve. Nothing is written to Firestore
 * until you commit the accepted changes.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Upload, Check, X } from 'lucide-react';
import Link from 'next/link';
import { firebaseService } from '@/services/firebaseService';
import type { Club, ClubFace } from '@/src/types/clubs';
import { CLUB_LIST } from '@/src/types/clubs';
import {
  parseLaunchMonitorFile,
  aggregateShots,
  buildChangeSets,
  type AggregatedClub,
  type ClubChangeSet,
  type ChangeField,
  type MeasuredSource,
} from '@/lib/launchMonitorImport';

const FACE_OPTIONS: ClubFace[] = ['Square', 'Draw', 'Fade'];

// key for per-field accept / edit state
const cellKey = (label: string, field: ChangeField) => `${label}::${field}`;

export default function ImportLaunchMonitorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentClubs, setCurrentClubs] = useState<Club[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedClub[] | null>(null);
  const [source, setSource] = useState<MeasuredSource>('garmin');
  const [summary, setSummary] = useState<{ rows: number; clubs: number } | null>(null);

  // user overrides
  const [mapping, setMapping] = useState<Record<string, string>>({}); // sourceLabel -> clubId
  const [accepted, setAccepted] = useState<Record<string, boolean>>({}); // cellKey -> bool (default true)
  const [edited, setEdited] = useState<Record<string, number | string>>({}); // cellKey -> override value

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Load current bag
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const doc = await firebaseService.getUserClubs(user.uid);
        if (doc && doc.clubs.length > 0) {
          setCurrentClubs(
            doc.clubs.map((c) => ({
              ...c,
              rollYards: c.rollYards ?? 5,
              totalYards: c.carryYards + (c.rollYards ?? 5),
            }))
          );
        } else {
          setCurrentClubs([]);
        }
      } catch (err) {
        console.error('Failed to load clubs:', err);
        setError('Failed to load your current clubs.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setParsing(true);
      setError(null);
      setSuccess(null);
      setAggregated(null);
      setMapping({});
      setAccepted({});
      setEdited({});

      const parsed = await parseLaunchMonitorFile(file);
      if (parsed.errors.length > 0) {
        setError(parsed.errors.join('\n'));
        return;
      }
      const agg = aggregateShots(parsed.shots);
      if (!agg.length) {
        setError('No usable shots were found in this file.');
        return;
      }
      setAggregated(agg);
      setSource(parsed.source);
      setSummary({ rows: parsed.rowsParsed, clubs: agg.length });
    } catch (err) {
      console.error('Failed to parse launch monitor file:', err);
      setError('Failed to read the file. Please upload a valid CSV or Excel export.');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Apply mapping overrides onto the aggregated stats, then diff against the bag.
  const changeSets: ClubChangeSet[] = useMemo(() => {
    if (!aggregated) return [];
    const remapped = aggregated.map((a) => {
      const overrideId = mapping[a.sourceLabel];
      if (!overrideId) return a;
      if (overrideId === '__skip__') return { ...a, clubId: null, clubName: null };
      const def = CLUB_LIST.find((c) => c.id === overrideId);
      return def ? { ...a, clubId: def.id, clubName: def.name } : a;
    });
    return buildChangeSets(remapped, currentClubs);
  }, [aggregated, mapping, currentClubs]);

  const isAccepted = useCallback(
    (label: string, field: ChangeField) => accepted[cellKey(label, field)] !== false,
    [accepted]
  );

  const acceptedCount = useMemo(() => {
    let n = 0;
    for (const cs of changeSets) {
      if (mapping[cs.sourceLabel] === '__skip__' || !cs.clubId) continue;
      for (const ch of cs.changes) if (isAccepted(cs.sourceLabel, ch.field)) n++;
    }
    return n;
  }, [changeSets, mapping, isAccepted]);

  const handleApply = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setError(null);

      const byId = new Map<string, Club>(currentClubs.map((c) => [c.id, { ...c }]));
      const nowIso = new Date().toISOString();
      let applied = 0;

      for (const cs of changeSets) {
        if (!cs.clubId || mapping[cs.sourceLabel] === '__skip__') continue;
        const accepts = cs.changes.filter((ch) => isAccepted(cs.sourceLabel, ch.field));
        if (!accepts.length) continue;

        const club = byId.get(cs.clubId) ?? baseClubFor(cs.clubId);

        for (const ch of accepts) {
          const override = edited[cellKey(cs.sourceLabel, ch.field)];
          const value = override !== undefined && override !== '' ? override : ch.newValue;
          applyField(club, ch.field, value);
          applied++;
        }
        club.totalYards = club.carryYards + club.rollYards;
        club.measuredAt = nowIso;
        club.measuredSource = source;
        byId.set(cs.clubId, club);
      }

      if (applied === 0) {
        setError('No changes selected to apply.');
        setSaving(false);
        return;
      }

      const next = Array.from(byId.values())
        .map(stripUndefined)
        .sort((a, b) => b.totalYards - a.totalYards);

      await firebaseService.updateUserClubs(user.uid, next);
      setSuccess(
        `Applied ${applied} change${applied === 1 ? '' : 's'} across your bag. Taking you to your clubs…`
      );
      setCurrentClubs(next);
      setAggregated(null);
      setSummary(null);

      // Send them to the clubs & shots section to review the updated bag.
      setTimeout(() => router.push('/clubs'), 1500);
    } catch (err) {
      console.error('Failed to apply changes:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/clubs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clubs
              </Button>
            </Link>
            <span className="text-lg font-semibold text-text-primary">Import from Launch Monitor</span>
            <div className="w-28" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {success && (
          <div className="mb-6 p-4 bg-green-600 border border-green-700 rounded-lg flex items-center justify-between">
            <p className="text-white font-semibold">{success}</p>
            <Link href="/clubs">
              <Button variant="outline" size="sm">View bag</Button>
            </Link>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-600 border border-red-700 rounded-lg">
            <p className="text-white text-center whitespace-pre-line font-semibold">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-white hover:text-red-200 mt-2 block mx-auto underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload */}
        <Card variant="default" padding="lg" className="mb-6">
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  Upload a session export
                </h3>
                <p className="text-sm text-text-secondary">
                  Garmin (Approach R10 / Garmin Golf) or Trackman CSV / Excel. We average each
                  club&apos;s shots, drop obvious mishits, and show you every suggested change before
                  anything is saved.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFile}
                className="hidden"
              />
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={parsing}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {parsing ? 'Reading…' : 'Choose file'}
              </Button>
            </div>
            {summary && (
              <p className="text-xs text-text-muted mt-3">
                Parsed {summary.rows} shots across {summary.clubs} club{summary.clubs === 1 ? '' : 's'}.
                Review the suggestions below.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Review */}
        {changeSets.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {changeSets.map((cs) => (
                <ClubReviewCard
                  key={cs.sourceLabel}
                  changeSet={cs}
                  mapping={mapping[cs.sourceLabel]}
                  onMap={(clubId) =>
                    setMapping((m) => ({ ...m, [cs.sourceLabel]: clubId }))
                  }
                  isAccepted={isAccepted}
                  onToggle={(field, on) =>
                    setAccepted((a) => ({ ...a, [cellKey(cs.sourceLabel, field)]: on }))
                  }
                  editedValue={(field) => edited[cellKey(cs.sourceLabel, field)]}
                  onEdit={(field, value) =>
                    setEdited((e) => ({ ...e, [cellKey(cs.sourceLabel, field)]: value }))
                  }
                />
              ))}
            </div>

            <div className="flex items-center justify-between sticky bottom-4 bg-secondary-800 border border-secondary-700 rounded-lg p-4 shadow-xl shadow-black/50">
              <span className="text-sm text-text-secondary">
                {acceptedCount} change{acceptedCount === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/clubs')}
                  className="px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || acceptedCount === 0}
                  onClick={handleApply}
                  className="px-6 py-3 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Applying…' : `Apply ${acceptedCount} change${acceptedCount === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// Per-club review card
// ============================================================================

function ClubReviewCard({
  changeSet: cs,
  mapping,
  onMap,
  isAccepted,
  onToggle,
  editedValue,
  onEdit,
}: {
  changeSet: ClubChangeSet;
  mapping: string | undefined;
  onMap: (clubId: string) => void;
  isAccepted: (label: string, field: ChangeField) => boolean;
  onToggle: (field: ChangeField, on: boolean) => void;
  editedValue: (field: ChangeField) => number | string | undefined;
  onEdit: (field: ChangeField, value: number | string) => void;
}) {
  const skipped = mapping === '__skip__';
  const unmatched = !cs.clubId;
  const dropped = cs.shotsTotal - cs.shotsUsed;

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader
        title={
          cs.clubName
            ? `${cs.clubName}  ·  from “${cs.sourceLabel}”`
            : `“${cs.sourceLabel}” — needs a club`
        }
        description={
          `Averaged ${cs.shotsUsed} of ${cs.shotsTotal} shots` +
          (dropped > 0 ? ` · ${dropped} mishit${dropped === 1 ? '' : 's'} dropped` : '') +
          (cs.existsInBag ? '' : unmatched ? '' : ' · new club (not in bag yet)')
        }
      />
      <CardContent>
        {unmatched && !skipped && (
          <div className="mb-4 p-3 bg-secondary-800 rounded-lg border border-secondary-700">
            <label className="block text-xs font-medium text-text-muted mb-1">
              We couldn&apos;t auto-match this label. Map it to a club:
            </label>
            <select
              value={mapping ?? ''}
              onChange={(e) => onMap(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a club…</option>
              {CLUB_LIST.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__skip__">Skip this club</option>
            </select>
          </div>
        )}

        {skipped ? (
          <p className="text-sm text-text-muted italic">Skipped — won&apos;t be imported.</p>
        ) : unmatched ? null : cs.changes.length === 0 ? (
          <p className="text-sm text-text-muted italic">
            No changes — your current values already match this session.
          </p>
        ) : (
          <div className="space-y-2">
            {cs.changes.map((ch) => {
              const on = isAccepted(cs.sourceLabel, ch.field);
              const override = editedValue(ch.field);
              return (
                <div
                  key={ch.field}
                  className={`flex flex-wrap items-center gap-3 p-3 rounded-lg border transition-colors ${
                    on ? 'bg-secondary-800 border-secondary-700' : 'bg-secondary-900 border-secondary-800 opacity-60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggle(ch.field, !on)}
                    className={`w-6 h-6 rounded flex items-center justify-center border ${
                      on ? 'bg-primary border-primary text-white' : 'border-secondary-600 text-transparent'
                    }`}
                    title={on ? 'Accepted — click to reject' : 'Rejected — click to accept'}
                  >
                    {on ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 text-text-muted" />}
                  </button>

                  <span className="w-40 text-sm font-medium text-text-primary">
                    {ch.label}
                    {ch.isNew && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        new
                      </span>
                    )}
                  </span>

                  <span className="text-sm text-text-muted">
                    {ch.oldValue === undefined ? '—' : `${ch.oldValue}${unitSuffix(ch.unit)}`}
                  </span>
                  <span className="text-text-muted">→</span>

                  {ch.field === 'face' ? (
                    <select
                      disabled={!on}
                      value={(override as string) ?? (ch.newValue as string)}
                      onChange={(e) => onEdit(ch.field, e.target.value)}
                      className="w-28 px-3 py-2 bg-secondary-900 border border-secondary-700 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      {FACE_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        disabled={!on}
                        value={override !== undefined ? override : (ch.newValue as number)}
                        onChange={(e) => onEdit(ch.field, Number(e.target.value))}
                        className="w-24 px-3 py-2 bg-secondary-900 border border-secondary-700 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      />
                      <span className="text-xs text-text-muted whitespace-nowrap">{ch.unit}</span>
                    </div>
                  )}

                  {typeof ch.oldValue === 'number' && typeof ch.newValue === 'number' && (
                    <span
                      className={`text-xs ml-auto font-medium ${
                        ch.newValue - ch.oldValue > 0 ? 'text-green-400' : 'text-amber-400'
                      }`}
                    >
                      {ch.newValue - ch.oldValue > 0 ? '+' : ''}
                      {Math.round((ch.newValue - ch.oldValue) * 10) / 10} {ch.unit}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// helpers
// ============================================================================

function unitSuffix(unit: string): string {
  return unit ? ` ${unit}` : '';
}

function baseClubFor(clubId: string): Club {
  const def = CLUB_LIST.find((c) => c.id === clubId);
  return {
    id: clubId,
    name: def?.name ?? clubId,
    face: 'Square',
    carryYards: 0,
    rollYards: 0,
    totalYards: 0,
    sortOrder: def?.sortOrder ?? 99,
    isDefault: false,
    isActive: true,
    loft: def?.defaultLoft,
    category: def?.category,
  };
}

function applyField(club: Club, field: ChangeField, value: number | string) {
  switch (field) {
    case 'face':
      club.face = value as ClubFace;
      break;
    case 'carryYards':
      club.carryYards = Number(value);
      break;
    case 'rollYards':
      club.rollYards = Number(value);
      break;
    case 'carryStdDevYards':
      club.carryStdDevYards = Number(value);
      break;
    case 'lateralDispersionYards':
      club.lateralDispersionYards = Number(value);
      break;
    case 'curveYards':
      club.curveYards = Number(value);
      break;
    case 'apexFeet':
      club.apexFeet = Number(value);
      break;
  }
}

/** Firestore setDoc rejects undefined values — drop any undefined keys. */
function stripUndefined(club: Club): Club {
  const out = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(club)) {
    if (v !== undefined) out[k] = v;
  }
  return out as unknown as Club;
}
