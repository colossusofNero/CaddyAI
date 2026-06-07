/**
 * Dashboard navigation crawler.
 *
 * Signs in using a Firebase custom token minted with the Admin SDK (no
 * password required — works fine for Google-SSO accounts). Starts at
 * /dashboard, walks every internal link, and for each page records:
 *   - all <button> + <a href=...> with their visible label and href
 *   - flags disabled controls, dead links, external links
 *   - captures console errors / uncaught exceptions
 *
 * Output: audit-reports/dashboard-audit-<timestamp>.{md,json}
 *
 * Usage:
 *   node scripts/audit-dashboard.mjs \
 *     [--uid <firebaseUid>] [--base http://localhost:3010] [--max 80] [--headed]
 *
 * Default uid = AUDIT_UID env var, falling back to the project's primary
 * test user uid baked in below.
 */

import { config } from 'dotenv';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp as initAdminApp, cert, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

config({ path: '.env.local' });

const args = process.argv.slice(2);
const BASE = (args.find(a => a.startsWith('--base='))?.split('=')[1]) ?? 'http://localhost:3010';
const MAX_PAGES = Number(args.find(a => a.startsWith('--max='))?.split('=')[1] ?? '80');
const HEADED = args.includes('--headed');
const DEFAULT_UID = 'ZOR4qaBeDeUQL9X7bfjUTyaTyIo2';
const uid =
  (args.find(a => a.startsWith('--uid='))?.split('=')[1]) ??
  process.env.AUDIT_UID ??
  DEFAULT_UID;

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!sa) {
  console.error('FIREBASE_SERVICE_ACCOUNT missing from .env.local — needed to mint a custom token.');
  process.exit(1);
}
if (!getAdminApps().length) {
  initAdminApp({ credential: cert(JSON.parse(sa)) });
}
const customToken = await getAdminAuth().createCustomToken(uid);
console.log(`[audit] minted custom token for uid=${uid.slice(0, 10)}…`);

const REPORT_DIR = 'audit-reports';
mkdirSync(REPORT_DIR, { recursive: true });

// ---------- Crawl ----------
const visited = new Set(); // path
const queue = ['/dashboard'];
const rows = []; // per-page records

function isInternalHref(href) {
  if (!href) return false;
  if (href.startsWith('/') && !href.startsWith('//')) return true;
  if (href.startsWith(BASE)) return true;
  return false;
}
function toPath(href) {
  if (!href) return null;
  try {
    if (href.startsWith('/')) return href.split('#')[0].split('?')[0];
    const u = new URL(href, BASE);
    if (u.origin !== BASE) return null;
    return u.pathname;
  } catch {
    return null;
  }
}
function isExternal(href) {
  return /^https?:\/\//.test(href ?? '') && !href.startsWith(BASE);
}
function isJunkLink(href) {
  if (!href) return false;
  return href === '#' || href.startsWith('javascript:') || href === '';
}

const browser = await chromium.launch({ headless: !HEADED });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

console.log(`[audit] base = ${BASE}`);

// ---------- Login via custom token ----------
// 1. Land on /login first so the Firebase web SDK initializes and exposes
//    the dev-only __authTestHooks on window.
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

// 2. Wait for the test hook to appear.
await page.waitForFunction(
  () => Boolean(window.__authTestHooks),
  { timeout: 15000 }
).catch(() => {
  throw new Error(
    'Test hook __authTestHooks not found on window. Make sure NODE_ENV is development.'
  );
});

// 3. Sign in via Firebase Auth using the custom token from Admin SDK.
await page.evaluate(async (token) => {
  await window.__authTestHooks.signInWithCustomToken(token);
}, customToken);
console.log(`[audit] signed in via custom token`);

// 4. useAuth listens to Firebase auth state and sets the 'auth-token' cookie.
//    Wait until that cookie is present before navigating — otherwise middleware
//    bounces us back to /login.
await page.waitForFunction(
  () => document.cookie.split('; ').some(c => c.startsWith('auth-token=1')),
  { timeout: 10000 }
).catch(() => {
  throw new Error('auth-token cookie never set after custom-token sign-in.');
});

