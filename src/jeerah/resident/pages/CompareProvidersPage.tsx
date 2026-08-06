import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { resolveServiceExperience } from "../../domain/serviceCatalog";
import { useI18n } from "../../i18n/I18nProvider";
import { providerStatusMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { ResidentPage } from "../components/ResidentPage";
import { priceLabel } from "../components/ServiceBits";

/** Same service, side-by-side providers, with a real booking hand-off for each. */
export function CompareProvidersPage({ serviceId, flow }: { serviceId: string; flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const experience = resolveServiceExperience(state, serviceId);

  if (!experience) {
    return (
      <ResidentPage screen="compare" footerClearance>
        <p className="resident-card resident-empty" data-testid="missing-entity">{t("error.not_found")}</p>
      </ResidentPage>
    );
  }

  return (
    <ResidentPage screen="compare" footerClearance>
      <header className="resident-page-title">
        <h1>{t("compare.title")}</h1>
        <p className="resident-page-title__intro">{experience.service.name[locale]} · {t("compare.intro")}</p>
      </header>

      <div className="resident-compare-scroll">
        <table className="resident-compare" data-testid="provider-comparison">
        <caption className="resident-visually-hidden">{t("compare.title")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("table.provider")}</th>
            <th scope="col">{t("label.rating")}</th>
            <th scope="col">{t("service.sla")}</th>
            <th scope="col">{t("table.amount")}</th>
            <th scope="col">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {experience.providers.map((provider) => (
            <tr key={provider.id} data-testid={`compare-row-${provider.id}`}>
              <th scope="row">
                {provider.name[locale]}
                <small>{t(providerStatusMessageKey[provider.status])}</small>
              </th>
              <td className="jeerah-numeric">{provider.rating.toFixed(1)}</td>
              <td className="jeerah-numeric">{t("service.minutes", { minutes: provider.responseMinutes })}</td>
              <td className="jeerah-numeric">{priceLabel(experience.price, locale, t)}</td>
              <td>
                <button
                  type="button"
                  className="resident-secondary-button"
                  onClick={() => flow.push(getResidentRoute({ kind: "book", serviceId, providerId: provider.id }))}
                  data-testid={`compare-choose-${provider.id}`}
                >
                  {t("action.choose_provider")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </ResidentPage>
  );
}
