"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLoginStatus } from "../LoginStatusContext";

/* Header: brand on left, nav on right */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { loggedIn, account } = useLoginStatus();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          <li>
            <Link
              className={`navlink ${isActive("/") ? "active" : ""}`}
              href="/"
            >
              Home
            </Link>
          </li>

          <li>
            <Link
              className={`navlink ${isActive("/catalog") ? "active" : ""}`}
              href="/catalog"
            >
              Catalog
            </Link>
          </li>

          <li>
            <Link
              className={`navlink ${isActive("/contact") ? "active" : ""}`}
              href="/contact"
            >
              Contact
            </Link>
          </li>

          <li>
            <Link
              className={`navlink ${isActive("/about") ? "active" : ""}`}
              href="/about"
            >
              About
            </Link>
          </li>

          {!loggedIn && (
            <li>
              <Link
                className={`navlink ${isActive("/login") ? "active" : ""}`}
                href="/login"
              >
                Login
              </Link>
            </li>
          )}

          {/* Profile/account icon */}
          <li>
            <div
              ref={profileRef}
              className="profile-icon-container"
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
                onClick={() => setShowProfile((prev) => !prev)}
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
                <div className="profile-popup" role="dialog" aria-modal="false">
                  {loggedIn ? (
                    <div>
                      <div>
                        <strong>{account || "User"}</strong>
                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        {account || "No email"}
                      </div>

                      <Link
                        href="/account"
                        className="profile-dropdown-link"
                        onClick={() => setShowProfile(false)}
                      >
                        Account Dashboard
                      </Link>
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