import { useState } from "react";
import { NavLink } from "react-router-dom";
import { site } from "../data/site";

const links = [
  { to: "/", label: "home", end: true },
  { to: "/digital-garden", label: "garden" },
  { to: "/curated", label: "curated" },
  { to: "/projects", label: "projects" },
  { to: "/research", label: "research" },
  { to: "/resume", label: "resume" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="layout nav-row">
        <NavLink to="/" className="nav-brand" end onClick={() => setOpen(false)}>
          <span className="accent-green">{site.handle}</span>
          <span className="dim">@portfolio</span>
          <span className="dim">:</span>
          <span className="accent-cyan">~</span>
          <span className="accent-green">$</span>
          <span className="blink" aria-hidden="true">
            █
          </span>
        </NavLink>

        <button
          className="nav-toggle btn"
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "[x] close" : "[≡] menu"}
        </button>

        <nav id="nav-menu" className={"nav-links" + (open ? " open" : "")}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              onClick={() => setOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <span className="nav-bullet" aria-hidden="true">
                    {isActive ? "▸" : " "}
                  </span>
                  {l.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
