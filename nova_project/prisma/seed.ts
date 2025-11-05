// prisma/seed.ts
import { PrismaClient } from "../node_modules/.prisma/client";
const prisma = new PrismaClient();

async function main() {
  const items = [
    {
      sku: "DISSE1-9 KIT",
      itemName: "Dissecting Kit 1-9 - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Dissecting Kits",
      description:
        "A basic student dissecting kit with essential instruments for classroom use.",
      price: 10.0,
    },
    {
      sku: "DISSE10+ KIT",
      itemName: "Dissecting Kit 10+ - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Dissecting Kits",
      description:
        "Discounted dissecting kit for bulk orders of ten or more units.",
      price: 9.0,
    },
    {
      sku: "DISSE(Int)1-",
      itemName: "Intermediate Dissecting Kit 1-9 - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Dissecting Kits",
      description:
        "Intermediate-level dissecting kit for more advanced biology labs.",
      price: 17.0,
    },
    {
      sku: "DISSE(Int)10",
      itemName: "Intermediate Dissecting Kit 10+ - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Dissecting Kits",
      description:
        "Bulk pricing for intermediate dissecting kits, ideal for classroom sets.",
      price: 16.0,
    },
    {
      sku: "DISSTE1-9",
      itemName: "Standard Dissecting Tray 10 in x 7 in 1-9 - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Dissecting Trays",
      description:
        "Standard aluminum dissecting tray suitable for classroom lab specimens.",
      price: 4.65,
    },
    {
      sku: "DISSTE10+",
      itemName: "Standard Dissecting Tray 10+ - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Dissecting Trays",
      description:
        "Bulk order pricing for standard-size dissecting trays with wax liner.",
      price: 4.1,
    },
    {
      sku: "DISSTE LRG",
      itemName: "Large Dissecting Tray w/ Cover 12.75 in x 9 in - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Dissecting Trays",
      description:
        "Large dissecting tray with fitted cover, ideal for storing specimens safely.",
      price: 13.0,
    },
    {
      sku: "DISSPAN",
      itemName: "Large Dissecting Trays w/ Covers 10+ - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Dissecting Trays",
      description:
        "Bulk pack of large dissecting trays with covers for classroom use.",
      price: 12.0,
    },
    {
      sku: "FORC PL E",
      itemName: "Plastic Forceps - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Forceps",
      description:
        "Durable plastic forceps for basic specimen handling and dissection.",
      price: 0.95,
    },
    {
      sku: "FORC PL D",
      itemName: "Plastic Forceps - Dozen",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Forceps",
      description:
        "Set of twelve plastic forceps for classroom or lab group use.",
      price: 8.52,
    },
    {
      sku: "FORC M E",
      itemName: "Student Metal Forceps - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Forceps",
      description:
        "Sturdy metal forceps for classroom dissections and specimen handling.",
      price: 0.95,
    },
    {
      sku: "FORC M D",
      itemName: "Student Metal Forceps - Dozen",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Forceps",
      description: "Pack of twelve student-grade metal forceps for lab groups.",
      price: 8.28,
    },
    {
      sku: "MALLPROBE",
      itemName: "Mall Probes - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Probes",
      description:
        "Straight stainless probe for pointing and separating tissues.",
      price: 1.0,
    },
    {
      sku: "MALLPROBD",
      itemName: "Mall Probes - Class 12",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Probes",
      description: "Class pack of twelve stainless probes for classroom labs.",
      price: 9.6,
    },
    {
      sku: "SCALP BLS",
      itemName: "Scalpel Blades - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Scalpels",
      description:
        "Individual replacement scalpel blade for precision cutting.",
      price: 0.5,
    },
    {
      sku: "SCALP",
      itemName: "Disposable Scalpel - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Scalpels",
      description:
        "Disposable, pre-mounted scalpel for safe single-use dissections.",
      price: 1.4,
    },
    {
      sku: "SCALP12",
      itemName: "Disposable Scalpel - Dozen",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Scalpels",
      description:
        "Box of twelve disposable scalpels for class or lab sessions.",
      price: 14.4,
    },
    {
      sku: "SCALPD",
      itemName: "Student Safety Lock Scalpel - Dozen",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Scalpels",
      description:
        "Safety-lock student scalpels to reduce handling risk; dozen pack.",
      price: 19.2,
    },
    {
      sku: "SCALP HDL",
      itemName: "Surgeon Scalpel Handles - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Scalpels",
      description: "Reusable scalpel handle compatible with standard blades.",
      price: 1.0,
    },
    {
      sku: "BLADE",
      itemName: "Scalpel Blade",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Scalpels",
      description: "Bulk scalpel blade option for high-volume lab use.",
      price: 40.0,
    },
    {
      sku: "SCALP BLD",
      itemName: "Replacement Scalpel Blades 100/pk",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Scalpels",
      description:
        "Pack of 100 replacement blades for standard scalpel handles.",
      price: 25.8,
    },
    {
      sku: "SCISS E",
      itemName: "Student Sccissors - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Scissors",
      description: "Student-grade dissection scissors for general lab cutting.",
      price: 1.0,
    },
    {
      sku: "TEASNDLE",
      itemName: "Teasing Needle (Ste. or Bent) - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Teasing Needles",
      description:
        "Straight or bent teasing needle for delicate tissue manipulation.",
      price: 0.5,
    },
    {
      sku: "TEASNDLE 12+",
      itemName: "Teasing Needle (12+) - Each",
      category3: "Laboratory Supplies",
      category2: "Dissecting Supplies",
      category1: "Teasing Needles",
      description:
        "Discounted price per teasing needle on orders of 12 or more.",
      price: 0.35,
    },
    {
      sku: "SLIDSI12",
      itemName: "Single Concave Slides - Box of 12",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Concave Slides",
      description:
        "Box of 12 single concave glass slides for wet mounts and specimens.",
      price: 5.75,
    },
    {
      sku: "SLIDSI72",
      itemName: "Single Concave Slides - Box of 72",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Concave Slides",
      description:
        "Box of 72 single concave glass slides for microscopy and observation work.",
      price: 14.85,
    },
    {
      sku: "SLIDDB12",
      itemName: "Double Concave Slides - Box of 12",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Concave Slides",
      description:
        "Double concave glass slides, ideal for viewing liquid specimens under a microscope.",
      price: 9.15,
    },
    {
      sku: "COVERGL1-9SQ",
      itemName: "Coverglass (1-9 oz) Student Grade - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverglass",
      description:
        "Standard student-grade coverglass for microscope slide protection and clarity.",
      price: 3.1,
    },
    {
      sku: "COVERGL10-19",
      itemName: "Coverglass (10-19 oz) Student Grade - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverglass",
      description:
        "Bulk discount for student-grade coverglass, used for mounting specimens.",
      price: 2.95,
    },
    {
      sku: "COVERGL20+SQ",
      itemName: "Coverglass (20+ oz) Student Grade - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverglass",
      description:
        "Large quantity student-grade coverglass, economical for classrooms.",
      price: 2.5,
    },
    {
      sku: "COVERP1-9oz",
      itemName: "Coverglass (1-9 oz.) - Each (P)",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverglass",
      description:
        "Premium-grade coverglass for precise optical clarity in microscopy.",
      price: 4.25,
    },
    {
      sku: "COVERP10-19o",
      itemName: "Coverglass (10-19 oz) - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverglass",
      description:
        "Mid-bulk pack of premium coverglass for laboratory specimen preparation.",
      price: 4.0,
    },
    {
      sku: "COVERP20+oz",
      itemName: "Coverglass (20+oz) - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverglass",
      description:
        "Bulk premium coverglass offering professional-grade optical clarity.",
      price: 3.75,
    },
    {
      sku: "COVERSP10+",
      itemName: "Plastic Coverslips (10+) - Class 100/Box",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverslips",
      description:
        "Box of 100 durable plastic coverslips, ideal for educational use.",
      price: 3.15,
    },
    {
      sku: "COVEBX",
      itemName: "Plastic Coverslips - Class 100/Box",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverslips",
      description:
        "Pack of 100 clear plastic coverslips for routine microscopy work.",
      price: 3.65,
    },
    {
      sku: "COVERSLP1000",
      itemName: "Plastic Coverslips - Class 1000/Box",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Coverslips",
      description:
        "Bulk box of 1000 plastic coverslips for high-volume educational labs.",
      price: 31.0,
    },
    {
      sku: "LENP E",
      itemName: "Lens Paper (50 sheets)",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Lens Paper",
      description:
        "Pack of 50 sheets of lint-free lens paper for cleaning optical lenses.",
      price: 1.0,
    },
    {
      sku: "LENPE12+",
      itemName: "Lens Paper (50 sheets) 12+",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Lens Paper",
      description:
        "Discounted pack pricing for lens cleaning paper in quantities of 12 or more.",
      price: 0.8,
    },
    {
      sku: "SLIDE2-9",
      itemName: "Microscope Slides (2-9 Box) - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Microscope Slides",
      description:
        "High-quality glass microscope slides in small quantity boxes for lab use.",
      price: 4.85,
    },
    {
      sku: "SLIDE10-19",
      itemName: "Microscope Slides (10-19 Box) - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Microscope Slides",
      description:
        "Discounted pricing for boxes of 10–19 standard glass microscope slides.",
      price: 4.5,
    },
    {
      sku: "SLIDE20+",
      itemName: "Microscope Slides (20+ Box) - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Microscope Slides",
      description:
        "Economical boxes of 20 or more microscope slides for repeated classroom experiments.",
      price: 4.0,
    },
    {
      sku: "SLIDEB",
      itemName: "Microscope Slides - 72/Box",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Microscope Slides",
      description:
        "Box of 72 standard glass slides for educational or professional lab use.",
      price: 5.85,
    },
    {
      sku: "MULTIBX 1-9",
      itemName: "Multi-Wipes (1-9 Box)",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Multi-Wipes",
      description:
        "Lint-free multi-purpose lab wipes for cleaning slides and lenses.",
      price: 2.1,
    },
    {
      sku: "MULTIBX 10+",
      itemName: "Multi-Wipes (10+ Box)",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Multi-Wipes",
      description:
        "Bulk order of lab-grade wipes designed for optical and surface cleaning.",
      price: 1.9,
    },
    {
      sku: "SLIDP12",
      itemName: "Plastic Microscope Slides (12/bx)",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Plastic Microscope Slides",
      description:
        "Durable plastic microscope slides for safe classroom handling, pack of 12.",
      price: 2.3,
    },
    {
      sku: "SLIDPL144",
      itemName: "Plastic Microscope Slides (144/box) - Each",
      category3: "Laboratory Supplies",
      category2: "Microscopy Supplies",
      category1: "Plastic Microscope Slides",
      description:
        "Bulk box of 144 reusable plastic slides ideal for student laboratories.",
      price: 9.8,
    },
    {
      sku: "ANAB12",
      itemName: "Anabaena - Class 12",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Anabaena",
      description:
        "Culture of Anabaena cyanobacteria suitable for microscopic study of filamentous structures.",
      price: 7.5,
    },
    {
      sku: "ANAB30",
      itemName: "Anabaena - Class 30",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Anabaena",
      description: "Medium-size class culture of Anabaena for teaching labs.",
      price: 8.2,
    },
    {
      sku: "ANAB60",
      itemName: "Anabaena - Class 60",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Anabaena",
      description:
        "Large class culture of Anabaena for microscope demonstrations.",
      price: 16.4,
    },
    {
      sku: "ANAB90",
      itemName: "Anabaena - Class 90",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Anabaena",
      description: "Expanded Anabaena culture for group lab exercises.",
      price: 24.0,
    },
    {
      sku: "ANAB120",
      itemName: "Anabaena - Class 120",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Anabaena",
      description:
        "Extra-large class culture of Anabaena for full-class demonstrations.",
      price: 32.8,
    },
    {
      sku: "GLOE12",
      itemName: "Gloeocapsa - Class 12",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Gloeocapsa",
      description:
        "Gloeocapsa cyanobacteria sample for studying gelatinous colonies.",
      price: 7.5,
    },
    {
      sku: "GLOE30",
      itemName: "Gloeocapsa - Class 30",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Gloeocapsa",
      description:
        "Class culture of Gloeocapsa for instruction in prokaryotic cell structure.",
      price: 8.2,
    },
    {
      sku: "GLOE60",
      itemName: "Gloeocapsa - Class 60",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Gloeocapsa",
      description: "Expanded Gloeocapsa culture for advanced biology labs.",
      price: 16.4,
    },
    {
      sku: "GLOE90",
      itemName: "Gloeocapsa - Class 90",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Gloeocapsa",
      description:
        "Large culture of Gloeocapsa for demonstrating colonial morphology.",
      price: 24.0,
    },
    {
      sku: "GLOE120",
      itemName: "Gloeocapsa - Class 120",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Gloeocapsa",
      description:
        "Extra-large Gloeocapsa sample for full-class microscope demonstrations.",
      price: 32.8,
    },
    {
      sku: "NOST12",
      itemName: "Nostoc - Class 12",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Nostoc",
      description:
        "Culture of Nostoc cyanobacteria for examining nitrogen-fixing heterocysts.",
      price: 7.5,
    },
    {
      sku: "NOST30",
      itemName: "Nostoc - Class 30",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Nostoc",
      description:
        "Medium-size class culture of Nostoc for microbiological observation.",
      price: 8.2,
    },
    {
      sku: "NOST60",
      itemName: "Nostoc - Class 60",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Nostoc",
      description: "Larger Nostoc culture for small group experiments.",
      price: 16.4,
    },
    {
      sku: "NOST90",
      itemName: "Nostoc - Class 90",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Nostoc",
      description: "Bulk Nostoc culture for hands-on classwork and analysis.",
      price: 24.0,
    },
    {
      sku: "NOST120",
      itemName: "Nostoc - Class 120",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Nostoc",
      description: "Extra-large Nostoc culture for full-class demonstrations.",
      price: 32.8,
    },
    {
      sku: "OSCI12",
      itemName: "Oscillatoria - Class 12",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Oscillatoria",
      description:
        "Oscillatoria cyanobacteria used to demonstrate filamentous movement.",
      price: 7.5,
    },
    {
      sku: "OSCI30",
      itemName: "Oscillatoria - Class 30",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Oscillatoria",
      description: "Medium classroom sample of Oscillatoria for microscopy.",
      price: 8.2,
    },
    {
      sku: "OSCI60",
      itemName: "Oscillatoria - Class 60",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Oscillatoria",
      description:
        "Larger Oscillatoria culture for group demonstrations and analysis.",
      price: 16.4,
    },
    {
      sku: "OSCI90",
      itemName: "Oscillatoria - Class 90",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Oscillatoria",
      description:
        "Expanded Oscillatoria culture for larger class experiments.",
      price: 24.0,
    },
    {
      sku: "OSCI120",
      itemName: "Oscillatoria - Class 120",
      category3: "Live Algae Specimens",
      category2: "Blue-Green Algae",
      category1: "Oscillatoria",
      description: "Extra-large Oscillatoria culture for extended lab study.",
      price: 32.8,
    },
    {
      sku: "DIAT30",
      itemName: "Diatoms - Class 30",
      category3: "Live Algae Specimens",
      category2: "Diatoms",
      category1: "Diatoms",
      description:
        "Live diatom culture for studying silica-based cell walls under a microscope.",
      price: 8.2,
    },
    {
      sku: "DIAT60",
      itemName: "Diatoms - Class 60",
      category3: "Live Algae Specimens",
      category2: "Diatoms",
      category1: "Diatoms",
      description: "Larger diatom culture for group microscopy demonstrations.",
      price: 16.4,
    },
    {
      sku: "DIAT90",
      itemName: "Diatoms - Class 90",
      category3: "Live Algae Specimens",
      category2: "Diatoms",
      category1: "Diatoms",
      description: "Expanded diatom sample culture for classroom instruction.",
      price: 24.0,
    },
    {
      sku: "DIAT120",
      itemName: "Diatoms - Class 120",
      category3: "Live Algae Specimens",
      category2: "Diatoms",
      category1: "Diatoms",
      description:
        "Extra-large live diatom culture for advanced study of algae diversity.",
      price: 32.8,
    },
    {
      sku: "PERI12",
      itemName: "Peridinium - Class 12",
      category3: "Live Algae Specimens",
      category2: "Dinoflagellates",
      category1: "Peridinium",
      description:
        "Culture of Peridinium used to study flagellar motion and cell rotation.",
      price: 7.5,
    },
    {
      sku: "PERI30",
      itemName: "Peridinium - Class 30",
      category3: "Live Algae Specimens",
      category2: "Dinoflagellates",
      category1: "Peridinium",
      description:
        "Medium Peridinium culture for observing movement and photosynthetic activity.",
      price: 8.2,
    },
    {
      sku: "PERI60",
      itemName: "Peridinium - Class 60",
      category3: "Live Algae Specimens",
      category2: "Dinoflagellates",
      category1: "Peridinium",
      description:
        "Larger Peridinium culture suitable for class-wide microscopy demonstrations.",
      price: 16.4,
    },
    {
      sku: "PERI90",
      itemName: "Peridinium - Class 90",
      category3: "Live Algae Specimens",
      category2: "Dinoflagellates",
      category1: "Peridinium",
      description:
        "Expanded Peridinium sample for multiple microscope stations.",
      price: 24.0,
    },
    {
      sku: "PERI120",
      itemName: "Peridinium - Class 120",
      category3: "Live Algae Specimens",
      category2: "Dinoflagellates",
      category1: "Peridinium",
      description:
        "Extra-large culture of Peridinium for extended laboratory observation.",
      price: 32.8,
    },
    {
      sku: "CHAR12",
      itemName: "Chara - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Chara",
      description:
        "Culture of Chara (stonewort) green algae for examining plant-like thallus structure.",
      price: 12.0,
    },
    {
      sku: "CHAR30",
      itemName: "Chara - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Chara",
      description:
        "Larger Chara culture for classroom demonstrations of branching and reproduction.",
      price: 18.0,
    },
    {
      sku: "CHLO12",
      itemName: "Chlorella - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Chlorella",
      description:
        "Culture of Chlorella algae for studying photosynthesis and cell growth.",
      price: 7.5,
    },
    {
      sku: "CHLO30",
      itemName: "Chlorella - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Chlorella",
      description:
        "Medium Chlorella culture suitable for basic biological experiments.",
      price: 8.2,
    },
    {
      sku: "CHLO60",
      itemName: "Chlorella - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Chlorella",
      description:
        "Larger Chlorella culture ideal for group analysis of algae cell structure.",
      price: 16.4,
    },
    {
      sku: "CHLO90",
      itemName: "Chlorella - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Chlorella",
      description:
        "Expanded Chlorella culture for studying algae in environmental systems.",
      price: 24.0,
    },
    {
      sku: "CHLO120",
      itemName: "Chlorella - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Chlorella",
      description:
        "Extra-large Chlorella sample for advanced biology instruction.",
      price: 32.8,
    },
    {
      sku: "CLOS12",
      itemName: "Closterium - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Closterium",
      description:
        "Closterium desmid algae culture for cell symmetry and chloroplast study.",
      price: 7.5,
    },
    {
      sku: "CLOS30",
      itemName: "Closterium - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Closterium",
      description:
        "Medium Closterium culture for group microscope use in labs.",
      price: 8.2,
    },
    {
      sku: "CLOS60",
      itemName: "Closterium - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Closterium",
      description:
        "Large Closterium culture for teaching symmetry in green algae.",
      price: 16.4,
    },
    {
      sku: "CLOS90",
      itemName: "Closterium - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Closterium",
      description:
        "Expanded Closterium algae sample for multiple microscope stations.",
      price: 24.0,
    },
    {
      sku: "CLOS120",
      itemName: "Closterium - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Closterium",
      description:
        "Extra-large Closterium algae culture for detailed microscope study of desmids.",
      price: 32.8,
    },
    {
      sku: "DESM12",
      itemName: "Desmids - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Desmids",
      description:
        "Small Desmid culture showing unicellular green algae symmetry and structure.",
      price: 7.5,
    },
    {
      sku: "DESM30",
      itemName: "Desmids - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Desmids",
      description:
        "Medium Desmid culture for classroom microscope observation.",
      price: 8.2,
    },
    {
      sku: "DESM60",
      itemName: "Desmids - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Desmids",
      description:
        "Larger Desmid culture ideal for small group microscopy lessons.",
      price: 16.4,
    },
    {
      sku: "DESM90",
      itemName: "Desmids - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Desmids",
      description:
        "Expanded Desmid sample for advanced demonstrations of algal cell morphology.",
      price: 24.0,
    },
    {
      sku: "DESM120",
      itemName: "Desmids - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Desmids",
      description:
        "Extra-large Desmid culture for full-class use in biology labs.",
      price: 32.8,
    },
    {
      sku: "HYDR12",
      itemName: "Hydrodictyon - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Hydrodictyon",
      description:
        "Small Hydrodictyon (water net) culture for studying colonial algae.",
      price: 7.5,
    },
    {
      sku: "HYDR30",
      itemName: "Hydrodictyon - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Hydrodictyon",
      description:
        "Medium Hydrodictyon culture illustrating net-like colonial formation.",
      price: 8.2,
    },
    {
      sku: "HYDR60",
      itemName: "Hydrodictyon - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Hydrodictyon",
      description:
        "Large Hydrodictyon culture for classroom observation of filamentous colonies.",
      price: 16.4,
    },
    {
      sku: "HYDR90",
      itemName: "Hydrodictyon - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Hydrodictyon",
      description:
        "Expanded Hydrodictyon culture ideal for microscope study of colony networks.",
      price: 24.0,
    },
    {
      sku: "HYDR120",
      itemName: "Hydrodictyon - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Hydrodictyon",
      description:
        "Extra-large Hydrodictyon sample for detailed examination of algae morphology.",
      price: 32.8,
    },
    {
      sku: "NITE30",
      itemName: "Nitella - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Nitella",
      description:
        "Culture of Nitella charophyte algae showing multicellular branching and nodes.",
      price: 10.2,
    },
    {
      sku: "OEDO12",
      itemName: "Oedogonium - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Oedogonium",
      description:
        "Small culture of Oedogonium filamentous green algae for classroom use.",
      price: 7.5,
    },
    {
      sku: "OEDO30",
      itemName: "Oedogonium - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Oedogonium",
      description:
        "Medium Oedogonium culture for studying reproduction and growth in algae.",
      price: 8.2,
    },
    {
      sku: "OEDO60",
      itemName: "Oedogonium - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Oedogonium",
      description:
        "Large Oedogonium culture used in studies of vegetative and asexual reproduction.",
      price: 16.4,
    },
    {
      sku: "OEDO90",
      itemName: "Oedogonium - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Oedogonium",
      description:
        "Expanded Oedogonium algae sample for group use under microscopes.",
      price: 24.0,
    },
    {
      sku: "OEDO120",
      itemName: "Oedogonium - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Oedogonium",
      description:
        "Extra-large Oedogonium culture for full-class lab demonstrations.",
      price: 32.8,
    },
    {
      sku: "PAND12",
      itemName: "Pandorina - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Pandorina",
      description:
        "Culture of Pandorina colonial algae demonstrating early multicellularity.",
      price: 7.5,
    },
    {
      sku: "PAND30",
      itemName: "Pandorina - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Pandorina",
      description:
        "Medium Pandorina culture for studying coordinated cell movement in colonies.",
      price: 8.2,
    },
    {
      sku: "PAND60",
      itemName: "Pandorina - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Pandorina",
      description:
        "Large Pandorina culture ideal for small group microscopy of colonial flagellates.",
      price: 16.4,
    },
    {
      sku: "PAND90",
      itemName: "Pandorina - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Pandorina",
      description: "Expanded Pandorina culture for multiple class microscopes.",
      price: 24.0,
    },
    {
      sku: "PAND120",
      itemName: "Pandorina - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Pandorina",
      description:
        "Extra-large Pandorina culture for extended observation of colony structure.",
      price: 32.8,
    },
    {
      sku: "SCEN12",
      itemName: "Scenedesmus - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Scenedesmus",
      description:
        "Culture of Scenedesmus algae for studying small non-motile colonial forms.",
      price: 7.5,
    },
    {
      sku: "SCEN30",
      itemName: "Scenedesmus - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Scenedesmus",
      description:
        "Medium Scenedesmus culture suitable for classroom microscopy.",
      price: 8.2,
    },
    {
      sku: "SCEN60",
      itemName: "Scenedesmus - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Scenedesmus",
      description:
        "Large Scenedesmus culture for observing colony organization.",
      price: 16.4,
    },
    {
      sku: "SCEN90",
      itemName: "Scenedesmus - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Scenedesmus",
      description:
        "Expanded Scenedesmus culture for multiple microscope setups.",
      price: 24.0,
    },
    {
      sku: "SCEN120",
      itemName: "Scenedesmus - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Scenedesmus",
      description:
        "Extra-large Scenedesmus sample for detailed classroom analysis.",
      price: 32.8,
    },
    {
      sku: "SPIRG12",
      itemName: "Spirogyra - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Spirogyra",
      description:
        "Culture of Spirogyra filamentous green algae showing spiral chloroplasts.",
      price: 7.5,
    },
    {
      sku: "SPIRG30",
      itemName: "Spirogyra - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Spirogyra",
      description:
        "Medium Spirogyra culture for observing cell structure and conjugation.",
      price: 8.2,
    },
    {
      sku: "SPIRG60",
      itemName: "Spirogyra - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Spirogyra",
      description:
        "Large Spirogyra culture ideal for lab demonstrations on algae reproduction.",
      price: 16.4,
    },
    {
      sku: "SPIRG90",
      itemName: "Spirogyra - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Spirogyra",
      description: "Expanded Spirogyra culture for group microscope work.",
      price: 24.0,
    },
    {
      sku: "SPIRG120",
      itemName: "Spirogyra - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Spirogyra",
      description:
        "Extra-large Spirogyra sample culture for entire class demonstrations.",
      price: 32.8,
    },
    {
      sku: "ULOT30",
      itemName: "Ulothrix - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Ulothrix",
      description:
        "Medium Ulothrix culture used for observing chloroplast band formation.",
      price: 8.2,
    },
    {
      sku: "ULOT60",
      itemName: "Ulothrix - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Ulothrix",
      description:
        "Large Ulothrix culture for group microscope use and laboratory lessons.",
      price: 16.4,
    },
    {
      sku: "ULOT90",
      itemName: "Ulothrix - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Ulothrix",
      description: "Expanded Ulothrix culture for larger class use.",
      price: 24.0,
    },
    {
      sku: "ULOT120",
      itemName: "Ulothrix - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Ulothrix",
      description:
        "Extra-large Ulothrix culture for extended algae instruction and demonstrations.",
      price: 32.8,
    },
    {
      sku: "VOLV12",
      itemName: "Volvox - Class 12",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Volvox",
      description:
        "Culture of Volvox colonial green algae for studying coordinated cell movement.",
      price: 7.5,
    },
    {
      sku: "VOLV30",
      itemName: "Volvox - Class 30",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Volvox",
      description:
        "Medium Volvox culture used to demonstrate rolling colony locomotion.",
      price: 8.2,
    },
    {
      sku: "VOLV60",
      itemName: "Volvox - Class 60",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Volvox",
      description:
        "Large Volvox culture for small group use demonstrating colonial rotation and reproduction.",
      price: 16.4,
    },
    {
      sku: "VOLV90",
      itemName: "Volvox - Class 90",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Volvox",
      description:
        "Expanded Volvox culture suitable for multiple microscope stations.",
      price: 24.0,
    },
    {
      sku: "VOLV120",
      itemName: "Volvox - Class 120",
      category3: "Live Algae Specimens",
      category2: "Green Algae",
      category1: "Volvox",
      description:
        "Extra-large Volvox culture for extended lab demonstrations on colony organization.",
      price: 32.8,
    },
    {
      sku: "MIXEA30",
      itemName: "Mixed Algae - Class 30",
      category3: "Live Algae Specimens",
      category2: "Special Sets",
      category1: "Mixed Algae",
      description:
        "Assorted live algae genera for comparative microscopy across forms and structures.",
      price: 12.0,
    },
    {
      sku: "MIXEA60",
      itemName: "Mixed Algae - Class 60",
      category3: "Live Algae Specimens",
      category2: "Special Sets",
      category1: "Mixed Algae",
      description:
        "Larger mixed-algae collection suitable for multiple lab groups and demos.",
      price: 24.0,
    },
    {
      sku: "MIXEA90",
      itemName: "Mixed Algae - Class 90",
      category3: "Live Algae Specimens",
      category2: "Special Sets",
      category1: "Mixed Algae",
      description:
        "Expanded mixed-algae set for class-wide microscopy and side-by-side comparisons.",
      price: 36.0,
    },
    {
      sku: "MIXEA120",
      itemName: "Mixed Algae - Class 120",
      category3: "Live Algae Specimens",
      category2: "Special Sets",
      category1: "Mixed Algae",
      description:
        "Extra-large mixed-algae assortment for extended lessons and rotating stations.",
      price: 48.0,
    },
    {
      sku: "ACET AC",
      itemName: "Acetobacter aceti - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Acetobacter aceti, a vinegar-forming bacterium used for fermentation studies.",
      price: 13.75,
    },
    {
      sku: "ALC VISC",
      itemName: "Alcaligenes viscolactis - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Alcaligenes viscolactis for basic bacteriology and morphology observation.",
      price: 13.75,
    },
    {
      sku: "BAC CER",
      itemName: "Bacillus cereus - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Bacillus cereus, a common soil bacterium used to demonstrate spore formation.",
      price: 13.75,
    },
    {
      sku: "BAC COAG",
      itemName: "Bacillus coagulans - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Bacillus coagulans, a spore-forming species used in microbiology instruction.",
      price: 13.75,
    },
    {
      sku: "BAC MEG",
      itemName: "Bacillus megaterium - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Bacillus megaterium, large rod-shaped bacteria for staining and microscopy.",
      price: 13.75,
    },
    {
      sku: "BAC SUB",
      itemName: "Bacillus subtilis - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Bacillus subtilis, a non-pathogenic bacterium commonly used in lab studies.",
      price: 13.75,
    },
    {
      sku: "ENT AER",
      itemName: "Enterobacter aerogenes - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Enterobacter aerogenes, a Gram-negative rod used in fermentation experiments.",
      price: 13.75,
    },
    {
      sku: "ESC COLI",
      itemName: "Escherichia coli - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Escherichia coli, a model organism for molecular biology studies.",
      price: 13.75,
    },
    {
      sku: "FLAV CAP",
      itemName: "Flavobacterium capsulatum - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Flavobacterium capsulatum, used for colony pigmentation and morphology exercises.",
      price: 8.5,
    },
    {
      sku: "LACT LAC",
      itemName: "Lactococcus lactis - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Lactococcus lactis, a lactic acid bacterium used in fermentation and dairy studies.",
      price: 13.75,
    },
    {
      sku: "MICR LUT",
      itemName: "Micrococcus luteus - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Micrococcus luteus, a Gram-positive coccus used in staining and morphology labs.",
      price: 13.75,
    },
    {
      sku: "MICR ROS",
      itemName: "Micrococcus roseus - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Micrococcus roseus, producing pink colonies for microbiological demonstrations.",
      price: 13.75,
    },
    {
      sku: "NEIS SUB",
      itemName: "Neisseria subflava - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Neisseria subflava, a non-pathogenic Neisseria species used in teaching labs.",
      price: 13.75,
    },
    {
      sku: "PSE FLU",
      itemName: "Pseudomonas fluorescens - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Pseudomonas fluorescens, known for fluorescent pigment production under UV light.",
      price: 13.75,
    },
    {
      sku: "RHOD RUB",
      itemName: "Rhodospirillum rubrum - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Rhodospirillum rubrum, a photosynthetic bacterium used to study metabolism.",
      price: 13.75,
    },
    {
      sku: "SARC AUR",
      itemName: "Sarcina aurantiaca - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Sarcina aurantiaca, showing orange-pigmented cocci in cubical packets.",
      price: 13.75,
    },
    {
      sku: "SARC FLA",
      itemName: "Sarcina flava - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Sarcina flava, a yellow-pigmented coccus forming characteristic cuboidal groups.",
      price: 13.75,
    },
    {
      sku: "SARC LUT",
      itemName: "Sarcina lutea - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Sarcina lutea, displaying golden colonies typical of Gram-positive cocci.",
      price: 13.75,
    },
    {
      sku: "SERR MAR",
      itemName: "Serratia marcescens - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Serratia marcescens, a red-pigmented bacterium ideal for temperature-growth studies.",
      price: 13.75,
    },
    {
      sku: "SPIR SER",
      itemName: "Spirillum serpens - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Spirillum serpens, spiral-shaped bacteria used for observing motility under magnification.",
      price: 13.75,
    },
    {
      sku: "STAPH EPI",
      itemName: "Staphylococcus epidermidis - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Staphylococcus epidermidis, a non-pathogenic coccus used in Gram stain demonstrations.",
      price: 13.75,
    },
    {
      sku: "STREP LAC",
      itemName: "Streptococcus lactis - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Streptococcus lactis, used in dairy fermentation and chain coccus structure studies.",
      price: 13.75,
    },
    {
      sku: "STREP VEN",
      itemName: "Streptomyces venezuelae - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Bacteria",
      category1: "Bacteria Cultures",
      description:
        "Culture of Streptomyces venezuelae, a filamentous bacterium used for antibiotic production research.",
      price: 13.75,
    },
    {
      sku: "ACHL",
      itemName: "Achlya - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Culture of Achlya, a water mold used to demonstrate fungal growth and hyphal structure.",
      price: 13.75,
    },
    {
      sku: "ASP NIG",
      itemName: "Aspergillus niger - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Culture of Aspergillus niger, a black mold species used for spore and hyphae observation.",
      price: 13.75,
    },
    {
      sku: "PEN CHR",
      itemName: "Penicillium chrysogenum - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Culture of Penicillium chrysogenum, known for antibiotic production and mold morphology studies.",
      price: 13.75,
    },
    {
      sku: "PEN NOT",
      itemName: "Penicillium notatum - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Culture of Penicillium notatum, used in the study of the discovery of penicillin.",
      price: 13.75,
    },
    {
      sku: "PEN ROQ",
      itemName: "Penicillium roqueforti - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Culture of Penicillium roqueforti, used for teaching industrial fermentation and cheese production.",
      price: 13.75,
    },
    {
      sku: "PHY BLAK(+)",
      itemName: "Phycomyces blakesleeanus (+) - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Positive mating type culture of Phycomyces blakesleeanus for studying zygospore formation.",
      price: 13.75,
    },
    {
      sku: "PHY BLAK(-)",
      itemName: "Phycomyces blakesleeanus (-) - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Negative mating type culture of Phycomyces blakesleeanus for fungal reproduction experiments.",
      price: 13.75,
    },
    {
      sku: "RHI STOL(+)",
      itemName: "Rhizopus stolonifer (+) - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Positive mating type of Rhizopus stolonifer (black bread mold) for fungal growth studies.",
      price: 13.75,
    },
    {
      sku: "RHI STOL(-)",
      itemName: "Rhizopus stolonifer (-) - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Negative mating type of Rhizopus stolonifer for demonstrations of sexual reproduction in fungi.",
      price: 13.75,
    },
    {
      sku: "RHOD RUB",
      itemName: "Rhodotorula rubra - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Culture of Rhodotorula rubra, a pink yeast used to illustrate pigment production and yeast morphology.",
      price: 13.75,
    },
    {
      sku: "SAC CER",
      itemName: "Saccharomyces cerevisiae - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Culture of Saccharomyces cerevisiae, baker’s yeast, for fermentation and budding cell studies.",
      price: 13.75,
    },
    {
      sku: "SOR FIMG",
      itemName: "Sordaria fimicola, gray - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Gray strain of Sordaria fimicola for genetics and ascospore crossing experiments.",
      price: 13.75,
    },
    {
      sku: "SOR FIMT",
      itemName: "Sordaria fimicola, tan - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Tan strain of Sordaria fimicola used for demonstration of recombination and ascus development.",
      price: 13.75,
    },
    {
      sku: "SOR FIMW",
      itemName: "Sordaria fimicola, wild - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Wild-type Sordaria fimicola culture used for genetic and fungal reproduction studies.",
      price: 13.75,
    },
    {
      sku: "SAPR",
      itemName: "Saprolegnia - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Culture of Saprolegnia, an aquatic fungus used to study oomycete growth and spore formation.",
      price: 13.75,
    },
    {
      sku: "MUC HEIM",
      itemName: "Mucor heimalis (+) - Tube",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Positive mating type of Mucor heimalis used for zygospore reproduction studies.",
      price: 13.75,
    },
    {
      sku: "PIL CRYST",
      itemName: "Pilobolus crystallinus - Plate",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Fungi",
      category1: "Fungi Culture",
      description:
        "Plate culture of Pilobolus crystallinus, a fungus known for its spore-shooting mechanism.",
      price: 18.0,
    },
    {
      sku: "PHYSPLS",
      itemName: "Physarum (Plasmodium Stage) - Each",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Mold",
      category1: "Physarum",
      description:
        "Culture of Physarum in the plasmodium stage, demonstrating cytoplasmic streaming and slime mold motility.",
      price: 16.0,
    },
    {
      sku: "PHYSSCL",
      itemName: "Physarum (Sclerotium) - Each",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Mold",
      category1: "Physarum",
      description:
        "Sclerotium stage of Physarum used to demonstrate dormancy and revival of slime molds.",
      price: 16.0,
    },
    {
      sku: "SLMDK",
      itemName: "Slime Mold Kit",
      category3: "Live Bacteria & Fungi Specimens",
      category2: "Mold",
      category1: "Slime Mold",
      description:
        "Complete slime mold kit for observing the life cycle of Physarum and other slime molds in the classroom.",
      price: 20.0,
    },
    {
      sku: "EART12",
      itemName: "Earthworms - Class 12",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Earthworms",
      description:
        "Set of 12 live earthworms for studying segmented body structure and soil ecology behavior.",
      price: 6.0,
    },
    {
      sku: "EART30",
      itemName: "Earthworms - Class 30",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Earthworms",
      description:
        "Class set of 30 live earthworms for group dissections and ecological studies.",
      price: 13.5,
    },
    {
      sku: "EART50",
      itemName: "Earthworms - Class 50",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Earthworms",
      description:
        "Set of 50 earthworms ideal for larger classroom demonstrations or composting experiments.",
      price: 20.0,
    },
    {
      sku: "EART120",
      itemName: "Earthworms - Class 120",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Earthworms",
      description:
        "Bulk pack of 120 earthworms for extended biological or environmental classroom projects.",
      price: 39.6,
    },
    {
      sku: "LEECE",
      itemName: "Leeches - Each",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Leeches",
      description:
        "Individual live leech for studying annelid behavior and anatomy.",
      price: 2.5,
    },
    {
      sku: "LEEC10+",
      itemName: "Leeches 10+ Each",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Leeches",
      description:
        "Discounted bulk rate for leeches ordered in quantities of ten or more.",
      price: 2.35,
    },
    {
      sku: "REDW30",
      itemName: "Redworms - Class 30",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Redworms",
      description:
        "Set of 30 redworms used for composting and soil health demonstrations.",
      price: 5.0,
    },
    {
      sku: "REDW120",
      itemName: "Redworms - Class 120",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Redworms",
      description:
        "Bulk class of 120 redworms for studying vermicomposting and organic decomposition.",
      price: 18.0,
    },
    {
      sku: "TUBI30",
      itemName: "Tubifex Worms - Class 30",
      category3: "Live Invertebrates",
      category2: "Annelids",
      category1: "Tubifex Worms",
      description:
        "Culture of 30 Tubifex worms for aquatic biology and invertebrate movement observation.",
      price: 5.25,
    },
    {
      sku: "BRINV",
      itemName: "Brine Shrimp Eggs - Vial (6.0 gram)",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Brine Shrimp Eggs",
      description:
        "Vial of brine shrimp eggs (6g) for hatching and studying crustacean life cycles.",
      price: 3.5,
    },
    {
      sku: "COPE12",
      itemName: "Copepods - Class 12",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Copepods",
      description:
        "Set of 12 live copepods for examining freshwater planktonic crustaceans.",
      price: 5.0,
    },
    {
      sku: "COPE30",
      itemName: "Copepods - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Copepods",
      description:
        "Class set of 30 copepods for aquatic food chain and behavioral studies.",
      price: 6.0,
    },
    {
      sku: "COPE60",
      itemName: "Copepods - Class 60",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Copepods",
      description:
        "Larger collection of 60 copepods for group microscopy and ecosystem modeling.",
      price: 11.75,
    },
    {
      sku: "COPE90",
      itemName: "Copepods - Class 90",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Copepods",
      description:
        "Expanded copepod culture suitable for class demonstrations and aquatic ecology studies.",
      price: 15.5,
    },
    {
      sku: "COPE120",
      itemName: "Copepods - Class 120",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Copepods",
      description:
        "Bulk copepod culture for extended lab work on freshwater zooplankton.",
      price: 18.0,
    },
    {
      sku: "CRAYELIVE",
      itemName: "Crayfish Live - Each",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Crayfish",
      description:
        "Single live crayfish specimen for dissection or behavior observation.",
      price: 3.65,
    },
    {
      sku: "CRAYDLIVE",
      itemName: "Crayfish Live - Class 12",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Crayfish",
      description:
        "Class set of 12 live crayfish for studying anatomy and aquatic adaptations.",
      price: 37.2,
    },
    {
      sku: "CRAY18LIVE",
      itemName: "Crayfish Live - Class 18",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Crayfish",
      description:
        "Set of 18 live crayfish for classroom demonstrations on crustacean structure.",
      price: 55.8,
    },
    {
      sku: "DAPH12",
      itemName: "Daphnia - Class 12",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Daphnia",
      description:
        "Small culture of 12 Daphnia (water fleas) used in aquatic food chain studies.",
      price: 7.5,
    },
    {
      sku: "DAPH30",
      itemName: "Daphnia - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Daphnia",
      description:
        "Medium Daphnia culture for observing reproduction and population behavior.",
      price: 8.5,
    },
    {
      sku: "FIDLE",
      itemName: "Fiddler Crabs - Each",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Fiddler Crabs",
      description:
        "Individual fiddler crab for observation of crustacean limb movement and behavior.",
      price: 2.8,
    },
    {
      sku: "FIDCRB16",
      itemName: "Fiddler Crabs - Class 16",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Fiddler Crabs",
      description:
        "Set of 16 fiddler crabs ideal for group lab demonstrations and behavior studies.",
      price: 38.4,
    },
    {
      sku: "GAMME",
      itemName: "Gammarus - Each",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Gammarus (Amphipods)",
      description:
        "Single Gammarus amphipod for individual observation of crustacean locomotion.",
      price: 0.08,
    },
    {
      sku: "GAMM12",
      itemName: "Gammarus (Amphipods) - Class 12",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Gammarus (Amphipods)",
      description:
        "Set of 12 Gammarus amphipods used for aquatic ecosystem and behavior studies.",
      price: 4.0,
    },
    {
      sku: "GAMM30",
      itemName: "Gammarus (Amphipods) - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Gammarus (Amphipods)",
      description:
        "Class set of 30 Gammarus amphipods for lab experiments and feeding observations.",
      price: 4.25,
    },
    {
      sku: "GAMM50",
      itemName: "Gammarus (Amphipods) - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Gammarus (Amphipods)",
      description:
        "Set of 50 amphipods for group observation or aquaria population studies.",
      price: 6.25,
    },
    {
      sku: "GAMM60",
      itemName: "Gammarus (Amphipods) - Class 60",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Gammarus (Amphipods)",
      description: "Larger Gammarus collection for multiple classroom groups.",
      price: 8.25,
    },
    {
      sku: "GAMM90",
      itemName: "Gammarus (Amphipods) - Class 90",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Gammarus (Amphipods)",
      description:
        "Expanded amphipod culture ideal for ecology and adaptation lessons.",
      price: 12.35,
    },
    {
      sku: "GAMM120",
      itemName: "Gammarus (Amphipods) - Class 120",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Gammarus (Amphipods)",
      description:
        "Bulk amphipod collection for full-class labs or aquatic system maintenance.",
      price: 16.0,
    },
    {
      sku: "MIXEC30",
      itemName: "Mixed Crustacea - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Mixed Crustacea",
      description:
        "Assorted live crustaceans (Daphnia, Copepods, and Gammarus) for comparative observation.",
      price: 12.0,
    },
    {
      sku: "MIXEC60",
      itemName: "Mixed Crustacea - Class 60",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Mixed Crustacea",
      description:
        "Collection of 60 mixed crustacean specimens for group ecology and feeding studies.",
      price: 24.0,
    },
    {
      sku: "MIXEC120",
      itemName: "Mixed Crustacea - Class 120",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Mixed Crustacea",
      description:
        "Bulk mixed crustacean set for extended lab use and multi-species comparison.",
      price: 48.0,
    },
    {
      sku: "ISOP25",
      itemName: "Isopods - Class 25",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Mixed Isopods",
      description:
        "Set of 25 live isopods for studying behavior, moisture preference, and anatomy.",
      price: 15.0,
    },
    {
      sku: "ISOP30",
      itemName: "Isopods - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Mixed Isopods",
      description:
        "Class set of 30 isopods for classroom demonstrations on crustacean adaptation.",
      price: 18.0,
    },
    {
      sku: "ISOP50",
      itemName: "Isopods - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Mixed Isopods",
      description:
        "Collection of 50 isopods for behavioral experiments and population studies.",
      price: 30.0,
    },
    {
      sku: "ISOP100",
      itemName: "Isopods - Class 100",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Mixed Isopods",
      description:
        "Bulk isopod set for long-term experiments in adaptation and behavior.",
      price: 60.0,
    },
    {
      sku: "OSTR30",
      itemName: "Ostracods - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Ostracods",
      description:
        "Set of 30 ostracods for examining microscopic bivalved crustaceans.",
      price: 5.5,
    },
    {
      sku: "OSTR60",
      itemName: "Ostracods - Class 60",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Ostracods",
      description:
        "Class set of 60 ostracods for aquatic microcrustacean observation.",
      price: 9.5,
    },
    {
      sku: "OSTR90",
      itemName: "Ostracods - Class 90",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Ostracods",
      description:
        "Expanded set of 90 ostracods suitable for class or lab ecosystem experiments.",
      price: 12.35,
    },
    {
      sku: "OSTR120",
      itemName: "Ostracods - Class 120",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Ostracods",
      description:
        "Bulk ostracod collection ideal for extended microscopic observation and aquatic analysis.",
      price: 15.0,
    },
    {
      sku: "PILL16",
      itemName: "Pillbugs - Class 16",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Pillbugs",
      description:
        "Set of 16 pillbugs for behavioral and habitat preference studies.",
      price: 9.6,
    },
    {
      sku: "PILL25",
      itemName: "Pillbugs - Class 25",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Pillbugs",
      description:
        "Collection of 25 pillbugs for small group environmental experiments.",
      price: 15.0,
    },
    {
      sku: "PILL50",
      itemName: "Pillbugs - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Pillbugs",
      description:
        "Class set of 50 pillbugs for large group studies of adaptation and response.",
      price: 30.0,
    },
    {
      sku: "PILL100",
      itemName: "Pillbugs - Class 100",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Pillbugs",
      description:
        "Bulk pack of 100 pillbugs for multi-group lab activities and behavioral research.",
      price: 60.0,
    },
    {
      sku: "SOWB25",
      itemName: "Sowbugs - Class 25",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Sowbugs",
      description:
        "Set of 25 sowbugs for observing crustacean movement and moisture preference.",
      price: 15.0,
    },
    {
      sku: "SOWB50",
      itemName: "Sowbugs - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Crustacea",
      category1: "Sowbugs",
      description:
        "Collection of 50 sowbugs for classroom behavioral studies and ecological labs.",
      price: 30.0,
    },
    {
      sku: "ANTSVIAL",
      itemName: "Ants - Vial of 25-30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Ants",
      description:
        "Vial containing 25–30 live ants for study of insect social structure and colony behavior.",
      price: 8.95,
    },
    {
      sku: "ANTREF E",
      itemName: "Ant Farm Refill Kit (includes sand, food and coupon for ants)",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Ants",
      description:
        "Ant farm refill kit with sand, food, and coupon for ants, ideal for reusing classroom ant habitats.",
      price: 16.0,
    },
    {
      sku: "AQUINSCT",
      itemName: "Aquatic Insect Larvae - 12 pk",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Aquatic Insect Larvae",
      description:
        "Pack of 12 aquatic insect larvae for observing early developmental stages of water-dwelling insects.",
      price: 12.0,
    },
    {
      sku: "BESSBE",
      itemName: "Bess Beetles - Each",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Bess Beetles",
      description:
        "Individual live Bess beetle for examining cooperative behavior and beetle anatomy.",
      price: 4.5,
    },
    {
      sku: "BUTT PAVA",
      itemName: "Butterfly Pavilion",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Butterfly Kits",
      description:
        "Butterfly Pavilion habitat kit designed for observing butterfly metamorphosis.",
      price: 17.0,
    },
    {
      sku: "BUTT5",
      itemName: "Butterfly Kit - Class 5",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Butterfly Kits",
      description:
        "Class kit for raising butterflies, suitable for groups of five students.",
      price: 30.0,
    },
    {
      sku: "BUTT33",
      itemName: "Butterfly School Kit - Class 33",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Butterfly Kits",
      description:
        "School-sized butterfly rearing kit for up to 33 students, includes larvae and habitat supplies.",
      price: 58.0,
    },
    {
      sku: "CENTEL",
      itemName: "Centipedes Each - Live",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Centipedes (Live)",
      description:
        "Individual live centipede for anatomical and behavioral study of myriapods.",
      price: 3.1,
    },
    {
      sku: "CRIC12",
      itemName: "Cricket - Class 12",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Crickets",
      description:
        "Set of 12 crickets for studying insect chirping, behavior, and exoskeleton structure.",
      price: 10.0,
    },
    {
      sku: "CRIC50",
      itemName: "Cricket - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Crickets",
      description:
        "Collection of 50 live crickets for feeding experiments or insect life cycle lessons.",
      price: 41.5,
    },
    {
      sku: "DAMSE",
      itemName: "Damselfly Nymphs - Each",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Damselfly Nymphs",
      description:
        "Single damselfly nymph for aquatic insect development and predatory behavior observation.",
      price: 2.75,
    },
    {
      sku: "BEET25",
      itemName: "Darkling Beetles - Class 25",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Darkling Beetles",
      description:
        "Set of 25 darkling beetles ideal for classroom metamorphosis and habitat studies.",
      price: 22.5,
    },
    {
      sku: "BEET50",
      itemName: "Darkling Beetles - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Darkling Beetles",
      description:
        "Collection of 50 darkling beetles for larger classroom insect development labs.",
      price: 40.0,
    },
    {
      sku: "DRAGD",
      itemName: "Dragonfly Nymphs - Each",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Dragonfly Nymphs",
      description:
        "Single dragonfly nymph for examining insect metamorphosis and aquatic adaptation.",
      price: 2.75,
    },
    {
      sku: "FOODPACK-AQ",
      itemName:
        "Food Pack for Aquatic Insects (Mixture of aquatic crustacea/plants)",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Aquatic Insect Food",
      description:
        "Pack of mixed aquatic plants and crustaceans for feeding aquatic insect larvae.",
      price: 10.0,
    },
    {
      sku: "LADYB50",
      itemName: "Ladybugs - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Ladybugs",
      description:
        "Set of 50 ladybugs for observing beneficial insect behavior and predation.",
      price: 9.0,
    },
    {
      sku: "MANEEggs",
      itemName: "Mantis Eggs - Each",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Mantis Egg Sac",
      description:
        "Single praying mantis egg case used for hatching and insect life cycle observation.",
      price: 9.0,
    },
    {
      sku: "MEAL100",
      itemName: "Mealworms - Class 100",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Mealworms",
      description:
        "Set of 100 mealworms for insect growth and metamorphosis studies.",
      price: 10.0,
    },
    {
      sku: "MEAL200",
      itemName: "Mealworms - Class 200",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Mealworms",
      description:
        "Collection of 200 mealworms suitable for large-scale classroom projects.",
      price: 20.0,
    },
    {
      sku: "MEAL200WFOOD",
      itemName: "Mealworms w/ Food - Class 200",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Mealworms",
      description:
        "Class set of 200 mealworms with food included, ideal for sustained observation.",
      price: 23.0,
    },
    {
      sku: "MILKF",
      itemName: "Milkweed Bug Food - Each",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Milkweed Bugs",
      description:
        "Food supplement for maintaining live milkweed bug colonies.",
      price: 3.0,
    },
    {
      sku: "MILKM",
      itemName: "Milkweed Bug Eggs - Mass",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Milkweed Bugs",
      description:
        "Mass culture of milkweed bug eggs for raising from early developmental stages.",
      price: 20.0,
    },
    {
      sku: "MILKAS",
      itemName: "Milkweed Bugs (Assorted Stages) - Set",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Milkweed Bugs",
      description:
        "Set of milkweed bugs at assorted life stages for complete metamorphosis studies.",
      price: 20.0,
    },
    {
      sku: "MILKMWFOOD",
      itemName: "Milkweed Bug Eggs W/ Food - Mass",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Milkweed Bugs",
      description:
        "Mass culture of milkweed bug eggs with food provided for sustained colony care.",
      price: 23.5,
    },
    {
      sku: "MILK30",
      itemName: "Milkweed Bugs (Adults or Nymphs) - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Milkweed Bugs",
      description:
        "Set of 30 adult or nymph milkweed bugs for classroom insect life cycle observation.",
      price: 33.0,
    },
    {
      sku: "MILLE(10+)L",
      itemName: "Millipedes (10+) Each - Live",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Millipedes",
      description:
        "Live millipedes available in quantities of 10 or more for bulk classroom studies.",
      price: 3.9,
    },
    {
      sku: "MILLE L",
      itemName: "Millipedes Each - Live",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Millipedes",
      description:
        "Individual live millipede for examining body segmentation and locomotion.",
      price: 4.15,
    },
    {
      sku: "MOSQ30",
      itemName: "Mosquito Larvae & Pupa - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Mosquito Larvae & Pupa",
      description:
        "Culture of 30 mosquito larvae and pupae for observing aquatic insect development.",
      price: 10.0,
    },
    {
      sku: "SILK25",
      itemName: "Silkworms (Egg Stage) - Class 25",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Silkworms",
      description:
        "Set of 25 silkworm eggs for studying insect metamorphosis and silk production.",
      price: 18.0,
    },
    {
      sku: "SILK50",
      itemName: "Silkworms (Egg Stage) - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Silkworms",
      description:
        "Collection of 50 silkworm eggs for extended observation and large classroom projects.",
      price: 24.0,
    },
    {
      sku: "SILKF25",
      itemName: "Silkworm Food - Class 25",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Silkworm Food",
      description:
        "Pack of silkworm food formulated for 25 silkworm larvae feedings.",
      price: 10.0,
    },
    {
      sku: "SILKF50",
      itemName: "Silkworm Food - Class 50",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Silkworm Food",
      description:
        "Pack of silkworm food suitable for 50 silkworms over a full rearing cycle.",
      price: 20.0,
    },
    {
      sku: "TERM12",
      itemName: "Termites (Large) - Class 12",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Termites",
      description:
        "Set of 12 large termites for observing insect social behavior and wood decomposition.",
      price: 12.0,
    },
    {
      sku: "TERM30",
      itemName: "Termites (Large) - Class 30",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Termites",
      description:
        "Collection of 30 large termites for class projects on colony interaction and ecology.",
      price: 20.7,
    },
    {
      sku: "TERM60",
      itemName: "Termites (Large) - Class 60",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Termites",
      description:
        "Set of 60 termites ideal for larger classrooms and behavior analysis studies.",
      price: 34.5,
    },
    {
      sku: "TERM120",
      itemName: "Termites (Large) - Class 120",
      category3: "Live Invertebrates",
      category2: "Arthropods-Insects",
      category1: "Termites",
      description:
        "Bulk collection of 120 termites for extended experiments and ecosystem modeling.",
      price: 48.0,
    },
    {
      sku: "HYDRB12",
      itemName: "Hydra Brown - Class 12",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra Brown",
      description:
        "Set of 12 brown Hydra specimens for studying cnidarian structure and regeneration.",
      price: 8.0,
    },
    {
      sku: "HYDRB30",
      itemName: "Hydra Brown - Class 30",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra Brown",
      description:
        "Class of 30 brown Hydra ideal for classroom lab studies on tentacle movement and feeding.",
      price: 10.0,
    },
    {
      sku: "HYDRB60",
      itemName: "Hydra Brown - Class 60",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra Brown",
      description:
        "Collection of 60 Hydra for group observation and regeneration experiments.",
      price: 20.0,
    },
    {
      sku: "HYDRB90",
      itemName: "Hydra Brown - Class 90",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra Brown",
      description:
        "Expanded set of 90 brown Hydra for multiple class stations and detailed cnidarian studies.",
      price: 30.0,
    },
    {
      sku: "HYDRB120",
      itemName: "Hydra Brown - Class 120",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra Brown",
      description:
        "Bulk group of 120 brown Hydra specimens for full-class experiments in regeneration biology.",
      price: 40.0,
    },
    {
      sku: "HYDRG12",
      itemName: "Hydra Green - Class 12",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra Green",
      description:
        "Set of 12 green Hydra containing symbiotic algae for symbiosis and photosynthesis lessons.",
      price: 9.5,
    },
    {
      sku: "HYDRG30",
      itemName: "Hydra Green - Class 30",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra Green",
      description:
        "Class of 30 green Hydra ideal for observing mutualistic relationships and regeneration.",
      price: 11.5,
    },
    {
      sku: "HYDRG60",
      itemName: "Hydra Green - Class 60",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra Green",
      description:
        "Collection of 60 green Hydra for classroom demonstrations on photosynthetic symbiosis.",
      price: 23.0,
    },
    {
      sku: "HYDRWF12",
      itemName: "Hydra with Food - Class 12",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra with Food",
      description:
        "Set of 12 Hydra provided with food for observing live feeding and tentacle response.",
      price: 15.0,
    },
    {
      sku: "HYDRWF30",
      itemName: "Hydra with Food - Class 30",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra with Food",
      description:
        "Class of 30 Hydra supplied with live food, perfect for feeding behavior labs.",
      price: 18.5,
    },
    {
      sku: "HYDRWF60",
      itemName: "Hydra with Food - Class 60",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra with Food",
      description:
        "Collection of 60 Hydra with food for extended classroom feeding and regeneration experiments.",
      price: 37.0,
    },
    {
      sku: "HYDRWF90",
      itemName: "Hydra with Food - Class 90",
      category3: "Live Invertebrates",
      category2: "Cnidarians-Hydra",
      category1: "Hydra with Food",
      description:
        "Expanded set of 90 Hydra with food for large group feeding and observation activities.",
      price: 55.5,
    },
    {
      sku: "SEAUE",
      itemName: "Sea Urchins - Each",
      category3: "Live Invertebrates",
      category2: "Echinoderms",
      category1: "Sea Urchins (Live)",
      description:
        "Single live sea urchin specimen for studying echinoderm anatomy and locomotion.",
      price: 9.0,
    },
    {
      sku: "SEAUK",
      itemName: "Sea Urchins - Kit (15 gravid urchins)",
      category3: "Live Invertebrates",
      category2: "Echinoderms",
      category1: "Sea Urchins (Live)",
      description:
        "Comprehensive kit with 15 gravid sea urchins for classroom fertilization and embryology studies.",
      price: 140.0,
    },
    {
      sku: "SLUGE",
      itemName: "Banana Slugs - Each",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Banana Slugs",
      description:
        "Individual banana slug for studying terrestrial mollusk anatomy and behavior.",
      price: 9.0,
    },
    {
      sku: "LAND12",
      itemName: "Land Snails - Class 12",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Land Snails (Live)",
      description:
        "Set of 12 live land snails for observing locomotion and shell morphology.",
      price: 11.64,
    },
    {
      sku: "LAND16",
      itemName: "Land Snails - Class 16",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Land Snails (Live)",
      description:
        "Set of 16 live land snails ideal for small group observation and behavioral studies.",
      price: 15.52,
    },
    {
      sku: "LAND18",
      itemName: "Land Snails - Class 18",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Land Snails (Live)",
      description:
        "Set of 18 live land snails for comparative study of shell and movement patterns.",
      price: 17.46,
    },
    {
      sku: "LAND24",
      itemName: "Land Snails - Class 24",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Land Snails (Live)",
      description:
        "Collection of 24 land snails for classroom use in biology and ecology lessons.",
      price: 23.28,
    },
    {
      sku: "LAND50",
      itemName: "Land Snails - Class 50",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Land Snails (Live)",
      description:
        "Class set of 50 live land snails for full-group experiments and observation projects.",
      price: 43.0,
    },
    {
      sku: "LAND100",
      itemName: "Land Snails - Class 100",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Land Snails (Live)",
      description:
        "Bulk pack of 100 live land snails for large-scale or extended classroom studies.",
      price: 86.0,
    },
    {
      sku: "POND12",
      itemName: "Pond Snails - Class 12",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Pond Snails",
      description:
        "Set of 12 pond snails for studying freshwater mollusk respiration and locomotion.",
      price: 6.6,
    },
    {
      sku: "POND18",
      itemName: "Pond Snails - Class 18",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Pond Snails",
      description:
        "Set of 18 pond snails ideal for small group aquatic studies.",
      price: 9.54,
    },
    {
      sku: "POND30",
      itemName: "Pond Snails - Class 30",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Pond Snails",
      description:
        "Class set of 30 pond snails suitable for observing feeding and shell variation.",
      price: 15.0,
    },
    {
      sku: "POND50",
      itemName: "Pond Snails - Class 50",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Pond Snails",
      description:
        "Set of 50 live pond snails for larger classroom ecosystems and aquaria.",
      price: 22.5,
    },
    {
      sku: "RAMS12",
      itemName: "Ramshorn Snails - Class 12",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Ramshorn Snail",
      description:
        "Set of 12 ramshorn snails with coiled shells for aquatic observation and comparison.",
      price: 7.5,
    },
    {
      sku: "RAMS50",
      itemName: "Ramshorn Snails - Class 50",
      category3: "Live Invertebrates",
      category2: "Molluscs",
      category1: "Ramshorn Snail",
      description:
        "Class set of 50 ramshorn snails for extended freshwater biology and shell morphology labs.",
      price: 30.0,
    },
    {
      sku: "VINE12",
      itemName: "Vinegar Eel - Class 12",
      category3: "Live Invertebrates",
      category2: "Nematoda/Vinegar Eels",
      category1: "Vinegar Eel",
      description:
        "Set of 12 vinegar eel specimens for observing nematode movement and feeding under magnification.",
      price: 7.5,
    },
    {
      sku: "VINE30",
      itemName: "Vinegar Eel - Class 30",
      category3: "Live Invertebrates",
      category2: "Nematoda/Vinegar Eels",
      category1: "Vinegar Eel",
      description:
        "Collection of 30 vinegar eels ideal for classroom demonstrations on nematode motility.",
      price: 8.2,
    },
    {
      sku: "VINE60",
      itemName: "Vinegar Eel - Class 60",
      category3: "Live Invertebrates",
      category2: "Nematoda/Vinegar Eels",
      category1: "Vinegar Eel",
      description:
        "Set of 60 vinegar eels for larger classes studying aquatic nematodes and life cycles.",
      price: 16.4,
    },
    {
      sku: "VINE90",
      itemName: "Vinegar Eel - Class 90",
      category3: "Live Invertebrates",
      category2: "Nematoda/Vinegar Eels",
      category1: "Vinegar Eel",
      description:
        "Expanded group of 90 vinegar eels suitable for multiple lab sections and demonstrations.",
      price: 24.0,
    },
    {
      sku: "VINE120",
      itemName: "Vinegar Eel - Class 120",
      category3: "Live Invertebrates",
      category2: "Nematoda/Vinegar Eels",
      category1: "Vinegar Eel",
      description:
        "Bulk set of 120 vinegar eels for extended study of nematode behavior and anatomy.",
      price: 32.8,
    },
    {
      sku: "PLAN12",
      itemName: "Planaria Brown - Class 12",
      category3: "Live Invertebrates",
      category2: "Platyhelminthes-Planaria",
      category1: "Planaria Brown",
      description:
        "Set of 12 brown planaria for studying flatworm regeneration and response to stimuli.",
      price: 8.5,
    },
    {
      sku: "PLAN30",
      itemName: "Planaria Brown - Class 30",
      category3: "Live Invertebrates",
      category2: "Platyhelminthes-Planaria",
      category1: "Planaria Brown",
      description:
        "Collection of 30 brown planaria ideal for regeneration and locomotion labs.",
      price: 10.0,
    },
    {
      sku: "PLAN60",
      itemName: "Planaria Brown - Class 60",
      category3: "Live Invertebrates",
      category2: "Platyhelminthes-Planaria",
      category1: "Planaria Brown",
      description:
        "Set of 60 planaria suitable for large class demonstrations and microscopy.",
      price: 20.0,
    },
    {
      sku: "PLAN90",
      itemName: "Planaria Brown - Class 90",
      category3: "Live Invertebrates",
      category2: "Platyhelminthes-Planaria",
      category1: "Planaria Brown",
      description:
        "Expanded planaria culture of 90 specimens for observing regeneration and sensory responses.",
      price: 30.0,
    },
    {
      sku: "PLAN120",
      itemName: "Planaria Brown - Class 120",
      category3: "Live Invertebrates",
      category2: "Platyhelminthes-Planaria",
      category1: "Planaria Brown",
      description:
        "Bulk class of 120 brown planaria for extended regenerative biology studies.",
      price: 40.0,
    },
    {
      sku: "ROTI12",
      itemName: "Rotifers - Class 12",
      category3: "Live Invertebrates",
      category2: "Rotifers",
      category1: "Rotifers",
      description:
        "Set of 12 rotifer specimens for studying microscopic aquatic invertebrates and wheel organ motion.",
      price: 7.5,
    },
    {
      sku: "ROTI30",
      itemName: "Rotifers - Class 30",
      category3: "Live Invertebrates",
      category2: "Rotifers",
      category1: "Rotifers",
      description:
        "Collection of 30 rotifers for group observation and feeding mechanism studies.",
      price: 8.2,
    },
    {
      sku: "ROTI60",
      itemName: "Rotifers - Class 60",
      category3: "Live Invertebrates",
      category2: "Rotifers",
      category1: "Rotifers",
      description:
        "Set of 60 rotifers ideal for larger classrooms studying aquatic microinvertebrates.",
      price: 16.4,
    },
    {
      sku: "ROTI90",
      itemName: "Rotifers - Class 90",
      category3: "Live Invertebrates",
      category2: "Rotifers",
      category1: "Rotifers",
      description:
        "Expanded rotifer culture for extended lab sessions or multi-group microscopy.",
      price: 24.0,
    },
    {
      sku: "ROTI120",
      itemName: "Rotifers - Class 120",
      category3: "Live Invertebrates",
      category2: "Rotifers",
      category1: "Rotifers",
      description:
        "Bulk rotifer culture of 120 specimens for advanced aquatic biology and food chain experiments.",
      price: 32.8,
    },
    {
      sku: "AZOL 12",
      itemName: "Azolla - Class 12",
      category3: "Live Plant Specimens",
      category2: "Ferns",
      category1: "Azolla",
      description:
        "Set of 12 Azolla specimens, a small floating aquatic fern used to study nitrogen fixation and plant symbiosis.",
      price: 6.0,
    },
    {
      sku: "AZOL 30",
      itemName: "Azolla - Class 30",
      category3: "Live Plant Specimens",
      category2: "Ferns",
      category1: "Azolla",
      description:
        "Class of 30 Azolla plants suitable for group experiments on aquatic plant ecology.",
      price: 8.0,
    },
    {
      sku: "AZOL 60",
      itemName: "Azolla - Class 60",
      category3: "Live Plant Specimens",
      category2: "Ferns",
      category1: "Azolla",
      description:
        "Collection of 60 Azolla samples for demonstrating symbiosis and nitrogen cycling.",
      price: 16.0,
    },
    {
      sku: "FERNE FRONDS",
      itemName: "Fern Fronds w/ Sori - Each",
      category3: "Live Plant Specimens",
      category2: "Ferns",
      category1: "Fern Fronds",
      description:
        "Individual fern frond with visible sori for examining spore production and alternation of generations.",
      price: 4.5,
    },
    {
      sku: "FERN SP",
      itemName: "Ferns Sp. Complete Plant - Each",
      category3: "Live Plant Specimens",
      category2: "Ferns",
      category1: "Ferns Sp. Complete Plant",
      description:
        "Complete live fern specimen for observation of leaf structure and root rhizome development.",
      price: 8.5,
    },
    {
      sku: "BRAS SEED 20",
      itemName: "Brassica Speed Seeds - 200pk",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Brassica Speed Seeds",
      description:
        "Pack of 200 Brassica speed seeds for rapid plant growth and genetics experiments.",
      price: 38.0,
    },
    {
      sku: "CABOM7",
      itemName: "Cabomba Plants pk/7",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Cabomba Plants",
      description:
        "Set of 7 Cabomba aquatic plants for studying submerged plant adaptations and photosynthesis.",
      price: 12.0,
    },
    {
      sku: "ELOD9",
      itemName: "Elodea (Anacharis) - Class 9",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Elodea (Anacharis)",
      description:
        "Set of 9 Elodea plants for observing aquatic photosynthesis and chloroplast streaming.",
      price: 8.0,
    },
    {
      sku: "ELOD12",
      itemName: "Elodea (Anacharis) - Class 12",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Elodea (Anacharis)",
      description:
        "Set of 12 Elodea specimens ideal for small group photosynthesis demonstrations.",
      price: 8.15,
    },
    {
      sku: "ELOD30",
      itemName: "Elodea (Anacharis) - Class 30",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Elodea (Anacharis)",
      description:
        "Collection of 30 Elodea plants suitable for classroom experiments on oxygen production.",
      price: 16.0,
    },
    {
      sku: "ELOD60",
      itemName: "Elodea (Anacharis) - Class 60",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Elodea (Anacharis)",
      description:
        "Set of 60 Elodea plants for extended class use in aquatic plant biology.",
      price: 28.0,
    },
    {
      sku: "ELOD120",
      itemName: "Elodea (Anacharis) - Class 120",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Elodea (Anacharis)",
      description:
        "Bulk set of 120 Elodea specimens for large group instruction in plant physiology.",
      price: 48.0,
    },
    {
      sku: "ELODTP30",
      itemName: "Elodea Tips (Anacharis) - Class 30",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Elodea (Anacharis)",
      description:
        "Class set of 30 Elodea tips designed for close-up studies of cell structure and photosynthetic activity.",
      price: 30.0,
    },
    {
      sku: "HORN12",
      itemName: "Hornwort (Ceratophyllum) - Class 12",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Hornwort (Ceratophyllum)",
      description:
        "Set of 12 Hornwort plants for observing non-rooted aquatic growth and branching structure.",
      price: 8.5,
    },
    {
      sku: "HORN30",
      itemName: "Hornwort (Ceratophyllum) - Class 30",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Hornwort (Ceratophyllum)",
      description:
        "Class of 30 Hornwort specimens for larger lab activities on aquatic plant morphology.",
      price: 19.75,
    },
    {
      sku: "LEMN30",
      itemName: "Lemna (Duckweed) - Class 30",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Lemna (Duckweed)",
      description:
        "Set of 30 Lemna plants for studying floating aquatic plants and rapid vegetative reproduction.",
      price: 7.0,
    },
    {
      sku: "LEMN60",
      itemName: "Lemna (Duckweed) - Class 60",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Lemna (Duckweed)",
      description:
        "Collection of 60 Lemna plants for group studies on aquatic plant population growth.",
      price: 13.0,
    },
    {
      sku: "LEMN120",
      itemName: "Lemna (Duckweed) - Class 120",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Lemna (Duckweed)",
      description:
        "Bulk set of 120 Lemna specimens ideal for extended ecology experiments.",
      price: 24.0,
    },
    {
      sku: "PARR12",
      itemName: "Parrot Feather - Class 12",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Parrot Feather",
      description:
        "Set of 12 Parrot Feather plants for demonstrating aquatic adaptations and photosynthesis.",
      price: 5.0,
    },
    {
      sku: "WOLF12",
      itemName: "Wolffia - Class 12",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Wolffia (Duckweed)",
      description:
        "Set of 12 Wolffia plants, the world’s smallest flowering plant, for microscopic examination.",
      price: 5.0,
    },
    {
      sku: "WOLF30",
      itemName: "Wolffia - Class 30",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Wolffia (Duckweed)",
      description:
        "Class set of 30 Wolffia plants for group microscopic studies of aquatic flora.",
      price: 8.5,
    },
    {
      sku: "WOLF60",
      itemName: "Wolffia - Class 60",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Wolffia (Duckweed)",
      description:
        "Set of 60 Wolffia specimens ideal for extended classroom lessons on aquatic plant life.",
      price: 16.0,
    },
    {
      sku: "WOLF120",
      itemName: "Wolffia - Class 120",
      category3: "Live Plant Specimens",
      category2: "Flowering Plants",
      category1: "Wolffia (Duckweed)",
      description:
        "Bulk class of 120 Wolffia specimens for long-term growth and observation projects.",
      price: 24.0,
    },
    {
      sku: "EQUI",
      itemName: "Equisetum - Class 12",
      category3: "Live Plant Specimens",
      category2: "Horsetails",
      category1: "Equisetum",
      description:
        "Set of 12 Equisetum (horsetail) plants for examining primitive vascular plant structures.",
      price: 10.0,
    },
    {
      sku: "MARC12",
      itemName: "Marchantia - Class 12",
      category3: "Live Plant Specimens",
      category2: "Liverworts",
      category1: "Marchantia",
      description:
        "Set of 12 Marchantia liverworts for studying nonvascular plant morphology and reproduction.",
      price: 8.5,
    },
    {
      sku: "MARC30",
      itemName: "Marchantia - Class 30",
      category3: "Live Plant Specimens",
      category2: "Liverworts",
      category1: "Marchantia",
      description:
        "Collection of 30 Marchantia specimens for group lessons on bryophyte life cycles.",
      price: 11.0,
    },
    {
      sku: "MARC60",
      itemName: "Marchantia - Class 60",
      category3: "Live Plant Specimens",
      category2: "Liverworts",
      category1: "Marchantia",
      description:
        "Set of 60 Marchantia liverworts ideal for whole-class demonstrations on alternation of generations.",
      price: 22.0,
    },
    {
      sku: "RICC30",
      itemName: "Riccia - Aquatic Liverwort (Crystalwort) - CL30",
      category3: "Live Plant Specimens",
      category2: "Liverworts",
      category1: "Riccia - Aquatic Liverwort (Crystalwort)",
      description:
        "Set of 30 Riccia aquatic liverworts for studying floating plant structure and photosynthetic activity.",
      price: 15.0,
    },
    {
      sku: "RICC60",
      itemName: "Riccia - Aquatic Liverwort (Crystalwort) - CL60",
      category3: "Live Plant Specimens",
      category2: "Liverworts",
      category1: "Riccia - Aquatic Liverwort (Crystalwort)",
      description:
        "Collection of 60 Riccia aquatic liverworts for extended aquatic plant and ecology studies.",
      price: 30.0,
    },
    {
      sku: "MOSSF12",
      itemName: "Moss Fruiting Section - Class 12",
      category3: "Live Plant Specimens",
      category2: "Mosses",
      category1: "Moss Fruiting Section",
      description:
        "Set of 12 moss fruiting specimens for observing capsule development and sporophyte structures.",
      price: 7.0,
    },
    {
      sku: "MOSSF30",
      itemName: "Moss Fruiting Section - Class 30",
      category3: "Live Plant Specimens",
      category2: "Mosses",
      category1: "Moss Fruiting Section",
      description:
        "Class set of 30 moss fruiting samples for studying reproduction and spore dispersal in bryophytes.",
      price: 12.0,
    },
    {
      sku: "MOSSF60",
      itemName: "Moss Fruiting Section - Class 60",
      category3: "Live Plant Specimens",
      category2: "Mosses",
      category1: "Moss Fruiting Section",
      description:
        "Collection of 60 moss fruiting samples ideal for extended lab studies on the moss life cycle.",
      price: 24.0,
    },
    {
      sku: "MOSSV12",
      itemName: "Moss Vegetative Section - Class 12",
      category3: "Live Plant Specimens",
      category2: "Mosses",
      category1: "Moss Vegetative Section",
      description:
        "Set of 12 vegetative moss specimens for examining gametophyte structures and leaf morphology.",
      price: 5.5,
    },
    {
      sku: "MOSSV30",
      itemName: "Moss Vegetative Section - Class 30",
      category3: "Live Plant Specimens",
      category2: "Mosses",
      category1: "Moss Vegetative Section",
      description:
        "Class set of 30 moss vegetative sections suitable for observing nonvascular plant anatomy.",
      price: 8.5,
    },
    {
      sku: "MOSSV60",
      itemName: "Moss Vegetative Section - Class 60",
      category3: "Live Plant Specimens",
      category2: "Mosses",
      category1: "Moss Vegetative Section",
      description:
        "Collection of 60 moss vegetative specimens for large-group studies in plant development.",
      price: 17.0,
    },
    {
      sku: "POLY12",
      itemName: "Polytrichum - Class 12",
      category3: "Live Plant Specimens",
      category2: "Mosses",
      category1: "Polytrichum",
      description:
        "Set of 12 Polytrichum moss specimens for examining specialized stem and leaf structures.",
      price: 7.5,
    },
    {
      sku: "POLY30",
      itemName: "Polytrichum - Class 30",
      category3: "Live Plant Specimens",
      category2: "Mosses",
      category1: "Polytrichum",
      description:
        "Class set of 30 Polytrichum samples for studying bryophyte water conduction and morphology.",
      price: 10.0,
    },
    {
      sku: "ACTIN30",
      itemName: "Actinosphaerium - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Actinosphaerium",
      description:
        "Set of 30 Actinosphaerium specimens for observing radiating axopodia and cell structure.",
      price: 8.2,
    },
    {
      sku: "ACTIN60",
      itemName: "Actinosphaerium - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Actinosphaerium",
      description:
        "Collection of 60 Actinosphaerium samples ideal for studying pseudopodial locomotion.",
      price: 16.4,
    },
    {
      sku: "ACTIN120",
      itemName: "Actinosphaerium - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Actinosphaerium",
      description:
        "Bulk set of 120 Actinosphaerium specimens for large-scale protozoa lab exercises.",
      price: 32.8,
    },
    {
      sku: "AMOE12",
      itemName: "Amoeba Proteus - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Amoeba Proteus",
      description:
        "Set of 12 Amoeba Proteus specimens for studying cell movement and cytoplasmic streaming.",
      price: 7.5,
    },
    {
      sku: "AMOE 30",
      itemName: "Amoeba Proteus - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Amoeba Proteus",
      description:
        "Collection of 30 Amoeba Proteus for demonstrating pseudopodia and feeding behavior.",
      price: 8.2,
    },
    {
      sku: "AMOE 60",
      itemName: "Amoeba Proteus - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Amoeba Proteus",
      description:
        "Set of 60 Amoeba Proteus samples ideal for microscopy and cellular structure labs.",
      price: 16.4,
    },
    {
      sku: "AMOE 90",
      itemName: "Amoeba Proteus - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Amoeba Proteus",
      description:
        "Class set of 90 Amoeba Proteus specimens for advanced protozoan behavior study.",
      price: 24.6,
    },
    {
      sku: "AMOE120",
      itemName: "Amoeba Proteus - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Amoeba Proteus",
      description:
        "Bulk set of 120 Amoeba Proteus for multiple lab sessions and comparative experiments.",
      price: 32.8,
    },
    {
      sku: "ARCEL60",
      itemName: "Arcella - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Arcella",
      description:
        "Set of 60 Arcella specimens for observing testate amoeba structure and locomotion.",
      price: 16.4,
    },
    {
      sku: "ARCEL 120",
      itemName: "Arcella - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Amoeboids (Sarcodina)",
      category1: "Arcella",
      description:
        "Collection of 120 Arcella specimens for extended studies on shell formation and reproduction.",
      price: 32.8,
    },
    {
      sku: "BLEP 12",
      itemName: "Blepharisma - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Blepharisma",
      description:
        "Set of 12 Blepharisma ciliates for observing pigmentation and ciliary motion.",
      price: 7.5,
    },
    {
      sku: "BLEP 30",
      itemName: "Blepharisma - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Blepharisma",
      description:
        "Collection of 30 Blepharisma specimens ideal for class demonstrations on protozoan locomotion.",
      price: 8.2,
    },
    {
      sku: "BLEP 60",
      itemName: "Blepharisma - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Blepharisma",
      description:
        "Set of 60 Blepharisma ciliates for studying conjugation and movement behavior.",
      price: 16.4,
    },
    {
      sku: "BLEP 90",
      itemName: "Blepharisma - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Blepharisma",
      description:
        "Class of 90 Blepharisma samples suitable for multiple lab sections and observations.",
      price: 24.6,
    },
    {
      sku: "BLEP120",
      itemName: "Blepharisma - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Blepharisma",
      description:
        "Bulk culture of 120 Blepharisma specimens for extended microscopic and genetic studies.",
      price: 32.8,
    },
    {
      sku: "DID 12",
      itemName: "Didinium - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Didinium",
      description:
        "Set of 12 Didinium ciliates for examining predator-prey relationships with Paramecium.",
      price: 7.5,
    },
    {
      sku: "DID 30",
      itemName: "Didinium - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Didinium",
      description:
        "Class of 30 Didinium specimens ideal for demonstrating predatory feeding in protozoa.",
      price: 8.2,
    },
    {
      sku: "DID 60",
      itemName: "Didinium - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Didinium",
      description:
        "Set of 60 Didinium cultures for observing ciliary coordination and ingestion behavior.",
      price: 16.4,
    },
    {
      sku: "DID 90",
      itemName: "Didinium - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Didinium",
      description:
        "Collection of 90 Didinium specimens suitable for extended behavioral observation.",
      price: 24.6,
    },
    {
      sku: "DID 120",
      itemName: "Didinium - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Didinium",
      description:
        "Bulk set of 120 Didinium ciliates for large classroom demonstrations on protozoan feeding.",
      price: 32.8,
    },
    {
      sku: "EUPL30",
      itemName: "Euplotes - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Euplotes",
      description:
        "Set of 30 Euplotes specimens for studying cilia movement and surface crawling.",
      price: 8.2,
    },
    {
      sku: "EUPL60",
      itemName: "Euplotes - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Euplotes",
      description:
        "Collection of 60 Euplotes ciliates for group analysis of morphology and motility.",
      price: 16.4,
    },
    {
      sku: "EUPL 90",
      itemName: "Euplotes - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Euplotes",
      description:
        "Set of 90 Euplotes samples ideal for observing cell body shape and ciliary organization.",
      price: 24.6,
    },
    {
      sku: "EUPL 120",
      itemName: "Euplotes - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Euplotes",
      description:
        "Bulk culture of 120 Euplotes ciliates for extended classroom and research use.",
      price: 32.8,
    },
    {
      sku: "PARAC12",
      itemName: "Paramecium Caudatum - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Paramecium Caudatum",
      description:
        "Set of 12 Paramecium Caudatum specimens for observing ciliary motion and feeding behavior.",
      price: 7.5,
    },
    {
      sku: "PARAC30",
      itemName: "Paramecium Caudatum - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Paramecium Caudatum",
      description:
        "Collection of 30 Paramecium Caudatum samples ideal for demonstrating osmoregulation and movement.",
      price: 8.2,
    },
    {
      sku: "PARAC60",
      itemName: "Paramecium Caudatum - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Paramecium Caudatum",
      description:
        "Set of 60 Paramecium Caudatum cultures suitable for group studies in protozoan behavior.",
      price: 16.4,
    },
    {
      sku: "PARAC90",
      itemName: "Paramecium Caudatum - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Paramecium Caudatum",
      description:
        "Class of 90 Paramecium Caudatum specimens for large-scale demonstrations on locomotion and feeding.",
      price: 24.6,
    },
    {
      sku: "PARAC120",
      itemName: "Paramecium Caudatum - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Paramecium Caudatum",
      description:
        "Bulk culture of 120 Paramecium Caudatum samples for extended lab activities and experimentation.",
      price: 32.8,
    },
    {
      sku: "SPIR12",
      itemName: "Spirostomum - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Spirostomum",
      description:
        "Set of 12 Spirostomum specimens for studying rapid contraction and elongation in protozoa.",
      price: 7.5,
    },
    {
      sku: "SPIR30",
      itemName: "Spirostomum - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Spirostomum",
      description:
        "Collection of 30 Spirostomum ciliates for observing flexibility and swimming motion under the microscope.",
      price: 8.2,
    },
    {
      sku: "SPIR60",
      itemName: "Spirostomum - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Spirostomum",
      description:
        "Set of 60 Spirostomum samples for examining protozoan locomotion and cell structure.",
      price: 16.4,
    },
    {
      sku: "SPIR90",
      itemName: "Spirostomum - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Spirostomum",
      description:
        "Class of 90 Spirostomum specimens ideal for advanced classroom use or demonstrations.",
      price: 24.6,
    },
    {
      sku: "SPIR120",
      itemName: "Spirostomum - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Spirostomum",
      description:
        "Bulk culture of 120 Spirostomum specimens for extended observation and research studies.",
      price: 32.8,
    },
    {
      sku: "STAL12",
      itemName: "Stalked Ciliates - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stalked Ciliates",
      description:
        "Set of 12 stalked ciliates for examining attachment behavior and colony formation in protozoa.",
      price: 7.5,
    },
    {
      sku: "STAL30",
      itemName: "Stalked Ciliates - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stalked Ciliates",
      description:
        "Collection of 30 stalked ciliates ideal for microscopy of sessile protozoan movement.",
      price: 8.2,
    },
    {
      sku: "STAL60",
      itemName: "Stalked Ciliates - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stalked Ciliates",
      description:
        "Set of 60 stalked ciliates suitable for observing reproduction and stalk contraction.",
      price: 16.4,
    },
    {
      sku: "STAL90",
      itemName: "Stalked Ciliates - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stalked Ciliates",
      description:
        "Class of 90 stalked ciliate specimens for studying colony formation and feeding mechanisms.",
      price: 24.6,
    },
    {
      sku: "STAL 120",
      itemName: "Stalked Ciliates - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stalked Ciliates",
      description:
        "Bulk culture of 120 stalked ciliates for extended group experiments on protozoan ecology.",
      price: 32.8,
    },
    {
      sku: "STEN12",
      itemName: "Stentor - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stentor",
      description:
        "Set of 12 Stentor ciliates for studying trumpet-shaped morphology and regeneration.",
      price: 7.5,
    },
    {
      sku: "STEN30",
      itemName: "Stentor - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stentor",
      description:
        "Collection of 30 Stentor samples ideal for group demonstrations on cell structure and behavior.",
      price: 8.2,
    },
    {
      sku: "STEN60",
      itemName: "Stentor - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stentor",
      description:
        "Set of 60 Stentor ciliates suitable for observing regeneration and feeding processes.",
      price: 16.4,
    },
    {
      sku: "STEN90",
      itemName: "Stentor - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stentor",
      description:
        "Class of 90 Stentor specimens for studying contractile vacuole function and ciliary motion.",
      price: 24.6,
    },
    {
      sku: "STEN120",
      itemName: "Stentor - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Ciliates",
      category1: "Stentor",
      description:
        "Bulk culture of 120 Stentor ciliates for extended lab work on cell regeneration and physiology.",
      price: 32.8,
    },
    {
      sku: "CHIL12",
      itemName: "Chilomonas - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chilomonas",
      description:
        "Set of 12 Chilomonas specimens for studying flagellar movement and feeding behavior in protozoa.",
      price: 7.5,
    },
    {
      sku: "CHIL30",
      itemName: "Chilomonas - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chilomonas",
      description:
        "Collection of 30 Chilomonas samples ideal for demonstrations on flagellate locomotion.",
      price: 8.2,
    },
    {
      sku: "CHIL60",
      itemName: "Chilomonas - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chilomonas",
      description:
        "Set of 60 Chilomonas cultures suitable for classroom observation of flagellar motion and nutrition.",
      price: 16.4,
    },
    {
      sku: "CHIL90",
      itemName: "Chilomonas - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chilomonas",
      description:
        "Class of 90 Chilomonas specimens for advanced lab studies on movement and feeding mechanisms.",
      price: 24.6,
    },
    {
      sku: "CHIL120",
      itemName: "Chilomonas - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chilomonas",
      description:
        "Bulk set of 120 Chilomonas specimens for extended protozoan flagellate research.",
      price: 32.8,
    },
    {
      sku: "CHLA12",
      itemName: "Chlamydomonas - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chlamydomonas",
      description:
        "Set of 12 Chlamydomonas specimens for examining unicellular algae with flagella and eyespots.",
      price: 7.5,
    },
    {
      sku: "CHLA30",
      itemName: "Chlamydomonas - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chlamydomonas",
      description:
        "Collection of 30 Chlamydomonas samples ideal for photosynthesis and motility demonstrations.",
      price: 8.2,
    },
    {
      sku: "CHLA60",
      itemName: "Chlamydomonas - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chlamydomonas",
      description:
        "Set of 60 Chlamydomonas specimens suitable for group analysis of flagellar motion and light response.",
      price: 16.4,
    },
    {
      sku: "CHLA90",
      itemName: "Chlamydomonas - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chlamydomonas",
      description:
        "Class of 90 Chlamydomonas cultures for extended study of phototaxis and cell division.",
      price: 24.6,
    },
    {
      sku: "CHLA120",
      itemName: "Chlamydomonas - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Chlamydomonas",
      description:
        "Bulk set of 120 Chlamydomonas specimens for large-scale classroom use and experiments.",
      price: 32.8,
    },
    {
      sku: "EUDO30",
      itemName: "Eudorina - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Eudorina",
      description:
        "Set of 30 Eudorina colonies for observing early multicellular organization and flagellar movement.",
      price: 8.2,
    },
    {
      sku: "EUDO90",
      itemName: "Eudorina - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Eudorina",
      description:
        "Collection of 90 Eudorina colonies suitable for group studies on colonial structure and motility.",
      price: 24.6,
    },
    {
      sku: "EUDO120",
      itemName: "Eudorina - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Eudorina",
      description:
        "Bulk culture of 120 Eudorina colonies for extended labs on protozoan colony development.",
      price: 32.8,
    },
    {
      sku: "EUGL12",
      itemName: "Euglena - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Euglena",
      description:
        "Set of 12 Euglena specimens for examining flagellar motion and photosynthetic ability.",
      price: 7.5,
    },
    {
      sku: "EUGL30",
      itemName: "Euglena - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Euglena",
      description:
        "Collection of 30 Euglena samples ideal for demonstrating dual plant-animal characteristics.",
      price: 8.2,
    },
    {
      sku: "EUGL60",
      itemName: "Euglena - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Euglena",
      description:
        "Set of 60 Euglena specimens suitable for classroom use in studying photosynthetic protozoa.",
      price: 16.4,
    },
    {
      sku: "EUGL90",
      itemName: "Euglena - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Euglena",
      description:
        "Class of 90 Euglena cultures for advanced lab analysis of chloroplasts and motility.",
      price: 24.6,
    },
    {
      sku: "EUGL120",
      itemName: "Euglena - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Euglena",
      description:
        "Bulk culture of 120 Euglena specimens for extended lessons in protist biology.",
      price: 32.8,
    },
    {
      sku: "PERA12",
      itemName: "Peranema - Class 12",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Peranema",
      description:
        "Set of 12 Peranema specimens for studying heterotrophic flagellates and feeding movement.",
      price: 7.5,
    },
    {
      sku: "PERA30",
      itemName: "Peranema - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Peranema",
      description:
        "Collection of 30 Peranema samples ideal for observation of flexible cell bodies and motility.",
      price: 8.2,
    },
    {
      sku: "PERA60",
      itemName: "Peranema - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Peranema",
      description:
        "Set of 60 Peranema cultures for group studies on feeding processes and cell behavior.",
      price: 16.4,
    },
    {
      sku: "PERA90",
      itemName: "Peranema - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Peranema",
      description:
        "Class of 90 Peranema specimens for observing flagellar motion and predatory feeding behavior.",
      price: 24.6,
    },
    {
      sku: "PERA120",
      itemName: "Peranema - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Flagellates",
      category1: "Peranema",
      description:
        "Bulk culture of 120 Peranema specimens for extended lab studies on heterotrophic protists.",
      price: 32.8,
    },
    {
      sku: "MIXPL30",
      itemName: "Mixed Pond Life - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Special Sets",
      category1: "Mixed Pond Life",
      description:
        "Set of 30 samples containing a variety of pond microorganisms for general observation and biodiversity studies.",
      price: 12.0,
    },
    {
      sku: "MIXPL60",
      itemName: "Mixed Pond Life - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Special Sets",
      category1: "Mixed Pond Life",
      description:
        "Collection of 60 mixed pond life specimens offering a diverse range of algae, protozoa, and small invertebrates.",
      price: 24.0,
    },
    {
      sku: "MIXE30",
      itemName: "Mixed Protozoa - Class 30",
      category3: "Live Protozoa Specimens",
      category2: "Special Sets",
      category1: "Mixed Protozoa",
      description:
        "Set of 30 mixed protozoa species for classroom use in identifying and comparing cellular diversity.",
      price: 12.0,
    },
    {
      sku: "MIXE60",
      itemName: "Mixed Protozoa - Class 60",
      category3: "Live Protozoa Specimens",
      category2: "Special Sets",
      category1: "Mixed Protozoa",
      description:
        "Collection of 60 mixed protozoa specimens ideal for studying ecological interactions in microhabitats.",
      price: 24.0,
    },
    {
      sku: "MIXE90",
      itemName: "Mixed Protozoa - Class 90",
      category3: "Live Protozoa Specimens",
      category2: "Special Sets",
      category1: "Mixed Protozoa",
      description:
        "Class set of 90 mixed protozoa samples suitable for extended lessons and group activities.",
      price: 36.0,
    },
    {
      sku: "MIXE120",
      itemName: "Mixed Protozoa - Class 120",
      category3: "Live Protozoa Specimens",
      category2: "Special Sets",
      category1: "Mixed Protozoa",
      description:
        "Bulk culture of 120 mixed protozoa specimens offering a broad diversity for advanced lab studies.",
      price: 48.0,
    },
    {
      sku: "BULLE4-5L",
      itemName: "Bullfrogs 4-5-in. Live - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Live)",
      description:
        "Single live bullfrog measuring 4–5 inches, ideal for studying amphibian anatomy and behavior.",
      price: 22.5,
    },
    {
      sku: "BULLE124-5L",
      itemName: "Bullfrogs 4-5-in. Live - 12+ - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Live)",
      description:
        "Discounted live bullfrogs (4–5 inches) for bulk classroom orders of 12 or more specimens.",
      price: 21.0,
    },
    {
      sku: "BULLE5-6L",
      itemName: "Bullfrogs 5-6-in. Live - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Live)",
      description:
        "Single live bullfrog measuring 5–6 inches, used for biology and dissection studies.",
      price: 29.0,
    },
    {
      sku: "BULLE125-6L",
      itemName: "Bullfrogs 5-6-in. Live - 12+ - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Live)",
      description:
        "Bulk order of 12+ live bullfrogs (5–6 inches) for educational demonstrations and lab use.",
      price: 28.0,
    },
    {
      sku: "BULLE6L",
      itemName: "Bullfrogs 6-in.+ Live - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Live)",
      description:
        "Single large live bullfrog (6 inches or greater) for advanced classroom observation.",
      price: 29.5,
    },
    {
      sku: "BULLE126L",
      itemName: "Bullfrogs 6-in.+ Live - 12+ - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Live)",
      description:
        "Bulk set of 12+ large bullfrogs (6 inches or greater) for large-scale educational use.",
      price: 28.5,
    },
    {
      sku: "DWAFE",
      itemName: "Dwarf Aquatic Frog - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Dwarf Aquatic Frog",
      description:
        "Single dwarf aquatic frog for classroom aquaria and amphibian behavior observation.",
      price: 3.75,
    },
    {
      sku: "DWAR8",
      itemName: "Dwarf Aquatic Frog - Class 8",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Dwarf Aquatic Frog",
      description:
        "Set of 8 dwarf aquatic frogs suitable for group aquaria or ecological studies.",
      price: 28.0,
    },
    {
      sku: "DWAF16",
      itemName: "Dwarf Aquatic Frog - Class 16",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Dwarf Aquatic Frog",
      description:
        "Collection of 16 dwarf aquatic frogs for larger classroom ecosystems and amphibian studies.",
      price: 56.0,
    },
    {
      sku: "FROGEGG",
      itemName: "Frog Eggs - Mass",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Frog Eggs",
      description:
        "A mass of frog eggs for observing development from egg to tadpole under controlled conditions.",
      price: 18.75,
    },
    {
      sku: "GRASE2-25LEa",
      itemName: "Grassfrogs Live - 2 - 2.5-in. - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs (Live)",
      description:
        "Live grassfrog measuring 2–2.5 inches for general observation and amphibian anatomy lessons.",
      price: 6.9,
    },
    {
      sku: "GRASE25-3LEa",
      itemName: "Grassfrogs Live - 2.5 - 3-in. - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs (Live)",
      description:
        "Single live grassfrog (2.5–3 inches) for studying external anatomy and metamorphosis.",
      price: 7.1,
    },
    {
      sku: "GRASE3-35LEa",
      itemName: "Grassfrogs Live - 3 - 3.5-in. - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs (Live)",
      description:
        "Live grassfrog measuring 3–3.5 inches, ideal for amphibian life cycle demonstrations.",
      price: 7.6,
    },
    {
      sku: "TADPE",
      itemName: "Tadpoles (Various Sizes) - Each",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Tadpoles (Various Sizes)",
      description:
        "Single tadpole specimen of assorted size for observing metamorphosis and amphibian growth stages.",
      price: 2.0,
    },
    {
      sku: "TADPD",
      itemName: "Tadpoles (Various Sizes) - Dozen",
      category3: "Live Vertebrates",
      category2: "Amphibians",
      category1: "Tadpoles (Various Sizes)",
      description:
        "Dozen mixed-size tadpoles for group experiments and developmental biology studies.",
      price: 21.0,
    },
    {
      sku: "CHICEA",
      itemName: "Chicken Eggs Fertile - Each",
      category3: "Live Vertebrates",
      category2: "Birds",
      category1: "Chicken Eggs Fertile",
      description:
        "Single fertile chicken egg for classroom incubation and embryology observation.",
      price: 3.0,
    },
    {
      sku: "CHICD",
      itemName: "Chicken Eggs Fertile - Dozen",
      category3: "Live Vertebrates",
      category2: "Birds",
      category1: "Chicken Eggs Fertile",
      description:
        "Dozen fertile chicken eggs for studying avian development and incubation processes.",
      price: 30.0,
    },
    {
      sku: "GAMBE",
      itemName: "Gambusia - Each",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Gambusia",
      description:
        "Single Gambusia (mosquito fish) specimen for use in aquatic ecology and population studies.",
      price: 0.95,
    },
    {
      sku: "GOLDE",
      itemName: "Goldfish - Each",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Goldfish",
      description:
        "Single live goldfish for aquarium observation and freshwater biology demonstrations.",
      price: 1.1,
    },
    {
      sku: "GOLD20",
      itemName: "Goldfish - Class 20",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Goldfish",
      description:
        "Class set of 20 goldfish ideal for classroom aquaria or behavioral experiments.",
      price: 16.0,
    },
    {
      sku: "GOLD4",
      itemName: "Goldfish - Class 4",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Goldfish",
      description:
        "Set of 4 goldfish suitable for small group aquaria and observation activities.",
      price: 3.2,
    },
    {
      sku: "GUPPE",
      itemName: "Guppies - Each",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Guppies",
      description:
        "Single live guppy for studying reproduction, color variation, and freshwater ecology.",
      price: 1.1,
    },
    {
      sku: "GUPP8",
      itemName: "Guppies - Class 8",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Guppies",
      description:
        "Set of 8 guppies suitable for classroom aquariums and life cycle observation.",
      price: 6.4,
    },
    {
      sku: "GUPP18",
      itemName: "Guppies - Class 18",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Guppies",
      description:
        "Class set of 18 guppies for extended aquatic ecosystem and genetics studies.",
      price: 14.4,
    },
    {
      sku: "GUPP26",
      itemName: "Guppies - Class 26",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Guppies",
      description:
        "Collection of 26 guppies ideal for group observation and behavioral experiments.",
      price: 20.8,
    },
    {
      sku: "GUPP30",
      itemName: "Guppies - Class 30",
      category3: "Live Vertebrates",
      category2: "Fish",
      category1: "Guppies",
      description:
        "Class set of 30 guppies for large classroom aquaria and breeding experiments.",
      price: 24.0,
    },
    {
      sku: "TURTE4-6L",
      itemName: "Slider Turtles 4-6-in. Live - Each",
      category3: "Live Vertebrates",
      category2: "Reptiles",
      category1: "Slider Turtles",
      description:
        "Single live slider turtle (4–6 inches) for reptile anatomy and environmental study.",
      price: 9.25,
    },
    {
      sku: "TURTE4-6L12",
      itemName: "Slider Turtles 4-6-in. Live (12+) - Each",
      category3: "Live Vertebrates",
      category2: "Reptiles",
      category1: "Slider Turtles",
      description:
        "Bulk purchase of 12+ live slider turtles (4–6 inches) at discounted classroom rate.",
      price: 8.0,
    },
    {
      sku: "TURTE6-8L",
      itemName: "Slider Turtles 6-8-in. Live - Each",
      category3: "Live Vertebrates",
      category2: "Reptiles",
      category1: "Slider Turtles",
      description:
        "Single live slider turtle (6–8 inches) for ecology and behavioral observation lessons.",
      price: 11.5,
    },
    {
      sku: "TURTE6-8L12",
      itemName: "Slider Turtles 6-8-in. Live (12+) - Each",
      category3: "Live Vertebrates",
      category2: "Reptiles",
      category1: "Slider Turtles",
      description:
        "Bulk group of 12+ slider turtles (6–8 inches) for multi-classroom educational use.",
      price: 9.2,
    },
    {
      sku: "TURTE8-10L",
      itemName: "Slider Turtles 8-10-in. Live - Each",
      category3: "Live Vertebrates",
      category2: "Reptiles",
      category1: "Slider Turtles",
      description:
        "Single large slider turtle (8–10 inches) for demonstrations in reptilian anatomy and habitats.",
      price: 13.5,
    },
    {
      sku: "TURTE8-10L12",
      itemName: "Slider Turtles 8-10-in. Live (12+) - Each",
      category3: "Live Vertebrates",
      category2: "Reptiles",
      category1: "Slider Turtles",
      description:
        "Bulk order of 12+ large slider turtles (8–10 inches) for large classroom or research use.",
      price: 11.5,
    },
    {
      sku: "SHEEML 30",
      itemName: "Sheep Blood - 30 ML",
      category3: "Microbiological Supplies",
      category2: "Blood Products",
      category1: "Sheep Blood",
      description:
        "Sterile 30 mL vial of defibrinated sheep blood for microbiological culturing and hemolysis testing.",
      price: 22.05,
    },
    {
      sku: "SHEEML 50",
      itemName: "Sheep Blood - 50 ML",
      category3: "Microbiological Supplies",
      category2: "Blood Products",
      category1: "Sheep Blood",
      description:
        "Sterile 50 mL vial of sheep blood suitable for preparing blood agar and related culture media.",
      price: 24.1,
    },
    {
      sku: "SHEEML 100",
      itemName: "Sheep Blood - 100 ML",
      category3: "Microbiological Supplies",
      category2: "Blood Products",
      category1: "Sheep Blood",
      description:
        "100 mL sterile bottle of defibrinated sheep blood used in diagnostic and bacterial growth studies.",
      price: 29.2,
    },
    {
      sku: "SHEEML 250",
      itemName: "Sheep Blood - 250 ML",
      category3: "Microbiological Supplies",
      category2: "Blood Products",
      category1: "Sheep Blood",
      description:
        "250 mL bottle of sterile sheep blood for use in preparing agar plates and culture enrichment media.",
      price: 34.6,
    },
    {
      sku: "SHEEML 500",
      itemName: "Sheep Blood - 500 ML",
      category3: "Microbiological Supplies",
      category2: "Blood Products",
      category1: "Sheep Blood",
      description:
        "Half-liter bottle of defibrinated sheep blood for large-volume media and research applications.",
      price: 48.95,
    },
    {
      sku: "SHEEML 1LT",
      itemName: "Sheep Blood - 1 LT",
      category3: "Microbiological Supplies",
      category2: "Blood Products",
      category1: "Sheep Blood",
      description:
        "One-liter container of sterile sheep blood for extensive laboratory and culturing use.",
      price: 65.5,
    },
    {
      sku: "AGARPLTS",
      itemName: "Agar Plates 10/slv pre-poured",
      category3: "Microbiological Supplies",
      category2: "Media",
      category1: "Agar Plates",
      description:
        "Pack of 10 pre-poured agar plates for general microbial culture and classroom laboratory work.",
      price: 23.0,
    },
    {
      sku: "NUTAG46",
      itemName: "Nutrient Agar Powder - 46 grms",
      category3: "Microbiological Supplies",
      category2: "Media",
      category1: "Nutrient Agar Powder",
      description:
        "46-gram container of nutrient agar powder for preparing standard bacterial growth media.",
      price: 18.0,
    },
    {
      sku: "NUTAG500",
      itemName: "Nutrient Agar Powder - 500 grms",
      category3: "Microbiological Supplies",
      category2: "Media",
      category1: "Nutrient Agar Powder",
      description:
        "500-gram bulk container of nutrient agar powder for laboratory and microbiology classes.",
      price: 85.0,
    },
    {
      sku: "TSA80",
      itemName: "TSA Agar Powder - 80 grms",
      category3: "Microbiological Supplies",
      category2: "Media",
      category1: "TSA Agar Powder",
      description:
        "80-gram bottle of tryptic soy agar powder for culturing a wide range of bacterial species.",
      price: 13.8,
    },
    {
      sku: "TSA500",
      itemName: "TSA Agar Powder - 500 gms",
      category3: "Microbiological Supplies",
      category2: "Media",
      category1: "TSA Agar Powder",
      description:
        "500-gram container of TSA agar powder for general bacterial culture and microbiological use.",
      price: 38.5,
    },
    {
      sku: "Rev III",
      itemName: "Revelation III",
      category3: "Microscopes",
      category2: "L.W. Scientific",
      category1: "Revelation III",
      description:
        "High-quality L.W. Scientific Revelation III microscope designed for advanced classroom and laboratory use.",
      price: 780.0,
    },
    {
      sku: "ms01",
      itemName: "NBMS01",
      category3: "Microscopes",
      category2: "Premiere",
      category1: "NBMS Series",
      description:
        "Premiere NBMS01 microscope offering dependable performance for general classroom and educational applications.",
      price: 240.0,
    },
    {
      sku: "ms03",
      itemName: "NBMS03",
      category3: "Microscopes",
      category2: "Premiere",
      category1: "NBMS Series",
      description:
        "Premiere NBMS03 microscope with enhanced optics and sturdy design ideal for biology instruction.",
      price: 285.0,
    },
    {
      sku: "OWLP100 2Q",
      itemName: "Owl Pellets 2nd Quality (100+) - Each",
      category3: "Owl Pellets",
      category2: "Economy Grade Owl Pellets",
      category1: "Economy Grade",
      description:
        "Second-quality owl pellet suitable for budget-friendly classroom dissection and bone identification exercises.",
      price: 1.1,
    },
    {
      sku: "OWLP10 2Q",
      itemName: "Owl Pellets 2nd Quality (10+) - Each",
      category3: "Owl Pellets",
      category2: "Economy Grade Owl Pellets",
      category1: "Economy Grade",
      description:
        "Set of 10+ second-quality owl pellets for group study and analysis of prey remains.",
      price: 1.3,
    },
    {
      sku: "OWLPE 2Q",
      itemName: "Owl Pellets 2nd Quality - Each",
      category3: "Owl Pellets",
      category2: "Economy Grade Owl Pellets",
      category1: "Economy Grade",
      description:
        "Single second-quality owl pellet for introductory biology labs and food chain exercises.",
      price: 1.4,
    },
    {
      sku: "OWLPE1Q10+",
      itemName: "Owl Pellets 1st Quality (10+) - Each",
      category3: "Owl Pellets",
      category2: "Premium Quality Owl Pellets",
      category1: "Premium Quality",
      description:
        "First-quality owl pellets (10+) ideal for detailed dissection, featuring clean, well-preserved specimens.",
      price: 3.75,
    },
    {
      sku: "OWLE 1Q",
      itemName: "Owl Pellets 1st Quality - Each",
      category3: "Owl Pellets",
      category2: "Premium Quality Owl Pellets",
      category1: "Premium Quality",
      description:
        "Single first-quality owl pellet for advanced biological studies and prey identification.",
      price: 3.95,
    },
    {
      sku: "LEECP10+",
      itemName: "Leech Preserved (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Annelids",
      category1: "Leech (Preserved)",
      description:
        "Preserved leech specimen available in quantities of 10 or more for dissection and comparative anatomy lessons.",
      price: 2.1,
    },
    {
      sku: "LUMBE10+",
      itemName: "Lumbricus 9 - 12-in. (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Annelids",
      category1: "Lumbricus",
      description:
        "Preserved Lumbricus earthworm (9–12 inches) for biological study; sold in groups of 10 or more.",
      price: 0.8,
    },
    {
      sku: "LUMBE100+",
      itemName: "Lumbricus 9 - 12-in. (100+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Annelids",
      category1: "Lumbricus",
      description:
        "Bulk preserved Lumbricus earthworms (9–12 inches), ideal for large class dissection and morphology exercises.",
      price: 0.6,
    },
    {
      sku: "NERE10+",
      itemName: "Nereis (Clam Worm) 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Annelids",
      category1: "Nereis (Clam Worm)",
      description:
        "Preserved clam worm (Nereis) specimen for marine biology and segmented worm studies.",
      price: 2.4,
    },
    {
      sku: "CENTE P",
      itemName: "Centipedes (Preserved) Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Centipedes (Preserved)",
      description:
        "Individual preserved centipede specimen for studying arthropod anatomy and segmentation.",
      price: 2.45,
    },
    {
      sku: "CENTE P 10+",
      itemName: "Centipedes (Preserved) (10+) Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Centipedes (Preserved)",
      description:
        "Set of 10+ preserved centipedes, ideal for classroom comparisons of arthropod form and function.",
      price: 2.1,
    },
    {
      sku: "COCKP 100",
      itemName: "Cockroaches (Periplaneta Americana) 100+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Cockroaches",
      description:
        "Bulk preserved cockroaches (100+) for large class dissection and entomology labs.",
      price: 0.7,
    },
    {
      sku: "COCKP 10",
      itemName: "Cockroaches (Periplaneta Americana) 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Cockroaches",
      description:
        "Set of 10 preserved cockroaches suitable for classroom insect anatomy lessons.",
      price: 1.8,
    },
    {
      sku: "COCKE",
      itemName: "Cockroaches (Periplaneta Americana) - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Cockroaches",
      description:
        "Single preserved cockroach for detailed dissection and structural observation.",
      price: 3.5,
    },
    {
      sku: "CRAYEP10+",
      itemName: "Crayfish 4-in. Plain (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Crayfish",
      description:
        "Preserved 4-inch crayfish, plain, sold in quantities of 10 or more for dissection use.",
      price: 1.94,
    },
    {
      sku: "CRAYEINJ10+",
      itemName: "Crayfish Injected 4-in.+ (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Crayfish",
      description:
        "Preserved 4-inch injected crayfish specimens highlighting internal anatomy; sold in sets of 10+.",
      price: 2.3,
    },
    {
      sku: "FIDLP 10",
      itemName: "Fiddler Crab - pk/10",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Fiddler Crab",
      description:
        "Package of 10 preserved fiddler crabs for crustacean morphology and adaptation studies.",
      price: 15.0,
    },
    {
      sku: "GOOSBARN 10",
      itemName: "Gooseneck Barnacles - Vial of 10",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Gooseneck Barnacles",
      description:
        "Vial containing 10 preserved gooseneck barnacles for examination of marine arthropod adaptations.",
      price: 9.9,
    },
    {
      sku: "HORSCR E",
      itemName: "Horseshoe Crab (Limulus) - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Horseshoe Crab (Limulus)",
      description:
        "Single preserved horseshoe crab specimen for anatomical and evolutionary studies.",
      price: 3.75,
    },
    {
      sku: "MILLE P 10+",
      itemName: "Millipede (Preserved) 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Millipede (Preserved)",
      description:
        "Set of 10+ preserved millipedes used in classroom comparisons of arthropod body segmentation.",
      price: 1.9,
    },
    {
      sku: "MILLE P",
      itemName: "Millipede (Preserved) - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Millipede (Preserved)",
      description:
        "Single preserved millipede for use in biology and arthropod structure lessons.",
      price: 2.0,
    },
    {
      sku: "ROMAE",
      itemName: "Romalea (Lubber Grasshopper) - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Romalea (Lubber Grasshopper)",
      description:
        "Single preserved lubber grasshopper (Romalea) for insect anatomy and physiology studies.",
      price: 0.6,
    },
    {
      sku: "ROMAE10+",
      itemName: "Romalea (Lubber Grasshopper) 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Romalea (Lubber Grasshopper)",
      description:
        "Set of 10+ preserved lubber grasshoppers ideal for group dissections or comparison exercises.",
      price: 0.55,
    },
    {
      sku: "ROMAT10+",
      itemName: "Romalea (Tracheal System Injected) 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Romalea (Lubber Grasshopper)",
      description:
        "Set of 10+ grasshoppers injected to highlight tracheal systems for respiratory system instruction.",
      price: 0.95,
    },
    {
      sku: "SCORP 100",
      itemName: "Scorpions 100+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Scorpions",
      description:
        "Bulk set of preserved scorpions (100+) for large classroom or teaching collections.",
      price: 2.0,
    },
    {
      sku: "SCORPE",
      itemName: "Scorpions Preserved - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Scorpions",
      description:
        "Single preserved scorpion specimen for dissection or arthropod diversity studies.",
      price: 2.5,
    },
    {
      sku: "SCORPE10+",
      itemName: "Scorpions Preserved (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Scorpions",
      description:
        "Set of 10+ preserved scorpions suitable for group study or entomological demonstrations.",
      price: 2.2,
    },
    {
      sku: "SPID BW",
      itemName: "Spider Black Widow - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Spiders",
      description:
        "Preserved black widow spider specimen for study of arachnid morphology and venomous adaptations.",
      price: 8.4,
    },
    {
      sku: "SPID",
      itemName: "Spiders (Non Specific) - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Spiders",
      description:
        "Generic preserved spider specimen for use in taxonomy and anatomy activities.",
      price: 2.15,
    },
    {
      sku: "TARAN",
      itemName: "Tarantula - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Spiders",
      description:
        "Large preserved tarantula specimen for comparative anatomy and arachnid structure study.",
      price: 8.9,
    },
    {
      sku: "TICK 10",
      itemName: "Tick - Vial/10",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Ticks",
      description:
        "Vial of 10 preserved ticks for microscopic examination and parasitology instruction.",
      price: 14.0,
    },
    {
      sku: "TICK",
      itemName: "Tick - Each",
      category3: "Preserved Invertebrates",
      category2: "Arthropods",
      category1: "Ticks",
      description:
        "Single preserved tick specimen for studying ectoparasites and vector biology.",
      price: 2.0,
    },
    {
      sku: "AMPHX10",
      itemName: "Amphioxus - Vial/10",
      category3: "Preserved Invertebrates",
      category2: "Chordata",
      category1: "Lancelets (Amphioxus)",
      description:
        "Vial of 10 preserved Amphioxus specimens illustrating primitive chordate features for anatomy and evolution studies.",
      price: 16.0,
    },
    {
      sku: "METRE",
      itemName: "Metridium (Sea Anemone) - Each",
      category3: "Preserved Invertebrates",
      category2: "Cnidarians",
      category1: "Anthozoa",
      description:
        "Single preserved Metridium sea anemone specimen for dissection and study of cnidarian body structure.",
      price: 4.8,
    },
    {
      sku: "SEAP EA",
      itemName: "Sea Pens - Each",
      category3: "Preserved Invertebrates",
      category2: "Cnidarians",
      category1: "Anthozoa",
      description:
        "Single preserved sea pen specimen used to demonstrate colonial cnidarian anatomy and morphology.",
      price: 11.0,
    },
    {
      sku: "VELE EA",
      itemName: "Velella (Wind Sailor) - Each",
      category3: "Preserved Invertebrates",
      category2: "Cnidarians",
      category1: "Hydrozoa",
      description:
        "Preserved Velella (wind sailor) specimen displaying hydrozoan colony structure and floating adaptations.",
      price: 4.28,
    },
    {
      sku: "OBEL 10",
      itemName: "Obelia Hydroid - pk/10",
      category3: "Preserved Invertebrates",
      category2: "Cnidarians",
      category1: "Hydrozoa",
      description:
        "Pack of 10 preserved Obelia hydroids for study of colonial hydrozoan life cycles and forms.",
      price: 5.0,
    },
    {
      sku: "HYDRP 10",
      itemName: "Hydra preserved - Vial/10",
      category3: "Preserved Invertebrates",
      category2: "Cnidarians",
      category1: "Hydrozoa",
      description:
        "Vial of 10 preserved Hydra specimens demonstrating cnidarian polyp form and regenerative structure.",
      price: 5.0,
    },
    {
      sku: "PHYSA EA",
      itemName: "Physalia (Portuguese Man-O-War) - Each",
      category3: "Preserved Invertebrates",
      category2: "Cnidarians",
      category1: "Hydrozoa",
      description:
        "Single preserved Physalia (Portuguese Man-O-War) showing gas-filled float and tentacle structures.",
      price: 17.0,
    },
    {
      sku: "AREL 10",
      itemName: "Arelia 3-4-in. 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Cnidarians",
      category1: "Scyphozoa",
      description:
        "Set of preserved Arelia jellyfish (3–4 inches) sold in groups of 10+ for study of medusa structure.",
      price: 2.0,
    },
    {
      sku: "AREL EA",
      itemName: "Arelia 3-4-in. - Each",
      category3: "Preserved Invertebrates",
      category2: "Cnidarians",
      category1: "Scyphozoa",
      description:
        "Single preserved Arelia jellyfish specimen for examination of scyphozoan anatomy and tissues.",
      price: 3.0,
    },
    {
      sku: "PLEUR10",
      itemName: "Pleurobranchia Sea Walnut - pk/10",
      category3: "Preserved Invertebrates",
      category2: "Ctenophora",
      category1: "Pleurobranchia Sea Walnut",
      description:
        "Pack of 10 preserved Pleurobranchia (sea walnut) specimens for study of comb jelly characteristics and movement.",
      price: 11.0,
    },
    {
      sku: "BRIT EA",
      itemName: "Brittle Star - Each",
      category3: "Preserved Invertebrates",
      category2: "Echinoderms",
      category1: "Brittle Star",
      description:
        "Preserved brittle star specimen used to demonstrate echinoderm radial symmetry and regeneration.",
      price: 3.95,
    },
    {
      sku: "SAND EA",
      itemName: "Sand Dollar - Each",
      category3: "Preserved Invertebrates",
      category2: "Echinoderms",
      category1: "Sand Dollar",
      description:
        "Single preserved sand dollar specimen for marine invertebrate morphology and symmetry lessons.",
      price: 2.0,
    },
    {
      sku: "SEAC EA",
      itemName: "Sea Cucumber - Each",
      category3: "Preserved Invertebrates",
      category2: "Echinoderms",
      category1: "Sea Cucumbers",
      description:
        "Single preserved sea cucumber specimen ideal for internal anatomy and echinoderm diversity demonstrations.",
      price: 4.7,
    },
    {
      sku: "SEASE10+",
      itemName: "Sea Stars 3-6 in. (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Echinoderms",
      category1: "Sea Stars",
      description:
        "Preserved sea star specimens (3–6 inches) sold in quantities of 10+ for classroom comparative anatomy.",
      price: 4.0,
    },
    {
      sku: "SEAUP10+",
      itemName: "Sea Urchins Preserved (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Echinoderms",
      category1: "Sea Urchins (Preserved)",
      description:
        "Set of 10+ preserved sea urchins for echinoderm skeletal structure and spiny adaptation studies.",
      price: 2.75,
    },
    {
      sku: "SEAU EA",
      itemName: "Sea Urchin - Each",
      category3: "Preserved Invertebrates",
      category2: "Echinoderms",
      category1: "Sea Urchins (Preserved)",
      description:
        "Single preserved sea urchin specimen used to examine test structure and echinoderm anatomy.",
      price: 3.0,
    },
    {
      sku: "CHIT EA",
      itemName: "Chiton - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Chiton",
      description:
        "Single preserved chiton specimen displaying segmented shell plates and muscular foot for mollusk structure study.",
      price: 4.2,
    },
    {
      sku: "LANDP10+",
      itemName: "Land Snails Preserved (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Land Snails (Preserved)",
      description:
        "Set of 10+ preserved land snails for examination of gastropod anatomy and adaptation.",
      price: 1.2,
    },
    {
      sku: "LANDP100+",
      itemName: "Land Snails Preserved (100+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Land Snails (Preserved)",
      description:
        "Bulk group of 100+ preserved land snails suitable for large classroom or research use.",
      price: 0.9,
    },
    {
      sku: "MUSSE3-5-in.",
      itemName: "Mussels 3-5-in. (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Mussels",
      description:
        "Set of 10+ preserved mussels (3–5 inches) for study of bivalve anatomy and filter-feeding structures.",
      price: 2.2,
    },
    {
      sku: "SQUID 6-8-in",
      itemName: "Squid Plain 6-8-in. - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Preserved plain squid specimen (6–8 inches) for dissection and cephalopod anatomy demonstration.",
      price: 6.7,
    },
    {
      sku: "SQUID6-8P10",
      itemName: "Squid Plain 6-8-in. (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Set of 10+ plain preserved squid specimens (6–8 inches) ideal for group dissections.",
      price: 6.02,
    },
    {
      sku: "SQUID 8-12-i",
      itemName: "Squid Plain 8-12-in. - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Single preserved plain squid (8–12 inches) for detailed study of cephalopod organs and locomotion.",
      price: 12.5,
    },
    {
      sku: "SQUID 8-12-i10",
      itemName: "Squid Plain 8-12-in. (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Set of 10+ plain squid (8–12 inches) for comparative anatomy and advanced lab work.",
      price: 11.2,
    },
    {
      sku: "SQUID 8-12-inJ",
      itemName: "Squid Single Injected 8-12-in. - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Single injected squid specimen (8–12 inches) with vascular system highlighted for anatomical clarity.",
      price: 6.0,
    },
    {
      sku: "SQUID 8-12-inJ10",
      itemName: "Squid Single Injected 8-12-in. (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Set of 10+ single injected squid specimens (8–12 inches) highlighting internal structure for group dissection.",
      price: 5.4,
    },
    {
      sku: "SQUID 12-16-",
      itemName: "Squid Single Injected 12-16-in. - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Large single-injected squid specimen (12–16 inches) for upper-level dissection and anatomical detail.",
      price: 7.2,
    },
    {
      sku: "SQUID 12-16-10",
      itemName: "Squid Single Injected 12-16-in. (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Set of 10+ injected squid (12–16 inches) highlighting vascular and organ systems for lab comparisons.",
      price: 6.8,
    },
    {
      sku: "SQUID 12-16-D",
      itemName: "Squid Double Injected 12-16-in. - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Double-injected squid specimen (12–16 inches) showing both arterial and venous systems for advanced study.",
      price: 8.45,
    },
    {
      sku: "SQUID 12-16-D10",
      itemName: "Squid Double Injected 12-16-in. (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Molluscs",
      category1: "Squid",
      description:
        "Set of 10+ double-injected squid specimens (12–16 inches) for advanced anatomy or comparative dissection labs.",
      price: 7.0,
    },
    {
      sku: "ASCARE10+",
      itemName: "Ascaris Lumbricoides (10+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Nematodes",
      category1: "Ascaris Lumbricoides",
      description:
        "Set of 10+ preserved Ascaris lumbricoides specimens for nematode structure and reproductive system studies.",
      price: 0.88,
    },
    {
      sku: "ASCAR100+",
      itemName: "Ascaris Lumbricoides (100+) - Each",
      category3: "Preserved Invertebrates",
      category2: "Nematodes",
      category1: "Ascaris Lumbricoides",
      description:
        "Bulk group of 100+ preserved Ascaris lumbricoides specimens suitable for large-scale teaching labs.",
      price: 0.78,
    },
    {
      sku: "MONI 10",
      itemName: "Moniezia (Sheep tapeworm) 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Platyhelminthes",
      category1: "Cestoda",
      description:
        "Set of 10+ preserved Moniezia (sheep tapeworm) specimens for comparative anatomy and parasitology study.",
      price: 5.5,
    },
    {
      sku: "MONI EA",
      itemName: "Moniezia (Sheep tapeworm) - Each",
      category3: "Preserved Invertebrates",
      category2: "Platyhelminthes",
      category1: "Cestoda",
      description:
        "Single preserved Moniezia tapeworm specimen for observation of segmented body structure and host adaptation.",
      price: 6.0,
    },
    {
      sku: "TAEN EA",
      itemName: "Taenia (Dog tapeworm) - Each",
      category3: "Preserved Invertebrates",
      category2: "Platyhelminthes",
      category1: "Cestoda",
      description:
        "Preserved Taenia (dog tapeworm) specimen for study of cestode anatomy and parasite-host relationships.",
      price: 7.0,
    },
    {
      sku: "FASC 100",
      itemName: "Fasciola (Sheep liver fluke) 100+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Platyhelminthes",
      category1: "Trematodes",
      description:
        "Bulk preserved Fasciola (sheep liver fluke) specimens (100+) for parasitology and anatomy labs.",
      price: 1.4,
    },
    {
      sku: "FASC 10",
      itemName: "Fasciola (Sheep liver fluke) 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Platyhelminthes",
      category1: "Trematodes",
      description:
        "Set of 10+ preserved Fasciola specimens for teaching parasitic life cycles and organ systems.",
      price: 1.6,
    },
    {
      sku: "PLAN P10",
      itemName: "Planaria preserved - Vial/10",
      category3: "Preserved Invertebrates",
      category2: "Platyhelminthes",
      category1: "Turbellaria",
      description:
        "Vial of 10 preserved Planaria specimens used to demonstrate regeneration and flatworm body plan.",
      price: 6.0,
    },
    {
      sku: "GRANTIAE",
      itemName: "Grantia .75 in.+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Porifera (Sponges)",
      category1: "Grantia",
      description:
        "Single preserved Grantia sponge specimen (0.75 in.+) for study of canal systems and cellular structure.",
      price: 2.3,
    },
    {
      sku: "CHAL 10",
      itemName: "Chalina (Finger Sponge) 10+ - Each",
      category3: "Preserved Invertebrates",
      category2: "Porifera (Sponges)",
      category1: "Chalina (Finger Sponge)",
      description:
        "Set of 10+ preserved Chalina (finger sponge) specimens for comparative sponge anatomy studies.",
      price: 3.0,
    },
    {
      sku: "CHAL EA",
      itemName: "Chalina (Finger Sponge) - Each",
      category3: "Preserved Invertebrates",
      category2: "Porifera (Sponges)",
      category1: "Chalina (Finger Sponge)",
      description:
        "Single preserved Chalina sponge for observation of poriferan morphology and feeding adaptations.",
      price: 4.0,
    },
    {
      sku: "SHEPFL E",
      itemName: "Sheep Liver Fluke - Each",
      category3: "Preserved Invertebrates",
      category2: "Platyhelminthes",
      category1: "Trematodes",
      description:
        "Single preserved sheep liver fluke specimen for study of parasitic flatworm anatomy and life cycle.",
      price: 2.1,
    },
    {
      sku: "LAMP P",
      itemName: 'Lamprey Plain 18"+ - Each',
      category3: "Preserved Vertebrates",
      category2: "Agnatha",
      category1: "Lamprey",
      description:
        "Single preserved lamprey specimen (18 inches or larger) for comparative vertebrate anatomy and evolutionary study.",
      price: 19.8,
    },
    {
      sku: "LAMP P 10+",
      itemName: 'Lamprey Plain 18"+ (10+) - Each',
      category3: "Preserved Vertebrates",
      category2: "Agnatha",
      category1: "Lamprey",
      description:
        "Set of 10+ preserved lamprey specimens (18 inches or larger) ideal for group dissections and chordate evolution studies.",
      price: 18.5,
    },
    {
      sku: "AMPHIP(10+)E",
      itemName: "Amphiuma (Congo Eel) Preserved - 10+ - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Amphiuma (Congo Eel)",
      description:
        "Set of 10+ preserved Amphiuma (Congo eel) specimens for study of amphibian morphology and limb reduction.",
      price: 15.2,
    },
    {
      sku: "BULLE4-5P",
      itemName: "Bullfrogs Plain 4-5-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Preserved bullfrog specimen (4–5 inches), plain, for dissection and internal anatomy observation.",
      price: 7.96,
    },
    {
      sku: "BULLE4-5P10+",
      itemName: "Bullfrogs Plain 4-5-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Set of 10+ preserved bullfrogs (4–5 inches), plain, ideal for classroom dissection exercises.",
      price: 7.02,
    },
    {
      sku: "BULLE 4-5DI",
      itemName: "Bullfrogs Double Injected 4-5-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Double-injected bullfrog specimen (4–5 inches) with arterial and venous systems highlighted for detailed anatomy study.",
      price: 10.75,
    },
    {
      sku: "BULLE 4-5DI1",
      itemName: "Bullfrogs Double Injected 4-5-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Set of 10+ double-injected bullfrog specimens (4–5 inches) for advanced comparative anatomy labs.",
      price: 9.55,
    },
    {
      sku: "BULLE5-6P",
      itemName: "Bullfrogs Plain 5-6-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Plain preserved bullfrog specimen (5–6 inches) suitable for standard classroom dissections.",
      price: 11.2,
    },
    {
      sku: "BULLE5-6P10+",
      itemName: "Bullfrogs Plain 5-6-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Set of 10+ plain bullfrog specimens (5–6 inches) for group dissection and anatomy instruction.",
      price: 10.45,
    },
    {
      sku: "BULLE 5-6DI",
      itemName: "Bullfrogs Double Injected 5-6-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Double-injected bullfrog specimen (5–6 inches) highlighting circulatory pathways for in-depth dissection.",
      price: 14.8,
    },
    {
      sku: "BULLE 5-6DI1",
      itemName: "Bullfrogs Double Injected 5-6-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Set of 10+ double-injected bullfrogs (5–6 inches) ideal for detailed vascular anatomy comparison.",
      price: 13.95,
    },
    {
      sku: "BULLE6-7P",
      itemName: "Bullfrogs Plain 6-7-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Large plain bullfrog specimen (6–7 inches) for dissection and organ identification.",
      price: 15.0,
    },
    {
      sku: "BULLE6-7P10+",
      itemName: "Bullfrogs Plain 6-7-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Set of 10+ large bullfrog specimens (6–7 inches) for advanced comparative anatomy study.",
      price: 14.7,
    },
    {
      sku: "BULLE 6-7DI",
      itemName: "Bullfrogs Double Injected 6-7-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Double-injected large bullfrog specimen (6–7 inches) showing arterial and venous systems in contrasting colors.",
      price: 12.3,
    },
    {
      sku: "BULLE 6-7DI1",
      itemName: "Bullfrogs Double Injected 6-7-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Bullfrogs (Preserved)",
      description:
        "Set of 10+ large double-injected bullfrogs (6–7 inches) for group dissection and advanced studies.",
      price: 11.6,
    },
    {
      sku: "GRASEP 3-4",
      itemName: "Grassfrogs Plain 3-4-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs",
      description:
        "Plain preserved grassfrog specimen (3–4 inches) for general amphibian dissection and anatomy lessons.",
      price: 3.6,
    },
    {
      sku: "GRASEP 3-4 1",
      itemName: "Grassfrogs Plain 3-4-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs",
      description:
        "Set of 10+ plain preserved grassfrogs (3–4 inches) for classroom amphibian dissections.",
      price: 3.5,
    },
    {
      sku: "GRASESI 3-4",
      itemName: "Grassfrogs Single Injected 3-4-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs",
      description:
        "Single-injected grassfrog (3–4 inches) with arterial system highlighted for vascular system study.",
      price: 4.25,
    },
    {
      sku: "GRASESI 3-4 10+",
      itemName: "Grassfrogs Single Injected 3-4-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs",
      description:
        "Set of 10+ single-injected grassfrogs (3–4 inches) for comparative vascular and organ system demonstrations.",
      price: 4.1,
    },
    {
      sku: "GRASEP 4-5",
      itemName: "Grassfrogs Plain 4-5-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs",
      description:
        "Plain preserved grassfrog specimen (4–5 inches) for dissection and anatomy observation.",
      price: 8.85,
    },
    {
      sku: "GRASEP 4-510",
      itemName: "Grassfrogs Plain 4-5-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs",
      description:
        "Set of 10+ preserved grassfrogs (4–5 inches) for use in comparative amphibian anatomy labs.",
      price: 8.7,
    },
    {
      sku: "GRASE 4-5DI",
      itemName: "Grassfrogs Double Injected 4-5-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs",
      description:
        "Double-injected grassfrog specimen (4–5 inches) highlighting both arterial and venous systems.",
      price: 8.6,
    },
    {
      sku: "GRASE 4-5DI1",
      itemName: "Grassfrogs Double Injected 4-5-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Grassfrogs",
      description:
        "Set of 10+ double-injected grassfrog specimens (4–5 inches) for group anatomical and vascular comparisons.",
      price: 8.2,
    },
    {
      sku: "NECE P",
      itemName: "Necturus Plain (Mudpuppy) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Necturus",
      description:
        "Single preserved Necturus (mudpuppy) specimen for comparative amphibian anatomy and external gill study.",
      price: 4.6,
    },
    {
      sku: "NECE P10+",
      itemName: "Necturus Plain (Mudpuppy) 10+ - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Necturus",
      description:
        "Set of 10+ plain preserved Necturus (mudpuppies) suitable for class dissection and morphology labs.",
      price: 4.4,
    },
    {
      sku: "NECE DI",
      itemName: "Necturus Double Injected (Mudpuppy) - Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Necturus",
      description:
        "Double-injected Necturus (mudpuppy) specimen showing arterial and venous systems in contrasting colors.",
      price: 8.5,
    },
    {
      sku: "NECE DI 10+",
      itemName: "Necturus Double Injected (Mudpuppy) 10+ Each",
      category3: "Preserved Vertebrates",
      category2: "Amphibians",
      category1: "Necturus",
      description:
        "Set of 10+ double-injected mudpuppy specimens for advanced circulatory and anatomical studies.",
      price: 5.4,
    },
    {
      sku: "PIGE P",
      itemName: "Pigeons Plain - Each",
      category3: "Preserved Vertebrates",
      category2: "Birds",
      category1: "Pigeons",
      description:
        "Single preserved pigeon specimen for avian anatomy, skeletal, and muscular system study.",
      price: 14.96,
    },
    {
      sku: "PIGE P10+",
      itemName: "Pigeons Plain (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Birds",
      category1: "Pigeons",
      description:
        "Set of 10+ plain preserved pigeons for comparative bird anatomy and class dissection exercises.",
      price: 14.8,
    },
    {
      sku: "PIGE DI",
      itemName: "Pigeons Double Injected - Each",
      category3: "Preserved Vertebrates",
      category2: "Birds",
      category1: "Pigeons",
      description:
        "Double-injected pigeon specimen showing detailed vascular structures for advanced dissection labs.",
      price: 19.9,
    },
    {
      sku: "PIGE DI10+",
      itemName: "Pigeons Double Injected (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Birds",
      category1: "Pigeons",
      description:
        "Set of 10+ double-injected pigeon specimens ideal for group comparative anatomy studies.",
      price: 19.6,
    },
    {
      sku: "SHARE P10+",
      itemName: "Shark Plain 18-22-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Sharks",
      description:
        "Set of 10+ plain preserved sharks (18–22 inches) for study of cartilaginous fish structure and anatomy.",
      price: 15.2,
    },
    {
      sku: "SHARE P100+",
      itemName: "Shark Plain 18-22-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Sharks",
      description:
        "Single plain preserved shark (18–22 inches) ideal for general anatomy and dissection exercises.",
      price: 15.7,
    },
    {
      sku: "SHARE DI",
      itemName: "Shark Double Injected 22-27-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Sharks",
      description:
        "Double-injected preserved shark (22–27 inches) showing arterial and venous systems for detailed anatomical instruction.",
      price: 24.4,
    },
    {
      sku: "SHARE DI10+",
      itemName: "Shark Double Injected 22-27-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Sharks",
      description:
        "Set of 10+ double-injected shark specimens (22–27 inches) for advanced comparative vertebrate dissections.",
      price: 23.2,
    },
    {
      sku: "SHARE TI",
      itemName: "Shark Triple Injected 22-27-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Sharks",
      description:
        "Triple-injected shark specimen (22–27 inches) with highlighted arterial, venous, and hepatic systems for comprehensive dissection.",
      price: 32.4,
    },
    {
      sku: "SKATE P",
      itemName: "Skate Plain - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Skate Plain",
      description:
        "Single plain preserved skate specimen for comparison of cartilaginous fish anatomy and body structure.",
      price: 7.2,
    },
    {
      sku: "SKATE P10",
      itemName: "Skate Plain 10+ - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Skate Plain",
      description:
        "Set of 10+ plain preserved skates for classroom dissections in comparative anatomy lessons.",
      price: 7.0,
    },
    {
      sku: "SKATE P100",
      itemName: "Skate Plain 100+ - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Skate Plain",
      description:
        "Bulk group of 100+ plain preserved skates for large class dissections and anatomy exercises.",
      price: 6.4,
    },
    {
      sku: "STINGRAY",
      itemName: "Stingray Plain - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Stingray Plain",
      description:
        "Single preserved stingray specimen ideal for anatomical study of flattened cartilaginous fish structures.",
      price: 7.2,
    },
    {
      sku: "STINGRAY 10+",
      itemName: "Stingray Plain (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Chondrichthyes (Sharks)",
      category1: "Stingray Plain",
      description:
        "Set of 10+ plain preserved stingrays suitable for group dissections in comparative vertebrate studies.",
      price: 7.0,
    },
    {
      sku: "COWE",
      itemName: "Cow Eyes - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Cow Eyes",
      description:
        "Single preserved cow eye for dissection and study of mammalian ocular anatomy.",
      price: 2.85,
    },
    {
      sku: "COWE10+",
      itemName: "Cow Eyes (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Cow Eyes",
      description:
        "Set of 10+ preserved cow eyes suitable for classroom dissection and comparative vision studies.",
      price: 2.45,
    },
    {
      sku: "PIGHRTE",
      itemName: "Pig Hearts - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Pig Hearts",
      description:
        "Single preserved pig heart for detailed study of mammalian cardiac structure and function.",
      price: 9.05,
    },
    {
      sku: "PIGHRTE10+",
      itemName: "Pig Hearts (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Pig Hearts",
      description:
        "Set of 10+ preserved pig hearts ideal for group dissections and cardiovascular anatomy instruction.",
      price: 8.95,
    },
    {
      sku: "PIGHRT PE",
      itemName: "Pig Hearts (in pericardium) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Pig Hearts",
      description:
        "Single pig heart preserved within pericardium for advanced cardiovascular dissection.",
      price: 13.5,
    },
    {
      sku: "PIGHRT PE10+",
      itemName: "Pig Hearts (in pericardium) (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Pig Hearts",
      description:
        "Set of 10+ pig hearts with intact pericardium for teaching mammalian heart anatomy in groups.",
      price: 13.35,
    },
    {
      sku: "PIGKE DI10+",
      itemName: "Pig Kidneys Double Injected (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Pig Kidneys",
      description:
        "Set of 10+ double-injected pig kidneys highlighting vascular and urinary pathways for detailed study.",
      price: 7.6,
    },
    {
      sku: "SHEPBR E",
      itemName: "Sheep Brains w/o Pituitary - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Brains",
      description:
        "Single preserved sheep brain without pituitary for study of central nervous system anatomy.",
      price: 14.25,
    },
    {
      sku: "SHEPBR 10+",
      itemName: "Sheep Brains w/o Pituitary (10+) Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Brains",
      description:
        "Set of 10+ preserved sheep brains (without pituitary) for classroom neuroscience dissections.",
      price: 13.75,
    },
    {
      sku: "SHEPBR W",
      itemName: "Sheep Brains with Pituitary - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Brains",
      description:
        "Single preserved sheep brain including pituitary gland for endocrine and brain anatomy studies.",
      price: 15.23,
    },
    {
      sku: "SHEPBR W10+",
      itemName: "Sheep Brains with Pituitary (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Brains",
      description:
        "Set of 10+ preserved sheep brains with pituitary intact for large-group neuroanatomy dissections.",
      price: 14.8,
    },
    {
      sku: "SHEPE 10+",
      itemName: "Sheep Eyes (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Eyes",
      description:
        "Set of 10+ preserved sheep eyes ideal for instruction in ocular structure and function.",
      price: 1.35,
    },
    {
      sku: "SHEPE 100+",
      itemName: "Sheep Eyes (100+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Eyes",
      description:
        "Bulk group of 100+ preserved sheep eyes for large classroom use in vision system dissections.",
      price: 1.15,
    },
    {
      sku: "SHEPHRT E",
      itemName: "Sheep Hearts - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Hearts",
      description:
        "Single preserved sheep heart for comparative study of mammalian heart anatomy and chambers.",
      price: 6.55,
    },
    {
      sku: "SHEPHRT E10+",
      itemName: "Sheep Hearts (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Hearts",
      description:
        "Set of 10+ preserved sheep hearts ideal for classroom dissections and cardiovascular system lessons.",
      price: 6.3,
    },
    {
      sku: "SHEPHRT PE",
      itemName: "Sheep Hearts (Pericardium) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Hearts",
      description:
        "Single preserved sheep heart with pericardium intact for advanced dissection and anatomical study.",
      price: 8.8,
    },
    {
      sku: "SHEPHRT P10+",
      itemName: "Sheep Hearts (Pericardium) (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Hearts",
      description:
        "Set of 10+ preserved sheep hearts with pericardium for group learning and detailed anatomical comparison.",
      price: 8.4,
    },
    {
      sku: "SHEPKID E",
      itemName: "Sheep Kidneys - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Kidneys",
      description:
        "Single preserved sheep kidney for dissection and study of excretory system structure.",
      price: 5.4,
    },
    {
      sku: "SHEPKID E10+",
      itemName: "Sheep Kidneys (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Kidneys",
      description:
        "Set of 10+ preserved sheep kidneys for class dissections focused on renal anatomy and filtration function.",
      price: 5.0,
    },
    {
      sku: "SHEPLK E",
      itemName: "Sheep Pluck - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Pluck",
      description:
        "Single preserved sheep pluck including heart, lungs, and trachea for respiratory and circulatory anatomy study.",
      price: 17.0,
    },
    {
      sku: "SHEPLK 10+",
      itemName: "Sheep Pluck (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammal Organs",
      category1: "Sheep Pluck",
      description:
        "Set of 10+ preserved sheep plucks for large-group dissection focused on thoracic organ systems.",
      price: 16.0,
    },
    {
      sku: "CATE 14-18P",
      itemName: "Cats Plain 14-18-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Cats",
      description:
        "Single preserved cat specimen (14–18 inches), plain, for advanced mammalian dissection and anatomical study.",
      price: 62.0,
    },
    {
      sku: "CATE D14-18",
      itemName: "Cats Double Injected 14-18-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Cats",
      description:
        "Double-injected preserved cat (14–18 inches) showing arterial and venous systems in contrasting colors for detailed anatomy instruction.",
      price: 76.0,
    },
    {
      sku: "CATE D 18+",
      itemName: "Cats Double Injected 18-in.+ - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Cats",
      description:
        "Large double-injected preserved cat (18 inches or larger) for in-depth study of muscular and vascular systems.",
      price: 36.5,
    },
    {
      sku: 'PIGSE 7-11"',
      itemName: 'Fetal Pigs Plain 7-11" - Each',
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Single plain preserved fetal pig (7–11 inches) for introductory mammalian dissection and organ identification.",
      price: 18.25,
    },
    {
      sku: "PIGSE 911P10",
      itemName: 'Fetal Pigs Plain 7-11" (10+) - Each',
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Set of 10+ plain preserved fetal pigs (7–11 inches) ideal for classroom dissection exercises.",
      price: 17.35,
    },
    {
      sku: "PIGSE 9-11-i",
      itemName: "Fetal Pigs Double Injected 9-11-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Double-injected fetal pig (9–11 inches) with color-coded vascular systems for enhanced anatomical study.",
      price: 19.45,
    },
    {
      sku: 'PIGSE 7-11" DI10+',
      itemName: 'Fetal Pigs Double Injected 7-11" (10+) - Each',
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Set of 10+ double-injected fetal pigs (7–11 inches) showing circulatory detail for group learning.",
      price: 19.1,
    },
    {
      sku: "PIGSE 11-13-",
      itemName: "Fetal Pigs Plain 11-13-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Plain preserved fetal pig (11–13 inches) suitable for comprehensive organ system dissections.",
      price: 20.5,
    },
    {
      sku: "PIGSE 11-13-P10+",
      itemName: "Fetal Pigs Plain 11-13-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Set of 10+ plain preserved fetal pigs (11–13 inches) ideal for anatomy labs and group dissections.",
      price: 19.4,
    },
    {
      sku: "PIGSE 11-13-DI",
      itemName: "Fetal Pigs Double Injected 11-13-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Double-injected preserved fetal pig (11–13 inches) displaying arterial and venous systems for detailed anatomical lessons.",
      price: 22.6,
    },
    {
      sku: "PIGSE1113D10",
      itemName: "Fetal Pigs Double Injected 11-13-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Set of 10+ double-injected fetal pigs (11–13 inches) for class dissections emphasizing circulatory anatomy.",
      price: 21.45,
    },
    {
      sku: "PIGSE 13-in.",
      itemName: "Fetal Pigs Plain 13-in.+ - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Large plain preserved fetal pig (13 inches or more) for advanced dissection and comparative anatomy.",
      price: 22.0,
    },
    {
      sku: "PIGSE13-inP1",
      itemName: 'Fetal Pigs Plain 13"+ (10+) - Each',
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Set of 10+ plain preserved fetal pigs (13 inches or more) for large-group instruction and anatomy courses.",
      price: 20.4,
    },
    {
      sku: "PIGSE 13-in. DI",
      itemName: "Fetal Pigs Double Injected 13-in.+ - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Double-injected fetal pig (13 inches or more) highlighting major vessels for detailed circulatory system observation.",
      price: 23.85,
    },
    {
      sku: "PIGSE 13-in. DI10+",
      itemName: "Fetal Pigs Double Injected 13-in.+ (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Fetal Pigs",
      description:
        "Set of 10+ double-injected fetal pigs (13 inches or more) for classroom dissections in advanced anatomy courses.",
      price: 22.7,
    },
    {
      sku: "RATSE P10+",
      itemName: "Rats Plain (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Rats",
      description:
        "Set of 10+ plain preserved rats for standard mammalian anatomy dissection and physiological structure study.",
      price: 9.95,
    },
    {
      sku: "RATSE DI10+",
      itemName: "Rats Double Injected (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Mammals",
      category1: "Rats",
      description:
        "Set of 10+ double-injected preserved rats showing major circulatory systems for in-depth dissection and comparison.",
      price: 14.2,
    },
    {
      sku: "AMIA E",
      itemName: "Amia (Bowfin) - Each",
      category3: "Preserved Vertebrates",
      category2: "Osteichthyes (Fish)",
      category1: "Amia (Bowfin)",
      description:
        "Single preserved Amia calva (bowfin) specimen used for study of primitive bony fish anatomy and morphology.",
      price: 8.2,
    },
    {
      sku: "AMIA10+E",
      itemName: "Amia (Bowfin) 10+ - Each",
      category3: "Preserved Vertebrates",
      category2: "Osteichthyes (Fish)",
      category1: "Amia (Bowfin)",
      description:
        "Set of 10+ preserved bowfin specimens ideal for group dissections and comparative vertebrate study.",
      price: 7.8,
    },
    {
      sku: "PERCE 5-7-in",
      itemName: "Perch Plain 5-7-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Osteichthyes (Fish)",
      category1: "Perch",
      description:
        "Single preserved perch specimen (5–7 inches) suitable for fish dissection and anatomical structure identification.",
      price: 1.8,
    },
    {
      sku: "PERCE 5-7 P1",
      itemName: "Perch Plain 5-7-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Osteichthyes (Fish)",
      category1: "Perch",
      description:
        "Set of 10+ plain preserved perch specimens (5–7 inches) for class dissections in vertebrate anatomy.",
      price: 1.6,
    },
    {
      sku: "PERCE 7-9-in",
      itemName: "Perch Plain 7-9-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Osteichthyes (Fish)",
      category1: "Perch",
      description:
        "Single preserved perch specimen (7–9 inches) ideal for observing fin structure and internal organs.",
      price: 2.25,
    },
    {
      sku: "PERCE 7-9-in 10+",
      itemName: "Perch Plain 7-9-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Osteichthyes (Fish)",
      category1: "Perch",
      description:
        "Set of 10+ preserved perch specimens (7–9 inches) for classroom comparative dissections.",
      price: 2.04,
    },
    {
      sku: "PERCE 9-11-i",
      itemName: "Perch Plain 9-11-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Osteichthyes (Fish)",
      category1: "Perch",
      description:
        "Large preserved perch (9–11 inches) suitable for detailed dissection and skeletal study.",
      price: 3.85,
    },
    {
      sku: "PERCE 9-11-i 10+",
      itemName: "Perch Plain 9-11-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Osteichthyes (Fish)",
      category1: "Perch",
      description:
        "Set of 10+ preserved perch specimens (9–11 inches) for group dissections emphasizing organ systems.",
      price: 3.55,
    },
    {
      sku: "SNAKE",
      itemName: "Snakes Plain 3' - Each",
      category3: "Preserved Vertebrates",
      category2: "Reptiles",
      category1: "Snakes",
      description:
        "Single plain preserved snake specimen (approx. 3 ft) used for dissection of scales, musculature, and vertebral structure.",
      price: 8.35,
    },
    {
      sku: "SNAKE 10+",
      itemName: "Snakes Plain 3' (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Reptiles",
      category1: "Snakes",
      description:
        "Set of 10+ preserved snakes (approx. 3 ft) for comparative reptilian anatomy and class dissections.",
      price: 6.95,
    },
    {
      sku: "SNAKE 100+",
      itemName: "Snakes Plain 3' (100+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Reptiles",
      category1: "Snakes",
      description:
        "Bulk set of 100+ preserved snakes (approx. 3 ft) ideal for large lab groups studying reptile structure.",
      price: 6.25,
    },
    {
      sku: "TURTE 6-8P",
      itemName: "Turtles Plain 6-8-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Reptiles",
      category1: "Turtles",
      description:
        "Single preserved turtle specimen (6–8 inches) used for dissection of shell, organ placement, and limb structure.",
      price: 9.2,
    },
    {
      sku: "TURTP 6-8 10",
      itemName: "Turtles Plain 6-8-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Reptiles",
      category1: "Turtles",
      description:
        "Set of 10+ plain preserved turtles (6–8 inches) for group dissections in comparative anatomy courses.",
      price: 9.0,
    },
    {
      sku: "TURTE 8-10 D",
      itemName: "Turtles Double Injected 8-10-in. - Each",
      category3: "Preserved Vertebrates",
      category2: "Reptiles",
      category1: "Turtles",
      description:
        "Double-injected preserved turtle (8–10 inches) showing color-coded vascular and systemic structures for dissection.",
      price: 15.0,
    },
    {
      sku: "TURTE 8-10 D10+",
      itemName: "Turtles Double Injected 8-10-in. (10+) - Each",
      category3: "Preserved Vertebrates",
      category2: "Reptiles",
      category1: "Turtles",
      description:
        "Set of 10+ double-injected turtles (8–10 inches) highlighting circulatory anatomy for class demonstration and lab use.",
      price: 14.9,
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
