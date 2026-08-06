import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

export type JeerahTheme = "dark" | "light";
const STORAGE_KEY = "jeerah-theme";

export function readStoredTheme(): JeerahTheme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

interface ThemeControls {
  /** The explicit preference, or null while each surface keeps its default. */
  theme: JeerahTheme | null;
  /** Preference merged with the calling surface's designed default. */
  resolve(surfaceDefault: JeerahTheme): JeerahTheme;
  toggle(surfaceDefault: JeerahTheme): void;
}

const ThemeContext = createContext<ThemeControls | null>(null);

/**
 * One explicit preference for the whole demo, applied as a body attribute.
 * Until the person chooses, each surface keeps its designed default
 * (resident dark, admin light), signalled by the absence of the attribute.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<JeerahTheme | null>(readStoredTheme);

  useEffect(() => {
    if (theme) {
      document.body.dataset.jeerahTheme = theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Preference persistence is best-effort in the demo.
      }
    } else {
      delete document.body.dataset.jeerahTheme;
    }
  }, [theme]);

  const resolve = useCallback((surfaceDefault: JeerahTheme) => theme ?? surfaceDefault, [theme]);
  const toggle = useCallback((surfaceDefault: JeerahTheme) => {
    setTheme((current) => ((current ?? surfaceDefault) === "dark" ? "light" : "dark"));
  }, []);
  const value = useMemo<ThemeControls>(() => ({ theme, resolve, toggle }), [theme, resolve, toggle]);

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useJeerahTheme(): ThemeControls {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useJeerahTheme must be used inside ThemeProvider");
  return value;
}
