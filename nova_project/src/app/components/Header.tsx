"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

/* Header: brand on left, nav on right */
export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header>
      <nav className="topbar" aria-label="Main">
        {/* Brand (clickable logo + name) */}
        <Link href="/" aria-label="Niles Biological Inc. - Home" className="brand-link">
          <Image
            src="/logo-frog.jpg"
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
          <li><Link className="navlink" href="/">Home</Link></li>
          <li><Link className="navlink" href="/about" aria-current="page">About</Link></li>

          {/* Future pages: Unlinked for now */}
          <li><span className="navlink" aria-disabled="true" title="Coming soon">Browse Products</span></li>
          <li><span className="navlink" aria-disabled="true" title="Coming soon">Account / Login</span></li>
          <li><span className="navlink" aria-disabled="true" title="Coming soon">Contact</span></li>
        </ul>
      </nav>
    </header>
  );
}