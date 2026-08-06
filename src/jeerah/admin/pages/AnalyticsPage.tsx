import { useDemoState } from "../../data/DemoProvider";
import { calculateCommunityPulse } from "../../domain/communityPulse";
import { formatSar } from "../../domain/format";
import { orderStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import {
  selectCollectionsByMonth,
  selectOpenOrderCount,
  selectOrdersByStatus,
  selectOutstandingBalance,
  selectTotalCollected,
} from "../selectors";

export function AnalyticsPage() {
  const state = useDemoState();
  const { t, locale } = useI18n();
  const collections = selectCollectionsByMonth(state);
  const ordersByStatus = selectOrdersByStatus(state);

  return (
    <section className="admin-page">
      <h1>{t("analytics.title")}</h1>

      <div className="admin-columns">
        <section className="admin-card" role="region" aria-label={t("analytics.collected")}>
          <h2>{t("analytics.collected")}</h2>
          <p className="admin-analytics-figure"><bdi>{formatSar(selectTotalCollected(state), locale)}</bdi></p>
          <ul className="admin-chart-summary">
            {collections.map((point) => (
              <li key={point.month}>
                <span>{point.month}</span>
                <strong><bdi>{formatSar(point.amount, locale)}</bdi></strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="admin-card" role="region" aria-label={t("analytics.outstanding")}>
          <h2>{t("analytics.outstanding")}</h2>
          <p className="admin-analytics-figure"><bdi>{formatSar(selectOutstandingBalance(state), locale)}</bdi></p>
          <p>{t("admin.open_orders_count", { count: selectOpenOrderCount(state) })}</p>
        </section>
      </div>

      <section className="admin-card" role="region" aria-label={t("admin.orders_chart")}>
        <h2>{t("admin.orders_chart")}</h2>
        <ul className="admin-status-bars">
          {ordersByStatus.map((point) => (
            <li key={point.status}>
              <span>{t(orderStatusMessageKey[point.status])}</span>
              <span className="admin-status-bars__track" aria-hidden="true">
                <span className="admin-status-bars__fill" style={{ inlineSize: `${Math.min(100, point.count * 12)}%` }} />
              </span>
              <strong>{point.count}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card" role="region" aria-label={t("resident.community_pulse")}>
        <h2>{t("resident.community_pulse")}</h2>
        <ul className="admin-status-bars">
          {state.buildings.map((building) => {
            const pulse = calculateCommunityPulse(state, building.id);
            return (
              <li key={building.id}>
                <span>{building.name[locale]}</span>
                <span className="admin-status-bars__track" aria-hidden="true">
                  <span className="admin-status-bars__fill" style={{ inlineSize: `${pulse.score}%` }} />
                </span>
                <strong>{pulse.score}/100</strong>
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}
