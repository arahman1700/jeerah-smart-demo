import { ORDER_STATUS_NOTES, createSeedState } from "./fixtures";
import type {
  Activity, Amenity, AuditEntry, DemoAction, DemoState, Invoice, InvoiceStatus, NeighborDeal, OrderStatus,
  Payment, RecurringPlan, ServiceOffering, ServiceOrder,
} from "./models";
import {
  INITIAL_ORDER_STATUS, ORDER_STATUSES, ORDER_TRANSITIONS, PAYMENT_METHODS, PAYMENT_METHOD_MASK,
  PAYMENT_STATUSES, READ_ONLY_ACTION_TYPES, SERVICE_FULFILLMENTS,
} from "./models";
import { dealIsOrderable, dealUnitPrice } from "./serviceCatalog";
import { applyScenario } from "../data/scenarios";

const note = (status: OrderStatus) => ({ ar: ORDER_STATUS_NOTES[status][0], en: ORDER_STATUS_NOTES[status][1] });
const hasId = <T extends { id: string }>(items: T[], id: string) => items.some((item) => item.id === id);
const updateById = <T extends { id: string }>(items: T[], id: string, update: (item: T) => T): T[] => items.map((item) => item.id === id ? update(item) : item);
const upsert = <T extends { id: string }>(items: T[], item: T): T[] => hasId(items, item.id) ? updateById(items, item.id, () => item) : [...items, item];
const addTimeline = (order: ServiceOrder, status: OrderStatus, occurredAt: string): ServiceOrder => ({ ...order, status, timeline: [...order.timeline, { id: `${order.id}-${status}-${occurredAt}`, status, occurredAt, note: note(status) }] });

const filled = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const isoTime = (value: unknown): value is string => filled(value) && Number.isFinite(Date.parse(value));
const before = (left: string, right: string) => Date.parse(left) < Date.parse(right);

function residentAt(state: DemoState, residentId: string, buildingId: string, unitId?: string): boolean {
  const resident = state.residents.find((item) => item.id === residentId);
  const unit = resident && state.units.find((item) => item.id === resident.unitId);
  return Boolean(resident && unit && unit.buildingId === buildingId && (!unitId || unit.id === unitId));
}

function validInvoice(state: DemoState, invoice: { buildingId: string; unitId?: string; residentId?: string }): boolean {
  if (!state.buildings.some((building) => building.id === invoice.buildingId)) return false;
  if (invoice.unitId && !state.units.some((unit) => unit.id === invoice.unitId && unit.buildingId === invoice.buildingId)) return false;
  return !invoice.residentId || residentAt(state, invoice.residentId, invoice.buildingId, invoice.unitId);
}

const PAYABLE_INVOICE_STATUSES = new Set<InvoiceStatus>(["due", "overdue", "upcoming"]);

/**
 * A demo payment may only be recorded against an existing, payable invoice that
 * belongs to the paying resident, for that invoice's exact total, with the mask
 * its method is allowed to show. Anything else leaves the state untouched.
 */
function payableInvoiceFor(state: DemoState, payment: Payment): Invoice | undefined {
  if (!filled(payment.id) || !filled(payment.reference) || !filled(payment.occurredAt)) return undefined;
  if (!PAYMENT_METHODS.includes(payment.method) || !PAYMENT_STATUSES.includes(payment.status)) return undefined;
  if (payment.last4 !== PAYMENT_METHOD_MASK[payment.method]) return undefined;
  if (!state.residents.some((resident) => resident.id === payment.residentId)) return undefined;
  const invoice = state.invoices.find((item) => item.id === payment.invoiceId);
  if (!invoice || invoice.residentId !== payment.residentId) return undefined;
  if (!PAYABLE_INVOICE_STATUSES.has(invoice.status)) return undefined;
  if (!Number.isFinite(payment.amount) || payment.amount <= 0 || payment.amount !== invoice.total) return undefined;
  return invoice;
}

/** Audit and activity identifiers are derived from the payment so replays stay idempotent. */
function paymentAudit(payment: Payment, action: string, id: string, description: AuditEntry["description"], occurredAt: string): AuditEntry {
  return { id, actorId: payment.residentId, action, entityType: "payment", entityId: payment.id, description, occurredAt };
}

