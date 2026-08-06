import { PaperPlaneTilt } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { KeyboardInput, useKeyboard } from "../../../mobile/Keyboard";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatTime } from "../../domain/format";
import { demoId } from "../../domain/ids";
import { useI18n } from "../../i18n/I18nProvider";

const DEMO_REPLIES: Array<{ ar: string; en: string }> = [
  { ar: "شكرًا لرسالتك! سنعود إليك خلال دقائق — رد تجريبي.", en: "Thanks for your message! We will get back to you shortly — demo reply." },
  { ar: "تم استلام طلبك وسيتواصل معك الفني — رد تجريبي.", en: "Your request was received; a technician will reach out — demo reply." },
  { ar: "يسعدنا خدمتك في أي وقت — رد تجريبي.", en: "Happy to help any time — demo reply." },
];

/** One provider inquiry thread with a locally scripted demo reply. */
export function ChatConversationPage({ conversationId }: { conversationId: string }) {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { locale, t } = useI18n();
  const keyboard = useKeyboard();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const readMarked = useRef(false);
  const conversation = state.conversations.find((item) => item.id === conversationId);
  const provider = conversation ? state.providers.find((item) => item.id === conversation.providerId) : undefined;
  const offline = state.scenario === "offline";

  useEffect(() => {
    if (!conversation || conversation.unreadCount === 0 || readMarked.current) return;
    readMarked.current = true;
    void dispatch({ type: "chat/read", conversationId: conversation.id });
  }, [conversation, dispatch]);

  if (!conversation) return <p className="resident-card resident-empty" data-testid="missing-entity">{t("error.not_found")}</p>;

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || offline) return;
    setSending(true);
    try {
      const reply = DEMO_REPLIES[conversation.messages.length % DEMO_REPLIES.length];
      await dispatch({
        type: "chat/message-sent",
        conversationId: conversation.id,
        message: { id: demoId("msg"), author: "resident", body, sentAt: state.now },
        reply: { id: demoId("msg"), author: "provider", body: reply[locale], sentAt: state.now },
      });
      await dispatch({ type: "chat/read", conversationId: conversation.id });
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="resident-chat" data-testid="chat-conversation">
      <header className="resident-page-title">
        <h1>{provider?.name[locale] ?? conversation.providerId}</h1>
        <p className="resident-page-title__intro">{t("chat.simulated_notice")}</p>
      </header>

      <ol className="resident-chat__thread" aria-label={t("chat.title")}>
        {conversation.messages.map((message) => (
          <li
            key={message.id}
            className={`resident-chat__bubble resident-chat__bubble--${message.author}`}
            data-testid={`chat-message-${message.id}`}
          >
            <p>{message.body}</p>
            <time dateTime={message.sentAt}>{formatTime(message.sentAt, locale)}</time>
          </li>
        ))}
      </ol>

      {offline ? <p className="resident-alert">{t("error.offline")}</p> : null}

      <div className="resident-chat__composer">
        <label className="resident-field resident-chat__field" htmlFor="jeerah-chat-draft">
          <span className="resident-visually-hidden">{t("chat.compose")}</span>
          <KeyboardInput
            id="jeerah-chat-draft"
            autoComplete="off"
            placeholder={t("chat.compose")}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => keyboard.hide()}
          />
        </label>
        <button
          type="button"
          className="resident-primary-button resident-chat__send"
          aria-label={t("chat.send")}
          data-testid="chat-send"
          disabled={sending || offline || draft.trim() === ""}
          onClick={() => void send()}
        >
          <PaperPlaneTilt aria-hidden="true" weight="duotone" />
        </button>
      </div>
    </article>
  );
}
