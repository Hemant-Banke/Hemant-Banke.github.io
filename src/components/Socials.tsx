// Brand marks: Font Awesome Free (https://fontawesome.com), icons CC BY 4.0.
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons/faLinkedinIn";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons/faXTwitter";
import type { ReactNode } from "react";
import { socials } from "../data/socials";

type FaIcon = { icon: [number, number, unknown, unknown, string | string[]] };

function Brand({ def }: { def: FaIcon }) {
  const [w, h, , , path] = def.icon;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <path d={Array.isArray(path) ? path.join(" ") : path} fill="currentColor" />
    </svg>
  );
}

// Simple outline envelope, drawn to sit with the brand marks.
function Mail() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M3 6.5 12 13l9-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  github: <Brand def={faGithub as unknown as FaIcon} />,
  x: <Brand def={faXTwitter as unknown as FaIcon} />,
  linkedin: <Brand def={faLinkedinIn as unknown as FaIcon} />,
  mail: <Mail />,
};

/** Row of social links as icons (label as tooltip + accessible name). */
export default function Socials({ className = "" }: { className?: string }) {
  return (
    <ul className={"socials " + className}>
      {socials.map((s) => {
        const external = s.href.startsWith("http");
        return (
          <li key={s.key}>
            <a
              href={s.href}
              aria-label={s.label}
              title={`${s.label} · ${s.handle}`}
              {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
            >
              {ICONS[s.key] ?? <span>{s.label}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
