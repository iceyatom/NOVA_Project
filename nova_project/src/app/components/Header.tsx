"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header>
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
            <Link
              href="/" 
              aria-current={isActive("/") ? "page" : undefined}
              className={isActive("/") ? "active" : undefined}
            >
              Home
            </Link>
          </li>          
          <li>
            <Link
              href="/catalog"
              aria-current={isActive("/catalog") ? "page" : undefined}
              className={isActive("/catalog") ? "active" : undefined}
            >
              Catalog
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              aria-current={isActive("/about") ? "page" : undefined}
              className={isActive("/about") ? "active" : undefined}
            >
              About Us
            </Link>
          </li>
          <li>
            <Link
              href="/login" 
              aria-current={isActive("/login") ? "page" : undefined}
              className={isActive("/login") ? "active" : undefined}
            >
              Login
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}