import { Buildings, CalendarDots, CaretRight, Heartbeat, ShieldCheck, ShieldWarning } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Building, CommunityPulse, Invoice, Locale } from "../../domain/models";
import { communityPulseStatusMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";

const COUNT_UP_MS = 560;

function formatAmount(value: number, locale: Locale) {
  const amount = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return locale === "ar" ? `${amount} ر.س` : `SAR ${amount}`;
}

function CountedAmount({ value, locale }: { value: number; locale: Locale }) {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed(value);
      return;
    }
    const startedAt = performance.now();
    let frame = window.requestAnimationFrame(function tick(time) {
      const progress = Math.min(1, (time - startedAt) / COUNT_UP_MS);
      setDisplayed(value * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [reduceMotion, value]);

  return <strong className="resident-pulse__amount-value jeerah-numeric">{formatAmount(displayed, locale)}</strong>;
}

export function CommunityPulseCard({ building, pulse, invoice, onOpenBuilding, onPay }: {
  building?: Building;
  pulse?: CommunityPulse;
  invoice?: Invoice;
  onOpenBuilding: () => void;
  onPay: () => void;
}) {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();

  if (!building || !pulse) {
    return (
      <section className="resident-card resident-card--empty" aria-label={t("resident.community_pulse")}>
        <p>{t("empty.properties")}</p>
      </section>
    );
  }

  const StatusIcon = pulse.status === "healthy" ? ShieldCheck : ShieldWarning;

  return (
    <motion.section
      aria-label={t("resident.community_pulse")}
      className={`resident-card resident-pulse resident-pulse--${pulse.status}`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
    >
      <div className="resident-pulse__community">
        <div className="resident-pulse__identity">
          <span className="resident-pulse__badge" aria-hidden="true">
            <Buildings weight="duotone" />
          </span>
          <span className="resident-pulse__names">
            <button type="button" className="resident-pulse__building" onClick={onOpenBuilding}>
              {building.name[locale]}
            </button>
            <small>
              <Heartbeat aria-hidden="true" weight="duotone" />
              {" "}
              {t("resident.community_pulse")}
            </small>
          </span>
        </div>

        <div className="resident-pulse__dial" role="img" aria-label={`${t("resident.community_pulse")} ${pulse.score}/100`}>
          <Heartbeat aria-hidden="true" weight="duotone" />
          <span className="resident-pulse__score jeerah-numeric" aria-hidden="true">
            <strong>{pulse.score}</strong>
            <small>/100</small>
          </span>
        </div>

        <p className="resident-pulse__status">
          <StatusIcon aria-hidden="true" weight="duotone" />
          {" "}
          {t(communityPulseStatusMessageKey[pulse.status])}
        </p>
      </div>

      <div className="resident-pulse__invoice">
        {invoice ? (
          <>
            <p className="resident-eyebrow resident-eyebrow--attention">{t("resident.upcoming_expense")}</p>
            <h2 className="resident-pulse__invoice-title">{invoice.title[locale]}</h2>
            <p className="resident-pulse__due">
              <CalendarDots aria-hidden="true" weight="duotone" />
              {" "}
              {t("resident.due_on", {
                date: new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
                  month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Riyadh",
                }).format(new Date(invoice.dueDate)),
              })}
            </p>
            <div className="resident-pulse__amount">
              <span>{t("resident.amount_due")}</span>
              <CountedAmount value={invoice.total} locale={locale} />
            </div>
            <button type="button" className="resident-primary-action" onClick={onPay}>
              <span>{t("action.view_and_pay")}</span>
              <CaretRight aria-hidden="true" weight="bold" />
            </button>
          </>
        ) : (
          <p className="resident-empty">{t("empty.expenses")}</p>
        )}
      </div>
    </motion.section>
  );
}
