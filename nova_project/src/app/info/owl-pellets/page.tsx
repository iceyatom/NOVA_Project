// src/app/info/owl-pellets/page.tsx
import React from "react";
import InfoTemplate from "../../components/InfoTemplate";

const OwlPelletsPage: React.FC = () => {
  const content = {
    title: "Owl Pellets",
    subtitle: "A fascinating glimpse into the diet of birds of prey.",
    body: (
      <>
        <h3>What Owl Pellets Are</h3>
        <p>
          An owl pellet is a compact mass of undigested material that an owl
          regurgitates after feeding. Because owls swallow their prey whole and
          lack teeth to chew, parts such as bones, fur, feathers, teeth, and
          insect exoskeletons cannot be digested. These materials are compressed
          in the owl’s gizzard and later expelled as a pellet, typically six to
          ten hours after a meal. Regurgitating pellets helps keep the owl’s
          digestive tract clear and healthy.
        </p>
        <h3>How Pellets Form and What They Contain</h3>
        <p>
          After prey is swallowed, digestible tissues are broken down by
          enzymes, while indigestible parts are separated and packed together.
          The result is a small, firm pellet—usually gray or brown—ranging from
          about half an inch in small birds to one or two inches in larger birds
          like owls and hawks. The exact contents of a pellet reflect the owl’s
          diet and may include bones, fur, feathers, claws, bills, or plant
          material.
        </p>
        <h3>Why Owl Pellets Matter</h3>
        <p>
          Owl pellets are valuable to scientists and students because they
          provide insight into an owl’s diet without harming the bird. By
          examining pellets collected over time, ornithologists can track
          seasonal changes in prey and study predator–prey relationships.
          Pellets are commonly found at roosting or nesting sites, such as
          beneath trees, in barns, near cliffs, or in grasslands, depending on
          the species.
        </p>
        <h3>Barn Owls and Pellets</h3>
        <p>
          Barn Owls (Tyto alba) are among the most widespread land birds, found
          on every continent except Antarctica. They favor open habitats like
          grasslands and farmland and commonly prey on small mammals such as
          mice, voles, rats, and shrews, making them beneficial for natural pest
          control. Like other owls, Barn Owls regurgitate pellets containing the
          bones and fur of their prey, which are especially useful for studying
          local ecosystems.
        </p>
        <h3>Educational Value</h3>
        <p>
          Because pellets preserve skeletal remains, they are widely used in
          classrooms to help students identify prey species and understand food
          webs. By dissecting pellets, learners can see concrete evidence of how
          owls hunt, eat, and fit into their environment, making owl pellets a
          powerful hands-on tool for studying ecology.
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

export default OwlPelletsPage;
