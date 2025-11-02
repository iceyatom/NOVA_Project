// prisma/seed.ts
import { PrismaClient } from "../node_modules/.prisma/client";
const prisma = new PrismaClient();

async function main() {
  const items = [
    {
      itemName: "Green Algae Culture",
      category: "Living Specimen",
      description:
        "A sample culture of freshwater green algae ideal for classroom observation and experiments.",
      price: 18.5,
    },
    {
      itemName: "Guppies (Live)",
      category: "Aquatic Animal",
      description:
        "Colorful live guppies suitable for studying genetics and fish behavior in aquaria.",
      price: 24.99,
    },
    {
      itemName: "Bullfrog (Preserved)",
      category: "Vertebrate Specimen",
      description:
        "Formalin-preserved bullfrog specimen for detailed dissection and anatomy lessons.",
      price: 15.75,
    },
    {
      itemName: "Sheep Brain (Preserved)",
      category: "Mammalian Organ",
      description:
        "Individually packed preserved sheep brain for neurological and anatomical studies.",
      price: 22.0,
    },
    {
      itemName: "Starfish (Preserved)",
      category: "Marine Invertebrate",
      description:
        "Dried and preserved starfish specimen used for marine biology demonstrations.",
      price: 12.5,
    },
    {
      itemName: "Crayfish (Preserved)",
      category: "Arthropod Specimen",
      description:
        "Preserved crayfish used for anatomical and comparative physiology dissections.",
      price: 14.25,
    },
    {
      itemName: "Goldfish (Live)",
      category: "Aquatic Animal",
      description:
        "Hardy live goldfish for ecological and behavioral experiments in classroom aquaria.",
      price: 19.99,
    },
    {
      itemName: "Insect Collection Set",
      category: "Invertebrate Specimen",
      description:
        "Assorted preserved insects mounted for entomological study and classification.",
      price: 27.5,
    },
    {
      itemName: "Piglet (Preserved)",
      category: "Mammalian Specimen",
      description:
        "Preserved fetal pig specimen for advanced dissection and comparative anatomy exercises.",
      price: 35.0,
    },
    {
      itemName: "Earthworm (Preserved)",
      category: "Annelid Specimen",
      description:
        "Preserved earthworm used for basic dissection labs and introduction to invertebrate anatomy.",
      price: 10.75,
    },
    {
      itemName: "Clam (Preserved)",
      category: "Mollusk Specimen",
      description:
        "Preserved clam specimen ideal for demonstrating bivalve structure and shell morphology.",
      price: 11.5,
    },
    {
      itemName: "Hydra Culture",
      category: "Living Specimen",
      description:
        "Freshwater hydra colony for observing regeneration, feeding, and simple tissue structure.",
      price: 20.0,
    },
  ];

  for (const item of items) {
    await prisma.catalogItem.create({ data: item });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
