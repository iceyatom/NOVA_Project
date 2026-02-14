// src/app/info/live-invertebrates/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const LiveInvertebratesPage: React.FC = () => {
  const content = {
    title: "Live Invertebrates",
    subtitle: "An essential window into Earth’s most diverse animal life.",
    body: (
      <>
        <h3>Overview</h3>
        <p>
          Invertebrates are animals without backbones and represent more than
          95% of Earth’s known animal species. They occur across nearly every
          habitat, with many groups living exclusively in marine environments
          and others distributed widely on land. Scientists estimate there may
          be between 3 million and 15 million invertebrate species worldwide,
          compared to roughly 47,000 vertebrate species.
        </p>
        <h3>Diversity and Scale</h3>
        <p>
          Invertebrates are spectacular in their abundance and diversity, with
          an extreme range of body sizes and forms. Some, such as the giant
          squid, can reach lengths of around 18 meters, while others, including
          gall mites, may measure less than 0.25 millimeters. This broad range
          reflects the many ecological roles invertebrates fill across aquatic
          and terrestrial systems.
        </p>
        <h3>Ecological Importance</h3>
        <p>
          Invertebrates play major roles in the functions and processes of most
          ecosystems. They contribute to food webs as consumers and prey, help
          regulate populations through predation and parasitism, and support key
          processes such as decomposition and nutrient cycling. Their presence
          and diversity often serve as indicators of environmental health and
          ecosystem stability.
        </p>
        <h3>Scientific and Educational Significance</h3>
        <p>
          Invertebrates have been crucial in advancing scientific understanding
          of how nervous systems function. Organisms such as the squid, Aplysia
          (sea hare), leech, horseshoe crab, lobster, and cockroach have served
          as important model organisms for neuroscience research. Notably,
          research involving the squid nervous system contributed to the Nobel
          Prize in Physiology or Medicine in 1963.
        </p>
        <p>
          Invertebrates are especially useful for study because neurons in all
          animals operate through electrochemical signaling. Since invertebrate
          nervous systems are generally less complex than those of vertebrates,
          they are often easier to isolate and examine, allowing researchers to
          study fundamental neural processes in a more controlled way.
        </p>
        <h3>Major Invertebrate Groups</h3>
        <p>
          Invertebrates include many major animal groups, each with distinct
          structures, habitats, and biological roles. Commonly studied groups
          include annelids, arthropods, cnidarians, echinoderms, molluscs, and
          nematodes. Some chordates are also invertebrates, representing closely
          related lineages to vertebrates.
        </p>
        <h3>Annelids</h3>
        <p>
          Annelids, collectively called Annelida, are segmented worms and
          include well-known organisms such as earthworms and leeches. This
          phylum contains about 15,000 modern species and is characterized by
          its ring-like segmentation.
        </p>
        <h3>Arthropods</h3>
        <p>
          Arthropods (phylum Arthropoda) are the largest animal phylum and
          include insects, arachnids, crustaceans, and many related organisms.
          They are generally defined by jointed limbs and an external skeleton.
        </p>
        <h3>Chordates</h3>
        <p>
          Chordates (phylum Chordata) include all vertebrates as well as several
          closely related invertebrate groups. These organisms share core
          developmental features such as a notochord at some stage of life.
        </p>
        <h3>Cnidarians</h3>
        <p>
          Cnidarians (phylum Cnidaria) are relatively simple animals found
          exclusively in aquatic environments, mostly marine. This group
          includes around 11,000 species and is often associated with
          specialized stinging cells used for defense and capturing prey.
        </p>
        <h3>Echinoderms</h3>
        <p>
          Echinoderms (phylum Echinodermata) are marine animals known for their
          spiny skin and presence at all ocean depths. This phylum appeared in
          the early Cambrian Period and includes about 7,000 living species as
          well as approximately 13,000 extinct species.
        </p>
        <h3>Molluscs</h3>
        <p>
          Molluscs (phylum Mollusca) are a large and diverse group that includes
          many familiar organisms, often recognized for their shells or studied
          as seafood species. This phylum also includes shell-less forms such as
          squids and octopuses.
        </p>
        <h3>Nematodes</h3>
        <p>
          Nematodes, or roundworms (phylum Nematoda), are among the most common
          animal phyla. More than 20,000 species have been described, and over
          15,000 of those are parasitic, demonstrating their wide ecological and
          biological impact.
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

export default LiveInvertebratesPage;
