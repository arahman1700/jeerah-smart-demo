import { describe, expect, it } from "vitest";
import { calculateCommunityPulse } from "../../src/jeerah/domain/communityPulse";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { formatDate, formatSar, normalizeSearchText } from "../../src/jeerah/domain/format";
import { REQUIRED_SERVICE_KEYS } from "../../src/jeerah/domain/models";
import { reduceDemoState } from "../../src/jeerah/domain/reducer";
import { searchServiceCatalog } from "../../src/jeerah/domain/serviceCatalog";

const state = createSeedState(new Date("2026-08-03T12:00:00+03:00"));

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

  it("includes every requested service key exactly once with one primary family", () => {
    expect(state.serviceOfferings.map((service) => service.key).sort()).toEqual([...REQUIRED_SERVICE_KEYS].sort());
    expect(new Set(state.serviceOfferings.map((service) => service.familyId)).size).toBe(8);
  });

  it("normalizes Arabic search text while retaining localized service search", () => {
    expect(normalizeSearchText("إزالة التَّكْيِيفـة")).toBe("ازاله التكييفه");
    expect(searchServiceCatalog(state, "تكييف", {}).map((service) => service.key)).toContain("hvac-maintenance");
    expect(searchServiceCatalog(state, "car", { scope: "apartment" }).map((service) => service.key)).toContain("mobile-car-wash");
  });

  it("formats values deterministically", () => {
    expect(formatSar(1250, "en")).toBe("SAR 1,250");
    expect(formatSar(1250, "ar")).toContain("١٬٢٥٠");
    expect(formatDate("2026-08-03T12:00:00+03:00", "en")).toBe("Aug 3, 2026");
  });

  it("calculates pulse from collection, maintenance, and alerts", () => {
    const pulse = calculateCommunityPulse(state, "building-89");
    expect(pulse.score).toBeGreaterThanOrEqual(70);
    expect(pulse.factors.map((factor) => factor.key)).toEqual(["collection", "maintenance", "alerts"]);
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

  it("leaves scenario selection to Task 3", () => {
    expect(reduceDemoState(state, { type: "scenario/set", scenario: "offline" })).toBe(state);
  });
});
