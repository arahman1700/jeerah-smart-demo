import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { recurringPlanCadenceMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { DataTable } from "../components/DataTable";

/** Membership and recurring-plan subscriptions, derived from shared state. */
export function SubscriptionsPage() {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const subscribers = state.residents.filter((resident) => resident.subscriber);
  const activePlans = state.recurringPlans.filter((plan) => plan.active);
  const monthlyValue = activePlans.reduce((sum, plan) => {
    const service = state.serviceOfferings.find((item) => item.id === plan.serviceId);
    return sum + (service?.price ?? service?.startingPrice ?? 0);
  }, 0);

  return (
    <section className="admin-page">
      <h1>{t("admin.subscriptions")}</h1>

      <div className="admin-kpis">
        <article className="admin-kpi" data-testid="kpi-subscribers" aria-label={t("admin.subscribers")}>
          <div className="admin-kpi__body">
            <span className="admin-kpi__label">{t("admin.subscribers")}</span>
            <strong className="admin-kpi__value">{subscribers.length}</strong>
          </div>
        </article>
        <article className="admin-kpi" data-testid="kpi-active-plans" aria-label={t("admin.active_plans")}>
          <div className="admin-kpi__body">
            <span className="admin-kpi__label">{t("admin.active_plans")}</span>
            <strong className="admin-kpi__value">{activePlans.length}</strong>
          </div>
        </article>
        <article className="admin-kpi" data-testid="kpi-plan-revenue" aria-label={t("admin.plan_revenue")}>
          <div className="admin-kpi__body">
            <span className="admin-kpi__label">{t("admin.plan_revenue")}</span>
            <strong className="admin-kpi__value"><bdi>{formatSar(monthlyValue, locale)}</bdi></strong>
          </div>
        </article>
      </div>

      <section className="admin-card" aria-label={t("admin.subscribers")}>
        <h2>{t("admin.subscribers")}</h2>
        <DataTable
          label={t("admin.subscribers")}
          rows={subscribers}
          columns={[
            { key: "name", header: t("table.resident"), render: (resident) => <strong>{resident.name[locale]}</strong> },
            {
              key: "unit",
              header: t("table.unit"),
              render: (resident) => state.units.find((unit) => unit.id === resident.unitId)?.label[locale] ?? resident.unitId,
            },
            { key: "membership", header: t("profile.membership"), render: () => t("profile.member") },
          ]}
        />
      </section>

      <section className="admin-card" aria-label={t("admin.active_plans")}>
        <h2>{t("admin.active_plans")}</h2>
        <DataTable
          label={t("admin.active_plans")}
          rows={activePlans}
          empty={<p>{t("empty.plans")}</p>}
          columns={[
            {
              key: "service",
              header: t("table.service"),
              render: (plan) => state.serviceOfferings.find((item) => item.id === plan.serviceId)?.name[locale] ?? plan.serviceId,
            },
            { key: "cadence", header: t("book.cadence"), render: (plan) => t(recurringPlanCadenceMessageKey[plan.cadence]) },
            { key: "next", header: t("plan.next_date"), render: (plan) => formatDate(plan.nextDate, locale) },
            {
              key: "provider",
              header: t("table.provider"),
              render: (plan) => state.providers.find((item) => item.id === plan.providerId)?.name[locale] ?? plan.providerId,
            },
          ]}
        />
      </section>
    </section>
  );
}
