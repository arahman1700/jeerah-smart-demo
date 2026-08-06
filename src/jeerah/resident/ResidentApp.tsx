import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import { useEffect, type CSSProperties } from "react";
import { useMobileDevice } from "../../mobile/Device";
import type { FlowControls, FlowScreen } from "../../mobile/FlowStack";
import { FlowStack } from "../../mobile/FlowStack";
import type { ServiceFamilyId } from "../domain/models";
import { useI18n } from "../i18n/I18nProvider";
import { registerServiceWorker } from "../pwa/registerServiceWorker";
import { PaymentSimulationProvider, type PaymentSimulationConfig } from "./PaymentSimulation";
import { ResidentNav, toResidentNavId } from "./ResidentNav";
import { AmenitiesPage } from "./pages/AmenitiesPage";
import { BookServicePage } from "./pages/BookServicePage";
import { BuildingPage } from "./pages/BuildingPage";
import { CommunityPage } from "./pages/CommunityPage";
import { CompareProvidersPage } from "./pages/CompareProvidersPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { GiftNeighborPage } from "./pages/GiftNeighborPage";
import { HomePage } from "./pages/HomePage";
import { InvoicePage } from "./pages/InvoicePage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { MemberOffersPage } from "./pages/MemberOffersPage";
import { OrderTimelinePage } from "./pages/OrderTimelinePage";
import { OrdersPage } from "./pages/OrdersPage";
import { PaymentHistoryPage } from "./pages/PaymentHistoryPage";
import { PaymentPage } from "./pages/PaymentPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { ProviderPage } from "./pages/ProviderPage";
import { RecurringPlansPage } from "./pages/RecurringPlansPage";
import { SecondaryPage } from "./pages/SecondaryPage";
import { ServiceDetailPage } from "./pages/ServiceDetailPage";
import { ServiceFamilyPage } from "./pages/ServiceFamilyPage";
import { UnitPage } from "./pages/UnitPage";
import { VisitorPassPage } from "./pages/VisitorPassPage";

export type ResidentScreenId =
  | "home" | "properties" | "building" | "unit" | "expenses"
  | "marketplace" | "orders" | "community" | "profile" | "install";

export type ResidentRootId = Exclude<ResidentScreenId, "building" | "unit">;

/**
 * Every resident destination is one discriminated route. Screens capture only
 * stable IDs, so locale changes and repository updates keep flowing into an
 * already-pushed detail screen instead of freezing a snapshot.
 */
export type ResidentRoute =
  | { kind: "root"; id: ResidentRootId }
  | { kind: "building"; buildingId: string }
  | { kind: "unit"; unitId: string }
  | { kind: "invoice"; invoiceId: string }
  | { kind: "payment"; invoiceId: string }
  | { kind: "payment-history" }
  | { kind: "family"; familyId: ServiceFamilyId }
  | { kind: "service"; serviceId: string }
  | { kind: "provider"; providerId: string }
  | { kind: "compare"; serviceId: string }
  | { kind: "book"; serviceId: string; providerId?: string }
  | { kind: "order"; orderId: string }
  | { kind: "offers" }
  | { kind: "plans" }
  | { kind: "gift" }
  | { kind: "visitor" }
  | { kind: "amenities" };

/** Visible height of the resident tab bar. Safe-area clearance is added by CSS. */
const FOOTER_HEIGHT = 64;
const HEADER_HEIGHT = 56;

function footer(flow: FlowControls) {
  return (
    <ResidentNav
      active={toResidentNavId(flow.current.id)}
      onNavigate={(id) => flow.replace(getResidentScreen(id))}
    />
  );
}

function DetailHeader({ flow, fallback }: { flow: FlowControls; fallback: () => FlowScreen }) {
  const { dir, t } = useI18n();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="resident-detail-header">
      <button
        type="button"
        className="resident-back"
        onClick={() => (flow.canGoBack ? flow.pop() : flow.replace(fallback()))}
      >
        <BackIcon aria-hidden="true" weight="bold" />
        <span>{t("action.back")}</span>
      </button>
    </div>
  );
}

function routeKey(route: ResidentRoute): string {
  switch (route.kind) {
    case "root": return `root:${route.id}`;
    case "building": return `building:${route.buildingId}`;
    case "unit": return `unit:${route.unitId}`;
    case "invoice": return `invoice:${route.invoiceId}`;
    case "payment": return `payment:${route.invoiceId}`;
    case "family": return `family:${route.familyId}`;
    case "service": return `service:${route.serviceId}`;
    case "provider": return `provider:${route.providerId}`;
    case "compare": return `compare:${route.serviceId}`;
    case "book": return `book:${route.serviceId}:${route.providerId ?? ""}`;
    case "order": return `order:${route.orderId}`;
    default: return route.kind;
  }
}

const marketplaceRoot = () => getResidentScreen("marketplace");
const ordersRoot = () => getResidentScreen("orders");
const communityRoot = () => getResidentScreen("community");

