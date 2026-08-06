import { useState } from "react";
import { z } from "zod";
import { useDemoDispatch, useDemoState } from "../../data/DemoProvider";
import { formatDateTime } from "../../domain/format";
import { demoId } from "../../domain/ids";
import { announcementPriorityMessageKey } from "../../i18n/messages";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminAnnounce } from "../AdminShell";
import { DialogField, EditDialog } from "../components/EditDialog";

const PRIORITIES = ["normal", "important", "urgent"] as const;

export function AnnouncementsPage() {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { t, locale } = useI18n();
  const announce = useAdminAnnounce();
  const [creating, setCreating] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);

  const announcementSchema = z.object({
    titleEn: z.string().trim().min(1, t("admin.validation_required")),
    titleAr: z.string().trim().min(1, t("admin.validation_required")),
    bodyEn: z.string().trim().min(1, t("admin.validation_required")),
    bodyAr: z.string().trim().min(1, t("admin.validation_required")),
    priority: z.enum(PRIORITIES),
  });

  const rows = [...state.announcements].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>{t("nav.announcements")}</h1>
        <span className="admin-inline-control">
          <button type="button" className="admin-button admin-button--primary" onClick={() => setCreating(true)}>
            {t("admin.new_announcement")}
          </button>
          <button type="button" className="admin-button admin-button--ghost" onClick={() => setCreatingPoll(true)}>
            {t("admin.new_poll")}
          </button>
        </span>
      </div>

      <ul className="admin-offer-list" aria-label={t("nav.announcements")}>
        {rows.map((item) => (
          <li key={item.id}>
            <strong>{item.title[locale]}</strong>
            <span>{item.body[locale]}</span>
            <span>{t(announcementPriorityMessageKey[item.priority])}</span>
            <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt, locale)}</time>
          </li>
        ))}
      </ul>

      <section className="admin-card" aria-label={t("community.polls")}>
        <h2>{t("community.polls")}</h2>
        <ul className="admin-offer-list">
          {state.polls.map((poll) => (
            <li key={poll.id}>
              <strong>{poll.question[locale]}</strong>
              <span>
                {poll.options
                  .map((option) => `${option.label[locale]} (${option.voterIds.length})`)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {creating ? (
        <EditDialog
          title={t("admin.new_announcement")}
          open
          onOpenChange={(open) => {
            if (!open) setCreating(false);
          }}
          onSubmit={async (form) => {
            const parsed = announcementSchema.safeParse({
              titleEn: form.get("titleEn"),
              titleAr: form.get("titleAr"),
              bodyEn: form.get("bodyEn"),
              bodyAr: form.get("bodyAr"),
              priority: form.get("priority"),
            });
            if (!parsed.success) return parsed.error.issues[0]?.message ?? t("admin.validation_required");
            await dispatch({
              type: "announcement/published",
              announcement: {
                id: demoId("announcement"),
                buildingId: state.currentBuildingId,
                title: { en: parsed.data.titleEn, ar: parsed.data.titleAr },
                body: { en: parsed.data.bodyEn, ar: parsed.data.bodyAr },
                priority: parsed.data.priority,
                publishedAt: state.now,
              },
            });
            announce(t("admin.published"));
            return null;
          }}
          submitLabel={t("action.publish")}
        >
          <DialogField label={t("admin.title_en")} name="titleEn" defaultValue="" />
          <DialogField label={t("admin.title_ar")} name="titleAr" defaultValue="" />
          <DialogField label={t("admin.body_en")} name="bodyEn" defaultValue="" />
          <DialogField label={t("admin.body_ar")} name="bodyAr" defaultValue="" />
          <label className="admin-field">
            <span>{t("table.priority")}</span>
            <select name="priority" defaultValue="normal">
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(announcementPriorityMessageKey[priority])}
                </option>
              ))}
            </select>
          </label>
        </EditDialog>
      ) : null}

      {creatingPoll ? (
        <EditDialog
          title={t("admin.new_poll")}
          open
          onOpenChange={(open) => {
            if (!open) setCreatingPoll(false);
          }}
          onSubmit={async (form) => {
            const question = { en: String(form.get("questionEn") ?? "").trim(), ar: String(form.get("questionAr") ?? "").trim() };
            const optionValues = [1, 2, 3, 4]
              .map((index) => ({
                en: String(form.get(`optionEn${index}`) ?? "").trim(),
                ar: String(form.get(`optionAr${index}`) ?? "").trim(),
              }))
              .filter((option) => option.en !== "" && option.ar !== "");
            if (!question.en || !question.ar) return t("admin.validation_required");
            if (optionValues.length < 2) return t("admin.validation_poll_options");
            const pollId = demoId("poll");
            await dispatch({
              type: "poll/created",
              poll: {
                id: pollId,
                buildingId: state.currentBuildingId,
                question,
                options: optionValues.map((option, index) => ({ id: `${pollId}-option-${index + 1}`, label: option, voterIds: [] })),
                closesAt: new Date(Date.parse(state.now) + 7 * 24 * 60 * 60 * 1000).toISOString(),
              },
            });
            announce(t("admin.published"));
            return null;
          }}
          submitLabel={t("action.publish")}
        >
          <DialogField label={t("admin.question_en")} name="questionEn" defaultValue="" />
          <DialogField label={t("admin.question_ar")} name="questionAr" defaultValue="" />
          {[1, 2].map((index) => (
            <div key={index} className="admin-inline-control">
              <DialogField label={`${t("admin.option_en")} ${index}`} name={`optionEn${index}`} defaultValue="" />
              <DialogField label={`${t("admin.option_ar")} ${index}`} name={`optionAr${index}`} defaultValue="" />
            </div>
          ))}
          {[3, 4].map((index) => (
            <div key={index} className="admin-inline-control">
              <DialogField label={`${t("admin.option_en")} ${index}`} name={`optionEn${index}`} defaultValue="" />
              <DialogField label={`${t("admin.option_ar")} ${index}`} name={`optionAr${index}`} defaultValue="" />
            </div>
          ))}
        </EditDialog>
      ) : null}
    </section>
  );
}
