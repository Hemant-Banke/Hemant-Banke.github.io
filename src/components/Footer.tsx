import { site } from "../data/site";
import AsciiField from "./AsciiField";
import Socials from "./Socials";

export default function Footer() {
  return (
    <footer className="footer">
      <AsciiField className="ascii-field footer-field" />
      <div className="layout footer-inner">
        <div className="footer-grid">
          <Socials />
          <p className="dim footer-note">
            built with Claude ·{" "}
            <span className="accent-green">{site.name}</span> ·{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
