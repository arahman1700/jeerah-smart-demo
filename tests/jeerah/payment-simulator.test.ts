import { afterEach, describe, expect, it, vi } from "vitest";
import { PAYMENT_METHOD_MASK } from "../../src/jeerah/domain/models";
import { SIMULATED_PAYMENT_OUTCOMES, simulatePayment } from "../../src/jeerah/domain/paymentSimulator";

const attempt = {
  invoiceId: "invoice-elevator",
  residentId: "resident-saif",
  method: "mada",
  amount: 700,
} as const;

const deterministic = {
  delayMs: 0,
  now: () => new Date("2026-08-03T12:00:00+03:00"),
  createId: () => "abc123",
} as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("payment simulator", () => {
  it("produces a deterministic payment from the injected clock and identifier", async () => {
    const payment = await simulatePayment(attempt, { ...deterministic, forcedOutcome: "paid" });

    expect(payment).toEqual({
      id: "payment-abc123",
      invoiceId: "invoice-elevator",
      residentId: "resident-saif",
      method: "mada",
      status: "paid",
      amount: 700,
      occurredAt: "2026-08-03T09:00:00.000Z",
      reference: "DEMO-20260803-ABC123",
      last4: "4455",
    });
    expect(await simulatePayment(attempt, { ...deterministic, forcedOutcome: "paid" })).toEqual(payment);
  });

  it("supports every resident-reachable outcome and refuses refunded injection", async () => {
    expect(SIMULATED_PAYMENT_OUTCOMES).toEqual(["paid", "pending", "declined", "cancelled", "timed-out"]);

    for (const outcome of SIMULATED_PAYMENT_OUTCOMES) {
      const payment = await simulatePayment(attempt, { ...deterministic, forcedOutcome: outcome });
      expect(payment.status).toBe(outcome);
    }

    await expect(simulatePayment(attempt, {
      ...deterministic,
      forcedOutcome: "refunded" as never,
    })).rejects.toThrow(/outcome/i);
  });

  it("applies the official mask rule for every method", async () => {
    const applePay = await simulatePayment({ ...attempt, method: "apple-pay" }, deterministic);
    const mada = await simulatePayment({ ...attempt, method: "mada" }, deterministic);
    const visa = await simulatePayment({ ...attempt, method: "visa" }, deterministic);
    const mastercard = await simulatePayment({ ...attempt, method: "mastercard" }, deterministic);

    expect(Object.hasOwn(applePay, "last4")).toBe(false);
    expect(mada.last4).toBe("4455");
    expect(visa.last4).toBe("4242");
    expect(mastercard.last4).toBe("5105");
    expect(PAYMENT_METHOD_MASK).toEqual({ "apple-pay": undefined, mada: "4455", visa: "4242", mastercard: "5105" });
  });

  it("runtime-validates identifiers, method, amount, and delay", async () => {
    await expect(simulatePayment({ ...attempt, invoiceId: "" }, deterministic)).rejects.toThrow(/invoiceId/);
    await expect(simulatePayment({ ...attempt, residentId: " " }, deterministic)).rejects.toThrow(/residentId/);
    await expect(simulatePayment({ ...attempt, method: "cash" as never }, deterministic)).rejects.toThrow(/method/i);
    await expect(simulatePayment({ ...attempt, amount: 0 }, deterministic)).rejects.toThrow(/amount/i);
    await expect(simulatePayment({ ...attempt, amount: -700 }, deterministic)).rejects.toThrow(/amount/i);
    await expect(simulatePayment({ ...attempt, amount: Number.POSITIVE_INFINITY }, deterministic)).rejects.toThrow(/amount/i);
    await expect(simulatePayment(attempt, { ...deterministic, delayMs: -1 })).rejects.toThrow(/delay/i);
    await expect(simulatePayment(attempt, { ...deterministic, delayMs: Number.NaN })).rejects.toThrow(/delay/i);
  });

  it("mints a unique identifier and reference per attempt", async () => {
    const first = await simulatePayment(attempt, { ...deterministic, createId: () => "aaa111" });
    const second = await simulatePayment(attempt, { ...deterministic, createId: () => "bbb222" });

    expect(first.id).not.toBe(second.id);
    expect(first.reference).not.toBe(second.reference);
    expect(second.reference).toBe("DEMO-20260803-BBB222");
  });

  it("clears its timer and rejects with AbortError without producing a payment", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const controller = new AbortController();
    const pending = simulatePayment(attempt, { ...deterministic, delayMs: 5_000, signal: controller.signal });
    const settled = vi.fn();
    void pending.then(settled, () => undefined);

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(clearSpy).toHaveBeenCalled();
    expect(settled).not.toHaveBeenCalled();

    const preAborted = AbortSignal.abort();
    await expect(simulatePayment(attempt, { ...deterministic, signal: preAborted })).rejects.toMatchObject({ name: "AbortError" });
  });
});