function paidActivity(payment: Payment, invoice: Invoice): Activity {
  return {
    id: `activity-${payment.id}`,
    buildingId: invoice.buildingId,
    kind: "payment",
    title: { ar: "تم دفع فاتورة تجريبية", en: "Demo invoice paid" },
    description: invoice.title,
    occurredAt: payment.occurredAt,
  };
}

function reconcileInvoice(state: DemoState, payments: Payment[], invoiceId: string) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return state.invoices;
  const nextStatus: typeof invoice.status = payments.some((payment) => payment.invoiceId === invoiceId && payment.status === "paid") ? "paid" : invoice.status === "paid" ? "due" : invoice.status;
  return nextStatus === invoice.status ? state.invoices : updateById(state.invoices, invoiceId, (item) => ({ ...item, status: nextStatus }));
}

function groupDealFor(state: DemoState, order: ServiceOrder): NeighborDeal | undefined {
  return state.neighborDeals.find((deal) => deal.id === order.dealId && deal.serviceId === order.serviceId && deal.buildingId === order.buildingId);
}

/**
 * Money on the order must agree with how the catalog says the service is priced,
 * including the member offer or group tier the resident actually qualified for.
 * A quote order carries no amount at all until its quote is approved.
 */
function orderAmountIsCoherent(state: DemoState, service: ServiceOffering, order: ServiceOrder): boolean {
  if (order.fulfillment === "quote") return order.amount === undefined && order.quoteAmount === undefined;
  if (order.quoteAmount !== undefined || !positive(order.amount)) return false;
  const quantity = order.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) return false;

  const offer = order.offerId ? state.memberOffers.find((item) => item.id === order.offerId) : undefined;
  if (order.offerId && !offer) return false;
  const deal = order.dealId ? groupDealFor(state, order) : undefined;
  if (order.dealId && !deal) return false;

  if (deal) return order.amount === dealUnitPrice(deal) * quantity;
  if (offer) return order.amount === offer.memberPrice * quantity;
  if (service.pricingModel === "quote-required") return false;
  if (service.pricingModel === "starting-at") return order.amount! >= (service.startingPrice ?? 0) * quantity;
  return order.amount === (service.price ?? -1) * quantity;
}

/**
 * A brand-new order must be internally coherent before it can exist: an active
 * service that supports the chosen mode, a provider that actually serves it, the
 * exact initial status for that mode, one matching first timeline event, the
 * schedule or ETA the mode needs, and a group deal that has really opened.
 */
function acceptableNewOrder(state: DemoState, order: ServiceOrder): boolean {
  if (!filled(order.id) || hasId(state.orders, order.id) || !isoTime(order.createdAt)) return false;
  if (!SERVICE_FULFILLMENTS.includes(order.fulfillment)) return false;
  const service = state.serviceOfferings.find((item) => item.id === order.serviceId);
  if (!service || !service.active || !service.fulfillment.includes(order.fulfillment)) return false;
  if (!order.providerId || !service.providerIds.includes(order.providerId)) return false;
  if (!residentAt(state, order.residentId, order.buildingId, order.unitId)) return false;
  if (order.status !== INITIAL_ORDER_STATUS[order.fulfillment]) return false;
  if (order.timeline.length !== 1 || order.timeline[0].status !== order.status || !isoTime(order.timeline[0].occurredAt)) return false;
  if (order.rating !== undefined) return false;
  if (order.sampleImageIds && (order.fulfillment !== "quote" || !order.sampleImageIds.every(filled))) return false;
  if (!orderAmountIsCoherent(state, service, order)) return false;
  if (order.fulfillment === "on-demand" && !positive(order.etaMinutes)) return false;
  if (order.fulfillment !== "on-demand" && order.fulfillment !== "quote") {
    if (!isoTime(order.scheduledAt) || !before(state.now, order.scheduledAt!)) return false;
  }
  if (order.offerId) {
    const offer = state.memberOffers.find((item) => item.id === order.offerId);
    if (!offer || !offer.active || offer.serviceId !== service.id) return false;
    if (!before(state.now, offer.validUntil)) return false;
    if (state.residents.find((item) => item.id === order.residentId)?.subscriber !== true) return false;
  }
  if (order.fulfillment === "group") {
    const deal = groupDealFor(state, order);
    if (!deal || !dealIsOrderable(deal) || !before(state.now, deal.closesAt)) return false;
    if (!deal.participantIds.includes(order.residentId)) return false;
  }
  return true;
}

