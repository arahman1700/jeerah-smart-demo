# Jeerah Smart Demo — Developer Handoff

Handoff date: 2026-08-06 · Verified commit: see `git log -1` (this package matches `origin/main`)

- **Repository (full history):** https://github.com/arahman1700/jeerah-smart-demo
- **Live demo (GitHub Pages, auto-deploys from `main`):** https://arahman1700.github.io/jeerah-smart-demo/

## 1. What this is

A production-quality, **frontend-only** demo of the Jeerah Smart residential community platform:
an installable bilingual (Arabic RTL / English LTR) resident PWA plus a responsive admin console,
sharing one local dataset that syncs live across tabs. There is **no backend**: state lives in
IndexedDB behind a repository abstraction, and every payment is **visibly simulated** — no real
card fields exist anywhere and no money ever moves.

| Surface | URL |
|---|---|
| Launcher (entry page) | `/` |
| Resident app (demo sign-in: `admin` / `admin`) | `/?surface=app` |
| Resident app in device frame | `/?preview=1` |
| Admin console | `/?surface=admin` (sections via hash, e.g. `#/marketplace`) |

## 2. Run, test, release

```bash
npm ci                  # Node >= 22
npm run dev             # local dev server
npm run test:run        # full Vitest suite (303 tests / 21 files, all green at handoff)
npm run verify:release  # every release gate + GitHub Pages artifact safety checks
```

Deployment is automatic: push to `main` → `.github/workflows/pages.yml` runs `verify:release`
and publishes `dist/client` to GitHub Pages. Never force-push.

## 3. Architecture (all app code under `src/jeerah/`)

```
src/
├── mobile/                 PROTECTED device-preview runtime — never edit (see §5)
└── jeerah/
    ├── app/                Surface routing (routeMode), launcher, demo login, theme, SurfacePortal
    ├── domain/             models.ts (types + actions) · reducer.ts (pure, validating)
    │                       fixtures.ts (deterministic fictional seed) · selectors/format/ids
    ├── data/               IndexedDB repository + BroadcastChannel sync + scenarios
    │                       (stale persisted state auto-reseeds; see repository.ts guard)
    ├── i18n/               Typed ar/en message contract — every key exists in both locales
    ├── design/             JeerahLogo (official lockups via measured crop), BrandIcon,
    │                       PaymentBrand(+Strip), serviceIconMap, tokens.css
    ├── resident/           FlowStack app: home, properties, expenses + simulated payments,
    │                       marketplace (8 families / 35 services), orders, community,
    │                       wallet, chats, notifications, join-code, profile
    ├── pwa/                Manifest/install prompt/registerServiceWorker
    └── admin/              React Router console: dashboard, properties/units/residents,
                            finance/payments/orders, marketplace, publishing, messages,
                            subscriptions, visitors & amenities, analytics, audit, settings
scripts/                    verify-assets, verify-demo, generate-sw, fix-pages-base, runtime lock
docs/superpowers/plans/     The original implementation plan (context for every decision)
tests/jeerah/               303 tests: domain, UI journeys, live-twin sync, a11y, PWA, release
```

Key mechanisms worth reading first:
- `domain/reducer.ts` — every mutation validates and commits atomically; illegal actions return
  the same state reference (no revision).
- `data/repository.ts` — IndexedDB + cross-tab sync; the **live twin** (resident and admin see
  each other's changes instantly) rests on this. Also reseeds incompatible persisted snapshots.
- `app/routeMode.ts` + `JeerahPrototype.tsx` — surface selection, demo login gate, theme.
- `scripts/generate-sw.mjs` — the service worker is generated from the final hashed build output.

## 4. State at handoff — done and verified

Tasks 6–12 of the plan plus several extension rounds are complete, live, and test-covered:
resident home/properties, safe simulated payment journey (Apple Pay / mada `1234` demo code /
Visa / Mastercard, receipts stamped "Demo transaction — no money was charged"), marketplace with
exactly 35 services in 8 families (search with Arabic aliases, compare, instant/scheduled/
recurring/quote/group booking, subscriber offers), community (announcements, polls, events, QR
visitor passes, amenities, neighbor gifts), wallet with simulated top-ups, provider chats with
scripted replies, notifications, join-by-code, member building creation, full admin console with
derived KPIs and audit log + CSV export, Scenario Studio (typed-RESET reset that keeps locale),
installable PWA with offline reads, dark/light theme, launcher + local demo sign-in.

Verification at handoff: `npm run verify:release` exit 0 · 303/303 tests · runtime integrity
28/28 protected files · asset validator 43/43 controlled assets · live URL checked in a real
browser (both surfaces, both locales, both themes).

## 5. Hard constraints — keep these true

1. **Protected runtime:** never edit `src/mobile/*`, `src/App.tsx`, `src/main.tsx`,
   `src/styles.css`, `vite.config.ts`, `worker/index.js`, `scripts/prepare-sites-build.mjs`,
   `public/assets/{iphone,android,status}/*`. `npm run check:runtime` must stay green.
2. **Official identity only:** brand files under `public/brand/` are the approved archive —
   do not redraw or replace them. `scripts/verify-assets.mjs` pins the public inventory at
   exactly 43 files and checks hashes; update it consciously if assets must change.
3. **Payment safety:** demo methods only, fixed masks (mada 4455, Visa 4242, Mastercard 5105),
   the visible mada demo code `1234`, and the no-charge disclaimer on every receipt. Never add
   real card/CVV/OTP fields; never weaken the payment tests.
4. **Fictional data only** — people, buildings, providers, emails (`*.example.demo`).
5. **i18n contract:** every message key exists in Arabic and English; tests fail on raw keys.
6. All 303 tests stay green; add tests for new behavior; no `.only`/skips.

## 6. Suggested roadmap (what a real product needs next)

1. **Backend & auth** — replace the local demo gate (`admin`/`admin` in `app/LoginPage.tsx`)
   with real authentication; swap `data/repository.ts` internals for an API client (the
   repository interface is the seam — UI and reducer can stay).
2. **Real payment gateway** (mada / Apple Pay / cards) behind the existing journey UI.
3. **Real-time chat** — replace the scripted provider replies in `chat/message-sent`.
4. **Wallet settlement** — real top-ups; the simulated ledger is in `walletTransactions`.
5. **Push notifications** — the in-app feed derives from state; wire Web Push.
6. **Provider portal** and **platform-level admin** (user suspension, commissions,
   subscription billing) — the reference product has these; the demo's admin is the
   building-manager persona.
7. Production hardening: monitoring, error reporting, real analytics, WCAG audit.

## 7. Conventions

TypeScript strict; React 19 function components; Phosphor Duotone icons only (no emoji, no
hand-drawn SVG); logical CSS properties for RTL; design tokens in `design/tokens.css` with theme
overrides keyed off `body[data-jeerah-theme]`; conventional commits (`feat:`/`fix:`/`docs:`).
