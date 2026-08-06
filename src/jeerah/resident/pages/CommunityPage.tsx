import { Bell, CalendarCheck, CaretRight, ClipboardText, IdentificationCard, UsersThree } from "@phosphor-icons/react";
import { useState } from "react";
import type { FlowControls } from "../../../mobile/FlowStack";
import { useDemoState } from "../../data/DemoProvider";
import { formatDate, formatDateTime } from "../../domain/format";
import {
  buildingAnnouncements, buildingDeals, buildingEvents, buildingPolls, pollTotals, pollVoteOptionId,
} from "../../domain/residentView";
import { useI18n } from "../../i18n/I18nProvider";
import { announcementPriorityMessageKey } from "../../i18n/messages";
import { getResidentRoute } from "../ResidentApp";
import { orderedBuildingActivities } from "./HomePage";
import { NeighborDealCard } from "../components/NeighborDeal";
import { ResidentPage } from "../components/ResidentPage";
import { LiveMessage, useDemoMutation } from "../components/ServiceBits";

/** Building 89 only: its announcements, polls, one event, and its group deals. */
export function CommunityPage({ flow }: { flow: FlowControls }) {
  const state = useDemoState();
  const { locale, t } = useI18n();
  const { message, setMessage, run } = useDemoMutation();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [voted, setVoted] = useState<string | null>(null);
  const [rsvped, setRsvped] = useState(false);

  const residentId = state.currentResidentId;
  const announcements = buildingAnnouncements(state);
  const polls = buildingPolls(state);
  const events = buildingEvents(state);
  const deals = buildingDeals(state);
  const activities = orderedBuildingActivities(state.activities, state.currentBuildingId);

  async function vote(pollId: string, closed: boolean) {
    const optionId = drafts[pollId];
    if (closed) return;
    if (!optionId) {
      setMessage(t("error.select_option"));
      return;
    }
    if (await run({ type: "poll/voted", pollId, optionId, residentId })) setVoted(pollId);
  }

  return (
    <ResidentPage screen="community" footerClearance>
      <header className="resident-page-title">
        <span className="resident-page-title__icon" aria-hidden="true"><Bell weight="duotone" /></span>
        <h1>{t("nav.community")}</h1>
        <p className="resident-page-title__intro">{t("resident.community_intro")}</p>
      </header>

      <div className="resident-row-list">
        <button type="button" className="resident-card resident-row" onClick={() => flow.push(getResidentRoute({ kind: "visitor" }))} data-testid="open-visitor">
          <IdentificationCard aria-hidden="true" weight="duotone" />
          <span className="resident-row__copy"><strong>{t("visitor.title")}</strong></span>
          <CaretRight aria-hidden="true" weight="bold" />
        </button>
        <button type="button" className="resident-card resident-row" onClick={() => flow.push(getResidentRoute({ kind: "amenities" }))} data-testid="open-amenities">
          <CalendarCheck aria-hidden="true" weight="duotone" />
          <span className="resident-row__copy"><strong>{t("nav.amenities")}</strong></span>
          <CaretRight aria-hidden="true" weight="bold" />
        </button>
      </div>

      <LiveMessage tone="error">{message}</LiveMessage>

      <section className="resident-section" aria-label={t("community.announcements")}>
        <h2 className="resident-section__heading">{t("community.announcements")}</h2>
        {announcements.length ? (
          <ul className="resident-row-list">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="resident-card resident-row" data-testid={`announcement-${announcement.id}`}>
                <span className="resident-row__copy">
                  <strong>{announcement.title[locale]}</strong>
                  <small>{announcement.body[locale]}</small>
                </span>
                <span className="resident-status-pill" data-status={announcement.priority}>{t(announcementPriorityMessageKey[announcement.priority])}</span>
              </li>
            ))}
          </ul>
        ) : <p className="resident-card resident-empty">{t("empty.announcements")}</p>}
      </section>

      <section className="resident-section" aria-label={t("community.polls")}>
        <h2 className="resident-section__heading">{t("community.polls")}</h2>
        {polls.map((poll) => {
          const closed = Date.parse(poll.closesAt) <= Date.parse(state.now);
          const myOption = pollVoteOptionId(poll, residentId);
          const totals = pollTotals(poll);
          return (
            <article key={poll.id} className="resident-card resident-poll" data-testid={`poll-${poll.id}`}>
              <h3>{poll.question[locale]}</h3>
              <fieldset className="resident-methods">
                <legend>{t("poll.option")}</legend>
                {poll.options.map((option) => {
                  const summary = totals.options.find((item) => item.id === option.id)!;
                  return (
                    <label key={option.id} className="resident-method" data-selected={(drafts[poll.id] ?? myOption) === option.id ? "true" : "false"}>
                      <input
                        type="radio"
                        name={`poll-${poll.id}`}
                        value={option.id}
                        disabled={closed}
                        checked={(drafts[poll.id] ?? myOption) === option.id}
                        onChange={() => setDrafts((current) => ({ ...current, [poll.id]: option.id }))}
                      />
                      <span className="resident-method__copy">
                        <strong>{option.label[locale]}</strong>
                        <small className="jeerah-numeric">{summary.percent}% · {t("community.vote_totals", { count: summary.count })}</small>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              {closed ? <p className="resident-notice">{t("community.poll_closed")}</p> : null}
              {myOption ? <p className="resident-notice" data-testid={`poll-mine-${poll.id}`}>{t("community.your_vote")}</p> : null}
              {voted === poll.id ? <LiveMessage>{t("community.participation")}</LiveMessage> : null}
              <button
                type="button"
                className="resident-primary-button"
                disabled={closed}
                onClick={() => void vote(poll.id, closed)}
                data-testid={`poll-vote-${poll.id}`}
              >
                {t("action.vote")}
              </button>
            </article>
          );
        })}
      </section>

      <section className="resident-section" aria-label={t("community.event")}>
        <h2 className="resident-section__heading">{t("community.event")}</h2>
        {events.map((event) => {
          const attending = event.attendeeIds.includes(residentId);
          const full = !attending && event.attendeeIds.length >= event.capacity;
          return (
            <article key={event.id} className="resident-card resident-event" data-testid={`event-${event.id}`}>
              <h3>{event.title[locale]}</h3>
              <p><time dateTime={event.startsAt}>{formatDateTime(event.startsAt, locale)}</time></p>
              <p className="resident-eyebrow" data-testid={`event-attendance-${event.id}`}>
                {t("community.attendance", { count: event.attendeeIds.length, capacity: event.capacity })}
              </p>
              {rsvped && attending ? <LiveMessage>{t("community.rsvp_confirmed")}</LiveMessage> : null}
              <button
                type="button"
                className="resident-primary-button"
                disabled={full}
                data-testid={`event-rsvp-${event.id}`}
                onClick={async () => {
                  if (await run({ type: "event/rsvp", eventId: event.id, residentId, attending: !attending })) setRsvped(!attending);
                }}
              >
                {attending ? t("action.cancel_booking") : t("action.rsvp")}
              </button>
            </article>
          );
        })}
      </section>

      <section className="resident-section" aria-label={t("community.deals")}>
        <h2 className="resident-section__heading">{t("community.deals")}</h2>
        {deals.map((deal) => {
          const service = state.serviceOfferings.find((item) => item.id === deal.serviceId);
          return (
            <NeighborDealCard
              key={deal.id}
              deal={deal}
              title={service?.name[locale] ?? t("deal.neighbor")}
              joined={deal.participantIds.includes(residentId)}
              onJoin={() => void run({ type: "neighbor-deal/joined", dealId: deal.id, residentId })}
            />
          );
        })}
      </section>

      <section className="resident-section" aria-label={t("resident.activity")}>
        <h2 className="resident-section__heading">{t("resident.activity")}</h2>
        {activities.length ? (
          <ul className="resident-row-list">
            {activities.map((activity) => (
              <li key={activity.id} className="resident-card resident-row">
                <ClipboardText aria-hidden="true" weight="duotone" />
                <span className="resident-row__copy">
                  <strong>{activity.title[locale]}</strong>
                  <small>{activity.description[locale]}</small>
                </span>
                <time className="jeerah-numeric" dateTime={activity.occurredAt}>{formatDate(activity.occurredAt, locale)}</time>
              </li>
            ))}
          </ul>
        ) : <p className="resident-card resident-empty">{t("empty.community")}</p>}
      </section>

      <p className="resident-notice">
        <UsersThree aria-hidden="true" weight="duotone" /> {t("deal.privacy")}
      </p>
    </ResidentPage>
  );
}
