// Home page: three-pane layout
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import type { HighlightContent } from "@/content/siteContent";
import { homeContent } from "@/content/siteContent";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/ & /g, " and ")
    .replace(/[\s-]+/g, "-")
    .replace(/[^\w-]+/g, "");

const NEWS_TITLE_PREVIEW_MAX = 60;
const NEWS_DESCRIPTION_PREVIEW_MAX = 120;
const NEWS_PREVIEW_FALLBACK = "Open this article to read the latest update.";

function truncateWithEllipsis(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

function extractNewsPreview(body: string): string {
  const blocks = body
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  for (const block of blocks) {
    if (block.startsWith("# ")) continue;
    if (block.startsWith("## ")) continue;
    if (/^!\[.*?\]\((https?:\/\/[^\s)]+)\)$/.test(block)) continue;
    return block.replace(/\s+/g, " ");
  }

  return NEWS_PREVIEW_FALLBACK;
}

function formatNewsDate(creationTime: Date): string {
  return creationTime.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const highlightData: HighlightContent[] =
  highlights.length > 0
    ? highlights
    : Array.from(
        { length: 3 },
        (_, index): HighlightContent => ({
          id: `placeholder-${index}`,
        }),
      );

export default async function HomePage() {
  const [newsArticlesResult, infoArticlesResult] = await Promise.allSettled([
    prisma.article.findMany({
      where: {
        type: "NEWS",
      },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.article.findMany({
      where: {
        type: "INFO",
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  ]);

  if (newsArticlesResult.status === "rejected") {
    console.error(
      "Home page failed to load NEWS articles from database:",
      newsArticlesResult.reason,
    );
  }

  if (infoArticlesResult.status === "rejected") {
    console.error(
      "Home page failed to load INFO articles from database:",
      infoArticlesResult.reason,
    );
  }

  const newsArticles =
    newsArticlesResult.status === "fulfilled" ? newsArticlesResult.value : [];
  const infoArticles =
    infoArticlesResult.status === "fulfilled" ? infoArticlesResult.value : [];

  const leftLinks = infoArticles.map((article) => {
    const titleSlug = slugify(article.title);
    const articleSlug = titleSlug
      ? `${article.id}-${titleSlug}`
      : `${article.id}`;

    return {
      label: article.title,
      href: `/info/${articleSlug}`,
    };
  });

  const newsCards = newsArticles.map((article) => {
    const titleSlug = slugify(article.title);
    const articleSlug = titleSlug
      ? `${article.id}-${titleSlug}`
      : `${article.id}`;

    return {
      id: article.id,
      label: article.title,
      preview: extractNewsPreview(article.body),
      createdAt: article.createdAt,
      href: `/info/${articleSlug}`,
    };
  });

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
            <div className="hero-cta-row">
              <div className="hero-cta-left">
                <Link className="button-secondary" href={missionCta.href}>
                  {missionCta.label}
                </Link>
              </div>
            </div>
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
      </section>

      {/* Right: news links */}
      <aside className="pane pane-right" aria-labelledby="right-nav-heading">
        <h2 id="right-nav-heading" className="pane-title">
          News
        </h2>
        <nav aria-label="News links">
          {newsCards.length > 0 ? (
            <ul className="home-news-preview-list">
              {newsCards.map((article) => (
                <li key={article.id}>
                  <Link className="home-news-preview-item" href={article.href}>
                    <div className="home-news-preview-top-row">
                      <div className="home-news-preview-title">
                        {truncateWithEllipsis(
                          article.label,
                          NEWS_TITLE_PREVIEW_MAX,
                        )}
                      </div>
                      <div className="home-news-preview-time">
                        <span>{formatNewsDate(article.createdAt)}</span>
                      </div>
                    </div>
                    <div className="home-news-preview-description">
                      {truncateWithEllipsis(
                        article.preview,
                        NEWS_DESCRIPTION_PREVIEW_MAX,
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="pane-list">
              <li>
                <p className="hero-detail">No news articles published yet.</p>
              </li>
            </ul>
          )}
        </nav>
      </aside>

      {/* Left: explore links */}
      <aside className="pane pane-left" aria-labelledby="left-nav-heading">
        <h2 id="left-nav-heading" className="pane-title">
          Explore
        </h2>
        <nav aria-label="Left catalog links">
          <ul className="pane-list">
            {leftLinks.length > 0 ? (
              leftLinks.map((l) => (
                <li key={l.href}>
                  <Link className="nav-link" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))
            ) : (
              <li>
                <p className="hero-detail">No info articles published yet.</p>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
