import { prisma } from "@/lib/prisma";
import { parseOrderAddress } from "@/lib/orders";

export async function getAdminOrderDetailsById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      refunds: {
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  const assignedAdmin = order.assignedAdminId
    ? await prisma.adminUser.findUnique({
        where: { id: order.assignedAdminId },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
        },
      })
    : null;

  return {
    ...order,
    assignedAdmin,
    shippingAddress: parseOrderAddress(order),
    timestamps: {
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    },
  };
}
