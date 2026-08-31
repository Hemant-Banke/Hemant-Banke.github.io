import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getTheme, setTheme, type Theme } from "../lib/theme";
import { SIMS, setSim, useActiveSim } from "../lib/sims";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.4v2.6M12 19v2.6M4.4 4.4l1.9 1.9M17.7 17.7l1.9 1.9M2.4 12h2.6M19 12h2.6M4.4 19.6l1.9-1.9M17.7 6.3l1.9-1.9" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.6A8.6 8.6 0 1 1 9.4 3.5a6.9 6.9 0 0 0 11.1 11.1Z" />
    </svg>
  );
}

// Three bodies on an orbit — reads as "simulation" without leaning on an emoji.
function SimIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      aria-hidden="true">
      <ellipse cx="12" cy="12" rx="9.2" ry="4.6" transform="rotate(-28 12 12)" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="8.4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="5" cy="15.6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function FloatingDock() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const sim = useActiveSim();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // The simulation only exists behind the hero, so its control only appears there.
  const onHome = useLocation().pathname === "/";

  useEffect(() => {
    const onThemeChange = (e: Event) =>
      setThemeState((e as CustomEvent<Theme>).detail);
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!onHome) setOpen(false);
  }, [onHome]);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const themeLabel = `switch to ${nextTheme} view`;

  return (
    <div className={"dock" + (onHome ? "" : " dock-solo")}>
      {onHome && (
        <div
          className="dock-sim-wrap"
          ref={menuRef}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
          }}
        >
          {open && (
            <div className="dock-menu" role="menu" aria-label="background simulation">
              {SIMS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={s.key === sim.key}
                  className="dock-menu-item"
                  onClick={() => {
                    setSim(s.key);
                    setOpen(false);
                  }}
                >
                  <span className="dock-menu-mark" aria-hidden="true">
                    {s.key === sim.key ? "◉" : "○"}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="dock-btn dock-btn-sim"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`background simulation: ${sim.label}`}
            title={`background simulation: ${sim.label}`}
            onClick={() => setOpen((o) => !o)}
            onFocus={() => setOpen(true)}
          >
            <SimIcon />
          </button>
        </div>
      )}

      <button
        type="button"
        className="dock-btn dock-btn-theme"
        onClick={() => setTheme(nextTheme)}
        aria-label={themeLabel}
        title={themeLabel}
      >
        {theme === "dark" ? <MoonIcon /> : <SunIcon />}
      </button>
    </div>
  );
}
