// src/app/info/live-bacteria-&-fungi-specimens/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const LiveBacteriaAndFungiSpecimensPage: React.FC = () => {
  const content = {
    title: "Live Bacteria & Fungi Specimens",
    subtitle:
      "Explore microscopic life that shapes ecosystems, health, and industry.",
    body: (
      <>
        <h3>Overview</h3>
        <p>
          Bacteria and fungi are two major groups of organisms that play
          essential roles in nearly every environment on Earth. Bacteria are
          prokaryotic organisms and are among the most abundant forms of life,
          occurring in soil, water, and in close association with other living
          organisms. Fungi are eukaryotic organisms that obtain nutrients by
          digesting food externally and absorbing the resulting molecules into
          their cells. Together, bacteria and fungi are central to ecosystems,
          human health, and applied science.
        </p>

        <h3>Bacteria</h3>
        <p>
          Bacteria (singular: bacterium) are often used as a broad term for
          prokaryotes, but in this context the term is used specifically to
          refer to the eubacteria. Another major prokaryotic group is the
          Archaea, which are distinct from eubacteria. The study of bacteria is
          called bacteriology, a subfield of microbiology.
        </p>
        <p>
          Bacteria are ubiquitous and can be found in nearly all habitats,
          including soil, water, and as symbionts of other organisms. Many
          bacterial species are beneficial, while some are pathogenic and cause
          disease. Most bacteria are extremely small, commonly measuring about
          0.5–5.0 μm in length, though some “giant” bacteria can grow to sizes
          exceeding 0.5 mm.
        </p>

        <h3>Cell Structure and Movement</h3>
        <p>
          Many bacteria have cell walls, but bacterial walls are typically made
          of peptidoglycan, which differs from the cellulose found in plant cell
          walls and the chitin found in fungal cell walls. Some bacteria are
          motile and move using flagella, which are structurally distinct from
          the flagella found in eukaryotic organisms.
        </p>

        <h3>Fungi</h3>
        <p>
          Fungi are eukaryotic organisms that digest food externally and absorb
          nutrients into their cells. Although fungi were once classified as
          plants, they are not plants because they are heterotrophs and do not
          fix carbon through photosynthesis. Modern classification places fungi
          closer to animals than to plants, but fungi differ from animals in
          that they absorb food rather than ingest it. Fungi also typically have
          cell walls surrounding their cells, which is one reason they are
          placed in their own kingdom, Fungi.
        </p>

        <h3>Ecological and Human Importance</h3>
        <p>
          Fungi are primary decomposers in many ecosystems, breaking down dead
          plant and animal material and recycling nutrients. Humans use fungi in
          many important ways: yeasts enable fermentation in bread and beer,
          mushroom farming is a major industry, and fungi contribute to the
          production of medically valuable compounds. The biology of fungi is
          complex and extends far beyond their common appearance as molds on
          food.
        </p>

        <h3>Molds</h3>
        <p>
          Molds are various fungi that grow across surfaces as fluffy mycelia
          and often produce large quantities of spores, most commonly asexual
          spores but sometimes sexual spores. Mold growth commonly appears as a
          downy or furry coating on vegetable or animal matter and is often a
          sign of dampness or decay.
        </p>
        <p>
          Molds are not a single taxonomic group and can occur across multiple
          fungal divisions, including Zygomycota, Deuteromycota, and Ascomycota.
          While mold is often associated with spoilage, some molds are
          intentionally cultivated, such as in the production of certain cheeses
          and in the development of antibiotics derived from fungal defense
          compounds.
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

export default LiveBacteriaAndFungiSpecimensPage;
