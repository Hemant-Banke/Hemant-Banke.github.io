import { useMemo } from "react";
import { Link } from "react-router-dom";
import Formatted from "../components/Formatted";
import ParticleLife from "../components/ParticleLife";
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
        <div className="hero-split">
          <div className="hero-text-col">
            <div className="hero-intro-wrap">
              <h1 id="hero-name" className="hero-hi">
                Hi, I'm{" "}
                <span className="hero-name">
                  {site.name}
                </span>
              </h1>
              <p className="hero-intro">
                <Formatted text={site.intro} />
              </p>

              <div className="hero-cta">
                <Link to="/digital-garden" className="btn">
                  ▸ enter garden
                </Link>
                <Link to="/projects" className="btn">
                  ▸ see projects
                </Link>
              </div>
              <Socials compact />
            </div>
          </div>
          <div className="hero-field-col" aria-hidden="true">
            <ParticleLife />
          </div>
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
                  <span className="recent-left">
                    <span
                      className="recent-dot"
                      style={{ color: g?.color }}
                      aria-hidden="true"
                    >
                      ●
                    </span>
                    <span className="recent-title">{n.title}</span>
                    <span className="recent-group dim">{n.group}/</span>
                  </span>
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
