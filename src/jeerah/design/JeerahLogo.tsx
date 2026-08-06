import type { CSSProperties } from "react";
import type { Locale } from "../domain/models";
import { assetUrl } from "../assets/url";
import { BrandFontFaces } from "./BrandFontFaces";

// The official horizontal lockups ship on a full 1400x1106.75 Deep Nexus
// canvas where the lockup itself occupies only a central horizontal band.
// Rendering the whole file small makes the lockup unreadable, and the
// official files must not be edited, so the component shows the lockup
// through a measured crop window instead. `art` is the measured artwork
// bounding box inside each official file, in viewBox units.
const VIEWBOX_WIDTH = 1400;
const VIEWBOX_HEIGHT = 1106.75;
const CROP_PADDING_RATIO = 0.12;

const logoFiles = {
  ar: {
    dark: { file: "horizontal-logo-2.svg", art: { x: 107.6, y: 331.2, width: 1152, height: 341.6 } },
    light: { file: "horizontal-logo-4.svg", art: { x: 120.1, y: 331.2, width: 1137.2, height: 341.6 } },
  },
  en: {
    dark: { file: "horizontal-logo-1.svg", art: { x: 108.7, y: 385.7, width: 1166.6, height: 248.3 } },
    light: { file: "horizontal-logo-3.svg", art: { x: 124, y: 385.7, width: 1149.8, height: 248.3 } },
  },
} as const;

export function JeerahLogo({
  locale,
  background,
  height = 34,
}: {
  locale: Locale;
  background: "dark" | "light";
  height?: number;
}) {
  const { file, art } = logoFiles[locale][background];
  const label = locale === "ar" ? "Jeerah Smart جيرة سمارت" : "Jeerah Smart";

  const padding = art.height * CROP_PADDING_RATIO;
  const crop = {
    x: Math.max(0, art.x - padding),
    y: Math.max(0, art.y - padding),
    width: Math.min(VIEWBOX_WIDTH, art.x + art.width + padding) - Math.max(0, art.x - padding),
    height: Math.min(VIEWBOX_HEIGHT, art.y + art.height + padding) - Math.max(0, art.y - padding),
  };
  const scale = height / crop.height;

  const windowStyle: CSSProperties = {
    position: "relative",
    display: "inline-block",
    overflow: "hidden",
    height,
    width: Math.round(crop.width * scale),
    borderRadius: Math.round(height / 5),
    flexShrink: 0,
  };
  // Physical offsets: the crop geometry is intrinsic to the file, so it is
  // identical in RTL and LTR.
  const imageStyle: CSSProperties = {
    position: "absolute",
    left: -(crop.x * scale),
    top: -(crop.y * scale),
    width: VIEWBOX_WIDTH * scale,
    height: VIEWBOX_HEIGHT * scale,
    maxWidth: "none",
    display: "block",
  };

  return (
    <>
      <BrandFontFaces />
      <span style={windowStyle}>
        <img src={assetUrl(`brand/logos/${file}`)} alt={label} style={imageStyle} />
      </span>
    </>
  );
}
