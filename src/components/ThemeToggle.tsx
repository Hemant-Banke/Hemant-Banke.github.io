import { useEffect, useState } from "react";
import { getTheme, setTheme, type Theme } from "../lib/theme";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  useEffect(() => {
    const onThemeChange = (e: Event) => {
      setThemeState((e as CustomEvent<Theme>).detail);
    };
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, []);

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  const label = theme === "dark" ? "switch to light view" : "switch to dark view";

  return (
    <button
      type="button"
      className="theme-toggle-pill"
      onClick={toggle}
      aria-pressed={theme === "light"}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}
