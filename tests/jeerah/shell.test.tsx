import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MobileRuntime } from "../../src/mobile/MobileRuntime";
import JeerahPrototype from "../../src/jeerah/JeerahPrototype";
import { getRouteMode } from "../../src/jeerah/app/routeMode";
import { SurfacePortal } from "../../src/jeerah/app/SurfacePortal";
import { JeerahLogo } from "../../src/jeerah/design/JeerahLogo";
import { PaymentBrand } from "../../src/jeerah/design/PaymentBrand";
import { useDemoState } from "../../src/jeerah/data/DemoProvider";
import { createMemoryDemoRepository, type DemoRepository } from "../../src/jeerah/data/repository";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import type { DemoState } from "../../src/jeerah/domain/models";
import {
  amenityBookingStatusMessageKey,
  announcementPriorityMessageKey,
  communityPulseStatusMessageKey,
  demoScenarioMessageKey,
  eventStatusMessageKey,
  invoiceStatusMessageKey,
  invitationStatusMessageKey,
  neighborGiftStatusMessageKey,
  neighborRelationshipMessageKey,
  orderStatusMessageKey,
  paymentMethodMessageKey,
  paymentStatusMessageKey,
  pollStatusMessageKey,
  propertyStatusMessageKey,
  providerStatusMessageKey,
  quoteStatusMessageKey,
  residentStatusMessageKey,
  recurringPlanCadenceMessageKey,
  requiredPlanMessageKeys,
  requiredPlanCategoryPrefixes,
  serviceFulfillmentMessageKey,
  serviceFamilyMessageKey,
  servicePricingMessageKey,
  serviceScopeMessageKey,
  translate,
  unitStatusMessageKey,
  visitorPassStatusMessageKey,
  messages,
} from "../../src/jeerah/i18n/messages";

const repositories = new Set<DemoRepository>();

function makeRepository(locale: "ar" | "en", channelName = `shell-${Math.random()}`) {
  const repository = createMemoryDemoRepository({ ...createSeedState(), locale }, channelName);
  repositories.add(repository);
  return repository;
}

/**
 * The resident hero owns the locale toggle, and the protected FlowStack binds a
 * use-gesture drag whose tap filter cancels synthetic pointer clicks under
 * jsdom. Real pointer input is unaffected, so the toggle is activated directly.
 */
function tapLocaleToggle(element: HTMLElement) {
  fireEvent.click(element);
}

function FutureStateProbe() {
  const state = useDemoState();
  return <output data-testid="future-state-probe">{state.locale}</output>;
}

