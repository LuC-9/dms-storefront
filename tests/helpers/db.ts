import { PrismaClient } from "@prisma/client";

export const TEST_DATABASE_URL = "file:./prisma/test.db";

const globalForTests = globalThis as unknown as {
  prismaTestClient?: PrismaClient;
};

export const testDb =
  globalForTests.prismaTestClient ??
  new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL,
      },
    },
  });

if (!globalForTests.prismaTestClient) {
  globalForTests.prismaTestClient = testDb;
}

export async function clearDatabase() {
  await testDb.refund.deleteMany();
  await testDb.payment.deleteMany();
  await testDb.orderItem.deleteMany();
  await testDb.order.deleteMany();
  await testDb.cartItem.deleteMany();
  await testDb.cart.deleteMany();
  await testDb.address.deleteMany();
  await testDb.passwordResetToken.deleteMany();
  await testDb.user.deleteMany();
  await testDb.adminUser.deleteMany();
  await testDb.stockNotification.deleteMany();
  await testDb.product.deleteMany();
  await testDb.category.deleteMany();
  await testDb.salaryRecord.deleteMany();
  await testDb.attendanceRecord.deleteMany();
  await testDb.employee.deleteMany();
}

export async function disconnectTestDb() {
  await testDb.$disconnect();
}
