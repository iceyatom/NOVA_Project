"use client";

import Link from "next/link";

/* Footer: company info on left, columns of page links on right */
export default function Footer() {
  const year = new Date().getFullYear();

  // If already on page, scroll to top. Otherwise let Next.js navigate.
  const onHomeClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {/* Left: company info */}
        <div className="footer-left">
          <p className="footer-brand">Niles Biological Inc.</p>
          <address className="footer-address">
            9296 Elder Creek Road, Sacramento, CA 95829
          </address>
          <p className="footer-contact">
            <a href="mailto:nilesbio.monty@gmail.com">
              nilesbio.monty@gmail.com
            </a>
            {" · "}
            <a href="tel:+19167201814">(916) 720-1814</a>
          </p>
        </div>

        {/* Right: 3 columns */}
        <nav className="footer-right" aria-label="Footer navigation">
          {/* Products (leftmost of the right area) */}
          <div className="footer-col">
            <h3 className="footer-title">Products</h3>
            <ul className="footer-list">
              <li>
                <a className="footer-link" href="#">
                  Shop Now
                </a>
              </li>
              <li>
                <a className="footer-link" href="#">
                  Catalog
                </a>
              </li>
              <li>
                <Link className="footer-link" href="/" onClick={onHomeClick}>
                  Home Page
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal (middle) */}
          <div className="footer-col">
            <h3 className="footer-title">Legal</h3>
            <ul className="footer-list">
              <li>
                <a className="footer-link" href="#">
                  Terms of Use
                </a>
              </li>
              <li>
                <a className="footer-link" href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="footer-link" href="#">
                  Accessibility Statement
                </a>
              </li>
            </ul>
          </div>

          {/* Company (rightmost) */}
          <div className="footer-col">
            <h3 className="footer-title">Company</h3>
            <ul className="footer-list">
              <li>
                <a className="footer-link" href="/about">
                  About Us
                </a>
              </li>
              <li>
                <a className="footer-link" href="#">
                  Log In
                </a>
              </li>
              <li>
                <a className="footer-link" href="#">
                  Sign Up
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <small>
            © {year} Niles Biological Inc. · <a href="#">Privacy</a> ·{" "}
            <a href="#">Terms</a>
          </small>
        </div>
      </div>
    </footer>
  );
}
