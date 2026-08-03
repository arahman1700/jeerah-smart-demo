export type SurfaceMode = "preview" | "resident" | "admin";

export function getRouteMode(
  url: URL,
  displayMode: "browser" | "standalone",
  viewportWidth: number,
): SurfaceMode {
  if (url.searchParams.get("surface") === "admin") return "admin";
  if (url.searchParams.get("preview") === "1") return "preview";
  if (displayMode === "standalone" || viewportWidth <= 640 || url.searchParams.get("surface") === "app") return "resident";
  return "preview";
}
