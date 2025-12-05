"use client";

import { aboutContent } from "@/content/siteContent";

export default function AboutPage() {
  const c = aboutContent;
  const ph = c.placeholders;

  return (
    <main className="container mx-auto px-4 py-10 space-y-10">
      {/* Company Overview */}
      <section>
        <h1 className="text-3xl font-bold mb-2">{c.company.name}</h1>
        <p className="text-gray-700 mb-4">{c.company.overview || ph.text}</p>

        <h2 className="text-2xl font-semibold mt-6 mb-2">Our Mission</h2>
        <p className="text-gray-700">{c.company.mission || ph.text}</p>

        <h3 className="text-xl font-semibold mt-6 mb-2">Our Values</h3>
        <ul className="list-disc pl-6 space-y-1">
          {(c.company.values && c.company.values.length > 0
            ? c.company.values
            : [ph.text]
          ).map((v: string, i: number) => (
            <li key={i} className="text-gray-700">
              {v}
            </li>
          ))}
        </ul>
      </section>

      {/* Welcome / Company Story */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">
          Welcome to Niles Biological, Inc. online!
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Niles Biological was established in 1989. Ted and Robin have been
            working in the scientific education supply business since 1984.
          </p>
          <p>
            When we started this business we felt there were some very strong
            customer service issues that needed to be addressed, and now—after
            talking with many customers over the last 20 years—we have been able
            to discern a few things. Most important is what we believe you want,
            deserve, and will get with Niles Biological, Inc.: friendly,
            knowledgeable service.
          </p>
          <p>
            Our goal is always to help you quickly and efficiently when you
            call!
          </p>
          <p>
            Also important is good value—good quality at a good price. And of
            course you want your materials to arrive on time and in good
            condition. If a product is supposed to be alive, it will be! If
            there is ever a supply problem and we aren’t able to ship what you
            need when you need it, we’ll call you as soon as this is known. We
            understand the importance of your schedule and the value of your
            time.
          </p>
          <p>
            If you are checking us out for the first time, we’d like to welcome
            you to our circle of customers and thank you for doing business with
            us. We’d also like to thank those loyal customers that have been
            with us over the years—we are alive and well because of you!
          </p>
        </div>
      </section>

      {/* History / Milestones */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">History & Milestones</h2>
        {c.milestones && c.milestones.length > 0 ? (
          <ul className="space-y-2">
            {c.milestones.map(
              (
                m: { date: string; title: string; detail?: string },
                i: number,
              ) => (
                <li
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-start sm:gap-3"
                >
                  <span className="font-semibold text-gray-800 w-28 shrink-0">
                    {m.date}
                  </span>
                  <span className="text-gray-700">
                    <strong>{m.title}</strong> — {m.detail || ph.text}
                  </span>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p>{ph.text}</p>
        )}
      </section>

      {/* Team Images */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(c.media.team && c.media.team.length > 0
            ? c.media.team
            : [{ url: ph.image, alt: "Placeholder image" }]
          ).map((img: { url: string; alt: string }, i: number) => (
            <figure key={i} className="rounded-md overflow-hidden border">
              <img
                src={img.url || ph.image}
                alt={img.alt || "Placeholder"}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = ph.image;
                }}
              />
              <figcaption className="p-2 text-sm text-gray-600">
                {img.alt || "Placeholder"}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Facility Images */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Our Facility</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(c.media.facility && c.media.facility.length > 0
            ? c.media.facility
            : [{ url: ph.image, alt: "Placeholder image" }]
          ).map((img: { url: string; alt: string }, i: number) => (
            <figure key={i} className="rounded-md overflow-hidden border">
              <img
                src={img.url || ph.image}
                alt={img.alt || "Placeholder"}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = ph.image;
                }}
              />
              <figcaption className="p-2 text-sm text-gray-600">
                {img.alt || "Placeholder"}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
