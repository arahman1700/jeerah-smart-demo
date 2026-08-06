import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import JeerahPrototype from "../../src/jeerah/JeerahPrototype";
import assetManifest from "../../src/jeerah/assets/asset-manifest.json";
import { assetUrl } from "../../src/jeerah/assets/url";
import { createMemoryDemoRepository, type DemoRepository } from "../../src/jeerah/data/repository";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import {
  getBuildingScreen,
  getResidentScreen,
  getUnitScreen,
} from "../../src/jeerah/resident/ResidentApp";
import { MobileRuntime } from "../../src/mobile/MobileRuntime";
import { setTestViewport } from "../../src/test/browserShims";
import { renderResident, renderResidentAt } from "./helpers/renderDemo";

const prototypeRepositories = new Set<DemoRepository>();

/**
 * The protected FlowStack binds a use-gesture drag whose tap filter cancels
 * synthetic pointer clicks under jsdom. Real pointer input is unaffected, so
 * navigation is exercised with a direct activation instead.
 */
function tap(element: HTMLElement) {
  fireEvent.click(element);
}

function currentScreenId() {
  return within(screen.getByTestId("flow-current"))
    .getByTestId("resident-page-content")
    .getAttribute("data-resident-screen");
}

afterEach(() => {
  cleanup();
  prototypeRepositories.forEach((repository) => repository.close());
  prototypeRepositories.clear();
  window.history.replaceState({}, "", "/");
  setTestViewport(1024, 640);
});

describe("resident home and property journey", () => {
  it("shows the accepted Building 89 home hierarchy with the honest invoice and pulse", async () => {
    const view = renderResident({ locale: "en" });

    expect(await screen.findByRole("heading", { name: "Saifeldeen" })).toBeInTheDocument();
    const pulse = screen.getByRole("region", { name: "Community pulse" });
    expect(within(pulse).getByRole("button", { name: "Building 89" })).toBeInTheDocument();
    expect(within(pulse).getByText("Needs attention")).toBeInTheDocument();
    expect(within(pulse).getByText("71")).toBeInTheDocument();
    expect(within(pulse).getByText(/SAR\s*700\.00/)).toBeInTheDocument();
    expect(within(pulse).getByRole("button", { name: "View & pay" })).toBeEnabled();
    expect(screen.getByRole("heading", { name: "Quick actions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marketplace" })).toBeEnabled();
    expect(view.state.currentResidentId).toBe("resident-saif");
  });

  it("loads asynchronously in Arabic with real direction and no untranslated keys", async () => {
    renderResident({ locale: "ar" });

    const app = await screen.findByRole("application", { name: /Jeerah Smart demo/i });
    expect(app).toHaveAttribute("lang", "ar");
    expect(app).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { name: "سيف الدين" })).toBeInTheDocument();
    expect(screen.getByText("مبنى ٨٩")).toBeInTheDocument();
    expect(app).not.toHaveTextContent(/(?:nav|action|resident|empty)\.[a-z_]+/i);
  });

  it("pushes from Building 89 to Unit 1204 and exposes Back for both detail levels", async () => {
    renderResident({ locale: "en" });

    tap(await screen.findByRole("button", { name: "Building 89" }));
    expect(await screen.findByRole("heading", { name: "Building 89" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeVisible();

    tap(screen.getByRole("button", { name: /^Unit 1204/ }));
    expect(await screen.findByRole("heading", { name: "Unit 1204" })).toBeInTheDocument();
    expect(screen.getByText("Floor 12")).toBeInTheDocument();
    tap(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("heading", { name: "Building 89" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeVisible();
  });

  it("uses replace for root navigation and stable screen factories", async () => {
    expect(getResidentScreen("home")).toBe(getResidentScreen("home"));
    expect(getBuildingScreen("building-89")).toBe(getBuildingScreen("building-89"));
    expect(getUnitScreen("unit-89-1204")).toBe(getUnitScreen("unit-89-1204"));
    renderResident({ locale: "en" });

    tap(await screen.findByRole("button", { name: "Properties" }));
    await waitFor(() => expect(currentScreenId()).toBe("properties"));
    expect(screen.getByRole("button", { name: "Properties" })).toHaveAttribute("aria-current", "page");
    tap(screen.getByRole("button", { name: "Home" }));
    await waitFor(() => expect(currentScreenId()).toBe("home"));
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("renders at least three exact localized manifest images through base-aware URLs", async () => {
    renderResidentAt("building", { locale: "en" });
    expect(await screen.findByRole("heading", { name: "Building 89" })).toBeInTheDocument();
    const requiredIds = ["building-89-night", "building-89-day", "lobby"];

    for (const id of requiredIds) {
      const entry = assetManifest.find((item) => item.id === id);
      expect(entry).toBeDefined();
      const image = screen.getByRole("img", { name: entry!.alt.en });
      expect(image).toHaveAttribute("src", assetUrl(entry!.path));
    }
  });

  it("renders honest no-invoice and no-activity variants without crashing", async () => {
    const state = createSeedState();
    state.invoices = [];
    state.activities = [];
    renderResident({ locale: "en", state });

    expect(await screen.findByRole("heading", { name: "Saifeldeen" })).toBeInTheDocument();
    expect(screen.getByText("No expenses to show.")).toBeInTheDocument();
    expect(screen.getByText("No community updates yet.")).toBeInTheDocument();
  });

  it("keeps preview and direct resident surfaces single-mounted and coherent", async () => {
    const previewRepository = createMemoryDemoRepository({ ...createSeedState(), locale: "en" }, "resident-preview");
    prototypeRepositories.add(previewRepository);
    window.history.replaceState({}, "", "/?preview=1");
    const preview = render(<MobileRuntime><JeerahPrototype repository={previewRepository} /></MobileRuntime>);

    expect(await screen.findByRole("heading", { name: "Saifeldeen" })).toBeInTheDocument();
    expect(document.querySelectorAll("[data-resident-app]")).toHaveLength(1);
    expect(document.querySelector("#jeerah-resident-surface")).not.toBeInTheDocument();
    expect(document.querySelector(".phone-stage [data-resident-app]")).toBeInTheDocument();
    preview.unmount();

    const directRepository = createMemoryDemoRepository({ ...createSeedState(), locale: "en" }, "resident-direct");
    prototypeRepositories.add(directRepository);
    window.history.replaceState({}, "", "/?surface=app");
    localStorage.setItem("jeerah-demo-session", "active");
    render(<MobileRuntime><JeerahPrototype repository={directRepository} /></MobileRuntime>);

    expect(await screen.findByRole("heading", { name: "Saifeldeen" })).toBeInTheDocument();
    expect(document.querySelectorAll("[data-resident-app]")).toHaveLength(1);
    expect(document.querySelector("#jeerah-resident-surface [data-resident-app]")).toBeInTheDocument();
    expect(document.querySelector(".phone-stage [data-resident-app]")).not.toBeInTheDocument();
  });

  it("provides footer clearance, five-item semantic navigation, and a reduced-motion branch at 320px", async () => {
    setTestViewport(320, 640);
    renderResident({ locale: "en" });

    const app = await screen.findByRole("application", { name: /Jeerah Smart demo/i });
    expect(app).toHaveAttribute("data-reduced-motion", "true");
    expect(app.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const navigation = screen.getByRole("navigation", { name: "Jeerah Smart" });
    expect(within(navigation).getAllByRole("button")).toHaveLength(5);
    expect(screen.getByTestId("resident-page-content")).toHaveClass("resident-page-content--footer-clearance");
  });
});
