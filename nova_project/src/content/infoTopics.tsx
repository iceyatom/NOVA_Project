// src/content/infoTopics.ts

import React from "react";

export interface InfoTopic {
  title: string;
  subtitle: string;
  body: string | React.ReactNode;
  images: string[];
}

/**
 * Centralized registry of information topics for the Explore Pane.
 * Each topic is keyed by its URL slug (e.g., "owl-pellets").
 */
export const infoTopicsByKey: Record<string, InfoTopic> = {
  "owl-pellets": {
    title: "Owl Pellets",
    subtitle: "Discover What Owls Eat",
    body: (
      <div>
        <p>
          Owl pellets are the undigested parts of an owl&apos;s food that are
          regurgitated. These fascinating educational tools provide students with
          a hands-on opportunity to dissect and study the skeletal remains of
          small animals.
        </p>
        <p>
          Our owl pellets are professionally cleaned, heat-sterilized, and
          individually wrapped. They&apos;re perfect for classroom studies of predator-
          prey relationships, skeletal anatomy, and ecosystem dynamics.
        </p>
        <h3>What You&apos;ll Find Inside</h3>
        <ul>
          <li>Complete or partial skeletal remains</li>
          <li>Skulls, jaws, and teeth of small mammals</li>
          <li>Bones, fur, and feathers</li>
          <li>Evidence of the owl&apos;s hunting habits</li>
        </ul>
      </div>
    ),
    images: [
      "/images/owl-pellets-1.jpg",
      "/images/owl-pellets-2.jpg",
    ],
  },
  "live-algae-specimens": {
    title: "Live Algae Specimens",
    subtitle: "Essential Organisms for Biology Labs",
    body: (
      <div>
        <p>
          Our live algae specimens are cultured under optimal conditions to
          ensure viability and educational value. Perfect for studying photosynthesis,
          cellular structure, and aquatic ecosystems.
        </p>
        <p>
          Each culture is prepared with detailed care instructions and can be used
          for a variety of experiments including population studies, environmental
          impact assessments, and cellular biology investigations.
        </p>
      </div>
    ),
    images: ["/images/algae-specimen.jpg"],
  },
  "live-invertebrates": {
    title: "Live Invertebrates",
    subtitle: "Diverse Species for Hands-On Study",
    body: (
      <div>
        <p>
          Explore the fascinating world of invertebrates with our live specimens.
          From insects to mollusks, these organisms provide endless opportunities
          for behavioral and anatomical studies.
        </p>
      </div>
    ),
    images: ["/images/invertebrates.jpg"],
  },
  "live-vertebrates": {
    title: "Live Vertebrates",
    subtitle: "Vertebrate Biology in the Classroom",
    body: (
      <div>
        <p>
          Our live vertebrate specimens are ethically sourced and maintained to
          support the study of vertebrate anatomy, physiology, and behavior.
        </p>
      </div>
    ),
    images: ["/images/vertebrates.jpg"],
  },
  "live-bacteria-fungi-specimens": {
    title: "Live Bacteria & Fungi Specimens",
    subtitle: "Microbial Life Studies",
    body: (
      <div>
        <p>
          Study the hidden world of microorganisms with our bacterial and fungal
          cultures. Ideal for microbiology labs, these specimens help students
          understand microbial growth, colony morphology, and antimicrobial effects.
        </p>
      </div>
    ),
    images: ["/images/microbes.jpg"],
  },
  "live-plant-specimens": {
    title: "Live Plant Specimens",
    subtitle: "Botanical Studies and Experiments",
    body: (
      <div>
        <p>
          Our live plant specimens support a wide range of botanical studies
          including photosynthesis, transpiration, plant growth, and genetics.
          Each specimen is healthy and ready for classroom use.
        </p>
      </div>
    ),
    images: ["/images/plants.jpg"],
  },
  "live-protozoa-specimens": {
    title: "Live Protozoa Specimens",
    subtitle: "Single-Celled Organisms for Microscopy",
    body: (
      <div>
        <p>
          Observe the dynamic behavior of protozoa with our live cultures. These
          single-celled organisms are perfect for microscopy studies and understanding
          cellular processes in action.
        </p>
      </div>
    ),
    images: ["/images/protozoa.jpg"],
  },
  "preserved-invertebrates": {
    title: "Preserved Invertebrates",
    subtitle: "Long-Lasting Specimens for Detailed Study",
    body: (
      <div>
        <p>
          Our preserved invertebrate specimens are professionally prepared using
          safe, formaldehyde-free preservatives. These long-lasting specimens
          allow for detailed anatomical study without the need for special housing.
        </p>
      </div>
    ),
    images: ["/images/preserved-invertebrates.jpg"],
  },
  "preserved-vertebrates": {
    title: "Preserved Vertebrates",
    subtitle: "Comparative Anatomy and Physiology",
    body: (
      <div>
        <p>
          Study vertebrate anatomy with our professionally preserved specimens.
          Perfect for comparative anatomy lessons, these specimens provide
          hands-on learning opportunities for advanced biology students.
        </p>
      </div>
    ),
    images: ["/images/preserved-vertebrates.jpg"],
  },
};

/**
 * Retrieves a topic by its slug key.
 * Returns undefined if the key doesn't exist.
 */
export function getInfoTopicByKey(key: string): InfoTopic | undefined {
  return infoTopicsByKey[key];
}
