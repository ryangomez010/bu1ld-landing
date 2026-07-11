const STORAGE_KEY = "build:theme";

export type ThemePreference = "dark" | "light";

/** Brand dark is the default (:root). Light mode adds `.light` on `<html>`. */
export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function applyTheme(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.remove("dark");
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(): ThemePreference {
  const next: ThemePreference = getStoredTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function initTheme(): void {
  applyTheme(getStoredTheme());
}
