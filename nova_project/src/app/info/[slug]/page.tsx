// src/app/info/[slug]/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

// Helper function to capitalize words
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const InfoTopicPage = ({ params }: { params: { slug: string } }) => {
  // Create a title from the slug
  const title = params.slug.split("-").map(capitalize).join(" ");

  // Since content isn't ready, we display a placeholder using the InfoTemplate.
  // This fulfills the requirement to defer to an empty-like page.
  return (
    <main className="info-demo-page">
      <InfoTemplate
        title={title}
        subtitle="Content Coming Soon"
        body={`More information about "${title}" will be available here shortly.`}
      />
    </main>
  );
};

export default InfoTopicPage;
