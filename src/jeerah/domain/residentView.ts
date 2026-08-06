import type {
  Amenity, AmenityBooking, Announcement, CommunityEvent, Conversation, DemoState, LocalizedText, NeighborDeal,
  NeighborGift, Poll, RecurringPlan, ServiceOrder, VisitorPass, WalletTransaction,
} from "./models";

/**
 * The resident surface only ever reads through these filters. Anything owned by
 * another resident — orders, plans, gifts, passes, bookings — never reaches a
 * screen, and community records are scoped to the resident's own building.
 */
export const residentOrders = (state: DemoState): ServiceOrder[] =>
  state.orders.filter((order) => order.residentId === state.currentResidentId);

export const residentPlans = (state: DemoState): RecurringPlan[] =>
  state.recurringPlans.filter((plan) => plan.residentId === state.currentResidentId);

export const residentGifts = (state: DemoState): NeighborGift[] =>
  state.gifts.filter((gift) => gift.senderId === state.currentResidentId);

export const residentPasses = (state: DemoState): VisitorPass[] =>
  state.visitorPasses.filter((pass) => pass.residentId === state.currentResidentId);

export const residentBookings = (state: DemoState): AmenityBooking[] =>
  state.amenityBookings.filter((booking) => booking.residentId === state.currentResidentId);

export const buildingAnnouncements = (state: DemoState): Announcement[] =>
  state.announcements.filter((item) => item.buildingId === state.currentBuildingId);

export const buildingPolls = (state: DemoState): Poll[] =>
  state.polls.filter((item) => item.buildingId === state.currentBuildingId);

export const buildingEvents = (state: DemoState): CommunityEvent[] =>
  state.events.filter((item) => item.buildingId === state.currentBuildingId);

export const buildingDeals = (state: DemoState): NeighborDeal[] =>
  state.neighborDeals.filter((item) => item.buildingId === state.currentBuildingId);

export const buildingAmenities = (state: DemoState): Amenity[] =>
  state.amenities.filter((item) => item.buildingId === state.currentBuildingId);

export const currentResident = (state: DemoState) =>
  state.residents.find((resident) => resident.id === state.currentResidentId);

export const isSubscriber = (state: DemoState) => currentResident(state)?.subscriber === true;

/** The order a resident should be nudged about first: the one still in flight. */
const OPEN_STATUSES = new Set(["awaiting-quote", "quote-ready", "scheduled", "confirmed", "assigned", "en-route", "in-progress", "awaiting-resident-approval"]);
export function activeResidentOrder(state: DemoState): ServiceOrder | undefined {
  return residentOrders(state)
    .filter((order) => OPEN_STATUSES.has(order.status))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || left.id.localeCompare(right.id))[0];
}

export function pollVoteOptionId(poll: Poll, residentId: string): string | undefined {
  return poll.options.find((option) => option.voterIds.includes(residentId))?.id;
}

/** Aggregate counts only — a resident never learns who voted for what. */
export function pollTotals(poll: Poll) {
  const total = poll.options.reduce((sum, option) => sum + option.voterIds.length, 0);
  return {
    total,
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      count: option.voterIds.length,
      percent: total === 0 ? 0 : Math.round((option.voterIds.length / total) * 100),
    })),
  };
}

export const residentWalletTransactions = (state: DemoState): WalletTransaction[] =>
  state.walletTransactions
    .filter((transaction) => transaction.residentId === state.currentResidentId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));

/** Signed sum of the resident's simulated wallet movements. */
export const residentWalletBalance = (state: DemoState): number =>
  residentWalletTransactions(state).reduce(
    (sum, transaction) => sum + (transaction.kind === "spend" ? -transaction.amount : transaction.amount),
    0,
  );

export const residentConversations = (state: DemoState): Conversation[] =>
  state.conversations
    .filter((conversation) => conversation.residentId === state.currentResidentId)
    .sort((a, b) => (b.messages.at(-1)?.sentAt ?? "").localeCompare(a.messages.at(-1)?.sentAt ?? "") || a.id.localeCompare(b.id));

export interface ResidentNotification {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  occurredAt: string;
  unread: boolean;
}

/** Building announcements and activity, newest first, marked against the read cursor. */
export function residentNotifications(state: DemoState): ResidentNotification[] {
  const readAt = Date.parse(state.notificationsReadAt);
  const items: ResidentNotification[] = [
    ...state.announcements
      .filter((item) => item.buildingId === state.currentBuildingId)
      .map((item) => ({ id: `notification-${item.id}`, title: item.title, description: item.body, occurredAt: item.publishedAt, unread: Date.parse(item.publishedAt) > readAt })),
    ...state.activities
      .filter((item) => item.buildingId === state.currentBuildingId)
      .map((item) => ({ id: `notification-${item.id}`, title: item.title, description: item.description, occurredAt: item.occurredAt, unread: Date.parse(item.occurredAt) > readAt })),
  ];
  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
}
