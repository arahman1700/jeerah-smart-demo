import { describe, expect, it } from "vitest";
import { calculateCommunityPulse } from "../../src/jeerah/domain/communityPulse";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { formatDate, formatSar, normalizeSearchText } from "../../src/jeerah/domain/format";
import { REQUIRED_SERVICE_KEYS, type DemoAction } from "../../src/jeerah/domain/models";
import { reduceDemoState } from "../../src/jeerah/domain/reducer";
import { searchServiceCatalog } from "../../src/jeerah/domain/serviceCatalog";

const state = createSeedState(new Date("2026-08-03T12:00:00+03:00"));
const DATE = "2026-08-03T12:00:00+03:00";

describe("Jeerah demo domain", () => {
  it("ships complete deterministic demo coverage", () => {
    expect(state.buildings).toHaveLength(4);
    expect(state.units).toHaveLength(12);
    expect(state.invoices).toHaveLength(10);
    expect(state.payments).toHaveLength(12);
    expect(state.serviceFamilies).toHaveLength(8);
    expect(state.serviceOfferings).toHaveLength(35);
    expect(state.providers).toHaveLength(18);
    expect(state.orders).toHaveLength(18);
    expect(state.memberOffers).toHaveLength(8);
    expect(state.recurringPlans).toHaveLength(5);
    expect(state.neighborDeals).toHaveLength(3);
    expect(state.neighborRelationships).toHaveLength(3);
    expect(state.gifts).toHaveLength(2);
    expect(state.announcements).toHaveLength(6);
    expect(state.polls).toHaveLength(2);
    expect(state.events).toHaveLength(2);
    expect(state.visitorPasses).toHaveLength(5);
    expect(state.amenityBookings).toHaveLength(6);
    expect(state.activities).toHaveLength(12);
    expect(new Set(state.invoices.map((invoice) => invoice.status))).toEqual(
      new Set(["due", "paid", "overdue", "upcoming"]),
    );
    expect(new Set(state.payments.map((payment) => payment.status))).toEqual(
      new Set(["paid", "pending", "declined", "cancelled", "timed-out", "refunded"]),
    );
  });

  it("anchors the current resident, Unit 1204, Building 89, and elevator invoice", () => {
    const resident = state.residents.find((item) => item.id === "resident-saif");
    const unit = state.units.find((item) => item.id === resident?.unitId);
    const building = state.buildings.find((item) => item.id === unit?.buildingId);
    const invoice = state.invoices.find((item) => item.id === "invoice-elevator");

    expect(state.schemaVersion).toBe(2);
    expect(state.currentResidentId).toBe("resident-saif");
    expect(state.currentBuildingId).toBe("building-89");
    expect(resident).toMatchObject({
      unitId: "unit-89-1204",
      name: { ar: "سيف الدين", en: "Saifeldeen" },
    });
    expect(unit).toMatchObject({
      id: "unit-89-1204",
      buildingId: "building-89",
      label: { ar: "الوحدة ١٢٠٤", en: "Unit 1204" },
      floor: 12,
      status: "occupied",
      residentIds: ["resident-saif"],
    });
    expect(building?.id).toBe("building-89");
    expect(invoice).toMatchObject({
      buildingId: "building-89",
      unitId: "unit-89-1204",
      residentId: "resident-saif",
      subtotal: 700,
      tax: 0,
      total: 700,
      status: "due",
      dueDate: "2026-08-08T12:00:00+03:00",
    });
  });

  it("ships meaningful localized Building 89 activity in reverse chronological order", () => {
    const buildingActivity = state.activities.filter((activity) => activity.buildingId === "building-89");

    expect(buildingActivity).toEqual([
      {
        id: "activity-1",
        buildingId: "building-89",
        kind: "landscaping",
        title: { ar: "اكتملت أعمال تنسيق الحدائق", en: "Landscaping completed" },
        description: { ar: "أمر العمل #L-2458", en: "Work order #L-2458" },
        occurredAt: "2026-08-03T10:24:00+03:00",
      },
      {
        id: "activity-5",
        buildingId: "building-89",
        kind: "notice",
        title: { ar: "تنبيه مجتمعي", en: "Community notice" },
        description: { ar: "صيانة المياه في ٦ أغسطس", en: "Water maintenance on Aug 6" },
        occurredAt: "2026-08-02T18:30:00+03:00",
      },
      {
        id: "activity-9",
        buildingId: "building-89",
        kind: "inspection",
        title: { ar: "تمت جدولة فحص المصعد", en: "Elevator inspection scheduled" },
        description: { ar: "الفحص هذا المساء", en: "Inspection this evening" },
        occurredAt: "2026-08-01T16:00:00+03:00",
      },
    ]);
  });

  it("derives every Saif order and visitor pass location from Unit 1204", () => {
    const orders = state.orders.filter((order) => order.residentId === "resident-saif");
    const passes = state.visitorPasses.filter((pass) => pass.residentId === "resident-saif");

    expect(orders.length).toBeGreaterThan(0);
    expect(passes.length).toBeGreaterThan(0);
    expect(orders.every((order) => order.unitId === "unit-89-1204" && order.buildingId === "building-89")).toBe(true);
    expect(passes.every((pass) => pass.unitId === "unit-89-1204" && pass.buildingId === "building-89")).toBe(true);
  });

  it("includes every requested service key exactly once with one primary family", () => {
    expect(state.serviceOfferings.map((service) => service.key).sort()).toEqual([...REQUIRED_SERVICE_KEYS].sort());
    expect(new Set(state.serviceOfferings.map((service) => service.familyId)).size).toBe(8);
  });

  it("keeps every seeded relationship and current payment state internally consistent", () => {
    const buildingIds = new Set(state.buildings.map((item) => item.id));
    const units = new Map(state.units.map((item) => [item.id, item]));
    const residents = new Map(state.residents.map((item) => [item.id, item]));
    const invoices = new Map(state.invoices.map((item) => [item.id, item]));
    const services = new Map(state.serviceOfferings.map((item) => [item.id, item]));
    const providers = new Map(state.providers.map((item) => [item.id, item]));

    for (const unit of state.units) expect(buildingIds.has(unit.buildingId)).toBe(true);
    for (const resident of state.residents) expect(units.get(resident.unitId)?.residentIds).toContain(resident.id);
    for (const invoice of state.invoices) {
      expect(buildingIds.has(invoice.buildingId)).toBe(true);
      if (invoice.unitId) expect(units.get(invoice.unitId)?.buildingId).toBe(invoice.buildingId);
      if (invoice.residentId) {
        expect(residents.get(invoice.residentId)?.unitId).toBe(invoice.unitId);
        expect(units.get(residents.get(invoice.residentId)!.unitId)?.buildingId).toBe(invoice.buildingId);
      }
    }
    for (const payment of state.payments) {
      const invoice = invoices.get(payment.invoiceId);
      expect(invoice).toBeDefined();
      expect(payment.residentId).toBe(invoice?.residentId);
    }
    for (const invoice of state.invoices) {
      const hasSuccessfulPayment = state.payments.some((payment) => payment.invoiceId === invoice.id && payment.status === "paid");
      expect(invoice.status === "paid").toBe(hasSuccessfulPayment);
    }
    for (const order of state.orders) {
      const resident = residents.get(order.residentId);
      expect(resident).toBeDefined();
      expect(units.get(order.unitId!)?.buildingId).toBe(order.buildingId);
      if (order.unitId) expect(order.unitId).toBe(resident!.unitId);
      expect(units.get(resident!.unitId)?.buildingId).toBe(order.buildingId);
      expect(services.has(order.serviceId)).toBe(true);
      expect(providers.get(order.providerId!)?.serviceIds).toContain(order.serviceId);
      if (["awaiting-quote", "cancelled"].includes(order.status)) expect(order.paymentStatus).not.toBe("paid");
    }
    for (const pass of state.visitorPasses) {
      expect(units.get(pass.unitId)?.buildingId).toBe(pass.buildingId);
      expect(residents.get(pass.residentId)?.unitId).toBe(pass.unitId);
    }
    for (const booking of state.amenityBookings) expect(units.get(residents.get(booking.residentId)!.unitId)?.buildingId).toBe(booking.buildingId);
    for (const poll of state.polls) for (const option of poll.options) for (const voterId of option.voterIds) expect(units.get(residents.get(voterId)!.unitId)?.buildingId).toBe(poll.buildingId);
    for (const event of state.events) for (const attendeeId of event.attendeeIds) expect(units.get(residents.get(attendeeId)!.unitId)?.buildingId).toBe(event.buildingId);
    for (const provider of state.providers) for (const serviceId of provider.serviceIds) expect(services.get(serviceId)?.providerIds).toContain(provider.id);
    for (const offer of state.memberOffers) expect(services.has(offer.serviceId)).toBe(true);
    for (const plan of state.recurringPlans) {
      expect(services.has(plan.serviceId)).toBe(true);
      expect(residents.has(plan.residentId)).toBe(true);
    }
    for (const deal of state.neighborDeals) {
      expect(services.has(deal.serviceId)).toBe(true);
      expect(buildingIds.has(deal.buildingId)).toBe(true);
      for (const residentId of deal.participantIds) expect(units.get(residents.get(residentId)!.unitId)?.buildingId).toBe(deal.buildingId);
    }
    const relationships = new Set(state.neighborRelationships.map((item) => item.id));
    for (const gift of state.gifts) {
      expect(services.has(gift.serviceId)).toBe(true);
      expect(residents.has(gift.senderId)).toBe(true);
      expect(relationships.has(gift.recipientRelationshipId)).toBe(true);
    }
    for (const announcement of state.announcements) expect(buildingIds.has(announcement.buildingId)).toBe(true);
    for (const activity of state.activities) expect(buildingIds.has(activity.buildingId)).toBe(true);
  });

  it("uses quote-capable services and unpaid quote contracts for quote states", () => {
    const quoteCapableServiceIds = new Set(state.serviceOfferings.filter((service) => service.fulfillment.includes("quote")).map((service) => service.id));
    const awaitingQuote = state.orders.find((order) => order.status === "awaiting-quote")!;
    const quoteReady = state.orders.find((order) => order.status === "quote-ready")!;
    expect(quoteCapableServiceIds.has(awaitingQuote.serviceId)).toBe(true);
    expect(awaitingQuote.amount).toBeUndefined();
    expect(awaitingQuote.quoteAmount).toBeUndefined();
    expect(awaitingQuote.paymentStatus).not.toBe("paid");
    expect(quoteCapableServiceIds.has(quoteReady.serviceId)).toBe(true);
    expect(quoteReady.quoteAmount).toBeTypeOf("number");
    expect(quoteReady.amount).toBeUndefined();
    expect(quoteReady.paymentStatus).not.toBe("paid");
    expect(Object.fromEntries([...new Set(state.orders.map((order) => order.status))].map((status) => [status, state.orders.filter((order) => order.status === status).length]))).toEqual({
      completed: 3, cancelled: 1, scheduled: 2, confirmed: 2, assigned: 2, "en-route": 2, "in-progress": 2,
      "awaiting-resident-approval": 1, "awaiting-quote": 1, "quote-ready": 1, refunded: 1,
    });
    for (const pass of state.visitorPasses) expect(pass.guestName).not.toMatch(/^Guest \d+$/);
  });

  it("uses mutually exclusive pricing fields for every pricing model", () => {
    for (const service of state.serviceOfferings) {
      if (service.pricingModel === "fixed") {
        expect(service.price).toBeTypeOf("number");
        expect(service.startingPrice).toBeUndefined();
        expect(service.unitLabel).toBeUndefined();
      } else if (service.pricingModel === "starting-at") {
        expect(service.startingPrice).toBeTypeOf("number");
        expect(service.price).toBeUndefined();
        expect(service.unitLabel).toBeUndefined();
      } else if (service.pricingModel === "per-unit") {
        expect(service.price).toBeTypeOf("number");
        expect(service.unitLabel?.ar).toBeTruthy();
        expect(service.unitLabel?.en).toBeTruthy();
        expect(service.startingPrice).toBeUndefined();
      } else {
        expect(service.price).toBeUndefined();
        expect(service.startingPrice).toBeUndefined();
        expect(service.unitLabel).toBeUndefined();
      }
    }
  });

  it("normalizes Arabic search text while retaining localized service search", () => {
    expect(normalizeSearchText("إزالة التَّكْيِيفـة")).toBe("ازاله التكييفه");
    expect(searchServiceCatalog(state, "تكييف", {}).map((service) => service.key)).toContain("hvac-maintenance");
    expect(searchServiceCatalog(state, "car", { scope: "apartment" }).map((service) => service.key)).toContain("mobile-car-wash");
  });

  it("applies every supported service filter and their conjunction", () => {
    const ids = (items: typeof state.serviceOfferings) => items.map((service) => service.id).sort();
    const family = "home-maintenance" as const;
    const familyResults = searchServiceCatalog(state, "", { familyId: family });
    expect(familyResults).not.toHaveLength(0);
    expect(familyResults.every((service) => service.familyId === family)).toBe(true);
    expect(ids(familyResults)).not.toContain("service-pest-control");

    const fulfillmentResults = searchServiceCatalog(state, "", { fulfillment: "recurring" });
    expect(fulfillmentResults.every((service) => service.fulfillment.includes("recurring"))).toBe(true);
    expect(ids(fulfillmentResults)).toEqual(ids(state.serviceOfferings.filter((service) => service.fulfillment.includes("recurring"))));

    const scopeResults = searchServiceCatalog(state, "", { scope: "building" });
    expect(scopeResults.every((service) => service.scope === "building" || service.scope === "both")).toBe(true);
    expect(ids(scopeResults)).toEqual(ids(state.serviceOfferings.filter((service) => service.scope === "building" || service.scope === "both")));

    const providerId = "provider-1";
    const providerResults = searchServiceCatalog(state, "", { providerId });
    expect(providerResults.every((service) => service.providerIds.includes(providerId))).toBe(true);
    expect(ids(providerResults)).toEqual(ids(state.serviceOfferings.filter((service) => service.providerIds.includes(providerId))));

    const disabled = reduceDemoState(state, { type: "service/availability-changed", serviceId: "service-pest-control", active: false });
    expect(ids(searchServiceCatalog(disabled, "", { active: false }))).toEqual(["service-pest-control"]);
    expect(ids(searchServiceCatalog(disabled, "", { active: true }))).not.toContain("service-pest-control");

    expect(ids(searchServiceCatalog(state, "", { familyId: "care-cleaning", fulfillment: "recurring", scope: "apartment", providerId: "provider-16", active: true }))).toEqual(["service-home-cleaning"]);
  });

  it("formats values deterministically", () => {
    expect(formatSar(1250, "en")).toBe("SAR 1,250");
    expect(formatSar(1250, "ar")).toContain("١٬٢٥٠");
    expect(formatDate("2026-08-03T12:00:00+03:00", "en")).toBe("Aug 3, 2026");
  });

  it("calculates pulse from collection, maintenance, and alerts", () => {
    const pulse = calculateCommunityPulse(state, "building-89");
    expect(pulse).toEqual({
      score: 71,
      status: "attention",
      factors: [
        { key: "collection", score: 75 },
        { key: "maintenance", score: 60 },
        { key: "alerts", score: 80 },
      ],
    });
  });

  it("marks an invoice paid without mutating the original state", () => {
    const next = reduceDemoState(state, {
      type: "payment/recorded",
      payment: {
        id: "payment-test",
        invoiceId: "invoice-elevator",
        residentId: "resident-saif",
        method: "mada",
        status: "paid",
        amount: 700,
        occurredAt: "2026-08-03T12:00:00+03:00",
        reference: "DEMO-0001",
        last4: "4455",
      },
    });
    expect(next).not.toBe(state);
    expect(next.invoices.find((item) => item.id === "invoice-elevator")?.status).toBe("paid");
    expect(state.invoices.find((item) => item.id === "invoice-elevator")?.status).not.toBe("paid");
  });

  it.each(["refunded", "declined", "cancelled", "timed-out"] as const)("reconciles an invoice to due when its paid payment becomes %s", (status) => {
    const next = reduceDemoState(state, { type: "payment/status-changed", paymentId: "payment-2", status, occurredAt: "2026-08-03T12:10:00+03:00" });
    expect(next.payments.find((payment) => payment.id === "payment-2")?.status).toBe(status);
    expect(next.invoices.find((invoice) => invoice.id === "invoice-89-paid-1")?.status).toBe("due");
  });

  it("does not discard an existing vote when a poll or option ID is invalid", () => {
    const unknownPoll = reduceDemoState(state, { type: "poll/voted", pollId: "not-a-poll", optionId: "any", residentId: "resident-saif" });
    const unknownOption = reduceDemoState(state, { type: "poll/voted", pollId: "poll-1", optionId: "not-an-option", residentId: "resident-saif" });
    expect(unknownPoll).toBe(state);
    expect(unknownOption).toBe(state);
    expect(unknownOption.polls.find((poll) => poll.id === "poll-1")?.options[0].voterIds).toContain("resident-saif");
  });

  it.each([
    [{ type: "payment/status-changed", paymentId: "missing", status: "paid", occurredAt: DATE }, "payments"],
    [{ type: "order/status-changed", orderId: "missing", status: "completed", occurredAt: DATE }, "orders"],
    [{ type: "service/availability-changed", serviceId: "missing", active: false }, "serviceOfferings"],
    [{ type: "member-offer/disabled", offerId: "missing" }, "memberOffers"],
    [{ type: "recurring-plan/toggled", planId: "missing", active: false }, "recurringPlans"],
    [{ type: "neighbor-deal/joined", dealId: "missing", residentId: "resident-saif" }, "neighborDeals"],
    [{ type: "building/updated", buildingId: "missing", patch: {} }, "buildings"],
    [{ type: "unit/updated", unitId: "missing", patch: {} }, "units"],
    [{ type: "resident/updated", residentId: "missing", patch: {} }, "residents"],
    [{ type: "event/rsvp", eventId: "missing", residentId: "resident-saif", attending: true }, "events"],
  ] as const)("returns the original state for invalid %s targets", (action) => {
    expect(reduceDemoState(state, action)).toBe(state);
  });

  it.each([
    { name: "sets locale", action: { type: "locale/set", locale: "en" }, verify: (next: typeof state) => expect(next.locale).toBe("en") },
    { name: "creates invoices", action: { type: "invoice/created", invoice: { ...state.invoices[0], id: "invoice-created" } }, verify: (next: typeof state) => expect(next.invoices).toHaveLength(11) },
    { name: "records payments", action: { type: "payment/recorded", payment: { ...state.payments[0], id: "payment-created", status: "paid" } }, verify: (next: typeof state) => expect(next.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("paid") },
    { name: "changes payment statuses", action: { type: "payment/status-changed", paymentId: "payment-1", status: "paid", occurredAt: DATE }, verify: (next: typeof state) => expect(next.payments.find((payment) => payment.id === "payment-1")?.status).toBe("paid") },
    { name: "creates orders", action: { type: "order/created", order: { ...state.orders[0], id: "order-created" } }, verify: (next: typeof state) => expect(next.orders).toHaveLength(19) },
    { name: "changes order statuses", action: { type: "order/status-changed", orderId: "order-1", status: "completed", occurredAt: DATE }, verify: (next: typeof state) => expect(next.orders.find((order) => order.id === "order-1")?.timeline).toHaveLength(2) },
    { name: "assigns order providers", action: { type: "order/provider-assigned", orderId: "order-1", providerId: "provider-1", occurredAt: DATE }, verify: (next: typeof state) => expect(next.orders.find((order) => order.id === "order-1")?.status).toBe("assigned") },
    { name: "rates orders", action: { type: "order/rated", orderId: "order-1", rating: 5, occurredAt: DATE }, verify: (next: typeof state) => expect(next.orders.find((order) => order.id === "order-1")?.rating).toBe(5) },
    { name: "changes service availability", action: { type: "service/availability-changed", serviceId: state.serviceOfferings[0].id, active: false }, verify: (next: typeof state) => expect(next.serviceOfferings[0].active).toBe(false) },
    { name: "updates service metadata", action: { type: "service/updated", serviceId: state.serviceOfferings[0].id, patch: { etaMinutes: 99 } }, verify: (next: typeof state) => expect(next.serviceOfferings[0].etaMinutes).toBe(99) },
    { name: "approves quotes", action: { type: "quote/approved", orderId: "order-9", amount: 450, occurredAt: DATE }, verify: (next: typeof state) => expect(next.orders.find((order) => order.id === "order-9")?.amount).toBe(450) },
    { name: "rejects quotes", action: { type: "quote/rejected", orderId: "order-10", occurredAt: DATE }, verify: (next: typeof state) => expect(next.orders.find((order) => order.id === "order-10")?.paymentStatus).toBe("cancelled") },
    { name: "upserts member offers", action: { type: "member-offer/upserted", offer: { ...state.memberOffers[0], id: "offer-created" } }, verify: (next: typeof state) => expect(next.memberOffers).toHaveLength(9) },
    { name: "disables member offers", action: { type: "member-offer/disabled", offerId: "member-offer-1" }, verify: (next: typeof state) => expect(next.memberOffers[0].active).toBe(false) },
    { name: "upserts recurring plans", action: { type: "recurring-plan/upserted", plan: { ...state.recurringPlans[0], id: "plan-created" } }, verify: (next: typeof state) => expect(next.recurringPlans).toHaveLength(6) },
    { name: "toggles recurring plans", action: { type: "recurring-plan/toggled", planId: "plan-1", active: false }, verify: (next: typeof state) => expect(next.recurringPlans[0].active).toBe(false) },
    { name: "skips recurring dates", action: { type: "recurring-plan/next-skipped", planId: "plan-1", date: DATE }, verify: (next: typeof state) => expect(next.recurringPlans[0].skippedDates).toContain(DATE) },
    { name: "joins neighbor deals", action: { type: "neighbor-deal/joined", dealId: "deal-1", residentId: "resident-lina" }, verify: (next: typeof state) => expect(next.neighborDeals[0].participantIds).toContain("resident-lina") },
    { name: "sends neighbor gifts", action: { type: "neighbor-gift/sent", gift: { ...state.gifts[0], id: "gift-created" } }, verify: (next: typeof state) => expect(next.gifts).toHaveLength(3) },
    { name: "updates buildings", action: { type: "building/updated", buildingId: "building-89", patch: { manager: { ar: "مدير", en: "Manager" } } }, verify: (next: typeof state) => expect(next.buildings[0].manager.en).toBe("Manager") },
    { name: "updates units", action: { type: "unit/updated", unitId: "unit-89-1204", patch: { status: "maintenance" } }, verify: (next: typeof state) => expect(next.units[0].status).toBe("maintenance") },
    { name: "updates residents", action: { type: "resident/updated", residentId: "resident-saif", patch: { role: "tenant" } }, verify: (next: typeof state) => expect(next.residents[0].role).toBe("tenant") },
    { name: "publishes announcements", action: { type: "announcement/published", announcement: { ...state.announcements[0], id: "announcement-created" } }, verify: (next: typeof state) => expect(next.announcements).toHaveLength(7) },
    { name: "creates polls", action: { type: "poll/created", poll: { ...state.polls[0], id: "poll-created" } }, verify: (next: typeof state) => expect(next.polls).toHaveLength(3) },
    { name: "creates visitor passes", action: { type: "visitor-pass/created", pass: { ...state.visitorPasses[0], id: "pass-created" } }, verify: (next: typeof state) => expect(next.visitorPasses).toHaveLength(6) },
    { name: "creates amenity bookings", action: { type: "amenity-booking/created", booking: { ...state.amenityBookings[0], id: "booking-created" } }, verify: (next: typeof state) => expect(next.amenityBookings).toHaveLength(7) },
    { name: "moves poll votes", action: { type: "poll/voted", pollId: "poll-1", optionId: "poll-1-evening", residentId: "resident-saif" }, verify: (next: typeof state) => expect(next.polls[0].options[1].voterIds).toContain("resident-saif") },
    { name: "records event RSVPs", action: { type: "event/rsvp", eventId: "event-1", residentId: "resident-saif", attending: false }, verify: (next: typeof state) => expect(next.events[0].attendeeIds).not.toContain("resident-saif") },
    { name: "resets demo state", action: { type: "demo/reset" }, verify: (next: typeof state) => {
      expect(next).not.toBe(state);
      expect(next.schemaVersion).toBe(2);
      expect(next.residents.find((resident) => resident.id === "resident-saif")?.unitId).toBe("unit-89-1204");
    } },
  ] as Array<{ name: string; action: DemoAction; verify: (next: typeof state) => void }>)("$name", ({ action, verify }) => {
    verify(reduceDemoState(state, action));
  });

  it("composes scenario selection without mutating the input", () => {
    const next = reduceDemoState(state, { type: "scenario/set", scenario: "offline" });
    expect(next).not.toBe(state);
    expect(next.scenario).toBe("offline");
    expect(next.auditLog).toHaveLength(1);
  });
});
