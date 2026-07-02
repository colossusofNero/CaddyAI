/**
 * Feature flags for functionality that isn't finished yet.
 *
 * Everything here defaults to `false` (hidden) so users never hit a dead
 * button, a stub CTA, or an unbuilt "mock content" page. When a feature is
 * actually built, flip its flag to `true` to re-expose the UI — no need to
 * dig the markup back out of git.
 */
export const FEATURES = {
  // --- Marketing pages built from hardcoded mock content (hidden from nav) ---
  marketingBlog: false,
  marketingCareers: false,
  marketingCommunity: false,
  marketingTutorials: false,
  marketingPress: false,
  marketingDocs: false,
  marketingIntegrations: false,

  // --- In-app controls that aren't wired up yet ---
  historyExportShare: false, // History page Export / Share buttons
  featureModalCta: false, // primary CTA on the feature-preview modals (Close still works)
  settingsVoiceAssistant: false, // Settings → Preferences voice-assistant toggle
  settingsFriendRequests: false, // Settings → Preferences accept-friend-requests toggle
  courseGetDirections: false, // course detail "Get Directions"

  // --- Marketing/legal CTAs that go nowhere yet ---
  helpSupportActions: false, // help page: live chat / email support / contact cards
  gdprDataRequests: false, // gdpr: submit data request / download my data
  cookiePreferences: false, // cookies: "Manage Cookie Preferences"
} as const;

/**
 * Footer/nav paths to hide while their pages are still mock content. Filter any
 * nav list against this set: `links.filter(l => !isNavHidden(l.href))`.
 */
const HIDDEN_NAV_PATHS = new Set<string>(
  [
    !FEATURES.marketingBlog && '/blog',
    !FEATURES.marketingCareers && '/careers',
    !FEATURES.marketingCommunity && '/community',
    !FEATURES.marketingTutorials && '/tutorials',
    !FEATURES.marketingPress && '/press',
    !FEATURES.marketingDocs && '/docs',
    !FEATURES.marketingIntegrations && '/integrations',
  ].filter((p): p is string => typeof p === 'string')
);

/** True when a nav path should be hidden (matches with or without a locale prefix). */
export function isNavHidden(href: string): boolean {
  if (!href) return false;
  // Strip a leading locale segment like /en or /es so /en/blog also matches.
  const path = href.replace(/^\/[a-z]{2}(?=\/)/, '');
  return HIDDEN_NAV_PATHS.has(path) || HIDDEN_NAV_PATHS.has(href);
}
