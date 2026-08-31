import { Link } from "react-router-dom";
import NoteBrowser from "../components/NoteBrowser";
import { notesInGroup } from "../content/manifest";

export default function Projects() {
  const projects = notesInGroup("projects");

  return (
    <div className="page layout">
      <div className="section-head">
        <h1>
          <span className="path">projects</span>
        </h1>
      </div>
      <p className="lead">
        Things I've built. <code>projects/</code> folder of the{" "}
        <Link to="/digital-garden">digital garden</Link>.
      </p>
      <NoteBrowser notes={projects} />
    </div>
  );
}
