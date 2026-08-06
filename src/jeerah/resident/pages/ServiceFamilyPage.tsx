import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import type { ServiceFamilyId } from "../../domain/models";
import { servicePriceModel } from "../../domain/serviceCatalog";
import { ServiceFamilyIcon } from "../../design/serviceIconMap";
import { useI18n } from "../../i18n/I18nProvider";
import { serviceFamilyMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { ServiceCard } from "../components/ServiceBits";
import { ResidentPage } from "../components/ResidentPage";

/** One family, every offering it owns — never an empty family. */
export function ServiceFamilyPage({ familyId, flow }: { familyId: ServiceFamilyId; flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const family = state.serviceFamilies.find((item) => item.id === familyId);
  const services = state.serviceOfferings.filter((service) => service.familyId === familyId);

  if (!family) {
    return (
      <ResidentPage screen="family" footerClearance>
        <p className="resident-card resident-empty" data-testid="missing-entity">{t("error.not_found")}</p>
      </ResidentPage>
    );
  }

  return (
    <ResidentPage screen="family" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true">
          <ServiceFamilyIcon familyId={family.id} label={family.name[locale]} />
        </span>
        <h1>{t(serviceFamilyMessageKey[family.id])}</h1>
        <p className="resident-page-title__intro">{family.description[locale]}</p>
      </header>

      <p className="resident-eyebrow">{t("market.family_count", { count: services.length })}</p>

      {services.length ? (
        <div className="resident-row-list">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              price={servicePriceModel(service)}
              index={index}
              onOpen={() => flow.push(getResidentRoute({ kind: "service", serviceId: service.id }))}
            />
          ))}
        </div>
      ) : <p className="resident-card resident-empty">{t("market.no_results")}</p>}
    </ResidentPage>
  );
}
