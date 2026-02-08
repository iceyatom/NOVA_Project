"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  title?: string;
  bgImage?: string;
  placeholder?: string;
};

export default function SearchBar({
  title = "Your Trusted Source for Biological Supplies",
  bgImage = "/hero-lab.jpg",
  placeholder = "Search by Keyword",
}: Props) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const canSubmit = query.trim().length > 0;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setSubmittedQuery(trimmed);

    // Preserve existing filter parameters while updating search
    const params = new URLSearchParams();
    params.set("search", trimmed);
    
    // Preserve category filters if they exist
    if (searchParams.get("category1")) params.set("category1", searchParams.get("category1")!);
    if (searchParams.get("category2")) params.set("category2", searchParams.get("category2")!);
    if (searchParams.get("category3")) params.set("category3", searchParams.get("category3")!);
    
    // Reset to page 1 on new search, but preserve pageSize
    params.set("page", "1");
    if (searchParams.get("pageSize")) params.set("pageSize", searchParams.get("pageSize")!);

    // Navigate to catalog with updated search parameters (client-side navigation)
    router.push(`/catalog?${params.toString()}`);

    const el = inputRef.current;
    if (el) {
      el.focus();
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {}
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !canSubmit) e.preventDefault();
  }

  return (
    <>
      {/* HERO BANNER (used on Catalog page) */}
      <section
        className="hero-search"
        aria-label="Site search"
        style={{
          backgroundImage: `linear-gradient(rgba(5,60,35,.70), rgba(5,60,35,.70)), url('${bgImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="hero-inner">
          <h1 className="hero-title">{title}</h1>

          <form
            role="search"
            aria-label="Catalog search"
            className="hero-form"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="hero-input-group">
              <input
                ref={inputRef}
                id="catalog-search-input"
                aria-label="Search catalog"
                name="q"
                type="search"
                inputMode="search"
                placeholder={placeholder}
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                className="hero-input"
              />

              <button
                type="submit"
                disabled={!canSubmit}
                aria-label="Search"
                className="hero-button"
                title="Search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  aria-hidden="true"
                >
                  <path
                    d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0-2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ECHO / ARIA-LIVE */}
      <p className="hero-echo" aria-live="polite" role="status">
        <span className="hero-echo-label">Last search:</span>{" "}
        {submittedQuery ? `“${submittedQuery}”` : "—"}
      </p>
    </>
  );
}
