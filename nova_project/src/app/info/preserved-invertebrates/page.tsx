// src/app/info/preserved-invertebrates/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const PreservedInvertebratesPage: React.FC = () => {
  const content = {
    title: "Preserved Invertebrates",
    subtitle:
      "A detailed look at animals without backbones and their diversity.",
    body: (
      <>
        <h3>Overview</h3>
        <p>
          The term invertebrate was coined by Jean-Baptiste Lamarck to describe
          animals without a spinal column. As a result, invertebrates include
          nearly all animals except those in the subphylum Vertebrata, which
          includes fish, amphibians, reptiles, birds, and mammals. Lamarck
          originally divided invertebrates into two groups, Insecta and Vermes,
          but modern biology recognizes far greater diversity, with
          invertebrates classified across more than 30 phyla.
        </p>

        <h3>Classification and Evolutionary Context</h3>
        <p>
          Because invertebrates are defined as “all animals except vertebrates,”
          they do not form a single natural evolutionary group and are
          considered paraphyletic. Even so, the term remains widely used because
          it describes a large and important portion of animal life.
          Invertebrates account for roughly 97% of all known animal species and
          include a wide range of body plans, from simple organisms such as
          sponges and flatworms to complex groups such as arthropods and
          molluscs.
        </p>

        <h3>Chordate Connections</h3>
        <p>
          While vertebrates belong to the phylum Chordata, not all chordates are
          vertebrates. Two of the three chordate subphyla, Urochordata and
          Cephalochordata, are invertebrates. These groups, along with other
          invertebrates, generally possess a single cluster of Hox genes, while
          vertebrates have duplicated their original Hox cluster more than once.
        </p>

        <h3>Major Invertebrate Groups</h3>
        <p>
          Preserved invertebrate specimens commonly represent major phyla that
          highlight animal diversity, body structure, and ecological roles.
          Examples include segmented worms, arthropods, cnidarians, echinoderms,
          molluscs, nematodes, sponges, and parasitic flatworms.
        </p>

        <h3>Annelids</h3>
        <p>
          Annelids (phylum Annelida) are segmented worms, named from the Latin
          annellus meaning “little ring.” This phylum includes about 15,000
          modern species such as earthworms and leeches.
        </p>

        <h3>Arthropods</h3>
        <p>
          Arthropods (phylum Arthropoda) are the largest animal phylum and
          include insects, arachnids, crustaceans, and related groups. They are
          generally characterized by jointed limbs and an external skeleton.
        </p>

        <h3>Chordata</h3>
        <p>
          Chordates (phylum Chordata) include vertebrates as well as several
          closely related invertebrate lineages. These organisms share key
          developmental features such as a notochord at some stage of life.
        </p>

        <h3>Cnidarians</h3>
        <p>
          Cnidarians (phylum Cnidaria) are relatively simple animals found
          exclusively in aquatic environments, mostly marine. This phylum
          includes around 11,000 species and is known for specialized stinging
          cells used for defense and capturing prey.
        </p>

        <h3>Echinoderms</h3>
        <p>
          Echinoderms (phylum Echinodermata) are marine animals found at all
          depths and are known for their spiny skin. This phylum appeared during
          the early Cambrian Period and contains about 7,000 living species and
          roughly 13,000 extinct ones.
        </p>

        <h3>Molluscs</h3>
        <p>
          Molluscs (phylum Mollusca) are a large and diverse group that includes
          many familiar animals, often recognized for their shells or studied as
          seafood species. This phylum also includes shell-less forms such as
          squids and octopuses.
        </p>

        <h3>Nematodes</h3>
        <p>
          Nematodes, or roundworms (phylum Nematoda), are among the most common
          animal phyla. Over 20,000 species have been described, with more than
          15,000 of those living as parasites.
        </p>

        <h3>Sponges</h3>
        <p>
          Sponges, also known as poriferans (phylum Porifera), are simple
          aquatic animals named from Greek roots meaning “pore” and “to bear.”
          They are characterized by porous bodies and specialized cells that
          filter food particles from water.
        </p>

        <h3>Trematodes</h3>
        <p>
          Trematodes are a class within the phylum Platyhelminthes and consist
          of parasitic flatworms. This group includes two major categories of
          parasitic worms that often require hosts to complete their life
          cycles.
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

export default PreservedInvertebratesPage;
