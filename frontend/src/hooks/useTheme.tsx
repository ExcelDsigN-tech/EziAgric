"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

const STORAGE_KEY = "amana-theme-preference";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// Fallback used outside the provider; no-op setTheme keeps callers safe.
const ThemeContext = createContext<ThemeContextType>({
  themePreference: "system",
  resolvedTheme: "dark",
  setTheme: () => {},
});

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  // Starts light so server and first client render match; corrected in effect.
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) setThemePreference(stored);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    setSystemDark(media.matches);
    if (themePreference !== "system") return;
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [themePreference]);

  const resolvedTheme: ResolvedTheme =
    themePreference === "system" ? (systemDark ? "dark" : "light") : themePreference;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((theme: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, theme);
    setThemePreference(theme);
  }, []);

  const value = useMemo(
    () => ({ themePreference, resolvedTheme, setTheme }),
    [themePreference, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
