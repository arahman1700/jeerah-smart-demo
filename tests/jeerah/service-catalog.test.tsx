import { describe, expect, it } from "vitest";
import assetManifest from "../../src/jeerah/assets/asset-manifest.json";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { normalizeSearchText } from "../../src/jeerah/domain/format";
import {
  INITIAL_ORDER_STATUS, ORDER_STATUSES, ORDER_TRANSITIONS, REQUIRED_SERVICE_KEYS, SERVICE_FULFILLMENTS,
  type DemoState, type ServiceOrder,
} from "../../src/jeerah/domain/models";
import { reduceDemoState } from "../../src/jeerah/domain/reducer";
import {
  dealIsOrderable, dealParticipantCount, dealUnitPrice, offerSavings, resolveServiceExperience,
  searchServiceCatalog,
} from "../../src/jeerah/domain/serviceCatalog";
import { residentOrders, residentPlans } from "../../src/jeerah/domain/residentView";
import { serviceFamilyIconMap, serviceIconMap } from "../../src/jeerah/design/serviceIconMap";

const state = createSeedState();
const NOW = state.now;
const assetById = new Map(assetManifest.map((entry) => [entry.id, entry]));

function order(overrides: Partial<ServiceOrder> = {}): ServiceOrder {
  const base: ServiceOrder = {
    id: "order-new",
    serviceId: "service-hvac-maintenance",
    providerId: "provider-coolair",
    buildingId: "building-89",
    unitId: "unit-89-1204",
    residentId: "resident-saif",
    fulfillment: "on-demand",
    status: "confirmed",
    paymentStatus: "paid",
    amount: 180,
    quantity: 1,
    etaMinutes: 45,
    timeline: [{ id: "order-new-confirmed", status: "confirmed", occurredAt: NOW, note: { ar: "تأكيد", en: "Confirmed" } }],
    createdAt: NOW,
  };
  const merged = { ...base, ...overrides };
  if (overrides.status && !overrides.timeline) {
    merged.timeline = [{ id: `order-new-${overrides.status}`, status: overrides.status, occurredAt: NOW, note: { ar: "تحديث", en: "Update" } }];
  }
  return merged;
}

const rejects = (next: DemoState) => expect(next).toBe(state);

