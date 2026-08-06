import { PAYMENT_METHOD_MASK, PAYMENT_METHODS, type Payment, type PaymentMethod } from "./models";

/**
 * Outcomes a resident submission can reach. `refunded` is deliberately absent:
 * it is only produced by the later refund action, never by a payment attempt.
 */
export const SIMULATED_PAYMENT_OUTCOMES = ["paid", "pending", "declined", "cancelled", "timed-out"] as const;
export type SimulatedPaymentOutcome = (typeof SIMULATED_PAYMENT_OUTCOMES)[number];

export interface PaymentAttempt {
  invoiceId: string;
  residentId: string;
  method: PaymentMethod;
  amount: number;
}

export interface SimulatePaymentOptions {
  /** Test/scenario injection. Without it the simulator settles on `paid`. */
  forcedOutcome?: SimulatedPaymentOutcome;
  delayMs?: number;
  now?: () => Date;
  createId?: () => string;
  signal?: AbortSignal;
}

export const DEFAULT_SIMULATED_DELAY_MS = 900;

const isFilled = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const abortError = () => new DOMException("The demo payment was aborted.", "AbortError");
const defaultCreateId = () => globalThis.crypto?.randomUUID?.() ?? `demo-${Math.random().toString(36).slice(2)}`;

/** Deterministic, LTR-safe demo reference derived only from the injected id and clock. */
function referenceFrom(token: string, occurredAt: string) {
  const suffix = token.replace(/[^0-9a-z]/gi, "").toUpperCase().slice(-8) || "000000";
  return `DEMO-${occurredAt.slice(0, 10).replaceAll("-", "")}-${suffix}`;
}

function wait(delayMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Local-only payment simulation. It never touches the network, the repository,
 * the DOM, or any card, CVV, expiry, or bank credential: the caller supplies an
 * invoice, a resident, a method, and an amount, and receives a demo `Payment`.
 */
export async function simulatePayment(attempt: PaymentAttempt, options: SimulatePaymentOptions = {}): Promise<Payment> {
  const {
    forcedOutcome,
    delayMs = DEFAULT_SIMULATED_DELAY_MS,
    now = () => new Date(),
    createId = defaultCreateId,
    signal,
  } = options;

  if (!isFilled(attempt?.invoiceId)) throw new TypeError("simulatePayment requires a non-empty invoiceId");
  if (!isFilled(attempt.residentId)) throw new TypeError("simulatePayment requires a non-empty residentId");
  if (!PAYMENT_METHODS.includes(attempt.method)) throw new TypeError("simulatePayment received an unsupported payment method");
  if (forcedOutcome !== undefined && !SIMULATED_PAYMENT_OUTCOMES.includes(forcedOutcome)) {
    throw new TypeError("simulatePayment received an unsupported outcome");
  }
  if (!Number.isFinite(attempt.amount) || attempt.amount <= 0) throw new TypeError("simulatePayment requires a finite positive amount");
  if (!Number.isFinite(delayMs) || delayMs < 0) throw new TypeError("simulatePayment requires a finite non-negative delay");

  await wait(delayMs, signal);

  const token = createId();
  if (!isFilled(token)) throw new TypeError("simulatePayment requires a non-empty generated identifier");
  const occurredAt = now().toISOString();
  const mask = PAYMENT_METHOD_MASK[attempt.method];

  return {
    id: `payment-${token}`,
    invoiceId: attempt.invoiceId,
    residentId: attempt.residentId,
    method: attempt.method,
    status: forcedOutcome ?? "paid",
    amount: attempt.amount,
    occurredAt,
    reference: referenceFrom(token, occurredAt),
    ...(mask ? { last4: mask } : {}),
  };
}
