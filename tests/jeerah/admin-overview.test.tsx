import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatSar } from "../../src/jeerah/domain/format";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import {
  selectAveragePulse,
  selectCollectionsByMonth,
  selectOpenOrderCount,
  selectOrdersByStatus,
  selectOutstandingBalance,
  selectPropertyCount,
  selectTotalCollected,
  selectUnitCounts,
} from "../../src/jeerah/admin/selectors";
import { renderAdmin } from "./helpers/renderDemo";

/** jest-dom normalizes NBSP in received text, so expected SAR strings must match. */
const sarText = (amount: number) => formatSar(amount, "en").replace(/[  ]/g, " ");

describe("admin KPI selectors", () => {
  const seed = createSeedState();

  it("derives every dashboard KPI from shared fixtures", () => {
    expect(selectPropertyCount(seed)).toBe(4);
    expect(selectUnitCounts(seed)).toEqual({ total: 12, occupied: 10, vacant: 1, maintenance: 1 });
    expect(selectTotalCollected(seed)).toBe(2030);
    expect(selectOutstandingBalance(seed)).toBe(1550);
    expect(selectOpenOrderCount(seed)).toBe(13);
    const pulse = selectAveragePulse(seed);
    expect(pulse).toBeGreaterThan(0);
    expect(pulse).toBeLessThanOrEqual(100);
  });

  it("produces chart series only from state", () => {
    const collections = selectCollectionsByMonth(seed);
    expect(collections.length).toBeGreaterThan(0);
    expect(collections.reduce((sum, point) => sum + point.amount, 0)).toBe(selectTotalCollected(seed));
    const orders = selectOrdersByStatus(seed);
    expect(orders.reduce((sum, point) => sum + point.count, 0)).toBe(seed.orders.length);
  });
});

describe("admin dashboard", () => {
  it("renders data-derived KPIs in English", async () => {
    renderAdmin({ locale: "en" });
    const seed = createSeedState();
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByTestId("kpi-properties")).toHaveTextContent("4");
    expect(screen.getByTestId("kpi-units")).toHaveTextContent("10/12");
    expect(screen.getByTestId("kpi-collected")).toHaveTextContent(sarText(selectTotalCollected(seed)));
    expect(screen.getByTestId("kpi-outstanding")).toHaveTextContent(sarText(selectOutstandingBalance(seed)));
    expect(screen.getByTestId("kpi-open-orders")).toHaveTextContent(String(selectOpenOrderCount(seed)));
    expect(screen.getByRole("region", { name: /collections/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /recent activity/i })).toBeInTheDocument();
  });

  it("renders Arabic RTL without raw keys", async () => {
    renderAdmin({ locale: "ar" });
    const app = await screen.findByTestId("admin-root");
    expect(app).toHaveAttribute("dir", "rtl");
    expect(app).toHaveAttribute("lang", "ar");
    expect(await screen.findByRole("heading", { name: "لوحة التحكم" })).toBeInTheDocument();
    expect(app.textContent).not.toMatch(/admin\.[a-z_.]+/);
  });

  it("updates KPIs live when the shared repository changes", async () => {
    const { repository } = renderAdmin({ locale: "en" });
    await screen.findByTestId("kpi-collected");
    const before = screen.getByTestId("kpi-collected").textContent;
    await repository.dispatch({
      type: "payment/recorded",
      payment: {
        id: "payment-live-twin",
        invoiceId: "invoice-elevator",
        residentId: "resident-saif",
        method: "mada",
        status: "paid",
        amount: 700,
        occurredAt: "2026-08-06T10:00:00.000Z",
        reference: "DEMO-LIVE-1",
        last4: "4455",
      },
    });
    await waitFor(() => expect(screen.getByTestId("kpi-collected").textContent).not.toBe(before));
    expect(screen.getByTestId("kpi-collected")).toHaveTextContent(sarText(2730));
  });
});

