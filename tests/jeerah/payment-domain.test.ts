import { afterEach, describe, expect, it } from "vitest";
import { createMemoryDemoRepository, type DemoRepository, type RepositorySnapshot } from "../../src/jeerah/data/repository";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { PAYMENT_METHOD_MASK, type DemoState, type Payment } from "../../src/jeerah/domain/models";
import { reduceDemoState } from "../../src/jeerah/domain/reducer";

const state = createSeedState();
const repositories = new Set<DemoRepository>();

const paidAttempt: Payment = {
  id: "payment-journey-1",
  invoiceId: "invoice-elevator",
  residentId: "resident-saif",
  method: "mada",
  status: "paid",
  amount: 700,
  occurredAt: "2026-08-03T12:05:00+03:00",
  reference: "DEMO-20260803-ABC123",
  last4: "4455",
};

const counts = (value: DemoState) => ({
  payments: value.payments.length,
  activities: value.activities.length,
  auditLog: value.auditLog.length,
});

afterEach(() => {
  repositories.forEach((repository) => repository.close());
  repositories.clear();
});

describe("atomic payment/recorded transition", () => {
  it("commits the payment, the paid invoice, one activity, and one audit entry together", () => {
    const next = reduceDemoState(state, { type: "payment/recorded", payment: paidAttempt });

    expect(next.payments.filter((payment) => payment.id === paidAttempt.id)).toHaveLength(1);
    expect(next.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("paid");
    expect(next.activities.filter((activity) => activity.id === `activity-${paidAttempt.id}`)).toHaveLength(1);
    expect(next.auditLog.filter((entry) => entry.id === `audit-${paidAttempt.id}`)).toHaveLength(1);

    const activity = next.activities.find((item) => item.id === `activity-${paidAttempt.id}`)!;
    expect(activity.buildingId).toBe("building-89");
    expect(activity.title.ar.trim()).not.toHaveLength(0);
    expect(activity.title.en.trim()).not.toHaveLength(0);
    const audit = next.auditLog.find((entry) => entry.id === `audit-${paidAttempt.id}`)!;
    expect(audit).toMatchObject({ actorId: "resident-saif", action: "payment/recorded", entityType: "payment", entityId: paidAttempt.id });
    expect(counts(next)).toEqual({ payments: counts(state).payments + 1, activities: counts(state).activities + 1, auditLog: counts(state).auditLog + 1 });
  });

  it("records an accepted non-paid result without touching the invoice or the activity feed", () => {
    const declined = { ...paidAttempt, status: "declined" as const };
    const next = reduceDemoState(state, { type: "payment/recorded", payment: declined });

    expect(next.payments.at(-1)).toEqual(declined);
    expect(next.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("due");
    expect(next.activities).toHaveLength(state.activities.length);
    expect(next.auditLog.filter((entry) => entry.id === `audit-${declined.id}`)).toHaveLength(1);
  });

  it("is idempotent for a duplicate payment identifier", () => {
    const once = reduceDemoState(state, { type: "payment/recorded", payment: paidAttempt });
    const twice = reduceDemoState(once, { type: "payment/recorded", payment: paidAttempt });

    expect(twice).toBe(once);
    expect(counts(twice)).toEqual(counts(once));
  });

  it("commits a Mastercard payment carrying its official 5105 mask", () => {
    const mastercardAttempt: Payment = { ...paidAttempt, id: "payment-journey-mastercard", method: "mastercard", last4: "5105" };
    const next = reduceDemoState(state, { type: "payment/recorded", payment: mastercardAttempt });

    expect(next.payments.filter((payment) => payment.id === mastercardAttempt.id)).toHaveLength(1);
    expect(next.payments.find((payment) => payment.id === mastercardAttempt.id)?.last4).toBe("5105");
    expect(next.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("paid");
    expect(next.auditLog.filter((entry) => entry.id === `audit-${mastercardAttempt.id}`)).toHaveLength(1);
  });

  it.each([
    ["an unknown invoice", { ...paidAttempt, invoiceId: "invoice-missing" }],
    ["another resident's invoice", { ...paidAttempt, residentId: "resident-lina" }],
    ["an already paid invoice", { ...paidAttempt, invoiceId: "invoice-89-paid-3", amount: 300 }],
    ["a mismatched amount", { ...paidAttempt, amount: 699 }],
    ["a non-finite amount", { ...paidAttempt, amount: Number.NaN }],
    ["a non-positive amount", { ...paidAttempt, amount: 0 }],
    ["a mada mask that is not 4455", { ...paidAttempt, last4: "4242" as const }],
    ["an Apple Pay mask", { ...paidAttempt, method: "apple-pay" as const }],
    ["a Visa mask that is not 4242", { ...paidAttempt, method: "visa" as const, last4: "4455" as const }],
    ["a Mastercard mask that is not 5105", { ...paidAttempt, method: "mastercard" as const, last4: "4242" as const }],
    ["an unsupported method", { ...paidAttempt, method: "cash" as never }],
    ["an unsupported status", { ...paidAttempt, status: "settled" as never }],
    ["a blank reference", { ...paidAttempt, reference: "  " }],
  ])("rejects %s without partial mutation", (_label, payment) => {
    expect(reduceDemoState(state, { type: "payment/recorded", payment })).toBe(state);
  });

  it("keeps seeded payment masks consistent with their method", () => {
    for (const payment of state.payments) {
      expect(payment.last4).toBe(PAYMENT_METHOD_MASK[payment.method]);
    }
  });

  it("audits a payment status change and reconciles the invoice coherently", () => {
    const recorded = reduceDemoState(state, { type: "payment/recorded", payment: paidAttempt });
    const refunded = reduceDemoState(recorded, {
      type: "payment/status-changed",
      paymentId: paidAttempt.id,
      status: "refunded",
      occurredAt: "2026-08-03T13:00:00+03:00",
    });

    expect(refunded.payments.find((payment) => payment.id === paidAttempt.id)?.status).toBe("refunded");
    expect(refunded.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("due");
    expect(refunded.auditLog.length).toBe(recorded.auditLog.length + 1);
    expect(refunded.auditLog.at(-1)).toMatchObject({ action: "payment/status-changed", entityId: paidAttempt.id });
  });

  it("never publishes a paid invoice without its payment, activity, and audit in the same revision", async () => {
    const repository = createMemoryDemoRepository(createSeedState(), `payment-atomic-${crypto.randomUUID()}`);
    repositories.add(repository);
    const seen: RepositorySnapshot[] = [];
    repository.subscribe((snapshot) => seen.push(snapshot));

    const before = await repository.load();
    const committed = await repository.dispatch({ type: "payment/recorded", payment: paidAttempt });

    expect(committed.meta.revision).toBe(before.meta.revision + 1);
    expect(seen).toHaveLength(1);
    for (const snapshot of [...seen, committed]) {
      expect(snapshot.state.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("paid");
      expect(snapshot.state.payments.some((payment) => payment.id === paidAttempt.id)).toBe(true);
      expect(snapshot.state.activities.some((activity) => activity.id === `activity-${paidAttempt.id}`)).toBe(true);
      expect(snapshot.state.auditLog.some((entry) => entry.id === `audit-${paidAttempt.id}`)).toBe(true);
      expect(snapshot.meta.revision).toBe(committed.meta.revision);
    }
  });
});
