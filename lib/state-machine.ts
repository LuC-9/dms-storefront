import type { AdminRole, Order, OrderStatus } from "@prisma/client";

export type OrderTransitionRole = AdminRole | "customer";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  PENDING: new Set<OrderStatus>(["CONFIRMED", "CANCELLED"]),
  CONFIRMED: new Set<OrderStatus>(["PROCESSING", "CANCELLED"]),
  PROCESSING: new Set<OrderStatus>(["SHIPPED", "CANCELLED"]),
  SHIPPED: new Set<OrderStatus>(["DELIVERED"]),
  DELIVERED: new Set<OrderStatus>(),
  CANCELLED: new Set<OrderStatus>(),
};

export class OrderStateError extends Error {
  readonly code = "INVALID_ORDER_TRANSITION";
  readonly current: OrderStatus;
  readonly next: OrderStatus;
  readonly role: OrderTransitionRole;

  constructor(current: OrderStatus, next: OrderStatus, role: OrderTransitionRole) {
    super(`Cannot transition order from ${current} to ${next} as ${role}`);
    this.current = current;
    this.next = next;
    this.role = role;
    this.name = "OrderStateError";
  }
}

export function canTransition(current: OrderStatus, next: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[current].has(next);
}

export const ROLE_PERMITTED_TRANSITIONS: Record<
  OrderTransitionRole,
  (current: OrderStatus, next: OrderStatus) => boolean
> = {
  SUPER_ADMIN: (current, next) => canTransition(current, next),
  ADMIN: (current, next) => canTransition(current, next),
  MANAGER: (current, next) => {
    if (current === "SHIPPED" && next === "CANCELLED") {
      return false;
    }
    return canTransition(current, next);
  },
  EMPLOYEE: () => false,
  customer: (current, next) => ["PENDING", "CONFIRMED"].includes(current) && next === "CANCELLED",
};

function roleCanTransition(
  current: OrderStatus,
  next: OrderStatus,
  role: OrderTransitionRole,
): boolean {
  return ROLE_PERMITTED_TRANSITIONS[role](current, next);
}

export function assertTransition(
  current: OrderStatus,
  next: OrderStatus,
  role: OrderTransitionRole,
): void {
  if (!canTransition(current, next) || !roleCanTransition(current, next, role)) {
    throw new OrderStateError(current, next, role);
  }
}

export function applyTransitionTimestamps(
  order: Pick<Order, "status">,
  next: OrderStatus,
): Partial<Order> {
  const now = new Date();

  switch (next) {
    case "CONFIRMED":
      return { confirmedAt: now };
    case "SHIPPED":
      return { shippedAt: now };
    case "DELIVERED":
      return { deliveredAt: now };
    case "CANCELLED":
      return { cancelledAt: now };
    default:
      return {};
  }
}
