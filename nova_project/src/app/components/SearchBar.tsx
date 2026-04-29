"use client";

import { useEffect, useRef, useState, FormEvent } from "react";

type Props = {
  title?: string;
  bgImage?: string;
  placeholder?: string;
  query?: string;
  onSearch?: (query: string) => void;
};

export default function SearchBar({
  title = "Your Trusted Source for Biological Supplies",
  bgImage = "/hero-lab.jpg",
  placeholder = "Search by Keyword",
  query: queryProp = "",
  onSearch,
}: Props) {
  const [query, setQuery] = useState(queryProp);
  const [submittedQuery, setSubmittedQuery] = useState(queryProp);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync if parent updates query (e.g., via URL changes)
  useEffect(() => {
    setQuery(queryProp);
    setSubmittedQuery(queryProp);
  }, [queryProp]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    onSearch?.(trimmed);

    // Keep focus and caret at end for good UX
    const el = inputRef.current;
    if (el) {
      el.focus();
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {}
    }
  }

  function handleInputChange(value: string) {
    setQuery(value);

    if (value.length === 0) {
      setSubmittedQuery("");
      onSearch?.("");
    }
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
                onChange={(e) => handleInputChange(e.target.value)}
                className="hero-input"
              />

              <button
                type="submit"
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
