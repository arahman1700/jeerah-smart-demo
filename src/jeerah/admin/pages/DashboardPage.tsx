import { Buildings, ChartLineUp, Door, HeartStraight, Receipt, Scroll, Storefront, UsersThree, Wrench } from "@phosphor-icons/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatSar } from "../../domain/format";
import { orderStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { KpiCard } from "../components/KpiCard";
import {
  selectAveragePulse,
  selectCollectionsByMonth,
  selectOpenOrderCount,
  selectOrdersByStatus,
  selectOutstandingBalance,
  selectPropertyCount,
  selectRecentActivities,
  selectTotalCollected,
  selectUnitCounts,
  selectUrgentOrders,
} from "../selectors";

export function DashboardPage() {
  const state = useDemoState();
  const { t, locale } = useI18n();
  const units = selectUnitCounts(state);
  const collections = selectCollectionsByMonth(state);
  const ordersByStatus = selectOrdersByStatus(state);
  const activities = selectRecentActivities(state);
  const urgent = selectUrgentOrders(state).slice(0, 4);

  return (
    <section className="admin-page">
      <h1>{t("nav.dashboard")}</h1>
      <div className="admin-kpis">
        <KpiCard icon={Buildings} label={t("admin.kpi_properties")} value={selectPropertyCount(state)} testId="kpi-properties" tone="indigo" />
        <KpiCard
          icon={Door}
          label={t("admin.kpi_units")}
          value={`${units.occupied}/${units.total}`}
          detail={t("admin.kpi_units_detail", { vacant: units.vacant, maintenance: units.maintenance })}
          testId="kpi-units"
          tone="teal"
        />
        <KpiCard icon={ChartLineUp} label={t("analytics.collected")} value={formatSar(selectTotalCollected(state), locale)} testId="kpi-collected" tone="green" />
        <KpiCard icon={Receipt} label={t("analytics.outstanding")} value={formatSar(selectOutstandingBalance(state), locale)} testId="kpi-outstanding" tone="amber" />
        <KpiCard icon={Wrench} label={t("analytics.open_orders")} value={selectOpenOrderCount(state)} testId="kpi-open-orders" tone="purple" />
        <KpiCard icon={HeartStraight} label={t("admin.kpi_pulse")} value={`${selectAveragePulse(state)}/100`} testId="kpi-pulse" tone="rose" />
      </div>

      <div className="admin-columns">
        <section className="admin-card" role="region" aria-label={t("admin.collections_chart")}>
          <h2>{t("admin.collections_chart")}</h2>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={collections.map((point) => ({ ...point, label: point.month }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis width={48} />
                <Tooltip formatter={(value) => formatSar(Number(value), locale)} />
                <Bar dataKey="amount" fill="var(--color-steel-slate, #4C558C)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="admin-chart-summary">
            {collections.map((point) => (
              <li key={point.month}>
                <span>{point.month}</span>
                <strong>{formatSar(point.amount, locale)}</strong>
              </li>
            ))}
          </ul>
        </section>

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
      </div>

      <div className="admin-columns">
        <section className="admin-card" role="region" aria-label={t("admin.recent_activity")}>
          <h2>{t("admin.recent_activity")}</h2>
          <ul className="admin-activity">
            {activities.map((activity) => (
              <li key={activity.id}>
                <strong>{activity.title[locale]}</strong>
                <span>{activity.description[locale]}</span>
                <time dateTime={activity.occurredAt}>{formatDate(activity.occurredAt, locale)}</time>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card" role="region" aria-label={t("admin.urgent_orders")}>
          <h2>{t("admin.urgent_orders")}</h2>
          {urgent.length === 0 ? (
            <p>{t("empty.orders")}</p>
          ) : (
            <ul className="admin-urgent">
              {urgent.map((order) => {
                const offering = state.serviceOfferings.find((item) => item.id === order.serviceId);
                return (
                  <li key={order.id}>
                    <strong>{offering ? offering.name[locale] : order.serviceId}</strong>
                    <span>{t(orderStatusMessageKey[order.status])}</span>
                    <Link className="admin-button admin-button--ghost" to="/units">
                      {t("action.open")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-card" role="region" aria-label={t("admin.quick_nav")}>
        <h2>{t("admin.quick_nav")}</h2>
        <div className="admin-quick-nav">
          <Link className="admin-quick-nav__item" to="/residents">
            <span className="admin-kpi__icon" data-tone="indigo" aria-hidden="true"><UsersThree weight="duotone" /></span>
            <span><strong>{t("nav.residents")}</strong><small>{t("admin.quick_nav_residents")}</small></span>
          </Link>
          <Link className="admin-quick-nav__item" to="/properties">
            <span className="admin-kpi__icon" data-tone="teal" aria-hidden="true"><Buildings weight="duotone" /></span>
            <span><strong>{t("nav.properties")}</strong><small>{t("admin.quick_nav_properties")}</small></span>
          </Link>
          <Link className="admin-quick-nav__item" to="/marketplace">
            <span className="admin-kpi__icon" data-tone="green" aria-hidden="true"><Storefront weight="duotone" /></span>
            <span><strong>{t("nav.marketplace")}</strong><small>{t("admin.quick_nav_marketplace")}</small></span>
          </Link>
          <Link className="admin-quick-nav__item" to="/audit">
            <span className="admin-kpi__icon" data-tone="purple" aria-hidden="true"><Scroll weight="duotone" /></span>
            <span><strong>{t("nav.audit")}</strong><small>{t("admin.quick_nav_audit")}</small></span>
          </Link>
        </div>
      </section>
    </section>
  );
}
