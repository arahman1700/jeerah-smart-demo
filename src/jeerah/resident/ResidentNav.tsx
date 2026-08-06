import { Buildings, House, ShoppingBag, Storefront, UserCircle } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "../i18n/I18nProvider";
import type { ResidentScreenId } from "./ResidentApp";

export type ResidentNavId = "home" | "properties" | "orders" | "marketplace" | "profile";

const navIdByScreenId: Partial<Record<ResidentScreenId, ResidentNavId>> = {
  home: "home",
  properties: "properties",
  building: "properties",
  unit: "properties",
  orders: "orders",
  marketplace: "marketplace",
  profile: "profile",
  install: "profile",
};

/** Screens without a tab of their own (expenses, community) keep every tab unselected. */
export function toResidentNavId(screenId: string): ResidentNavId | undefined {
  return navIdByScreenId[screenId as ResidentScreenId];
}

export function ResidentNav({ active, onNavigate }: {
  active?: ResidentNavId;
  onNavigate: (screenId: ResidentScreenId) => void;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const items = [
    { id: "home", label: t("nav.home"), icon: House },
    { id: "properties", label: t("nav.properties"), icon: Buildings },
    { id: "orders", label: t("nav.orders"), icon: ShoppingBag },
    { id: "marketplace", label: t("nav.marketplace"), icon: Storefront },
    { id: "profile", label: t("nav.profile"), icon: UserCircle },
  ] as const;

  return (
    <nav className="resident-nav" aria-label={t("app.name")}>
      {items.map(({ id, icon: Icon, label }) => {
        const selected = active === id;
        return (
          <button
            type="button"
            key={id}
            className="resident-nav__item"
            data-selected={selected ? "true" : "false"}
            aria-current={selected ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            {selected ? (
              <motion.span
                className="resident-nav__active"
                layoutId="resident-active-nav"
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
              />
            ) : null}
            <Icon aria-hidden="true" weight="duotone" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
