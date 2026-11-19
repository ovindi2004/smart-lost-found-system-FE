import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export const Footer = () => {
  const handleAboutClick = (e: React.MouseEvent) => {
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      e.preventDefault();
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="minimal-footer" aria-label="UniFind Footer">
      <div className="minimal-footer-container">
        {/* Main Row: Brand & Essential Navigation */}
        <div className="minimal-footer-main">
          <div className="minimal-footer-brand">
            <Link to="/" className="minimal-footer-logo" aria-label="UniFind Home">
              <span className="minimal-footer-icon">🔍</span>
              <span className="minimal-footer-title">UniFind</span>
            </Link>
            <span className="minimal-footer-sep" aria-hidden="true" />
            <p className="minimal-footer-desc">
              Lost it on Campus? Let's find it fast with smart AI matching.
            </p>
          </div>

          <nav className="minimal-footer-links" aria-label="Footer Links">
            <Link to="/" className="minimal-footer-link">
              Home
            </Link>
            <Link to="/items" className="minimal-footer-link">
              Browse Items
            </Link>
            <Link to="/#about" onClick={handleAboutClick} className="minimal-footer-link">
              About
            </Link>
          </nav>
        </div>

        {/* Subtle Divider Line */}
        <div className="minimal-footer-divider" />

        {/* Bottom Row: Copyright & Network Note */}
        <div className="minimal-footer-bottom">
          <p className="minimal-footer-copy">
            &copy; 2026 UniFind. All Rights Reserved.
          </p>
          <div className="minimal-footer-network">
            <span className="minimal-footer-dot" />
            <span>Campus Recovery Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
