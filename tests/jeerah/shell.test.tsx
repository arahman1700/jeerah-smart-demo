import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MobileRuntime } from "../../src/mobile/MobileRuntime";
import JeerahPrototype from "../../src/jeerah/JeerahPrototype";
import { getRouteMode } from "../../src/jeerah/app/routeMode";
import { SurfacePortal } from "../../src/jeerah/app/SurfacePortal";
import { JeerahLogo } from "../../src/jeerah/design/JeerahLogo";
import { PaymentBrand } from "../../src/jeerah/design/PaymentBrand";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("Jeerah shell", () => {
  it("uses direct resident mode on narrow app URLs", () => {
    expect(getRouteMode(new URL("https://demo.test/?surface=app"), "browser", 390)).toBe("resident");
  });

  it("prioritizes explicit preview and admin routes", () => {
    expect(getRouteMode(new URL("https://demo.test/?preview=1"), "standalone", 390)).toBe("preview");
    expect(getRouteMode(new URL("https://demo.test/?surface=admin"), "browser", 1024)).toBe("admin");
  });

  it("sets Arabic direction on the direct surface", async () => {
    window.history.replaceState({}, "", "/?surface=app");
    const user = userEvent.setup();
    render(<MobileRuntime><JeerahPrototype /></MobileRuntime>);

    await user.click(screen.getByRole("button", { name: /العربية/i }));

    expect(screen.getByRole("application", { name: /jeerah smart demo/i })).toHaveAttribute("dir", "rtl");
  });

  it("removes its direct-surface host and body state on unmount", () => {
    const view = render(<SurfacePortal mode="resident"><p>Surface</p></SurfacePortal>);

    expect(document.body.dataset.jeerahSurface).toBe("resident");
    expect(document.querySelector("#jeerah-resident-surface")).toHaveTextContent("Surface");

    view.unmount();

    expect(document.body.dataset.jeerahSurface).toBeUndefined();
    expect(document.querySelector("#jeerah-resident-surface")).not.toBeInTheDocument();
  });

  it.each([
    ["apple-pay", "Apple Pay"],
    ["mada", "mada"],
    ["visa", "Visa"],
  ] as const)("renders the official %s brand title", (brand, label) => {
    render(<PaymentBrand brand={brand} />);
    expect(screen.getByRole("img", { name: label })).toBeInTheDocument();
  });

  it.each([
    ["ar", "dark", "horizontal-logo-2.svg"],
    ["ar", "light", "horizontal-logo-4.svg"],
    ["en", "dark", "horizontal-logo-1.svg"],
    ["en", "light", "horizontal-logo-3.svg"],
  ] as const)("selects the exact official logo for %s on %s", (locale, background, filename) => {
    render(<JeerahLogo locale={locale} background={background} />);
    expect(screen.getByRole("img", { name: /jeerah smart/i })).toHaveAttribute("src", expect.stringContaining(filename));
  });
});
