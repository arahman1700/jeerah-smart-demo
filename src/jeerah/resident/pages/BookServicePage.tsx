import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { resolveServiceExperience } from "../../domain/serviceCatalog";
import { useI18n } from "../../i18n/I18nProvider";
import { getResidentRoute } from "../ResidentApp";
import { ResidentPage } from "../components/ResidentPage";
import { ServiceModeForm } from "../components/ServiceModeForm";

/** The commit screen for one offering: mode-aware fields and one demo order. */
export function BookServicePage({ serviceId, providerId, flow }: {
  serviceId: string;
  providerId?: string;
  flow: FlowControls;
}) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const experience = resolveServiceExperience(state, serviceId);

  if (!experience || experience.nextAction.kind !== "book") {
    return (
      <ResidentPage screen="book">
        <p className="resident-card resident-empty" data-testid="missing-entity">{experience ? t("service.unavailable") : t("error.not_found")}</p>
      </ResidentPage>
    );
  }

  return (
    <ResidentPage screen="book">
      <header className="resident-page-title">
        <h1>{t("book.title", { service: experience.service.name[locale] })}</h1>
      </header>

      <ServiceModeForm
        experience={experience}
        initialProviderId={providerId}
        onCreated={(orderId) => flow.replace(getResidentRoute({ kind: "order", orderId }))}
      />
    </ResidentPage>
  );
}
