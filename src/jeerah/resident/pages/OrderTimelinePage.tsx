import { CheckCircle, Circle, NavigationArrow } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatDateTime, formatSar } from "../../domain/format";
import { ORDER_STATUSES } from "../../domain/models";
import { useI18n } from "../../i18n/I18nProvider";
import { orderStatusMessageKey, paymentStatusMessageKey, serviceFulfillmentMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { MaintenanceStory } from "../components/MaintenanceStory";
import { ResidentPage, Ltr } from "../components/ResidentPage";
import { LiveMessage, OrderStatusPill, ServiceImage, useDemoMutation } from "../components/ServiceBits";

/**
 * One order's whole life: every execution status it reached, the independent
 * payment status, a labeled demo ETA for on-demand work, quote decisions, and
 * the completed maintenance story. It re-renders from the shared repository, so
 * an admin assignment or status change lands here while the screen stays open.
 */
export function OrderTimelinePage({ orderId, flow }: { orderId: string; flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const { message, run } = useDemoMutation();

  const order = state.orders.find((item) => item.id === orderId && item.residentId === state.currentResidentId);
  const service = state.serviceOfferings.find((item) => item.id === order?.serviceId);
  const provider = state.providers.find((item) => item.id === order?.providerId);

  if (!order || !service) {
    return (
      <ResidentPage screen="order" footerClearance>
        <p className="resident-card resident-empty" data-testid="missing-entity">{t("error.not_found")}</p>
      </ResidentPage>
    );
  }

  const reached = new Set(order.timeline.map((event) => event.status));
  const steps = ORDER_STATUSES.filter((status) => reached.has(status));

  return (
    <ResidentPage screen="order" footerClearance>
      <header className="resident-page-title">
        <h1>{service.name[locale]}</h1>
        <p className="resident-page-title__intro">
          {t(serviceFulfillmentMessageKey[order.fulfillment])}
          {provider ? ` · ${provider.name[locale]}` : ""}
        </p>
      </header>

      <section className="resident-card resident-order-summary" aria-label={t("table.status")}>
        <OrderStatusPill status={order.status} testId="order-status" />
        <dl className="resident-amount-list">
          {order.amount === undefined ? null : (
            <div>
              <dt>{t("table.amount")}</dt>
              <dd><Ltr testId="order-amount">{formatSar(order.amount, locale)}</Ltr></dd>
            </div>
          )}
          {order.quoteAmount === undefined ? null : (
            <div>
              <dt>{t("order.quote_amount")}</dt>
              <dd><Ltr testId="order-quote-amount">{formatSar(order.quoteAmount, locale)}</Ltr></dd>
            </div>
          )}
          {order.quantity === undefined ? null : (
            <div>
              <dt>{t("book.quantity")}</dt>
              <dd className="jeerah-numeric">{order.quantity}</dd>
            </div>
          )}
          {order.paymentStatus ? (
            <div>
              <dt>{t("order.payment")}</dt>
              <dd data-testid="order-payment-status">{t(paymentStatusMessageKey[order.paymentStatus])}</dd>
            </div>
          ) : null}
        </dl>
        {order.breakdown?.length ? (
          <ul className="resident-breakdown">
            {order.breakdown.map((line) => (
              <li key={line.id}>
                <span>{line.label[locale]}</span>
                <Ltr>{formatSar(line.amount, locale)}</Ltr>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {order.fulfillment === "on-demand" && order.etaMinutes && !["completed", "cancelled", "refunded"].includes(order.status) ? (
        <section className="resident-card resident-eta" aria-label={t("label.local_eta")} data-testid="order-eta">
          <motion.span
            className="resident-eta__pulse"
            aria-hidden="true"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 0.45, 1] }}
            transition={reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <NavigationArrow weight="duotone" />
          </motion.span>
          <div>
            <strong>{t("order.active_eta", { minutes: order.etaMinutes })}</strong>
            <small>{t("book.eta_notice")}</small>
          </div>
        </section>
      ) : null}

      {order.status === "quote-ready" && order.quoteAmount ? (
        <section className="resident-card" aria-label={t("quote.ready")}>
          <p className="resident-notice">{t("book.quote_notice")}</p>
          <div className="resident-filter-row">
            <button
              type="button"
              className="resident-primary-button"
              data-testid="approve-quote"
              onClick={() => void run({ type: "quote/approved", orderId: order.id, amount: order.quoteAmount!, occurredAt: state.now })}
            >
              {t("action.approve_quote")}
            </button>
            <button
              type="button"
              className="resident-secondary-button"
              data-testid="reject-quote"
              onClick={() => void run({ type: "quote/rejected", orderId: order.id, occurredAt: state.now })}
            >
              {t("action.reject_quote")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="resident-card resident-timeline" aria-label={t("order.timeline")}>
        <h2 className="resident-section__title">{t("order.timeline")}</h2>
        <ol className="resident-timeline__list">
          {order.timeline.map((event, index) => (
            <motion.li
              key={event.id}
              data-status={event.status}
              initial={reduceMotion ? false : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.24, delay: Math.min(index, 8) * 0.03 }}
            >
              <span className="resident-timeline__marker" aria-hidden="true">
                {index === order.timeline.length - 1 ? <Circle weight="fill" /> : <CheckCircle weight="fill" />}
              </span>
              <div>
                <strong>{t(orderStatusMessageKey[event.status])}</strong>
                <small>{event.note[locale]}</small>
                <time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt, locale)}</time>
              </div>
              {event.imageId ? <ServiceImage imageId={event.imageId} locale={locale} className="resident-timeline__photo" /> : null}
            </motion.li>
          ))}
        </ol>
        <p className="resident-eyebrow">{steps.map((status) => t(orderStatusMessageKey[status])).join(" › ")}</p>
      </section>

      {order.status === "completed" ? (
        <MaintenanceStory
          order={order}
          service={service}
          onRate={(rating) => void run({ type: "order/rated", orderId: order.id, rating, occurredAt: state.now })}
        />
      ) : null}

      <LiveMessage tone="error">{message}</LiveMessage>

      <button type="button" className="resident-secondary-button" onClick={() => flow.replace(getResidentRoute({ kind: "root", id: "orders" }))}>
        {t("nav.orders")}
      </button>
    </ResidentPage>
  );
}