describe("service catalog integrity", () => {
  it("resolves all 35 offerings to a family, provider, image, price and next action", () => {
    expect(state.serviceOfferings).toHaveLength(35);
    expect(state.serviceOfferings.map((service) => service.key).sort()).toEqual([...REQUIRED_SERVICE_KEYS].sort());

    for (const service of state.serviceOfferings) {
      const experience = resolveServiceExperience(state, service.id);
      expect(experience, service.key).toBeDefined();
      const resolved = experience!;

      expect(resolved.family.id, service.key).toBe(service.familyId);
      expect(resolved.providers.length, service.key).toBeGreaterThan(0);
      expect(resolved.fulfillment.length, service.key).toBeGreaterThan(0);
      expect(resolved.nextAction, service.key).toEqual({ kind: "book", fulfillment: resolved.fulfillment[0] });

      // The provider relation is inverse-consistent in both directions.
      for (const provider of resolved.providers) expect(provider.serviceIds, service.key).toContain(service.id);

      // Localized copy, curated aliases, a glyph, and one real service photograph.
      for (const value of [service.name.ar, service.name.en]) expect(value.trim().length, service.key).toBeGreaterThan(5);
      for (const value of [service.description.ar, service.description.en, service.requirements.ar, service.requirements.en]) {
        expect(value.trim().length, service.key).toBeGreaterThan(30);
      }
      expect(service.searchAliases.length, service.key).toBeGreaterThanOrEqual(6);
      expect(serviceIconMap[service.key], service.key).toBeDefined();
      expect(assetById.get(service.imageId)?.category, service.key).toBe("service");

      // Pricing semantics stay mutually exclusive and complete.
      if (service.pricingModel === "quote-required") {
        expect(resolved.price.range?.min, service.key).toBeGreaterThan(0);
        expect(resolved.price.range!.max, service.key).toBeGreaterThan(resolved.price.range!.min);
        expect(service.fulfillment.filter((mode) => mode !== "group"), service.key).toEqual(["quote"]);
      } else {
        expect(resolved.price.amount, service.key).toBeGreaterThan(0);
      }
      if (service.fulfillment.includes("on-demand")) expect(service.etaMinutes, service.key).toBeGreaterThan(0);
      if (service.fulfillment.includes("group")) expect(resolved.deal, service.key).toBeDefined();
    }
  });

  it("gives every family a distinct curated glyph and at least one offering", () => {
    const glyphs = Object.values(serviceFamilyIconMap);
    expect(new Set(glyphs).size).toBe(8);
    for (const family of state.serviceFamilies) {
      expect(serviceFamilyIconMap[family.id]).toBeDefined();
      expect(state.serviceOfferings.filter((service) => service.familyId === family.id).length, family.id).toBeGreaterThan(0);
    }
  });

  it("ships all five fulfillment modes, two HVAC providers, and the 4/8/12 HVAC deal", () => {
    for (const mode of SERVICE_FULFILLMENTS) {
      expect(state.serviceOfferings.filter((service) => service.fulfillment.includes(mode)).length, mode).toBeGreaterThan(0);
    }

    const hvac = resolveServiceExperience(state, "service-hvac-maintenance")!;
    expect(hvac.providers.length).toBeGreaterThanOrEqual(2);
    expect(hvac.providers.map((provider) => provider.name.en)).toContain("Coolair Climate Care");

    const deal = hvac.deal!;
    expect(deal.serviceId).toBe("service-hvac-maintenance");
    expect(deal.thresholds.map((tier) => tier.count)).toEqual([4, 8, 12]);
    expect(dealParticipantCount(deal)).toBe(3);
    expect(dealUnitPrice(deal)).toBe(deal.basePrice);
    expect(dealIsOrderable(deal)).toBe(false);

    const joined = reduceDemoState(state, { type: "neighbor-deal/joined", dealId: deal.id, residentId: "resident-saif" });
    const opened = joined.neighborDeals.find((item) => item.id === deal.id)!;
    expect(dealParticipantCount(opened)).toBe(4);
    expect(dealUnitPrice(opened)).toBe(150);
    expect(dealIsOrderable(opened)).toBe(true);
  });

  it("keeps every group deal, offer and plan honest", () => {
    expect(state.neighborDeals).toHaveLength(3);
    for (const deal of state.neighborDeals) {
      expect(deal.buildingId).toBe("building-89");
      expect(deal.basePrice).toBeGreaterThan(deal.thresholds[0].unitPrice);
      const counts = deal.thresholds.map((tier) => tier.count);
      expect([...counts].sort((left, right) => left - right)).toEqual(counts);
      const prices = deal.thresholds.map((tier) => tier.unitPrice);
      expect([...prices].sort((left, right) => right - left)).toEqual(prices);
    }
    expect(state.neighborDeals.filter((deal) => dealIsOrderable(deal)).map((deal) => deal.id)).toEqual(["deal-facade"]);

    expect(state.memberOffers).toHaveLength(8);
    for (const offer of state.memberOffers) {
      expect(offer.memberPrice).toBeLessThan(offer.regularPrice);
      expect(offerSavings(offer).amount).toBe(offer.regularPrice - offer.memberPrice);
      expect(offer.terms.ar.length).toBeGreaterThan(10);
      expect(offer.terms.en.length).toBeGreaterThan(10);
      expect(Number.isFinite(Date.parse(offer.validUntil))).toBe(true);
      expect(state.providers.some((provider) => provider.id === offer.providerId)).toBe(true);
    }
    expect(offerSavings(state.memberOffers[0])).toEqual({ amount: 45, percent: 25 });
  });

  it("exposes only the signed-in resident's plans, orders and gifts", () => {
    expect(residentPlans(state)).toHaveLength(5);
    expect(state.recurringPlans.every((plan) => plan.residentId === "resident-saif")).toBe(true);
    expect(residentOrders(state).map((item) => item.id)).toEqual(["order-1", "order-4", "order-13"]);
    expect(state.gifts.filter((gift) => gift.senderId === "resident-saif")).toHaveLength(1);
    for (const plan of state.recurringPlans) {
      const service = state.serviceOfferings.find((item) => item.id === plan.serviceId)!;
      expect(service.fulfillment, plan.id).toContain("recurring");
      expect(service.providerIds, plan.id).toContain(plan.providerId);
    }
  });

  it("gives Building 89 exactly two announcements, two polls, one event and three deals", () => {
    const inBuilding = <T extends { buildingId: string }>(items: T[]) => items.filter((item) => item.buildingId === "building-89");
    expect(inBuilding(state.announcements)).toHaveLength(2);
    expect(inBuilding(state.polls)).toHaveLength(2);
    expect(inBuilding(state.events)).toHaveLength(1);
    expect(inBuilding(state.neighborDeals)).toHaveLength(3);
    expect(inBuilding(state.activities)).toHaveLength(3);
    expect(inBuilding(state.polls)[1].options.map((option) => option.label.en)).toEqual(["6 PM", "7 PM", "8 PM"]);
  });

  it("models a bookable amenity catalog for every building", () => {
    expect(state.amenities.filter((amenity) => amenity.buildingId === "building-89")).toHaveLength(4);
    for (const amenity of state.amenities) {
      expect(amenity.slots.length).toBeGreaterThan(0);
      expect(amenity.capacity).toBeGreaterThan(0);
      expect(assetById.get(amenity.imageId)?.category).toBe("amenity");
    }
    for (const booking of state.amenityBookings) {
      const amenity = state.amenities.find((item) => item.id === booking.amenityId)!;
      expect(amenity, booking.id).toBeDefined();
      expect(amenity.slots, booking.id).toContain(booking.startsAt);
    }
    for (const building of state.buildings) {
      expect(building.amenityIds).toEqual(state.amenities.filter((amenity) => amenity.buildingId === building.id).map((amenity) => amenity.id));
    }
  });

  it("walks a legal status path on every seeded order timeline", () => {
    for (const item of state.orders) {
      expect(item.timeline.length, item.id).toBeGreaterThan(0);
      expect(item.timeline.at(-1)!.status, item.id).toBe(item.status);
      const [first, ...rest] = item.timeline;
      expect([INITIAL_ORDER_STATUS[item.fulfillment]], item.id).toContain(first.status);
      let previous = first;
      for (const event of rest) {
        expect(ORDER_TRANSITIONS[previous.status], `${item.id} ${previous.status}->${event.status}`).toContain(event.status);
        expect(Date.parse(event.occurredAt), item.id).toBeGreaterThan(Date.parse(previous.occurredAt));
        previous = event;
      }
    }
    expect(new Set(state.orders.map((item) => item.status))).toEqual(new Set(ORDER_STATUSES));
  });

  it("tells one complete maintenance story on the resident's completed order", () => {
    const completed = state.orders.find((item) => item.id === "order-1")!;
    expect(completed.timeline.map((event) => event.status)).toEqual([
      "confirmed", "assigned", "en-route", "in-progress", "awaiting-resident-approval", "completed",
    ]);
    expect(completed.technician?.displayName.en).toBeTruthy();
    expect(completed.technician?.badgeId).toMatch(/^DEMO-/);
    expect(completed.checklist).toHaveLength(5);
    expect(completed.checklist!.every((check) => check.done)).toBe(true);
    expect(assetById.has(completed.beforeImageId!)).toBe(true);
    expect(assetById.has(completed.afterImageId!)).toBe(true);
    expect(completed.residentApprovedAt).toBeTruthy();
    expect(completed.warrantyDays).toBeGreaterThan(0);
    expect(completed.rating).toBeUndefined();
  });
});

