import { CaretRight, Crown, MagnifyingGlass, Storefront } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";
import { Carousel } from "../../../mobile/Carousel";
import { KeyboardInput, useKeyboard } from "../../../mobile/Keyboard";
import { useDemoState } from "../../data/DemoProvider";
import type { FlowControls } from "../../../mobile/FlowStack";
import { formatDate, formatSar } from "../../domain/format";
import type { PricingModel, ServiceFulfillment, ServiceScope } from "../../domain/models";
import { activeResidentOrder, isSubscriber } from "../../domain/residentView";
import { offerSavings, searchServiceCatalog, servicePriceModel } from "../../domain/serviceCatalog";
import { ServiceFamilyIcon } from "../../design/serviceIconMap";
import { useI18n } from "../../i18n/I18nProvider";
import {
  serviceFamilyMessageKey, serviceFulfillmentMessageKey, servicePricingMessageKey, serviceScopeMessageKey,
} from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { OrderStatusPill, ServiceCard } from "../components/ServiceBits";
import { ResidentPage, Ltr } from "../components/ResidentPage";

const SCOPES: ServiceScope[] = ["apartment", "building"];
const MODES: ServiceFulfillment[] = ["on-demand", "scheduled", "recurring", "quote", "group"];
const PRICE_MODELS: PricingModel[] = ["fixed", "starting-at", "per-unit", "quote-required"];

/**
 * The catalog entry point: search, the resident's own live order, the
 * subscriber-exclusive rail, the eight families, and honest filters. Every card
 * here resolves to a real destination.
 */
