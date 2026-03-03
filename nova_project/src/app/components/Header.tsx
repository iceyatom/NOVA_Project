"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

/* Header: brand on left, nav on right */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header>
      <nav className="topbar" aria-label="Main">
        {/* Brand (clickable logo + name) */}
        <Link
          href="/"
          aria-label="Niles Biological Inc. - Home"
          className="brand-link"
        >
          <Image
            src="/logo-frog.webp"
            alt="Niles Biological logo"
            width={128}
            height={128}
            priority
            className="brand-img"
          />
          <span className="brand-title">Niles Biological Inc.</span>
        </Link>

        {/* Mobile Menu toggle */}
        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={open ? "true" : "false"}
          aria-controls="topbar-links"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>

        {/* Primary Navigation */}
        <ul id="topbar-links" className={`links ${open ? "open" : ""}`}> 
          {/* ...existing nav links... */}
          <li>
            <Link className="navlink" href="/" aria-current="page">
              Home
            </Link>
          </li>
          <li>
            <Link className="navlink" href="/catalog" aria-current="page">
              Catalog
            </Link>
          </li>
          <li>
            <Link className="navlink" href="/contact" aria-current="page">
              Contact
            </Link>
          </li>
          <li>
            <Link className="navlink" href="/about" aria-current="page">
              About
            </Link>
          </li>
          <li>
            <Link className="navlink" href="/login" aria-current="page">
              Login
            </Link>
          </li>
          {/* Profile/account icon */}
          <li>
            <div
              className="profile-icon-container"
              tabIndex={0}
              aria-label={isAuthenticated ? "Account" : "Not logged in"}
              onMouseEnter={() => setShowProfile(true)}
              onMouseLeave={() => setShowProfile(false)}
              onFocus={() => setShowProfile(true)}
              onBlur={() => setShowProfile(false)}
              style={{ position: "relative", display: "inline-block" }}
            >
              <Image
                src="/profile-icon.svg"
                alt={isAuthenticated ? "Account" : "Not logged in"}
                width={32}
                height={32}
                style={{
                  filter: isAuthenticated ? "none" : "grayscale(1) opacity(0.5)",
                  cursor: "pointer",
                  borderRadius: "50%"
                }}
                aria-hidden="true"
              />
              {showProfile && (
                <div className="profile-popup" role="dialog" aria-modal="false">
                  {isAuthenticated && user ? (
                    <div>
                      <div><strong>{user.displayName}</strong></div>
                      <div>{user.email}</div>
                    </div>
                  ) : (
                    <div>
                      <span>Not logged in</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
}
