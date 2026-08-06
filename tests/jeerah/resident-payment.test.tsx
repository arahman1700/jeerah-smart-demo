import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { formatDate, formatSar } from "../../src/jeerah/domain/format";
import type { DemoScenario, PaymentMethod } from "../../src/jeerah/domain/models";
import { renderPayment, renderResidentAt, tap } from "./helpers/renderDemo";

const DISCLAIMER_EN = "Demo transaction — no money was charged";
const DISCLAIMER_AR = "عملية تجريبية — لم يتم الخصم";

function currentPage() {
  return within(screen.getByTestId("flow-current")).getByTestId("resident-page-content");
}

function currentScreenId() {
  return currentPage().getAttribute("data-resident-screen");
}

/** The payment route owns an in-page Back; other details use the flow header. */
function pageBack() {
  return within(currentPage()).getByRole("button", { name: /^(Back|Done|رجوع|تم)$/ });
}

function headerBack() {
  return within(screen.getByTestId("flow-fixed-header")).getByRole("button", { name: /^(Back|رجوع)$/ });
}

function seedWith(patch: (state: ReturnType<typeof createSeedState>) => void) {
  const state = createSeedState();
  patch(state);
  return state;
}

function scenarioState(scenario: DemoScenario) {
  return seedWith((state) => {
    state.scenario = scenario;
  });
}

/** Walks the guarded method -> review -> verify steps of the real payment route. */
async function reachVerify(method: PaymentMethod) {
  tap(screen.getByTestId(`payment-method-${method}`));
  tap(within(currentPage()).getByRole("button", { name: /^(Continue|متابعة)$/ }));
  await screen.findByTestId("payment-step-review");
  tap(within(currentPage()).getByRole("button", { name: /^(Confirm|تأكيد)$/ }));
  return screen.findByTestId("payment-step-verify");
}

function confirmPayment() {
  tap(screen.getByTestId("payment-confirm"));
}

