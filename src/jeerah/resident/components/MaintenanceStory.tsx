import { CheckCircle, IdentificationBadge, ShieldCheck, Timer } from "@phosphor-icons/react";
import { formatDateTime } from "../../domain/format";
import type { ServiceOffering, ServiceOrder } from "../../domain/models";
import { useI18n } from "../../i18n/I18nProvider";
import { ServiceImage, Stars } from "./ServiceBits";

/**
 * The completed-order story: labeled before and after demo photographs, the
 * fictional technician credited for the visit, the finished checklist, the SLA
 * duration, the warranty, the resident approval, and a five-star local rating.
 */
export function MaintenanceStory({ order, service, onRate }: {
  order: ServiceOrder;
  service: ServiceOffering;
  onRate: (rating: number) => void;
}) {
  const { locale, t } = useI18n();
  const durationMinutes = service.durationMinutes ?? 0;

  return (
    <section className="resident-card resident-story" aria-label={t("order.maintenance_story")} data-testid="maintenance-story">
      <h2 className="resident-section__title">{t("order.maintenance_story")}</h2>

      {order.beforeImageId && order.afterImageId ? (
        <div className="resident-story__pair">
          <figure>
            <ServiceImage imageId={order.beforeImageId} locale={locale} className="resident-story__photo" />
            <figcaption>{t("order.before")}</figcaption>
          </figure>
          <figure>
            <ServiceImage imageId={order.afterImageId} locale={locale} className="resident-story__photo" />
            <figcaption>{t("order.after")}</figcaption>
          </figure>
        </div>
      ) : null}

      <dl className="resident-facts">
        {order.technician ? (
          <div>
            <dt><IdentificationBadge aria-hidden="true" weight="duotone" />{t("order.technician")}</dt>
            <dd>{order.technician.displayName[locale]} · {order.technician.craft[locale]} · <span className="jeerah-numeric">{order.technician.badgeId}</span></dd>
          </div>
        ) : null}
        <div>
          <dt><Timer aria-hidden="true" weight="duotone" />{t("order.duration")}</dt>
          <dd>{t("service.minutes", { minutes: durationMinutes })}</dd>
        </div>
        <div>
          <dt><ShieldCheck aria-hidden="true" weight="duotone" />{t("label.warranty")}</dt>
          <dd>{t("service.warranty", { days: order.warrantyDays ?? service.warrantyDays ?? 0 })}</dd>
        </div>
        {order.residentApprovedAt ? (
          <div>
            <dt><CheckCircle aria-hidden="true" weight="duotone" />{t("order.resident_approval")}</dt>
            <dd>{formatDateTime(order.residentApprovedAt, locale)}</dd>
          </div>
        ) : null}
      </dl>

      {order.checklist?.length ? (
        <>
          <h3 className="resident-section__title">{t("order.checklist")}</h3>
          <ul className="resident-checklist">
            {order.checklist.map((item) => (
              <li key={item.id} data-done={item.done ? "true" : "false"}>
                <CheckCircle aria-hidden="true" weight={item.done ? "fill" : "duotone"} />
                <span>{item.label[locale]}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3 className="resident-section__title">{t("order.rate_prompt")}</h3>
      {order.rating ? (
        <p className="resident-story__rating">
          <Stars rating={order.rating} label={t("order.star", { rating: order.rating })} />
          <span>{t("order.rating_saved", { rating: order.rating })}</span>
        </p>
      ) : (
        <div className="resident-rating-actions" role="group" aria-label={t("action.rate")}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className="resident-rating-button"
              onClick={() => onRate(value)}
              data-testid={`rate-${value}`}
            >
              {t("order.star", { rating: value })}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
