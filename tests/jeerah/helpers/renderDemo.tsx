import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { MobileRuntime } from "../../../src/mobile/MobileRuntime";

export function renderDemo(ui: ReactElement, options?: RenderOptions) {
  return render(<MobileRuntime>{ui}</MobileRuntime>, options);
}
