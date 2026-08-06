import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  installAnimationFrameShim,
  installMatchMediaShim,
  installObjectUrlAndPrintShims,
  installPointerAndScrollShims,
  installResizeObserverShim,
  installServiceWorkerShim,
  installStorageShim,
} from "./browserShims";

installMatchMediaShim();
installResizeObserverShim({ width: 1024, height: 640 });
installPointerAndScrollShims();
installAnimationFrameShim();
installObjectUrlAndPrintShims();
installServiceWorkerShim();
installStorageShim();

afterEach(() => {
  try {
    localStorage.clear();
  } catch {
    // The storage shim is always present in tests; guard for safety.
  }
});
