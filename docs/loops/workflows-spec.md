# CopperLine Golf — Loops Workflows spec

Build these as **Workflows** (and two Campaigns) in Loops. They fire off the
**contact properties the code syncs** — no transactional IDs, no per-send data.

**Properties available to trigger on:** `firstName`, `signupSource` (organic|qr|promo),
`profileComplete` (bool), `onboardingComplete` (bool), `clubsComplete` (bool),
`subscriptionStatus` (trialing|active|canceled|past_due|…), `subscriptionPlan`
(pro|free), `trialEndDate` (ISO date), plus `handicap`, `skillLevel`, etc.

**Personalization:** `{{firstName}}` and other properties work in Workflow/Campaign
emails (unlike transactional). **URLs:** download `/download` · onboarding
`/onboarding` · clubs `/clubs` · dashboard `/dashboard` · subscription
`/settings/subscription` · pricing `/pricing`.

⚠️ **While testing:** also add the audience filter **`email is scott.roelofs@rcgvaluation.com`**
to every workflow so nothing reaches real users (belt-and-suspenders with the
`LOOPS_TEST_ONLY_EMAILS` code guard).

---

## 1. Welcome
- **Trigger:** Contact created
- **Send:** immediately
- **Subject:** Welcome to CopperLine Golf, {{firstName}} 👋
- **Body:**
  > Hey {{firstName}}, welcome to CopperLine Golf — your AI caddie and shot-analytics companion.
  > Three quick wins to start:
  > • Set up your player profile so recommendations are dialed in
  > • Add your clubs + carry distances
  > • Play a round with the app and watch your shot data come to life
  > **[Get started →]** (/dashboard)
  > Questions? Just reply — a real person reads these.

## 2. Onboarding drip
- **Trigger:** Contact created (run alongside Welcome; or gate on `profileComplete = true` for engaged-only)
- **Steps** (delay measured from signup):
  - **Day 1 — Subject:** Your first step: set your player profile
    > The 5-question profile (hand, handicap, shot shape, height) is what makes your caddy's advice accurate. ~60 seconds. **[Complete profile →]** (/onboarding)
  - **Day 2 — Subject:** Dial in your bag 🏌️
    > Add your clubs and typical carry distances so every recommendation fits your game. **[Set up clubs →]** (/clubs)
  - **Day 3 — Subject:** Meet your AI caddie
    > On the course, tap the caddie for a club + target on any shot — it factors wind, elevation, and your distances. **[See how it works →]** (/download)
  - **Day 5 — Subject:** Your shots, mapped
    > After a round, your Round Summary shows a hole-by-hole map and dispersion chart. **[Explore analytics →]** (/dashboard)
  - **Day 7 — Subject:** One week in — how's it going?
    > The players who improve fastest log a few rounds in week one. Got a round in yet? **[Open CopperLine →]** (/dashboard) — reply with any feedback.
  - **Day 10 — Subject:** Share a round with your coach
    > Send any round's dispersion chart to a coach or PGA pro straight from the app. **[Try it →]** (/dashboard)
  - **Day 14 — Subject:** You're getting the hang of it
    > Two weeks in! Keep logging rounds — your trends and handicap sharpen with every one. **[See your progress →]** (/dashboard)
- *You can fold Welcome in as the Day-0 step of this same workflow if you prefer one flow.*

## 3. Pro welcome (trial started)
- **Trigger:** Contact updated → `subscriptionStatus` is `trialing` (or `subscriptionPlan` is `pro`)
- **Send:** immediately
- **Subject:** You're in — CopperLine Pro is unlocked 🎉
- **Body:**
  > {{firstName}}, your Pro trial is live. You now have:
  > • Unlimited AI club recommendations
  > • Real-time weather + wind + elevation adjustments
  > • Full shot tracking, dispersion & analytics
  > • Unlimited course access
  > Make it count — play a round this week. **[Open CopperLine →]** (/dashboard)
  > You won't be charged until your trial ends. **[Manage subscription →]** (/settings/subscription)

## 4. Trial ending — 3 days (trail-t3)
- **Trigger:** 3 days **before** `trialEndDate` (date-based)
- **Subject:** Your CopperLine Pro trial ends in 3 days
- **Body:**
  > Heads up, {{firstName}} — your Pro trial ends in 3 days, then it converts to a paid plan so nothing interrupts your game.
  > Keeping Pro? Nothing to do. Want to change or cancel? **[Manage subscription →]** (/settings/subscription)
  > On the fence? Play one more round and check your dispersion trends — that's where Pro pays off.

## 5. Trial ending — 1 day (trail-t1)
- **Trigger:** 1 day **before** `trialEndDate`
- **Subject:** Your Pro trial ends tomorrow
- **Body:**
  > Last reminder, {{firstName}} — your CopperLine Pro trial ends tomorrow and your plan begins. Keep everything as-is to stay Pro, or make changes here. **[Manage subscription →]** (/settings/subscription)

## 6. Renewal  ⚠️ needs a small code add
- **Trigger:** ~7 days **before** `renewalDate` (date-based)
- **Blocker:** the code syncs `trialEndDate` but **not** `currentPeriodEnd`. To power this I'll add `renewalDate` (= currentPeriodEnd) to the webhook sync (~2 lines). Say the word.
- **Subject:** Your CopperLine Pro renews in 7 days
- **Body:**
  > {{firstName}}, your Pro plan renews on {{renewalDate}}. No action needed to continue. Want to switch plans or cancel? **[Manage subscription →]** (/settings/subscription)

## 7. Canceled
- **Trigger:** Contact updated → `subscriptionStatus` is `canceled`
- **Send:** immediately
- **Subject:** Sorry to see you go, {{firstName}}
- **Body:**
  > Your CopperLine Pro has ended and you're back on the free plan. Your rounds and data are still here whenever you want them.
  > Mind telling us why you left? Just reply — it genuinely helps.
  > Changed your mind? Restart Pro anytime. **[See plans →]** (/pricing)

## 8. Win-back
- **Trigger:** Contact updated → `subscriptionStatus` is `canceled`, then **wait 21 days** → send
- **Subject:** Come back and finish what you started ⛳
- **Body:**
  > {{firstName}}, it's been a few weeks. Your CopperLine data is still waiting, and we've shipped improvements since you left.
  > Give Pro another look — pick up right where you left off. **[Restart Pro →]** (/pricing)

---

## Campaigns (manual broadcasts, not workflows)
- **newsletter**, **Feature Release** → send as Campaigns to your audience when you have news.

## Leave to Firebase (not Loops)
- **verification**, **password-reset** → already sent by Firebase Auth. Don't wire these.

## Not covered — need new data the app doesn't sync yet
- **First Round**, **ten rounds**, **30-day Inactive**, **round-recap** → require round-count / last-activity signals synced to Loops. Real work; tell me if you want them and I'll add the sync + spec them.

## Order they fire across a lifecycle
Welcome → Onboarding drip (d1–14) → Pro welcome (on trial) → Trial-3d → Trial-1d → Renewal (recurring) → Canceled → Win-back (+21d).
