import type { Locale } from "../domain/models";
import { assetUrl } from "../assets/url";
import { BrandFontFaces } from "./BrandFontFaces";

const logoFiles = {
  ar: { dark: "horizontal-logo-2.svg", light: "horizontal-logo-4.svg" },
  en: { dark: "horizontal-logo-1.svg", light: "horizontal-logo-3.svg" },
} as const;

export function JeerahLogo({ locale, background }: { locale: Locale; background: "dark" | "light" }) {
  const filename = logoFiles[locale][background];
  const label = locale === "ar" ? "Jeerah Smart جيرة سمارت" : "Jeerah Smart";

  return (
    <>
      <BrandFontFaces />
      <img src={assetUrl(`brand/logos/${filename}`)} alt={label} />
    </>
  );
}
