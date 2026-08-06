import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatDateTime } from "../../domain/format";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";

/** Fictional website contact messages, mirroring the reference admin inbox. */
export function ContactMessagesPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { locale, t } = useI18n();
  const announce = useAdminAnnounce();
  const rows = [...state.contactMessages].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt) || a.id.localeCompare(b.id));
  const unread = rows.filter((row) => !row.read).length;

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>{t("admin.contact_messages")}</h1>
        <span className="admin-demo-badge" data-testid="messages-unread">{unread} {t("chat.unread")}</span>
      </div>
      {rows.length === 0 ? (
        <p>{t("admin.no_messages")}</p>
      ) : (
        <ul className="admin-offer-list" aria-label={t("admin.contact_messages")}>
          {rows.map((message) => (
            <li key={message.id} data-testid={`admin-message-${message.id}`} data-unread={message.read ? "false" : "true"}>
              <span className="admin-message-copy">
                <strong>{message.subject[locale]}</strong>
                <span>{message.body[locale]}</span>
                <span className="admin-muted">
                  {message.senderName} · <bdi dir="ltr">{message.senderEmail}</bdi> · {formatDateTime(message.receivedAt, locale)}
                </span>
              </span>
              {message.read ? null : (
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  aria-label={`${t("admin.mark_read")} — ${message.subject[locale]}`}
                  onClick={async () => {
                    await dispatch({ type: "contact-message/read", messageId: message.id });
                    announce(t("admin.saved"));
                  }}
                >
                  {t("admin.mark_read")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
