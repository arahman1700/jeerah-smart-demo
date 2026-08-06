// Deterministic release verifier: runs every gate and rejects Pages output
// that references assets from the domain root instead of the demo base.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const BASE = "/jeerah-smart-demo/";

for (const [command, args] of [
  ["npm", ["run", "check:runtime"]],
  ["npm", ["run", "build:pages"]],
  ["npm", ["run", "test:run"]],
  ["node", ["scripts/verify-assets.mjs"]],
]) {
  execFileSync(command, args, { stdio: "inherit" });
}

for (const path of ["dist/client/index.html", "dist/client/manifest.webmanifest", "dist/client/sw.js"]) {
  if (!existsSync(path)) throw new Error(`Missing release artifact: ${path}`);
}

const indexHtml = readFileSync("dist/client/index.html", "utf8");
const rootUrl = indexHtml.match(/(?:href|src)="\/(?!jeerah-smart-demo\/)[^"]+"/);
if (rootUrl) throw new Error(`dist/client/index.html references a domain-root URL: ${rootUrl[0]}`);
if (!indexHtml.includes(`${BASE}manifest.webmanifest`)) {
  throw new Error("dist/client/index.html does not link the base-scoped manifest");
}

const sw = readFileSync("dist/client/sw.js", "utf8");
if (!sw.includes(`const BASE = "${BASE}"`)) throw new Error("sw.js is not generated for the Pages base");
const swRoot = sw.match(/"\/(?!jeerah-smart-demo\/)[^"]+"/g)?.filter((match) => match.includes("/"));
if (swRoot && swRoot.some((match) => match.startsWith('"/assets') || match.startsWith('"/brand') || match.startsWith('"/icons'))) {
  throw new Error(`sw.js precaches domain-root URLs: ${swRoot.slice(0, 3).join(", ")}`);
}

console.log("verify-demo: all release gates passed and Pages output is base-safe.");
