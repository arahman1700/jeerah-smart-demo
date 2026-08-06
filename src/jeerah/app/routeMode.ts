export type SurfaceMode = "launcher" | "preview" | "resident" | "admin";

/**
 * The bare link always lands on the launcher so visitors pick a surface.
 * Installed (standalone) launches go straight into the resident app, and
 * explicit query params deep-link any surface.
 */
export function getRouteMode(
  url: URL,
  displayMode: "browser" | "standalone",
  viewportWidth: number,
): SurfaceMode {
  void viewportWidth;
  if (url.searchParams.get("surface") === "admin") return "admin";
  if (url.searchParams.get("preview") === "1") return "preview";
  if (displayMode === "standalone" || url.searchParams.get("surface") === "app") return "resident";
  return "launcher";
}
