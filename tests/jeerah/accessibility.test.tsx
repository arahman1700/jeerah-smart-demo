import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAdmin, renderCompleteDemo, renderPayment } from "./helpers/renderDemo";

const RAW_KEY_PATTERN = /[A-Z_]{3,}\.[A-Z_]{3,}/;
const RAW_PLACEHOLDER_PATTERN = /\{\{.+\}\}/;
const LOWERCASE_KEY_PATTERN = /\b(?:admin|nav|action|table|status|error|payment|install|empty|service|label)\.[a-z_]+\b/;

describe.each(["ar", "en"] as const)("global accessibility in %s", (locale) => {
  it.each(["resident", "admin"] as const)("has named primary controls on the %s surface", async (surface) => {
    const { container, findByTestId, findByRole } = renderCompleteDemo({ locale, surface });
    if (surface === "admin") await findByTestId("admin-root");
    else await findByRole("application", { name: /jeerah smart/i });
    expect(container.querySelectorAll("button:not([aria-label]):empty")).toHaveLength(0);
    expect(container.querySelectorAll("img:not([alt])")).toHaveLength(0);
  });

  it.each(["resident", "admin"] as const)("never leaks raw keys or placeholders on the %s surface", async (surface) => {
    const { container, findByTestId, findByRole } = renderCompleteDemo({ locale, surface });
    if (surface === "admin") await findByTestId("admin-root");
    else await findByRole("application", { name: /jeerah smart/i });
    const text = container.textContent ?? "";
    expect(text).not.toMatch(RAW_KEY_PATTERN);
    expect(text).not.toMatch(RAW_PLACEHOLDER_PATTERN);
    expect(text).not.toMatch(LOWERCASE_KEY_PATTERN);
  });
});

describe("focus and live regions", () => {
  it("returns focus to the trigger when the admin drawer closes", async () => {
    const { user } = renderAdmin({ locale: "en", viewportWidth: 390 });
    const trigger = await screen.findByRole("button", { name: /open navigation/i });
    await user.click(trigger);
    await screen.findByRole("dialog", { name: /admin navigation/i });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("announces payment progress through an aria-live region", async () => {
    await renderPayment({ locale: "en" });
    expect(document.querySelector('[data-testid="payment-step-method"]')).toBeInTheDocument();
    expect(document.querySelector('[role="status"][aria-live]')).not.toBeNull();
  });

  it("keeps the admin action announcement region present", async () => {
    renderAdmin({ locale: "en" });
    expect(await screen.findByTestId("admin-live-region")).toHaveAttribute("aria-live", "polite");
  });
});

describe("direction contract", () => {
  it("renders Arabic admin tables inside an rtl scope with logical alignment classes", async () => {
    renderAdmin({ locale: "ar", initialPath: "/payments" });
    const root = await screen.findByTestId("admin-root");
    expect(root).toHaveAttribute("dir", "rtl");
    expect(root.querySelector(".admin-table")).not.toBeNull();
  });

  it("keeps the resident surface direction attributes in both locales", async () => {
    const arabic = renderCompleteDemo({ locale: "ar", surface: "resident" });
    const app = await arabic.findByRole("application", { name: /jeerah smart/i });
    expect(app).toHaveAttribute("dir", "rtl");
    expect(app).toHaveAttribute("lang", "ar");
    arabic.cleanup();
    const english = renderCompleteDemo({ locale: "en", surface: "resident" });
    const englishApp = await english.findByRole("application", { name: /jeerah smart/i });
    expect(englishApp).toHaveAttribute("dir", "ltr");
    expect(englishApp).toHaveAttribute("lang", "en");
  });
});
