import { Crown, Info } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { isSubscriber } from "../../domain/residentView";
import { offerSavings } from "../../domain/serviceCatalog";
import { useI18n } from "../../i18n/I18nProvider";
import { getResidentRoute } from "../ResidentApp";
import { ResidentPage, Ltr } from "../components/ResidentPage";
import { LiveMessage, ServiceImage, useDemoMutation } from "../components/ServiceBits";

/**
 * The subscriber-exclusive board. Prices are fixed and dated: no countdown, no
 * scarcity claim, and a clearly labeled demo upgrade path for non-subscribers.
 */
export function MemberOffersPage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const { message, run } = useDemoMutation();
  const subscriber = isSubscriber(state);
  const offers = state.memberOffers;

  return (
    <ResidentPage screen="offers" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><Crown weight="duotone" /></span>
        <h1>{t("market.exclusive_title")}</h1>
        <p className="resident-page-title__intro">{t("market.exclusive_intro")}</p>
      </header>

      <section className="resident-card resident-membership" aria-label={t("label.membership")}>
        <p>{subscriber ? t("offer.subscriber_active") : t("offer.upgrade_intro")}</p>
        {subscriber ? null : (
          <button
            type="button"
            className="resident-primary-button"
            data-testid="upgrade-membership"
            onClick={() => void run({ type: "membership/upgraded", residentId: state.currentResidentId })}
          >
            {t("action.upgrade_membership")}
          </button>
        )}
        {subscriber ? <p className="resident-notice" data-testid="membership-active">{t("offer.upgrade_done")}</p> : null}
        <LiveMessage tone="error">{message}</LiveMessage>
      </section>

      <div className="resident-offer-grid">
        {offers.map((offer, index) => {
          const saving = offerSavings(offer);
          const service = state.serviceOfferings.find((item) => item.id === offer.serviceId);
          const provider = state.providers.find((item) => item.id === offer.providerId);
          return (
            <motion.article
              key={offer.id}
              className="resident-card resident-offer-detail"
              data-testid={`offer-detail-${offer.id}`}
              data-active={offer.active ? "true" : "false"}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.28, delay: Math.min(index, 8) * 0.02 }}
            >
              {service ? <ServiceImage imageId={service.imageId} locale={locale} className="resident-offer-detail__photo" /> : null}
              <p className="resident-eyebrow">{t("offer.exclusive")}</p>
              <h2>{offer.title[locale]}</h2>

              <p className="resident-offer-card__prices">
                <span>{t("offer.previous_price")} <Ltr><s className="jeerah-numeric">{formatSar(offer.regularPrice, locale)}</s></Ltr></span>
                <strong>{t("offer.now")} <Ltr testId={`offer-now-${offer.id}`}><b className="jeerah-numeric">{formatSar(offer.memberPrice, locale)}</b></Ltr></strong>
              </p>
              <p className="resident-offer-card__badge">{t("offer.discount", { percent: saving.percent })}</p>

              <dl className="resident-facts">
                <div>
                  <dt>{t("table.expires_at")}</dt>
                  <dd>{formatDate(offer.validUntil, locale)}</dd>
                </div>
                <div>
                  <dt>{t("offer.provider")}</dt>
                  <dd>{provider?.name[locale] ?? ""}</dd>
                </div>
                <div>
                  <dt>{t("offer.eligibility")}</dt>
                  <dd>{offer.terms[locale]}</dd>
                </div>
                <div>
                  <dt>{t("table.status")}</dt>
                  <dd>{t(offer.active ? "status.active" : "status.inactive")}</dd>
                </div>
              </dl>

              {offer.active && service ? (
                <button
                  type="button"
                  className="resident-secondary-button"
                  onClick={() => flow.push(getResidentRoute({ kind: "service", serviceId: offer.serviceId }))}
                  data-testid={`offer-open-${offer.id}`}
                >
                  {t("action.view_details")}
                </button>
              ) : null}
            </motion.article>
          );
        })}
      </div>

      <p className="resident-notice">
        <Info aria-hidden="true" weight="duotone" /> {t("market.exclusive_intro")}
      </p>
    </ResidentPage>
  );
}
