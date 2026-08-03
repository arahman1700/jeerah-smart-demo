import { render } from "@testing-library/react";
import { createElement } from "react";
import brand from "../../src/jeerah/assets/brand-manifest.json";
import content from "../../src/jeerah/assets/asset-manifest.json";
import { assetUrl } from "../../src/jeerah/assets/url";
import { JeerahLogo } from "../../src/jeerah/design/JeerahLogo";
import { createSeedState } from "../../src/jeerah/domain/fixtures";

const expectedContentIds = [
  "building-89-night",
  "building-89-day",
  "nakheel-court",
  "jeddah-view",
  "living-room",
  "kitchen",
  "bedroom",
  "balcony",
  "lobby",
  "gym",
  "meeting-room",
  "parking",
  "hvac-technician",
  "cleaning-team",
  "elevator-maintenance",
  "mobile-car-care",
  "home-technology",
  "delivery-utilities",
];

describe("Jeerah asset contracts", () => {
  it("contains the exact official identity inventory and roles", () => {
    expect(brand).toHaveLength(24);
    expect(new Set(brand.map((entry) => entry.id)).size).toBe(24);
    expect(brand.map((entry) => entry.role)).toEqual(expect.arrayContaining([
      "logo-ar-dark",
      "logo-ar-light",
      "logo-en-dark",
      "logo-en-light",
      "pattern-dark",
      "pattern-light",
      "pattern-overlay",
      "app-icon-192",
      "app-icon-512",
      "apple-touch-icon",
      "favicon",
      "font-ar",
      "font-en",
      "font-support",
    ]));

    for (const entry of brand) {
      expect(entry.path).not.toMatch(/^\//);
      expect(entry.sourcePath.length).toBeGreaterThan(0);
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("contains all eighteen independently addressable local photographs", () => {
    expect(content).toHaveLength(18);
    expect(content.map((entry) => entry.id)).toEqual(expectedContentIds);
    expect(new Set(content.map((entry) => entry.category))).toEqual(
      new Set(["building", "apartment", "amenity", "service"]),
    );

    for (const entry of content) {
      expect(entry.path).toMatch(/^assets\/.+\.webp$/);
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(["16:9", "4:3"]).toContain(entry.ratio);
      expect(entry.alt.ar.length).toBeGreaterThan(12);
      expect(entry.alt.en.length).toBeGreaterThan(12);
      expect(entry.provenance).toMatch(/ImageGen/i);
    }
  });

  it("resolves every fixture photograph ID to exactly one Task 5 asset", () => {
    const state = createSeedState();
    const entriesById = new Map(content.map((entry) => [entry.id, entry]));
    const imageIds = [
      ...state.buildings.flatMap((building) => building.imageIds),
      ...state.units.flatMap((unit) => unit.imageIds),
      ...state.providers.flatMap((provider) => provider.imageId ? [provider.imageId] : []),
    ];

    for (const imageId of imageIds) {
      expect(content.filter((entry) => entry.id === imageId), imageId).toHaveLength(1);
    }
    expect(state.buildings.find((building) => building.id === "building-89")?.imageIds).toEqual([
      "building-89-night",
      "building-89-day",
      "lobby",
      "gym",
      "meeting-room",
      "parking",
    ]);
    expect(state.units.find((unit) => unit.id === "unit-89-1204")?.imageIds).toEqual([
      "living-room",
      "kitchen",
      "bedroom",
      "balcony",
    ]);
    expect(state.providers.every((provider) => {
      const entry = provider.imageId ? entriesById.get(provider.imageId) : undefined;
      return entry?.category === "service";
    })).toBe(true);
  });

  it("resolves public assets under root and Pages deployment bases", () => {
    expect(assetUrl("assets/buildings/building-89-night.webp", "/"))
      .toBe("/assets/buildings/building-89-night.webp");
    expect(assetUrl("assets/buildings/building-89-night.webp", "/jeerah-smart-demo/"))
      .toBe("/jeerah-smart-demo/assets/buildings/building-89-night.webp");
    expect(assetUrl("brand/logos/horizontal-logo-1.svg", "/jeerah-smart-demo"))
      .toBe("/jeerah-smart-demo/brand/logos/horizontal-logo-1.svg");
  });

  it.each([
    "/assets/buildings/building-89-night.webp",
    "https://example.test/tracker.webp",
    "//example.test/tracker.webp",
    "../private.txt",
    "assets/../private.txt",
    "assets/%2e%2e/private.txt",
    "assets\\private.txt",
  ])("rejects unsafe public asset path %s", (path) => {
    expect(() => assetUrl(path, "/jeerah-smart-demo/")).toThrow(/asset path/i);
  });

  it.each([
    "assets/%5c..%5cprivate.txt",
    "assets/%255c..%255cprivate.txt",
    "assets%2fprivate.txt",
    "assets%252fprivate.txt",
    "assets%255cprivate.txt",
    "assets/%252f..%252fprivate.txt",
    "assets/%252e%252e/private.txt",
    "assets/%252525252e%252525252e/private.txt",
  ])("rejects encoded separators and traversal at every decoding layer: %s", (path) => {
    expect(() => assetUrl(path, "/jeerah-smart-demo/")).toThrow(/asset path/i);
  });

  it.each([
    "assets/%2/private.webp",
    "assets/%E0%A4%A/private.webp",
  ])("rejects malformed percent encoding: %s", (path) => {
    expect(() => assetUrl(path, "/jeerah-smart-demo/")).toThrow(/asset path/i);
  });

  it.each([
    "assets/buildings/building%2089.webp",
    "assets/buildings/citt%C3%A0.webp",
    "assets/buildings/offer%25-sale.webp",
  ])("preserves safe percent-encoded ordinary filenames: %s", (path) => {
    expect(assetUrl(path, "/jeerah-smart-demo/")).toBe(`/jeerah-smart-demo/${path}`);
  });

  it("loads all official font faces through the base-aware asset resolver", () => {
    const { container } = render(createElement(JeerahLogo, { locale: "en", background: "dark" }));
    const fontFaces = container.querySelector("style[data-jeerah-brand-fonts]")?.textContent;

    expect(fontFaces).toContain(assetUrl("brand/fonts/readex-pro-variable.woff2"));
    expect(fontFaces).toContain(assetUrl("brand/fonts/plus-jakarta-sans-variable.woff2"));
    expect(fontFaces).toContain(assetUrl("brand/fonts/montserrat-variable.woff2"));
  });
});
