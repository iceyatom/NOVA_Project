// src/app/info/live-algae-specimens/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const LiveAlgaeSpecimensPage: React.FC = () => {
  const content = {
    title: "Live Algae Specimens",
    subtitle: "A fascinating glimpse into the world of microscopic life.",
    body: (
      <>
        <h3>Overview</h3>
        <p>
          Live Algae are a diverse group of photosynthetic organisms that
          convert light energy into chemical energy, producing simple sugars
          from inorganic substances. Although historically classified as simple
          plants, algae do not form a single evolutionary lineage. Instead, they
          represent a broad level of biological organization that has evolved
          multiple times throughout early life on Earth. Some algae are closely
          related to higher plants, while others are more closely aligned with
          various protist groups.
        </p>
        <h3>Biological Diversity and Structure</h3>
        <p>
          Algae exhibit remarkable diversity in form and complexity. They range
          from single-celled microscopic organisms to large, multicellular
          species with differentiated structures commonly referred to as
          seaweeds. Despite this diversity, all algae lack true roots, stems,
          leaves, flowers, and vascular tissues that characterize higher plants.
          Their structural simplicity allows them to thrive in environments
          where more complex plants cannot.
        </p>
        <h3>Photosynthesis and Energy Acquisition</h3>
        <p>
          Most algae are photoautotrophic, relying on photosynthesis as their
          primary energy source. However, some groups include mixotrophic
          species capable of supplementing photosynthesis by absorbing organic
          carbon through processes such as osmotrophy, myzotrophy, or
          phagotrophy. A small number of unicellular algae have lost or reduced
          their photosynthetic machinery entirely and depend solely on external
          energy sources. All algal photosynthetic systems are ultimately
          derived from cyanobacteria. As a result, algae produce oxygen as a
          by-product of photosynthesis, playing a critical role in maintaining
          Earth’s atmosphere. It is estimated that algae are responsible for
          approximately 73–87% of global oxygen production available for
          respiration by terrestrial organisms.
        </p>
        <h3>Habitats and Environmental Adaptations</h3>
        <p>
          Algae are most commonly found in aquatic environments, including
          freshwater, marine, and brackish systems, as well as damp terrestrial
          habitats. Terrestrial algae are typically inconspicuous and are more
          prevalent in moist or tropical regions due to their lack of vascular
          tissue and limited adaptations for water retention. In harsh
          environments, algae may persist through symbiotic relationships, such
          as those formed with fungi in lichens.
        </p>
        <h3>Ecological Importance</h3>
        <p>
          Algae are foundational to aquatic ecosystems. Microscopic algae
          suspended in the water column, known as phytoplankton, form the base
          of most aquatic food webs and support a vast array of marine and
          freshwater life. In certain conditions, rapid algal growth can result
          in blooms that discolor water and disrupt ecosystems by outcompeting
          or releasing toxins harmful to other organisms. Larger marine algae,
          or seaweeds, typically inhabit shallow coastal waters. Many species
          are harvested for human consumption or for commercially valuable
          products such as agar, fertilizers, and industrial additives.
        </p>
        <h3>Scientific Study</h3>
        <p>
          The scientific study of algae is known as phycology, or algology, and
          encompasses research into algal biology, ecology, evolution, and
          applied uses.
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

export default LiveAlgaeSpecimensPage;
