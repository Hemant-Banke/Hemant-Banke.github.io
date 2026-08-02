export type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

/** Explicit choice the visitor has made, if any (persists across visits). */
export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** Stored choice if present, else the site default (light). */
export function getTheme(): Theme {
  return getStoredTheme() ?? "light";
}

/** Applies `theme` to the document and notifies any listeners (canvases etc). */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent<Theme>("themechange", { detail: theme }));
}

/** Persists `theme` as the visitor's explicit choice and applies it. */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore (private browsing / storage disabled)
  }
  applyTheme(theme);
}
