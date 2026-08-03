export interface BrandManifestEntry {
  id: string;
  path: string;
  sourcePath: string;
  sha256: string;
  role: string;
  transform?: string;
}

export interface AssetManifestEntry {
  id: string;
  category: "building" | "apartment" | "amenity" | "service";
  path: string;
  sha256: string;
  ratio: "16:9" | "4:3";
  alt: { ar: string; en: string };
  provenance: string;
}

const MAX_DECODE_ROUNDS = 4;
const encodedByte = /%[a-f\d]{2}/i;

function unsafeDecodedPath(path: string) {
  return (
    path.length === 0
    || path.startsWith("/")
    || path.startsWith("\\")
    || path.includes("\\")
    || /^[a-z][a-z\d+.-]*:/i.test(path)
    || path.split(/[\\/]/).some((segment) => segment === ".." || segment === ".")
  );
}

function unsafeAssetPath(path: string) {
  let decoded = path;

  for (let round = 0; round < MAX_DECODE_ROUNDS; round += 1) {
    if (unsafeDecodedPath(decoded)) return true;
    if (!decoded.includes("%")) return false;

    if (!encodedByte.test(decoded)) {
      return round === 0;
    }

    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return true;
    }

    const slashCount = (decoded.match(/\//g) ?? []).length;
    const nextSlashCount = (next.match(/\//g) ?? []).length;
    if (nextSlashCount > slashCount) return true;
    decoded = next;
  }

  return unsafeDecodedPath(decoded) || encodedByte.test(decoded);
}

export function assetUrl(path: string, base = import.meta.env.BASE_URL) {
  if (unsafeAssetPath(path)) {
    throw new Error(`Unsafe asset path: ${path}`);
  }

  const normalizedBase = `/${base.replace(/^\/+|\/+$/g, "")}`.replace(/^\/$/, "");
  return `${normalizedBase}/${path}`;
}
