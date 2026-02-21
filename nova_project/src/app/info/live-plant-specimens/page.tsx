// src/app/info/live-plant-specimens/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const LivePlantSpecimensPage: React.FC = () => {
  const content = {
    title: "Live Plant Specimens",
    subtitle: "Exploring the diversity and evolution of the plant kingdom.",
    body: (
      <>
        <h3>Overview</h3>
        <p>
          Plants are a major group of living organisms that include familiar
          forms such as trees, flowers, herbs, and ferns. It is estimated that
          approximately 350,000 plant species exist worldwide. As of 2004,
          roughly 287,655 species had been identified, with flowering plants
          accounting for the majority of known species.
        </p>

        <h3>Historical Classification</h3>
        <p>
          Early attempts to classify living organisms divided life into plants
          and animals, a distinction famously proposed by Aristotle. Later,
          Linnaeus formalized this division into the kingdoms Vegetabilia (later
          Plantae) and Animalia. Modern research has shown that the original
          concept of Plantae included several unrelated groups. Fungi and
          multiple algal lineages were later reassigned to separate kingdoms,
          though they are still often referred to as plants in informal
          contexts.
        </p>

        <h3>Defining Characteristics</h3>
        <p>
          Most plants are multicellular land organisms known as embryophytes.
          This group includes vascular plants, which possess true leaves, stems,
          and roots, as well as closely related non-vascular plants commonly
          referred to as bryophytes, such as mosses and liverworts.
        </p>
        <p>
          Plant cells are eukaryotic and have cell walls composed primarily of
          cellulose. Most plants produce their own food through photosynthesis,
          using light energy and carbon dioxide. A small number of plant species
          are non-photosynthetic and instead act as parasites on other plants.
          Plants are distinguished from green algae by specialized reproductive
          structures that protect developing reproductive cells.
        </p>

        <h3>Bryophytes</h3>
        <p>
          Bryophytes first appeared during the early Paleozoic era and typically
          require moist environments to survive. These plants remain relatively
          small throughout their life cycle and exhibit an alternation of
          generations between a dominant haploid gametophyte and a short-lived
          diploid sporophyte that depends on the gametophyte for nutrients.
        </p>

        <h3>Vascular Plants</h3>
        <p>
          Vascular plants emerged during the Silurian period and diversified
          rapidly by the Devonian period, spreading into a wide range of
          terrestrial environments. Adaptations such as vascular tissues for
          internal water transport and a protective cuticle allowed these plants
          to overcome the limitations faced by bryophytes. In vascular plants,
          the sporophyte typically functions as an independent organism, while
          the gametophyte stage is greatly reduced.
        </p>

        <h3>Educational Resources</h3>
        <p>
          For classroom use and further study, the PLANTS Database maintained by
          the United States Department of Agriculture provides standardized
          information on vascular plants, mosses, liverworts, hornworts, and
          lichens found throughout the United States and its territories.
        </p>
      </>
    ),
  };

  return (
    <main className="info-demo-page">
      <InfoTemplate {...content} />
    </main>
  );
};

export default LivePlantSpecimensPage;
