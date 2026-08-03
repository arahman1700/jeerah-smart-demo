# Jeerah Smart Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a polished frontend-only Jeerah Smart demo containing a resident PWA and a responsive admin console that share realistic local data and synchronize live between browser tabs.

**Architecture:** Start from the protected Product Design `mobile-app` template. Keep its device runtime intact for visual preview, while `src/Prototype.tsx` selects a resident preview, a direct full-screen resident PWA, or an admin portal without changing protected runtime files. A shared domain reducer, IndexedDB repository, and `BroadcastChannel` connect both surfaces; all external operations, including payments, remain explicit local simulations.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Product Design mobile runtime, Zustand, idb, Motion, Phosphor Icons, Simple Icons, Recharts, Zod, React Router (admin only), Vitest, Testing Library, fake-indexeddb, manual service worker, GitHub Actions, GitHub Pages.

## Global Constraints

- Preserve every protected runtime file and pass `npm run check:runtime` before preview, build, and handoff.
- Build app-owned UI in `src/Prototype.tsx`, `src/prototype.css`, and new focused modules under `src/jeerah/`.
- The accepted visual target is `docs/superpowers/specs/assets/jeerah-living-neighborhood-mobile.png`, corrected to use the official Jeerah archive and the rules in `outputs/jeerah-brand-and-service-analysis.md`.
- Resident direct mode is mobile-first; admin direct mode is desktop-first and remains usable at 390 px.
- Support `ar`/RTL and `en`/LTR for every primary route. Never expose raw translation keys.
- Copy the official Jeerah logo, pattern, favicon, PWA icons, and OFL fonts from `work/jeerah-brand-source`; never redraw, recolor, rotate, glow, or generate substitutes for them.
- Use `@phosphor-icons/react` duotone icons for product functions with a curated service-icon map. Use Simple Icons source data for Apple Pay and Visa, plus a locally stored official mada SVG from `mada.com.sa`; never redraw or generate those payment marks.
- Never collect or persist full card numbers, CVV, government IDs, or real credentials.
- Every payment receipt must state `عملية تجريبية — لم يتم الخصم` or its English equivalent.
- Use only fictional seeded people, addresses, invoices, providers, and events.
- Resident and admin state must derive from the same fixtures; no independently hard-coded KPI totals.
- Browsing cached data, changing settings, and resetting the demo work offline; payment submission, new service booking, and admin publishing are blocked offline with an actionable explanation.
- Use ImageGen-created, locally stored property and service photography with documented provenance and alt text; brand assets always come from the supplied official archive.
- Seed all 35 required service offerings, organized into eight non-overlapping families, with `scope`, `fulfillment`, and `pricingModel` metadata and at least one working action per offering.
- All meaningful motion must stop or simplify under `prefers-reduced-motion: reduce`.
- Do not invoke Playwright CLI for app QA; use Vitest plus the in-app Browser and the existing runtime integrity check.
- Public deployment defaults to `arahman1700/jeerah-smart-demo` on GitHub Pages; never commit the reference-site credentials.

## Scope Decomposition

The work is sequential rather than independent, so this plan establishes one runnable vertical slice at each task boundary:

1. Protected template and test harness.
2. Typed domain and deterministic fixtures.
3. Persistent synchronized demo engine.
4. Shared shell, localization, and visual system.
5. Official brand package plus production image assets.
6. Resident home and property journey.
7. Expense and payment golden journey.
8. Service, community, visitor, and amenity journey.
9. Admin overview and property operations.
10. Admin finance, orders, publishing, and scenario controls.
11. Installable PWA and offline behavior.
12. Accessibility, visual QA, documentation, and GitHub Pages release.

## File Map

```text
AGENTS.md                                      template rules + Jeerah durable decisions
package.json                                   dependencies and verification scripts
index.html                                     manifest/theme metadata only
public/
  manifest.webmanifest                         install metadata and app entry
  sw.js                                        offline shell and runtime cache
  icons/                                       official archive-derived PWA icons
  brand/
    logos/*.svg                                exact official Arabic/English logo variants
    patterns/*.png                             official light/dark/transparent patterns
    fonts/*.woff2                              web-converted OFL archive fonts
    favicon/*.png                              official blue/white favicon variants
  assets/
    buildings/*.webp                           exterior and shared-space imagery
    apartments/*.webp                          unit interiors
    services/*.webp                            service and maintenance imagery
  brands/mada.svg                              official mada mark from mada.com.sa
src/
  Prototype.tsx                                template-owned integration boundary
  prototype.css                                app styles and direct-surface bridge
  jeerah/
    JeerahPrototype.tsx                        chooses preview/resident/admin surface
    assets/asset-manifest.json                 importable content metadata with relative paths
    assets/brand-manifest.json                 importable identity provenance and hashes
    assets/url.ts                              BASE_URL-aware asset URL resolver
    app/SurfacePortal.tsx                      direct full-screen portal lifecycle
    app/routeMode.ts                           URL/query/display-mode selection
    design/tokens.css                          colors, spacing, type, elevation, motion
    design/fonts.css                           official Plus Jakarta/Readex/Montserrat faces
    design/BrandIcon.tsx                       Phosphor icon wrapper
    design/JeerahLogo.tsx                      exact archive asset selector by locale/background
    design/serviceIconMap.ts                   one curated Phosphor glyph per service family
    design/PaymentBrand.tsx                    official Simple Icons + mada brand renderer
    domain/models.ts                           all domain types and action union
    domain/fixtures.ts                         deterministic fictional seed records
    domain/reducer.ts                          pure state transitions
    domain/communityPulse.ts                   health score and factor explanation
    domain/serviceCatalog.ts                   taxonomy, normalized search, and service selectors
    data/channel.ts                            BroadcastChannel abstraction
    data/repository.ts                         IndexedDB load/save/reset/dispatch
    data/DemoProvider.tsx                      React store/provider/selectors
    data/scenarios.ts                          deterministic demo scenario actions
    i18n/messages.ts                           Arabic and English dictionaries
    i18n/I18nProvider.tsx                      locale, direction, and interpolation
    resident/ResidentApp.tsx                   FlowStack resident composition
    resident/ResidentNav.tsx                   fixed bottom navigation
    resident/pages/*.tsx                       resident screens
    resident/components/*.tsx                  resident-specific reusable UI
    payments/simulator.ts                      safe local payment state machine
    payments/PaymentFlow.tsx                   method/review/process/result steps
    payments/Receipt.tsx                       demo receipt and print view
    admin/AdminApp.tsx                         responsive route composition
    admin/AdminShell.tsx                       sidebar/header/content frame
    admin/pages/*.tsx                          admin screens
    admin/components/*.tsx                     tables, forms, KPIs, charts
    pwa/useInstallPrompt.ts                    install event state
    pwa/InstallPage.tsx                        platform-aware install guidance
src/test/setup.ts                              DOM, IndexedDB, and motion test setup
tests/jeerah/*.test.tsx                        behavior and accessibility tests
tests/jeerah/helpers/renderDemo.tsx            shared resident/admin test harness
scripts/verify-assets.mjs                      local asset manifest validator
.github/workflows/pages.yml                    build/test/deploy workflow
README.md                                      Arabic/English run and demo guide
CREDITS.md                                     generated assets and brand provenance
```

---

### Task 1: Initialize the Protected Template and Test Harness

**Files:**
- Create from template: `AGENTS.md`, `package.json`, `package-lock.json`, `index.html`, `src/`, `public/`, `scripts/`, `tests/`, `worker/`, `.openai/`
- Modify: `AGENTS.md`
- Modify: `.gitignore` (merge repository and template rules)
- Modify: `package.json`
- Modify: `tests/jeerah/helpers/renderDemo.tsx`
- Modify: `src/Prototype.tsx`
- Modify: `src/prototype.css`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/browserShims.ts`
- Create: `src/jeerah/JeerahPrototype.tsx`
- Test: `tests/jeerah/prototype-smoke.test.tsx`

**Interfaces:**
- Produces: default component `JeerahPrototype(): JSX.Element`.
- Produces scripts: `test`, `test:run`, `verify`, and `build:pages`.
- Preserves: `npm run check:runtime` returns exit code 0.

- [ ] **Step 1: Copy the Product Design mobile template without touching Git or existing docs**

```bash
rsync -a --exclude .git /Users/a.rahman/.codex/plugins/cache/openai-curated-remote/product-design/0.1.52/templates/mobile-app/ ./
```

- [ ] **Step 2: Record the accepted Jeerah-specific design decisions in `AGENTS.md`**

```markdown
## Jeerah Smart Product Decisions

- Match `docs/superpowers/specs/assets/jeerah-living-neighborhood-mobile.png` while applying the supplied official Jeerah identity.
- Use Deep Nexus `#191C2E`, Steel Slate `#4C558C`, Glow White `#EDFFFF`, and the official gradient. Use semantic status colors only for state feedback.
- Use archive `Readex Pro` for Arabic, `Plus Jakarta Sans` for English, and `Montserrat` only for compact numerals/contact metadata.
- Use the supplied official Jeerah logo, pattern, favicon, and app-icon files without modification.
- Use Phosphor Duotone for product icons, Simple Icons for Apple Pay and Visa, and the official mada SVG from mada.com.sa.
- `?preview=1` preserves the device preview; resident direct mode and admin mode render through an app-owned portal.
- Payment is always a labeled simulation and never accepts real card data.
- All user-facing copy ships in Arabic and English with real RTL/LTR layout.
```

- [ ] **Step 3: Add the focused runtime and test dependencies**

```bash
npm install @phosphor-icons/react idb qrcode.react react-router-dom recharts simple-icons zustand zod
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event fake-indexeddb jsdom vitest
```

Add these scripts without changing the template's protected scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "verify": "npm run check:runtime && npm run test:run && npm run build",
    "build:pages": "npm run check:runtime && tsc && vite build --base=/jeerah-smart-demo/"
  }
}
```

- [ ] **Step 4: Write the failing smoke test**

```tsx
import { render, screen } from "@testing-library/react";
import Prototype from "../../src/Prototype";
import { MobileRuntime } from "../../src/mobile/MobileRuntime";

it("renders the Jeerah prototype root", () => {
  render(<MobileRuntime><Prototype /></MobileRuntime>);
  expect(screen.getByRole("application", { name: /jeerah smart demo/i })).toBeInTheDocument();
});
```

- [ ] **Step 5: Run the test and confirm the blank template fails**

Run: `npm run test:run -- tests/jeerah/prototype-smoke.test.tsx`  
Expected: FAIL because the accessible Jeerah application root does not exist.

- [ ] **Step 6: Add the minimal Jeerah root**

```tsx
// src/jeerah/JeerahPrototype.tsx
export default function JeerahPrototype() {
  return <main role="application" aria-label="Jeerah Smart demo" className="jeerah-root" />;
}

// src/Prototype.tsx
import JeerahPrototype from "./jeerah/JeerahPrototype";
import "./prototype.css";

export default function Prototype() {
  return <JeerahPrototype />;
}
```

- [ ] **Step 7: Add Vitest setup**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    include: ["tests/jeerah/**/*.test.{ts,tsx}"],
  },
});

// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import {
  installAnimationFrameShim,
  installMatchMediaShim,
  installObjectUrlAndPrintShims,
  installPointerAndScrollShims,
  installResizeObserverShim,
  installServiceWorkerShim,
} from "./browserShims";

