import { site } from "../data/site";
import Socials from "./Socials";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="layout">
        <div className="footer-rule" aria-hidden="true">
          {"└" + "─".repeat(40) + "┘"}
        </div>
        <div className="footer-grid">
          <Socials />
          <p className="dim footer-note">
            <span className="prompt" />
            built with monospace &amp; box-drawing chars ·{" "}
            <span className="accent-green">{site.name}</span> · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
