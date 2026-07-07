import { AdminRole, AttendanceStatus, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const productImage = (query: string) =>
  `https://tse1.mm.bing.net/th?q=${encodeURIComponent(query)}&w=600&h=400&c=7&rs=1&p=0&o=5&pid=1.7`;

const categoryImage = (query: string) =>
  `https://tse1.mm.bing.net/th?q=${encodeURIComponent(query)}&w=800&h=600&c=7&rs=1&p=0&o=5&pid=1.7`;

const categories = [
  "Measurement Gauges & Fittings",
  "Valves & Valve Fittings",
  "Industrial Valves",
  "Bolts",
  "Tapes",
  "Industrial Pump",
  "Industrial & Oil Seals",
  "Rubber & Rubber Products",
  "Insulators, Mineral Wool, Glass Wool & Insulation Materials",
  "Belts",
  "Drilling Bits, Chucks & Collets",
  "Adhesives & Gum",
  "HSS Drill Bits",
  "Vices",
  "Hydraulic & Pneumatic Tools",
  "Adapter",
  "Compass",
  "Bearings",
  "Measuring Instruments & Equipment",
  "Kitchen Linens",
  "Drill & Boring Equipment",
  "Steel Pipes",
  "Flanges",
  "Zippers",
  "Gearbox & Gear Parts",
] as const;

const categorySlugMap: Record<string, string> = {
  "Measurement Gauges & Fittings": "measurement-gauges-fittings",
  "Valves & Valve Fittings": "valves-valve-fittings",
  "Industrial Valves": "industrial-valves",
  Bolts: "bolts",
  Tapes: "tapes",
  "Industrial Pump": "industrial-pump",
  "Industrial & Oil Seals": "industrial-oil-seals",
  "Rubber & Rubber Products": "rubber-rubber-products",
  "Insulators, Mineral Wool, Glass Wool & Insulation Materials":
    "insulators-mineral-wool-glass-wool-insulation-materials",
  Belts: "belts",
  "Drilling Bits, Chucks & Collets": "drilling-bits-chucks-collets",
  "Adhesives & Gum": "adhesives-gum",
  "HSS Drill Bits": "hss-drill-bits",
  Vices: "vices",
  "Hydraulic & Pneumatic Tools": "hydraulic-pneumatic-tools",
  Adapter: "adapter",
  Compass: "compass",
  Bearings: "bearings",
  "Measuring Instruments & Equipment": "measuring-instruments-equipment",
  "Kitchen Linens": "kitchen-linens",
  "Drill & Boring Equipment": "drill-boring-equipment",
  "Steel Pipes": "steel-pipes",
  Flanges: "flanges",
  Zippers: "zippers",
  "Gearbox & Gear Parts": "gearbox-gear-parts",
};

const categoryImageMap: Record<(typeof categories)[number], string> = {
  "Measurement Gauges & Fittings": categoryImage("industrial pressure gauges fittings"),
  "Valves & Valve Fittings": categoryImage("industrial valves and valve fittings"),
  "Industrial Valves": categoryImage("industrial valve assembly"),
  Bolts: categoryImage("steel bolts hardware"),
  Tapes: categoryImage("industrial tape rolls"),
  "Industrial Pump": categoryImage("industrial pump equipment"),
  "Industrial & Oil Seals": categoryImage("industrial oil seals gasket"),
  "Rubber & Rubber Products": categoryImage("industrial rubber products sheet"),
  "Insulators, Mineral Wool, Glass Wool & Insulation Materials": categoryImage(
    "industrial insulation mineral wool glass wool",
  ),
  Belts: categoryImage("industrial conveyor belts"),
  "Drilling Bits, Chucks & Collets": categoryImage("drill bits chucks collets"),
  "Adhesives & Gum": categoryImage("industrial adhesive glue container"),
  "HSS Drill Bits": categoryImage("hss drill bits metal"),
  Vices: categoryImage("bench vice industrial tool"),
  "Hydraulic & Pneumatic Tools": categoryImage("hydraulic pneumatic tools"),
  Adapter: categoryImage("stainless steel hydraulic hex adapter fittings"),
  Compass: categoryImage("engineering compass drawing tool"),
  Bearings: categoryImage("steel ball bearings"),
  "Measuring Instruments & Equipment": categoryImage("industrial measuring instruments"),
  "Kitchen Linens": categoryImage("industrial belt lacing fasteners"),
  "Drill & Boring Equipment": categoryImage("industrial drill machine"),
  "Steel Pipes": categoryImage("steel pipes industrial"),
  Flanges: categoryImage("steel pipe flanges"),
  Zippers: categoryImage("roller chain industrial"),
  "Gearbox & Gear Parts": categoryImage("industrial gearbox gears"),
};

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  priceInPaise: number;
  category: (typeof categories)[number];
};

