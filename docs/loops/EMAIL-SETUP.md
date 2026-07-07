# Loops email setup — full spec

This is the checklist to get every lifecycle email flowing. The **code side is
done** (see "What the code now does"). Your remaining work is in the **Loops
dashboard** (build templates + automations) and setting a few **env vars /
secrets**. Everything is best-effort in code — a missing template or key just
means that one email stays dormant; nothing breaks.

Two mechanisms, so you know which is which:
- **Transactional** = the code calls Loops with a *template ID* + data. You build the template, copy its transactional ID into an env var/secret.
- **Automation ("Loop")** = built entirely in Loops, triggered when a contact is created or a property changes. No template ID / no code — it just reads the contact properties the code already syncs.

---

## 1. Env vars / secrets

`LOOPS_API_KEY` is required everywhere. The transactional IDs live wherever that
send runs — **Vercel** for the Next.js webhook, **Firebase Functions secrets**
for the Cloud Functions.

| Key | Where to set it | Used by |
|---|---|---|
| `LOOPS_API_KEY` | **Vercel** (env) **and** Firebase Functions (secret) | all upserts + sends |
| `LOOPS_PAYMENT_FAILED_TXN_ID` | **Vercel** (env) | dunning email (Stripe webhook) |
| `LOOPS_SHARE_ROUND_TXN_ID` | Firebase Functions secret | share-round email |
| `LOOPS_CADDY_RECAP_TXN_ID` | Firebase Functions secret | abandoned-round recap |

- Vercel: Project `copperlinegolf` → Settings → Environment Variables.
- Functions: `firebase functions:secrets:set LOOPS_CADDY_RECAP_TXN_ID` (repeat per key), then redeploy the functions.
- **Prereq to verify:** confirm `LOOPS_API_KEY` is set in **Vercel** — the new webhook/promo/profile syncs run there. If it's missing, those upserts silently no-op.

---

## 2. Transactional templates to build in Loops

For each: create a Transactional email in Loops, add the listed **data variables**
(exact names — they're what the code sends), set the subject, then copy the
template's transactional ID into the env var above.

### a) Share Round — `LOOPS_SHARE_ROUND_TXN_ID`
- **Ready-made HTML:** `docs/loops/share-round-email.html` (paste into Loops' code editor).
- **Subject:** `{{senderName}} shared a round on CopperLine Golf`
- **Data variables (12):** senderName, senderEmail, recipientName, courseName, courseDate, courseLocation, scoreTotal, scorePar, scoreOverUnder, shotsPlotted, message, ctaUrl

### b) Caddy Recap (abandoned-round win-back) — `LOOPS_CADDY_RECAP_TXN_ID`
- **Subject:** `Your round at {{courseName}} — here's what your caddy saw`
- **Data variables (7):** playerName, courseName, date, totalAsks, holesEngaged, highlight, recapUrl
  - NB: it's `playerName`, **not** `firstName` — Loops reserves `firstName` as a contact property and rejects it as a transactional data variable.
- **Body gist:** "Hi {{playerName}} — you asked your caddy {{totalAsks}} times across {{holesEngaged}} holes at {{courseName}} on {{date}}. {{highlight}}. Finish logging your round →  {{recapUrl}}."

### c) Payment Failed (dunning) — `LOOPS_PAYMENT_FAILED_TXN_ID`
- **Subject:** `Your CopperLine Golf payment didn't go through`
- **Data variables (3):** amountDue, currency, updatePaymentUrl
- **Body gist:** "We couldn't process your {{currency}} {{amountDue}} payment. Update your card to keep Pro →  {{updatePaymentUrl}}. We'll retry automatically."

> Want branded HTML (like the share-round one) for (b) and (c)? Ask and I'll generate them.

---

## 3. Loops automations ("Loops") to build — no code needed

These fire off contact properties the code already syncs. Build each as a Loop
in the dashboard with the given trigger.

| Automation | Trigger (contact property) | Notes |
|---|---|---|
| **Welcome** | Contact **created** | Optionally branch on `signupSource` = `organic` / `qr` / `promo` for different copy. |
| **Finish onboarding** | `profileComplete` = true (or `onboardingComplete` = true) | Nudge to explore analytics / import clubs. |
| **Clubs nudge** (optional) | `clubsComplete` = false after N days | "Add your clubs for accurate distances." |
| **Trial started** | `subscriptionStatus` = `trialing` | Confirmation + what Pro unlocks. |
| **Trial ending** | Date-based on `trialEndDate` (send ~3 days before) | Loops supports scheduling relative to a date property. |
| **Win-back** | `subscriptionStatus` = `canceled` | Offer to resubscribe. |

---

## 4. What the code now does (done — commit forthcoming)

Contact **upserts** (feed the automations above):
- **Every signup** → `functions/src/index.ts onUserCreated` (all platforms) sets userId + name.
- **Onboarding finish** → `onboarding/page.tsx` sets profileComplete/onboarding + golf profile.
- **Profile save** → `profile/page.tsx` now syncs `profileComplete`. *(new)*
- **Clubs save** → `clubs/page.tsx` now syncs `clubsComplete`. *(new)*
- **Promo/QR redeem** → `api/promo/redeem` now sets `signupSource` (`qr` if the promo doc has `signupSource:'qr'`, else `promo`) + `promoCode`. *(new)*
- **Stripe webhook** → on subscription create/update/cancel, syncs `subscriptionStatus`, `subscriptionPlan`, `trialEndDate` onto the contact (resolves email via Admin Auth). *(new — this was the missing linchpin)*

Transactional **sends**:
- **Share round** (Cloud Function, already wired).
- **Caddy recap** (Cloud Function, wired; dormant until `LOOPS_CADDY_RECAP_TXN_ID` set).
- **Payment failed** (Stripe webhook, wired; dormant until `LOOPS_PAYMENT_FAILED_TXN_ID` set). *(new)*

---

## 5. Suggested order to turn things on
1. Verify `LOOPS_API_KEY` in Vercel (prereq).
2. Build the **Welcome** Loop (biggest reach, zero extra config).
3. Finish the **Share Round** template (HTML ready) + set its secret.
4. Build **Trial started / Trial ending / Win-back** Loops (all unlocked by the new webhook sync).
5. Build **Caddy Recap** + **Payment Failed** templates and set their IDs.
