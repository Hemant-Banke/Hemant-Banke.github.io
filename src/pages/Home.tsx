import { useMemo } from "react";
import { Link } from "react-router-dom";
import Formatted from "../components/Formatted";
import HeroSim from "../components/HeroSim";
import Socials from "../components/Socials";
import Starred from "../components/Starred";
import WorkTabs from "../components/WorkTabs";
import { site } from "../data/site";
import NoteItem from "../components/NoteItem";
import { recentNotes } from "../content/manifest";

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
                <Link to="/resume" className="btn">
                  ▸ see resume
                </Link>
                <Link to="/digital-garden" className="btn">
                  ▸ enter garden
                </Link>
              </div>
              <Socials compact />
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

      <section className="layout home-starred">
        <Starred max={6} />
      </section>

      <section className="layout home-recent">
        <div className="section-head">
          <h2>
            <span className="path">garden</span> · recent
          </h2>
          <Link to="/digital-garden" className="home-recent-all dim">
            [ open graph → ]
          </Link>
        </div>
        <div className="item-list">
          {recent.map((n) => (
            <NoteItem note={n} showGroup key={n.slug} />
          ))}
        </div>
      </section>
    </div>
  );
}
