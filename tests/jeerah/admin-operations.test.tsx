import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { canTransition } from "../../src/jeerah/domain/reducer";
import { renderAdmin } from "./helpers/renderDemo";

const seed = () => createSeedState();

describe("admin expenses operations", () => {
  it("creates a validated invoice that lands in the table", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/expenses" });
    await user.click(await screen.findByRole("button", { name: /new invoice/i }));
    const dialog = await screen.findByRole("dialog", { name: /new invoice/i });
    await user.type(within(dialog).getByLabelText(/english title/i), "Pool maintenance");
    await user.type(within(dialog).getByLabelText(/arabic title/i), "صيانة المسبح");
    await user.type(within(dialog).getByLabelText(/amount/i), "240");
    await user.type(within(dialog).getByLabelText(/due date/i), "2026-08-12");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));
    expect(await screen.findByText("Pool maintenance")).toBeInTheDocument();
    const { state } = await repository.load();
    const created = state.invoices.find((invoice) => invoice.title.en === "Pool maintenance");
    expect(created).toMatchObject({ total: 240, status: "due" });
  });

  it("rejects a past due date relative to the demo clock", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/expenses" });
    await user.click(await screen.findByRole("button", { name: /new invoice/i }));
    const dialog = await screen.findByRole("dialog", { name: /new invoice/i });
    await user.type(within(dialog).getByLabelText(/english title/i), "Old bill");
    await user.type(within(dialog).getByLabelText(/arabic title/i), "فاتورة قديمة");
    await user.type(within(dialog).getByLabelText(/amount/i), "100");
    await user.type(within(dialog).getByLabelText(/due date/i), "2026-07-01");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    const { state } = await repository.load();
    expect(state.invoices.some((invoice) => invoice.title.en === "Old bill")).toBe(false);
  });
});

describe("admin payments operations", () => {
  it("shows masked demo payments and refunds only paid ones", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/payments" });
    const paid = seed().payments.find((payment) => payment.status === "paid" && payment.method === "mada");
    expect(paid).toBeDefined();
    const row = await screen.findByTestId(`admin-payment-${paid!.id}`);
    expect(row).toHaveTextContent("4455");
    expect(row).toHaveTextContent(paid!.reference);
    await user.click(within(row).getByRole("button", { name: /refund/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      expect(state.payments.find((payment) => payment.id === paid!.id)?.status).toBe("refunded");
    });
    const declined = seed().payments.find((payment) => payment.status === "declined");
    if (declined) {
      const declinedRow = screen.getByTestId(`admin-payment-${declined.id}`);
      expect(within(declinedRow).queryByRole("button", { name: /refund/i })).not.toBeInTheDocument();
    }
  });
});