function createRootScreen(id: ResidentRootId): FlowScreen {
  const base = { id, footer, footerHeight: FOOTER_HEIGHT };
  if (id === "home") return { ...base, render: (flow) => <HomePage flow={flow} /> };
  if (id === "properties") return { ...base, render: (flow) => <PropertiesPage flow={flow} /> };
  if (id === "expenses") return { ...base, render: (flow) => <ExpensesPage flow={flow} /> };
  if (id === "marketplace") return { ...base, render: (flow) => <MarketplacePage flow={flow} /> };
  if (id === "orders") return { ...base, render: (flow) => <OrdersPage flow={flow} /> };
  if (id === "community") return { ...base, render: (flow) => <CommunityPage flow={flow} /> };
  if (id === "profile") return { ...base, render: (flow) => <ProfilePage flow={flow} /> };
  return { ...base, render: () => <SecondaryPage id="install" /> };
}

function createScreen(route: ResidentRoute): FlowScreen {
  const detail = (id: string, render: FlowScreen["render"], fallback: () => FlowScreen, withFooter = true): FlowScreen => ({
    id,
    header: (flow: FlowControls) => <DetailHeader flow={flow} fallback={fallback} />,
    headerHeight: HEADER_HEIGHT,
    ...(withFooter ? { footer, footerHeight: FOOTER_HEIGHT } : {}),
    render,
  });
  const expensesRoot = () => getResidentScreen("expenses");
  const propertiesRoot = () => getResidentScreen("properties");

  switch (route.kind) {
    case "root": return createRootScreen(route.id);
    case "building": return detail("building", (flow) => <BuildingPage buildingId={route.buildingId} flow={flow} />, propertiesRoot);
    case "unit": return detail("unit", (flow) => <UnitPage unitId={route.unitId} flow={flow} />, propertiesRoot);
    case "invoice": return detail("invoice", (flow) => <InvoicePage invoiceId={route.invoiceId} flow={flow} />, expensesRoot, false);
    /** The payment route owns its own Back control because it locks during processing. */
    case "payment": return { id: "payment", render: (flow) => <PaymentPage invoiceId={route.invoiceId} flow={flow} /> };
    case "payment-history": return detail("payment-history", () => <PaymentHistoryPage />, expensesRoot, false);
    case "family": return detail("family", (flow) => <ServiceFamilyPage familyId={route.familyId} flow={flow} />, marketplaceRoot);
    case "service": return detail("service", (flow) => <ServiceDetailPage serviceId={route.serviceId} flow={flow} />, marketplaceRoot);
    case "provider": return detail("provider", (flow) => <ProviderPage providerId={route.providerId} flow={flow} />, marketplaceRoot);
    case "compare": return detail("compare", (flow) => <CompareProvidersPage serviceId={route.serviceId} flow={flow} />, marketplaceRoot);
    case "book": return detail("book", (flow) => <BookServicePage serviceId={route.serviceId} providerId={route.providerId} flow={flow} />, marketplaceRoot, false);
    case "order": return detail("order", (flow) => <OrderTimelinePage orderId={route.orderId} flow={flow} />, ordersRoot);
    case "offers": return detail("offers", (flow) => <MemberOffersPage flow={flow} />, marketplaceRoot);
    case "plans": return detail("plans", (flow) => <RecurringPlansPage flow={flow} />, marketplaceRoot);
    case "gift": return detail("gift", () => <GiftNeighborPage />, marketplaceRoot);
    case "visitor": return detail("visitor", () => <VisitorPassPage />, communityRoot);
    case "amenities": return detail("amenities", () => <AmenitiesPage />, communityRoot);
  }
}

const screens = new Map<string, FlowScreen>();

/** Stable identity per route key so FlowStack never remounts an open screen. */
export function getResidentRoute(route: ResidentRoute): FlowScreen {
  const key = routeKey(route);
  const existing = screens.get(key);
  if (existing) return existing;
  const screen = createScreen(route);
  screens.set(key, screen);
  return screen;
}

export function getResidentScreen(id: ResidentScreenId): FlowScreen {
  if (id === "building") return getResidentRoute({ kind: "building", buildingId: "building-89" });
  if (id === "unit") return getResidentRoute({ kind: "unit", unitId: "unit-89-1204" });
  return getResidentRoute({ kind: "root", id });
}

export const getBuildingScreen = (buildingId: string) => getResidentRoute({ kind: "building", buildingId });
export const getUnitScreen = (unitId: string) => getResidentRoute({ kind: "unit", unitId });
export const getInvoiceScreen = (invoiceId: string) => getResidentRoute({ kind: "invoice", invoiceId });
export const getPaymentScreen = (invoiceId: string) => getResidentRoute({ kind: "payment", invoiceId });
export const getPaymentHistoryScreen = () => getResidentRoute({ kind: "payment-history" });

export function ResidentApp({ initialScreen = "home", simulation }: {
  initialScreen?: ResidentScreenId;
  simulation?: PaymentSimulationConfig;
}) {
  const { dir, locale, t } = useI18n();
  const { device } = useMobileDevice();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // The worker only exists in built output; skip it in dev and tests.
    if (import.meta.env.PROD) void registerServiceWorker();
  }, []);

  return (
    <section
      role="application"
      aria-label={t("app.demo")}
      className="resident-app"
      data-resident-app
      data-reduced-motion={reduceMotion ? "true" : "false"}
      dir={dir}
      lang={locale}
      style={{ "--resident-safe-top": `${device.geometry.safeArea.top}px` } as CSSProperties}
    >
      <PaymentSimulationProvider config={simulation}>
        <FlowStack initial={getResidentScreen(initialScreen)} />
      </PaymentSimulationProvider>
    </section>
  );
}