// Install deterministic browser shims used by the real template/components.
installMatchMediaShim();
installResizeObserverShim({ width: 1024, height: 640 });
installPointerAndScrollShims();
installAnimationFrameShim();
installObjectUrlAndPrintShims();
installServiceWorkerShim();
```

Implement those test-only helpers in `src/test/browserShims.ts`. They cover `matchMedia`, `ResizeObserver`, fixed non-zero `getBoundingClientRect()` for chart wrappers, `PointerEvent`, pointer capture/release, `scrollIntoView`, `requestAnimationFrame/cancelAnimationFrame`, `URL.createObjectURL/revokeObjectURL`, `window.print`, and `navigator.serviceWorker`. Repository tests inject their own channel rather than depending on a global `BroadcastChannel`. Expose `setTestViewport(width, height)` so responsive tests update `innerWidth`, `matchMedia`, and dispatch `resize` deterministically.

- [ ] **Step 8: Verify the runtime and smoke test**

Run: `npm run check:runtime`  
Expected: PASS with no protected file hash mismatch.

Run: `npm run test:run -- tests/jeerah/prototype-smoke.test.tsx`  
Expected: 1 test passes.

- [ ] **Step 9: Commit**

```bash
git add .gitignore .openai AGENTS.md index.html mobile-runtime.lock.json package.json package-lock.json playwright.config.ts public scripts src tests tsconfig.json vite.config.ts vitest.config.ts worker
git -c commit.gpgsign=false commit -m "chore: initialize Jeerah mobile prototype"
```

The commit must contain the complete copied template, including every protected runtime file and its lock/check script. Prove the task from a fresh temporary checkout or `git archive` extraction; a dirty working tree is not evidence that the committed bootstrap is runnable.

---

### Task 2: Define the Domain, Fixtures, and Community Pulse

**Files:**
- Create: `src/jeerah/domain/models.ts`
- Create: `src/jeerah/domain/fixtures.ts`
- Create: `src/jeerah/domain/reducer.ts`
- Create: `src/jeerah/domain/communityPulse.ts`
- Create: `src/jeerah/domain/serviceCatalog.ts`
- Create: `src/jeerah/domain/format.ts`
- Test: `tests/jeerah/domain.test.ts`

**Interfaces:**
- Produces: `DemoState`, `DemoAction`, and every entity type.
- Produces: `createSeedState(now?: Date): DemoState`.
- Produces: `reduceDemoState(state: DemoState, action: DemoAction): DemoState`.
- Produces: `calculateCommunityPulse(state: DemoState, buildingId: string): CommunityPulse`.
- Produces: `searchServiceCatalog(state, query, filters)` and validates one primary family per offering.
- Produces: deterministic `formatSar`, `formatDate`, and `normalizeSearchText` helpers shared by both surfaces.

- [ ] **Step 1: Write failing fixture and pulse tests**

```ts
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { calculateCommunityPulse } from "../../src/jeerah/domain/communityPulse";
import { reduceDemoState } from "../../src/jeerah/domain/reducer";

const state = createSeedState(new Date("2026-08-03T12:00:00+03:00"));

it("ships complete deterministic demo coverage", () => {
  expect(state.buildings).toHaveLength(4);
  expect(state.units).toHaveLength(12);
  expect(state.invoices).toHaveLength(10);
  expect(state.serviceFamilies).toHaveLength(8);
  expect(state.serviceOfferings).toHaveLength(35);
  expect(state.providers).toHaveLength(18);
  expect(state.orders).toHaveLength(18);
  expect(state.memberOffers).toHaveLength(8);
  expect(state.recurringPlans).toHaveLength(5);
  expect(state.neighborDeals).toHaveLength(3);
  expect(new Set(state.invoices.map((invoice) => invoice.status))).toEqual(
    new Set(["due", "paid", "overdue", "upcoming"]),
  );
});

it("calculates pulse from collection, maintenance, and alerts", () => {
  const pulse = calculateCommunityPulse(state, "building-89");
  expect(pulse.score).toBeGreaterThanOrEqual(70);
  expect(pulse.factors.map((factor) => factor.key)).toEqual(["collection", "maintenance", "alerts"]);
});

it("marks an invoice paid without mutating the original state", () => {
  const next = reduceDemoState(state, {
    type: "payment/recorded",
    payment: {
      id: "payment-test",
      invoiceId: "invoice-elevator",
      residentId: "resident-saif",
      method: "mada",
      status: "paid",
      amount: 700,
      occurredAt: "2026-08-03T12:00:00+03:00",
      reference: "DEMO-0001",
      last4: "4455",
    },
  });
  expect(next).not.toBe(state);
  expect(next.invoices.find((item) => item.id === "invoice-elevator")?.status).toBe("paid");
});
```

- [ ] **Step 2: Run the tests and verify missing modules fail**

Run: `npm run test:run -- tests/jeerah/domain.test.ts`  
Expected: FAIL because the domain modules do not exist.

- [ ] **Step 3: Define the state and action contracts**

```ts
export type Locale = "ar" | "en";
export type DemoScenario = "normal" | "empty" | "offline" | "overdue" | "declined" | "urgent-maintenance";
export type InvoiceStatus = "due" | "paid" | "overdue" | "upcoming";
export type PaymentMethod = "apple-pay" | "mada" | "visa";
export type PaymentStatus = "paid" | "pending" | "declined" | "cancelled" | "timed-out" | "refunded";
export type LocalizedText = { ar: string; en: string };
export type ServiceFamilyId =
  | "care-cleaning"
  | "home-maintenance"
  | "building-tech-safety"
  | "water-utilities"
  | "automotive-mobility"
  | "daily-needs"
  | "home-fitout-moving"
  | "community-membership";
export const REQUIRED_SERVICE_KEYS = [
  "pest-control", "general-maintenance", "hourly-handyman", "gas-delivery", "water-delivery",
  "cleaning-supplies", "elevator-maintenance", "tank-fill", "sewage-service", "mobile-car-wash",
  "mobile-car-maintenance", "mobile-tire-change", "grocery-delivery", "produce-delivery", "bedding-laundry",
  "home-cleaning", "camera-installation", "neighbor-gifts", "building-washing", "appliance-maintenance",
  "furniture-moving", "fire-safety", "stickers-signage", "smart-lock-installation", "internet-installation",
  "ev-charger-installation", "elevator-access-controls", "entrance-fragrance", "awning-installation",
  "interior-design", "shutter-installation", "naqi-water-filtration", "hvac-maintenance",
  "electrical-maintenance", "plumbing-maintenance",
] as const;
export type RequiredServiceKey = (typeof REQUIRED_SERVICE_KEYS)[number];
export type ServiceScope = "apartment" | "building" | "both";
export type ServiceFulfillment = "on-demand" | "scheduled" | "recurring" | "quote" | "group";
export type PricingModel = "fixed" | "starting-at" | "per-unit" | "quote-required";
export type OrderStatus =
  | "awaiting-quote"
  | "quote-ready"
  | "scheduled"
  | "confirmed"
  | "assigned"
  | "en-route"
  | "in-progress"
  | "awaiting-resident-approval"
  | "completed"
  | "cancelled"
  | "refunded";

export interface CommunityPulse {
  score: number;
  status: "healthy" | "attention" | "critical";
  factors: Array<{ key: "collection" | "maintenance" | "alerts"; score: number }>;
}

export interface Building { id: string; name: LocalizedText; address: LocalizedText; manager: LocalizedText; imageIds: string[]; amenityIds: string[]; }
export interface Unit { id: string; buildingId: string; label: LocalizedText; floor: number; status: "occupied" | "vacant" | "maintenance"; residentIds: string[]; imageIds: string[]; }
export interface Resident { id: string; unitId: string; name: LocalizedText; role: "owner" | "tenant" | "family"; status: "active" | "invited" | "inactive"; }
export interface Invoice { id: string; buildingId: string; unitId?: string; residentId?: string; title: LocalizedText; category: string; subtotal: number; tax: number; total: number; dueDate: string; status: InvoiceStatus; createdAt: string; }
export interface ServiceFamily { id: ServiceFamilyId; name: LocalizedText; description: LocalizedText; iconKey: string; }
export interface ServiceProvider { id: string; name: LocalizedText; serviceIds: string[]; rating: number; reviewCount: number; responseMinutes: number; status: "verified-demo" | "new" | "paused" | "review"; imageId?: string; }
export interface OrderTimelineEvent { id: string; status: OrderStatus; occurredAt: string; note: LocalizedText; imageId?: string; }
export interface ServiceOrder { id: string; serviceId: string; providerId?: string; buildingId: string; unitId?: string; residentId: string; fulfillment: ServiceFulfillment; status: OrderStatus; paymentStatus?: PaymentStatus; amount?: number; quoteAmount?: number; scheduledAt?: string; etaMinutes?: number; timeline: OrderTimelineEvent[]; rating?: number; createdAt: string; }
export interface Announcement { id: string; buildingId: string; title: LocalizedText; body: LocalizedText; priority: "normal" | "important" | "urgent"; publishedAt: string; }
export interface PollOption { id: string; label: LocalizedText; voterIds: string[]; }
export interface Poll { id: string; buildingId: string; question: LocalizedText; options: PollOption[]; closesAt: string; }
export interface CommunityEvent { id: string; buildingId: string; title: LocalizedText; startsAt: string; attendeeIds: string[]; capacity: number; }
export interface VisitorPass { id: string; buildingId: string; unitId: string; residentId: string; guestName: string; expiresAt: string; status: "active" | "expired" | "revoked"; }
export interface AmenityBooking { id: string; buildingId: string; residentId: string; amenityId: string; startsAt: string; status: "upcoming" | "completed" | "cancelled"; }
export interface Activity { id: string; buildingId: string; kind: string; title: LocalizedText; occurredAt: string; }
export interface AuditEntry { id: string; actorId: string; action: string; entityType: string; entityId: string; description: LocalizedText; occurredAt: string; }
export interface MemberOffer { id: string; serviceId: string; title: LocalizedText; regularPrice: number; memberPrice: number; active: boolean; }
export interface RecurringPlan { id: string; serviceId: string; residentId: string; cadence: "weekly" | "monthly" | "quarterly" | "seasonal"; nextDate: string; active: boolean; skippedDates: string[]; }
export interface NeighborDeal { id: string; serviceId: string; buildingId: string; participantIds: string[]; thresholds: Array<{ count: number; unitPrice: number }>; closesAt: string; }
export interface NeighborRelationship { id: string; displayName: LocalizedText; relation: "neighbor" | "friend" | "family"; }
export interface NeighborGift { id: string; serviceId: string; senderId: string; recipientRelationshipId: string; message: string; status: "sent" | "redeemed"; createdAt: string; }

export interface ServiceOffering {
  id: string;
  familyId: ServiceFamilyId;
  providerIds: string[];
  key: RequiredServiceKey;
  name: LocalizedText;
  scope: ServiceScope;
  fulfillment: ServiceFulfillment[];
  pricingModel: PricingModel;
  price?: number;
  startingPrice?: number;
  unitLabel?: LocalizedText;
  etaMinutes?: number;
  slaMinutes?: number;
  durationMinutes?: number;
  warrantyDays?: number;
  active: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  residentId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  occurredAt: string;
  reference: string;
  last4?: "4455" | "4242";
}

export interface DemoState {
  schemaVersion: 1;
  locale: Locale;
  scenario: DemoScenario;
  currentResidentId: string;
  currentBuildingId: string;
  buildings: Building[];
  units: Unit[];
  residents: Resident[];
  invoices: Invoice[];
  payments: Payment[];
  serviceFamilies: ServiceFamily[];
  serviceOfferings: ServiceOffering[];
  providers: ServiceProvider[];
  orders: ServiceOrder[];
  memberOffers: MemberOffer[];
  recurringPlans: RecurringPlan[];
  neighborDeals: NeighborDeal[];
  neighborRelationships: NeighborRelationship[];
  announcements: Announcement[];
  polls: Poll[];
  events: CommunityEvent[];
  visitorPasses: VisitorPass[];
  amenityBookings: AmenityBooking[];
  gifts: NeighborGift[];
  activities: Activity[];
  auditLog: AuditEntry[];
}

