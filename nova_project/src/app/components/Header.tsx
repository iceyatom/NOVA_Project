"use client";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header>
      {/* Top-right navigation with toggle */}
      <nav className="topbar" aria-label="Main">
        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={open ? "true" : "false"}
          aria-controls="topbar-links"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>

        <ul id="topbar-links" className={`links ${open ? "open" : ""}`}>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/about" aria-current="page">
              About Us
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
