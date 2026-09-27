import { useMemo } from "react";
import { Link } from "react-router-dom";
import Formatted from "../components/Formatted";
import HeroSim from "../components/HeroSim";
import Socials from "../components/Socials";
import WorkTabs from "../components/WorkTabs";
import { site } from "../data/site";
import NoteItem from "../components/NoteItem";
import { recentNotes } from "../content/manifest";
import { useDocumentTitle } from "../lib/hooks";

export default function Home() {
  useDocumentTitle();
  const recent = useMemo(() => recentNotes().slice(0, 4), []);

  return (
    <div className="home">
      <section className="hero" aria-labelledby="hero-name">
        <div className="hero-split">
          <div className="hero-text-col">
            <div className="hero-intro-wrap">
              <h1 id="hero-name" className="hero-hi">
                <span className="hero-hello">Hi, I'm</span>{" "}
                <span className="hero-name">
                  {site.name}
                  <span className="hero-dot">.</span>
                  {/* a vine grows in under the name and ends on the green full
                      stop — the garden signature */}
                  <svg
                    className="hero-name-vine"
                    viewBox="0 0 300 26"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      className="vine-stem"
                      pathLength={1}
                      d="M2 15 C 40 5, 72 23, 112 13 S 182 4, 222 14 S 287 24, 298.8 0.6"
                    />
                    <g className="vine-leaves">
                      <path d="M0 0 q 5 -7 12 -3 q -5 7 -12 3z" transform="translate(58 13) rotate(-35)" />
                      <path d="M0 0 q 5 -7 12 -3 q -5 7 -12 3z" transform="translate(126 11) rotate(160)" />
                      <path d="M0 0 q 5 -7 12 -3 q -5 7 -12 3z" transform="translate(196 9) rotate(-30)" />
                      <path d="M0 0 q 5 -7 12 -3 q -5 7 -12 3z" transform="translate(252 17) rotate(150)" />
                    </g>
                  </svg>
                </span>
              </h1>
              <p className="hero-intro">
                <Formatted text={site.intro} />
              </p>

              <div className="hero-cta">
                <a
                  href={site.resumePdf}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn"
                >
                  ▸ see resume
                </a>
                <Link to="/digital-garden" className="btn">
                  ▸ enter garden
                </Link>
              </div>
              <Socials className="socials-hero" />
            </div>
          </div>
          <div className="hero-field-col">
            <HeroSim />
          </div>
        </div>
      </section>

      <section className="layout home-work">
        <WorkTabs />
      </section>

      <section className="layout home-recent">
        <div className="section-head">
          <h2 className="work-title">Recently in the garden</h2>
          <Link to="/digital-garden" className="home-recent-all dim">
            [ <span className="hide-phone">open </span>graph → ]
          </Link>
        </div>
        <div className="item-list">
          {recent.map((n) => (
            <NoteItem note={n} showTags={false} key={n.slug} />
          ))}
        </div>
      </section>
    </div>
  );
}