export type DemoAction =
  | { type: "locale/set"; locale: Locale }
  | { type: "scenario/set"; scenario: DemoScenario }
  | { type: "invoice/created"; invoice: Invoice }
  | { type: "payment/recorded"; payment: Payment }
  | { type: "payment/status-changed"; paymentId: string; status: PaymentStatus; occurredAt: string }
  | { type: "order/created"; order: ServiceOrder }
  | { type: "order/status-changed"; orderId: string; status: OrderStatus; occurredAt: string }
  | { type: "order/provider-assigned"; orderId: string; providerId: string; occurredAt: string }
  | { type: "order/rated"; orderId: string; rating: number; occurredAt: string }
  | { type: "service/availability-changed"; serviceId: string; active: boolean }
  | { type: "service/updated"; serviceId: string; patch: Partial<Pick<ServiceOffering, "price" | "startingPrice" | "etaMinutes" | "slaMinutes" | "durationMinutes" | "warrantyDays">> }
  | { type: "quote/approved"; orderId: string; amount: number; occurredAt: string }
  | { type: "quote/rejected"; orderId: string; occurredAt: string }
  | { type: "member-offer/upserted"; offer: MemberOffer }
  | { type: "member-offer/disabled"; offerId: string }
  | { type: "recurring-plan/upserted"; plan: RecurringPlan }
  | { type: "recurring-plan/toggled"; planId: string; active: boolean }
  | { type: "recurring-plan/next-skipped"; planId: string; date: string }
  | { type: "neighbor-deal/joined"; dealId: string; residentId: string }
  | { type: "neighbor-gift/sent"; gift: NeighborGift }
  | { type: "building/updated"; buildingId: string; patch: Partial<Pick<Building, "name" | "address" | "manager">> }
  | { type: "unit/updated"; unitId: string; patch: Partial<Pick<Unit, "status" | "label">> }
  | { type: "resident/updated"; residentId: string; patch: Partial<Pick<Resident, "status" | "role">> }
  | { type: "announcement/published"; announcement: Announcement }
  | { type: "poll/created"; poll: Poll }
  | { type: "visitor-pass/created"; pass: VisitorPass }
  | { type: "amenity-booking/created"; booking: AmenityBooking }
  | { type: "poll/voted"; pollId: string; optionId: string; residentId: string }
  | { type: "event/rsvp"; eventId: string; residentId: string; attending: boolean }
  | { type: "demo/reset" };
```

Use the exact interfaces above. Store stable image IDs, never root-relative URLs; resolve IDs through `src/jeerah/assets/asset-manifest.json` and the base-aware `assetUrl()` helper added in Task 5.

- [ ] **Step 4: Seed the exact fictional product sample**

Use these stable records as fixture anchors:

```ts
export const BUILDING_IDS = ["building-89", "nakheel-court", "jeddah-view", "wadi-homes"] as const;
export const SERVICE_FAMILY_IDS = [
  "care-cleaning",
  "home-maintenance",
  "building-tech-safety",
  "water-utilities",
  "automotive-mobility",
  "daily-needs",
  "home-fitout-moving",
  "community-membership",
] as const;
export const CURRENT_RESIDENT_ID = "resident-saif";
export const CURRENT_BUILDING_ID = "building-89";
```

Create 12 units distributed 3 per building, 8 fictional residents, 10 invoices covering every status, 12 historical payments covering every payment status, 8 service families, 35 service offerings, 18 providers, 18 orders covering the execution states, 8 member offers, 5 recurring plans, 3 neighbor deals, 3 safe fictional neighbor relationships, 2 gifts, 6 announcements, 2 polls, 2 community events, 5 visitor passes, 6 amenity bookings, and 12 activities. Use August 3, 2026 as the deterministic date anchor.

`RequiredServiceKey` must enumerate and test the complete requested set: pest control; general and hourly maintenance; gas, water, tank-fill, sewage, and Naqi filtration; cleaning supplies, home cleaning, bedding laundry, building washing, and entrance fragrance; elevator maintenance and access control; cameras, smart locks, internet, EV charging, and fire safety; mobile car wash, maintenance, and tire change; grocery and produce delivery; furniture moving, signage/stickers, awnings, interior design, and shutters; neighbor gifts; plus core HVAC, electrical, and plumbing. Smart locks appear once even though the source request mentioned them twice.

Every offering has exactly one `familyId`; cross-cutting concepts such as urgent, recurring, quote, subscriber-only, or group deal are metadata, not duplicate categories. Normalize Arabic hamza forms, taa marbuta, tatweel, and diacritics for search, while preserving the displayed copy.

- [ ] **Step 5: Implement pure transitions and pulse calculation**

```ts
export function calculateCommunityPulse(state: DemoState, buildingId: string): CommunityPulse {
  const buildingInvoices = state.invoices.filter((invoice) => invoice.buildingId === buildingId);
  const paid = buildingInvoices.filter((invoice) => invoice.status === "paid").length;
  const collection = buildingInvoices.length === 0 ? 100 : Math.round((paid / buildingInvoices.length) * 100);
  const terminal = new Set<OrderStatus>(["completed", "cancelled", "refunded"]);
  const openOrders = state.orders.filter((order) => order.buildingId === buildingId && !terminal.has(order.status)).length;
  const urgentAlerts = state.announcements.filter((item) => item.buildingId === buildingId && item.priority === "urgent").length;
  const maintenance = Math.max(0, 100 - openOrders * 8);
  const alerts = Math.max(0, 100 - urgentAlerts * 20);
  const score = Math.round(collection * 0.45 + maintenance * 0.35 + alerts * 0.2);
  return { score, status: score >= 80 ? "healthy" : score >= 60 ? "attention" : "critical", factors: [
    { key: "collection", score: collection },
    { key: "maintenance", score: maintenance },
    { key: "alerts", score: alerts },
  ] };
}
```

In this task `reduceDemoState` implements every state transition except `scenario/set`; that branch returns the current state unchanged. Task 3 owns scenario composition, modifies the reducer after `applyScenario` exists, and adds the single non-recursive `scenario/set` branch there. This preserves an acyclic module dependency and keeps Task 2 independently compilable.

- [ ] **Step 6: Run domain tests**

Run: `npm run test:run -- tests/jeerah/domain.test.ts`  
Expected: all domain tests pass with deterministic counts and no mutation.

- [ ] **Step 7: Commit**

```bash
git add src/jeerah/domain tests/jeerah/domain.test.ts
git -c commit.gpgsign=false commit -m "feat: add Jeerah demo domain and fixtures"
```

---

### Task 3: Build IndexedDB Persistence, Live Sync, and Scenario Controls

**Files:**
- Create: `src/jeerah/data/channel.ts`
- Create: `src/jeerah/data/repository.ts`
- Create: `src/jeerah/data/DemoProvider.tsx`
- Create: `src/jeerah/data/scenarios.ts`
- Modify: `src/jeerah/domain/reducer.ts`
- Test: `tests/jeerah/repository.test.ts`
- Test: `tests/jeerah/scenarios.test.ts`

**Interfaces:**
- Consumes: `DemoState`, `DemoAction`, `createSeedState`, `reduceDemoState`.
- Produces: `createDemoRepository(options?: RepositoryOptions): DemoRepository`.
- Produces: `DemoProvider`, `useDemoState()`, `useDemoMeta()`, and `useDemoDispatch()`.
- Produces: `applyScenario(state, scenario): DemoState`.

- [ ] **Step 1: Write failing persistence and cross-instance tests**

```ts
import { createDemoRepository } from "../../src/jeerah/data/repository";
import { createMemoryStateChannelFactory } from "../../src/jeerah/data/channel";

it("persists an action and reloads the same state", async () => {
  const repo = createDemoRepository({ dbName: "jeerah-test-persist", channelName: "persist", channelFactory: createMemoryStateChannelFactory() });
  await repo.reset();
  await repo.dispatch({ type: "locale/set", locale: "ar" });
  expect((await repo.load()).state.locale).toBe("ar");
  repo.close();
});

it("notifies another repository instance", async () => {
  const channelFactory = createMemoryStateChannelFactory();
  const first = createDemoRepository({ dbName: "jeerah-test-sync", channelName: "sync", channelFactory });
  const second = createDemoRepository({ dbName: "jeerah-test-sync", channelName: "sync", channelFactory });
  await first.reset();
  const received = new Promise<string>((resolve) => second.subscribe((snapshot) => resolve(snapshot.state.locale)));
  await first.dispatch({ type: "locale/set", locale: "ar" });
  await expect(received).resolves.toBe("ar");
  first.close();
  second.close();
});
```

- [ ] **Step 2: Run the tests and verify the repository is missing**

Run: `npm run test:run -- tests/jeerah/repository.test.ts tests/jeerah/scenarios.test.ts`  
Expected: FAIL because persistence and scenario modules do not exist.

- [ ] **Step 3: Implement the channel abstraction**

```ts
export interface StateChannel {
  publish(message: SyncMessage): void;
  subscribe(listener: (message: SyncMessage) => void): () => void;
  close(): void;
}

export interface SyncMessage {
  type: "snapshot-committed";
  sourceId: string;
  revision: number;
  state: DemoState;
}

export type StateChannelFactory = (name: string, sourceId: string) => StateChannel;

export function createStateChannel(name: string, sourceId: string): StateChannel {
  const channel = new BroadcastChannel(name);
  return {
    publish: (message) => channel.postMessage(message),
    subscribe: (listener) => {
      const handler = (event: MessageEvent<SyncMessage>) => {
        if (event.data.sourceId !== sourceId) listener(event.data);
      };
      channel.addEventListener("message", handler);
      return () => channel.removeEventListener("message", handler);
    },
    close: () => channel.close(),
  };
}
```

Export `createMemoryStateChannelFactory(): StateChannelFactory`; every factory instance owns one deterministic named-bus registry and is explicitly closed by its repositories. Default transport order is `BroadcastChannel`, then a same-origin `localStorage` write plus `storage` event, then a same-realm in-memory bus only when neither browser API exists. Inject the deterministic factory in every repository and live-twin test. Broadcast the committed snapshot, not only an event. Receivers ignore their own `sourceId` and any revision less than or equal to the local revision. Expose `syncMode: "broadcast" | "storage" | "memory"`; never claim the memory fallback synchronizes real tabs.

- [ ] **Step 4: Implement the repository contract**

```ts
export interface DemoMeta {
  revision: number;
  storageMode: "indexeddb" | "memory";
  syncMode: "broadcast" | "storage" | "memory";
  lastSyncAt: string;
}

export interface RepositorySnapshot {
  state: DemoState;
  meta: DemoMeta;
}

export interface DemoRepository {
  load(): Promise<RepositorySnapshot>;
  dispatch(action: DemoAction): Promise<RepositorySnapshot>;
  reset(): Promise<RepositorySnapshot>;
  subscribe(listener: (snapshot: RepositorySnapshot) => void): () => void;
  close(): void;
}

export interface RepositoryOptions {
  dbName?: string;
  channelName?: string;
  sourceId?: string;
  channelFactory?: StateChannelFactory;
  now?: () => Date;
}
```

Store one record `{ key: "state", revision, value, updatedAt }` in IndexedDB database version 1. Every dispatch opens one `readwrite` transaction, reads the latest record inside that transaction, reduces it, writes `revision + 1`, explicitly awaits `tx.done`, then broadcasts the committed snapshot. `reset()` uses the same transaction and increments the latest revision; it never returns to zero. On incoming snapshots, replace local memory only when the revision is newer and update `lastSyncAt`. If IndexedDB fails, use the in-memory seed and expose `storageMode: "memory"`.

Also export `createMemoryDemoRepository(initialState?: DemoState, channelName?: string): DemoRepository` for deterministic UI tests.

- [ ] **Step 5: Implement deterministic scenarios**

```ts
export function applyScenario(state: DemoState, scenario: DemoScenario): DemoState {
  if (scenario === "normal") return { ...createSeedState(), locale: state.locale, scenario };
  if (scenario === "empty") return { ...state, scenario, invoices: [], orders: [], announcements: [], activities: [] };
  if (scenario === "overdue") return {
    ...state,
    scenario,
    invoices: state.invoices.map((invoice, index) => index === 0 ? { ...invoice, status: "overdue" } : invoice),
  };
  if (scenario === "urgent-maintenance") return { ...state, scenario, announcements: state.announcements.map((item, index) => index === 0 ? { ...item, priority: "urgent" } : item) };
  return { ...state, scenario };
}
```

`applyScenario` is pure and never calls the reducer. The reducer's `scenario/set` branch calls `applyScenario` once and then appends one audit entry; it must not recursively call itself.

- [ ] **Step 6: Implement the React provider**

```tsx
const DemoStateContext = createContext<DemoState | null>(null);
const DemoMetaContext = createContext<DemoMeta | null>(null);
const DemoDispatchContext = createContext<((action: DemoAction) => Promise<DemoState>) | null>(null);

