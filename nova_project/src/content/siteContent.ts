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
      image: "https://www.nilesbio.com/images/categories/C452.jpg",
      imageAlt: "Close-up of an owl pellet featured by Niles Biological.",
      href: "https://www.nilesbio.com/cat452.html",
      ctaLabel: "Shop Owl Pellets",
    },
    {
      id: "mini-encyclopedia",
      title: "Searchable Mini-Encyclopedia",
      description:
        "We include rich background information alongside every specimen, giving students a mini reference library while teachers shop for lab materials.",
      image: "https://www.nilesbio.com/images/NilesBio_03.jpg",
      imageAlt:
        "Screenshot collage of the Niles Biological online catalog highlighting educational copy.",
      href: "https://www.nilesbio.com/cat115.html",
      ctaLabel: "Explore Catalog Pages",
    },
    {
      id: "live-delivery",
      title: "Live Delivery Promise",
      description:
        "Order one week ahead so we can ship Monday-Wednesday; we guarantee 100% live delivery and will reship or credit any specimen that doesn't arrive healthy.",
      image: "https://www.nilesbio.com/images/NilesBio_05.jpg",
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
