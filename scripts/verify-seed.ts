import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let allPass = true;

  const admin = await prisma.adminUser.findUnique({
    where: { username: "admin1" },
  });
  const adminPass =
    admin?.role === "SUPER_ADMIN" && admin?.email === "admin@deltamill.local";
  console.log(
    `Admin admin1 (SUPER_ADMIN, admin@deltamill.local): ${adminPass ? "PASS" : "FAIL"}`,
  );
  if (!adminPass) allPass = false;

  const demo = await prisma.user.findUnique({
    where: { email: "demo@deltamill.local" },
    include: { addresses: true },
  });
  const demoPass = Boolean(demo && demo.addresses.length >= 1);
  console.log(
    `Customer demo@deltamill.local with addresses: ${demoPass ? "PASS" : "FAIL"} (count=${demo?.addresses.length ?? 0})`,
  );
  if (!demoPass) allPass = false;

  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  const catalogPass = productCount >= 1 && categoryCount >= 1;
  console.log(
    `Products (${productCount}) and Categories (${categoryCount}): ${catalogPass ? "PASS" : "FAIL"}`,
  );
  if (!catalogPass) allPass = false;

  console.log(`\nOverall: ${allPass ? "PASS" : "FAIL"}`);
  process.exit(allPass ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
