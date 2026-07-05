/**
 * Throwaway fixture script for refund/cancel runtime verification.
 * Run: npx tsx scripts/verify-refund-fixtures.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "VerifyRefund123!";
const PREFIX = "verify-refund-" + Date.now();

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const customer = await prisma.user.create({
    data: {
      name: "Verify Customer",
      email: `${PREFIX}@customer.test`,
      passwordHash,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Verify Customer 2",
      email: `${PREFIX}-other@customer.test`,
      passwordHash,
    },
  });

  const superAdmin = await prisma.adminUser.create({
    data: {
      username: `${PREFIX}-super`,
      passwordHash,
      role: "SUPER_ADMIN",
      name: "Verify Super Admin",
    },
  });

  const manager = await prisma.adminUser.create({
    data: {
      username: `${PREFIX}-manager`,
      passwordHash,
      role: "MANAGER",
      name: "Verify Manager",
    },
  });

  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: `${PREFIX}-cat`,
        slug: `${PREFIX}-cat`,
        description: "Verify category",
      },
    });
  }

  const product = await prisma.product.create({
    data: {
      name: `${PREFIX}-product`,
      slug: `${PREFIX}-product`,
      description: "Verify product",
      priceInPaise: 1000,
      imageUrl: "https://example.com/img.jpg",
      categoryId: category.id,
    },
  });

  const shippingAddressJson = JSON.stringify({
    fullName: "Verify Customer",
    phone: "9999999999",
    line1: "123 Test St",
    city: "Mumbai",
    state: "MH",
    pincode: "400001",
  });

  async function createOrder(
    label: string,
    status: "PENDING" | "CONFIRMED" | "PROCESSING" | "DELIVERED",
    withPayment: boolean,
    totalInPaise = 50000,
  ) {
    const orderNumber = `${PREFIX}-${label}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        status,
        subtotalInPaise: totalInPaise,
        shippingInPaise: 0,
        taxInPaise: 0,
        totalInPaise,
        paymentStatus: withPayment ? "COMPLETED" : "PENDING",
        shippingAddressJson,
        confirmedAt: status !== "PENDING" ? new Date() : null,
        deliveredAt: status === "DELIVERED" ? new Date() : null,
        items: {
          create: {
            productId: product.id,
            productNameSnapshot: product.name,
            productSlugSnapshot: product.slug,
            unitPriceInPaise: totalInPaise,
            quantity: 1,
            lineTotalInPaise: totalInPaise,
          },
        },
        ...(withPayment
          ? {
              payments: {
                create: {
                  provider: "simulator",
                  amountInPaise: totalInPaise,
                  status: "COMPLETED",
                  providerPaymentId: `sim-${orderNumber}`,
                },
              },
            }
          : {}),
      },
      include: { payments: true },
    });
    return order;
  }

  const orderA = await createOrder("A", "PENDING", false);
  const orderB = await createOrder("B", "CONFIRMED", true);
  const orderC = await createOrder("C", "PROCESSING", true);
  const orderD = await createOrder("D", "DELIVERED", true);

  const fixtures = {
    prefix: PREFIX,
    password: PASSWORD,
    customer: { id: customer.id, email: customer.email },
    customer2: { id: customer2.id, email: customer2.email },
    superAdmin: { id: superAdmin.id, username: superAdmin.username },
    manager: { id: manager.id, username: manager.username },
    product: { id: product.id },
    orderA: { id: orderA.id, orderNumber: orderA.orderNumber, userId: orderA.userId, totalInPaise: orderA.totalInPaise },
    orderB: { id: orderB.id, orderNumber: orderB.orderNumber, userId: orderB.userId, totalInPaise: orderB.totalInPaise },
    orderC: { id: orderC.id, orderNumber: orderC.orderNumber, userId: orderC.userId, totalInPaise: orderC.totalInPaise },
    orderD: { id: orderD.id, orderNumber: orderD.orderNumber, userId: orderD.userId, totalInPaise: orderD.totalInPaise },
  };

  console.log(JSON.stringify(fixtures, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