// 5. Now navigate to /dashboard. Use domcontentloaded — networkidle won't
//    settle on Firestore-heavy pages (live snapshot subscriptions).
// Capture the subscription API response for diagnostic purposes.
page.on('response', async (resp) => {
  const url = resp.url();
  if (url.includes('/api/stripe/subscription')) {
    const status = resp.status();
    let text = '';
    try { text = await resp.text(); } catch { text = '(unreadable)'; }
    console.log(`[audit] /api/stripe/subscription → ${status}: ${text.slice(0, 500)}`);
  }
});
await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2500);
const postLoginUrl = page.url();
console.log(`[audit] post-login url: ${postLoginUrl}`);
if (postLoginUrl.includes('/login')) {
  console.error('[audit] still on /login after token sign-in.');
  await page.screenshot({ path: join(REPORT_DIR, 'login-fail.png') });
  await browser.close();
  process.exit(2);
}

// ---------- BFS crawl ----------
while (queue.length && visited.size < MAX_PAGES) {
  const path = queue.shift();
  if (visited.has(path)) continue;
  visited.add(path);

  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); };
  const onPageError = (e) => pageErrors.push(String(e?.message ?? e));
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  let finalUrl = '';
  let httpStatus = 0;
  let title = '';
  try {
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    httpStatus = resp?.status() ?? 0;
    // Let the page hydrate and render any client-side UI before scraping controls.
    await page.waitForTimeout(1500);
    finalUrl = page.url();
    title = await page.title();
  } catch (err) {
    rows.push({
      path,
      finalUrl,
      status: 'navigation-error',
      error: String(err?.message ?? err),
      consoleErrors,
      pageErrors,
      controls: [],
    });
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    continue;
  }

  // Skip if we got redirected away (e.g. /login) — implies the route is
  // gated or doesn't exist as we expected.
  const finalPath = new URL(finalUrl).pathname;
  const redirected = finalPath !== path;

  // Enumerate clickable controls
  const controls = await page.evaluate(() => {
    function visibleText(el) {
      return (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    }
    function tagOrigin(el) {
      // Find a nearest meaningful container (header, nav, h1/h2, role attr)
      let cur = el;
      const trail = [];
      while (cur && cur !== document.body && trail.length < 4) {
        const tag = cur.tagName?.toLowerCase();
        const role = cur.getAttribute?.('role');
        const dataT = cur.getAttribute?.('data-testid');
        if (role || dataT || ['nav', 'header', 'aside', 'main', 'section', 'form'].includes(tag)) {
          trail.unshift(role || dataT || tag);
        }
        cur = cur.parentElement;
      }
      return trail.join(' › ');
    }
    const out = [];
    document.querySelectorAll('a[href], button, [role=button]').forEach(el => {
      const rect = el.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 &&
        window.getComputedStyle(el).visibility !== 'hidden' &&
        window.getComputedStyle(el).display !== 'none';
      if (!visible) return;
      const isLink = el.tagName.toLowerCase() === 'a';
      const href = isLink ? el.getAttribute('href') : null;
      const disabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
      out.push({
        kind: isLink ? 'link' : 'button',
        label: visibleText(el),
        href,
        disabled,
        context: tagOrigin(el),
      });
    });
    return out;
  });

  // Classify each control
  const classified = controls.map(c => {
    let status = 'ok';
    if (c.disabled) status = 'disabled';
    if (c.kind === 'link') {
      if (!c.href) status = 'no-href';
      else if (isJunkLink(c.href)) status = 'dead-link';
      else if (isExternal(c.href)) status = 'external';
    }
    if (c.kind === 'button' && !c.label) status = 'no-label-button';
    return { ...c, status };
  });

  // Queue new internal links
  for (const c of classified) {
    if (c.kind !== 'link') continue;
    if (c.status !== 'ok' && c.status !== 'disabled') continue;
    const p = toPath(c.href);
    if (!p) continue;
    if (visited.has(p) || queue.includes(p)) continue;
    // Skip auth churn pages
    if (/^\/(login|logout|signup|start-trial)/.test(p)) continue;
    queue.push(p);
  }

  rows.push({
    path,
    finalUrl,
    redirected: redirected ? finalPath : null,
    httpStatus,
    title,
    consoleErrors,
    pageErrors,
    controls: classified,
  });

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  console.log(
    `[${visited.size.toString().padStart(2)} / ${queue.length + visited.size}] ${path}  →  ` +
    `${redirected ? `redirected to ${finalPath}` : `${httpStatus}`}  · controls=${classified.length}  ` +
    `· console-errors=${consoleErrors.length}`
  );
}

