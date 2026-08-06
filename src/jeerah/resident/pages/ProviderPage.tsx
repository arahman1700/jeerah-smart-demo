import { CaretRight, SealCheck, Star, Timer } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { servicePriceModel } from "../../domain/serviceCatalog";
import { useI18n } from "../../i18n/I18nProvider";
import { providerStatusMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { ResidentPage } from "../components/ResidentPage";
import { ServiceImage, priceLabel } from "../components/ServiceBits";

/** A verified demo provider, its rating, response target, and its own catalog. */
export function ProviderPage({ providerId, flow }: { providerId: string; flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const provider = state.providers.find((item) => item.id === providerId);
  const services = state.serviceOfferings.filter((service) => service.providerIds.includes(providerId));

  if (!provider) {
    return (
      <ResidentPage screen="provider" footerClearance>
        <p className="resident-card resident-empty" data-testid="missing-entity">{t("error.not_found")}</p>
      </ResidentPage>
    );
  }

  return (
    <ResidentPage screen="provider" footerClearance>
      <section className="resident-card resident-provider-hero">
        {provider.imageId ? <ServiceImage imageId={provider.imageId} locale={locale} className="resident-passport__photo" /> : null}
        <h1>{provider.name[locale]}</h1>
        <p className="resident-eyebrow">{t(providerStatusMessageKey[provider.status])}</p>
        <dl className="resident-facts">
          <div>
            <dt><Star aria-hidden="true" weight="duotone" />{t("label.rating")}</dt>
            <dd>{t("provider.rating", { rating: provider.rating.toFixed(1), count: provider.reviewCount })}</dd>
          </div>
          <div>
            <dt><Timer aria-hidden="true" weight="duotone" />{t("service.sla")}</dt>
            <dd>{t("provider.response", { minutes: provider.responseMinutes })}</dd>
          </div>
          <div>
            <dt><SealCheck aria-hidden="true" weight="duotone" />{t("label.verified_demo")}</dt>
            <dd>{t("label.demo_only")}</dd>
          </div>
        </dl>
      </section>

      <section className="resident-section" aria-label={t("provider.services")}>
        <h2 className="resident-section__heading">{t("provider.services")}</h2>
        <div className="resident-row-list">
          {services.map((service) => (
            <button
              type="button"
              key={service.id}
              className="resident-card resident-row"
              onClick={() => flow.push(getResidentRoute({ kind: "service", serviceId: service.id }))}
            >
              <span className="resident-row__copy">
                <strong>{service.name[locale]}</strong>
                <small className="jeerah-numeric">{priceLabel(servicePriceModel(service), locale, t)}</small>
              </span>
              <CaretRight aria-hidden="true" weight="bold" />
            </button>
          ))}
        </div>
      </section>
    </ResidentPage>
  );
}
