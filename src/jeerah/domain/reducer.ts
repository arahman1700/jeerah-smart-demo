import { createSeedState } from "./fixtures";
import type { Activity, AuditEntry, DemoAction, DemoState, Invoice, InvoiceStatus, OrderStatus, Payment, ServiceOrder } from "./models";
import { PAYMENT_METHODS, PAYMENT_METHOD_MASK, PAYMENT_STATUSES } from "./models";
import { applyScenario } from "../data/scenarios";

const note = (status: OrderStatus) => ({ ar: `تم تحديث الطلب إلى ${status}`, en: `Order updated to ${status}` });
const hasId = <T extends { id: string }>(items: T[], id: string) => items.some((item) => item.id === id);
const updateById = <T extends { id: string }>(items: T[], id: string, update: (item: T) => T): T[] => items.map((item) => item.id === id ? update(item) : item);
const upsert = <T extends { id: string }>(items: T[], item: T): T[] => hasId(items, item.id) ? updateById(items, item.id, () => item) : [...items, item];
const addTimeline = (order: ServiceOrder, status: OrderStatus, occurredAt: string): ServiceOrder => ({ ...order, status, timeline: [...order.timeline, { id: `${order.id}-${status}-${occurredAt}`, status, occurredAt, note: note(status) }] });

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
const filled = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

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

