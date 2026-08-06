import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { setTestViewport } from "../../src/test/browserShims";
import { visitorQrValue } from "../../src/jeerah/resident/pages/VisitorPassPage";
import { renderResidentAt, tap } from "./helpers/renderDemo";

afterEach(() => setTestViewport(1024, 640));

const chooseRadio = (name: RegExp | string) => fireEvent.click(screen.getByRole("radio", { name }));

/** FlowStack keeps pushed screens mounted, so assertions scope to the top one. */
const current = () => within(screen.getByTestId("flow-current"));

describe("resident community", () => {
  it("shows only Building 89 announcements, polls, one event and three deals", async () => {
    renderResidentAt("community", { locale: "en" });

    expect(await screen.findByRole("heading", { name: "Community" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Building announcements" })).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByTestId("poll-poll-1")).toBeInTheDocument();
    expect(screen.getByTestId("poll-poll-2")).toBeInTheDocument();
    expect(screen.queryByTestId("poll-poll-3")).not.toBeInTheDocument();
    expect(screen.getByTestId("event-event-1")).toBeInTheDocument();
    expect(screen.queryByTestId("event-event-2")).not.toBeInTheDocument();
    for (const dealId of ["deal-hvac", "deal-facade", "deal-fragrance"]) {
      expect(screen.getByTestId(`deal-${dealId}`)).toBeInTheDocument();
    }
  });

  it("never names another resident, their unit, or how they voted", async () => {
    renderResidentAt("community", { locale: "en" });
    await screen.findByTestId("poll-poll-1");
    const page = current().getByTestId("resident-page-content");

    for (const secret of ["Lina Alharbi", "Omar Alotaibi", "resident-lina", "Apartment 202", "Apartment 303", "Noura Alsalem"]) {
      expect(page, secret).not.toHaveTextContent(secret);
    }
    expect(screen.getByTestId("deal-progress-deal-hvac")).toHaveTextContent("3 neighbors joined");
  });

  it("records a poll vote and reports participation", async () => {
    const view = renderResidentAt("community", { locale: "en" });
    await screen.findByRole("heading", { name: "Community" });

    tap(screen.getByTestId("poll-vote-poll-2"));
    expect(await screen.findByText("Choose one option to continue.")).toBeInTheDocument();

    chooseRadio(/7 PM/);
    tap(screen.getByTestId("poll-vote-poll-2"));

    expect(await screen.findByText("Participation recorded")).toBeInTheDocument();
    const poll = (await view.repository.load()).state.polls.find((item) => item.id === "poll-2")!;
    expect(poll.options.find((option) => option.id === "poll-2-7pm")?.voterIds).toContain("resident-saif");
    expect(screen.getByTestId("poll-mine-poll-2")).toBeInTheDocument();
  });

  it("records an event RSVP against the published capacity", async () => {
    const view = renderResidentAt("community", { locale: "en" });
    await screen.findByRole("heading", { name: "Community" });

    expect(screen.getByTestId("event-attendance-event-1")).toHaveTextContent("2 of 30 attending");
    tap(screen.getByTestId("event-rsvp-event-1"));

    expect(await screen.findByText("Your demo RSVP is recorded")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("event-attendance-event-1")).toHaveTextContent("3 of 30 attending"));
    expect((await view.repository.load()).state.events.find((item) => item.id === "event-1")?.attendeeIds).toContain("resident-saif");
  });

  it("moves the group HVAC price down at the fixed 4/8/12 thresholds", async () => {
    renderResidentAt("community", { locale: "en" });
    await screen.findByRole("heading", { name: "Community" });

    const deal = screen.getByTestId("deal-deal-hvac");
    expect(within(deal).getByTestId("deal-price-deal-hvac")).toHaveTextContent("180");
    expect(within(deal).getByText("1 more neighbors unlock SAR 150")).toBeInTheDocument();

    tap(within(deal).getByTestId("deal-join-deal-hvac"));

    await waitFor(() => expect(screen.getByTestId("deal-price-deal-hvac")).toHaveTextContent("150"));
    expect(screen.getByTestId("deal-join-deal-hvac")).toBeDisabled();
    expect(within(screen.getByTestId("deal-deal-fragrance")).getByText("Waiting for building approval")).toBeInTheDocument();
  });

  it("creates a labeled visitor QR that carries only demo, pass ID and expiry", async () => {
    const view = renderResidentAt("community", { locale: "en" });
    await screen.findByRole("heading", { name: "Community" });

    tap(screen.getByTestId("open-visitor"));
    await screen.findByRole("heading", { name: "Visitor passes" });
    expect(screen.getAllByRole("img", { name: "Visitor QR — demo only" })).toHaveLength(1);

    chooseRadio(/Khaled Rahim/);
    tap(screen.getByTestId("create-visitor-pass"));

    expect(await screen.findByText("Demo visitor pass created")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("img", { name: "Visitor QR — demo only" })).toHaveLength(2));

    const snapshot = (await view.repository.load()).state;
    const passes = snapshot.visitorPasses.filter((pass) => pass.residentId === "resident-saif");
    expect(passes).toHaveLength(2);
    for (const pass of passes) {
      expect(JSON.parse(visitorQrValue(pass))).toEqual({ demo: true, passId: pass.id, expiresAt: pass.expiresAt });
    }
    expect(current().getByTestId("resident-page-content")).not.toHaveTextContent("Saifeldeen");
  });

  it("books an amenity slot and refuses a conflicting one", async () => {
    const view = renderResidentAt("community", { locale: "en" });
    await screen.findByRole("heading", { name: "Community" });

    tap(screen.getByTestId("open-amenities"));
    await screen.findByRole("heading", { name: "Amenities" });

    const gym = screen.getByTestId("amenity-amenity-building-89-gym");
    fireEvent.click(within(gym).getAllByRole("radio")[2]);
    tap(within(gym).getByTestId("book-amenity-building-89-gym"));

    expect(await screen.findByText("Demo amenity booking created")).toBeInTheDocument();
    const snapshot = (await view.repository.load()).state;
    expect(snapshot.amenityBookings.filter((booking) => booking.residentId === "resident-saif")).toHaveLength(3);

    // The resident already holds the 18:00 gym slot from the seed.
    fireEvent.click(within(gym).getAllByRole("radio")[1]);
    tap(within(gym).getByTestId("book-amenity-building-89-gym"));
    expect(await screen.findByText("You already hold this demo slot.")).toBeInTheDocument();
    expect((await view.repository.load()).state.amenityBookings.filter((booking) => booking.residentId === "resident-saif")).toHaveLength(3);
  });

  it("blocks community mutations offline with an actionable message", async () => {
    const state = createSeedState();
    state.scenario = "offline";
    const view = renderResidentAt("community", { locale: "en", state });

    await screen.findByRole("heading", { name: "Community" });
    expect(screen.getByTestId("poll-poll-2")).toBeInTheDocument();

    chooseRadio(/7 PM/);
    tap(screen.getByTestId("poll-vote-poll-2"));

    expect(await screen.findByText(/demo is offline, so bookings and votes are paused/i)).toBeInTheDocument();
    const poll = (await view.repository.load()).state.polls.find((item) => item.id === "poll-2")!;
    expect(poll.options.every((option) => !option.voterIds.includes("resident-saif"))).toBe(true);
  });

  it("keeps the Arabic community screen readable at 320px with no raw keys", async () => {
    setTestViewport(320, 640);
    renderResidentAt("community", { locale: "ar" });

    const app = await screen.findByRole("application", { name: /Jeerah Smart demo/i });
    expect(app).toHaveAttribute("dir", "rtl");
    expect(app.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    expect(app).not.toHaveTextContent(/(?:community|deal|visitor|amenity|poll|event)\.[a-z_]+/i);
    expect(screen.getByRole("heading", { name: "المجتمع" })).toBeInTheDocument();
  });
});
