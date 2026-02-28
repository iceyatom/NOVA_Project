"use client";

import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="about-page">
      {/* Hero Section - Bold Mission Statement */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <h1 className="about-hero-title">
            Inspiring Generations Through Science Education
          </h1>
          <p className="about-hero-subtitle">
            For over 30 years, we have been more than just a supplier—we are
            partners in creating unforgettable learning experiences that spark
            curiosity and foster scientific discovery.
          </p>
        </div>
      </section>

      {/* Two-Column Layout: Story + Image */}
      <div className="about-container">
        <div className="about-grid">
          {/* Left Column - Main Story Content */}
          <div className="about-content">
            {/* The Challenge We Address */}
            <section className="about-section">
              <h2 className="about-section-title">Why We Exist</h2>
              <p className="about-text">
                Science education faces real challenges: tight budgets, limited
                lab time, and the constant pressure to make every lesson count.
                Teachers need materials that arrive on time, in perfect
                condition, and ready to use. Students deserve specimens that
                bring textbook concepts to life.
              </p>
              <p className="about-text">
                That is where we come in. Our mission is simple: provide
                reliable, high-quality biological materials that make teaching
                easier and learning more engaging.
              </p>
            </section>

            {/* Our Origin Story */}
            <section className="about-section">
              <h2 className="about-section-title">How It Started</h2>
              <p className="about-text">
                Niles Biological was founded in 1989 by Ted and Robin, who had
                been working in scientific education supply since 1984. Starting
                with a clear vision and deep respect for educators, they
                identified critical gaps in customer service that needed
                addressing.
              </p>
              <p className="about-text">
                Through countless conversations with teachers over the years, we
                have refined our approach to deliver exactly what you need:
                friendly, knowledgeable service backed by reliable products. We
                went through hundreds of supplier partnerships and quality
                protocols to create what we believe is the most dependable
                biological supply service for classrooms.
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <div className="stat-number">30+</div>
                  <div className="stat-label">Years Serving Education</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">Live Delivery Guarantee</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">1000s</div>
                  <div className="stat-label">Schools Nationwide</div>
                </div>
              </div>
            </section>

            {/* What We Offer */}
            <section className="about-section">
              <h2 className="about-section-title">Our Approach Today</h2>
              <p className="about-text">
                We have evolved from a small local supplier to one of the
                world&apos;s largest providers of owl pellets and a
                comprehensive source for live specimens, preserved materials,
                and classroom kits. But our core values remain unchanged:
              </p>
              <ul className="about-list">
                <li>
                  <strong>On-Time Delivery:</strong> Order one week ahead for
                  Monday-Wednesday shipping. We understand your schedule and
                  plan accordingly.
                </li>
                <li>
                  <strong>Quality Assurance:</strong> If it is supposed to be
                  alive, it will be. 100% live delivery guarantee with reship or
                  credit for any issues.
                </li>
                <li>
                  <strong>Educational Value:</strong> Every product page doubles
                  as a searchable mini-encyclopedia, turning browsing into
                  learning.
                </li>
                <li>
                  <strong>Responsive Support:</strong> Call 916-386-2665 when
                  you need help. Our goal is to assist you quickly and
                  efficiently.
                </li>
              </ul>
            </section>

            {/* The Future */}
            <section className="about-section">
              <h2 className="about-section-title">Looking Ahead</h2>
              <p className="about-text">
                We are committed to continuous innovation in biological
                education. As classrooms evolve, so do we—expanding our product
                lines, improving our digital resources, and finding new ways to
                support teachers in their mission to inspire the next generation
                of scientists.
              </p>
              <p className="about-text">
                We are listening to what educators need and adapting our
                offerings accordingly. Whether it is sourcing specimens from new
                habitats to study ecosystem changes or developing more
                comprehensive educational materials, we are dedicated to being
                your trusted partner in science education.
              </p>
            </section>

            {/* Call to Action */}
            <section className="about-cta-section">
              <div className="about-cta-box">
                <h2 className="about-cta-title">Join Our Community</h2>
                <p className="about-cta-text">
                  Whether you are a first-time customer or a loyal partner who
                  has been with us for years—thank you. We are here because of
                  educators like you who trust us to deliver excellence.
                </p>
                <div className="about-cta-buttons">
                  <Link href="/catalog" className="button-primary">
                    Browse Our Catalog
                  </Link>
                  <Link href="/contact" className="button-secondary">
                    Get in Touch
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Sticky Image Gallery */}
          <aside className="about-sidebar">
            <div className="about-sidebar-sticky">
              {/* Main facility image */}
              <div className="about-image-card">
                <Image
                  src="/LabRoom.webp"
                  alt="Niles Biological laboratory facility"
                  width={600}
                  height={400}
                  className="about-image"
                  priority
                />
                <p className="about-image-caption">
                  Our state-of-the-art facility ensures quality control and safe
                  handling
                </p>
              </div>

              {/* Team/location image */}
              <div className="about-image-card">
                <Image
                  src="/nilesbio-location.webp"
                  alt="Niles Biological location"
                  width={600}
                  height={400}
                  className="about-image"
                />
                <p className="about-image-caption">
                  Serving schools nationwide from our California headquarters
                </p>
              </div>

              {/* Highlight box */}
              <div className="about-highlight-box">
                <h3 className="highlight-title">Our Commitment</h3>
                <ul className="highlight-list">
                  <li>✓ Ethical sourcing practices</li>
                  <li>✓ Expert quality control</li>
                  <li>✓ Same-day order processing</li>
                  <li>✓ Dedicated customer support</li>
                </ul>
              </div>

              {/* Delivery promise image */}
              <div className="about-image-card">
                <Image
                  src="/Delivery.webp"
                  alt="Niles Biological delivery guarantee"
                  width={600}
                  height={400}
                  className="about-image"
                />
                <p className="about-image-caption">
                  Reliable delivery you can count on
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
