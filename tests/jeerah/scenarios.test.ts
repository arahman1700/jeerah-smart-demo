import { describe, expect, it } from "vitest";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { reduceDemoState } from "../../src/jeerah/domain/reducer";
import { applyScenario } from "../../src/jeerah/data/scenarios";

describe("applyScenario", () => {
  it("preserves locale while restoring the normal seed", () => {
    const state = { ...createSeedState(), locale: "en" as const, invoices: [] };

    const next = applyScenario(state, "normal");

    expect(next.locale).toBe("en");
    expect(next.scenario).toBe("normal");
    expect(next.invoices).toHaveLength(10);
    expect(next.schemaVersion).toBe(2);
    expect(next.residents.find((resident) => resident.id === "resident-saif")).toMatchObject({
      unitId: "unit-89-1204",
      name: { ar: "سيف الدين", en: "Saifeldeen" },
    });
    expect(next.invoices.find((invoice) => invoice.id === "invoice-elevator")?.dueDate)
      .toBe("2026-08-08T12:00:00+03:00");
  });

  it("empties only the scenario-controlled collections", () => {
    const state = createSeedState();

    const next = applyScenario(state, "empty");

    expect(next.invoices).toEqual([]);
    expect(next.orders).toEqual([]);
    expect(next.announcements).toEqual([]);
    expect(next.activities).toEqual([]);
    expect(next.residents).toHaveLength(8);
  });

  it("sets a scenario through one reducer transition and appends one audit entry", () => {
    const state = createSeedState();

    const next = reduceDemoState(state, { type: "scenario/set", scenario: "overdue" });

    expect(next.scenario).toBe("overdue");
    expect(next.invoices[0].status).toBe("overdue");
    expect(next.auditLog).toHaveLength(1);
    expect(next.auditLog[0]).toMatchObject({ action: "scenario/set", entityType: "scenario", entityId: "overdue" });
  });
});
