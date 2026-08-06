import { useCallback, useEffect, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallPlatform = "ios" | "android" | "desktop";

export interface InstallPromptState {
  canInstall: boolean;
  isInstalled: boolean;
  platform: InstallPlatform;
  prompt(): Promise<"accepted" | "dismissed" | "unavailable">;
}

export function detectInstallPlatform(userAgent = navigator.userAgent): InstallPlatform {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

/** Captures the browser install prompt and the installed state for the demo. */
export function useInstallPrompt(): InstallPromptState {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (!installEvent) return "unavailable" as const;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstallEvent(null);
    return choice.outcome;
  }, [installEvent]);

  return { canInstall: installEvent !== null, isInstalled, platform: detectInstallPlatform(), prompt };
}
