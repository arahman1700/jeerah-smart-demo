import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { InstallPage } from "../../src/jeerah/pwa/InstallPage";
import { useInstallPrompt, type BeforeInstallPromptEvent } from "../../src/jeerah/pwa/useInstallPrompt";
import { registerServiceWorker } from "../../src/jeerah/pwa/registerServiceWorker";
import { I18nProvider } from "../../src/jeerah/i18n/I18nProvider";
import { DemoProvider } from "../../src/jeerah/data/DemoProvider";
import { createMemoryDemoRepository } from "../../src/jeerah/data/repository";
import { createSeedState } from "../../src/jeerah/domain/fixtures";
import type { Locale } from "../../src/jeerah/domain/models";

function renderInstall(ui: React.ReactElement, locale: Locale = "en") {
  const state = createSeedState();
  state.locale = locale;
  const repository = createMemoryDemoRepository(state, `pwa-${Math.random()}`);
  return render(
    <DemoProvider repository={repository}>
      <I18nProvider>{ui}</I18nProvider>
    </DemoProvider>,
  );
}

function fakePromptEvent(outcome: "accepted" | "dismissed"): BeforeInstallPromptEvent {
  const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
  Object.assign(event, {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome, platform: "web" }),
  });
  return event;
}

describe("useInstallPrompt", () => {
  it("captures beforeinstallprompt and resolves the user choice", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
    act(() => {
      window.dispatchEvent(fakePromptEvent("accepted"));
    });
    expect(result.current.canInstall).toBe(true);
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.prompt();
    });
    expect(outcome).toBe("accepted");
  });

  it("reports unavailable when no prompt was captured", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.prompt();
    });
    expect(outcome).toBe("unavailable");
  });

  it("marks installed after appinstalled", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(result.current.isInstalled).toBe(true);
  });
});

describe("InstallPage", () => {
  it("shows iOS Share → Add to Home Screen guidance when no native prompt exists", async () => {
    renderInstall(<InstallPage platformOverride="ios" />);
    expect(await screen.findByText(/share/i)).toBeInTheDocument();
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
  });

  it("shows the Android install path in Arabic without raw keys", async () => {
    renderInstall(<InstallPage platformOverride="android" />, "ar");
    expect(await screen.findByText(/أندرويد/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/install\.[a-z_]+/);
  });
});

describe("registerServiceWorker", () => {
  it("returns null quietly when service workers are unsupported", async () => {
    await expect(registerServiceWorker()).resolves.toBeNull();
  });

  it("registers the base-scoped worker when supported", async () => {
    const register = vi.fn().mockResolvedValue({ scope: "/jeerah-smart-demo/" });
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
    await registerServiceWorker();
    expect(register).toHaveBeenCalledWith(expect.stringMatching(/sw\.js$/), { scope: import.meta.env.BASE_URL });
    // @ts-expect-error test cleanup of the injected stub
    delete navigator.serviceWorker;
  });
});
