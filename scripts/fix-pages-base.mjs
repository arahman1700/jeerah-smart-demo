// GitHub Pages base-path fix for the protected mobile runtime.
//
// The protected `src/mobile/*` files reference device-chrome assets with
// root-absolute paths ("/assets/iphone/…", "/assets/android/…",
// "/assets/status/…"). Vite does not rewrite string literals for a
// non-root `--base`, so on GitHub Pages those requests 404 at the domain
// root. Protected sources must not be edited, so this script rewrites the
// exact patterns in the *build output* after `vite build --base=…`.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = "/jeerah-smart-demo";
const dir = "dist/client/assets";
const pattern = /(["'`(])\/assets\/(iphone|android|status)\//g;

let total = 0;
for (const name of readdirSync(dir)) {
  if (!/\.(js|css)$/.test(name)) continue;
  const path = join(dir, name);
  const source = readFileSync(path, "utf8");
  const output = source.replace(pattern, (_match, quote, segment) => {
    total += 1;
    return `${quote}${base}/assets/${segment}/`;
  });
  if (output !== source) writeFileSync(path, output);
}

if (total === 0) {
  console.error(
    "fix-pages-base: no protected runtime asset paths found in dist/client/assets — bundle pattern changed?",
  );
  process.exit(1);
}
console.log(
  `fix-pages-base: rewrote ${total} protected runtime asset path(s) for base ${base}/`,
);
