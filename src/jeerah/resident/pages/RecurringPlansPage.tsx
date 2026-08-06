import { ArrowsClockwise } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate } from "../../domain/format";
import { residentPlans } from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";
import { recurringPlanCadenceMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { ResidentPage } from "../components/ResidentPage";
import { LiveMessage, useDemoMutation } from "../components/ServiceBits";

/** The resident's own recurring plans, with pause, resume, and skip-next. */
export function RecurringPlansPage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const { message, run } = useDemoMutation();
  const plans = residentPlans(state);

  return (
    <ResidentPage screen="plans" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><ArrowsClockwise weight="duotone" /></span>
        <h1>{t("plan.title")}</h1>
      </header>

      <LiveMessage tone="error">{message}</LiveMessage>

      {plans.length ? (
        <div className="resident-row-list">
          {plans.map((plan) => {
            const service = state.serviceOfferings.find((item) => item.id === plan.serviceId);
            const provider = state.providers.find((item) => item.id === plan.providerId);
            const skipped = plan.skippedDates.includes(plan.nextDate);
            return (
              <article key={plan.id} className="resident-card resident-plan" data-testid={`plan-${plan.id}`} data-active={plan.active ? "true" : "false"}>
                <h2>{service?.name[locale] ?? t("nav.services")}</h2>
                <dl className="resident-facts">
                  <div>
                    <dt>{t("plan.recurring")}</dt>
                    <dd>{t(recurringPlanCadenceMessageKey[plan.cadence])}</dd>
                  </div>
                  <div>
                    <dt>{t("plan.next_date")}</dt>
                    <dd>{formatDate(plan.nextDate, locale)}</dd>
                  </div>
                  <div>
                    <dt>{t("plan.provider")}</dt>
                    <dd>{provider?.name[locale] ?? ""}</dd>
                  </div>
                  <div>
                    <dt>{t("table.status")}</dt>
                    <dd data-testid={`plan-status-${plan.id}`}>{plan.active ? t("status.active") : t("plan.paused")}</dd>
                  </div>
                </dl>
                {skipped ? <p className="resident-notice" data-testid={`plan-skipped-${plan.id}`}>{t("plan.skipped_next")}</p> : null}

                <div className="resident-filter-row">
                  <button
                    type="button"
                    className="resident-secondary-button"
                    data-testid={`plan-toggle-${plan.id}`}
                    onClick={() => void run({ type: "recurring-plan/toggled", planId: plan.id, active: !plan.active })}
                  >
                    {plan.active ? t("action.pause") : t("action.resume")}
                  </button>
                  <button
                    type="button"
                    className="resident-secondary-button"
                    data-testid={`plan-skip-${plan.id}`}
                    disabled={skipped}
                    onClick={() => void run({ type: "recurring-plan/next-skipped", planId: plan.id, date: plan.nextDate })}
                  >
                    {t("action.skip_next")}
                  </button>
                  {service ? (
                    <button
                      type="button"
                      className="resident-secondary-button"
                      onClick={() => flow.push(getResidentRoute({ kind: "service", serviceId: service.id }))}
                    >
                      {t("action.view_details")}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : <p className="resident-card resident-empty">{t("empty.plans")}</p>}
    </ResidentPage>
  );
}
