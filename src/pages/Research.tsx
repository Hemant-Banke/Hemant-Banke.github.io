import { Link } from "react-router-dom";
import NoteBrowser from "../components/NoteBrowser";
import { notesInGroup } from "../content/manifest";

export default function Research() {
  const items = notesInGroup("research");

  return (
    <div className="page layout">
      <div className="section-head">
        <h1>
          <span className="path">research</span>
        </h1>
      </div>
      <p className="lead">
        Papers, notes, and writing. <code>research/</code> folder of the{" "}
        <Link to="/digital-garden">digital garden</Link>.
      </p>
      <NoteBrowser notes={items} />
    </div>
  );
}
