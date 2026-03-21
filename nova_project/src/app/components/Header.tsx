
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLoginStatus } from "../LoginStatusContext";

/* Header: brand on left, nav on right */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  // Track if mouse is over either icon or popup
  const hoverState = useRef({ icon: false, popup: false });
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { loggedIn, account, userRole } = useLoginStatus();

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
              aria-label={loggedIn ? "Account" : "Not logged in"}
              onMouseEnter={() => {
                hoverState.current.icon = true;
                setShowProfile(true);
                if (closeTimer.current) clearTimeout(closeTimer.current);
              }}
              onMouseLeave={() => {
                hoverState.current.icon = false;
                closeTimer.current = setTimeout(() => {
                  if (!hoverState.current.icon && !hoverState.current.popup) setShowProfile(false);
                }, 120);
              }}
              onFocus={() => setShowProfile(true)}
              onBlur={() => setShowProfile(false)}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: "44px",
              }}
            >
              <Image
                src={loggedIn ? "/logo-frog.webp" : "/profile-icon.svg"}
                alt={loggedIn ? "Account (logged in)" : "Not logged in"}
                width={32}
                height={32}
                style={
                  loggedIn
                    ? {
                        borderRadius: "50%",
                        boxShadow: "0 0 0 3px #059669",
                        border: "2px solid #059669",
                        cursor: "pointer",
                      }
                    : {
                        filter: "grayscale(1) opacity(0.6)",
                        borderRadius: "50%",
                        cursor: "pointer",
                      }
                }
                aria-hidden="true"
              />
              {showProfile && (
                <div
                  className="profile-popup"
                  role="dialog"
                  aria-modal="false"
                  onMouseEnter={() => {
                    hoverState.current.popup = true;
                    setShowProfile(true);
                    if (closeTimer.current) clearTimeout(closeTimer.current);
                  }}
                  onMouseLeave={() => {
                    hoverState.current.popup = false;
                    closeTimer.current = setTimeout(() => {
                      if (!hoverState.current.icon && !hoverState.current.popup) setShowProfile(false);
                    }, 120);
                  }}
                >
                  {loggedIn ? (
                    <div>
                      <div>
                        <strong>{account || "User"}</strong>
                      </div>
                      <div>{account || "No email"}</div>
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: "0.95em", color: "#059669" }}>
                          Role: {userRole ? userRole.toUpperCase() : "CUSTOMER"}
                        </span>
                      </div>
                      {(userRole === "STAFF" || userRole === "ADMIN") && (
                        <div style={{ marginTop: 12 }}>
                          <Link href="/staff/dashboard">
                            <button className="loginButton" style={{ width: "100%" }}>
                              Staff Dashboard
                            </button>
                          </Link>
                        </div>
                      )}
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
