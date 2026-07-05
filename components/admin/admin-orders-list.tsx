"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRole } from "@/lib/rbac";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/state-machine";
import { formatInr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { ClipboardList, ExternalLink } from "lucide-react";

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

type OrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  itemCount: number;
  totalInPaise: number;
  refundedInPaise: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingUrl?: string | null;
  createdAt: string;
  assignedAdmin?: { id: string } | null;
  assignedAdminId?: string | null;
};

type OrdersApiResponse = {
  items: OrderListItem[];
  nextCursor: string | null;
};

function getAllowedNextStatuses(current: OrderStatus, role: AdminRole): OrderStatus[] {
  if (role === "EMPLOYEE") return [];
  const transitions = Array.from(ORDER_STATUS_TRANSITIONS[current] ?? []);
  if (role === "MANAGER") {
    return transitions.filter((next) => !(current === "SHIPPED" && next === "CANCELLED"));
  }
  return transitions;
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return fallback;
}

export function AdminOrdersList({
  role,
  assignedToMe = false,
  userId,
  title = "Orders",
  showStatusActions = true,
}: {
  role: AdminRole;
  assignedToMe?: boolean;
  userId?: string;
  title?: string;
  showStatusActions?: boolean;
}) {
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([]);
  const [rows, setRows] = useState<OrderListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canUpdateStatus = showStatusActions && role !== "EMPLOYEE";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (appliedStatus) params.set("status", appliedStatus);
    if (appliedQuery) params.set("q", appliedQuery);
    params.set("limit", "20");
    if (cursor) params.set("cursor", cursor);
    if (assignedToMe) params.set("assignedTo", "me");
    return params.toString();
  }, [appliedQuery, appliedStatus, assignedToMe, cursor]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders?${queryString}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as OrdersApiResponse | { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, "Failed to load orders."));
      }

      const data = payload as OrdersApiResponse;
      let filteredItems = data.items;
      if (assignedToMe && userId) {
        const hasAssignmentFields = filteredItems.some(
          (item) => item.assignedAdmin !== undefined || item.assignedAdminId !== undefined,
        );
        if (hasAssignmentFields) {
          filteredItems = filteredItems.filter(
            (item) => item.assignedAdmin?.id === userId || item.assignedAdminId === userId,
          );
        }
      }

      setRows(filteredItems);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setRows([]);
      setNextCursor(null);
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [assignedToMe, queryString, userId]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const applyFilters = () => {
    setCursor(null);
    setCursorHistory([]);
    setAppliedStatus(status);
    setAppliedQuery(searchInput.trim());
  };

  const goToNextPage = () => {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, cursor]);
    setCursor(nextCursor);
  };

  const goToPrevPage = () => {
    if (cursorHistory.length === 0) return;
    const previous = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((prev) => prev.slice(0, -1));
    setCursor(previous ?? null);
  };

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setError(null);
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const payload = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      setError(extractErrorMessage(payload, "Unable to update order status."));
      return;
    }
    await fetchOrders();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-[200px_1fr_auto]">
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Order number or customer email"
          />
          <Button type="button" onClick={applyFilters}>
            Apply
          </Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-steel-600">
              <ClipboardList className="h-8 w-8 text-steel-400" />
              <p className="text-lg font-medium text-steel-700">No orders yet</p>
              <p className="text-sm">Try adjusting your filters and search query.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total (₹)</TableHead>
                  <TableHead>Refunded (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Tracking</TableHead>
                  {showStatusActions ? <TableHead>Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link className="font-medium text-primary hover:underline" href={`/admin/orders/${order.id}`}>
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p>{order.customerName || "Guest"}</p>
                      <p className="text-xs text-steel-500">{order.customerEmail || "—"}</p>
                    </TableCell>
                    <TableCell>{order.itemCount}</TableCell>
                    <TableCell>{formatInr(order.totalInPaise)}</TableCell>
                    <TableCell>{formatInr(order.refundedInPaise ?? 0)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell>{formatCreatedAt(order.createdAt)}</TableCell>
                    <TableCell>
                      {order.trackingUrl ? (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Link <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-steel-500">—</span>
                      )}
                    </TableCell>
                    {showStatusActions ? (
                      <TableCell className="space-y-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>View</Link>
                        </Button>
                        {canUpdateStatus ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <details>
                                <summary className="cursor-pointer rounded-md border border-steel-300 px-2 py-1 text-xs">
                                  Update status
                                </summary>
                                <DropdownMenuContent>
                                  {getAllowedNextStatuses(order.status, role).length === 0 ? (
                                    <p className="px-2 py-1 text-xs text-steel-500">No allowed updates</p>
                                  ) : (
                                    getAllowedNextStatuses(order.status, role).map((nextStatus) => (
                                      <DropdownMenuItem
                                        key={nextStatus}
                                        onClick={() => void updateOrderStatus(order.id, nextStatus)}
                                      >
                                        {nextStatus}
                                      </DropdownMenuItem>
                                    ))
                                  )}
                                </DropdownMenuContent>
                              </details>
                            </DropdownMenuTrigger>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={goToPrevPage} disabled={cursorHistory.length === 0 || loading}>
          Previous
        </Button>
        <Button onClick={goToNextPage} disabled={!nextCursor || loading}>
          Next
        </Button>
      </div>
    </div>
  );
}