const products: ProductSeed[] = [
  {
    name: "H Guru Pressure Gauge",
    slug: "h-guru-pressure-gauge",
    description:
      "Bourdon tube pressure gauge with brass internals for compressed air and water lines in plant maintenance.",
    priceInPaise: 180000,
    category: "Measurement Gauges & Fittings",
  },
  {
    name: "Analog Pressure Gauge",
    slug: "analog-pressure-gauge",
    description:
      "Dial type analog pressure gauge with stainless steel casing for reliable line pressure monitoring.",
    priceInPaise: 120000,
    category: "Measurement Gauges & Fittings",
  },
  {
    name: "Coley Temperature Gauge",
    slug: "coley-temperature-gauge",
    description:
      "Industrial temperature gauge suited for boiler and process heat applications with clear scale readability.",
    priceInPaise: 145000,
    category: "Measurement Gauges & Fittings",
  },
  {
    name: "Mitutoyo Analog Depth Gauge",
    slug: "mitutoyo-analog-depth-gauge",
    description:
      "Precision depth gauge for workshop machining and QC measurements on slots, grooves, and recesses.",
    priceInPaise: 320000,
    category: "Measurement Gauges & Fittings",
  },
  {
    name: "Stainless Steel Ball Valve",
    slug: "stainless-steel-ball-valve",
    description:
      "Full-port SS ball valve for corrosive fluids and high-cycle industrial shutoff lines.",
    priceInPaise: 280000,
    category: "Valves & Valve Fittings",
  },
  {
    name: "Galvanized Iron Globe Valve",
    slug: "galvanized-iron-globe-valve",
    description:
      "GI globe valve designed for controlled throttling in water distribution and process utility loops.",
    priceInPaise: 210000,
    category: "Valves & Valve Fittings",
  },
  {
    name: "Cast Iron Globe Valve",
    slug: "cast-iron-globe-valve",
    description:
      "Heavy-duty cast iron globe valve for steam and industrial process regulation duties.",
    priceInPaise: 260000,
    category: "Valves & Valve Fittings",
  },
  {
    name: "PP Ball Valve",
    slug: "pp-ball-valve",
    description:
      "Polypropylene ball valve for chemical-resistant pipelines in water treatment and process plants.",
    priceInPaise: 85000,
    category: "Industrial Valves",
  },
  {
    name: "Audco Plug Valve",
    slug: "audco-plug-valve",
    description:
      "Industrial plug valve engineered for dependable shutoff across oil and petrochemical services.",
    priceInPaise: 560000,
    category: "Industrial Valves",
  },
  {
    name: "Bucket Bolts",
    slug: "bucket-bolts",
    description:
      "Low-profile head steel bucket bolts for elevator bucket installations and conveyor fastening.",
    priceInPaise: 4500,
    category: "Bolts",
  },
  {
    name: "Stove Bolts",
    slug: "stove-bolts",
    description:
      "Zinc-coated stove bolts for machinery covers, electrical panels, and light equipment assembly.",
    priceInPaise: 6500,
    category: "Bolts",
  },
  {
    name: "Asbestos Metallic Tape",
    slug: "asbestos-metallic-tape",
    description:
      "Heat-resistant metallic reinforced asbestos tape for thermal insulation wrapping on pipelines.",
    priceInPaise: 32000,
    category: "Tapes",
  },
  {
    name: "Teflon Tape",
    slug: "teflon-tape",
    description:
      "PTFE thread seal tape for leak-proof threaded joints in plumbing and pneumatic line fittings.",
    priceInPaise: 9500,
    category: "Tapes",
  },
  {
    name: "Rotary Gear Pump",
    slug: "rotary-gear-pump",
    description:
      "Cast iron rotary gear pump suitable for lubricants, fuel oils, and viscous transfer duties.",
    priceInPaise: 1480000,
    category: "Industrial Pump",
  },
  {
    name: "Hydraulic Pipe Pressure Test Pump",
    slug: "hydraulic-pipe-pressure-test-pump",
    description:
      "Manual hydraulic test pump for pressure testing industrial pipe networks and valve assemblies.",
    priceInPaise: 980000,
    category: "Industrial Pump",
  },
  {
    name: "High Pressure Jointing Sheets",
    slug: "high-pressure-jointing-sheets",
    description:
      "Oil and steam resistant jointing sheets used in gasket cutting for high-pressure flange joints.",
    priceInPaise: 64000,
    category: "Industrial & Oil Seals",
  },
  {
    name: "Rubber Sheet",
    slug: "rubber-sheet",
    description:
      "Multi-purpose industrial rubber sheet for sealing pads, anti-vibration layering, and workshop use.",
    priceInPaise: 42000,
    category: "Rubber & Rubber Products",
  },
  {
    name: "Asbestos Mill Boards",
    slug: "asbestos-mill-boards",
    description:
      "Insulating mill board panels for furnace lining, heat barriers, and thermal shielding applications.",
    priceInPaise: 78000,
    category: "Insulators, Mineral Wool, Glass Wool & Insulation Materials",
  },
  {
    name: "Belt Lacing",
    slug: "belt-lacing",
    description:
      "Steel belt lacing clips for conveyor belt joining and field repairs in material handling systems.",
    priceInPaise: 25000,
    category: "Belts",
  },
  {
    name: "Hand Drill Bit",
    slug: "hand-drill-bit",
    description:
      "General purpose steel drill bit for hand drills, ideal for workshop fabrication and maintenance.",
    priceInPaise: 35000,
    category: "Drilling Bits, Chucks & Collets",
  },
  {
    name: "Industrial Adhesive Gum",
    slug: "industrial-adhesive-gum",
    description:
      "Strong bonding industrial adhesive suitable for rubber, fabric, leather, and light metal use.",
    priceInPaise: 42000,
    category: "Adhesives & Gum",
  },
  {
    name: "Miranda HSS Tool Bit",
    slug: "miranda-hss-tool-bit",
    description:
      "High-speed steel tool bit for turning operations on mild steel and alloy jobs in lathe work.",
    priceInPaise: 90000,
    category: "HSS Drill Bits",
  },
  {
    name: "Bench Vice",
    slug: "bench-vice",
    description:
      "Cast steel bench vice with precision machined jaws for clamping during fitting and drilling work.",
    priceInPaise: 260000,
    category: "Vices",
  },
  {
    name: "Hydraulic Tool Kit",
    slug: "hydraulic-tool-kit",
    description:
      "Comprehensive hydraulic maintenance toolkit for pressing, pulling, and workshop service jobs.",
    priceInPaise: 720000,
    category: "Hydraulic & Pneumatic Tools",
  },
  {
    name: "Stainless Steel Hydraulic Hex Adapter",
    slug: "stainless-steel-hydraulic-hex-adapter",
    description:
      "SS hydraulic hex adapter fitting for secure high-pressure hose and pipe thread transitions.",
    priceInPaise: 68000,
    category: "Adapter",
  },
  {
    name: "Engineering Compass",
    slug: "engineering-compass",
    description:
      "Metal body engineering compass for accurate marking and layout work in workshop drafting.",
    priceInPaise: 58000,
    category: "Compass",
  },
  {
    name: "Stainless Steel Ball Bearings",
    slug: "stainless-steel-ball-bearings",
    description:
      "Corrosion-resistant SS ball bearings for rotating assemblies in industrial machinery and motors.",
    priceInPaise: 180000,
    category: "Bearings",
  },
  {
    name: "Residential Water Meter",
    slug: "residential-water-meter",
    description:
      "Brass body residential and utility water meter for accurate flow measurement and billing.",
    priceInPaise: 145000,
    category: "Measuring Instruments & Equipment",
  },
  {
    name: "Belt Lacing (Industrial)",
    slug: "belt-lacing-industrial",
    description:
      "Industrial-grade belt lacing supplied for specialized fabrication and workshop spare use.",
    priceInPaise: 28000,
    category: "Kitchen Linens",
  },
  {
    name: "Power Drill Machine",
    slug: "power-drill-machine",
    description:
      "High torque power drill machine for metal, wood, and site maintenance boring operations.",
    priceInPaise: 480000,
    category: "Drill & Boring Equipment",
  },
  {
    name: "Mild Steel Seamless Pipes",
    slug: "mild-steel-seamless-pipes",
    description:
      "MS seamless pipes for high-pressure process lines, fabrication structures, and utility runs.",
    priceInPaise: 220000,
    category: "Steel Pipes",
  },
  {
    name: "Stainless Steel Weld Neck Flanges",
    slug: "stainless-steel-weld-neck-flanges",
    description:
      "Weld neck flanges built for robust, leak-resistant pipe joints in heavy industrial service.",
    priceInPaise: 260000,
    category: "Flanges",
  },
  {
    name: "Double Pitch Roller Chain",
    slug: "double-pitch-roller-chain",
    description:
      "Durable double pitch roller chain for transmission and conveyor drives in factory equipment.",
    priceInPaise: 195000,
    category: "Zippers",
  },
  {
    name: "Gearbox Assembly",
    slug: "gearbox-assembly",
    description:
      "Industrial gearbox assembly for torque conversion in heavy machinery and production lines.",
    priceInPaise: 4200000,
    category: "Gearbox & Gear Parts",
  },
];

