import React, { useEffect, useState } from "react";
import type {
  PlayerProfile,
  Handed,
  ShotShape,
  Flight,
} from "../hooks/usePlayerProfiles";
import { X, Plus, Trash2, Check } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  profiles: PlayerProfile[];
  current?: PlayerProfile;

  selectProfile: (id: string) => void;
  createProfile: (template?: Partial<PlayerProfile>) => string;
  deleteProfile: (id: string) => void;
  updateProfile: (patch: Partial<PlayerProfile>) => void;
};

export default function PlayerProfileModal({
  isOpen,
  onClose,
  profiles,
  current,
  selectProfile,
  createProfile,
  deleteProfile,
  updateProfile,
}: Props) {
  // Local editable form state mirrors the current profile
  const [name, setName] = useState(current?.name ?? "");
  const [handed, setHanded] = useState<Handed>(current?.handed ?? "right");
  const [shotShape, setShotShape] = useState<ShotShape>(
    (current?.shotShape as ShotShape) ?? "straight"
  );
  const [flight, setFlight] = useState<Flight>(
    (current?.flight as Flight) ?? "mid"
  );
  const [handicap, setHandicap] = useState<number>(current?.handicap ?? 10);

  // Sync local state when the selected profile changes or when modal opens
  useEffect(() => {
    if (!current) return;
    setName(current.name);
    setHanded(current.handed);
    setShotShape(current.shotShape);
    setFlight(current.flight);
    setHandicap(current.handicap);
  }, [current?.id, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle overlay click and ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const onSave = () => {
    // Persist editable fields into the current profile
    updateProfile({
      name,
      handed,
      shotShape,
      flight,
      handicap: Number.isFinite(handicap) ? handicap : 10,
    });
    onClose();
  };

  const onCreate = () => {
    const id = createProfile();
    selectProfile(id);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      aria-describedby="profile-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2
              id="profile-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Player profile
            </h2>
            <p
              id="profile-desc"
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              Select, create, or edit your profile details.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Profiles list */}
          <aside className="md:col-span-1 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Profiles
              </h3>
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs hover:bg-black"
              >
                <Plus size={14} />
                New
              </button>
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
              {profiles.map((p) => {
                const active = p.id === current?.id;
                return (
                  <div
                    key={p.id}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer border ${
                      active
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => selectProfile(p.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {active ? (
                        <Check
                          size={14}
                          className="text-blue-600 dark:text-blue-400 shrink-0"
                        />
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                      )}
                      <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                        {p.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete profile "${p.name}"?`)) {
                          deleteProfile(p.id);
                        }
                      }}
                      className="opacity-70 hover:opacity-100 text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {profiles.length === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  No profiles yet.
                </div>
              )}
            </div>
          </aside>

          {/* Editor */}
          <section className="md:col-span-2 p-4">
            {current ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSave();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Name
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      placeholder="My Profile"
                    />
                  </label>

                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Handicap
                    <input
                      type="number"
                      value={Number.isFinite(handicap) ? handicap : 10}
                      onChange={(e) =>
                        setHandicap(
                          Number.isFinite(Number(e.target.value))
                            ? Number(e.target.value)
                            : 10
                        )
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    />
                  </label>

                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Handed
                    <select
                      value={handed}
                      onChange={(e) => setHanded(e.target.value as Handed)}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </label>

                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Preferred shot shape
                    <select
                      value={shotShape}
                      onChange={(e) =>
                        setShotShape(e.target.value as ShotShape)
                      }
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <option value="straight">Straight</option>
                      <option value="draw">Draw</option>
                      <option value="fade">Fade</option>
                    </select>
                  </label>

                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Typical flight
                    <select
                      value={flight}
                      onChange={(e) => setFlight(e.target.value as Flight)}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <option value="low">Low</option>
                      <option value="mid">Mid</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Select or create a profile to edit.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
