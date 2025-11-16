// app/contact/page.tsx

import { contactContent } from "../siteContent";
import Image from "next/image";

export default function ContactPage() {
  const c = contactContent;

  return (
    <section className="contact-page" aria-labelledby="contact-heading">
      <header className="contact-header">
        <h1 id="contact-heading">{c.heading}</h1>
        <p>{c.intro}</p>
      </header>

      <div className="contact-grid">
        {/* Address */}
        <section className="contact-card">
          <h2 className="contact-card-title">{c.addressLabel}</h2>
          <address className="contact-address">
            {c.addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </address>
        </section>

        {/* Phone & Email */}
        <section className="contact-card">
          <h2 className="contact-card-title">Get in Touch</h2>

          <div className="contact-field">
            <span className="contact-field-label">{c.phoneLabel}</span>
            <a href={`tel:${c.phoneHref}`} className="contact-link">
              {c.phoneDisplay}
            </a>
          </div>

          <div className="contact-field">
            <span className="contact-field-label">{c.emailLabel}</span>
            <a href={`mailto:${c.email}`} className="contact-link">
              {c.email}
            </a>
          </div>
        </section>

        {/* Business Hours */}
        <section className="contact-card">
          <h2 className="contact-card-title">{c.hoursLabel}</h2>
          <dl className="contact-hours">
            {c.hours.map((row) => (
              <div className="contact-hours-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Location / Map */}
        <section className="contact-card">
          <h2 className="contact-card-title">{c.mapLabel}</h2>
          <a
            href={c.mapLinkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-map-link"
          >
            <Image
              src={c.mapImageUrl}
              alt={c.mapImageAlt}
              width={800}
              height={400}
              className="contact-map"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </a>
          <p className="contact-map-caption">{c.mapLinkLabel}</p>
        </section>
      </div>
    </section>
  );
}
