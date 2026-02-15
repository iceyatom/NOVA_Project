// src/app/info/[slug]/page.tsx

import React from "react";
import Link from "next/link";
import InfoTemplate from "../../components/InfoTemplate";
import { getInfoTopicByKey } from "@/content/infoTopics";

/**
 * Information topic page that renders content based on the URL slug.
 * The slug serves as the content key to retrieve topic-specific data.
 */
const InfoTopicPage = ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;
  const topic = getInfoTopicByKey(slug);

  // Fallback state for invalid/missing keys
  if (!topic) {
    return (
      <main className="info-demo-page">
        <InfoTemplate
          title="Topic Not Found"
          subtitle="We couldn't find this topic yet."
          body={
            <div>
              <p>
                The topic you&apos;re looking for doesn&apos;t exist or
                hasn&apos;t been added yet.
              </p>
              <p>
                <Link
                  href="/"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Return to Home
                </Link>
              </p>
            </div>
          }
          images={[]}
        />
      </main>
    );
  }

  // Render the topic content using InfoTemplate
  return (
    <main className="info-demo-page">
      <InfoTemplate
        title={topic.title}
        subtitle={topic.subtitle}
        body={topic.body}
        images={topic.images}
      />
    </main>
  );
};

export default InfoTopicPage;
