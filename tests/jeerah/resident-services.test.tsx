import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import assetManifest from "../../src/jeerah/assets/asset-manifest.json";
import { createMemoryDemoRepository, type DemoRepository } from "../../src/jeerah/data/repository";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import type { DemoState } from "../../src/jeerah/domain/models";
import { setTestViewport } from "../../src/test/browserShims";
import { renderResidentAt, tap } from "./helpers/renderDemo";

const peers = new Set<DemoRepository>();

/** FlowStack keeps pushed screens mounted, so assertions scope to the top one. */
const current = () => within(screen.getByTestId("flow-current"));

function seedIn(locale: "ar" | "en") {
  const state = createSeedState();
  state.locale = locale;
  return state;
}

afterEach(() => {
  peers.forEach((repository) => repository.close());
  peers.clear();
  setTestViewport(1024, 640);
});

function search(value: string) {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value } });
}

/** Opens a catalog card, its detail screen, and its booking screen. */
async function openBooking(serviceKey: string) {
  tap(await screen.findByTestId(`service-card-${serviceKey}`));
  tap(await screen.findByTestId("service-next-action"));
  return screen.findByTestId("book-submit");
}

function chooseRadio(name: RegExp | string) {
  fireEvent.click(screen.getByRole("radio", { name }));
}