export function reduceDemoState(state: DemoState, action: DemoAction): DemoState {
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
    case "order/created": {
      const service = state.serviceOfferings.find((item) => item.id === action.order.serviceId);
      const providerIsValid = !action.order.providerId || service?.providerIds.includes(action.order.providerId);
      return service && providerIsValid && residentAt(state, action.order.residentId, action.order.buildingId, action.order.unitId) && !hasId(state.orders, action.order.id) ? { ...state, orders: [...state.orders, action.order] } : state;
    }
    case "order/status-changed": return hasId(state.orders, action.orderId) ? { ...state, orders: updateById(state.orders, action.orderId, (order) => addTimeline(order, action.status, action.occurredAt)) } : state;
    case "order/provider-assigned": {
      const order = state.orders.find((item) => item.id === action.orderId);
      const provider = state.providers.find((item) => item.id === action.providerId);
      return order && provider?.serviceIds.includes(order.serviceId) ? { ...state, orders: updateById(state.orders, action.orderId, (item) => ({ ...addTimeline(item, "assigned", action.occurredAt), providerId: action.providerId })) } : state;
    }
    case "order/rated": return hasId(state.orders, action.orderId) && action.rating >= 1 && action.rating <= 5 ? { ...state, orders: updateById(state.orders, action.orderId, (order) => ({ ...order, rating: action.rating })) } : state;
    case "service/availability-changed": return hasId(state.serviceOfferings, action.serviceId) ? { ...state, serviceOfferings: updateById(state.serviceOfferings, action.serviceId, (service) => ({ ...service, active: action.active })) } : state;
    case "service/updated": return hasId(state.serviceOfferings, action.serviceId) ? { ...state, serviceOfferings: updateById(state.serviceOfferings, action.serviceId, (service) => ({ ...service, ...action.patch })) } : state;
    case "quote/approved": return hasId(state.orders, action.orderId) ? { ...state, orders: updateById(state.orders, action.orderId, (order) => ({ ...addTimeline(order, "scheduled", action.occurredAt), quoteAmount: action.amount, amount: action.amount })) } : state;
    case "quote/rejected": return hasId(state.orders, action.orderId) ? { ...state, orders: updateById(state.orders, action.orderId, (order) => ({ ...addTimeline(order, "cancelled", action.occurredAt), paymentStatus: "cancelled" })) } : state;
    case "member-offer/upserted": return hasId(state.serviceOfferings, action.offer.serviceId) ? { ...state, memberOffers: upsert(state.memberOffers, action.offer) } : state;
    case "member-offer/disabled": return hasId(state.memberOffers, action.offerId) ? { ...state, memberOffers: updateById(state.memberOffers, action.offerId, (offer) => ({ ...offer, active: false })) } : state;
    case "recurring-plan/upserted": return hasId(state.serviceOfferings, action.plan.serviceId) && hasId(state.residents, action.plan.residentId) ? { ...state, recurringPlans: upsert(state.recurringPlans, action.plan) } : state;
    case "recurring-plan/toggled": return hasId(state.recurringPlans, action.planId) ? { ...state, recurringPlans: updateById(state.recurringPlans, action.planId, (plan) => ({ ...plan, active: action.active })) } : state;
    case "recurring-plan/next-skipped": return hasId(state.recurringPlans, action.planId) ? { ...state, recurringPlans: updateById(state.recurringPlans, action.planId, (plan) => ({ ...plan, skippedDates: plan.skippedDates.includes(action.date) ? plan.skippedDates : [...plan.skippedDates, action.date] })) } : state;
    case "neighbor-deal/joined": {
      const deal = state.neighborDeals.find((item) => item.id === action.dealId);
      return deal && residentAt(state, action.residentId, deal.buildingId) ? { ...state, neighborDeals: updateById(state.neighborDeals, action.dealId, (item) => ({ ...item, participantIds: item.participantIds.includes(action.residentId) ? item.participantIds : [...item.participantIds, action.residentId] })) } : state;
    }
    case "neighbor-gift/sent": return hasId(state.serviceOfferings, action.gift.serviceId) && hasId(state.residents, action.gift.senderId) && hasId(state.neighborRelationships, action.gift.recipientRelationshipId) && !hasId(state.gifts, action.gift.id) ? { ...state, gifts: [...state.gifts, action.gift] } : state;
    case "building/updated": return hasId(state.buildings, action.buildingId) ? { ...state, buildings: updateById(state.buildings, action.buildingId, (building) => ({ ...building, ...action.patch })) } : state;
    case "unit/updated": return hasId(state.units, action.unitId) ? { ...state, units: updateById(state.units, action.unitId, (unit) => ({ ...unit, ...action.patch })) } : state;
    case "resident/updated": return hasId(state.residents, action.residentId) ? { ...state, residents: updateById(state.residents, action.residentId, (resident) => ({ ...resident, ...action.patch })) } : state;
    case "announcement/published": return hasId(state.buildings, action.announcement.buildingId) && !hasId(state.announcements, action.announcement.id) ? { ...state, announcements: [...state.announcements, action.announcement] } : state;
    case "poll/created": return hasId(state.buildings, action.poll.buildingId) && action.poll.options.every((option) => option.voterIds.every((residentId) => residentAt(state, residentId, action.poll.buildingId))) && !hasId(state.polls, action.poll.id) ? { ...state, polls: [...state.polls, action.poll] } : state;
    case "visitor-pass/created": return residentAt(state, action.pass.residentId, action.pass.buildingId, action.pass.unitId) && !hasId(state.visitorPasses, action.pass.id) ? { ...state, visitorPasses: [...state.visitorPasses, action.pass] } : state;
    case "amenity-booking/created": return residentAt(state, action.booking.residentId, action.booking.buildingId) && !hasId(state.amenityBookings, action.booking.id) ? { ...state, amenityBookings: [...state.amenityBookings, action.booking] } : state;
    case "poll/voted": {
      const poll = state.polls.find((item) => item.id === action.pollId);
      if (!poll || !poll.options.some((option) => option.id === action.optionId) || !residentAt(state, action.residentId, poll.buildingId)) return state;
      return { ...state, polls: updateById(state.polls, action.pollId, (item) => ({ ...item, options: item.options.map((option) => ({ ...option, voterIds: option.id === action.optionId ? option.voterIds.includes(action.residentId) ? option.voterIds : [...option.voterIds, action.residentId] : option.voterIds.filter((id) => id !== action.residentId) })) })) };
    }
    case "event/rsvp": {
      const event = state.events.find((item) => item.id === action.eventId);
      if (!event || !residentAt(state, action.residentId, event.buildingId)) return state;
      return { ...state, events: updateById(state.events, action.eventId, (item) => ({ ...item, attendeeIds: action.attending ? item.attendeeIds.includes(action.residentId) ? item.attendeeIds : [...item.attendeeIds, action.residentId] : item.attendeeIds.filter((id) => id !== action.residentId) })) };
    }
    case "demo/reset": return createSeedState();
  }
}
