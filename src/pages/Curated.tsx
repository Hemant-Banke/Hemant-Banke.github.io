import NoteBrowser from "../components/NoteBrowser";
import { starredNotes } from "../content/manifest";

export default function Curated() {
  const items = starredNotes();

  return (
    <div className="page layout">
      <div className="section-head">
        <span className="hash star-badge">★</span>
        <h1>
          <span className="path">curated</span>
        </h1>
      </div>
      <p className="lead">
        The starred pages across the garden. Things worth reaching for first.
      </p>
      {items.length ? (
        <NoteBrowser notes={items} groups />
      ) : (
        <p className="lead dim">nothing starred yet.</p>
      )}
    </div>
  );
}
