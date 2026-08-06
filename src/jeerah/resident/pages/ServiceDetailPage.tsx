import { CaretRight } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatSar } from "../../domain/format";
import { isSubscriber } from "../../domain/residentView";
import { offerSavings, resolveServiceExperience } from "../../domain/serviceCatalog";
import { useI18n } from "../../i18n/I18nProvider";
import { recurringPlanCadenceMessageKey, serviceFulfillmentMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { NeighborDealCard } from "../components/NeighborDeal";
import { ResidentPage, Ltr } from "../components/ResidentPage";
import { ServicePassport } from "../components/ServicePassport";
import { useDemoMutation, LiveMessage } from "../components/ServiceBits";

/** The single offering screen: passport, providers, offers, group deal, next action. */
export function ServiceDetailPage({ serviceId, flow }: { serviceId: string; flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const { message, run } = useDemoMutation();
  const experience = resolveServiceExperience(state, serviceId);

  if (!experience) {
    return (
      <ResidentPage screen="service" footerClearance>
        <p className="resident-card resident-empty" data-testid="missing-entity">{t("error.not_found")}</p>
      </ResidentPage>
    );
  }

  const { service, providers, deal, offers, plan, nextAction } = experience;
  const subscriber = isSubscriber(state);
  const offer = offers[0];
  const joined = Boolean(deal?.participantIds.includes(state.currentResidentId));

  return (
    <ResidentPage screen="service" footerClearance>
      <ServicePassport experience={experience} />

      {offer ? (
        <section className="resident-card resident-offer-inline" aria-label={t("offer.member")}>
          <p className="resident-eyebrow">{t("offer.exclusive")}</p>
          <p className="resident-offer-inline__line">
            {t("offer.saving_line", { regular: formatSar(offer.regularPrice, locale), member: formatSar(offer.memberPrice, locale) })}
          </p>
          <p className="resident-offer-card__badge">{t("offer.discount", { percent: offerSavings(offer).percent })}</p>
          <p className="resident-notice">{subscriber ? t("offer.subscriber_active") : t("offer.upgrade_intro")}</p>
          <button type="button" className="resident-secondary-button" onClick={() => flow.push(getResidentRoute({ kind: "offers" }))}>
            {t("action.view_offers")}
          </button>
        </section>
      ) : null}

      <section className="resident-section" aria-label={t("table.provider")}>
        <h2 className="resident-section__heading">{t("service.provider_count", { count: providers.length })}</h2>
        <div className="resident-row-list">
          {providers.map((provider) => (
            <button
              type="button"
              key={provider.id}
              className="resident-card resident-row"
              onClick={() => flow.push(getResidentRoute({ kind: "provider", providerId: provider.id }))}
              data-testid={`provider-row-${provider.id}`}
            >
              <span className="resident-row__copy">
                <strong>{provider.name[locale]}</strong>
                <small>{t("provider.rating", { rating: provider.rating.toFixed(1), count: provider.reviewCount })}</small>
              </span>
              <CaretRight aria-hidden="true" weight="bold" />
            </button>
          ))}
        </div>
        {providers.length > 1 ? (
          <button type="button" className="resident-secondary-button" onClick={() => flow.push(getResidentRoute({ kind: "compare", serviceId: service.id }))} data-testid="open-compare">
            {t("action.compare")}
          </button>
        ) : null}
      </section>

      {plan ? (
        <section className="resident-card" aria-label={t("plan.recurring")} data-testid="service-plan">
          <p className="resident-eyebrow">{t("plan.recurring")}</p>
          <p className="resident-passport__copy">
            {t(recurringPlanCadenceMessageKey[plan.cadence])} · {plan.active ? t("status.active") : t("plan.paused")}
          </p>
          <button type="button" className="resident-secondary-button" onClick={() => flow.push(getResidentRoute({ kind: "plans" }))}>
            {t("action.manage_plans")}
          </button>
        </section>
      ) : null}

      {deal ? (
        <NeighborDealCard
          deal={deal}
          title={service.name[locale]}
          joined={joined}
          onJoin={() => void run({ type: "neighbor-deal/joined", dealId: deal.id, residentId: state.currentResidentId })}
        />
      ) : null}

      {experience.orders.length ? (
        <section className="resident-section" aria-label={t("order.your_orders")}>
          <h2 className="resident-section__heading">{t("order.your_orders")}</h2>
          <div className="resident-row-list">
            {experience.orders.map((order) => (
              <button
                type="button"
                key={order.id}
                className="resident-card resident-row"
                onClick={() => flow.push(getResidentRoute({ kind: "order", orderId: order.id }))}
              >
                <span className="resident-row__copy">
                  <strong>{t(serviceFulfillmentMessageKey[order.fulfillment])}</strong>
                  <small>{order.amount === undefined ? t("status.awaiting_quote") : <Ltr>{formatSar(order.amount, locale)}</Ltr>}</small>
                </span>
                <CaretRight aria-hidden="true" weight="bold" />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <LiveMessage tone="error">{message}</LiveMessage>

      {nextAction.kind === "book" ? (
        <button
          type="button"
          className="resident-primary-button resident-sticky-action"
          onClick={() => flow.push(getResidentRoute({ kind: "book", serviceId: service.id }))}
          data-testid="service-next-action"
        >
          {nextAction.fulfillment === "quote" ? t("action.request_quote") : t("action.book_service")}
          <span className="resident-sticky-action__mode">{t(serviceFulfillmentMessageKey[nextAction.fulfillment])}</span>
        </button>
      ) : (
        <p className="resident-card resident-empty" data-testid="service-unavailable">{t("service.unavailable")}</p>
      )}
    </ResidentPage>
  );
}
