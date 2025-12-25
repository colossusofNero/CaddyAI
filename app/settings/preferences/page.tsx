/**
 * Preferences Settings Page
 * Comprehensive user preferences management
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { firebaseService } from '@/services/firebaseService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { PreferencesDocument, DEFAULT_PREFERENCES } from '@/src/types/preferences';
import {
  Settings,
  Bell,
  Shield,
  Monitor,
  Mic,
  Save,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

type TabType = 'general' | 'notifications' | 'privacy' | 'display' | 'voice';

export default function PreferencesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [preferences, setPreferences] = useState<Omit<PreferencesDocument, 'userId' | 'createdAt' | 'updatedAt'>>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userPrefs = await firebaseService.getUserPreferences(user.uid);

        if (userPrefs) {
          setPreferences({
            units: userPrefs.units,
            appearance: userPrefs.appearance,
            notifications: userPrefs.notifications,
            display: userPrefs.display,
            privacy: userPrefs.privacy,
            accessibility: userPrefs.accessibility,
            customShotNames: userPrefs.customShotNames,
            version: userPrefs.version,
          });
          setIsFirstTimeSetup(false);
        } else {
          // First time setup
          setPreferences(DEFAULT_PREFERENCES);
          setIsFirstTimeSetup(true);
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Handle save
  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      await firebaseService.updateUserPreferences(user.uid, preferences);

      setShowSuccess(true);
      setHasChanges(false);
      setIsFirstTimeSetup(false);

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Update preference and mark as changed
  const updatePreference = <T extends keyof Omit<PreferencesDocument, 'userId' | 'createdAt' | 'updatedAt'>>(
    category: T,
    field: string,
    value: string | boolean | number
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] as unknown as Record<string, unknown>),
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'privacy' as TabType, label: 'Privacy', icon: Shield },
    { id: 'display' as TabType, label: 'Display', icon: Monitor },
    { id: 'voice' as TabType, label: 'Voice', icon: Mic },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ja', label: '日本語' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg"></div>
              <span className="text-2xl font-bold text-primary">Copperline Golf</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Preferences</h1>
          <p className="text-text-secondary">
            Customize your Copperline Golf experience
          </p>
          {isFirstTimeSetup && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary rounded-lg flex items-start gap-3">
              <Settings className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-primary font-medium">First Time Setup</p>
                <p className="text-primary/80 text-sm mt-1">
                  Review and customize your preferences below, then click Save to get started.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success font-medium">Preferences saved successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-error font-medium">Error</p>
              <p className="text-error/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          {/* Desktop Sidebar / Mobile Tabs */}
          <div className="lg:block hidden">
            <div className="sticky top-8 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-secondary-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'bg-secondary-800 text-text-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-start-2">
            {/* General Settings */}
            {activeTab === 'general' && (
              <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold text-text-primary mb-6">General Settings</h2>

                <div className="space-y-6">
                  {/* Unit System */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Unit System
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="unitSystem"
                          value="yards"
                          checked={preferences.units.distance === 'yards'}
                          onChange={(e) => updatePreference('units', 'distance', e.target.value)}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-text-primary">Yards</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="unitSystem"
                          value="meters"
                          checked={preferences.units.distance === 'meters'}
                          onChange={(e) => updatePreference('units', 'distance', e.target.value)}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-text-primary">Meters</span>
                      </label>
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Theme
                    </label>
                    <div className="flex gap-4">
                      {['light', 'dark', 'system'].map((theme) => (
                        <label key={theme} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="theme"
                            value={theme}
                            checked={preferences.appearance.theme === theme}
                            onChange={(e) => updatePreference('appearance', 'theme', e.target.value)}
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <span className="text-text-primary capitalize">{theme}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Language
                    </label>
                    <select
                      value={preferences.appearance.language}
                      onChange={(e) => updatePreference('appearance', 'language', e.target.value)}
                      className="w-full md:w-64 px-4 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {languages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto-sync */}
                  <div className="pt-4 border-t border-secondary-700">
                    <Switch
                      checked={true} // Sync is always enabled in unified schema
                      onCheckedChange={(checked) => {}} // No-op: sync is automatic
                      label="Auto-sync"
                      description="Automatically sync data across devices"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Notifications</h2>

                <div className="space-y-4">
                  <Switch
                    checked={preferences.notifications.courseRecommendations}
                    onCheckedChange={(checked) => updatePreference('notifications', 'courseRecommendations', checked)}
                    label="Round reminders"
                    description="Get notified before scheduled rounds"
                  />

                  <Switch
                    checked={preferences.notifications.practiceReminders}
                    onCheckedChange={(checked) => updatePreference('notifications', 'practiceReminders', checked)}
                    label="Practice suggestions"
                    description="Receive weekly practice recommendations"
                  />

                  <Switch
                    checked={preferences.notifications.achievementAlerts}
                    onCheckedChange={(checked) => updatePreference('notifications', 'achievementAlerts', checked)}
                    label="Achievement notifications"
                    description="Get notified when you reach new milestones"
                  />

                  <Switch
                    checked={preferences.notifications.weeklyStats}
                    onCheckedChange={(checked) => updatePreference('notifications', 'weeklyStats', checked)}
                    label="Weekly stats summary"
                    description="Receive weekly performance summaries via email"
                  />

                  <div className="pt-4 border-t border-secondary-700" />

                  <Switch
                    checked={preferences.notifications.pushEnabled}
                    onCheckedChange={(checked) => updatePreference('notifications', 'pushEnabled', checked)}
                    label="Push notifications"
                    description="Enable push notifications on mobile app"
                  />

                  <Switch
                    checked={preferences.notifications.emailEnabled}
                    onCheckedChange={(checked) => updatePreference('notifications', 'emailEnabled', checked)}
                    label="Email notifications"
                    description="Receive notifications via email"
                  />
                </div>
              </Card>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Privacy Settings</h2>

                <div className="space-y-6">
                  {/* Profile Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Profile Visibility
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'public', label: 'Public', desc: 'Anyone can view your profile' },
                        { value: 'friends', label: 'Friends Only', desc: 'Only friends can view your profile' },
                        { value: 'private', label: 'Private', desc: 'Only you can view your profile' },
                      ].map((option) => (
                        <label key={option.value} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-secondary-800">
                          <input
                            type="radio"
                            name="profileVisibility"
                            value={option.value}
                            checked={preferences.privacy.profileVisibility === option.value}
                            onChange={(e) => updatePreference('privacy', 'profileVisibility', e.target.value)}
                            className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                          />
                          <div>
                            <div className="text-text-primary font-medium">{option.label}</div>
                            <div className="text-text-muted text-sm">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-secondary-700 space-y-4">
                    <Switch
                      checked={preferences.privacy.shareStatistics}
                      onCheckedChange={(checked) => updatePreference('privacy', 'shareStatistics', checked)}
                      label="Allow sharing"
                      description="Allow others to share your rounds and statistics"
                    />

                    <Switch
                      checked={preferences.privacy.shareLocation}
                      onCheckedChange={(checked) => updatePreference('privacy', 'shareLocation', checked)}
                      label="Location services"
                      description="Enable GPS tracking for course detection and weather"
                    />

                    <Switch
                      checked={false}
                      onCheckedChange={(checked) => {}} // Feature not in unified schema
                      label="Accept friend requests"
                      description="Allow others to send you friend requests"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Display Settings */}
            {activeTab === 'display' && (
              <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Display Settings</h2>

                <div className="space-y-4">
                  <Switch
                    checked={preferences.display.showLandingZones}
                    onCheckedChange={(checked) => updatePreference('display', 'showLandingZones', checked)}
                    label="Show landing zones"
                    description="Display recommended landing zones on course maps"
                  />

                  <Switch
                    checked={preferences.display.showWindIndicator}
                    onCheckedChange={(checked) => updatePreference('display', 'showWindIndicator', checked)}
                    label="Show wind indicator"
                    description="Display wind direction and speed"
                  />

                  <Switch
                    checked={preferences.display.showElevationChange}
                    onCheckedChange={(checked) => updatePreference('display', 'showElevationChange', checked)}
                    label="Show elevation changes"
                    description="Display elevation data on course maps"
                  />

                  <Switch
                    checked={preferences.display.show3DFlyover}
                    onCheckedChange={(checked) => updatePreference('display', 'show3DFlyover', checked)}
                    label="Enable 3D flyover"
                    description="Enable 3D course visualization when available"
                  />

                  <Switch
                    checked={preferences.display.autoRotateMap}
                    onCheckedChange={(checked) => updatePreference('display', 'autoRotateMap', checked)}
                    label="Auto-rotate map"
                    description="Automatically rotate map to match your direction"
                  />
                </div>
              </Card>
            )}

            {/* Voice Settings */}
            {activeTab === 'voice' && (
              <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Voice Settings</h2>

                <div className="space-y-6">
                  <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                    <div className="flex items-start gap-3">
                      <Mic className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-primary font-medium">ElevenLabs Voice Assistant</p>
                        <p className="text-primary/80 text-sm mt-1">
                          Get AI-powered voice recommendations during your rounds. Voice features are available with Pro and Tour subscriptions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 opacity-50 pointer-events-none">
                    <Switch
                      checked={false}
                      onCheckedChange={() => {}}
                      label="Voice assistant"
                      description="Enable voice recommendations during rounds"
                    />

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-3">
                        Voice Speed
                      </label>
                      <div className="flex gap-4">
                        {['slow', 'normal', 'fast'].map((speed) => (
                          <label key={speed} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="voiceSpeed"
                              value={speed}
                              checked={speed === 'normal'}
                              disabled
                              className="w-4 h-4 text-primary focus:ring-primary"
                            />
                            <span className="text-text-primary capitalize">{speed}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-3">
                        Voice Language
                      </label>
                      <select
                        disabled
                        className="w-full md:w-64 px-4 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-text-primary"
                      >
                        <option>Match language settings</option>
                      </select>
                      <p className="text-xs text-text-muted mt-2">
                        Voice language automatically matches your selected language
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-secondary-700">
                    <Link href="/pricing">
                      <Button variant="primary" size="md" className="w-full sm:w-auto">
                        Upgrade to Enable Voice Features
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-secondary-700 p-4 lg:hidden">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSave}
          disabled={!hasChanges || saving}
          loading={saving}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Desktop Save Button */}
      <div className="hidden lg:block fixed bottom-8 right-8">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          loading={saving}
          className="shadow-xl"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        {hasChanges && (
          <p className="text-xs text-text-muted text-center mt-2">
            You have unsaved changes
          </p>
        )}
      </div>
    </div>
  );
}
