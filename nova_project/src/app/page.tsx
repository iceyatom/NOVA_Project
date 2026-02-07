"use client";

// Home page: three-pane layout
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { HighlightContent } from "@/content/siteContent";
import { homeContent } from "@/content/siteContent";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/ & /g, " and ")
    .replace(/[\s-]+/g, "-")
    .replace(/[^\w-]+/g, "");

const leftLinks = [
  { label: "Owl pellets", href: "" },
  { label: "Live Algae Specimens", href: "" },
  { label: "Live Invertebrates", href: "" },
  { label: "Live Vertebrates", href: "" },
  { label: "Live Bacteria & Fungi Specimens", href: "" },
  { label: "Live Plant Specimens", href: "" },
  { label: "Live Protozoa Specimens", href: "" },
  { label: "Preserved Invertebrates", href: "" },
  { label: "Preserved Vertebrates", href: "" },
].map((link) => ({ ...link, href: `/info/${slugify(link.label)}` }));

const rightLinks = [
  { label: "Classroom Kits", href: "/catalog?c=kits" },
  { label: "Model Organisms", href: "/catalog?c=models" },
  { label: "Reagents", href: "/catalog?c=reagents" },
  { label: "Accessories", href: "/catalog?c=accessories" },
];

type Health = {
  ok: boolean;
  message?: string;
  version?: string;
  uptimeSeconds?: number;
  timestamp?: string;
  components?: {
    db?: {
      ok: boolean;
      dbName?: string | null;
      serverTime?: string | null;
      name?: string;
      code?: string;
      message?: string;
    };
    s3?: {
      ok: boolean;
      skipped?: boolean;
      name?: string;
      code?: string;
      message?: string;
    };
  };
};

function StatusBadge({ state }: { state: "loading" | "ok" | "error" }) {
  const text =
    state === "loading"
      ? "Checking AWS…"
      : state === "ok"
        ? "AWS connection successful"
        : "AWS connection failed";
  const icon = state === "loading" ? "⏳" : state === "ok" ? "✅" : "❌";
  const cls =
    state === "loading"
      ? "inline-flex items-center rounded-md px-2 py-1 text-sm bg-gray-100 text-gray-800"
      : state === "ok"
        ? "inline-flex items-center rounded-md px-2 py-1 text-sm bg-green-100 text-green-800"
        : "inline-flex items-center rounded-md px-2 py-1 text-sm bg-red-100 text-red-800";
  return (
    <span className={cls} role="status" aria-live="polite">
      <span className="mr-1">{icon}</span>
      {text}
    </span>
  );
}
const { mission, highlights, fallbacks } = homeContent;

const missionEyebrow = mission.eyebrow ?? "Welcome to Niles Biological";
const missionHeading = mission.heading ?? "Niles Biological";
const missionSummary = mission.summary ?? fallbacks.description;
const missionDetailParagraphs = Array.isArray(mission.detail)
  ? mission.detail
  : mission.detail
    ? [mission.detail]
    : [];
const missionImage = mission.image ?? fallbacks.image;
const missionImageAlt = mission.imageAlt ?? fallbacks.imageAlt;
const missionSupportingPoints =
  mission.supportingPoints && mission.supportingPoints.length > 0
    ? mission.supportingPoints
    : [fallbacks.description];
const missionCta = mission.cta ?? {
  label: "Browse the Catalog",
  href: "/catalog",
};

const highlightData: HighlightContent[] =
  highlights.length > 0
    ? highlights
    : Array.from(
        { length: 3 },
        (_, index): HighlightContent => ({
          id: `placeholder-${index}`,
        }),
      );

