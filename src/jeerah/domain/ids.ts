/** Collision-free identifiers for records the demo creates at runtime. */
export function demoId(prefix: string): string {
  const unique = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${unique}`;
}
