import { useMemo } from "react";
import { Link } from "react-router-dom";
import LeniaField from "../components/LeniaField";
import AsciiBanner from "../components/AsciiBanner";
import Socials from "../components/Socials";
import Starred from "../components/Starred";
import { site } from "../data/site";
import { recentNotes } from "../content/manifest";
import { getGroup } from "../content/manifest";

export default function Home() {
  const recent = useMemo(() => recentNotes().slice(0, 4), []);

  return (
    <div className="home">
      <section className="hero" aria-labelledby="hero-name">
        <LeniaField />
        <div className="layout hero-inner">
          <p className="eyebrow">
            <span className="eyebrow-prompt">$</span> whoami
          </p>
          <AsciiBanner
            text={site.name}
            font={site.bannerFont}
            className="wordmark-wrap"
          />
          <p className="hero-role accent-cyan">{site.role}</p>
          <p className="hero-tagline">{site.tagline}</p>

          {/* log lines removed — keep the vertical space they occupied */}
          <div className="hero-typed" aria-hidden="true" />

          <div className="hero-cta">
            <Link to="/digital-garden" className="btn">
              ▸ enter the graph
            </Link>
            <Link to="/projects" className="btn">
              ▸ see projects
            </Link>
          </div>
          <Socials compact />
        </div>
      </section>

      <section className="layout home-starred">
        <Starred max={6} />
      </section>

      <section className="layout home-recent">
        <div className="section-head">
          <span className="hash">##</span>
          <h2>
            <span className="path">~/garden</span> · recent
          </h2>
          <Link to="/digital-garden" className="home-recent-all dim">
            [ open graph → ]
          </Link>
        </div>
        <ul className="mono-list recent-list">
          {recent.map((n) => {
            const g = getGroup(n.groupSlug);
            return (
              <li key={n.slug} className="recent-item">
                <Link to={`/digital-garden/${n.slug}`} className="recent-link">
                  <span
                    className="recent-dot"
                    style={{ color: g?.color }}
                    aria-hidden="true"
                  >
                    ●
                  </span>
                  <span className="recent-title">{n.title}</span>
                  <span className="recent-group dim">{n.group}/</span>
                  <span className="recent-date dim">{n.date ?? ""}</span>
                </Link>
                {n.summary && <p className="recent-summary dim">{n.summary}</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
