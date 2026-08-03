import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(repoRoot, "public");
const maxContentBytes = 600 * 1024;

const brandManifest = readJson("src/jeerah/assets/brand-manifest.json");
const assetManifest = readJson("src/jeerah/assets/asset-manifest.json");

const expectedBrandRoles = new Map([
  ["logo-en-dark", "brand/logos/horizontal-logo-1.svg"],
  ["logo-ar-dark", "brand/logos/horizontal-logo-2.svg"],
  ["logo-en-light", "brand/logos/horizontal-logo-3.svg"],
  ["logo-ar-light", "brand/logos/horizontal-logo-4.svg"],
  ["logo-mark-dark", "brand/logos/mark-dark.svg"],
  ["logo-mark-light", "brand/logos/mark-light.svg"],
  ["pattern-dark", "brand/patterns/pattern-dark.png"],
  ["pattern-light", "brand/patterns/pattern-light.png"],
  ["pattern-overlay", "brand/patterns/pattern-overlay.png"],
  ["font-en", "brand/fonts/plus-jakarta-sans-variable.woff2"],
  ["font-support", "brand/fonts/montserrat-variable.woff2"],
  ["font-ar", "brand/fonts/readex-pro-variable.woff2"],
  ["font-license-en", "brand/fonts/plus-jakarta-sans-OFL.txt"],
  ["font-license-support", "brand/fonts/montserrat-OFL.txt"],
  ["font-license-ar", "brand/fonts/readex-pro-OFL.txt"],
  ["favicon-dark-16", "brand/favicon/favicon-dark-16.png"],
  ["favicon", "brand/favicon/favicon-dark-32.png"],
  ["favicon-dark-64", "brand/favicon/favicon-dark-64.png"],
  ["favicon-light-16", "brand/favicon/favicon-light-16.png"],
  ["favicon-light-32", "brand/favicon/favicon-light-32.png"],
  ["favicon-light-64", "brand/favicon/favicon-light-64.png"],
  ["app-icon-512", "icons/icon-512.png"],
  ["app-icon-192", "icons/icon-192.png"],
  ["apple-touch-icon", "icons/apple-touch-icon.png"],
]);

const expectedContent = [
  ["building-89-night", "building", "16:9"],
  ["building-89-day", "building", "16:9"],
  ["nakheel-court", "building", "16:9"],
  ["jeddah-view", "building", "16:9"],
  ["living-room", "apartment", "4:3"],
  ["kitchen", "apartment", "4:3"],
  ["bedroom", "apartment", "4:3"],
  ["balcony", "apartment", "4:3"],
  ["lobby", "amenity", "4:3"],
  ["gym", "amenity", "4:3"],
  ["meeting-room", "amenity", "4:3"],
  ["parking", "amenity", "4:3"],
  ["hvac-technician", "service", "4:3"],
  ["cleaning-team", "service", "4:3"],
  ["elevator-maintenance", "service", "4:3"],
  ["mobile-car-care", "service", "4:3"],
  ["home-technology", "service", "4:3"],
  ["delivery-utilities", "service", "4:3"],
];

const categoryDirectories = {
  building: "buildings",
  apartment: "apartments",
  amenity: "amenities",
  service: "services",
};