afterEach(() => {
  cleanup();
  repositories.forEach((repository) => repository.close());
  repositories.clear();
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
    render(<MobileRuntime><JeerahPrototype repository={makeRepository("en")} /></MobileRuntime>);

    tapLocaleToggle(await screen.findByRole("button", { name: /العربية/i }));

    expect(screen.getByRole("application", { name: /jeerah smart demo/i })).toHaveAttribute("dir", "rtl");
  });

  it("persists a locale choice and receives the same locale in a synchronized repository", async () => {
    window.history.replaceState({}, "", "/?surface=app");
    const channelName = "shell-locale-sync";
    const repository = makeRepository("en", channelName);
    const peer = makeRepository("en", channelName);
    const view = render(<MobileRuntime><JeerahPrototype repository={repository} /></MobileRuntime>);

    tapLocaleToggle(await screen.findByRole("button", { name: /العربية/i }));

    await waitFor(async () => expect((await repository.load()).state.locale).toBe("ar"));
    await waitFor(async () => expect((await peer.load()).state.locale).toBe("ar"));

    view.unmount();
    render(<MobileRuntime><JeerahPrototype repository={repository} /></MobileRuntime>);
    expect(await screen.findByRole("button", { name: "English" })).toBeInTheDocument();
  });

  it("uses the safe locale when persisted state is malformed, then persists a valid choice", async () => {
    window.history.replaceState({}, "", "/?surface=app");
    const repository = createMemoryDemoRepository({ ...createSeedState(), locale: "malformed" } as unknown as DemoState, "shell-malformed-locale");
    repositories.add(repository);
    render(<MobileRuntime><JeerahPrototype repository={repository} /></MobileRuntime>);

    expect(await screen.findByRole("application", { name: "Jeerah Smart demo" })).toHaveAttribute("lang", "en");
    tapLocaleToggle(screen.getByRole("button", { name: /العربية/i }));
    await waitFor(async () => expect((await repository.load()).state.locale).toBe("ar"));
  });

  it("mounts future data-driven screens inside the shared DemoProvider", async () => {
    render(<MobileRuntime><JeerahPrototype repository={makeRepository("en")}><FutureStateProbe /></JeerahPrototype></MobileRuntime>);

    expect(await screen.findByTestId("future-state-probe")).toHaveTextContent("en");
  });

  it("removes its direct-surface host and body state on unmount", () => {
    const view = render(<SurfacePortal mode="resident"><p>Surface</p></SurfacePortal>);

    expect(document.body.dataset.jeerahSurface).toBe("resident");
    expect(document.querySelector("#jeerah-resident-surface")).toHaveTextContent("Surface");

    view.unmount();

    expect(document.body.dataset.jeerahSurface).toBeUndefined();
    expect(document.querySelector("#jeerah-resident-surface")).not.toBeInTheDocument();
  });

  it("recreates the direct-surface host when the mode changes", () => {
    const view = render(<SurfacePortal mode="resident"><p>Resident</p></SurfacePortal>);

    view.rerender(<SurfacePortal mode="admin"><p>Admin</p></SurfacePortal>);

    expect(document.body.dataset.jeerahSurface).toBe("admin");
    expect(document.querySelector("#jeerah-resident-surface")).not.toBeInTheDocument();
    expect(document.querySelector("#jeerah-admin-surface")).toHaveTextContent("Admin");
  });

  it("falls back from malformed runtime locales and rejects unresolved placeholders", () => {
    expect(translate("not-a-locale", "message.welcome", { name: "Saif" })).toBe("Welcome back, Saif");
    expect(translate("en", "message.welcome", { name: "Saif", ignored: 1 })).toBe("Welcome back, Saif");
    expect(translate("en", "message.repeat", { name: "Saif" })).toBe("Saif is ready, Saif.");
    expect(() => translate("en", "message.welcome")).toThrow("Missing value for message placeholder {name}");
  });

  it("maps every planned domain status to a translatable message", () => {
    const maps = [
      propertyStatusMessageKey,
      unitStatusMessageKey,
      residentStatusMessageKey,
      providerStatusMessageKey,
      invoiceStatusMessageKey,
      paymentMethodMessageKey,
      paymentStatusMessageKey,
      orderStatusMessageKey,
      quoteStatusMessageKey,
      announcementPriorityMessageKey,
      pollStatusMessageKey,
      eventStatusMessageKey,
      invitationStatusMessageKey,
      visitorPassStatusMessageKey,
      amenityBookingStatusMessageKey,
      neighborGiftStatusMessageKey,
      serviceScopeMessageKey,
      serviceFulfillmentMessageKey,
      servicePricingMessageKey,
      serviceFamilyMessageKey,
      demoScenarioMessageKey,
      communityPulseStatusMessageKey,
      recurringPlanCadenceMessageKey,
      neighborRelationshipMessageKey,
    ];

    for (const map of maps) {
      for (const key of Object.values(map)) {
        expect(translate("ar", key)).not.toMatch(/^[A-Z_]{3,}\.[A-Z_]{3,}/);
        expect(translate("en", key)).not.toMatch(/^[A-Z_]{3,}\.[A-Z_]{3,}/);
      }
    }
  });

  it("ships every explicit Tasks 6–12 copy requirement in both dictionaries", () => {
    for (const key of requiredPlanMessageKeys) {
      expect(messages.en[key], `English ${key}`).toEqual(expect.any(String));
      expect(messages.ar[key], `Arabic ${key}`).toEqual(expect.any(String));
      expect(messages.en[key].trim(), `English ${key}`).not.toHaveLength(0);
      expect(messages.ar[key].trim(), `Arabic ${key}`).not.toHaveLength(0);
    }
  });

  it("does not let required contract categories self-omit existing messages", () => {
    const inventory = new Set(requiredPlanMessageKeys);
    const requiredCategoryKeys = Object.keys(messages.en)
      .filter((key) => requiredPlanCategoryPrefixes.some((prefix) => key.startsWith(prefix)));

    expect(requiredCategoryKeys.every((key) => inventory.has(key))).toBe(true);
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
