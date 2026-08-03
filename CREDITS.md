# Jeerah Smart Asset Credits

## Official Jeerah identity

The logos, marks, patterns, application icon, and font source files in this demo come from the supplied official Jeerah brand archive. Only the web-ready variants listed in `src/jeerah/assets/brand-manifest.json` ship with the demo.

- `BG1.png` was cropped by one right-edge pixel, without resampling, to correct its 2001×2000 canvas to 2000×2000.
- The six favicon PNGs were rasterized from the official dark and light mark SVGs at exact 16×16, 32×32, and 64×64 sizes. The archive's nominal x32 and x64 PNGs were not used because their actual dimensions are 33×33 and 65×65.
- The opaque 512×512 Android application icon was preserved unchanged. The 192×192 application icon and 180×180 Apple touch icon were resized proportionally from that approved master.
- Plus Jakarta Sans, Montserrat, and Readex Pro are distributed under their respective SIL Open Font License files in `public/brand/fonts/`. Their variable sources were converted to WOFF2 without subsetting.

Excluded archive material includes the duplicate Android icon, iOS icons, alternate transparent pattern, zero-byte alternate-logo file, PDFs, mockups, AI/EPS sources, and JPG/PNG logo variants.

## Payment marks

- Apple Pay and Visa paths are supplied by the project dependency [Simple Icons](https://simpleicons.org/).
- The mada SVG is the official mark downloaded from [mada.com.sa](https://www.mada.com.sa/sites/mada/files/inline-images/logo.svg) and visually inspected on 2026-08-03. It is stored unchanged at `public/brands/mada.svg`.

## Content photography

The 18 property, apartment, amenity, and service images were generated as independent, unbranded, photorealistic images with OpenAI ImageGen on 2026-08-03. Each PNG master remains outside `public/`; only the approved single-conversion WebP at quality 82 ships. The exact filenames, bilingual alternative text, ratios, hashes, and provenance are recorded in `src/jeerah/assets/asset-manifest.json`.
