import { socials } from "../data/socials";

/** Inline row of ascii social links. */
export default function Socials({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={"socials" + (compact ? " compact" : "")}>
      {socials.map((s) => {
        const external = s.href.startsWith("http");
        return (
          <li key={s.key}>
            <a
              href={s.href}
              {...(external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
            >
              <span className="socials-label">{s.label}</span>
              {!compact && <span className="socials-handle dim">{s.handle}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