export default function HomePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [lastChecked, setLastChecked] = useState<string>("");

  const fetchHealth = useCallback(async () => {
    setState("loading");
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4500);
      const res = await fetch("/api/health", {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(t);
      const data: Health = await res.json();
      setHealth(data);
      setState(data.ok ? "ok" : "error");
      setLastChecked(new Date().toLocaleString());
    } catch {
      setState("error");
      setHealth(null);
      setLastChecked(new Date().toLocaleString());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const details = useMemo(() => {
    if (!health) return null;
    const db = health.components?.db;
    const s3 = health.components?.s3;
    return (
      <div className="mt-3 text-sm text-gray-700">
        {/* DB line */}
        <div>
          <strong>DB:</strong>{" "}
          {db?.ok ? (
            <>
              connected{db?.dbName ? ` to ${db.dbName}` : ""}{" "}
              {db?.serverTime
                ? `• server time ${new Date(db.serverTime).toLocaleString()}`
                : ""}
            </>
          ) : (
            <>
              error{db?.code ? ` (${db.code})` : ""}{" "}
              {db?.message ? `— ${db.message}` : ""}
            </>
          )}
        </div>
        {/* S3 line (if configured) */}
        {s3 && (
          <div className="mt-1">
            <strong>S3:</strong>{" "}
            {s3.skipped
              ? "skipped (not configured)"
              : s3.ok
                ? "ok"
                : `error${s3.code ? ` (${s3.code})` : ""}${s3.message ? ` — ${s3.message}` : ""}`}
          </div>
        )}
        <div className="mt-1 text-xs text-gray-500">
          {health.version ? `version ${health.version} • ` : ""}
          checked {lastChecked}
        </div>
      </div>
    );
  }, [health, lastChecked]);

  return (
    <div className="three-pane">
      {/* Center: mission storytelling */}
      <section className="pane pane-center" aria-labelledby="hero-heading">
        <div className="hero-banner">
          <div className="hero-banner-inner">
            <p className="hero-eyebrow">{missionEyebrow}</p>
            <h1 id="hero-heading" className="hero-title">
              {missionHeading}
            </h1>
            <p className="hero-subtitle">{missionSummary}</p>
          </div>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-cta">
              <Link className="button-secondary" href={missionCta.href}>
                {missionCta.label}
              </Link>
            </p>
            {missionDetailParagraphs.map((detail, index) => (
              <p className="hero-detail" key={`mission-detail-${index}`}>
                {detail}
              </p>
            ))}
            <ul className="mission-points">
              {missionSupportingPoints.map((point, index) => (
                <li key={`${point}-${index}`}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="hero-media">
            <Image
              src={missionImage}
              alt={missionImageAlt}
              width={640}
              height={428}
              sizes="(max-width: 900px) 100vw, 320px"
              priority
            />
          </div>
        </div>

        <div className="home-highlights" aria-label="Featured highlights">
          {highlightData.map((highlight) => {
            const cardTitle = highlight.title ?? fallbacks.title;
            const cardDescription =
              highlight.description ?? fallbacks.description;
            const cardImage = highlight.image ?? fallbacks.image;
            const cardAlt = highlight.imageAlt ?? fallbacks.imageAlt;
            const cardHref = highlight.href ?? "#";
            const cardCta = highlight.ctaLabel ?? "Learn more";
            const isInternalLink = cardHref.startsWith("/");

            return (
              <article className="highlight-card" key={highlight.id}>
                <div className="highlight-image">
                  <Image
                    src={cardImage}
                    alt={cardAlt}
                    width={600}
                    height={360}
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                </div>
                <div className="highlight-content">
                  <h3>{cardTitle}</h3>
                  <p>{cardDescription}</p>
                  {isInternalLink ? (
                    <Link className="highlight-cta" href={cardHref}>
                      {cardCta}
                    </Link>
                  ) : (
                    <a
                      className="highlight-cta"
                      href={cardHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {cardCta}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {/* ✅ AWS connection status */}
        <div className="mt-6 text-center">
          <StatusBadge state={state} />
          {details}
          <div className="mt-3">
            <button
              type="button"
              onClick={fetchHealth}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
              aria-label="Retry health check"
            >
              Retry
            </button>
          </div>
        </div>
      </section>

      {/* Right: quick-start links */}
      <aside className="pane pane-right" aria-labelledby="right-nav-heading">
        <h2 id="right-nav-heading" className="pane-title">
          Start Here
        </h2>
        <nav aria-label="Right catalog links">
          <ul className="pane-list">
            {rightLinks.map((l) => (
              <li key={l.href}>
                <Link className="nav-link" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Left: explore links */}
      <aside className="pane pane-left" aria-labelledby="left-nav-heading">
        <h2 id="left-nav-heading" className="pane-title">
          Explore
        </h2>
        <nav aria-label="Left catalog links">
          <ul className="pane-list">
            {leftLinks.map((l) => (
              <li key={l.href}>
                <Link className="nav-link" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
