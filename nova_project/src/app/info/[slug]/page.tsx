// src/app/info/[slug]/page.tsx
import React from "react";
import Link from "next/link";
import InfoTemplate from "../../components/InfoTemplate";
import { getTopicContent } from "@/content/infoTopics";

const InfoTopicPage = ({ params }: { params: { slug: string } }) => {
  const content = getTopicContent(params.slug);

  // Handle invalid/missing keys with user-friendly error state
  if (!content) {
    return (
      <main className="info-demo-page">
        <InfoTemplate
          title="Content Not Found"
          subtitle="We couldn't find what you're looking for"
          body={
            <div>
              <p>
                The information page for &quot;{params.slug}&quot; does not exist or may have
                been moved.
              </p>
              <p className="mt-4">
                <Link
                  href="/"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Return to Home
                </Link>
              </p>
              <p className="mt-4">
                Or explore our available topics from the Explore menu on the left side of the
                home page.
              </p>
            </div>
          }
          error="Content not found"
        />
      </main>
    );
  }

  // Render the topic content using InfoTemplate
  return (
    <main className="info-demo-page">
      <InfoTemplate
        title={content.title}
        subtitle={content.subtitle}
        body={content.body}
        images={content.images}
      />
    </main>
  );
};

export default InfoTopicPage;