describe("localized catalog search", () => {
  it("normalizes marks, tatweel, Persian letters, digits and punctuation", () => {
    expect(normalizeSearchText("إزالة التَّكْيِيفـة")).toBe("ازاله التكييفه");
    expect(normalizeSearchText("مُكيّف!!")).toBe("مكيف");
    expect(normalizeSearchText("کهربائی")).toBe("كهربايي");
    expect(normalizeSearchText("٠١٢۳۴")).toBe("01234");
    expect(normalizeSearchText("  Smart   Lock  ")).toBe("smart lock");
  });

  it.each([
    ["اقفال ذكيه", "smart-lock-installation"],
    ["قفل ذكي", "smart-lock-installation"],
    ["مكيف", "hvac-maintenance"],
    ["مكيفات", "hvac-maintenance"],
    ["تكييف", "hvac-maintenance"],
    ["كهربائي", "electrical-maintenance"],
    ["كهرباء", "electrical-maintenance"],
    ["سباك", "plumbing-maintenance"],
    ["سباكة", "plumbing-maintenance"],
    ["كفرات", "mobile-tire-change"],
    ["اطارات", "mobile-tire-change"],
    ["وايت", "tank-fill"],
    ["خزان", "tank-fill"],
    ["طفايات", "fire-safety"],
    ["سلامة", "fire-safety"],
    ["شتر", "shutter-installation"],
    ["ستائر", "shutter-installation"],
    ["مظلات", "awning-installation"],
    ["smart lock", "smart-lock-installation"],
    ["tire", "mobile-tire-change"],
  ])("finds %s through curated aliases", (query, key) => {
    expect(searchServiceCatalog(state, query).map((service) => service.key)).toContain(key);
  });

  it("filters by scope, mode, price model and availability together", () => {
    const recurring = searchServiceCatalog(state, "", { fulfillment: "recurring" });
    expect(recurring.every((service) => service.fulfillment.includes("recurring"))).toBe(true);
    expect(searchServiceCatalog(state, "", { pricingModel: "quote-required" }).every((service) => service.pricingModel === "quote-required")).toBe(true);

    const disabled = reduceDemoState(state, { type: "service/availability-changed", serviceId: "service-pest-control", active: false });
    expect(searchServiceCatalog(disabled, "", { active: true }).map((service) => service.key)).not.toContain("pest-control");
    expect(resolveServiceExperience(disabled, "service-pest-control")!.nextAction).toEqual({ kind: "unavailable" });
  });
});

