/**
 * Registers the base-scoped service worker generated into the build output.
 * Never registers `/sw.js` from the domain root — GitHub Pages serves this
 * demo from a sub-path, so both URL and scope come from BASE_URL.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  } catch {
    // The worker only exists in built output; a missing sw.js is not an error.
    return null;
  }
}