const productImageMap: Record<ProductSeed["slug"], string> = {
  "h-guru-pressure-gauge": productImage("industrial pressure gauge"),
  "analog-pressure-gauge": productImage("analog pressure gauge industrial"),
  "coley-temperature-gauge": productImage("industrial temperature gauge"),
  "mitutoyo-analog-depth-gauge": productImage("Mitutoyo analog depth gauge"),
  "stainless-steel-ball-valve": productImage("stainless steel ball valve"),
  "galvanized-iron-globe-valve": productImage("galvanized iron globe valve"),
  "cast-iron-globe-valve": productImage("cast iron globe valve"),
  "pp-ball-valve": productImage("polypropylene pp ball valve"),
  "audco-plug-valve": productImage("industrial plug valve"),
  "bucket-bolts": productImage("bucket bolts hardware"),
  "stove-bolts": productImage("stove bolts hardware"),
  "asbestos-metallic-tape": productImage("metallic insulation tape roll"),
  "teflon-tape": productImage("ptfe teflon tape roll"),
  "rotary-gear-pump": productImage("rotary gear pump industrial"),
  "hydraulic-pipe-pressure-test-pump": productImage("hydraulic pressure test pump"),
  "high-pressure-jointing-sheets": productImage("high pressure gasket jointing sheet"),
  "rubber-sheet": productImage("industrial rubber sheet roll"),
  "asbestos-mill-boards": productImage("thermal insulation millboard sheet"),
  "belt-lacing": productImage("conveyor belt lacing fasteners"),
  "hand-drill-bit": productImage("metal drill bit"),
  "industrial-adhesive-gum": productImage("industrial adhesive container"),
  "miranda-hss-tool-bit": productImage("HSS tool bit lathe"),
  "bench-vice": productImage("bench vice tool"),
  "hydraulic-tool-kit": productImage("hydraulic tool kit"),
  "stainless-steel-hydraulic-hex-adapter": productImage("stainless steel hydraulic hex adapter fitting"),
  "engineering-compass": productImage("engineering compass drawing tool"),
  "stainless-steel-ball-bearings": productImage("stainless steel ball bearings"),
  "residential-water-meter": productImage("residential water meter"),
  "belt-lacing-industrial": productImage("industrial conveyor belt lacing"),
  "power-drill-machine": productImage("power drill machine"),
  "mild-steel-seamless-pipes": productImage("mild steel seamless pipes"),
  "stainless-steel-weld-neck-flanges": productImage("stainless steel weld neck flange"),
  "double-pitch-roller-chain": productImage("double pitch roller chain"),
  "gearbox-assembly": productImage("industrial gearbox assembly"),
};