export function MarketplacePage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const keyboard = useKeyboard();
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ServiceScope | undefined>();
  const [mode, setMode] = useState<ServiceFulfillment | undefined>();
  const [pricingModel, setPricingModel] = useState<PricingModel | undefined>();
  const [availableOnly, setAvailableOnly] = useState(false);

  const filtering = Boolean(query.trim() || scope || mode || pricingModel || availableOnly);
  const results = useMemo(
    () => searchServiceCatalog(state, query, { scope, fulfillment: mode, pricingModel, ...(availableOnly ? { active: true } : {}) }),
    [state, query, scope, mode, pricingModel, availableOnly],
  );

  const order = activeResidentOrder(state);
  const orderService = state.serviceOfferings.find((item) => item.id === order?.serviceId);
  const subscriber = isSubscriber(state);
  const offers = state.memberOffers.filter((offer) => offer.active);

  const openService = (serviceId: string) => flow.push(getResidentRoute({ kind: "service", serviceId }));

  return (
    <ResidentPage screen="marketplace" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><Storefront weight="duotone" /></span>
        <h1>{t("nav.marketplace")}</h1>
        <p className="resident-page-title__intro">{t("resident.marketplace_description")}</p>
      </header>

      <div className="resident-search">
        <MagnifyingGlass aria-hidden="true" weight="duotone" />
        <KeyboardInput
          type="search"
          aria-label={t("form.search_services")}
          placeholder={t("form.search_services")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => keyboard.hide()}
          data-testid="service-search"
        />
      </div>
      <p className="resident-search__hint">{t("market.search_hint")}</p>

      {order && orderService ? (
        <button
          type="button"
          className="resident-card resident-active-order"
          onClick={() => flow.push(getResidentRoute({ kind: "order", orderId: order.id }))}
          data-testid="active-order"
        >
          <span className="resident-row__copy">
            <small>{t("market.active_order")}</small>
            <strong>{orderService.name[locale]}</strong>
          </span>
          <OrderStatusPill status={order.status} />
          <CaretRight aria-hidden="true" weight="bold" />
        </button>
      ) : null}

      <motion.section
        className="resident-exclusive"
        aria-label={t("market.exclusive_title")}
        data-testid="subscriber-exclusives"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.32 }}
      >
        <header className="resident-exclusive__header">
          <span className="resident-exclusive__crown" aria-hidden="true"><Crown weight="duotone" /></span>
          <div>
            <h2>{t("market.exclusive_title")}</h2>
            <p>{t("market.exclusive_intro")}</p>
          </div>
        </header>

        <Carousel ariaLabel={t("nav.offers")} className="resident-offer-rail" contentClassName="resident-offer-rail__track">
          {offers.map((offer) => {
            const saving = offerSavings(offer);
            const provider = state.providers.find((item) => item.id === offer.providerId);
            return (
              <article className="resident-offer-card" key={offer.id} data-testid={`offer-${offer.id}`}>
                <p className="resident-eyebrow">{t("offer.exclusive")}</p>
                <h3>{offer.title[locale]}</h3>
                <p className="resident-offer-card__prices">
                  <span>{t("offer.previous_price")} <Ltr><s className="jeerah-numeric">{formatSar(offer.regularPrice, locale)}</s></Ltr></span>
                  <strong>{t("offer.now")} <Ltr><b className="jeerah-numeric">{formatSar(offer.memberPrice, locale)}</b></Ltr></strong>
                </p>
                <p className="resident-offer-card__badge">{t("offer.discount", { percent: saving.percent })}</p>
                <p className="resident-offer-card__meta">{t("offer.valid_until", { date: formatDate(offer.validUntil, locale) })}</p>
                <p className="resident-offer-card__meta">{t("offer.provider")}: {provider?.name[locale] ?? ""}</p>
                <p className="resident-offer-card__terms">{offer.terms[locale]}</p>
                <button type="button" className="resident-secondary-button" onClick={() => openService(offer.serviceId)}>
                  {t("action.view_details")}
                </button>
              </article>
            );
          })}
        </Carousel>

        <p className="resident-exclusive__status">{subscriber ? t("offer.subscriber_active") : t("offer.upgrade_intro")}</p>
        <button type="button" className="resident-primary-button" onClick={() => flow.push(getResidentRoute({ kind: "offers" }))} data-testid="open-offers">
          {t("action.view_offers")}
        </button>
      </motion.section>

      <section className="resident-section" aria-label={t("market.filters")}>
        <h2 className="resident-section__heading">{t("market.filters")}</h2>
        <FilterRow label={t("market.filter_scope")}>
          {SCOPES.map((value) => (
            <FilterChip key={value} selected={scope === value} onSelect={() => setScope(scope === value ? undefined : value)}>
              {t(serviceScopeMessageKey[value])}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label={t("market.filter_mode")}>
          {MODES.map((value) => (
            <FilterChip key={value} selected={mode === value} onSelect={() => setMode(mode === value ? undefined : value)}>
              {t(serviceFulfillmentMessageKey[value])}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label={t("market.filter_price")}>
          {PRICE_MODELS.map((value) => (
            <FilterChip key={value} selected={pricingModel === value} onSelect={() => setPricingModel(pricingModel === value ? undefined : value)}>
              {t(servicePricingMessageKey[value])}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label={t("market.filter_availability")}>
          <FilterChip selected={availableOnly} onSelect={() => setAvailableOnly(!availableOnly)}>{t("status.available")}</FilterChip>
        </FilterRow>
      </section>

      {filtering ? (
        <section className="resident-section" aria-label={t("market.all_services")}>
          <h2 className="resident-section__heading">{t("market.results", { count: results.length })}</h2>
          {results.length ? (
            <div className="resident-row-list">
              {results.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  price={servicePriceModel(service)}
                  index={index}
                  onOpen={() => openService(service.id)}
                />
              ))}
            </div>
          ) : <p className="resident-card resident-empty">{t("market.no_results")}</p>}
        </section>
      ) : (
        <section className="resident-section" aria-label={t("market.families")}>
          <h2 className="resident-section__heading">{t("market.families")}</h2>
          <div className="resident-family-grid">
            {state.serviceFamilies.map((family, index) => {
              const count = state.serviceOfferings.filter((service) => service.familyId === family.id).length;
              return (
                <motion.button
                  type="button"
                  key={family.id}
                  className="resident-card resident-family-tile"
                  data-testid={`family-tile-${family.id}`}
                  onClick={() => flow.push(getResidentRoute({ kind: "family", familyId: family.id }))}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.26, delay: index * 0.03 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                >
                  <span className="resident-family-tile__glyph" aria-hidden="true">
                    <ServiceFamilyIcon familyId={family.id} label={family.name[locale]} />
                  </span>
                  <strong>{t(serviceFamilyMessageKey[family.id])}</strong>
                  <small>{t("market.family_count", { count })}</small>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      <section className="resident-section" aria-label={t("nav.services")}>
        <div className="resident-row-list">
          <button type="button" className="resident-card resident-row" onClick={() => flow.push(getResidentRoute({ kind: "plans" }))}>
            <span className="resident-row__copy"><strong>{t("action.manage_plans")}</strong></span>
            <CaretRight aria-hidden="true" weight="bold" />
          </button>
          <button type="button" className="resident-card resident-row" onClick={() => flow.push(getResidentRoute({ kind: "gift" }))}>
            <span className="resident-row__copy"><strong>{t("action.gift_neighbor")}</strong></span>
            <CaretRight aria-hidden="true" weight="bold" />
          </button>
        </div>
      </section>
    </ResidentPage>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="resident-filter-group">
      <p className="resident-filter-group__label">{label}</p>
      <div className="resident-filter-row" role="group" aria-label={label}>{children}</div>
    </div>
  );
}

function FilterChip({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button type="button" className="resident-filter" data-selected={selected ? "true" : "false"} aria-pressed={selected} onClick={onSelect}>
      {children}
    </button>
  );
}