describe("resident payment journey", () => {
  it("completes the mada journey with the visible demo code and reaches the exact no-charge receipt", async () => {
    const view = await renderPayment({ locale: "en" });

    expect(screen.getByTestId("payment-warning")).toHaveTextContent(
      "Demo payment — never enter or use a real card. No money will be charged.",
    );

    const methods = screen.getByTestId("payment-step-method");
    expect(methods.tagName).toBe("FIELDSET");
    expect(within(methods).getAllByRole("radio")).toHaveLength(4);
    expect(within(methods).getByRole("radio", { name: /^mada/ })).toBeInTheDocument();
    expect(within(methods).getByRole("radio", { name: /^Apple Pay/ })).toBeInTheDocument();
    expect(within(methods).getByRole("radio", { name: /^Visa/ })).toBeInTheDocument();
    expect(within(methods).getByRole("radio", { name: /^Mastercard/ })).toBeInTheDocument();

    const verify = await reachVerify("mada");
    expect(within(verify).getByTestId("payment-mask-value")).toHaveTextContent("•••• 4455");
    expect(within(verify).getByTestId("payment-demo-otp")).toHaveTextContent("1234");
    expect(screen.getByTestId("payment-warning")).toBeVisible();

    const code = within(verify).getByLabelText("Demo code");
    fireEvent.change(code, { target: { value: "0000" } });
    confirmPayment();
    expect(await screen.findByText("Enter the visible demo code to continue.")).toBeInTheDocument();
    expect(screen.getByTestId("payment-step-verify")).toBeInTheDocument();

    fireEvent.change(code, { target: { value: "1234" } });
    confirmPayment();

    const receipt = await screen.findByTestId("payment-receipt");
    expect(within(receipt).getByTestId("payment-disclaimer")).toHaveTextContent(DISCLAIMER_EN);
    expect(within(receipt).getByText("Paid")).toBeInTheDocument();
    expect(within(receipt).getByTestId("payment-amount-value").textContent).toBe(formatSar(700, "en"));
    expect(within(receipt).getByTestId("payment-mask-value")).toHaveTextContent("•••• 4455");
    expect(within(receipt).getByTestId("payment-reference-value").textContent).toMatch(/^DEMO-\d{8}-[A-Z0-9]+$/);

    const snapshot = await view.snapshot();
    expect(snapshot.state.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("paid");
    expect(snapshot.state.payments.filter((payment) => payment.invoiceId === "invoice-elevator" && payment.status === "paid")).toHaveLength(1);
  });

  it.each([
    ["apple-pay", "Apple Pay", "Confirm this in-product demo step. This is not an Apple Pay sheet.", undefined],
    ["visa", "Visa", "Confirm this labeled demo 3-D Secure step. No bank is contacted.", "•••• 4242"],
    ["mastercard", "Mastercard", "Confirm this labeled demo 3-D Secure step. No bank is contacted.", "•••• 5105"],
  ] as const)("confirms the %s demo without an OS imitation or sensitive fields", async (method, brand, instruction, mask) => {
    await renderPayment({ locale: "en" });

    const verify = await reachVerify(method);
    expect(within(verify).getByText(instruction)).toBeInTheDocument();
    expect(within(verify).queryByLabelText("Demo code")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    confirmPayment();
    const receipt = await screen.findByTestId("payment-receipt");
    expect(within(receipt).getByText(brand)).toBeInTheDocument();
    expect(within(receipt).getByTestId("payment-disclaimer")).toHaveTextContent(DISCLAIMER_EN);
    if (mask) expect(within(receipt).getByTestId("payment-mask-value")).toHaveTextContent(mask);
    else expect(within(receipt).queryByTestId("payment-mask-value")).not.toBeInTheDocument();

    const app = screen.getByRole("application", { name: /Jeerah Smart demo/i });
    expect(app).not.toHaveTextContent(/cvv|cvc|card number|expiry|expiration date/i);
    const fields = Array.from(app.querySelectorAll("input, select, textarea"));
    for (const field of fields) {
      expect(field.getAttribute("type")).not.toBe("file");
      const descriptors = [field.id, field.getAttribute("name"), field.getAttribute("placeholder"), field.getAttribute("aria-label")].join(" ");
      expect(descriptors).not.toMatch(/card|cvv|cvc|expiry|iban|account|credential|password/i);
    }
  });

  it("commits at most one attempt for repeated confirms under StrictMode", async () => {
    const view = await renderPayment({ locale: "en", delayMs: 10, strict: true });

    const verify = await reachVerify("mada");
    fireEvent.change(within(verify).getByLabelText("Demo code"), { target: { value: "1234" } });

    // One batch keeps the control mounted, so every repeat really reaches the
    // handler and has to be stopped by the synchronous submit guard.
    const confirm = screen.getByTestId("payment-confirm");
    await act(async () => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });

    await screen.findByTestId("payment-receipt");
    const snapshot = await view.snapshot();
    expect(snapshot.state.payments.filter((payment) => payment.invoiceId === "invoice-elevator" && payment.status === "paid")).toHaveLength(1);
  });

  it("aborts an in-flight attempt when the screen unmounts and never updates state late", async () => {
    const view = await renderPayment({ locale: "en", delayMs: 40 });
    const seeded = view.state.payments.length;

    const verify = await reachVerify("mada");
    fireEvent.change(within(verify).getByLabelText("Demo code"), { target: { value: "1234" } });
    confirmPayment();
    await screen.findByTestId("payment-step-processing");
    view.cleanup();

    await new Promise((resolve) => setTimeout(resolve, 80));
    const snapshot = await view.repository.load();
    expect(snapshot.state.payments).toHaveLength(seeded);
    expect(snapshot.state.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("due");
  });

  it("blocks the offline scenario with error.offline while cached data stays readable", async () => {
    const view = await renderPayment({ locale: "en", state: scenarioState("offline") });
    const seeded = view.state.payments.length;

    expect(screen.getByRole("alert")).toHaveTextContent("This demo is offline. Changes are unavailable.");
    const verify = await reachVerify("mada");
    fireEvent.change(within(verify).getByLabelText("Demo code"), { target: { value: "1234" } });
    confirmPayment();

    expect(screen.getByTestId("payment-step-verify")).toBeInTheDocument();
    expect(screen.queryByTestId("payment-receipt")).not.toBeInTheDocument();
    expect(within(currentPage()).getByTestId("payment-amount-value").textContent).toBe(formatSar(700, "en"));
    const snapshot = await view.snapshot();
    expect(snapshot.state.payments).toHaveLength(seeded);
  });

  it("maps the declined scenario to a declined receipt and offers a method change", async () => {
    const view = await renderPayment({ locale: "en", state: scenarioState("declined") });

    const verify = await reachVerify("mada");
    fireEvent.change(within(verify).getByLabelText("Demo code"), { target: { value: "1234" } });
    confirmPayment();

    const receipt = await screen.findByTestId("payment-receipt");
    expect(within(receipt).getByText("Declined")).toBeInTheDocument();
    expect(within(receipt).getByText("The demo payment was declined.")).toBeInTheDocument();
    expect(within(receipt).getByTestId("payment-disclaimer")).toHaveTextContent(DISCLAIMER_EN);

    const snapshot = await view.snapshot();
    expect(snapshot.state.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("due");
    expect(snapshot.state.payments.at(-1)?.status).toBe("declined");

    tap(screen.getByRole("button", { name: "Change method" }));
    expect(await screen.findByTestId("payment-step-method")).toBeInTheDocument();
  });

  it("renders Arabic with real direction, exact helpers, LTR isolation, and no raw keys", async () => {
    const view = await renderPayment({ locale: "ar" });

    const app = screen.getByRole("application", { name: /Jeerah Smart demo/i });
    expect(app).toHaveAttribute("lang", "ar");
    expect(app).toHaveAttribute("dir", "rtl");
    expect(app).not.toHaveTextContent(/(?:payment|invoice|action|error|expenses|empty|status)\.[a-z_0-9]+/i);

    const verify = await reachVerify("mada");
    fireEvent.change(within(verify).getByLabelText("الرمز التجريبي"), { target: { value: "1234" } });
    confirmPayment();

    const receipt = await screen.findByTestId("payment-receipt");
    const payment = (await view.snapshot()).state.payments.at(-1)!;
    expect(within(receipt).getByTestId("payment-disclaimer").textContent).toBe(DISCLAIMER_AR);

    const amount = within(receipt).getByTestId("payment-amount-value");
    expect(amount.tagName).toBe("BDI");
    expect(amount).toHaveAttribute("dir", "ltr");
    expect(amount.textContent).toBe(formatSar(700, "ar"));
    expect(within(receipt).getByTestId("payment-reference-value").tagName).toBe("BDI");
    expect(within(receipt).getByTestId("payment-mask-value").tagName).toBe("BDI");
    expect(within(receipt).getByTestId("payment-date-value").textContent).toBe(formatDate(payment.occurredAt, "ar"));
    expect(app).not.toHaveTextContent(/(?:payment|invoice|action|error|expenses|empty|status)\.[a-z_0-9]+/i);
  });

  it("routes Expenses to Invoice to Payment with push, footer rules, and localized Back", async () => {
    renderResidentAt("expenses", { locale: "en" });

    expect(await screen.findByRole("heading", { name: "Expenses" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Jeerah Smart" })).toBeInTheDocument();
    expect(currentPage()).toHaveClass("resident-page-content--footer-clearance");

    tap(screen.getByTestId("expense-row-invoice-elevator"));
    await waitFor(() => expect(currentScreenId()).toBe("invoice"));
    expect(screen.queryByRole("navigation", { name: "Jeerah Smart" })).not.toBeInTheDocument();
    expect(within(currentPage()).getByText("Elevator maintenance")).toBeInTheDocument();
    expect(within(currentPage()).getByTestId("invoice-total").textContent).toBe(formatSar(700, "en"));

    tap(screen.getByTestId("invoice-pay"));
    await waitFor(() => expect(currentScreenId()).toBe("payment"));
    expect(await screen.findByTestId("payment-step-method")).toBeInTheDocument();

    tap(pageBack());
    await waitFor(() => expect(currentScreenId()).toBe("invoice"));
    tap(headerBack());
    await waitFor(() => expect(currentScreenId()).toBe("expenses"));
  });

  it("locks Back during processing and finishes the result step with Done", async () => {
    const view = await renderPayment({ locale: "en", delayMs: 25 });

    const verify = await reachVerify("mada");
    expect(pageBack()).toBeEnabled();
    fireEvent.change(within(verify).getByLabelText("Demo code"), { target: { value: "1234" } });
    confirmPayment();

    await screen.findByTestId("payment-step-processing");
    expect(pageBack()).toBeDisabled();

    await screen.findByTestId("payment-receipt");
    tap(pageBack());
    await waitFor(() => expect(currentScreenId()).toBe("expenses"));
    expect(screen.getByRole("navigation", { name: "Jeerah Smart" })).toBeInTheDocument();
    expect((await view.snapshot()).state.invoices.find((invoice) => invoice.id === "invoice-elevator")?.status).toBe("paid");
  });

  it("filters and sorts resident expenses and stays honest when records are missing", async () => {
    const view = renderResidentAt("expenses", { locale: "en" });
    await screen.findByRole("heading", { name: "Expenses" });

    const rows = () => within(currentPage()).queryAllByTestId(/^expense-row-/);
    expect(rows().map((row) => row.getAttribute("data-testid"))).toEqual([
      "expense-row-invoice-89-paid-3",
      "expense-row-invoice-elevator",
    ]);

    tap(within(currentPage()).getByRole("button", { name: "Paid" }));
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0]).toHaveAttribute("data-testid", "expense-row-invoice-89-paid-3");

    tap(within(currentPage()).getByRole("button", { name: "Overdue" }));
    expect(await within(currentPage()).findByText("No expenses to show.")).toBeInTheDocument();
    view.cleanup();

    renderResidentAt("expenses", {
      locale: "en",
      state: seedWith((state) => {
        state.currentResidentId = "resident-ghost";
      }),
    });
    expect(await screen.findByText("This demo resident is unavailable.")).toBeInTheDocument();
  });

  it("re-resolves the invoice route after an external reset instead of trusting a captured entity", async () => {
    const view = renderResidentAt("expenses", { locale: "en" });
    tap(await screen.findByTestId("expense-row-invoice-elevator"));
    await waitFor(() => expect(currentScreenId()).toBe("invoice"));

    await view.repository.dispatch({ type: "scenario/set", scenario: "empty" });

    expect(await screen.findByText("This demo invoice is unavailable.")).toBeInTheDocument();
    expect(screen.queryByTestId("invoice-pay")).not.toBeInTheDocument();
  });

  it("prints the receipt and never serializes demo codes or credential fields", async () => {
    const printed = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const view = await renderPayment({ locale: "en" });

    const verify = await reachVerify("mada");
    fireEvent.change(within(verify).getByLabelText("Demo code"), { target: { value: "1234" } });
    confirmPayment();

    const receipt = await screen.findByTestId("payment-receipt");
    tap(within(receipt).getByRole("button", { name: "Print" }));
    expect(printed).toHaveBeenCalledTimes(1);
    expect(within(receipt).getByTestId("payment-disclaimer").textContent).toBe(DISCLAIMER_EN);

    const snapshot = await view.snapshot();
    const payment = snapshot.state.payments.at(-1)!;
    expect(Object.keys(payment).sort()).toEqual([
      "amount", "id", "invoiceId", "last4", "method", "occurredAt", "reference", "residentId", "status",
    ]);
    const serialized = JSON.stringify(snapshot.state);
    expect(serialized).not.toMatch(/otp|cvv|cvc|cardnumber|card_number|expiry|credential|password/i);
    expect(serialized).not.toContain("1234");
    printed.mockRestore();
  });
});