const employees = [
  {
    name: "Rohit Tiwari",
    role: "Sales Manager",
    phone: "+91 98765 11223",
    email: "rohit.tiwari@deltamill.in",
    address: "Kidwai Nagar, Kanpur, Uttar Pradesh",
    joinDate: new Date("2022-03-15"),
    baseSalary: 5200000,
  },
  {
    name: "Pooja Verma",
    role: "Warehouse Supervisor",
    phone: "+91 98320 44771",
    email: "pooja.verma@deltamill.in",
    address: "Govind Nagar, Kanpur, Uttar Pradesh",
    joinDate: new Date("2021-07-01"),
    baseSalary: 3800000,
  },
  {
    name: "Amit Saxena",
    role: "Accountant",
    phone: "+91 98111 55443",
    email: "amit.saxena@deltamill.in",
    address: "Swaroop Nagar, Kanpur, Uttar Pradesh",
    joinDate: new Date("2023-01-10"),
    baseSalary: 4500000,
  },
];

async function main() {
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const adminPassword = await bcrypt.hash("pwd1", 10);
  await prisma.adminUser.upsert({
    where: { username: "admin1" },
    update: {
      passwordHash: adminPassword,
      role: AdminRole.SUPER_ADMIN,
      name: "Super Admin",
      email: "admin@deltamill.local",
    },
    create: {
      username: "admin1",
      passwordHash: adminPassword,
      role: AdminRole.SUPER_ADMIN,
      name: "Super Admin",
      email: "admin@deltamill.local",
    },
  });

  const demoPasswordHash = await bcrypt.hash("Password123!", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@deltamill.local" },
    update: {
      name: "Demo Customer",
      passwordHash: demoPasswordHash,
      phone: "+91 90000 00000",
    },
    create: {
      name: "Demo Customer",
      email: "demo@deltamill.local",
      passwordHash: demoPasswordHash,
      phone: "+91 90000 00000",
    },
  });

  await prisma.address.deleteMany({
    where: { userId: demoUser.id },
  });
  await prisma.address.create({
    data: {
      userId: demoUser.id,
      label: "Home",
      fullName: "Demo Customer",
      phone: "+91 90000 00000",
      line1: "123 Demo Street",
      line2: "Near Industrial Area",
      city: "Kanpur",
      state: "Uttar Pradesh",
      pincode: "208001",
      isDefault: true,
    },
  });

  const categoryIds = new Map<string, string>();
  for (const name of categories) {
    const category = await prisma.category.create({
      data: {
        name,
        slug: categorySlugMap[name],
        description: `${name} sourced for industrial maintenance, fabrication, and heavy machinery operations.`,
        imageUrl: categoryImageMap[name],
      },
    });
    categoryIds.set(name, category.id);
  }

  for (const product of products) {
    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceInPaise: product.priceInPaise,
        imageUrl: productImageMap[product.slug],
        sku: `DMS-${product.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`,
        categoryId: categoryIds.get(product.category)!,
        inStock: true,
      },
    });
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const attendanceStatuses: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.HALF_DAY,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LEAVE,
    AttendanceStatus.PRESENT,
  ];

  for (const [index, employee] of employees.entries()) {
    const createdEmployee = await prisma.employee.create({ data: employee });

    const bonus = (index + 1) * 25000;
    const deductions = index * 10000;

    await prisma.salaryRecord.create({
      data: {
        employeeId: createdEmployee.id,
        month: previousMonth,
        baseSalary: employee.baseSalary,
        bonus,
        deductions,
        netPaid: employee.baseSalary + bonus - deductions,
        notes: "Processed with attendance-linked adjustments.",
      },
    });

    await prisma.salaryRecord.create({
      data: {
        employeeId: createdEmployee.id,
        month: thisMonth,
        baseSalary: employee.baseSalary,
        bonus: bonus + 5000,
        deductions,
        netPaid: employee.baseSalary + bonus + 5000 - deductions,
        notes: "Current cycle payroll for Delta Mill Stores.",
      },
    });

    for (let i = 0; i < 5; i += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      await prisma.attendanceRecord.create({
        data: {
          employeeId: createdEmployee.id,
          date,
          status: attendanceStatuses[(i + index) % attendanceStatuses.length],
          notes: i === 3 ? "Approved leave request." : "Marked by admin.",
        },
      });
    }
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