describe("resident services journeys", () => {
  it("leads with search, the live order, subscriber exclusives and eight families", async () => {
    renderResidentAt("marketplace", { locale: "en" });

    expect(await screen.findByRole("heading", { name: "Marketplace" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByTestId("active-order")).toBeInTheDocument();

    const exclusives = screen.getByTestId("subscriber-exclusives");
    expect(within(exclusives).getAllByText(/Save \d+%/)).toHaveLength(7);
    expect(exclusives.querySelectorAll("[data-testid^='offer-member-offer-']")).toHaveLength(7);
    expect(within(exclusives).getByText(/browsing as a non-subscriber/i)).toBeInTheDocument();

    const families = screen.getByRole("region", { name: "Service families" });
    expect(within(families).getAllByRole("button")).toHaveLength(8);
  });

  it("reaches every one of the 35 offerings through its family with a live next action", { timeout: 60_000 }, async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });

    for (const family of view.state.serviceFamilies) {
      tap(screen.getByTestId(`family-tile-${family.id}`));
      const services = view.state.serviceOfferings.filter((service) => service.familyId === family.id);
      for (const service of services) {
        expect(await screen.findByTestId(`service-card-${service.key}`), service.key).toBeInTheDocument();
      }
      tap(screen.getByTestId(`service-card-${services[0].key}`));
      expect(await screen.findByTestId("service-next-action"), services[0].key).toBeEnabled();
      tap(screen.getByRole("button", { name: "Back" }));
      await screen.findByTestId(`service-card-${services[0].key}`);
      tap(screen.getByRole("button", { name: "Back" }));
      await screen.findByRole("heading", { name: "Marketplace" });
    }
  });

  it("books an on-demand HVAC visit and lands on its confirmed timeline", async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });
    search("hvac");

    tap(await openBooking("hvac-maintenance"));

    expect(await screen.findByTestId("order-status")).toHaveTextContent("Confirmed");
    expect(screen.getByTestId("order-eta")).toHaveTextContent(/no live GPS/i);
    const snapshot = (await view.repository.load()).state;
    const created = snapshot.orders.find((order) => order.id.startsWith("order-") && order.serviceId === "service-hvac-maintenance" && order.residentId === "resident-saif" && order.status === "confirmed");
    expect(created).toBeDefined();
    expect(created!.amount).toBe(180);
    expect(created!.timeline).toHaveLength(1);
  });

  it("books a scheduled delivery inside a future window", async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });
    search("produce");

    const submit = await openBooking("produce-delivery");
    chooseRadio(/Aug 6, 2026/);
    tap(submit);

    expect(await screen.findByTestId("order-status")).toHaveTextContent("Scheduled");
    const created = (await view.repository.load()).state.orders.find((order) => order.serviceId === "service-produce-delivery" && order.residentId === "resident-saif");
    expect(created?.scheduledAt).toBe("2026-08-06T10:00:00+03:00");
  });

  it("starts a recurring plan and its first scheduled order together", async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });
    search("home cleaning");

    const submit = await openBooking("home-cleaning");
    chooseRadio("Recurring");
    chooseRadio("Weekly");
    tap(submit);

    expect(await screen.findByTestId("order-status")).toHaveTextContent("Scheduled");
    const snapshot = (await view.repository.load()).state;
    expect(snapshot.recurringPlans).toHaveLength(6);
    const plan = snapshot.recurringPlans.at(-1)!;
    expect(plan.cadence).toBe("weekly");
    expect(snapshot.orders.some((order) => order.planId === plan.id)).toBe(true);
  });

  it("requests a quote with sample photos and never fabricates a final amount", async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });
    search("مظلات");

    const submit = await openBooking("awning-installation");
    expect(screen.getByTestId("quote-notice")).toHaveTextContent(/No final amount/i);
    expect(screen.getByText(/never uploads a real file/i)).toBeInTheDocument();
    tap(submit);

    expect(await screen.findByTestId("order-status")).toHaveTextContent("Awaiting quote");
    expect(screen.queryByTestId("order-amount")).not.toBeInTheDocument();
    const created = (await view.repository.load()).state.orders.find((order) => order.serviceId === "service-awning-installation" && order.residentId === "resident-saif" && order.status === "awaiting-quote");
    expect(created?.amount).toBeUndefined();
    expect(created?.sampleImageIds?.length).toBeGreaterThan(0);
  });

  it("opens a group deal at the fourth neighbor and books the group tier", async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });
    search("hvac");

    tap(await screen.findByTestId("service-card-hvac-maintenance"));
    expect(await screen.findByTestId("deal-progress-deal-hvac")).toHaveTextContent("3 neighbors joined");
    tap(screen.getByTestId("deal-join-deal-hvac"));
    await waitFor(() => expect(screen.getByTestId("deal-progress-deal-hvac")).toHaveTextContent("4 neighbors joined"));
    expect(screen.getByTestId("deal-price-deal-hvac")).toHaveTextContent("150");

    tap(screen.getByTestId("service-next-action"));
    const submit = await screen.findByTestId("book-submit");
    chooseRadio("Group service");
    chooseRadio(/Aug 6, 2026/);
    tap(submit);

    expect(await screen.findByTestId("order-status")).toHaveTextContent("Scheduled");
    const created = (await view.repository.load()).state.orders.find((order) => order.dealId === "deal-hvac" && order.residentId === "resident-saif");
    expect(created?.amount).toBe(150);
  });

  it("compares providers side by side and books the chosen one", async () => {
    renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });
    search("hvac");

    tap(await screen.findByTestId("service-card-hvac-maintenance"));
    tap(await screen.findByTestId("open-compare"));

    const table = await screen.findByTestId("provider-comparison");
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByRole("rowheader", { name: /Coolair Climate Care/ })).toBeInTheDocument();

    tap(screen.getByTestId("compare-choose-provider-nasma-hvac"));
    expect(await screen.findByTestId("book-submit")).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Nasma HVAC/ })).toBeChecked();
  });

  it("shows the complete maintenance story and records a five-star rating", async () => {
    const view = renderResidentAt("orders", { locale: "en" });

    tap(await screen.findByTestId("order-row-order-1"));
    const story = await screen.findByTestId("maintenance-story");
    expect(within(story).getByText("Before")).toBeInTheDocument();
    expect(within(story).getByText("After")).toBeInTheDocument();
    expect(within(story).getByText(/Abu Mohammed/)).toBeInTheDocument();
    expect(within(story).getByText(/60-day demo warranty/)).toBeInTheDocument();
    expect(within(story).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByTestId("order-payment-status")).toHaveTextContent("Paid");

    tap(within(story).getByTestId("rate-5"));
    expect(await screen.findByText("Demo rating saved: 5 of 5")).toBeInTheDocument();
    expect((await view.repository.load()).state.orders.find((order) => order.id === "order-1")?.rating).toBe(5);
  });

  it("approves a demo quote and moves the order to scheduled", async () => {
    const view = renderResidentAt("orders", { locale: "en" });

    tap(await screen.findByTestId("order-row-order-13"));
    expect(await screen.findByTestId("order-quote-amount")).toHaveTextContent("2,400");
    tap(screen.getByTestId("approve-quote"));

    await waitFor(() => expect(screen.getByTestId("order-status")).toHaveTextContent("Scheduled"));
    expect((await view.repository.load()).state.orders.find((order) => order.id === "order-13")?.amount).toBe(2400);
  });

  it("unlocks member pricing through the labeled demo upgrade path", async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });

    tap(screen.getByTestId("open-offers"));
    const card = await screen.findByTestId("offer-detail-member-offer-1");
    expect(within(card).getByText("Was")).toBeInTheDocument();
    expect(within(card).getByText(/Save 25%/)).toBeInTheDocument();
    expect(within(card).getByText(/one order per month/i)).toBeInTheDocument();
    expect(within(card).getByText("Coolair Climate Care")).toBeInTheDocument();

    tap(screen.getByTestId("upgrade-membership"));
    expect(await screen.findByTestId("membership-active")).toBeInTheDocument();
    expect((await view.repository.load()).state.residents.find((resident) => resident.id === "resident-saif")?.subscriber).toBe(true);

    tap(screen.getByTestId("offer-open-member-offer-1"));
    tap(await screen.findByTestId("service-next-action"));
    expect(await screen.findByTestId("book-total")).toHaveTextContent("135");
  });

  it("pauses, resumes and skips a recurring plan", async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });

    tap(screen.getByRole("button", { name: "Manage recurring plans" }));
    expect(await screen.findByTestId("plan-status-plan-1")).toHaveTextContent("Active");

    tap(screen.getByTestId("plan-toggle-plan-1"));
    await waitFor(() => expect(screen.getByTestId("plan-status-plan-1")).toHaveTextContent("Paused"));
    tap(screen.getByTestId("plan-toggle-plan-1"));
    await waitFor(() => expect(screen.getByTestId("plan-status-plan-1")).toHaveTextContent("Active"));

    tap(screen.getByTestId("plan-skip-plan-1"));
    expect(await screen.findByTestId("plan-skipped-plan-1")).toBeInTheDocument();
    expect((await view.repository.load()).state.recurringPlans[0].skippedDates).toHaveLength(1);
  });

  it("gifts a neighbor without exposing any resident directory", async () => {
    const view = renderResidentAt("marketplace", { locale: "en" });
    await screen.findByRole("heading", { name: "Marketplace" });

    tap(screen.getByRole("button", { name: "Gift a neighbor" }));
    await screen.findByRole("heading", { name: "Gift a neighbor" });

    tap(screen.getByTestId("send-gift"));
    expect(await screen.findByText("Choose who receives this demo gift.")).toBeInTheDocument();

    chooseRadio(/Neighbor on your floor/);
    tap(screen.getByTestId("send-gift"));
    expect(await screen.findByText("Demo gift sent")).toBeInTheDocument();

    const page = current().getByTestId("resident-page-content");
    for (const name of ["Lina Alharbi", "Omar Alotaibi", "Apartment 202", "Apartment 303"]) {
      expect(page).not.toHaveTextContent(name);
    }
    expect((await view.repository.load()).state.gifts.filter((gift) => gift.senderId === "resident-saif")).toHaveLength(2);
  });

  it("receives a cross-repository status change while the timeline stays open", async () => {
    const channelName = `services-live-${Math.random()}`;
    const repository = createMemoryDemoRepository(seedIn("en"), channelName);
    const peer = createMemoryDemoRepository(seedIn("en"), channelName);
    peers.add(repository);
    peers.add(peer);
    renderResidentAt("orders", { locale: "en", repository });

    tap(await screen.findByTestId("order-row-order-4"));
    expect(await screen.findByTestId("order-status")).toHaveTextContent("En route");

    await peer.dispatch({ type: "order/status-changed", orderId: "order-4", status: "in-progress", occurredAt: "2026-08-03T13:00:00+03:00" });

    await waitFor(() => expect(screen.getByTestId("order-status")).toHaveTextContent("In progress"));
  });

  it("keeps browsing alive offline while refusing the booking mutation", async () => {
    const state = createSeedState();
    state.scenario = "offline";
    renderResidentAt("marketplace", { locale: "en", state });

    await screen.findByRole("heading", { name: "Marketplace" });
    search("hvac");
    const submit = await openBooking("hvac-maintenance");
    expect(screen.getByTestId("offline-notice")).toBeInTheDocument();

    tap(submit);
    expect(await screen.findByText(/demo is offline, so bookings and votes are paused/i)).toBeInTheDocument();
    expect(screen.getByTestId("book-submit")).toBeInTheDocument();
  });

  it("shows a missing-entity state when a nested route outlives its record", async () => {
    const channelName = `services-reset-${Math.random()}`;
    const state = seedIn("en");
    const extra = structuredClone(state.orders.find((order) => order.id === "order-4")!);
    extra.id = "order-temporary";
    state.orders = [...state.orders, extra];
    const repository = createMemoryDemoRepository(state, channelName);
    const peer = createMemoryDemoRepository(structuredClone(state) as DemoState, channelName);
    peers.add(repository);
    peers.add(peer);
    renderResidentAt("orders", { locale: "en", repository });

    tap(await screen.findByTestId("order-row-order-temporary"));
    await screen.findByTestId("order-status");

    await peer.dispatch({ type: "demo/reset" });

    expect(await screen.findByTestId("missing-entity")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "رجوع" })).toBeVisible();
  });

  it("renders Arabic RTL copy, exact image alts, and no raw keys at 320px", async () => {
    setTestViewport(320, 640);
    renderResidentAt("marketplace", { locale: "ar" });

    const app = await screen.findByRole("application", { name: /Jeerah Smart demo/i });
    expect(app).toHaveAttribute("dir", "rtl");
    expect(app).toHaveAttribute("data-reduced-motion", "true");
    expect(app.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    expect(app).not.toHaveTextContent(/(?:nav|action|market|service|book|offer|deal|error)\.[a-z_]+/i);

    search("مكيف");
    tap(await screen.findByTestId("service-card-hvac-maintenance"));

    const entry = assetManifest.find((item) => item.id === "hvac-technician")!;
    expect(await screen.findByRole("img", { name: entry.alt.ar })).toBeInTheDocument();
    const passport = current().getByTestId("service-passport-hvac-maintenance");
    expect(within(passport).getByRole("heading", { level: 1 })).toHaveTextContent("صيانة وتنظيف المكيفات");
    expect(current().getByTestId("resident-page-content")).toHaveClass("resident-page-content--footer-clearance");
  });

  it("declares comfortable touch targets for the new service controls", () => {
    const css = readFileSync(resolve(process.cwd(), "src/prototype.css"), "utf8");
    for (const rule of [
      /\.resident-rating-button \{[^}]*min-width: 44px;[^}]*min-height: 44px;/,
      /\.resident-quantity button \{[^}]*min-width: 44px;[^}]*min-height: 44px;/,
      /\.resident-search \{[^}]*min-height: 48px;/,
      /\.resident-compare-scroll \{[^}]*overflow-x: auto;/,
    ]) {
      expect(css).toMatch(rule);
    }
  });
});
