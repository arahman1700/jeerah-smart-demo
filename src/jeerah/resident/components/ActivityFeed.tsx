import { Bell, CaretRight, ClipboardText, Wrench } from "@phosphor-icons/react";
import type { Activity, Locale } from "../../domain/models";
import { useI18n } from "../../i18n/I18nProvider";

const iconByKind = { notice: Bell, inspection: Wrench } as const;

function activityIcon(kind: string) {
  return iconByKind[kind as keyof typeof iconByKind] ?? ClipboardText;
}

function formatOccurredAt(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh",
  }).format(new Date(value));
}

export function ActivityFeed({ activities, locale, onViewAll }: {
  activities: Activity[];
  locale: Locale;
  onViewAll: () => void;
}) {
  const { t } = useI18n();

  return (
    <section className="resident-section" aria-labelledby="resident-activity-heading">
      <div className="resident-section__heading">
        <h2 id="resident-activity-heading" className="resident-eyebrow">{t("resident.activity")}</h2>
        <button type="button" className="resident-link-button" onClick={onViewAll}>{t("action.view_all")}</button>
      </div>
      {activities.length ? (
        <ul className="resident-card resident-activity">
          {activities.map((activity) => {
            const Icon = activityIcon(activity.kind);
            return (
              <li key={activity.id} className="resident-activity__row">
                <span className={`resident-activity__icon resident-activity__icon--${activity.kind}`} aria-hidden="true">
                  <Icon weight="duotone" />
                </span>
                <span className="resident-activity__copy">
                  <strong>{activity.title[locale]}</strong>
                  <small>{activity.description[locale]}</small>
                </span>
                <time className="jeerah-numeric" dateTime={activity.occurredAt}>
                  {formatOccurredAt(activity.occurredAt, locale)}
                </time>
                <CaretRight aria-hidden="true" weight="bold" />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="resident-card resident-empty">{t("empty.community")}</p>
      )}
    </section>
  );
}
