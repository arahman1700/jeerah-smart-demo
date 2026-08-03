import { assetUrl } from "../assets/url";

export function BrandFontFaces() {
  const readex = assetUrl("brand/fonts/readex-pro-variable.woff2");
  const jakarta = assetUrl("brand/fonts/plus-jakarta-sans-variable.woff2");
  const montserrat = assetUrl("brand/fonts/montserrat-variable.woff2");

  return (
    <style data-jeerah-brand-fonts>{`
      @font-face {
        font-family: "Readex Pro";
        src: url("${readex}") format("woff2");
        font-display: swap;
        font-style: normal;
        font-weight: 200 700;
      }
      @font-face {
        font-family: "Plus Jakarta Sans";
        src: url("${jakarta}") format("woff2");
        font-display: swap;
        font-style: normal;
        font-weight: 200 800;
      }
      @font-face {
        font-family: Montserrat;
        src: url("${montserrat}") format("woff2");
        font-display: swap;
        font-style: normal;
        font-weight: 100 900;
      }
    `}</style>
  );
}
