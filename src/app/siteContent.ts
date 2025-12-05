// app/siteContent.ts

export type BusinessHourRow = {
  label: string;
  value: string;
};

export type ContactContent = {
  heading: string;
  intro: string;
  addressLabel: string;
  addressLines: string[];
  phoneLabel: string;
  phoneDisplay: string;
  phoneHref: string;
  emailLabel: string;
  email: string;
  hoursLabel: string;
  hours: BusinessHourRow[];
  mapLabel: string;
  mapImageUrl: string;
  mapImageAlt: string;
  mapLinkHref: string;
  mapLinkLabel: string;
};

export const contactContent: ContactContent = {
  heading: "Contact Niles Biological",
  intro:
    "Have a question about products, orders, or support? Reach out using the information below.",

  addressLabel: "Mailing Address",
  addressLines: ["9296 Elder Creek Road", "Sacramento, CA 95829"],

  phoneLabel: "Phone",
  phoneDisplay: "(916) 720-1814",
  phoneHref: "+19167201814",

  emailLabel: "Email",
  email: "nilesbio.monty@gmail.com",

  hoursLabel: "Business Hours",
  hours: [
    { label: "Monday – Friday", value: "7:00 a.m. – 4:00 p.m. PT" },
    { label: "Saturday", value: "N/A" },
    { label: "Sunday", value: "N/A" },
  ],

  mapLabel: "Location",
  mapImageUrl: "/nilesbio-location.webp",
  mapImageAlt: "Map showing the location of Niles Biological.",
  mapLinkHref:
    "https://www.google.com/maps/search/?api=1&query=9296+Elder+Creek+Road,+Sacramento,+CA+95829",
  mapLinkLabel: "Open in Google Maps",
};
