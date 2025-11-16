"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

/* Header: brand on left, nav on right */
export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
          {/* Linked */}
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

          {/* Future pages: Unlinked for now */}
          {/* <li><span className="navlink" aria-disabled="true" title="Coming soon">Blog</span></li> */}
          {/* <li><span className="navlink" aria-disabled="true" title="Coming soon">Support</span></li> */}
        </ul>
      </nav>
    </header>
  );
}
