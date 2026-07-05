import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { requireAdminSession, requireCustomerSession } from "@/lib/rbac";

function makeSession(overrides: Session["user"]): Session {
  return {
    expires: "2099-01-01T00:00:00.000Z",
    user: overrides,
  } as Session;
}

describe("rbac session guards", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
  });

  it("allows SUPER_ADMIN in admin guard and blocks customer guard", async () => {
    const adminSession = makeSession({
      id: "admin_1",
      userType: "admin",
      role: "SUPER_ADMIN",
      email: "admin@example.com",
      name: "Super Admin",
    });
    getServerSessionMock.mockResolvedValue(adminSession);

    await expect(requireAdminSession()).resolves.toEqual(adminSession);
    await expect(requireAdminSession("SUPER_ADMIN")).resolves.toEqual(adminSession);
    await expect(requireCustomerSession()).resolves.toBeNull();
  });

  it("allows customer guard and blocks admin guard", async () => {
    const customerSession = makeSession({
      id: "customer_1",
      userType: "customer",
      role: "customer",
      email: "customer@example.com",
      name: "Customer User",
    });
    getServerSessionMock.mockResolvedValue(customerSession);

    await expect(requireCustomerSession()).resolves.toEqual(customerSession);
    await expect(requireAdminSession()).resolves.toBeNull();
  });

  it("applies MANAGER role filtering", async () => {
    const managerSession = makeSession({
      id: "admin_2",
      userType: "admin",
      role: "MANAGER",
      email: "manager@example.com",
      name: "Manager User",
    });
    getServerSessionMock.mockResolvedValue(managerSession);

    await expect(requireAdminSession()).resolves.toEqual(managerSession);
    await expect(requireAdminSession("MANAGER", "ADMIN")).resolves.toEqual(managerSession);
    await expect(requireAdminSession("SUPER_ADMIN")).resolves.toBeNull();
  });

  it("rejects null session for both guards", async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(requireCustomerSession()).resolves.toBeNull();
    await expect(requireAdminSession()).resolves.toBeNull();
  });
});
