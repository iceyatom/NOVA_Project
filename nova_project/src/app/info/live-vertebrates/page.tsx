// src/app/info/live-vertebrates/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const LiveVertebratesPage: React.FC = () => {
  const content = {
    title: "Live Vertebrates",
    subtitle: "A closer look at animals defined by the vertebral column.",
    body: (
      <>
        <h3>Overview</h3>
        <p>
          Vertebrates (Vertebrata) are a highly diverse group of animals ranging
          from early jawless forms such as lampreys to modern mammals, including
          humans. Vertebrates include all craniates except hagfishes and are
          primarily characterized by the presence of a vertebral column, which
          gives the group its name.
        </p>
        <h3>Evolutionary Background</h3>
        <p>
          Most living vertebrates today are jawed vertebrates, known as
          gnathostomes. However, lampreys represent a surviving lineage of
          jawless vertebrates. During the Late Silurian and Early Devonian
          periods, roughly 420 to 400 million years ago, jawless fishes were far
          more common than jawed forms. These ancient jawless vertebrates, often
          referred to as ostracoderms, declined over time, and the rise of
          gnathostomes became dominant around 380 million years ago.
        </p>
        <h3>Why Vertebrates Matter</h3>
        <p>
          Although vertebrates are not the most numerous animals in total
          species count or individual abundance, they remain a deeply studied
          and widely recognized group. Vertebrates are especially significant
          because humans are vertebrates, and Homo sapiens is part of the
          Vertebrata. Our familiarity with vertebrate biology and behavior has
          also made this group central to education, research, and biological
          classification.
        </p>
        <h3>Major Vertebrate Groups</h3>
        <p>
          Vertebrates are commonly grouped into major categories including fish,
          amphibians, reptiles, birds, and mammals. Each group is defined by
          distinct adaptations related to movement, reproduction, respiration,
          and habitat. Live vertebrate specimens often provide a strong
          foundation for studying comparative anatomy and major evolutionary
          transitions.
        </p>
        <h3>Birds</h3>
        <p>
          Birds are bipedal, warm-blooded, egg-laying vertebrates characterized
          primarily by feathers, forelimbs modified as wings, and lightweight,
          hollow bones that support flight in many species.
        </p>
        <h3>Amphibians</h3>
        <p>
          Amphibians (class Amphibia) are vertebrates that include tetrapods
          without amniotic eggs. Many amphibians undergo life cycles that
          involve both aquatic and terrestrial environments, making them useful
          models for studying development and environmental sensitivity.
        </p>
        <h3>Fish</h3>
        <p>
          Fish are water-dwelling vertebrates that breathe using gills and are
          typically cold-blooded. With over 29,000 species, fish represent the
          most diverse group of vertebrates and include a wide range of forms
          adapted to freshwater and marine habitats.
        </p>
        <h3>Reptiles</h3>
        <p>
          Reptiles are tetrapods and amniotes, meaning their embryos develop
          within an amniotic membrane. Today, reptiles are represented by four
          surviving orders: Crocodilia (crocodiles, caimans, and alligators),
          Rhynchocephalia (tuataras from New Zealand), Squamata (lizards,
          snakes, and amphisbaenids), and Testudines (turtles).
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

export default LiveVertebratesPage;
