import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderLiveTwin, tap } from "./helpers/renderDemo";

describe("live twin: resident and admin share one state", () => {
  it("publishes an invoice that appears in the resident expenses list", async () => {
    const harness = renderLiveTwin({ residentScreen: "expenses" });
    await harness.admin.createInvoice({ title: "Pool maintenance", amount: 240, dueDate: "2026-08-12" });
    expect(await harness.resident.findByText(/pool maintenance/i, {}, { timeout: 5000 })).toBeInTheDocument();
    await waitFor(() => expect(harness.admin.getByTestId("kpi-outstanding").textContent).toContain("1,790"));
  });

  it("updates admin finance after a resident demo payment", async () => {
    const harness = renderLiveTwin({ adminPath: "/payments" });
    await harness.resident.pay("invoice-elevator", "apple-pay", "paid");
    const row = await harness.admin.findByTestId("admin-payment-payment-twin-invoice-elevator");
    expect(row).toHaveTextContent(/apple pay/i);
    expect(row).toHaveTextContent(/DEMO-TWIN-INVOICE-ELEVATOR/);
    await waitFor(async () => expect(await harness.admin.getInvoiceStatus("invoice-elevator")).toBe("paid"));
  });

  it("reflects an admin service pause on the resident marketplace", async () => {
    const harness = renderLiveTwin({ residentScreen: "marketplace" });
    tap(await harness.resident.findByTestId("family-tile-building-tech-safety", {}, { timeout: 5000 }));
    tap(await harness.resident.findByTestId("service-card-smart-lock-installation", {}, { timeout: 5000 }));
    const passport = await harness.resident.findByTestId("service-passport-smart-lock-installation", {}, { timeout: 5000 });
    expect(passport).not.toHaveTextContent(/unavailable|غير متاح/i);
    await harness.admin.setServiceAvailability("smart-lock-installation", false);
    await waitFor(
      () => expect(harness.resident.getByTestId("service-passport-smart-lock-installation")).toHaveTextContent(/unavailable|غير متاح/i),
      { timeout: 5000 },
    );
  });

  it("shows an approved quote amount on the resident order", async () => {
    const harness = renderLiveTwin({ residentScreen: "orders" });
    const orderId = await harness.resident.requestQuote("awning-installation");
    const row = await harness.resident.findByTestId(`order-row-${orderId}`, {}, { timeout: 5000 });
    expect(row).toBeInTheDocument();
    await harness.admin.approveQuote(orderId, 1850);
    await waitFor(() => expect(harness.resident.getByTestId(`order-row-${orderId}`)).toHaveTextContent(/1,850|١٬٨٥٠/), { timeout: 5000 });
  });

  it("keeps locale after a demo reset from the admin surface", async () => {
    const harness = renderLiveTwin({ locale: "ar", residentScreen: "home" });
    await harness.resident.findByRole("heading", { name: "سيف الدين" });
    await harness.admin.repository.dispatch({ type: "demo/reset" });
    await waitFor(async () => {
      const { state } = await harness.resident.repository.load();
      expect(state.locale).toBe("ar");
    });
    expect(await harness.resident.findByRole("heading", { name: "سيف الدين" })).toBeInTheDocument();
  });
});
