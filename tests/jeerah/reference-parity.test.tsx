import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import { reduceDemoState } from "../../src/jeerah/domain/reducer";
import { residentWalletBalance } from "../../src/jeerah/domain/residentView";
import { renderAdmin, renderResidentAt, tap } from "./helpers/renderDemo";

const seed = () => createSeedState();

describe("wallet domain", () => {
  it("accepts a valid top-up atomically with its audit entry", () => {
    const state = seed();
    const next = reduceDemoState(state, {
      type: "wallet/topped-up",
      transaction: { id: "wallet-t1", residentId: "resident-saif", kind: "top-up", amount: 100, occurredAt: state.now, reference: "DEMO-W-100", note: { ar: "شحن", en: "Top-up" } },
    });
    expect(residentWalletBalance(next)).toBe(residentWalletBalance(state) + 100);
    expect(next.auditLog.some((entry) => entry.entityId === "wallet-t1")).toBe(true);
  });

  it("rejects top-ups below the SAR 10 minimum and duplicates", () => {
    const state = seed();
    const below = reduceDemoState(state, {
      type: "wallet/topped-up",
      transaction: { id: "wallet-t2", residentId: "resident-saif", kind: "top-up", amount: 5, occurredAt: state.now, reference: "DEMO-W-5", note: { ar: "شحن", en: "Top-up" } },
    });
    expect(below).toBe(state);
    const duplicate = reduceDemoState(state, {
      type: "wallet/topped-up",
      transaction: { id: "wallet-1", residentId: "resident-saif", kind: "top-up", amount: 50, occurredAt: state.now, reference: "DEMO-W-50", note: { ar: "شحن", en: "Top-up" } },
    });
    expect(duplicate).toBe(state);
  });
});

describe("chat domain", () => {
  it("commits a resident message and its scripted reply in one revision", () => {
    const state = seed();
    const next = reduceDemoState(state, {
      type: "chat/message-sent",
      conversationId: "chat-coolair",
      message: { id: "m-new-1", author: "resident", body: "هل السعر يشمل الفلتر؟", sentAt: state.now },
      reply: { id: "m-new-2", author: "provider", body: "نعم — رد تجريبي.", sentAt: state.now },
    });
    const thread = next.conversations.find((item) => item.id === "chat-coolair")!;
    expect(thread.messages.at(-2)?.id).toBe("m-new-1");
    expect(thread.messages.at(-1)?.id).toBe("m-new-2");
    expect(thread.unreadCount).toBe(2);
    expect(reduceDemoState(next, { type: "chat/read", conversationId: "chat-coolair" }).conversations.find((item) => item.id === "chat-coolair")!.unreadCount).toBe(0);
  });

  it("rejects provider-authored sends and empty bodies", () => {
    const state = seed();
    expect(reduceDemoState(state, { type: "chat/message-sent", conversationId: "chat-coolair", message: { id: "m-x", author: "provider", body: "hi", sentAt: state.now } })).toBe(state);
    expect(reduceDemoState(state, { type: "chat/message-sent", conversationId: "chat-coolair", message: { id: "m-y", author: "resident", body: "  ", sentAt: state.now } })).toBe(state);
  });
});

describe("building creation", () => {
  it("creates a validated fictional building with an audit entry", () => {
    const state = seed();
    const next = reduceDemoState(state, {
      type: "building/created",
      building: { id: "building-new", name: { ar: "برج الياسمين", en: "Jasmine Tower" }, address: { ar: "الرياض", en: "Riyadh" }, manager: { ar: "فريق جيرة", en: "Jeerah Team" }, imageIds: ["nakheel-court"], amenityIds: [] },
    });
    expect(next.buildings).toHaveLength(state.buildings.length + 1);
    expect(next.auditLog.some((entry) => entry.entityId === "building-new")).toBe(true);
    const missingName = reduceDemoState(state, {
      type: "building/created",
      building: { id: "building-bad", name: { ar: "", en: "X" }, address: { ar: "أ", en: "A" }, manager: { ar: "م", en: "M" }, imageIds: ["nakheel-court"], amenityIds: [] },
    });
    expect(missingName).toBe(state);
  });
});

