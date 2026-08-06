# Jeerah Smart Demo — Release Handoff

Released: 2026-08-06 (Asia/Riyadh) · Verified release commit: `f72b459`

## Links

| What | URL |
|---|---|
| Repository | https://github.com/arahman1700/jeerah-smart-demo |
| Live demo (GitHub Pages) | https://arahman1700.github.io/jeerah-smart-demo/ |
| Resident — device preview | https://arahman1700.github.io/jeerah-smart-demo/?preview=1 |
| Resident — full screen | https://arahman1700.github.io/jeerah-smart-demo/?surface=app |
| Admin console | https://arahman1700.github.io/jeerah-smart-demo/?surface=admin |

## ⚠️ Demo disclaimer

All people, buildings, providers, invoices, and payments are fictional. Payments are visibly
simulated — «عملية تجريبية — لم يتم الخصم» / "Demo transaction — no money was charged." The app
never asks for a real card number, CVV, bank credential, or OTP; the mada demo code is the openly
displayed `1234`.

## Install

- **Android (Chrome):** open the demo → browser menu → *Install app* (or the in-app Install screen button).
- **iPhone (Safari):** open the demo → *Share* → *Add to Home Screen*.

## Verification at release

- Vitest: **287 passed / 287** across 20 files (`npm run test:run`).
- `npm run verify:release`: runtime integrity (28 protected files), TypeScript, Pages build,
  asset validator (24 brand roles, 18 photos, 3 icons, official mada SVG — 43 controlled assets),
  base-safety checks on `dist/client` — all green, exit 0.
- Live checks on the deployed URL: resident AR/EN + RTL/LTR, payment journey to the no-charge
  receipt, marketplace (8 families / 35 services / subscriber offers), admin console (13 sections,
  derived KPIs), hash deep-link refresh, manifest OK, service worker activated at the Pages scope
  with 56 precached entries, stale-IndexedDB visitors reseeded safely.

## Reset

Admin → Settings → Scenario Studio → type `RESET` → Reset demo (keeps the visitor's language).
