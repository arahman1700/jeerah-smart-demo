import { CaretRight, CheckCircle, Star, WarningCircle } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useState, type ReactNode } from "react";
import { assetUrl } from "../../assets/url";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatSar } from "../../domain/format";
import type { DemoAction, DemoState, Locale, OrderStatus, ServiceOffering } from "../../domain/models";
import type { ServicePriceModel } from "../../domain/serviceCatalog";
import { ServiceFamilyIcon } from "../../design/serviceIconMap";
import { useI18n } from "../../i18n/I18nProvider";
import { orderStatusMessageKey, type MessageKey } from "../../i18n/messages";
import { getResidentAsset } from "./PropertyGallery";

/**
 * Every resident mutation goes through this guard so the offline scenario can
 * keep cached browsing alive while refusing writes with an actionable message.
 */
export function useDemoMutation() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const offline = state.scenario === "offline";

  /** Resolves to the committed state, or null when the offline guard refused. */
  const run = useCallback(async (action: DemoAction): Promise<DemoState | null> => {
    if (offline) {
      setMessage(t("error.mutation_offline"));
      return null;
    }
    setMessage(null);
    return await dispatch(action);
  }, [dispatch, offline, t]);

  return { offline, message, setMessage, run };
}

export function LiveMessage({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" }) {
  if (!children) return null;
  return (
    <p className={`resident-live resident-live--${tone}`} role="status" aria-live="polite">
      {tone === "error" ? <WarningCircle aria-hidden="true" weight="duotone" /> : <CheckCircle aria-hidden="true" weight="duotone" />}
      <span>{children}</span>
    </p>
  );
}

export function ServiceImage({ imageId, locale, className }: { imageId: string; locale: Locale; className?: string }) {
  const entry = getResidentAsset(imageId);
  if (!entry) return null;
  return <img className={className ?? "resident-service-image"} src={assetUrl(entry.path)} alt={entry.alt[locale]} draggable={false} />;
}

type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

export function priceLabel(price: ServicePriceModel, locale: Locale, t: Translate): string {
  if (price.model === "fixed") return formatSar(price.amount ?? 0, locale);
  if (price.model === "starting-at") return t("service.starting_from", { amount: formatSar(price.amount ?? 0, locale) });
  if (price.model === "per-unit") return t("service.per_unit", { amount: formatSar(price.amount ?? 0, locale), unit: price.unitLabel?.[locale] ?? "" });
  return t("service.quote_range", { min: formatSar(price.range?.min ?? 0, locale), max: formatSar(price.range?.max ?? 0, locale) });
}

const PULSING_STATUSES = new Set<OrderStatus>(["assigned", "en-route", "in-progress", "awaiting-resident-approval"]);

export function OrderStatusPill({ status, testId }: { status: OrderStatus; testId?: string }) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const live = PULSING_STATUSES.has(status);
  return (
    <motion.span
      className="resident-status-pill"
      data-testid={testId}
      data-status={status}
      data-live={live ? "true" : "false"}
      animate={live && !reduceMotion ? { opacity: [1, 0.62, 1] } : { opacity: 1 }}
      transition={live && !reduceMotion ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
    >
      {t(orderStatusMessageKey[status])}
    </motion.span>
  );
}

export function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="resident-stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star key={value} aria-hidden="true" weight={value <= rating ? "fill" : "duotone"} />
      ))}
    </span>
  );
}

/** A catalog tile: curated glyph, localized copy, price semantics, and a real CTA. */
export function ServiceCard({ service, price, onOpen, index = 0 }: {
  service: ServiceOffering;
  price: ServicePriceModel;
  onOpen: () => void;
  index?: number;
}) {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      className="resident-card resident-service-card"
      data-testid={`service-card-${service.key}`}
      onClick={onOpen}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, delay: Math.min(index, 8) * 0.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
    >
      <span className="resident-service-card__glyph" aria-hidden="true">
        <ServiceFamilyIcon familyId={service.familyId} serviceKey={service.key} label={service.name[locale]} />
      </span>
      <span className="resident-service-card__copy">
        <strong>{service.name[locale]}</strong>
        <small>{service.description[locale]}</small>
        <b className="jeerah-numeric">{priceLabel(price, locale, t)}</b>
      </span>
      <CaretRight aria-hidden="true" weight="bold" />
    </motion.button>
  );
}
