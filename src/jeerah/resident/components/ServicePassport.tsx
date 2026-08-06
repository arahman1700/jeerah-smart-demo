import { Clock, SealCheck, ShieldCheck, Timer, UsersFour } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import type { ServiceExperience } from "../../domain/serviceCatalog";
import { ServiceFamilyIcon } from "../../design/serviceIconMap";
import { useI18n } from "../../i18n/I18nProvider";
import { serviceFamilyMessageKey, serviceFulfillmentMessageKey, serviceScopeMessageKey } from "../../i18n/messages";
import { ServiceImage, priceLabel } from "./ServiceBits";

/**
 * The single honest summary of one offering: what it is, who runs it, what it
 * needs from the resident, how it is priced, and how long the demo promises.
 */
export function ServicePassport({ experience }: { experience: ServiceExperience }) {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const { service, family, providers, price } = experience;

  return (
    <motion.section
      className="resident-card resident-passport"
      aria-label={t("service.passport")}
      data-testid={`service-passport-${service.key}`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.32 }}
    >
      <ServiceImage imageId={service.imageId} locale={locale} className="resident-passport__photo" />

      <header className="resident-passport__header">
        <span className="resident-passport__glyph" aria-hidden="true">
          <ServiceFamilyIcon familyId={service.familyId} serviceKey={service.key} label={service.name[locale]} />
        </span>
        <div>
          <p className="resident-eyebrow">{t(serviceFamilyMessageKey[family.id])}</p>
          <h1>{service.name[locale]}</h1>
        </div>
      </header>

      <p className="resident-passport__price jeerah-numeric">{priceLabel(price, locale, t)}</p>

      <ul className="resident-chips resident-passport__chips">
        <li>{t(serviceScopeMessageKey[service.scope])}</li>
        {experience.fulfillment.map((mode) => <li key={mode}>{t(serviceFulfillmentMessageKey[mode])}</li>)}
        {service.active ? null : <li className="resident-chip--maintenance">{t("status.unavailable")}</li>}
      </ul>

      <h2 className="resident-section__title">{t("service.about")}</h2>
      <p className="resident-passport__copy">{service.description[locale]}</p>

      <h2 className="resident-section__title">{t("service.requirements")}</h2>
      <p className="resident-passport__copy">{service.requirements[locale]}</p>

      <dl className="resident-facts resident-passport__facts">
        {service.etaMinutes ? (
          <div>
            <dt><Clock aria-hidden="true" weight="duotone" />{t("label.local_eta")}</dt>
            <dd>{t("service.eta", { minutes: service.etaMinutes })}</dd>
          </div>
        ) : null}
        <div>
          <dt><Timer aria-hidden="true" weight="duotone" />{t("service.duration")}</dt>
          <dd>{t("service.minutes", { minutes: service.durationMinutes ?? 0 })}</dd>
        </div>
        <div>
          <dt><ShieldCheck aria-hidden="true" weight="duotone" />{t("label.warranty")}</dt>
          <dd>{t("service.warranty", { days: service.warrantyDays ?? 0 })}</dd>
        </div>
        <div>
          <dt><UsersFour aria-hidden="true" weight="duotone" />{t("table.provider")}</dt>
          <dd>{t("service.provider_count", { count: providers.length })}</dd>
        </div>
        <div>
          <dt><SealCheck aria-hidden="true" weight="duotone" />{t("label.verified_demo")}</dt>
          <dd>{t("provider.verified_demo")}</dd>
        </div>
      </dl>
    </motion.section>
  );
}