export function useDemoState() {
  const value = useContext(DemoStateContext);
  if (!value) throw new Error("useDemoState must be used inside DemoProvider");
  return value;
}

export function useDemoDispatch() {
  const value = useContext(DemoDispatchContext);
  if (!value) throw new Error("useDemoDispatch must be used inside DemoProvider");
  return value;
}

export function useDemoMeta() {
  const value = useContext(DemoMetaContext);
  if (!value) throw new Error("useDemoMeta must be used inside DemoProvider");
  return value;
}
```

Mount the provider once around every Jeerah surface so resident and admin use the same repository.
`DemoProvider` unwraps `RepositorySnapshot`: state and meta go to separate contexts, while its dispatch callback returns `snapshot.state` for ergonomic UI actions.

- [ ] **Step 7: Run repository and scenario tests**

Run: `npm run test:run -- tests/jeerah/repository.test.ts tests/jeerah/scenarios.test.ts`  
Expected: persistence, reset, fallback, scenario, and cross-instance tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/jeerah/data src/jeerah/domain/reducer.ts tests/jeerah/repository.test.ts tests/jeerah/scenarios.test.ts
git -c commit.gpgsign=false commit -m "feat: add persistent synchronized demo store"
```

---

### Task 4: Add Localization, Tokens, Icons, and Surface Routing

**Files:**
- Create: `src/jeerah/app/routeMode.ts`
- Create: `src/jeerah/app/SurfacePortal.tsx`
- Create: `src/jeerah/design/tokens.css`
- Create: `src/jeerah/design/fonts.css`
- Create: `src/jeerah/design/BrandIcon.tsx`
- Create: `src/jeerah/design/JeerahLogo.tsx`
- Create: `src/jeerah/design/serviceIconMap.ts`
- Create: `src/jeerah/design/PaymentBrand.tsx`
- Create: `src/jeerah/i18n/messages.ts`
- Create: `src/jeerah/i18n/I18nProvider.tsx`
- Modify: `src/jeerah/JeerahPrototype.tsx`
- Modify: `src/prototype.css`
- Test: `tests/jeerah/shell.test.tsx`

**Interfaces:**
- Consumes: `DemoProvider`.
- Produces: `getRouteMode(url, displayMode, viewportWidth): "preview" | "resident" | "admin"`.
- Produces: `SurfacePortal({ children, mode })`.
- Produces: `useI18n(): { locale, dir, t, setLocale }`.
- Produces: `JeerahLogo`, `BrandIcon`, `ServiceFamilyIcon`, and `PaymentBrand` components.

- [ ] **Step 1: Write failing routing, RTL, and brand tests**

```tsx
import { MobileRuntime } from "../../src/mobile/MobileRuntime";

it("uses direct resident mode on narrow app URLs", () => {
  expect(getRouteMode(new URL("https://demo.test/?surface=app"), "browser", 390)).toBe("resident");
});

it("sets Arabic direction on the direct surface", async () => {
  render(<MobileRuntime><JeerahPrototype /></MobileRuntime>);
  await userEvent.click(screen.getByRole("button", { name: /العربية/i }));
  expect(screen.getByRole("application", { name: /jeerah smart demo/i })).toHaveAttribute("dir", "rtl");
});

it.each([
  ["apple-pay", "Apple Pay"],
  ["mada", "mada"],
  ["visa", "Visa"],
] as const)("renders the official %s brand title", (brand, label) => {
  render(<PaymentBrand brand={brand} />);
  expect(screen.getByRole("img", { name: label })).toBeInTheDocument();
});

it.each([
  ["ar", "dark", "horizontal-logo-2.svg"],
  ["ar", "light", "horizontal-logo-4.svg"],
  ["en", "dark", "horizontal-logo-1.svg"],
  ["en", "light", "horizontal-logo-3.svg"],
] as const)("selects the exact official logo for %s on %s", (locale, background, filename) => {
  render(<JeerahLogo locale={locale} background={background} />);
  expect(screen.getByRole("img", { name: /jeerah smart/i })).toHaveAttribute("src", expect.stringContaining(filename));
});
```

- [ ] **Step 2: Run shell tests and confirm missing modules fail**

Run: `npm run test:run -- tests/jeerah/shell.test.tsx`  
Expected: FAIL because routing, i18n, and brand components do not exist.

- [ ] **Step 3: Implement route-mode selection**

```ts
export type SurfaceMode = "preview" | "resident" | "admin";

export function getRouteMode(url: URL, displayMode: "browser" | "standalone", viewportWidth: number): SurfaceMode {
  if (url.searchParams.get("surface") === "admin") return "admin";
  if (url.searchParams.get("preview") === "1") return "preview";
  if (displayMode === "standalone" || viewportWidth <= 640 || url.searchParams.get("surface") === "app") return "resident";
  return "preview";
}
```

- [ ] **Step 4: Implement the app-owned portal without modifying protected runtime files**

```tsx
export function SurfacePortal({ mode, children }: PropsWithChildren<{ mode: "resident" | "admin" }>) {
  const [host] = useState(() => Object.assign(document.createElement("div"), { id: `jeerah-${mode}-surface` }));
  useLayoutEffect(() => {
    document.body.dataset.jeerahSurface = mode;
    document.body.append(host);
    return () => {
      delete document.body.dataset.jeerahSurface;
      host.remove();
    };
  }, [host, mode]);
  return createPortal(children, host);
}
```

In `prototype.css`, hide `.phone-stage` only when `body[data-jeerah-surface]` is present, restore body scrolling for admin, and give the resident host a fixed full-screen viewport with safe-area variables. Preview mode must retain the untouched template device frame.

- [ ] **Step 5: Implement localization without raw-key fallback**

```ts
export type MessageKey = keyof typeof messages.en;

export function translate(locale: Locale, key: MessageKey, values: Record<string, string | number> = {}) {
  const template = messages[locale][key] ?? messages.en[key];
  return Object.entries(values).reduce((copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)), template);
}
```

Include every navigation label, status, action, error, payment message, install instruction, table heading, and empty state used by later tasks in both dictionaries. Type `t` with `MessageKey` so missing keys fail TypeScript.

- [ ] **Step 6: Implement the brand wrappers**

```tsx
import { IconContext, type Icon } from "@phosphor-icons/react";
import { siApplepay, siVisa } from "simple-icons/icons";

export function BrandIcon({ icon: Glyph, label }: { icon: Icon; label: string }) {
  return <IconContext.Provider value={{ weight: "duotone", size: 24 }}><Glyph aria-label={label} /></IconContext.Provider>;
}

const vectorBrands = { "apple-pay": siApplepay, visa: siVisa } as const;

export function PaymentBrand({ brand }: { brand: PaymentMethod }) {
  if (brand === "mada") {
    return <img role="img" aria-label="mada" src={`${import.meta.env.BASE_URL}brands/mada.svg`} />;
  }
  const icon = vectorBrands[brand];
  return <svg role="img" aria-label={icon.title} viewBox="0 0 24 24"><path d={icon.path} /></svg>;
}
```

`JeerahLogo` must render the exact archive assets copied in Task 5. The service map assigns one existing Phosphor icon to each of the eight families and a more specific icon to commonly featured offerings; verify each import exists in the installed package before use. Do not reuse the Jeerah mark as a service pictogram.

- [ ] **Step 7: Define the exact design tokens**

```css
:root {
  --js-deep-nexus: #191c2e;
  --js-steel-slate: #4c558c;
  --js-glow-white: #edffff;
  --js-brand-gradient-dark: linear-gradient(135deg, #22274f 0%, #191c2e 100%);
  --js-brand-gradient-light: linear-gradient(135deg, #4c558c 0%, #edffff 100%);
  --js-success: #08705b;
  --js-warning: #a85a00;
  --js-danger: #b42336;
  --js-cloud: #f5f7fc;
  --js-surface: #ffffff;
  --js-text: #191c2e;
  --js-muted: #5f667d;
  --js-border: #d8ddec;
  --js-radius-sm: 12px;
  --js-radius-md: 18px;
  --js-radius-lg: 28px;
  --js-shadow-soft: 0 18px 48px rgba(3, 21, 52, 0.14);
  --js-motion-fast: 160ms;
  --js-motion-normal: 320ms;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 1ms !important; }
}
```

`fonts.css` declares archive-derived WOFF2 faces for `Readex Pro`, `Plus Jakarta Sans`, and `Montserrat`. Apply Readex to Arabic, Plus Jakarta to English, and Montserrat only to compact numeric/contact metadata. Preserve the OFL license files under `public/brand/fonts/` and list them in `CREDITS.md`.

- [ ] **Step 8: Run shell tests and runtime check**

Run: `npm run test:run -- tests/jeerah/shell.test.tsx`  
Expected: route, portal cleanup, RTL, missing-key type, and brand tests pass.

