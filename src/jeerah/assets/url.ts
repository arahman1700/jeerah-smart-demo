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

function unsafeAssetPath(path: string) {
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return true;
  }

  return (
    path.length === 0
    || path.startsWith("/")
    || path.startsWith("\\")
    || path.includes("\\")
    || /^[a-z][a-z\d+.-]*:/i.test(path)
    || decoded.split("/").some((segment) => segment === ".." || segment === ".")
  );
}

export function assetUrl(path: string, base = import.meta.env.BASE_URL) {
  if (unsafeAssetPath(path)) {
    throw new Error(`Unsafe asset path: ${path}`);
  }

  const normalizedBase = `/${base.replace(/^\/+|\/+$/g, "")}`.replace(/^\/$/, "");
  return `${normalizedBase}/${path}`;
}