function fail(message) {
  throw new Error(`Asset verification failed: ${message}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(repoRoot, path), "utf8"));
}

function safePublicPath(path) {
  if (typeof path !== "string" || path.length === 0 || path.startsWith("/") || path.includes("\\")) {
    fail(`unsafe public path ${String(path)}`);
  }
  const segments = path.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    fail(`unsafe public path ${path}`);
  }
  const absolute = resolve(publicRoot, path);
  if (absolute !== publicRoot && !absolute.startsWith(`${publicRoot}${sep}`)) {
    fail(`path escapes public directory: ${path}`);
  }
  return absolute;
}

function fileHash(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function verifyFile(entry) {
  const path = safePublicPath(entry.path);
  if (!existsSync(path) || !statSync(path).isFile()) fail(`missing ${entry.path}`);
  if (statSync(path).size === 0) fail(`empty ${entry.path}`);
  if (!/^[a-f\d]{64}$/.test(entry.sha256)) fail(`invalid manifest hash for ${entry.path}`);
  const actualHash = fileHash(path);
  if (actualHash !== entry.sha256) fail(`SHA-256 mismatch for ${entry.path}`);
  return path;
}

function dimensions(path) {
  const data = readFileSync(path);
  if (data.subarray(1, 4).toString("ascii") === "PNG") {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (data.subarray(0, 4).toString("ascii") !== "RIFF" || data.subarray(8, 12).toString("ascii") !== "WEBP") {
    fail(`unsupported image format for ${relative(repoRoot, path)}`);
  }

  const kind = data.subarray(12, 16).toString("ascii");
  if (kind === "VP8 ") {
    return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
  }
  if (kind === "VP8X") {
    return {
      width: 1 + data.readUIntLE(24, 3),
      height: 1 + data.readUIntLE(27, 3),
    };
  }
  if (kind === "VP8L") {
    const bits = data.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  fail(`unsupported WebP encoding for ${relative(repoRoot, path)}`);
}

function assertDimensions(path, expectedWidth, expectedHeight) {
  const actual = dimensions(path);
  if (actual.width !== expectedWidth || actual.height !== expectedHeight) {
    fail(`${relative(publicRoot, path)} is ${actual.width}x${actual.height}, expected ${expectedWidth}x${expectedHeight}`);
  }
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

if (!Array.isArray(brandManifest) || brandManifest.length !== 24) {
  fail(`brand manifest must contain exactly 24 entries, found ${brandManifest.length}`);
}
if (!Array.isArray(assetManifest) || assetManifest.length !== 18) {
  fail(`content manifest must contain exactly 18 entries, found ${assetManifest.length}`);
}

const brandIds = new Set();
const brandRoles = new Set();
for (const entry of brandManifest) {
  if (brandIds.has(entry.id)) fail(`duplicate brand id ${entry.id}`);
  if (brandRoles.has(entry.role)) fail(`duplicate brand role ${entry.role}`);
  brandIds.add(entry.id);
  brandRoles.add(entry.role);

  const expectedPath = expectedBrandRoles.get(entry.role);
  if (!expectedPath || expectedPath !== entry.path) fail(`unexpected role/path ${entry.role}: ${entry.path}`);
  if (typeof entry.sourcePath !== "string" || entry.sourcePath.length === 0) fail(`missing sourcePath for ${entry.id}`);
  if (/(?:Transaparant2|Transparant2|\(2\)|\/Ios\/|3-Alterantive Logo\/PDF\/1\.png|\.(?:pdf|ai|eps|jpe?g)$)/i.test(entry.sourcePath)) {
    fail(`excluded source referenced by ${entry.id}: ${entry.sourcePath}`);
  }
  verifyFile(entry);
}
for (const role of expectedBrandRoles.keys()) {
  if (!brandRoles.has(role)) fail(`missing required brand role ${role}`);
}

for (const entry of brandManifest.filter((item) => item.path.startsWith("brand/patterns/"))) {
  assertDimensions(safePublicPath(entry.path), 2000, 2000);
}
for (const entry of brandManifest.filter((item) => item.path.startsWith("brand/favicon/"))) {
  const expectedSize = Number(entry.id.match(/(16|32|64)$/)?.[1]);
  assertDimensions(safePublicPath(entry.path), expectedSize, expectedSize);
}
for (const [path, size] of [["icons/icon-512.png", 512], ["icons/icon-192.png", 192], ["icons/apple-touch-icon.png", 180]]) {
  assertDimensions(safePublicPath(path), size, size);
}

const contentIds = new Set();
for (const [index, [expectedId, expectedCategory, expectedRatio]] of expectedContent.entries()) {
  const entry = assetManifest[index];
  if (entry.id !== expectedId || entry.category !== expectedCategory || entry.ratio !== expectedRatio) {
    fail(`content entry ${index + 1} must be ${expectedId}/${expectedCategory}/${expectedRatio}`);
  }
  if (contentIds.has(entry.id)) fail(`duplicate content id ${entry.id}`);
  contentIds.add(entry.id);

  const expectedPath = `assets/${categoryDirectories[entry.category]}/${entry.id}.webp`;
  if (entry.path !== expectedPath || extname(entry.path) !== ".webp") fail(`unexpected content path ${entry.path}`);
  if (typeof entry.alt?.ar !== "string" || entry.alt.ar.trim().length <= 12) fail(`missing Arabic alt for ${entry.id}`);
  if (typeof entry.alt?.en !== "string" || entry.alt.en.trim().length <= 12) fail(`missing English alt for ${entry.id}`);
  if (typeof entry.provenance !== "string" || !/ImageGen/i.test(entry.provenance)) fail(`missing ImageGen provenance for ${entry.id}`);

  const path = verifyFile(entry);
  if (statSync(path).size > maxContentBytes) fail(`${entry.path} exceeds 600 KB`);
  const image = dimensions(path);
  if (expectedRatio === "16:9" && image.width * 9 !== image.height * 16) fail(`${entry.path} is not 16:9`);
  if (expectedRatio === "4:3" && image.width * 3 !== image.height * 4) fail(`${entry.path} is not 4:3`);
}

const madaPath = safePublicPath("brands/mada.svg");
if (!existsSync(madaPath) || statSync(madaPath).size === 0) fail("missing official mada SVG");
if (fileHash(madaPath) !== "938590e8d7209bbdd9e52f4d47ba0777059f4a0f00cc7b45b4e09eb10fb928d3") {
  fail("official mada SVG hash mismatch");
}
if (!/<svg[\s>]/i.test(readFileSync(madaPath, "utf8"))) fail("mada asset is not SVG content");

const controlledDirectories = [
  "brand/logos",
  "brand/patterns",
  "brand/fonts",
  "brand/favicon",
  "icons",
  "assets/buildings",
  "assets/apartments",
  "assets/amenities",
  "assets/services",
  "brands",
];
const shippedFiles = controlledDirectories
  .flatMap((directory) => listFiles(resolve(publicRoot, directory)))
  .map((path) => relative(publicRoot, path).split(sep).join("/"));
const expectedFiles = new Set([
  ...brandManifest.map((entry) => entry.path),
  ...assetManifest.map((entry) => entry.path),
  "brands/mada.svg",
]);
if (shippedFiles.length !== 43 || new Set(shippedFiles).size !== 43) {
  fail(`controlled public inventory must contain exactly 43 files, found ${shippedFiles.length}`);
}
for (const path of shippedFiles) {
  if (!expectedFiles.has(path)) fail(`unmanifested or excluded public asset ${path}`);
}
for (const path of expectedFiles) {
  if (!shippedFiles.includes(path)) fail(`manifested public asset is absent ${path}`);
}

console.log("Asset validation passed: 24 official brand files/roles, 18 content images, 3 install icons, official mada SVG (43 public assets).");
