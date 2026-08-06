import type { PropsWithChildren } from "react";
import { MobileScroll } from "../../../mobile/MobileScroll";

/** SAR amounts, masked digits, and demo references stay LTR inside RTL copy. */
export function Ltr({ children, testId }: PropsWithChildren<{ testId?: string }>) {
  return <bdi dir="ltr" className="jeerah-ltr" data-testid={testId}>{children}</bdi>;
}

/** Shared scroll shell so every resident route reports the same screen contract. */
export function ResidentPage({ screen, footerClearance = false, children }: PropsWithChildren<{
  screen: string;
  footerClearance?: boolean;
}>) {
  return (
    <MobileScroll className="resident-mobile-page">
      <div
        className={`resident-page-content resident-page-content--padded${footerClearance ? " resident-page-content--footer-clearance" : ""}`}
        data-testid="resident-page-content"
        data-resident-screen={screen}
      >
        {children}
      </div>
    </MobileScroll>
  );
}
