import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { useMobileDevice } from "../../mobile/Device";
import type { FlowControls, FlowScreen } from "../../mobile/FlowStack";
import { FlowStack } from "../../mobile/FlowStack";
import { useI18n } from "../i18n/I18nProvider";
import { ResidentNav, toResidentNavId } from "./ResidentNav";
import { BuildingPage } from "./pages/BuildingPage";
import { HomePage } from "./pages/HomePage";
import { PropertiesPage } from "./pages/PropertiesPage";
import { SecondaryPage, type SecondaryScreenId } from "./pages/SecondaryPage";
import { UnitPage } from "./pages/UnitPage";

export type ResidentScreenId =
  | "home" | "properties" | "building" | "unit" | "expenses"
  | "marketplace" | "orders" | "community" | "profile" | "install";

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

const buildingScreens = new Map<string, FlowScreen>();
const unitScreens = new Map<string, FlowScreen>();
const rootScreens = new Map<ResidentScreenId, FlowScreen>();

export function getBuildingScreen(buildingId: string): FlowScreen {
  const existing = buildingScreens.get(buildingId);
  if (existing) return existing;
  const screen: FlowScreen = {
    id: "building",
    header: (flow) => <DetailHeader flow={flow} fallback={() => getResidentScreen("properties")} />,
    headerHeight: HEADER_HEIGHT,
    footer,
    footerHeight: FOOTER_HEIGHT,
    render: (flow) => <BuildingPage buildingId={buildingId} flow={flow} />,
  };
  buildingScreens.set(buildingId, screen);
  return screen;
}

export function getUnitScreen(unitId: string): FlowScreen {
  const existing = unitScreens.get(unitId);
  if (existing) return existing;
  const screen: FlowScreen = {
    id: "unit",
    header: (flow) => <DetailHeader flow={flow} fallback={() => getResidentScreen("properties")} />,
    headerHeight: HEADER_HEIGHT,
    footer,
    footerHeight: FOOTER_HEIGHT,
    render: (flow) => <UnitPage unitId={unitId} flow={flow} />,
  };
  unitScreens.set(unitId, screen);
  return screen;
}

function createRootScreen(id: Exclude<ResidentScreenId, "building" | "unit">): FlowScreen {
  const base = { id, footer, footerHeight: FOOTER_HEIGHT };
  if (id === "home") return { ...base, render: (flow) => <HomePage flow={flow} /> };
  if (id === "properties") return { ...base, render: (flow) => <PropertiesPage flow={flow} /> };
  return { ...base, render: () => <SecondaryPage id={id as SecondaryScreenId} /> };
}

export function getResidentScreen(id: ResidentScreenId): FlowScreen {
  if (id === "building") return getBuildingScreen("building-89");
  if (id === "unit") return getUnitScreen("unit-89-1204");
  const existing = rootScreens.get(id);
  if (existing) return existing;
  const screen = createRootScreen(id);
  rootScreens.set(id, screen);
  return screen;
}

export function ResidentApp({ initialScreen = "home" }: { initialScreen?: ResidentScreenId }) {
  const { dir, locale, t } = useI18n();
  const { device } = useMobileDevice();
  const reduceMotion = useReducedMotion();

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
      <FlowStack initial={getResidentScreen(initialScreen)} />
    </section>
  );
}
