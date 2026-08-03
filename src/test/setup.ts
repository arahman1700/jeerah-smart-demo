import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import {
  installAnimationFrameShim,
  installMatchMediaShim,
  installObjectUrlAndPrintShims,
  installPointerAndScrollShims,
  installResizeObserverShim,
  installServiceWorkerShim,
} from "./browserShims";

installMatchMediaShim();
installResizeObserverShim({ width: 1024, height: 640 });
installPointerAndScrollShims();
installAnimationFrameShim();
installObjectUrlAndPrintShims();
installServiceWorkerShim();
