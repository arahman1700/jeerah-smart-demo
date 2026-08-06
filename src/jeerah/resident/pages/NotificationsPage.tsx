import { BellRinging, BellSlash, Checks } from "@phosphor-icons/react";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatDateTime } from "../../domain/format";
import { residentNotifications } from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";

/** Building announcements and activity as a notifications feed. */
export function NotificationsPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { locale, t } = useI18n();
  const notifications = residentNotifications(state);
  const unread = notifications.filter((item) => item.unread).length;

  return (
    <article className="resident-notifications" data-testid="notifications-page">
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><BellRinging weight="duotone" /></span>
        <h1>{t("notifications.title")}</h1>
      </header>

      <div className="resident-card resident-notifications__summary">
        <span aria-hidden="true"><Checks weight="duotone" /></span>
        <span className="resident-row__copy">
          <strong className="jeerah-numeric" data-testid="notifications-unread">{unread}</strong>
          <small>{unread === 0 ? t("notifications.all_caught_up") : t("notifications.unread")}</small>
        </span>
        {unread > 0 ? (
          <button
            type="button"
            className="resident-primary-button"
            data-testid="notifications-mark-read"
            onClick={() => void dispatch({ type: "notifications/read", readAt: new Date().toISOString() })}
          >
            {t("notifications.mark_read")}
          </button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="resident-card resident-empty resident-notifications__empty">
          <span aria-hidden="true"><BellSlash weight="duotone" /></span>
          <p><strong>{t("notifications.all_caught_up")}</strong></p>
          <p>{t("notifications.empty")}</p>
        </div>
      ) : (
        <ul className="resident-row-list">
          {notifications.map((item) => (
            <li key={item.id} className="resident-card resident-notification" data-unread={item.unread ? "true" : "false"}>
              <span className="resident-row__copy">
                <strong>{item.title[locale]}</strong>
                <small>{item.description[locale]}</small>
                <time dateTime={item.occurredAt}>{formatDateTime(item.occurredAt, locale)}</time>
              </span>
              {item.unread ? <span className="resident-chat-badge" aria-label={t("notifications.unread")}>•</span> : null}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
