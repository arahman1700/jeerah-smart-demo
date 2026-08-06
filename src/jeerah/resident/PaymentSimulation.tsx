import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import type { SimulatedPaymentOutcome } from "../domain/paymentSimulator";

/**
 * Injection seam for the local payment simulator. Production leaves it empty;
 * tests and scenario tooling supply a deterministic clock, id, delay, or outcome.
 */
export interface PaymentSimulationConfig {
  forcedOutcome?: SimulatedPaymentOutcome;
  delayMs?: number;
  now?: () => Date;
  createId?: () => string;
}

const PaymentSimulationContext = createContext<PaymentSimulationConfig>({});

export function PaymentSimulationProvider({ config, children }: PropsWithChildren<{ config?: PaymentSimulationConfig }>) {
  const value = useMemo(() => config ?? {}, [config]);
  return <PaymentSimulationContext value={value}>{children}</PaymentSimulationContext>;
}

export function usePaymentSimulation() {
  return useContext(PaymentSimulationContext);
}
