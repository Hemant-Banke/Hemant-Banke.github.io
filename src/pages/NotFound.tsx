import { Link } from "react-router-dom";

const ART = String.raw`
  _  _    ___  _  _
 | || |  / _ \| || |
 | || |_| | | | || |_
 |__   _| |_| |__   _|
    |_|  \___/   |_|
`;

export default function NotFound() {
  return (
    <div className="page layout notfound">
      <pre className="notfound-art accent-magenta">{ART}</pre>
      <p className="lead">
        <span className="prompt" />
        cat: this path does not exist. The file may have been moved, or never
        planted.
      </p>
      <div className="hero-cta">
        <Link to="/" className="btn">
          ▸ cd ~
        </Link>
        <Link to="/digital-garden" className="btn">
          ▸ ls ~/digital-garden
        </Link>
      </div>
    </div>
  );
}