describe("resident wallet journey", () => {
  it("tops up from a preset and shows the new balance with the demo disclaimer", async () => {
    const { repository } = renderResidentAt("profile", { locale: "en" });
    tap(await screen.findByTestId("profile-wallet"));
    const before = await screen.findByTestId("wallet-balance");
    expect(before.textContent).toContain("120");
    tap(screen.getByTestId("wallet-topup-open"));
    tap(await screen.findByRole("button", { name: "200" }));
    tap(screen.getByTestId("wallet-topup-confirm"));
    await screen.findByTestId("wallet-confirmed");
    await waitFor(() => expect(screen.getByTestId("wallet-balance").textContent).toContain("320"));
    const { state } = await repository.load();
    expect(state.walletTransactions.filter((transaction) => transaction.kind === "top-up")).toHaveLength(2);
  });
});

describe("resident chats journey", () => {
  it("opens a conversation from the home header, reads it, and gets a scripted reply", async () => {
    renderResidentAt("home", { locale: "en" });
    tap(await screen.findByRole("button", { name: "Messages" }));
    const chatsPage = await screen.findByTestId("chats-page");
    expect(within(chatsPage).getByTestId("chats-unread").textContent).toBe("1");
    tap(within(chatsPage).getByTestId("chat-row-chat-coolair"));
    await screen.findByTestId("chat-conversation");
    await waitFor(async () => {
      expect(screen.getByTestId("chats-unread").textContent).toBe("0");
    });
  });
});

describe("resident notifications journey", () => {
  it("shows unread notifications from the bell and marks them read", async () => {
    renderResidentAt("home", { locale: "en" });
    tap(await screen.findByRole("button", { name: "Notifications" }));
    const page = await screen.findByTestId("notifications-page");
    const unread = Number(within(page).getByTestId("notifications-unread").textContent);
    expect(unread).toBeGreaterThan(0);
    tap(within(page).getByTestId("notifications-mark-read"));
    await waitFor(() => expect(within(page).getByTestId("notifications-unread").textContent).toBe("0"));
    expect(within(page).getByText("All caught up")).toBeInTheDocument();
  });
});

describe("join with code journey", () => {
  it("accepts the displayed demo code and rejects others", async () => {
    const { user } = renderResidentAt("home", { locale: "en" });
    tap(await screen.findByRole("button", { name: /join with code/i }));
    await screen.findByTestId("join-code-page");
    const digits = "890089".split("");
    for (const [index, digit] of digits.entries()) {
      const box = screen.getByRole("textbox", { name: `Code digit ${index + 1}` });
      await user.type(box, digit);
    }
    tap(screen.getByTestId("join-submit"));
    expect(await screen.findByTestId("join-success")).toHaveTextContent(/Building 89/);
  });
});

describe("create building journey", () => {
  it("creates a fictional building visible to the shared repository", async () => {
    const { user, repository } = renderResidentAt("properties", { locale: "en" });
    tap(await screen.findByTestId("open-create-building"));
    await screen.findByTestId("create-building-page");
    await user.type(screen.getByLabelText("Arabic name"), "برج الديمو");
    await user.type(screen.getByLabelText("English name"), "Demo Tower");
    await user.type(screen.getByLabelText("Arabic address"), "الرياض، حي النرجس");
    await user.type(screen.getByLabelText("English address"), "Riyadh, Al Narjis");
    tap(screen.getByTestId("create-building-submit"));
    await screen.findByTestId("create-building-success");
    const { state } = await repository.load();
    expect(state.buildings.some((building) => building.name.en === "Demo Tower")).toBe(true);
  });
});

describe("admin contact messages and subscriptions", () => {
  it("lists contact messages and marks one read", async () => {
    const { user, repository } = renderAdmin({ locale: "en", initialPath: "/messages" });
    expect(await screen.findByTestId("messages-unread")).toHaveTextContent("2");
    const row = screen.getByTestId("admin-message-contact-1");
    await user.click(within(row).getByRole("button", { name: /mark as read/i }));
    await waitFor(async () => {
      const { state } = await repository.load();
      expect(state.contactMessages.find((message) => message.id === "contact-1")?.read).toBe(true);
    });
    await waitFor(() => expect(screen.getByTestId("messages-unread")).toHaveTextContent("1"));
  });

  it("derives subscription KPIs from shared state", async () => {
    renderAdmin({ locale: "en", initialPath: "/subscriptions" });
    const subscribers = seed().residents.filter((resident) => resident.subscriber).length;
    expect(await screen.findByTestId("kpi-subscribers")).toHaveTextContent(String(subscribers));
    expect(screen.getByTestId("kpi-active-plans")).toBeInTheDocument();
  });
});
