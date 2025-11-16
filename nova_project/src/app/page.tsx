// Home page: three-pane layout
import Image from "next/image";
import Link from "next/link";

import type { HighlightContent } from "@/content/siteContent";
import { homeContent } from "@/content/siteContent";

const leftLinks = [
  { label: "Microscope Slides", href: "/catalog?c=slides" },
  { label: "Preserved Specimens", href: "/catalog?c=preserved" },
  { label: "Live Cultures", href: "/catalog?c=cultures" },
  { label: "Dissection Kits", href: "/catalog?c=dissection" },
];

const rightLinks = [
  { label: "Classroom Kits", href: "/catalog?c=kits" },
  { label: "Model Organisms", href: "/catalog?c=models" },
  { label: "Reagents", href: "/catalog?c=reagents" },
  { label: "Accessories", href: "/catalog?c=accessories" },
];

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
