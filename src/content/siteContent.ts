// Centralized marketing copy for the home page.
// Text snippets reference the public content at http://www.nilesbio.com
// (retrieved via the r.jina.ai mirror to avoid Incapsula blocking).

export type HighlightContent = {
  id: string;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  href?: string;
  ctaLabel?: string;
};

export type MissionContent = {
  eyebrow?: string;
  heading?: string;
  summary?: string;
  detail?: string | string[];
  supportingPoints?: string[];
  image?: string;
  imageAlt?: string;
  cta?: {
    label: string;
    href: string;
  };
};

export type HomeContent = {
  mission: MissionContent;
  highlights: HighlightContent[];
  fallbacks: {
    title: string;
    description: string;
    image: string;
    imageAlt: string;
  };
};

export const homeContent: HomeContent = {
  mission: {
    eyebrow: "Niles Biological",
    heading: "More than just a Biological Supply Company",
    image: "/logo-frog.webp",
    summary:
      "We hope to inspire many generations of students by providing a useful source of information, mixing tasteful presentations with vibrant imagery.",
    detail: [
      "Every product page doubles as a searchable mini-encyclopedia so teachers can let students browse, discover, and learn while they shop for specimens.",
      "We have gone the extra step of including information about the many specimens we provide that will compliment and augment the study experience.",
      'We provide your students with a "searchable mini-encyclopedia" built right into the presentation of our products so teachers can introduce students to discovering all of the information available.',
    ],
    supportingPoints: [
      "30+ years serving classrooms, labs, and field programs with curated biology supplies.",
      "Information-rich catalog entries that complement and augment each lesson plan.",
      "Friendly support - call 916-386-2665 if you need help planning the next lab.",
    ],
    cta: {
      label: "Browse the Catalog",
      href: "/catalog",
    },
  },
  highlights: [
    {
      id: "owl-pellets",
      title: "Largest Supplier of Owl Pellets",
      description:
        "Niles Biological is one of the world's largest suppliers of owl pellets, partnering with collectors across new habitats to study ecosystem changes.",
      image: "/Owl.webp",
      imageAlt: "Close-up of an owl pellet featured by Niles Biological.",
      href: "https://www.nilesbio.com/cat452.html",
      ctaLabel: "Shop Owl Pellets",
    },
    {
      id: "mini-encyclopedia",
      title: "Searchable Mini-Encyclopedia",
      description:
        "We include rich background information alongside every specimen, giving students a mini reference library while teachers shop for lab materials.",
      image: "/Searchable.webp",
      imageAlt:
        "Screenshot collage of the Niles Biological online catalog highlighting educational copy.",
      href: "/catalog",
      ctaLabel: "Explore Catalog Pages",
    },
    {
      id: "live-delivery",
      title: "Live Delivery Promise",
      description:
        "Order one week ahead so we can ship Monday-Wednesday; we guarantee 100% live delivery and will reship or credit any specimen that doesn't arrive healthy.",
      image: "/Delivery.webp",
      imageAlt:
        "Laboratory glassware and live culture containers prepared for shipment.",
      href: "https://www.nilesbio.com/cat8.html",
      ctaLabel: "Plan Live Shipments",
    },
  ],
  fallbacks: {
    title: "Update in progress",
    description: "We're curating more field notes and featured specimens.",
    image: "/FillerImage.png",
    imageAlt: "Placeholder image for forthcoming Niles Biological content.",
  },
};

// ----- About page content (add this) -----

export type Milestone = { date: string; title: string; detail?: string };
export type MediaItem = { url: string; alt: string };

export type AboutContent = {
  company: {
    name: string;
    overview: string;
    mission: string;
    values: string[];
  };
  milestones: Milestone[];
  media: {
    team: MediaItem[];
    facility: MediaItem[];
  };
  placeholders: {
    text: string;
    image: string;
  };
};

// Seed About from parts of homeContent to avoid duplication
export const aboutContent: AboutContent = {
  company: {
    name: homeContent.mission.eyebrow || "Niles Biological",
    overview:
      homeContent.mission.summary ||
      "Niles Biological supplies classrooms and labs with reliable specimens, slides, and kits.",
    mission:
      (Array.isArray(homeContent.mission.detail) &&
        homeContent.mission.detail[0]) ||
      "Empower science education with safe, consistent, classroom-ready biology materials.",
    values: homeContent.mission.supportingPoints?.length
      ? homeContent.mission.supportingPoints
      : [
          "Reliability for instructors and students",
          "Ethical sourcing & quality control",
          "Helpful documentation and support",
          "On-time fulfillment and responsive service",
        ],
  },
  milestones: [
    {
      date: "1960s",
      title: " Founded",
      detail: "Began supplying local classrooms with curated specimens.",
    },
    {
      date: "1990s",
      title: " Expanded Catalog",
      detail: "Introduced prepared slides and dissection kits.",
    },
    {
      date: "2010s",
      title: " QA Modernization",
      detail: "Scaled quality systems and cold-chain logistics.",
    },
    {
      date: "Today",
      title: " Nationwide Partner",
      detail: "Serving K-12 and higher-ed labs across the U.S.",
    },
  ],
  media: {
    team: [
      {
        url: "/TeamPlaceholder.webp",
        alt: "Niles Biological team group photo (placeholder)",
      },
    ],
    facility: [
      {
        url: "/FacilityPlaceholder.webp",
        alt: "Niles Biological facility lab area (placeholder)",
      },
    ],
  },
  placeholders: {
    text: homeContent.fallbacks.description || "N/A",
    image: homeContent.fallbacks.image || "/FillerImage.png",
  },
};
