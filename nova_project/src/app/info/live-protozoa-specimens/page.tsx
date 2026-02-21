// src/app/info/live-protozoa-specimens/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const LiveProtozoaSpecimensPage: React.FC = () => {
  const content = {
    title: "Live Protozoa Specimens",
    subtitle:
      "Microscopic eukaryotes that reveal the complexity of single-celled life.",
    body: (
      <>
        <h3>Overview</h3>
        <p>
          Protozoa are single-celled eukaryotes, meaning their cells contain a
          nucleus and other membrane-bound structures. They often display traits
          commonly associated with animals, especially mobility and heterotrophy
          (obtaining energy by consuming organic material). Despite the name,
          protozoa are not animals, and the term is considered misleading.
        </p>

        <h3>Classification and Terminology</h3>
        <p>
          Protozoa have often been grouped within the kingdom Protista alongside
          algae, water molds, and slime molds. In some newer classification
          schemes, many algae are placed in Plantae or Chromista, and the
          remaining forms may be treated as a separate kingdom Protozoa. Because
          these classifications vary, protozoa are best understood as a
          descriptive grouping rather than a single evolutionary lineage.
        </p>

        <h3>Size and Habitat</h3>
        <p>
          Most protozoa are too small to be seen without a microscope. Many are
          approximately 0.01–0.05 mm in size, although forms up to about 0.5 mm
          are still relatively common. Protozoa are widespread in aquatic
          environments and soils, where they play important roles in local
          ecology and nutrient cycling.
        </p>

        <h3>Ecological Roles</h3>
        <p>
          Protozoa occupy multiple trophic levels. Many act as predators of
          unicellular or filamentous algae, bacteria, and microfungi, linking
          primary producers and decomposers to higher levels of the food chain.
          Protozoa also help regulate bacterial populations and biomass, making
          them significant in maintaining balance within microbial communities.
        </p>
        <p>
          As members of the micro- and meiofauna, protozoa serve as an important
          food source for microinvertebrates. This makes them critical in
          transferring energy from bacterial and algal production to successive
          trophic levels. Protozoa can also act as parasites or symbionts of
          multicellular animals.
        </p>

        <h3>Major Protozoa Types</h3>
        <p>
          Protozoa were traditionally classified based on how they move, though
          this approach is no longer considered a reliable representation of
          evolutionary relationships. Common groupings include amoeboids,
          ciliates, flagellates, and sporozoans.
        </p>

        <h3>Amoeboids</h3>
        <p>
          Amoeboids are cells that move and feed using temporary projections
          called pseudopods, or “false feet.” Amoeboid forms occur across
          multiple groups, and even some cells in multicellular animals can be
          amoeboid, such as white blood cells that engulf pathogens. Many
          protists exist as amoeboid cells throughout life or at specific
          stages. A well-known example is Amoeba proteus, and the term “amoebae”
          may refer to its relatives, similar organisms, or amoeboids more
          broadly.
        </p>

        <h3>Ciliates</h3>
        <p>
          Ciliates are a major and widespread group of protists found wherever
          water is present, including ponds, lakes, oceans, and moist soils.
          Many species form symbiotic relationships, and some are obligate or
          opportunistic parasites. Ciliates can be relatively large compared to
          other protozoa, with some reaching lengths up to about 2 mm, and they
          are among the most structurally complex single-celled organisms.
        </p>
        <p>
          Ciliates are defined by the presence of cilia, hair-like organelles
          used for movement, attachment, feeding, and sensing the environment.
          Cilia are similar in internal structure to flagella but are typically
          shorter and occur in much greater numbers.
        </p>

        <h3>Flagellates</h3>
        <p>
          Flagellates are cells that move using one or more whip-like organelles
          called flagella. Some animal cells are flagellated, such as sperm in
          many phyla. While higher plants and fungi generally do not produce
          flagellated cells, closely related groups such as green algae and
          chytrids do. Many protists exist as single-celled flagellates, and
          they appear across most major eukaryotic lineages. It is likely that
          early eukaryotes evolved from flagellate ancestors.
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

export default LiveProtozoaSpecimensPage;
