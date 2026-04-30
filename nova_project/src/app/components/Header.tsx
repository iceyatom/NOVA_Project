"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLoginStatus } from "../LoginStatusContext";

/* Header: brand on left, nav on right */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const {
    loggedIn,
    account,
    accountEmail,
    userRole,
    setLoggedIn,
    setAccount,
    setAccountId,
    setAccountEmail,
    setUserRole,
  } = useLoginStatus();
  const normalizedRole = userRole ? userRole.toUpperCase() : "";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setAccount("");
    setAccountId(0);
    setAccountEmail("");
    setUserRole("");
    setShowProfile(false);
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfile(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
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
              <button
                type="button"
                className="profile-icon-button"
                aria-label={loggedIn ? "Open account menu" : "Open login menu"}
                aria-haspopup="dialog"
                aria-expanded={showProfile}
                onClick={() => setShowProfile((prev) => !prev)}
                style={
                  loggedIn
                    ? {
                        background: "transparent",
                        border: "0",
                        padding: "0",
                        borderRadius: "50%",
                        cursor: "pointer",
                      }
                    : {
                        background: "transparent",
                        border: "0",
                        padding: "0",
                        borderRadius: "50%",
                        cursor: "pointer",
                      }
                }
              >
                <Image
                  src={loggedIn ? "/logo-frog.webp" : "/profile-icon.svg"}
                  alt=""
                  width={32}
                  height={32}
                  style={
                    loggedIn
                      ? {
                          borderRadius: "50%",
                          boxShadow: "0 0 0 3px #059669",
                          border: "2px solid #059669",
                          display: "block",
                        }
                      : {
                          filter: "grayscale(1) opacity(0.6)",
                          borderRadius: "50%",
                          display: "block",
                        }
                  }
                  aria-hidden="true"
                />
              </button>

              {showProfile && (
                <div className="profile-popup" role="dialog" aria-modal="false">
                  {loggedIn ? (
                    <div>
                      <div>
                        <strong>{account || "User"}</strong>
                      </div>
                      <div>{accountEmail || "No email"}</div>
                      <div className="profile-popup-actions">
                        <Link
                          className="profile-dropdown-link"
                          href="/account"
                          onClick={() => setShowProfile(false)}
                        >
                          Account Dashboard
                        </Link>
                        {(normalizedRole === "STAFF" ||
                          normalizedRole === "ADMIN") && (
                          <Link
                            className="profile-dropdown-link"
                            href="/staff/dashboard"
                            onClick={() => setShowProfile(false)}
                          >
                            Staff Dashboard
                          </Link>
                        )}
                        <button
                          type="button"
                          className="profile-dropdown-link profile-logout-button"
                          onClick={handleLogout}
                        >
                          Log out
                        </button>
                      </div>
                      <div className="profile-popup-role">
                        <span style={{ fontSize: "0.95em", color: "#059669" }}>
                          Role: {normalizedRole || "CUSTOMER"}
                        </span>
                      </div>
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
