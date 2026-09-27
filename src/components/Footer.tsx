import FooterGarden from "./FooterGarden";
import Socials from "./Socials";

// The whole footer is the garden; the quote, socials and attribution sit on it.
export default function Footer() {
  return (
    <footer className="footer">
      <FooterGarden>
        <div className="footer-garden-top">
          <p className="footer-garden-quote">
            <span className="footer-garden-line">il faut cultiver notre jardin.</span>
            <span className="footer-garden-cite dim">— Voltaire, Candide</span>
          </p>
          <Socials className="socials-footer" />
        </div>
        <p className="footer-credit dim">built with Claude</p>
      </FooterGarden>
    </footer>
  );
}
