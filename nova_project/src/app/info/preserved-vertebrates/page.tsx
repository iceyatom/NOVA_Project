// src/app/info/preserved-vertebrates/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const PreservedVertebratesPage: React.FC = () => {
  const content = {
    title: "Preserved Vertebrates",
    subtitle: "Examining animals defined by backbones and internal skeletons.",
    body: (
      <>
        <h3>Overview</h3>
        <p>
          Vertebrata is a subphylum of chordates that includes animals with a
          backbone or spinal column. Approximately 57,739 vertebrate species
          have been described. Vertebrates first evolved around 530 million
          years ago during the Cambrian explosion, with the earliest known
          vertebrate identified as Myllokunmingia. The name Vertebrata is
          derived from the vertebrae, the bones that form the spinal column.
        </p>

        <h3>General Characteristics</h3>
        <p>
          Vertebrates represent the largest subphylum of chordates and include
          many animals familiar to humans, such as fish, amphibians, reptiles,
          birds, and mammals. Most vertebrates possess a muscular system
          organized into paired masses and a central nervous system that is at
          least partly enclosed within the backbone.
        </p>

        <h3>Defining Features</h3>
        <p>
          Vertebrates are often defined by the presence of a backbone, brain
          case, and internal skeleton, although these traits are not universal
          across all members. Jawless vertebrates such as lampreys lack some of
          these defining features. A more consistent characteristic of
          vertebrates is the presence of a distinct head with concentrated
          sensory organs, particularly eyes, and a high degree of cephalization.
          This distinguishes vertebrates from other chordates such as lancelets,
          which lack a true head.
        </p>

        <h3>Skeleton and Body Structure</h3>
        <p>
          The internal skeleton of vertebrates is composed of cartilage, bone,
          or a combination of both. The earliest vertebrates developed external
          bony armor, which may have served as a phosphate reservoir while also
          providing protection. The skeleton supports the body during growth and
          allows vertebrates to reach larger sizes than most invertebrates.
        </p>
        <p>
          In most vertebrates, the skeleton includes a skull, vertebral column,
          and two pairs of limbs. In some groups, such as snakes and whales, one
          or both pairs of limbs have been reduced or lost over evolutionary
          time.
        </p>

        <h3>Major Vertebrate Groups</h3>
        <p>
          Preserved vertebrate specimens commonly represent major groups that
          illustrate structural diversity, evolutionary history, and adaptations
          to different environments. These include jawless fishes, amphibians,
          reptiles, birds, mammals, and multiple lineages of fish.
        </p>

        <h3>Agnatha</h3>
        <p>
          Agnatha, meaning “no jaws,” is a paraphyletic superclass of jawless
          fishes. The two surviving groups are lampreys and hagfish, with
          approximately 60 living species combined.
        </p>

        <h3>Amphibians</h3>
        <p>
          Amphibians (class Amphibia) are vertebrates that include tetrapods
          lacking amniotic eggs. These ectothermic animals typically divide
          their lives between aquatic and terrestrial environments and lack many
          of the adaptations required for a fully terrestrial existence.
        </p>

        <h3>Birds</h3>
        <p>
          Birds are bipedal, warm-blooded, egg-laying vertebrates characterized
          by feathers, forelimbs modified as wings, and lightweight hollow
          bones.
        </p>

        <h3>Chondrichthyes</h3>
        <p>
          Chondrichthyes, or cartilaginous fishes, include sharks and their
          relatives. These jawed fishes possess paired fins, paired nostrils,
          scales, two-chambered hearts, and skeletons made primarily of
          cartilage rather than bone.
        </p>

        <h3>Mammals</h3>
        <p>
          Mammals are vertebrates distinguished by mammary glands that produce
          milk for nourishing young, the presence of hair or fur, and
          endothermic, or warm-blooded, physiology.
        </p>

        <h3>Osteichthyes</h3>
        <p>
          Osteichthyes, or bony fishes, form a major superclass that includes
          ray-finned fishes (Actinopterygii) and lobe-finned fishes
          (Sarcopterygii). This group represents the largest diversity of fish
          species.
        </p>

        <h3>Reptiles</h3>
        <p>
          Reptiles are tetrapods and amniotes whose embryos develop within an
          amniotic membrane. Living reptiles are represented by four surviving
          orders: Crocodilia, Rhynchocephalia, Squamata, and Testudines.
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

export default PreservedVertebratesPage;
