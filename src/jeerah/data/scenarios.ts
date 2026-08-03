import { createSeedState } from "../domain/fixtures";
import type { DemoScenario, DemoState } from "../domain/models";

export function applyScenario(state: DemoState, scenario: DemoScenario): DemoState {
  if (scenario === "normal") return { ...createSeedState(), locale: state.locale, scenario };
  if (scenario === "empty") return { ...state, scenario, invoices: [], orders: [], announcements: [], activities: [] };
  if (scenario === "overdue") return {
    ...state,
    scenario,
    invoices: state.invoices.map((invoice, index) => index === 0 ? { ...invoice, status: "overdue" } : invoice),
  };
  if (scenario === "urgent-maintenance") return {
    ...state,
    scenario,
    announcements: state.announcements.map((announcement, index) => index === 0 ? { ...announcement, priority: "urgent" } : announcement),
  };
  return { ...state, scenario };
}
