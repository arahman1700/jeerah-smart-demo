import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateServiceWorker } from "../../scripts/generate-sw.mjs";

function fixtureDist(): string {
  const dir = mkdtempSync(join(tmpdir(), "jeerah-sw-"));
  mkdirSync(join(dir, "assets"), { recursive: true });
  writeFileSync(join(dir, "index.html"), "<!doctype html><title>fixture</title>");
  writeFileSync(join(dir, "assets", "index-abc123.js"), "console.log(1)");
  writeFileSync(join(dir, "assets", "index-def456.css"), "body{}");
  writeFileSync(join(dir, "manifest.webmanifest"), "{}");
  writeFileSync(join(dir, "sw.js"), "stale");
  return dir;
}

describe("generateServiceWorker", () => {
  it("generates a worker precaching the final hashed build output", async () => {
    const dist = fixtureDist();
    const swPath = await generateServiceWorker({ distDir: dist, base: "/jeerah-smart-demo/" });
    const source = readFileSync(swPath, "utf8");
    expect(source).toContain("assets/index-abc123.js");
    expect(source).toContain("assets/index-def456.css");
    expect(source).toContain("/jeerah-smart-demo/manifest.webmanifest");
    expect(source).not.toContain('"/jeerah-smart-demo/sw.js"');
    expect(source).toContain('request.mode === "navigate"');
    expect(source).toContain("skipWaiting");
    expect(source).toContain("clients.claim");
    expect(source).toMatch(/jeerah-demo-[0-9a-f]{12}/);
  });

  it("derives a stable cache version from the file list", async () => {
    const dist = fixtureDist();
    const first = readFileSync(await generateServiceWorker({ distDir: dist, base: "/x/" }), "utf8");
    const second = readFileSync(await generateServiceWorker({ distDir: dist, base: "/x/" }), "utf8");
    expect(first.match(/jeerah-demo-[0-9a-f]{12}/)?.[0]).toBe(second.match(/jeerah-demo-[0-9a-f]{12}/)?.[0]);
    writeFileSync(join(dist, "assets", "extra-9f9f9f.js"), "console.log(2)");
    const third = readFileSync(await generateServiceWorker({ distDir: dist, base: "/x/" }), "utf8");
    expect(third.match(/jeerah-demo-[0-9a-f]{12}/)?.[0]).not.toBe(first.match(/jeerah-demo-[0-9a-f]{12}/)?.[0]);
  });
});

describe("manifest", () => {
  it("defines an installable resident start URL with official icons", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/manifest.webmanifest"), "utf8"));
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("./?surface=app");
    expect(manifest.scope).toBe("./");
    expect(manifest.background_color).toBe("#191C2E");
    expect(manifest.theme_color).toBe("#191C2E");
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(["192x192", "512x512"]);
    expect(manifest.icons.every((icon: { src: string }) => icon.src.startsWith("./icons/"))).toBe(true);
  });

  it("links the manifest and PWA metadata from index.html", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toContain('rel="manifest"');
    expect(html).toContain("manifest.webmanifest");
    expect(html).toContain('name="theme-color"');
    expect(html).toContain("apple-mobile-web-app");
    expect(html).toContain("apple-touch-icon");
  });
});
