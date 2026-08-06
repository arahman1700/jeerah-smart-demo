import type {
  Amenity, AmenityBooking, Announcement, CommunityEvent, DemoState, NeighborDeal, NeighborGift, Poll,
  RecurringPlan, ServiceOrder, VisitorPass,
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