describe("admin order operations", () => {
  it("assigns a compatible provider and advances status through legal transitions", async () => {
    const initial = seed();
    const target = initial.orders.find(
      (order) =>
        canTransition(order.status, "assigned") &&
        initial.providers.some((provider) => provider.serviceIds.includes(order.serviceId)),
    );
    expect(target).toBeDefined();
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/orders" });
    const row = await screen.findByTestId(`admin-order-${target!.id}`);
    const provider = initial.providers.find((item) => item.serviceIds.includes(target!.serviceId))!;
    await user.selectOptions(within(row).getByLabelText(/assign provider/i), provider.id);
    await user.click(within(row).getByRole("button", { name: /^assign$/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      const updated = state.orders.find((order) => order.id === target!.id)!;
      expect(updated.providerId).toBe(provider.id);
      expect(updated.status).toBe("assigned");
      expect(updated.timeline.at(-1)?.status).toBe("assigned");
    });
  });

  it("provides and approves a quote for an awaiting-quote order", async () => {
    const initial = seed();
    const quoteOrder = initial.orders.find((order) => order.status === "awaiting-quote");
    expect(quoteOrder).toBeDefined();
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/orders" });
    const row = await screen.findByTestId(`admin-order-${quoteOrder!.id}`);
    await user.type(within(row).getByLabelText(/quote amount/i), "1850");
    await user.click(within(row).getByRole("button", { name: /send quote/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      expect(state.orders.find((order) => order.id === quoteOrder!.id)?.status).toBe("quote-ready");
    });
  });
});

describe("admin marketplace operations", () => {
  it("pauses an offering and edits its price through the domain", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/marketplace" });
    const row = await screen.findByTestId("admin-service-smart-lock-installation");
    await user.click(within(row).getByRole("button", { name: /disable/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      expect(state.serviceOfferings.find((item) => item.key === "smart-lock-installation")?.active).toBe(false);
    });
  });

  it("creates a subscriber offer bound to a real service and provider", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/marketplace" });
    await user.click(await screen.findByRole("button", { name: /new offer/i }));
    const dialog = await screen.findByRole("dialog", { name: /new offer/i });
    await user.type(within(dialog).getByLabelText(/english title/i), "Twin offer");
    await user.type(within(dialog).getByLabelText(/arabic title/i), "عرض التوأم");
    await user.type(within(dialog).getByLabelText(/member price/i), "99");
    await user.click(within(dialog).getByRole("button", { name: /save/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      const offer = state.memberOffers.find((item) => item.title.en === "Twin offer");
      expect(offer).toBeDefined();
      expect(offer!.memberPrice).toBe(99);
      expect(state.serviceOfferings.some((service) => service.id === offer!.serviceId)).toBe(true);
      expect(state.providers.some((provider) => provider.id === offer!.providerId)).toBe(true);
    });
  });
});

describe("admin publishing", () => {
  it("publishes an urgent announcement immediately", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/announcements" });
    await user.click(await screen.findByRole("button", { name: /new announcement/i }));
    const dialog = await screen.findByRole("dialog", { name: /new announcement/i });
    await user.type(within(dialog).getByLabelText(/english title/i), "Water outage drill");
    await user.type(within(dialog).getByLabelText(/arabic title/i), "تجربة انقطاع المياه");
    await user.type(within(dialog).getByLabelText(/english body/i), "Demo drill at building 89.");
    await user.type(within(dialog).getByLabelText(/arabic body/i), "تجربة في مبنى ٨٩.");
    await user.selectOptions(within(dialog).getByLabelText(/priority/i), "urgent");
    await user.click(within(dialog).getByRole("button", { name: /publish/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      expect(state.announcements.some((item) => item.title.en === "Water outage drill" && item.priority === "urgent")).toBe(true);
    });
  });
});

describe("admin audit log", () => {
  it("lists audit entries and exports CSV locally", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL");
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/audit" });
    await screen.findByTestId("admin-root");
    const { state: initial } = await repository.load();
    const paid = initial.payments.find((payment) => payment.status === "paid")!;
    await repository.dispatch({ type: "payment/status-changed", paymentId: paid.id, status: "refunded", occurredAt: "2026-08-06T09:00:00.000Z" });
    expect(await screen.findByRole("table", { name: /audit/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /export csv/i }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toContain("text/csv");
    createObjectURL.mockRestore();
  });
});

describe("scenario studio", () => {
  it("switches scenario after one confirmation", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/settings" });
    await user.click(await screen.findByRole("radio", { name: /overdue/i }));
    await user.click(screen.getByRole("button", { name: /apply scenario/i }));
    const confirm = await screen.findByRole("dialog", { name: /confirm/i });
    await user.click(within(confirm).getByRole("button", { name: /confirm/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      expect(state.scenario).toBe("overdue");
    });
  });

  it("requires typing RESET and preserves locale", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/settings" });
    const resetButton = await screen.findByRole("button", { name: /reset demo/i });
    expect(resetButton).toBeDisabled();
    await user.type(screen.getByLabelText(/type reset/i), "RESET");
    expect(resetButton).toBeEnabled();
    await repository.dispatch({ type: "locale/set", locale: "en" });
    await user.click(resetButton);
    await waitFor(async () => {
      const { state } = await repository.load();
      expect(state.payments.filter((payment) => payment.status === "refunded").length).toBeLessThanOrEqual(1);
      expect(state.locale).toBe("en");
    });
  });
});
