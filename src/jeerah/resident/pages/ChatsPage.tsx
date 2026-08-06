import { ChatsCircle, Storefront } from "@phosphor-icons/react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatTime } from "../../domain/format";
import { residentConversations } from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";
import { getResidentRoute, getResidentScreen } from "../ResidentApp";

/** Marketplace inquiry threads, mirroring the reference chats surface. */
export function ChatsPage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const conversations = residentConversations(state);
  const unread = conversations.reduce((sum, item) => sum + item.unreadCount, 0);
  const active = conversations.filter((item) => item.status === "active").length;

  return (
    <article className="resident-chats" data-testid="chats-page">
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><ChatsCircle weight="duotone" /></span>
        <h1>{t("chat.title")}</h1>
      </header>

      <dl className="resident-card resident-chat-stats" aria-label={t("chat.title")}>
        <div><dt>{t("chat.total")}</dt><dd className="jeerah-numeric">{conversations.length}</dd></div>
        <div><dt>{t("chat.unread")}</dt><dd className="jeerah-numeric" data-testid="chats-unread">{unread}</dd></div>
        <div><dt>{t("chat.active")}</dt><dd className="jeerah-numeric">{active}</dd></div>
      </dl>

      {conversations.length === 0 ? (
        <div className="resident-card resident-empty resident-chats__empty">
          <p><strong>{t("chat.empty_title")}</strong></p>
          <p>{t("chat.empty_body")}</p>
          <button
            type="button"
            className="resident-primary-button"
            onClick={() => flow.replace(getResidentScreen("marketplace"))}
          >
            <span aria-hidden="true"><Storefront weight="duotone" /></span>
            {t("chat.browse_services")}
          </button>
        </div>
      ) : (
        <ul className="resident-row-list">
          {conversations.map((conversation) => {
            const provider = state.providers.find((item) => item.id === conversation.providerId);
            const last = conversation.messages.at(-1);
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  className="resident-card resident-row"
                  data-testid={`chat-row-${conversation.id}`}
                  onClick={() => flow.push(getResidentRoute({ kind: "chat", conversationId: conversation.id }))}
                >
                  <span className="resident-row__copy">
                    <strong>{provider?.name[locale] ?? conversation.providerId}</strong>
                    <small>{last?.body}</small>
                  </span>
                  <span className="resident-chat-meta">
                    {last ? <time dateTime={last.sentAt}>{formatTime(last.sentAt, locale)}</time> : null}
                    {conversation.unreadCount > 0 ? (
                      <span className="resident-chat-badge" aria-label={t("chat.unread")}>{conversation.unreadCount}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="resident-muted">{t("chat.simulated_notice")}</p>
    </article>
  );
}
