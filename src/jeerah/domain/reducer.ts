import { createSeedState } from "./fixtures";
import type { DemoAction, DemoState, OrderStatus, ServiceOrder } from "./models";

const note = (status: OrderStatus) => ({ ar: `تم تحديث الطلب إلى ${status}`, en: `Order updated to ${status}` });
const updateById = <T extends { id: string }>(items: T[], id: string, update: (item: T) => T): T[] => items.map((item) => item.id === id ? update(item) : item);
const upsert = <T extends { id: string }>(items: T[], item: T): T[] => items.some((current) => current.id === item.id) ? updateById(items, item.id, () => item) : [...items, item];
const addTimeline = (order: ServiceOrder, status: OrderStatus, occurredAt: string): ServiceOrder => ({ ...order, status, timeline: [...order.timeline, { id: `${order.id}-${status}-${occurredAt}`, status, occurredAt, note: note(status) }] });

export function reduceDemoState(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "locale/set": return { ...state, locale: action.locale };
    // Task 3 composes scenarios. Keeping this branch an identity transition prevents a dependency cycle.
    case "scenario/set": return state;
    case "invoice/created": return { ...state, invoices: [...state.invoices, action.invoice] };
    case "payment/recorded": return {
      ...state,
      payments: [...state.payments, action.payment],
      invoices: action.payment.status === "paid" ? updateById(state.invoices, action.payment.invoiceId, (invoice) => ({ ...invoice, status: "paid" })) : state.invoices,
    };
    case "payment/status-changed": {
      const payment = state.payments.find((item) => item.id === action.paymentId);
      return {
        ...state,
        payments: updateById(state.payments, action.paymentId, (item) => ({ ...item, status: action.status, occurredAt: action.occurredAt })),
        invoices: payment && action.status === "paid" ? updateById(state.invoices, payment.invoiceId, (invoice) => ({ ...invoice, status: "paid" })) : state.invoices,
      };
    }
    case "order/created": return { ...state, orders: [...state.orders, action.order] };
    case "order/status-changed": return { ...state, orders: updateById(state.orders, action.orderId, (order) => addTimeline(order, action.status, action.occurredAt)) };
    case "order/provider-assigned": return { ...state, orders: updateById(state.orders, action.orderId, (order) => ({ ...addTimeline(order, "assigned", action.occurredAt), providerId: action.providerId })) };
    case "order/rated": return { ...state, orders: updateById(state.orders, action.orderId, (order) => ({ ...order, rating: action.rating })) };
    case "service/availability-changed": return { ...state, serviceOfferings: updateById(state.serviceOfferings, action.serviceId, (service) => ({ ...service, active: action.active })) };
    case "service/updated": return { ...state, serviceOfferings: updateById(state.serviceOfferings, action.serviceId, (service) => ({ ...service, ...action.patch })) };
    case "quote/approved": return { ...state, orders: updateById(state.orders, action.orderId, (order) => ({ ...addTimeline(order, "scheduled", action.occurredAt), quoteAmount: action.amount, amount: action.amount })) };
    case "quote/rejected": return { ...state, orders: updateById(state.orders, action.orderId, (order) => addTimeline(order, "cancelled", action.occurredAt)) };
    case "member-offer/upserted": return { ...state, memberOffers: upsert(state.memberOffers, action.offer) };
    case "member-offer/disabled": return { ...state, memberOffers: updateById(state.memberOffers, action.offerId, (offer) => ({ ...offer, active: false })) };
    case "recurring-plan/upserted": return { ...state, recurringPlans: upsert(state.recurringPlans, action.plan) };
    case "recurring-plan/toggled": return { ...state, recurringPlans: updateById(state.recurringPlans, action.planId, (plan) => ({ ...plan, active: action.active })) };
    case "recurring-plan/next-skipped": return { ...state, recurringPlans: updateById(state.recurringPlans, action.planId, (plan) => ({ ...plan, skippedDates: plan.skippedDates.includes(action.date) ? plan.skippedDates : [...plan.skippedDates, action.date] })) };
    case "neighbor-deal/joined": return { ...state, neighborDeals: updateById(state.neighborDeals, action.dealId, (deal) => ({ ...deal, participantIds: deal.participantIds.includes(action.residentId) ? deal.participantIds : [...deal.participantIds, action.residentId] })) };
    case "neighbor-gift/sent": return { ...state, gifts: [...state.gifts, action.gift] };
    case "building/updated": return { ...state, buildings: updateById(state.buildings, action.buildingId, (building) => ({ ...building, ...action.patch })) };
    case "unit/updated": return { ...state, units: updateById(state.units, action.unitId, (unit) => ({ ...unit, ...action.patch })) };
    case "resident/updated": return { ...state, residents: updateById(state.residents, action.residentId, (resident) => ({ ...resident, ...action.patch })) };
    case "announcement/published": return { ...state, announcements: [...state.announcements, action.announcement] };
    case "poll/created": return { ...state, polls: [...state.polls, action.poll] };
    case "visitor-pass/created": return { ...state, visitorPasses: [...state.visitorPasses, action.pass] };
    case "amenity-booking/created": return { ...state, amenityBookings: [...state.amenityBookings, action.booking] };
    case "poll/voted": return { ...state, polls: updateById(state.polls, action.pollId, (poll) => ({ ...poll, options: poll.options.map((option) => ({ ...option, voterIds: option.id === action.optionId ? option.voterIds.includes(action.residentId) ? option.voterIds : [...option.voterIds, action.residentId] : option.voterIds.filter((id) => id !== action.residentId) })) })) };
    case "event/rsvp": return { ...state, events: updateById(state.events, action.eventId, (event) => ({ ...event, attendeeIds: action.attending ? event.attendeeIds.includes(action.residentId) ? event.attendeeIds : [...event.attendeeIds, action.residentId] : event.attendeeIds.filter((id) => id !== action.residentId) })) };
    case "demo/reset": return createSeedState();
  }
}