await browser.close();

// ---------- Report ----------
const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);

// JSON dump
writeFileSync(
  join(REPORT_DIR, `dashboard-audit-${ts}.json`),
  JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), rows }, null, 2)
);

// Markdown summary
const md = [];
md.push(`# Dashboard audit — ${ts}`);
md.push('');
md.push(`Base: \`${BASE}\``);
md.push(`Pages visited: ${rows.length} (max ${MAX_PAGES})`);
md.push('');

// Findings: pages that errored / redirected / had console errors
const problems = rows.filter(r => r.redirected || r.consoleErrors.length || r.pageErrors.length || r.status === 'navigation-error');
md.push(`## Problems (${problems.length})`);
if (!problems.length) md.push('_None._');
for (const r of problems) {
  md.push(`### \`${r.path}\``);
  if (r.redirected) md.push(`- redirected to \`${r.redirected}\``);
  if (r.status === 'navigation-error') md.push(`- navigation error: ${r.error}`);
  if (r.consoleErrors.length) {
    md.push(`- ${r.consoleErrors.length} console error(s):`);
    for (const e of r.consoleErrors.slice(0, 5)) md.push(`  - \`${e.slice(0, 200)}\``);
  }
  if (r.pageErrors.length) {
    md.push(`- ${r.pageErrors.length} uncaught page error(s):`);
    for (const e of r.pageErrors.slice(0, 5)) md.push(`  - \`${e.slice(0, 200)}\``);
  }
  md.push('');
}

// Suspicious controls across the site
md.push(`## Suspicious controls`);
const flagged = [];
for (const r of rows) {
  for (const c of r.controls) {
    if (['dead-link', 'no-href', 'no-label-button'].includes(c.status)) {
      flagged.push({ ...c, page: r.path });
    }
  }
}
md.push(`Total flagged: ${flagged.length}`);
md.push('');
md.push('| page | kind | label | href | status | context |');
md.push('|---|---|---|---|---|---|');
for (const f of flagged.slice(0, 200)) {
  md.push(`| \`${f.page}\` | ${f.kind} | ${f.label || '_(empty)_'} | \`${f.href ?? ''}\` | ${f.status} | ${f.context} |`);
}
md.push('');

// Per-page detail
md.push(`## Per-page details`);
for (const r of rows) {
  md.push(`### \`${r.path}\` → ${r.finalUrl}  (${r.httpStatus})`);
  md.push(`Title: ${r.title || '_(none)_'}`);
  if (r.redirected) md.push(`Redirected to: \`${r.redirected}\``);
  md.push('');
  md.push(`Controls: ${r.controls.length}`);
  if (r.controls.length) {
    md.push('');
    md.push('| kind | label | href | status | context |');
    md.push('|---|---|---|---|---|');
    for (const c of r.controls) {
      md.push(`| ${c.kind} | ${c.label || '_(empty)_'} | \`${c.href ?? ''}\` | ${c.status} | ${c.context} |`);
    }
  }
  md.push('');
}

const mdPath = join(REPORT_DIR, `dashboard-audit-${ts}.md`);
writeFileSync(mdPath, md.join('\n'));

console.log(`\n[audit] Done.`);
console.log(`[audit] Report: ${mdPath}`);
