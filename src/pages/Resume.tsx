import PdfRoute from "../components/PdfRoute";
import { getNote, pdfArtifact } from "../content/manifest";
import { site } from "../data/site";

// The résumé is a pdf-only garden page in personal/ — opening it opens the PDF.
const RESUME_SLUG = "personal/resume";

export default function Resume() {
  const note = getNote(RESUME_SLUG);
  const pdf = note ? pdfArtifact(note) : undefined;

  if (!pdf) {
    return (
      <div className="page layout">
        <div className="section-head">
          <h1>
            <span className="path">resume</span>
          </h1>
        </div>
        <p className="lead dim">
          ! could not find résumé PDF.
        </p>
      </div>
    );
  }

  return (
    <PdfRoute
      url={pdf}
      downloadName={`${site.handle || "resume"}-resume.pdf`}
      fallbackTo="/"
    />
  );
}