describe("reducer hardening", () => {
  it("accepts a coherent on-demand order and rejects every incoherent variant", () => {
    expect(reduceDemoState(state, { type: "order/created", order: order() }).orders).toHaveLength(19);

    rejects(reduceDemoState(state, { type: "order/created", order: order({ status: "scheduled" }) }));
    rejects(reduceDemoState(state, { type: "order/created", order: order({ providerId: "provider-dar-market" }) }));
    rejects(reduceDemoState(state, { type: "order/created", order: order({ residentId: "resident-noura" }) }));
    rejects(reduceDemoState(state, { type: "order/created", order: order({ amount: 10 }) }));
    rejects(reduceDemoState(state, { type: "order/created", order: order({ etaMinutes: undefined }) }));
    rejects(reduceDemoState(state, { type: "order/created", order: order({ rating: 5 }) }));
    rejects(reduceDemoState(state, { type: "order/created", order: order({ timeline: [] }) }));
    rejects(reduceDemoState(state, { type: "order/created", order: order({ serviceId: "service-interior-design" }) }));
    rejects(reduceDemoState(state, { type: "order/created", order: order({ id: "order-1" }) }));

    const inactive = reduceDemoState(state, { type: "service/availability-changed", serviceId: "service-hvac-maintenance", active: false });
    expect(reduceDemoState(inactive, { type: "order/created", order: order() })).toBe(inactive);
  });

  it("requires the right shape for scheduled, recurring, quote and group orders", () => {
    const future = "2026-08-06T10:00:00+03:00";
    const scheduled = order({ fulfillment: "scheduled", status: "scheduled", scheduledAt: future, etaMinutes: undefined });
    expect(reduceDemoState(state, { type: "order/created", order: scheduled }).orders).toHaveLength(19);
    rejects(reduceDemoState(state, { type: "order/created", order: { ...scheduled, scheduledAt: "2026-07-01T10:00:00+03:00" } }));

    const quote = order({
      serviceId: "service-awning-installation", providerId: "provider-diwan-fitout", fulfillment: "quote",
      status: "awaiting-quote", amount: undefined, quantity: undefined, etaMinutes: undefined, paymentStatus: "pending",
    });
    expect(reduceDemoState(state, { type: "order/created", order: quote }).orders).toHaveLength(19);
    rejects(reduceDemoState(state, { type: "order/created", order: { ...quote, amount: 2400 } }));

    const groupOrder = order({
      serviceId: "service-hvac-maintenance", fulfillment: "group", status: "scheduled",
      scheduledAt: future, etaMinutes: undefined, amount: 150, dealId: "deal-hvac",
    });
    rejects(reduceDemoState(state, { type: "order/created", order: groupOrder }));
    const joined = reduceDemoState(state, { type: "neighbor-deal/joined", dealId: "deal-hvac", residentId: "resident-saif" });
    expect(reduceDemoState(joined, { type: "order/created", order: groupOrder }).orders).toHaveLength(19);
    expect(reduceDemoState(joined, { type: "order/created", order: { ...groupOrder, amount: 180 } })).toBe(joined);
  });

  it("commits a recurring plan and its first order atomically", () => {
    const nextDate = "2026-08-06T10:00:00+03:00";
    const plan = { id: "plan-new", serviceId: "service-home-cleaning", residentId: "resident-saif", providerId: "provider-lamsa-clean", cadence: "weekly" as const, nextDate, active: true, skippedDates: [] };
    const recurringOrder = order({
      id: "order-recurring", serviceId: "service-home-cleaning", providerId: "provider-lamsa-clean",
      fulfillment: "recurring", status: "scheduled", scheduledAt: nextDate, etaMinutes: undefined, amount: 220, planId: plan.id,
    });

    const next = reduceDemoState(state, { type: "recurring/started", plan, order: recurringOrder });
    expect(next.recurringPlans).toHaveLength(6);
    expect(next.orders).toHaveLength(19);

    // A broken order leaves the plan uncreated too.
    const broken = reduceDemoState(state, { type: "recurring/started", plan, order: { ...recurringOrder, amount: 1 } });
    expect(broken).toBe(state);
  });

  it("only walks legal order transitions and rates completed work", () => {
    rejects(reduceDemoState(state, { type: "order/status-changed", orderId: "order-1", status: "assigned", occurredAt: NOW }));
    rejects(reduceDemoState(state, { type: "order/status-changed", orderId: "order-4", status: "completed", occurredAt: NOW }));
    expect(reduceDemoState(state, { type: "order/status-changed", orderId: "order-4", status: "in-progress", occurredAt: NOW })
      .orders.find((item) => item.id === "order-4")?.timeline).toHaveLength(4);

    rejects(reduceDemoState(state, { type: "order/rated", orderId: "order-4", rating: 5, occurredAt: NOW }));
    rejects(reduceDemoState(state, { type: "order/rated", orderId: "order-1", rating: 6, occurredAt: NOW }));
    rejects(reduceDemoState(state, { type: "order/rated", orderId: "order-1", rating: 4.5, occurredAt: NOW }));
    expect(reduceDemoState(state, { type: "order/rated", orderId: "order-1", rating: 5, occurredAt: NOW })
      .orders.find((item) => item.id === "order-1")?.rating).toBe(5);

    rejects(reduceDemoState(state, { type: "order/provider-assigned", orderId: "order-1", providerId: "provider-nasma-hvac", occurredAt: NOW }));
    rejects(reduceDemoState(state, { type: "order/provider-assigned", orderId: "order-3", providerId: "provider-coolair", occurredAt: NOW }));
  });

  it("guards quote amounts and quote status", () => {
    rejects(reduceDemoState(state, { type: "quote/approved", orderId: "order-9", amount: 500, occurredAt: NOW }));
    rejects(reduceDemoState(state, { type: "quote/approved", orderId: "order-13", amount: 1, occurredAt: NOW }));
    const approved = reduceDemoState(state, { type: "quote/approved", orderId: "order-13", amount: 2400, occurredAt: NOW });
    expect(approved.orders.find((item) => item.id === "order-13")).toMatchObject({ status: "scheduled", amount: 2400 });

    const provided = reduceDemoState(state, { type: "quote/provided", orderId: "order-9", amount: 800, occurredAt: NOW });
    expect(provided.orders.find((item) => item.id === "order-9")).toMatchObject({ status: "quote-ready", quoteAmount: 800 });
    expect(provided.orders.find((item) => item.id === "order-9")?.amount).toBeUndefined();
    rejects(reduceDemoState(state, { type: "quote/rejected", orderId: "order-1", occurredAt: NOW }));
  });

  it("refuses closed polls, closed deals, full events and conflicting amenity slots", () => {
    const closed: DemoState = { ...state, now: "2026-09-01T12:00:00+03:00" };
    expect(reduceDemoState(closed, { type: "poll/voted", pollId: "poll-2", optionId: "poll-2-7pm", residentId: "resident-saif" })).toBe(closed);
    expect(reduceDemoState(closed, { type: "neighbor-deal/joined", dealId: "deal-hvac", residentId: "resident-saif" })).toBe(closed);
    expect(reduceDemoState(closed, { type: "event/rsvp", eventId: "event-1", residentId: "resident-saif", attending: true })).toBe(closed);

    rejects(reduceDemoState(state, { type: "poll/voted", pollId: "poll-1", optionId: "poll-1-morning", residentId: "resident-saif" }));
    rejects(reduceDemoState(state, { type: "poll/voted", pollId: "poll-3", optionId: "poll-3-morning", residentId: "resident-saif" }));

    const full: DemoState = { ...state, events: state.events.map((event) => event.id === "event-1" ? { ...event, capacity: 2 } : event) };
    expect(reduceDemoState(full, { type: "event/rsvp", eventId: "event-1", residentId: "resident-saif", attending: true })).toBe(full);

    const booking = { id: "booking-new", buildingId: "building-89", residentId: "resident-saif", amenityId: "amenity-building-89-gym", startsAt: "2026-08-05T18:00:00+03:00", status: "upcoming" as const };
    rejects(reduceDemoState(state, { type: "amenity-booking/created", booking }));
    rejects(reduceDemoState(state, { type: "amenity-booking/created", booking: { ...booking, startsAt: "2026-08-05T21:00:00+03:00" } }));
    rejects(reduceDemoState(state, { type: "amenity-booking/created", booking: { ...booking, amenityId: "amenity-nakheel-court-gym" } }));
    expect(reduceDemoState(state, { type: "amenity-booking/created", booking: { ...booking, startsAt: "2026-08-05T19:00:00+03:00" } }).amenityBookings).toHaveLength(7);
  });

  it("refuses expired visitor passes and non-active pass statuses", () => {
    const pass = { id: "pass-new", buildingId: "building-89", unitId: "unit-89-1204", residentId: "resident-saif", guestName: "Mariam Al Noor", expiresAt: "2026-08-04T12:00:00+03:00", status: "active" as const };
    expect(reduceDemoState(state, { type: "visitor-pass/created", pass }).visitorPasses).toHaveLength(6);
    rejects(reduceDemoState(state, { type: "visitor-pass/created", pass: { ...pass, expiresAt: "2026-08-01T12:00:00+03:00" } }));
    rejects(reduceDemoState(state, { type: "visitor-pass/created", pass: { ...pass, status: "expired" } }));
    rejects(reduceDemoState(state, { type: "visitor-pass/created", pass: { ...pass, guestName: "  " } }));
    rejects(reduceDemoState(state, { type: "visitor-pass/created", pass: { ...pass, unitId: "unit-89-202" } }));
  });

  it("blocks every mutation while the demo is offline but keeps reads intact", () => {
    const offline = reduceDemoState(state, { type: "scenario/set", scenario: "offline" });
    expect(offline.scenario).toBe("offline");
    expect(offline.serviceOfferings).toHaveLength(35);

    expect(reduceDemoState(offline, { type: "order/created", order: order() })).toBe(offline);
    expect(reduceDemoState(offline, { type: "poll/voted", pollId: "poll-2", optionId: "poll-2-7pm", residentId: "resident-saif" })).toBe(offline);
    expect(reduceDemoState(offline, { type: "neighbor-deal/joined", dealId: "deal-hvac", residentId: "resident-saif" })).toBe(offline);
    expect(reduceDemoState(offline, { type: "locale/set", locale: "en" }).locale).toBe("en");
    expect(reduceDemoState(offline, { type: "demo/reset" }).scenario).toBe("normal");
  });

  it("upgrades the demo membership exactly once", () => {
    expect(state.residents.find((resident) => resident.id === "resident-saif")?.subscriber).toBe(false);
    const upgraded = reduceDemoState(state, { type: "membership/upgraded", residentId: "resident-saif" });
    expect(upgraded.residents.find((resident) => resident.id === "resident-saif")?.subscriber).toBe(true);
    expect(reduceDemoState(upgraded, { type: "membership/upgraded", residentId: "resident-saif" })).toBe(upgraded);
  });
});