describe("admin responsive navigation", () => {
  it("shows a fixed sidebar on desktop", async () => {
    renderAdmin({ locale: "en", viewportWidth: 1440 });
    expect(await screen.findByRole("navigation", { name: /admin/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /open navigation/i })).not.toBeInTheDocument();
  });

  it("opens and closes a modal drawer below 768px and restores focus", async () => {
    const { user } = renderAdmin({ locale: "en", viewportWidth: 390 });
    const trigger = await screen.findByRole("button", { name: /open navigation/i });
    await user.click(trigger);
    const drawer = await screen.findByRole("dialog", { name: /admin navigation/i });
    expect(drawer).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /admin navigation/i })).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});

describe("admin properties", () => {
  it("lists all buildings with derived unit counts and pulse", async () => {
    const { user } = renderAdmin({ locale: "en" });
    await user.click(await screen.findByRole("link", { name: "Properties" }));
    const table = await screen.findByRole("table", { name: /properties/i });
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(within(table).getByText("Building 89")).toBeInTheDocument();
  });

  it("edits a building through a validated form and announces success", async () => {
    const { user } = renderAdmin({ locale: "en" });
    await user.click(await screen.findByRole("link", { name: "Properties" }));
    await user.click(await screen.findByRole("button", { name: /edit building 89/i }));
    const dialog = await screen.findByRole("dialog", { name: /edit property/i });
    const nameInput = within(dialog).getByLabelText(/english name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Building 89 North");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));
    await waitFor(() => expect(screen.getByTestId("admin-live-region")).toHaveTextContent(/saved/i));
    expect(await screen.findByText("Building 89 North")).toBeInTheDocument();
  });

  it("rejects an empty building name without dispatching", async () => {
    const { user } = renderAdmin({ locale: "en" });
    await user.click(await screen.findByRole("link", { name: "Properties" }));
    await user.click(await screen.findByRole("button", { name: /edit building 89/i }));
    const dialog = await screen.findByRole("dialog", { name: /edit property/i });
    await user.clear(within(dialog).getByLabelText(/english name/i));
    await user.click(within(dialog).getByRole("button", { name: /save/i }));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByText("Building 89").length).toBeGreaterThan(0);
  });
});

describe("admin units", () => {
  it("filters units by search and status with an empty state that resets", async () => {
    const { user } = renderAdmin({ locale: "en" });
    await user.click(await screen.findByRole("link", { name: "Units" }));
    const table = await screen.findByRole("table", { name: /units/i });
    expect(within(table).getAllByRole("row").length).toBe(13);
    await user.selectOptions(screen.getByLabelText(/status filter/i), "vacant");
    await waitFor(() => expect(within(screen.getByRole("table", { name: /units/i })).getAllByRole("row").length).toBe(2));
    await user.type(screen.getByRole("searchbox", { name: /search units/i }), "no-such-unit");
    expect(await screen.findByTestId("admin-empty-state")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reset filters/i }));
    await waitFor(() => expect(within(screen.getByRole("table", { name: /units/i })).getAllByRole("row").length).toBe(13));
  });

  it("changes a unit status through the domain", async () => {
    const { user, repository } = renderAdmin({ locale: "en" });
    await user.click(await screen.findByRole("link", { name: "Units" }));
    await user.click(await screen.findByRole("button", { name: /edit unit 1204/i }));
    const dialog = await screen.findByRole("dialog", { name: /edit unit/i });
    await user.selectOptions(within(dialog).getByLabelText(/^status$/i), "maintenance");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      expect(state.units.find((unit) => unit.id === "unit-89-1204")?.status).toBe("maintenance");
    });
  });
});

describe("admin residents", () => {
  it("lists residents with subscriber and status data", async () => {
    const { user } = renderAdmin({ locale: "en" });
    await user.click(await screen.findByRole("link", { name: "Residents" }));
    const table = await screen.findByRole("table", { name: /residents/i });
    expect(within(table).getAllByRole("row")).toHaveLength(9);
    expect(within(table).getByText("Saifeldeen")).toBeInTheDocument();
  });
});
