// src/content/infoTopics.ts

import React from "react";

// Type definition for all valid topic keys
export type TopicKey =
  | "owl-pellets"
  | "live-algae-specimens"
  | "live-invertebrates"
  | "live-vertebrates"
  | "live-bacteria-fungi-specimens"
  | "live-plant-specimens"
  | "live-protozoa-specimens"
  | "preserved-invertebrates"
  | "preserved-vertebrates";

// Type definition for topic content structure
export type TopicContent = {
  title: string;
  subtitle?: string;
  body: string | React.ReactNode;
  images?: string[];
};

// Topic content registry - placeholder content for logic implementation
// Content authoring is out of scope for this task
export const topicContentByKey: Record<TopicKey, TopicContent> = {
  "owl-pellets": {
    title: "Owl Pellets",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about owl pellets will be added here.</p>",
    images: [],
  },

  "live-algae-specimens": {
    title: "Live Algae Specimens",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about live algae specimens will be added here.</p>",
    images: [],
  },

  "live-invertebrates": {
    title: "Live Invertebrates",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about live invertebrates will be added here.</p>",
    images: [],
  },

  "live-vertebrates": {
    title: "Live Vertebrates",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about live vertebrates will be added here.</p>",
    images: [],
  },

  "live-bacteria-fungi-specimens": {
    title: "Live Bacteria & Fungi Specimens",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about live bacteria and fungi specimens will be added here.</p>",
    images: [],
  },

  "live-plant-specimens": {
    title: "Live Plant Specimens",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about live plant specimens will be added here.</p>",
    images: [],
  },

  "live-protozoa-specimens": {
    title: "Live Protozoa Specimens",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about live protozoa specimens will be added here.</p>",
    images: [],
  },

  "preserved-invertebrates": {
    title: "Preserved Invertebrates",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about preserved invertebrates will be added here.</p>",
    images: [],
  },

  "preserved-vertebrates": {
    title: "Preserved Vertebrates",
    subtitle: "Content Coming Soon",
    body: "<p>Detailed information about preserved vertebrates will be added here.</p>",
    images: [],
  },
};

// Helper function to get topic content by key with type safety
export function getTopicContent(key: string): TopicContent | null {
  if (isTopicKey(key)) {
    return topicContentByKey[key];
  }
  return null;
}

// Type guard to check if a string is a valid TopicKey
function isTopicKey(key: string): key is TopicKey {
  return key in topicContentByKey;
}