Run: `npm run check:runtime`  
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/jeerah/app src/jeerah/design src/jeerah/i18n src/jeerah/JeerahPrototype.tsx src/prototype.css tests/jeerah/shell.test.tsx
git -c commit.gpgsign=false commit -m "feat: add Jeerah shell and design system"
```

---

### Task 5: Adopt the Official Brand Package and Produce the Visual Asset Pack

**Files:**
- Create: `src/jeerah/assets/brand-manifest.json`
- Create: `src/jeerah/assets/asset-manifest.json`
- Create: `src/jeerah/assets/url.ts`
- Create: `public/brand/logos/*.svg`
- Create: `public/brand/patterns/*.png`
- Create: `public/brand/fonts/*.{woff2,txt}`
- Create: `public/brand/favicon/*.png`
- Create: `public/assets/buildings/*.webp`
- Create: `public/assets/apartments/*.webp`
- Create: `public/assets/amenities/*.webp`
- Create: `public/assets/services/*.webp`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/apple-touch-icon.png`
- Create: `public/brands/mada.svg`
- Create: `scripts/verify-assets.mjs`
- Create: `CREDITS.md`
- Modify: `src/jeerah/design/JeerahLogo.tsx`
- Modify: `src/jeerah/design/PaymentBrand.tsx`
- Modify: `src/jeerah/design/fonts.css`
- Create: `src/jeerah/design/BrandFontFaces.tsx`
- Test: `tests/jeerah/assets.test.ts`

**Interfaces:**
- Produces: `BrandManifestEntry { id, path, sourcePath, sha256, role }` for exact archive-derived files.
- Produces: `AssetManifestEntry { id, category, path, sha256, ratio, alt: { ar, en }, provenance }` for generated photography.
- Produces stable IDs referenced by fixtures and UI.

- [ ] **Step 1: Write failing brand and content-asset tests**

```ts
import brand from "../../src/jeerah/assets/brand-manifest.json";
import content from "../../src/jeerah/assets/asset-manifest.json";
import { assetUrl } from "../../src/jeerah/assets/url";

it("contains the exact Jeerah identity roles", () => {
  const roles = brand.map((entry) => entry.role);
  expect(roles).toEqual(expect.arrayContaining([
    "logo-ar-dark", "logo-ar-light", "logo-en-dark", "logo-en-light",
    "pattern-dark", "pattern-light", "app-icon-512", "apple-touch-icon", "favicon",
    "font-ar", "font-en", "font-support",
  ]));
  expect(brand.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true);
});

it("contains a complete local photography set", () => {
  expect(content).toHaveLength(18);
  expect(new Set(content.map((entry) => entry.category))).toEqual(new Set(["building", "apartment", "amenity", "service"]));
  for (const entry of content) {
    expect(entry.path).toMatch(/^assets\/.+\.webp$/);
    expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.alt.ar.length).toBeGreaterThan(12);
    expect(entry.alt.en.length).toBeGreaterThan(12);
    expect(entry.provenance).toMatch(/ImageGen/i);
  }
});

it("resolves every public asset under the configured deployment base", () => {
  expect(assetUrl("assets/buildings/building-89-night.webp", "/jeerah-smart-demo/"))
    .toBe("/jeerah-smart-demo/assets/buildings/building-89-night.webp");
});
```

- [ ] **Step 2: Run the tests and verify both manifests are absent**

Run: `npm run test:run -- tests/jeerah/assets.test.ts`  
Expected: FAIL because the brand and content manifests do not exist.

- [ ] **Step 3: Copy only the approved archive assets and preserve provenance**

Copy and rename exact web-ready sources from `work/jeerah-brand-source`:

```text
Horizontal Logo 1.svg  -> public/brand/logos/horizontal-logo-1.svg  (English white, dark surface)
Horizontal Logo 2.svg  -> public/brand/logos/horizontal-logo-2.svg  (Arabic white, dark surface)
Horizontal Logo 3.svg  -> public/brand/logos/horizontal-logo-3.svg  (English dark, light surface)
Horizontal Logo 4.svg  -> public/brand/logos/horizontal-logo-4.svg  (Arabic dark, light surface)
Icon 1.svg             -> public/brand/logos/mark-dark.svg
Icon 3.svg             -> public/brand/logos/mark-light.svg
BG2.png                -> public/brand/patterns/pattern-dark.png
Transparant.png        -> public/brand/patterns/pattern-overlay.png
```

Re-export `BG1.png` to a true 2000×2000 `pattern-light.png` without altering its artwork. Exclude near-duplicate `Transparant2.png`. Re-export dark/light favicon SVG plus exact 16×16, 32×32, and 64×64 PNGs from the official mark SVG because the supplied x32/x64 PNGs are actually 33×33 and 65×65.

Copy the three variable OFL font sources, convert once to WOFF2 without subsetting away Arabic or Latin glyphs, and preserve each `OFL.txt`. Record source path and SHA-256 for every copied or converted output. Do not copy the zero-byte `1-LOGO/3-Alterantive Logo/PDF/1.png`; do not ship the 1025×1025 partially transparent iOS icons, AI, EPS, brand-guide PDF, mockup files, or JPG logo variants.

- [ ] **Step 4: Derive install icons from the official archive app icon**

Use the opaque `1-LOGO/5-App Icon - ايقونة تطبيق/Android/Icon الايقونة512 (Android).png` unchanged as the 512 icon and resize it proportionally to 192 and 180 for `apple-touch-icon.png`. Do not use the supplied iOS sources, redraw, recolor, crop, add padding, or generate any Jeerah mark. Record all output hashes and transforms in `src/jeerah/assets/brand-manifest.json`.

- [ ] **Step 5: Add the official payment marks**

Use package-provided Simple Icons for Apple Pay and Visa. Download the current official mada SVG from `mada.com.sa` into `public/brands/mada.svg`, visually inspect it, record the source URL and access date in `CREDITS.md`, and never substitute a text approximation.

- [ ] **Step 6: Generate eighteen independent, correctly sized content images with ImageGen**

Use the accepted visual target and reference-site screenshots as image references. Generate separate images, never a collage or sprite sheet:

```text
buildings/building-89-night.webp        16:9 Riyadh tower at blue hour, premium residential, warm windows
buildings/building-89-day.webp          16:9 same architectural language in daylight
buildings/nakheel-court.webp            16:9 mid-rise family courtyard with palms
buildings/jeddah-view.webp              16:9 coastal residential exterior at sunset
apartments/living-room.webp             4:3 contemporary Saudi apartment living room
apartments/kitchen.webp                 4:3 warm modern apartment kitchen
apartments/bedroom.webp                 4:3 calm primary bedroom
apartments/balcony.webp                 4:3 shaded balcony with city view
amenities/lobby.webp                    4:3 premium residential lobby
amenities/gym.webp                      4:3 compact resident gym
amenities/meeting-room.webp             4:3 community meeting room
amenities/parking.webp                  4:3 clean secure resident parking
services/hvac-technician.webp           4:3 technician working safely on a split AC unit
services/cleaning-team.webp             4:3 professional residential cleaning team
services/elevator-maintenance.webp      4:3 elevator safety inspection with tools
services/mobile-car-care.webp           4:3 mobile car wash and tire service
services/home-technology.webp           4:3 smart lock and camera installation
services/delivery-utilities.webp        4:3 organized water, grocery, and utility delivery scene
```

The shared prompt must request photo-realistic Saudi/Gulf architecture, a restrained Deep Nexus/Steel Slate/Glow White harmony, no visible text, no logos, no people facing camera, correct hands/tools, and the exact ratio. Convert each output once to WebP at quality 82 without stretching; crop only to the requested composition and retain the original outside `public/`.

- [ ] **Step 7: Create both manifests, credits, and the validator**

```json
{
  "id": "building-89-night",
  "category": "building",
  "path": "assets/buildings/building-89-night.webp",
  "sha256": "<64 lowercase hex characters calculated from the final WebP>",
  "ratio": "16:9",
  "alt": {
    "ar": "واجهة مبنى 89 السكني في الرياض ليلًا",
    "en": "Building 89 residential exterior in Riyadh at night"
  },
  "provenance": "ImageGen, 2026-08-03"
}
```

`assetUrl(path, base = import.meta.env.BASE_URL)` normalizes the supplied base with one trailing slash, rejects absolute, network, and traversal paths, and returns a base-prefixed runtime URL. Migrate the existing `JeerahLogo` and `PaymentBrand` references in this task. `BrandFontFaces` emits the three `@font-face` rules from `assetUrl(...)`; `fonts.css` contains only family/weight application rules and no root-relative URLs. Every logo, pattern, font, photograph, install icon, and payment-brand reference in React resolves through this helper, so the same bundle works at `/` and `/jeerah-smart-demo/`.

`scripts/verify-assets.mjs` reads both source manifests, resolves their relative paths against `public/`, and must fail when a manifest entry is absent, empty, outside its expected public directory, has the wrong SHA-256, exceeds 600 KB for content photography, lacks bilingual alt text, or references the zero-byte source. It must also verify icon dimensions and that every required logo/font/pattern role appears once.

- [ ] **Step 8: Run asset validation**

Run: `node scripts/verify-assets.mjs`  
Expected: reports all official brand roles, 18 valid content images, 3 valid install icons, and the official mada mark.

Run: `npm run test:run -- tests/jeerah/assets.test.ts`  
Expected: all identity, metadata, hash, dimension, and asset-coverage tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/jeerah/assets src/jeerah/design/JeerahLogo.tsx src/jeerah/design/PaymentBrand.tsx src/jeerah/design/fonts.css src/jeerah/design/BrandFontFaces.tsx public/brand public/assets public/icons public/brands scripts/verify-assets.mjs CREDITS.md tests/jeerah/assets.test.ts
git -c commit.gpgsign=false commit -m "feat: adopt official Jeerah identity and visual assets"
```

---

### Task 6: Build the Resident Home and Property Journey

**Files:**
- Create: `src/jeerah/resident/ResidentApp.tsx`
- Create: `src/jeerah/resident/ResidentNav.tsx`
- Create: `src/jeerah/resident/components/CommunityPulseCard.tsx`
- Create: `src/jeerah/resident/components/QuickActions.tsx`
- Create: `src/jeerah/resident/components/ActivityFeed.tsx`
- Create: `src/jeerah/resident/components/PropertyGallery.tsx`
- Create: `src/jeerah/resident/pages/HomePage.tsx`
- Create: `src/jeerah/resident/pages/PropertiesPage.tsx`
- Create: `src/jeerah/resident/pages/BuildingPage.tsx`
- Create: `src/jeerah/resident/pages/UnitPage.tsx`
- Modify: `src/jeerah/JeerahPrototype.tsx`
- Modify: `src/prototype.css`
- Create: `tests/jeerah/helpers/renderDemo.tsx`
- Test: `tests/jeerah/resident-home.test.tsx`

**Interfaces:**
- Consumes: `useDemoState`, `calculateCommunityPulse`, `useI18n`, asset IDs.
- Produces: `ResidentScreenId` and `ResidentApp({ initialScreen?: ResidentScreenId })`.
- Produces FlowStack screens with IDs `home`, `properties`, `building`, and `unit`.
- Produces test helpers `renderResident(options?)` and `renderResidentAt(screenId, options?)`, returning Testing Library render results plus the seeded `state`, repository, and `user`.

- [ ] **Step 1: Write failing resident-home journey tests**

```tsx
it("shows the accepted Building 89 home hierarchy", async () => {
  renderResident();
  expect(await screen.findByRole("heading", { name: /Saifeldeen/i })).toBeInTheDocument();
  expect(screen.getByText(/Building 89/i)).toBeInTheDocument();
  expect(screen.getByText(/700.00/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /view & pay/i })).toBeInTheDocument();
});

it("opens the building gallery and unit details", async () => {
  const user = userEvent.setup();
  renderResident();
  await user.click(screen.getByRole("button", { name: /building 89/i }));
  expect(await screen.findByRole("heading", { name: /building 89/i })).toBeInTheDocument();
  expect(screen.getAllByRole("img").length).toBeGreaterThanOrEqual(3);
  await user.click(screen.getByRole("button", { name: /unit 1204/i }));
  expect(await screen.findByText(/12th floor/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm resident screens are absent**

Run: `npm run test:run -- tests/jeerah/resident-home.test.tsx`  
Expected: FAIL because `ResidentApp` and its screens do not exist.

- [ ] **Step 3: Compose the resident FlowStack**

```tsx
const homeScreen: FlowScreen = {
  id: "home",
  footer: (flow) => <ResidentNav active={toResidentNavId(flow.current.id)} />,
  footerHeight: 78,
  render: () => <HomePage />,
};

export type ResidentScreenId = "home" | "properties" | "building" | "unit" | "expenses" | "marketplace" | "orders" | "community" | "profile" | "install";

export function ResidentApp({ initialScreen = "home" }: { initialScreen?: ResidentScreenId }) {
  return <FlowStack initial={getResidentScreen(initialScreen)} />;
}
```

`getResidentScreen(id)` returns one stable `FlowScreen` definition and every `header`, `footer`, and `render` field is a function accepting `FlowControls`, matching the protected template API exactly. `App.tsx` already supplies `MobileRuntime`; do not nest a second runtime in production.

The test harness wraps direct component renders with `MobileRuntime`, `DemoProvider`, and `I18nProvider`; admin helpers also add `MemoryRouter`. `renderResidentAt(id)` passes `initialScreen={id}`. The live-twin helper uses two repository instances on the same injected channel and separate containers queried with `within(container)`. Each helper registers cleanup that unmounts, closes both repositories/channels, and deletes its unique fake IndexedDB database.

Create screen factories for building and unit IDs. Call `flow.push(screen)` for forward navigation and rely on FlowStack to dismiss the simulated keyboard.

- [ ] **Step 4: Build the home from the accepted visual target**

Use one dark architectural hero, a single `CommunityPulseCard`, four quick actions, two recent activities, the marketplace banner, and five-item fixed navigation. Use Motion for pulse, count-up, stagger, active-nav glide, and one-time bell spring. Keep the full-screen direct mode visually identical to the content inside the device preview.

```tsx
<CommunityPulseCard
  building={building}
  pulse={pulse}
  invoice={nextInvoice}
  onOpenBuilding={openBuilding}
  onPay={openPayment}
/>
```

- [ ] **Step 5: Build property, building, and unit screens**

Use the template `Carousel` for building and apartment imagery. Each image receives alt text from `asset-manifest.json`. Include address, manager, amenities, pulse factors, unit list, occupancy status, and the fictional Unit 1204 details.

- [ ] **Step 6: Run resident tests and runtime integrity check**

Run: `npm run test:run -- tests/jeerah/resident-home.test.tsx`  
Expected: home hierarchy, building navigation, gallery, and unit tests pass in both locales.

Run: `npm run check:runtime`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/jeerah/resident src/jeerah/JeerahPrototype.tsx src/prototype.css tests/jeerah/resident-home.test.tsx
git -c commit.gpgsign=false commit -m "feat: build resident home and properties"
```

---

### Task 7: Implement Expenses and the Safe Payment Golden Journey

**Files:**
- Create: `src/jeerah/payments/simulator.ts`
- Create: `src/jeerah/payments/PaymentFlow.tsx`
- Create: `src/jeerah/payments/Receipt.tsx`
- Create: `src/jeerah/resident/pages/ExpensesPage.tsx`
- Create: `src/jeerah/resident/pages/InvoicePage.tsx`
- Create: `src/jeerah/resident/pages/PaymentsPage.tsx`
- Modify: `src/jeerah/resident/ResidentApp.tsx`
- Modify: `tests/jeerah/helpers/renderDemo.tsx`
- Test: `tests/jeerah/payment-simulator.test.ts`
- Test: `tests/jeerah/payment-flow.test.tsx`

**Interfaces:**
- Consumes: `PaymentMethod`, `PaymentStatus`, repository dispatch, `PaymentBrand`.
- Produces: `simulatePayment(attempt, options): Promise<Payment>`.
- Produces: `PaymentFlow({ invoice, forcedOutcome, onComplete, onCancel })`.
- Produces: `Receipt({ payment, invoice })`.
- Extends the test harness with `renderPayment({ forcedOutcome, locale? })`.

- [ ] **Step 1: Write the failing payment-state tests**

```ts
it.each([
  ["apple-pay", "paid"],
  ["mada", "declined"],
  ["visa", "timed-out"],
] as const)("returns deterministic %s outcome %s", async (method, outcome) => {
  await expect(simulatePayment({ invoiceId: "invoice-elevator", residentId: "resident-saif", method, amount: 700 }, { forcedOutcome: outcome, delayMs: 0 }))
    .resolves.toMatchObject({ method, status: outcome, amount: 700 });
});
```

```tsx
it("completes a mada demo payment and labels the receipt", async () => {
  const user = userEvent.setup();
  renderPayment({ forcedOutcome: "paid" });
  await user.click(screen.getByRole("radio", { name: /mada/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await user.type(screen.getByLabelText(/demo otp/i), "1234");
  await user.click(screen.getByRole("button", { name: /confirm/i }));
  expect(await screen.findByText(/لم يتم الخصم|not charged/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/card number|cvv/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run payment tests and confirm modules are absent**

Run: `npm run test:run -- tests/jeerah/payment-simulator.test.ts tests/jeerah/payment-flow.test.tsx`  
Expected: FAIL because payment modules do not exist.

- [ ] **Step 3: Implement the deterministic simulator**

```ts
export interface PaymentAttempt {
  invoiceId: string;
  residentId: string;
  method: PaymentMethod;
  amount: number;
}

export interface SimulationOptions {
  forcedOutcome?: PaymentStatus;
  delayMs?: number;
  now?: () => Date;
  createId?: () => string;
}

export async function simulatePayment(attempt: PaymentAttempt, options: SimulationOptions = {}): Promise<Payment> {
  await new Promise((resolve) => setTimeout(resolve, options.delayMs ?? 900));
  const status = options.forcedOutcome ?? "paid";
  const occurredAt = (options.now?.() ?? new Date()).toISOString();
  return {
    id: `payment-${options.createId?.() ?? crypto.randomUUID()}`,
    ...attempt,
    status,
    occurredAt,
    reference: `DEMO-${occurredAt.replace(/\D/g, "").slice(-10)}`,
    last4: attempt.method === "mada" ? "4455" : attempt.method === "visa" ? "4242" : undefined,
  };
}
```

- [ ] **Step 4: Build the five-step flow**

The exact steps are `method → review → verify → processing → result`. Apple Pay uses an in-product confirm action, mada uses visible demo OTP `1234`, and Visa uses a labeled demo 3-D Secure confirm. Never render full card-number or CVV fields. The payment test harness and `PaymentFlow.forcedOutcome` can force `paid`, `pending`, `declined`, `cancelled`, `timed-out`, or `refunded`; Scenario Studio intentionally exposes only the single `declined` payment scenario already present in `DemoScenario`.

- [ ] **Step 5: Dispatch payment effects**

On `paid`, dispatch `payment/recorded`, mark the invoice paid through the reducer, add an activity, and append an audit entry. On other terminal statuses, append the payment and audit entry without changing the invoice to paid. Disable action buttons during processing and make result announcements through `aria-live="polite"`.

- [ ] **Step 6: Build expense, invoice, history, and receipt screens**

Use due/paid/overdue/upcoming filters, a complete invoice breakdown, localized SAR, payment-method title, masked last four digits, demo reference, and print styles. `window.print()` is the receipt action; no generated server document is required.

- [ ] **Step 7: Run payment and resident regression tests**

Run: `npm run test:run -- tests/jeerah/payment-simulator.test.ts tests/jeerah/payment-flow.test.tsx tests/jeerah/resident-home.test.tsx`  
Expected: all payment outcomes, receipt label, invoice update, and home regression tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/jeerah/payments src/jeerah/resident/pages src/jeerah/resident/ResidentApp.tsx tests/jeerah/helpers/renderDemo.tsx tests/jeerah/payment-simulator.test.ts tests/jeerah/payment-flow.test.tsx
git -c commit.gpgsign=false commit -m "feat: add safe simulated payment journey"
```

---

### Task 8: Implement Services, Community, Visitors, and Amenities

**Files:**
- Create: `src/jeerah/resident/pages/MarketplacePage.tsx`
- Create: `src/jeerah/resident/pages/ServiceFamilyPage.tsx`
- Create: `src/jeerah/resident/pages/ServiceDetailPage.tsx`
- Create: `src/jeerah/resident/pages/ProviderPage.tsx`
- Create: `src/jeerah/resident/pages/CompareProvidersPage.tsx`
- Create: `src/jeerah/resident/pages/BookServicePage.tsx`
- Create: `src/jeerah/resident/pages/MemberOffersPage.tsx`
- Create: `src/jeerah/resident/pages/RecurringPlansPage.tsx`
- Create: `src/jeerah/resident/pages/GiftNeighborPage.tsx`
- Create: `src/jeerah/resident/pages/OrdersPage.tsx`
- Create: `src/jeerah/resident/pages/OrderTimelinePage.tsx`
- Create: `src/jeerah/resident/pages/CommunityPage.tsx`
- Create: `src/jeerah/resident/pages/VisitorPassPage.tsx`
- Create: `src/jeerah/resident/pages/AmenitiesPage.tsx`
- Create: `src/jeerah/resident/pages/ProfilePage.tsx`
- Create: `src/jeerah/resident/components/NeighborDeal.tsx`
- Create: `src/jeerah/resident/components/ServicePassport.tsx`
- Create: `src/jeerah/resident/components/ServiceModeForm.tsx`
- Create: `src/jeerah/resident/components/MaintenanceStory.tsx`
- Modify: `src/jeerah/resident/ResidentApp.tsx`
- Test: `tests/jeerah/resident-services.test.tsx`
- Test: `tests/jeerah/service-catalog.test.tsx`
- Test: `tests/jeerah/community.test.tsx`

**Interfaces:**
- Consumes: service family, offering, provider, offer, plan, deal, order, announcement, poll, visitor, amenity entities and repository dispatch.
- Produces localized catalog search, five fulfillment modes, provider comparison, offer/plan/gift actions, complete order timeline, poll vote, QR pass, and amenity booking actions.

- [ ] **Step 1: Write failing booking and community tests**

```tsx
it("books HVAC service and advances its timeline", async () => {
  const user = userEvent.setup();
  renderResidentAt("marketplace");
  await user.click(screen.getByRole("button", { name: /coolair/i }));
  await user.click(screen.getByRole("button", { name: /book service/i }));
  await user.click(screen.getByRole("button", { name: /august 6.*10:00/i }));
  await user.click(screen.getByRole("button", { name: /confirm booking/i }));
  expect(await screen.findByText(/confirmed/i)).toBeInTheDocument();
});

it("finds every required service and opens a valid next action", async () => {
  const { state } = renderResidentAt("marketplace");
  expect(state.serviceOfferings).toHaveLength(35);
  for (const service of state.serviceOfferings) {
    expect(service.active).toBe(true);
    expect(service.familyId).toBeTruthy();
    expect(service.fulfillment.length).toBeGreaterThan(0);
  }
});

it("normalizes Arabic search and supports quote and recurring forms", async () => {
  const user = userEvent.setup();
  renderResidentAt("marketplace");
  await user.type(screen.getByRole("searchbox"), "اقفال ذكيه");
  expect(await screen.findByRole("link", { name: /تركيب الأقفال الذكية/i })).toBeInTheDocument();
  await user.clear(screen.getByRole("searchbox"));
  await user.type(screen.getByRole("searchbox"), "مظلات");
  await user.click(await screen.findByRole("link", { name: /تركيب مظلات/i }));
  expect(screen.getByRole("button", { name: /طلب عرض سعر/i })).toBeInTheDocument();
});

it("creates a temporary visitor QR and records a poll vote", async () => {
  const user = userEvent.setup();
  renderResidentAt("community");
  await user.click(screen.getByRole("radio", { name: /7 pm/i }));
  await user.click(screen.getByRole("button", { name: /vote/i }));
  expect(await screen.findByText(/participation/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /create visitor pass/i }));
  expect(await screen.findByRole("img", { name: /visitor qr/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests and confirm flows are absent**

Run: `npm run test:run -- tests/jeerah/service-catalog.test.tsx tests/jeerah/resident-services.test.tsx tests/jeerah/community.test.tsx`  
Expected: FAIL because service and community screens do not exist.

- [ ] **Step 3: Build marketplace and booking screens**

Render eight service families, 35 offerings, and 18 providers from fixtures. Lead with search, active order, subscriber exclusives, and family tiles; then expose scope, fulfillment, price model, rating, ETA, warranty, and verified-demo status. Search works in Arabic and English and filters by apartment/building scope, on-demand/scheduled/recurring/quote/group mode, price model, and availability. Every offering opens `ServicePassport`, one or more providers, and a valid next action; no dead cards.

`ServiceModeForm` changes its fields by fulfillment mode: address and ETA for on-demand; date/window for scheduled; cadence/next date for recurring; photos/site-visit notes for quote; participant/building approval for group. Fixed and per-unit services show transparent totals, while quote services show a fictional range and never fabricate a final amount before approval. Dispatch `order/created` with the correct initial status (`confirmed`, `scheduled`, or `awaiting-quote`) and first timeline event.

- [ ] **Step 4: Build order timeline and maintenance story**

Map the eleven execution statuses to localized steps while keeping payment status independent. Completed maintenance orders display before/after assets, SLA duration, assigned fictional technician, warranty, checklist, resident approval, and a five-star local rating action. On-demand orders show a labeled local ETA animation, not real GPS. Admin assignment, quote approval, and status changes must appear on this page through repository subscription.

- [ ] **Step 5: Build offers, recurring plans, Neighbor Deals, and Gift a Neighbor**

Render 8 subscriber offers with real comparison math, 5 recurring plans with pause/resume/skip-next controls, and 3 group deals with different progress states. `GiftNeighborPage` chooses only from a safe fictional relationship list, supports a short note, and creates a demo gift without exposing the building resident directory. Member pricing must never appear as a fake countdown or scarcity claim.

- [ ] **Step 6: Build community, visitor, and amenity flows**

Render announcements, one event with RSVP, two polls, and one interactive group HVAC deal whose price changes at 4/8/12 residents using fixed thresholds. Generate QR content only from fictional pass ID and ISO expiry:

```ts
const qrValue = JSON.stringify({ demo: true, passId: pass.id, expiresAt: pass.expiresAt });
```

Use `QRCodeSVG` from `qrcode.react` with `role="img"`, `aria-label="Visitor QR — demo only"`, and matching `title`; do not rely on an unlabeled canvas.

- [ ] **Step 7: Run service and community tests**

Run: `npm run test:run -- tests/jeerah/service-catalog.test.tsx tests/jeerah/resident-services.test.tsx tests/jeerah/community.test.tsx`  
Expected: all 35 offerings, normalized search, five fulfillment modes, provider comparison, quote, recurring plan, gift, group deal, booking, status timeline, vote, RSVP, visitor QR, and amenity booking tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/jeerah/resident tests/jeerah/service-catalog.test.tsx tests/jeerah/resident-services.test.tsx tests/jeerah/community.test.tsx
git -c commit.gpgsign=false commit -m "feat: add resident services and community flows"
```

---

### Task 9: Build the Admin Overview, Properties, Units, and Residents

**Files:**
- Create: `src/jeerah/admin/AdminApp.tsx`
- Create: `src/jeerah/admin/AdminShell.tsx`
- Create: `src/jeerah/admin/components/KpiCard.tsx`
- Create: `src/jeerah/admin/components/DataTable.tsx`
- Create: `src/jeerah/admin/components/AdminEmptyState.tsx`
- Create: `src/jeerah/admin/selectors.ts`
- Create: `src/jeerah/admin/pages/DashboardPage.tsx`
- Create: `src/jeerah/admin/pages/PropertiesPage.tsx`
- Create: `src/jeerah/admin/pages/UnitsPage.tsx`
- Create: `src/jeerah/admin/pages/ResidentsPage.tsx`
- Modify: `src/jeerah/JeerahPrototype.tsx`
- Modify: `src/prototype.css`
- Modify: `tests/jeerah/helpers/renderDemo.tsx`
- Test: `tests/jeerah/admin-overview.test.tsx`

**Interfaces:**
- Consumes: shared state, pulse calculation, i18n, direct SurfacePortal.
- Produces: `AdminApp` route tree for `dashboard`, `properties`, `units`, and `residents`.
- Produces: KPI selectors calculated only from `DemoState`.
- Extends the test harness with `renderAdmin({ viewportWidth?, locale? })`; viewport setup uses `window.matchMedia` and a resize event, not an unsupported renderer option.

- [ ] **Step 1: Write failing KPI and responsive-navigation tests**

```tsx
import { formatSar } from "../../src/jeerah/domain/format";
import { selectTotalCollected } from "../../src/jeerah/admin/selectors";

it("derives admin totals from shared fixtures", () => {
  renderAdmin();
  expect(screen.getByText("4")).toHaveAccessibleName(/properties/i);
  expect(screen.getByText("12")).toHaveAccessibleName(/units/i);
  expect(screen.getByText(formatSar(selectTotalCollected(createSeedState()), "en"))).toBeInTheDocument();
});

it("opens and closes a full mobile drawer without horizontal overflow", async () => {
  const user = userEvent.setup();
  renderAdmin({ viewportWidth: 390 });
  await user.click(screen.getByRole("button", { name: /open navigation/i }));
  expect(screen.getByRole("dialog", { name: /admin navigation/i })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /close navigation/i }));
  expect(screen.queryByRole("dialog", { name: /admin navigation/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm the admin surface is absent**

Run: `npm run test:run -- tests/jeerah/admin-overview.test.tsx`  
Expected: FAIL because admin modules do not exist.

- [ ] **Step 3: Build the responsive admin shell**

Use a dark fixed sidebar at ≥1024 px, compact rail from 768–1023 px, and a modal full-width drawer below 768 px. The drawer overlays rather than resizes content, locks background scroll, closes on Escape, and restores focus to the trigger. `main` must use `min-width: 0` and tables must scroll inside their own container.

- [ ] **Step 4: Build data-derived dashboard KPIs and charts**

Selectors compute property count, occupied units, outstanding balance, collected amount, open orders, and average pulse. Recharts receives arrays produced from payments and orders; do not hard-code chart labels or values. Include recent activity and urgent maintenance with direct actions.

- [ ] **Step 5: Build property, unit, and resident management**

Provide search, status filters, sortable tables, detail drawers, property galleries, and local edit forms validated with Zod. Empty filtered results use `AdminEmptyState` with a clear reset-filter action. Forms dispatch domain actions and announce success via `aria-live`.

- [ ] **Step 6: Run admin overview tests in both locales**

Run: `npm run test:run -- tests/jeerah/admin-overview.test.tsx`  
Expected: KPI derivation, charts, filters, mobile drawer, RTL layout, and empty-state tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/jeerah/admin src/jeerah/JeerahPrototype.tsx src/prototype.css tests/jeerah/helpers/renderDemo.tsx tests/jeerah/admin-overview.test.tsx
git -c commit.gpgsign=false commit -m "feat: build admin property operations"
```

---

### Task 10: Build Admin Finance, Orders, Publishing, Audit, and Scenario Studio

**Files:**
- Create: `src/jeerah/admin/pages/ExpensesPage.tsx`
- Create: `src/jeerah/admin/pages/PaymentsPage.tsx`
- Create: `src/jeerah/admin/pages/OrdersPage.tsx`
- Create: `src/jeerah/admin/pages/MarketplacePage.tsx`
- Create: `src/jeerah/admin/pages/AnnouncementsPage.tsx`
- Create: `src/jeerah/admin/pages/VisitorsAmenitiesPage.tsx`
- Create: `src/jeerah/admin/pages/AnalyticsPage.tsx`
- Create: `src/jeerah/admin/pages/AuditLogPage.tsx`
- Create: `src/jeerah/admin/pages/SettingsPage.tsx`
- Create: `src/jeerah/admin/components/ScenarioStudio.tsx`
- Modify: `src/jeerah/admin/AdminApp.tsx`
- Modify: `tests/jeerah/helpers/renderDemo.tsx`
- Test: `tests/jeerah/admin-operations.test.tsx`
- Test: `tests/jeerah/live-twin.test.tsx`

**Interfaces:**
- Consumes: every shared domain action and scenario helper.
- Produces explicit demo operations for invoices, service availability/pricing, provider assignment, quote approval, orders, offers, plans, publishing, scenarios, and the live-twin proof path.
- Extends the test harness with `renderLiveTwin()`, returning scoped resident/admin queries and domain-level driver methods backed by two repository instances on the same fake channel.

- [ ] **Step 1: Write failing live-twin and finance tests**

```tsx
it("publishes an invoice that appears in the resident app", async () => {
  const harness = renderLiveTwin();
  await harness.admin.createInvoice({ title: "Pool maintenance", amount: 240, dueDate: "2026-08-12" });
  expect(await harness.resident.findByText(/pool maintenance/i)).toBeInTheDocument();
  expect(harness.admin.getOutstandingTotal()).toContain("240");
});

it("updates admin finance after a resident demo payment", async () => {
  const harness = renderLiveTwin();
  await harness.resident.pay("invoice-elevator", "apple-pay", "paid");
  expect(await harness.admin.findPaymentByReference(/DEMO-/)).toHaveTextContent(/apple pay/i);
  expect(harness.admin.getInvoiceStatus("invoice-elevator")).toBe("paid");
});

it("reflects service availability and quote approval across both surfaces", async () => {
  const harness = renderLiveTwin();
  await harness.admin.setServiceAvailability("smart-lock-installation", false);
  expect(await harness.resident.findService("smart-lock-installation")).toHaveTextContent(/غير متاح|unavailable/i);
  const orderId = await harness.resident.requestQuote("awning-installation");
  await harness.admin.approveQuote(orderId, 1850);
  expect(await harness.resident.findOrder(orderId)).toHaveTextContent(/1,850/);
});
```

- [ ] **Step 2: Run tests and confirm operations are incomplete**

Run: `npm run test:run -- tests/jeerah/admin-operations.test.tsx tests/jeerah/live-twin.test.tsx`  
Expected: FAIL because finance, publishing, and scenario pages do not exist.

- [ ] **Step 3: Build expenses and payment operations**

Create invoice form fields: bilingual title, building, optional unit, amount, tax, due date, category, and notes. Validate positive amount and non-past due date relative to August 3, 2026. Payments table shows brand, masked last four, status, reference, timestamp, and explicit demo badge. Refund action is available only for `paid` demo payments and dispatches a `refunded` record.

- [ ] **Step 4: Build orders, marketplace, offers, announcement, poll, visitor, and amenity operations**

Order controls assign a fictional provider, approve or reject quotes, and append status timeline/audit entries. Marketplace manages the eight families, 35 offerings, provider availability, scope, fulfillment mode, price model, response time, SLA, warranty, demo-verification status, subscriber offers, recurring plans, and group deals. The implemented mutation set is deliberately bounded to enable/disable offering, edit price/ETA/SLA, assign provider, approve quote, change order status, and create/disable offer or plan; provider onboarding is not required. Announcements support normal/important/urgent priority and publish immediately. Poll creation uses 2–4 options. Visitor and amenity pages filter active/expired and upcoming/past records.

- [ ] **Step 5: Build analytics and audit log**

All analytics derive from selectors over shared state. Audit rows include ISO timestamp, actor (`demo-admin` or `resident-saif`), action, entity type, entity ID, and localized description. Provide CSV export by creating a UTF-8 Blob locally; no server request.

- [ ] **Step 6: Build Scenario Studio and reset protection**

The studio opens from Settings and supports exactly: Normal, Empty, Offline, Overdue invoice, Declined payment, and Urgent maintenance. Switching scenario requires one confirmation. Reset requires typing `RESET` and restores seed state while preserving locale.

- [ ] **Step 7: Run operations and live-twin tests**

Run: `npm run test:run -- tests/jeerah/admin-operations.test.tsx tests/jeerah/live-twin.test.tsx`  
Expected: create, publish, pay, refund, service availability, quote approval, provider assignment, order status, offers/plans, audit, CSV, scenario, and reset tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/jeerah/admin tests/jeerah/helpers/renderDemo.tsx tests/jeerah/admin-operations.test.tsx tests/jeerah/live-twin.test.tsx
git -c commit.gpgsign=false commit -m "feat: complete admin live-twin operations"
```

---

### Task 11: Make the Resident Surface Installable and Offline-Aware

**Files:**
- Modify: `index.html`
- Modify: `package.json`
- Create: `public/manifest.webmanifest`
- Create: `scripts/generate-sw.mjs`
- Create: `src/jeerah/pwa/useInstallPrompt.ts`
- Create: `src/jeerah/pwa/InstallPage.tsx`
- Create: `src/jeerah/pwa/registerServiceWorker.ts`
- Modify: `src/jeerah/resident/ResidentApp.tsx`
- Test: `tests/jeerah/pwa.test.tsx`
- Test: `tests/jeerah/service-worker.test.ts`

**Interfaces:**
- Produces: `BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> }`.
- Produces: `InstallPromptState { canInstall, isInstalled, platform, prompt(): Promise<"accepted" | "dismissed" | "unavailable"> }` and `useInstallPrompt(): InstallPromptState`.
- Produces: `registerServiceWorker(): Promise<ServiceWorkerRegistration | null>`.
- Produces: `generateServiceWorker({ distDir, base }): Promise<string>` for the final built artifact.
- Produces offline shell, navigation fallback, same-origin asset caching, and a platform-aware install page.

- [ ] **Step 1: Write failing manifest and install-state tests**

```ts
import { readFileSync } from "node:fs";

it("defines an installable resident start URL", () => {
  const manifest = JSON.parse(readFileSync(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"));
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("./?surface=app");
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(["192x192", "512x512"]);
});
```

```ts
it("generates a service worker from the final hashed build output", async () => {
  const swPath = await generateServiceWorker({ distDir: fixtureDist, base: "/jeerah-smart-demo/" });
  const source = readFileSync(swPath, "utf8");
  expect(source).toContain("assets/index-abc123.js");
  expect(source).toContain("assets/index-def456.css");
  expect(source).toContain("request.mode === \"navigate\"");
  expect(source).toContain("skipWaiting");
  expect(source).toContain("clients.claim");
});
```

```tsx
it("shows iOS Add to Home Screen guidance when native prompt is unavailable", () => {
  render(<InstallPage platform="ios" installEvent={null} />);
  expect(screen.getByText(/share/i)).toBeInTheDocument();
  expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run PWA tests and confirm files are absent**

Run: `npm run test:run -- tests/jeerah/pwa.test.tsx tests/jeerah/service-worker.test.ts`  
Expected: FAIL because PWA files and hooks do not exist.

- [ ] **Step 3: Add manifest and document metadata**

```json
{
  "name": "Jeerah Smart Demo",
  "short_name": "Jeerah",
  "description": "Installable resident experience for the Jeerah Smart demo",
  "start_url": "./?surface=app",
  "scope": "./",
  "display": "standalone",
  "background_color": "#191C2E",
  "theme_color": "#191C2E",
  "lang": "ar",
  "dir": "rtl",
  "icons": [
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ]
}
```

Add manifest, theme-color, Apple mobile web app, and description metadata to `index.html` without changing runtime scripts or root markup.

- [ ] **Step 4: Generate runtime caching from the final production bundle**

Implement `generateServiceWorker({ distDir, base })` so it recursively scans the already-built `dist/client` directory, excludes `sw.js`, and precaches the final hashed JS/CSS, manifest, icons, local fonts, brand assets, and content photography using base-relative URLs. Derive the cache version from a SHA-256 of the sorted file list; never hand-maintain a stale asset list.

The generated worker must call `self.skipWaiting()` during install and `clients.claim()` during activate. It uses an `index.html` fallback only when `request.mode === "navigate"`; same-origin static GET requests use cache-first with a background refresh, and cross-origin or mutation requests pass through untouched. Delete older `jeerah-demo-*` caches during activate. Export the generator for a temporary-directory fixture test and invoke it as a CLI after the Vite build.

Update the release script only now, after the generator exists:

```json
{
  "scripts": {
    "build:pages": "npm run check:runtime && tsc && vite build --base=/jeerah-smart-demo/ && node scripts/generate-sw.mjs --dist=dist/client --base=/jeerah-smart-demo/"
  }
}
```

Register `${import.meta.env.BASE_URL}sw.js` with `{ scope: import.meta.env.BASE_URL }`; never register `/sw.js` from the domain root.

- [ ] **Step 5: Implement install prompt and offline UI**

Capture `beforeinstallprompt`, expose `canInstall`, `isInstalled`, and `prompt()`, and listen for `appinstalled`. On iOS without prompt, display Share → Add to Home Screen steps. When offline, display last-sync time and keep cached read-only data available; disable new payment/order/publish actions with a specific localized explanation.

- [ ] **Step 6: Build, then run PWA tests against the final production artifact**

Run: `npm run build:pages`  
Expected: TypeScript and Vite succeed and `dist/client/index.html`, `dist/client/manifest.webmanifest`, `dist/client/sw.js`, and icons exist.

Run: `npm run test:run -- tests/jeerah/pwa.test.tsx tests/jeerah/service-worker.test.ts`  
Expected: manifest, base-aware registration, install prompt, iOS guidance, offline disablement, generator-fixture, navigation-only fallback, cache-version, and hashed-asset tests pass. The service-worker test reads the final `dist/client/sw.js`, confirms every emitted hashed JS/CSS filename is precached, and verifies the worker scope remains `/jeerah-smart-demo/`.

- [ ] **Step 7: Commit**

```bash
git add index.html package.json public/manifest.webmanifest scripts/generate-sw.mjs src/jeerah/pwa src/jeerah/resident/ResidentApp.tsx tests/jeerah/pwa.test.tsx tests/jeerah/service-worker.test.ts
git -c commit.gpgsign=false commit -m "feat: make Jeerah resident demo installable"
```

---

### Task 12: Accessibility, Visual QA, Documentation, and GitHub Pages Release

**Files:**
- Create: `tests/jeerah/accessibility.test.tsx`
- Create: `scripts/verify-demo.mjs`
- Create: `.github/workflows/pages.yml`
- Create: `README.md`
- Modify: `CREDITS.md`
- Modify: `package.json`
- Create: `outputs/jeerah-smart-demo-handoff.md`

**Interfaces:**
- Consumes: complete resident/admin surfaces and all verification scripts.
- Produces: one clean public repository, one GitHub Pages URL, and a handoff record.
- Extends the harness with `renderCompleteDemo({ locale, surface? })`; it mounts one requested surface at a time to avoid duplicate global roles.

- [ ] **Step 1: Write failing global accessibility checks**

```tsx
it.each(["ar", "en"] as const)("has named primary controls in %s", async (locale) => {
  const { container } = renderCompleteDemo({ locale });
  expect(container.querySelectorAll("button:not([aria-label]):empty")).toHaveLength(0);
  expect(container.querySelectorAll("img:not([alt])")).toHaveLength(0);
});
```

Add focused tests for dialog focus return, `aria-live` payment status, keyboard navigation, RTL table alignment, untranslated-key pattern `/[A-Z_]{3,}\.[A-Z_]{3,}/`, and literal placeholder pattern `/\{\{.+\}\}/`.

Do not assert rendered pixel geometry in JSDOM: `getBoundingClientRect()` returns zero without layout. Enforce the 44×44 target in the shared control CSS contract and verify representative controls in the in-app Browser during Step 7.

- [ ] **Step 2: Run the full test suite and capture failures**

Run: `npm run test:run`  
Expected before final fixes: accessibility tests identify any unnamed controls, missing alt text, or raw copy.

- [ ] **Step 3: Fix every reported accessibility and localization failure**

For each failing control, add a localized visible label or `aria-label`; for every image, use the manifest alt text; for every status mutation, use an `aria-live` region; for every RTL failure, use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) rather than duplicated left/right rules.

- [ ] **Step 4: Add a deterministic release verifier**

```js
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

for (const [command, args] of [
  ["npm", ["run", "check:runtime"]],
  ["npm", ["run", "build:pages"]],
  ["npm", ["run", "test:run"]],
  ["node", ["scripts/verify-assets.mjs"]],
]) {
  execFileSync(command, args, { stdio: "inherit" });
}

for (const path of ["dist/client/index.html", "dist/client/manifest.webmanifest", "dist/client/sw.js"]) {
  if (!existsSync(path)) throw new Error(`Missing release artifact: ${path}`);
}
```

Set `package.json` script `verify:release` to `node scripts/verify-demo.mjs`.
The verifier also parses `dist/client/index.html` and `dist/client/sw.js` to reject domain-root asset URLs and require the `/jeerah-smart-demo/` base for Pages output.

- [ ] **Step 5: Add GitHub Pages workflow**

```yaml
name: Deploy Jeerah Demo
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run verify:release
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/client
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 6: Write the README and credits**

README must include Arabic and English sections, feature summary, local run commands, safe demo accounts, resident/admin URLs, PWA install instructions for Android and iOS, explicit payment simulation disclaimer, architecture, test commands, reset behavior, and privacy statement. CREDITS lists all ImageGen assets and official brand-source packages without copying reference-site credentials.

- [ ] **Step 7: Run the release verifier**

Run: `npm run verify:release`  
Expected: runtime integrity, all Vitest tests, production build, and asset validation pass with exit code 0.

- [ ] **Step 8: Verify visually in the in-app Browser**

Open resident preview, resident direct mode, and admin direct mode in the in-app Browser. Capture matching-size screenshots at 390×844 and 1440×1024. Compare the resident screenshot and accepted visual target together, then fix visible spacing, official-logo use/clear space, typography, cropping, contrast, radius, pattern density, and icon inconsistencies. Repeat comparison after fixes. Measure representative icon buttons and bottom-nav targets to confirm at least 44×44 CSS pixels. Exercise the golden paths: pay invoice, search Arabic service text, open each of the eight service families, book scheduled and on-demand services, request and approve a quote, pause a recurring plan, join a group deal, gift a neighbor, publish invoice, toggle service availability, confirm live sync, create visitor QR, change language, switch scenario, reset, and open install guidance.

- [ ] **Step 9: Commit the verified release files**

```bash
git add .github/workflows/pages.yml README.md CREDITS.md package.json package-lock.json scripts/verify-demo.mjs tests/jeerah/accessibility.test.tsx outputs/jeerah-smart-demo-handoff.md src public
git -c commit.gpgsign=false commit -m "docs: prepare Jeerah demo release"
```

- [ ] **Step 10: Create and publish the GitHub repository**

```bash
gh auth status
gh api user --jq .login
gh repo create arahman1700/jeerah-smart-demo --public --source=. --remote=origin --description "Installable Jeerah Smart resident and admin demo"
git push -u origin HEAD:main
gh api -X POST repos/arahman1700/jeerah-smart-demo/pages -f build_type=workflow
release_sha=$(git rev-parse HEAD)
run_id=""
for attempt in {1..30}; do
  run_id=$(gh run list --repo arahman1700/jeerah-smart-demo --workflow "Deploy Jeerah Demo" --branch main --commit "$release_sha" --limit 1 --json databaseId --jq '.[0].databaseId')
  test -n "$run_id" && break
  sleep 2
done
test -n "$run_id"
gh run watch "$run_id" --repo arahman1700/jeerah-smart-demo --exit-status
```

Confirm the authenticated account is exactly `arahman1700` before creating or pushing. If the repository already exists, inspect its owner, visibility, default branch, remotes, and current tree before deciding whether it is safe to reuse; never overwrite an unrelated repository. If Pages already exists, skip the creation API call and inspect the existing Pages configuration instead of treating HTTP 409 as a failure.

- [ ] **Step 11: Verify the remote evidence**

Run: `git status --short --branch`  
Expected: the current release branch tracks `origin/main` with no tracked changes.

Run: `gh repo view arahman1700/jeerah-smart-demo --json url,visibility,defaultBranchRef`  
Expected: public repository URL and default branch `main`.

Run: `gh api repos/arahman1700/jeerah-smart-demo/pages --jq '.html_url + " " + .status'`  
Expected: GitHub Pages URL with status `built`.

- [ ] **Step 12: Deliver the trial links**

Write the repository URL, GitHub Pages URL, resident query URL, admin query URL, demo payment disclaimer, install steps, exact verified commit SHA, and test summary to `outputs/jeerah-smart-demo-handoff.md`. Provide those same links to the user only after opening the deployed Pages URL and confirming the resident and admin entry points render.

---

## Plan Self-Review Checklist

- [x] Every section of the approved design spec maps to Tasks 2–12.
- [x] Every referenced type and function is introduced before consumption.
- [x] No task modifies the protected mobile runtime files.
- [x] No task captures real payment or identity data.
- [x] Every task ends with an independently verifiable deliverable and commit.
- [x] The final release verifier covers runtime integrity, unit/UI tests, build, and assets.
- [x] Browser QA uses the in-app Browser and compares the accepted reference with the implementation.