function acceptablePlan(state: DemoState, plan: RecurringPlan): boolean {
  const service = state.serviceOfferings.find((item) => item.id === plan.serviceId);
  if (!service || !service.active || !service.fulfillment.includes("recurring")) return false;
  if (!hasId(state.residents, plan.residentId) || !service.providerIds.includes(plan.providerId)) return false;
  if (!isoTime(plan.nextDate) || !before(state.now, plan.nextDate)) return false;
  const existing = state.recurringPlans.find((item) => item.id === plan.id);
  return !existing || existing.residentId === plan.residentId;
}

export const canTransition = (from: OrderStatus, to: OrderStatus) => ORDER_TRANSITIONS[from]?.includes(to) === true;

function amenityFor(state: DemoState, amenityId: string, buildingId: string): Amenity | undefined {
  return state.amenities.find((item) => item.id === amenityId && item.buildingId === buildingId);
}

function mutates(state: DemoState, action: DemoAction): boolean {
  return state.scenario === "offline" && !READ_ONLY_ACTION_TYPES.has(action.type);
}

export function reduceDemoState(state: DemoState, action: DemoAction): DemoState {
  /** Offline is a browsing-only scenario: cached reads stay, writes are refused. */
  if (mutates(state, action)) return state;
  switch (action.type) {
    case "locale/set": return { ...state, locale: action.locale };
    case "scenario/set": {
      const scenarioState = applyScenario(state, action.scenario);
      return {
        ...scenarioState,
        auditLog: [...scenarioState.auditLog, {
          id: `audit-scenario-${action.scenario}-${scenarioState.auditLog.length + 1}`,
          actorId: scenarioState.currentResidentId,
          action: "scenario/set",
          entityType: "scenario",
          entityId: action.scenario,
          description: { ar: "تم تغيير سيناريو العرض", en: "Demo scenario changed" },
          occurredAt: "2026-08-03T12:00:00+03:00",
        }],
      };
    }
    case "invoice/created": return validInvoice(state, action.invoice) && !hasId(state.invoices, action.invoice.id) ? { ...state, invoices: [...state.invoices, action.invoice] } : state;
    case "payment/recorded": {
      const payment = action.payment;
      if (hasId(state.payments, payment.id)) return state;
      const invoice = payableInvoiceFor(state, payment);
      if (!invoice) return state;
      const payments = [...state.payments, payment];
      const auditLog = [...state.auditLog, paymentAudit(
        payment, "payment/recorded", `audit-${payment.id}`,
        { ar: "تم تسجيل دفعة تجريبية", en: "Demo payment recorded" }, payment.occurredAt,
      )];
      if (payment.status !== "paid") return { ...state, payments, auditLog };
      return {
        ...state,
        payments,
        auditLog,
        invoices: updateById(state.invoices, invoice.id, (item) => ({ ...item, status: "paid" })),
        activities: [...state.activities, paidActivity(payment, invoice)],
      };
    }
    case "payment/status-changed": {
      const payment = state.payments.find((item) => item.id === action.paymentId);
      if (!payment || !PAYMENT_STATUSES.includes(action.status) || !filled(action.occurredAt)) return state;
      const auditId = `audit-${action.paymentId}-${action.status}-${action.occurredAt}`;
      if (hasId(state.auditLog, auditId)) return state;
      const payments = updateById(state.payments, action.paymentId, (item) => ({ ...item, status: action.status, occurredAt: action.occurredAt }));
      return {
        ...state,
        payments,
        invoices: reconcileInvoice(state, payments, payment.invoiceId),
        auditLog: [...state.auditLog, paymentAudit(
          payment, "payment/status-changed", auditId,
          { ar: "تم تحديث حالة دفعة تجريبية", en: "Demo payment status updated" }, action.occurredAt,
        )],
      };
    }
    case "order/created": return acceptableNewOrder(state, action.order) ? { ...state, orders: [...state.orders, action.order] } : state;
    case "order/status-changed": {
      const order = state.orders.find((item) => item.id === action.orderId);
      if (!order || !ORDER_STATUSES.includes(action.status) || !isoTime(action.occurredAt)) return state;
      if (!canTransition(order.status, action.status)) return state;
      return { ...state, orders: updateById(state.orders, action.orderId, (item) => addTimeline(item, action.status, action.occurredAt)) };
    }
    case "order/provider-assigned": {
      const order = state.orders.find((item) => item.id === action.orderId);
      const provider = state.providers.find((item) => item.id === action.providerId);
      if (!order || !provider?.serviceIds.includes(order.serviceId) || !isoTime(action.occurredAt)) return state;
      if (!canTransition(order.status, "assigned")) return state;
      return { ...state, orders: updateById(state.orders, action.orderId, (item) => ({ ...addTimeline(item, "assigned", action.occurredAt), providerId: action.providerId })) };
    }
    case "order/rated": {
      const order = state.orders.find((item) => item.id === action.orderId);
      if (!order || order.status !== "completed") return state;
      if (!Number.isInteger(action.rating) || action.rating < 1 || action.rating > 5) return state;
      return { ...state, orders: updateById(state.orders, action.orderId, (item) => ({ ...item, rating: action.rating })) };
    }
    case "service/availability-changed": return hasId(state.serviceOfferings, action.serviceId) ? { ...state, serviceOfferings: updateById(state.serviceOfferings, action.serviceId, (service) => ({ ...service, active: action.active })) } : state;
    case "service/updated": {
      if (!hasId(state.serviceOfferings, action.serviceId)) return state;
      if (Object.values(action.patch).some((value) => value !== undefined && !positive(value))) return state;
      return { ...state, serviceOfferings: updateById(state.serviceOfferings, action.serviceId, (service) => ({ ...service, ...action.patch })) };
    }
    case "quote/provided": {
      const order = state.orders.find((item) => item.id === action.orderId);
      if (!order || order.status !== "awaiting-quote" || !positive(action.amount) || !isoTime(action.occurredAt)) return state;
      return { ...state, orders: updateById(state.orders, action.orderId, (item) => ({ ...addTimeline(item, "quote-ready", action.occurredAt), quoteAmount: action.amount })) };
    }
    case "quote/approved": {
      const order = state.orders.find((item) => item.id === action.orderId);
      if (!order || order.status !== "quote-ready" || !positive(action.amount) || !isoTime(action.occurredAt)) return state;
      if (order.quoteAmount !== undefined && order.quoteAmount !== action.amount) return state;
      return { ...state, orders: updateById(state.orders, action.orderId, (item) => ({ ...addTimeline(item, "scheduled", action.occurredAt), quoteAmount: action.amount, amount: action.amount })) };
    }
    case "quote/rejected": {
      const order = state.orders.find((item) => item.id === action.orderId);
      if (!order || !canTransition(order.status, "cancelled") || !isoTime(action.occurredAt)) return state;
      if (order.status !== "awaiting-quote" && order.status !== "quote-ready") return state;
      return { ...state, orders: updateById(state.orders, action.orderId, (item) => ({ ...addTimeline(item, "cancelled", action.occurredAt), paymentStatus: "cancelled" })) };
    }
    case "member-offer/upserted": {
      const offer = action.offer;
      if (!hasId(state.serviceOfferings, offer.serviceId) || !hasId(state.providers, offer.providerId)) return state;
      if (!positive(offer.regularPrice) || !positive(offer.memberPrice) || offer.memberPrice >= offer.regularPrice) return state;
      if (!isoTime(offer.validUntil)) return state;
      return { ...state, memberOffers: upsert(state.memberOffers, offer) };
    }
    case "member-offer/disabled": return hasId(state.memberOffers, action.offerId) ? { ...state, memberOffers: updateById(state.memberOffers, action.offerId, (offer) => ({ ...offer, active: false })) } : state;
    case "membership/upgraded": {
      const resident = state.residents.find((item) => item.id === action.residentId);
      if (!resident || resident.subscriber) return state;
      return { ...state, residents: updateById(state.residents, action.residentId, (item) => ({ ...item, subscriber: true })) };
    }
    case "recurring-plan/upserted": {
      if (!acceptablePlan(state, action.plan)) return state;
      return { ...state, recurringPlans: upsert(state.recurringPlans, action.plan) };
    }
    case "recurring/started": {
      const { plan, order } = action;
      if (!acceptablePlan(state, plan) || hasId(state.recurringPlans, plan.id)) return state;
      if (order.planId !== plan.id || order.serviceId !== plan.serviceId || order.residentId !== plan.residentId) return state;
      if (order.fulfillment !== "recurring" || order.scheduledAt !== plan.nextDate) return state;
      if (!acceptableNewOrder(state, order)) return state;
      return { ...state, recurringPlans: [...state.recurringPlans, plan], orders: [...state.orders, order] };
    }
    case "recurring-plan/toggled": return hasId(state.recurringPlans, action.planId) ? { ...state, recurringPlans: updateById(state.recurringPlans, action.planId, (plan) => plan.active === action.active ? plan : { ...plan, active: action.active }) } : state;
    case "recurring-plan/next-skipped": {
      const plan = state.recurringPlans.find((item) => item.id === action.planId);
      if (!plan || !isoTime(action.date) || plan.skippedDates.includes(action.date)) return state;
      return { ...state, recurringPlans: updateById(state.recurringPlans, action.planId, (item) => ({ ...item, skippedDates: [...item.skippedDates, action.date] })) };
    }
    case "neighbor-deal/joined": {
      const deal = state.neighborDeals.find((item) => item.id === action.dealId);
      if (!deal || !residentAt(state, action.residentId, deal.buildingId)) return state;
      if (!before(state.now, deal.closesAt) || deal.participantIds.includes(action.residentId)) return state;
      return { ...state, neighborDeals: updateById(state.neighborDeals, action.dealId, (item) => ({ ...item, participantIds: [...item.participantIds, action.residentId] })) };
    }
    case "neighbor-gift/sent": {
      const gift = action.gift;
      const service = state.serviceOfferings.find((item) => item.id === gift.serviceId);
      if (!service?.active || !hasId(state.residents, gift.senderId) || hasId(state.gifts, gift.id)) return state;
      if (!hasId(state.neighborRelationships, gift.recipientRelationshipId) || gift.status !== "sent") return state;
      return { ...state, gifts: [...state.gifts, gift] };
    }
    case "building/updated": return hasId(state.buildings, action.buildingId) ? { ...state, buildings: updateById(state.buildings, action.buildingId, (building) => ({ ...building, ...action.patch })) } : state;
    case "unit/updated": return hasId(state.units, action.unitId) ? { ...state, units: updateById(state.units, action.unitId, (unit) => ({ ...unit, ...action.patch })) } : state;
    case "resident/updated": return hasId(state.residents, action.residentId) ? { ...state, residents: updateById(state.residents, action.residentId, (resident) => ({ ...resident, ...action.patch })) } : state;
    case "announcement/published": return hasId(state.buildings, action.announcement.buildingId) && !hasId(state.announcements, action.announcement.id) ? { ...state, announcements: [...state.announcements, action.announcement] } : state;
    case "poll/created": return hasId(state.buildings, action.poll.buildingId) && action.poll.options.every((option) => option.voterIds.every((residentId) => residentAt(state, residentId, action.poll.buildingId))) && !hasId(state.polls, action.poll.id) ? { ...state, polls: [...state.polls, action.poll] } : state;
    case "visitor-pass/created": {
      const pass = action.pass;
      if (!residentAt(state, pass.residentId, pass.buildingId, pass.unitId) || hasId(state.visitorPasses, pass.id)) return state;
      if (pass.status !== "active" || !filled(pass.guestName) || !isoTime(pass.expiresAt) || !before(state.now, pass.expiresAt)) return state;
      return { ...state, visitorPasses: [...state.visitorPasses, pass] };
    }
    case "amenity-booking/created": {
      const booking = action.booking;
      if (!residentAt(state, booking.residentId, booking.buildingId) || hasId(state.amenityBookings, booking.id)) return state;
      if (booking.status !== "upcoming" || !isoTime(booking.startsAt) || !before(state.now, booking.startsAt)) return state;
      const amenity = amenityFor(state, booking.amenityId, booking.buildingId);
      if (!amenity || !amenity.slots.includes(booking.startsAt)) return state;
      const taken = state.amenityBookings.filter((item) => item.amenityId === booking.amenityId && item.startsAt === booking.startsAt && item.status !== "cancelled");
      if (taken.length >= amenity.capacity || taken.some((item) => item.residentId === booking.residentId)) return state;
      return { ...state, amenityBookings: [...state.amenityBookings, booking] };
    }
    case "poll/voted": {
      const poll = state.polls.find((item) => item.id === action.pollId);
      if (!poll || !poll.options.some((option) => option.id === action.optionId) || !residentAt(state, action.residentId, poll.buildingId)) return state;
      if (!before(state.now, poll.closesAt)) return state;
      if (poll.options.some((option) => option.id === action.optionId && option.voterIds.includes(action.residentId))) return state;
      return { ...state, polls: updateById(state.polls, action.pollId, (item) => ({ ...item, options: item.options.map((option) => ({ ...option, voterIds: option.id === action.optionId ? [...option.voterIds, action.residentId] : option.voterIds.filter((id) => id !== action.residentId) })) })) };
    }
    case "event/rsvp": {
      const event = state.events.find((item) => item.id === action.eventId);
      if (!event || !residentAt(state, action.residentId, event.buildingId) || !before(state.now, event.startsAt)) return state;
      const attending = event.attendeeIds.includes(action.residentId);
      if (action.attending === attending) return state;
      if (action.attending && event.attendeeIds.length >= event.capacity) return state;
      return { ...state, events: updateById(state.events, action.eventId, (item) => ({ ...item, attendeeIds: action.attending ? [...item.attendeeIds, action.residentId] : item.attendeeIds.filter((id) => id !== action.residentId) })) };
    }
    case "wallet/topped-up": {
      const transaction = action.transaction;
      if (hasId(state.walletTransactions, transaction.id) || !hasId(state.residents, transaction.residentId)) return state;
      if (transaction.kind !== "top-up" || !positive(transaction.amount) || transaction.amount < 10) return state;
      if (!isoTime(transaction.occurredAt) || !filled(transaction.reference)) return state;
      return {
        ...state,
        walletTransactions: [...state.walletTransactions, transaction],
        auditLog: [...state.auditLog, {
          id: `audit-${transaction.id}`,
          actorId: transaction.residentId,
          action: "wallet/topped-up",
          entityType: "wallet-transaction",
          entityId: transaction.id,
          description: { ar: "شحن تجريبي للمحفظة — لم يتم الخصم", en: "Demo wallet top-up — no money was charged" },
          occurredAt: transaction.occurredAt,
        }],
      };
    }
    case "chat/message-sent": {
      const conversation = state.conversations.find((item) => item.id === action.conversationId);
      if (!conversation || conversation.status !== "active") return state;
      const { message, reply } = action;
      if (message.author !== "resident" || !filled(message.body) || !isoTime(message.sentAt)) return state;
      if (conversation.messages.some((item) => item.id === message.id)) return state;
      if (reply && (reply.author !== "provider" || !filled(reply.body) || !isoTime(reply.sentAt) || reply.id === message.id || conversation.messages.some((item) => item.id === reply.id))) return state;
      return {
        ...state,
        conversations: updateById(state.conversations, conversation.id, (item) => ({
          ...item,
          messages: reply ? [...item.messages, message, reply] : [...item.messages, message],
          unreadCount: reply ? item.unreadCount + 1 : item.unreadCount,
        })),
      };
    }
    case "chat/read": {
      const conversation = state.conversations.find((item) => item.id === action.conversationId);
      if (!conversation || conversation.unreadCount === 0) return state;
      return { ...state, conversations: updateById(state.conversations, conversation.id, (item) => ({ ...item, unreadCount: 0 })) };
    }
    case "notifications/read": {
      if (!isoTime(action.readAt) || action.readAt === state.notificationsReadAt) return state;
      return { ...state, notificationsReadAt: action.readAt };
    }
    case "contact-message/read": {
      const message = state.contactMessages.find((item) => item.id === action.messageId);
      if (!message || message.read) return state;
      return { ...state, contactMessages: updateById(state.contactMessages, action.messageId, (item) => ({ ...item, read: true })) };
    }
    case "building/created": {
      const building = action.building;
      if (!filled(building.id) || hasId(state.buildings, building.id)) return state;
      if (!filled(building.name?.ar) || !filled(building.name?.en)) return state;
      if (!filled(building.address?.ar) || !filled(building.address?.en)) return state;
      if (!filled(building.manager?.ar) || !filled(building.manager?.en)) return state;
      if (!Array.isArray(building.imageIds) || building.imageIds.length === 0 || !building.imageIds.every(filled)) return state;
      if (!Array.isArray(building.amenityIds)) return state;
      return {
        ...state,
        buildings: [...state.buildings, building],
        auditLog: [...state.auditLog, {
          id: `audit-${building.id}`,
          actorId: state.currentResidentId,
          action: "building/created",
          entityType: "building",
          entityId: building.id,
          description: { ar: "تم إنشاء مبنى تجريبي جديد", en: "New demo building created" },
          occurredAt: state.now,
        }],
      };
    }
    // Reset restores the seed fixtures but keeps the person's language choice.
    case "demo/reset": return { ...createSeedState(), locale: state.locale };
  }
}
