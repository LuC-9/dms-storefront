"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminRole } from "@/lib/rbac";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/state-machine";
import { formatInr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { OrderTimeline } from "@/components/admin/order-timeline";
import { RefundDialog } from "@/components/admin/RefundDialog";
import { RefundHistoryPanel } from "@/components/admin/RefundHistoryPanel";
import { ExternalLink, Link as LinkIcon } from "lucide-react";

type AdminUserSummary = {
  id: string;
  username: string;
  name: string | null;
  role: AdminRole;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalInPaise: number;
  shippingInPaise: number;
  taxInPaise: number;
  totalInPaise: number;
  currency: string;
  user: { id: string; name: string | null; email: string | null; phone: string | null } | null;
  guestEmail: string | null;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    productNameSnapshot: string;
    productSlugSnapshot: string;
    productImageSnapshot?: string | null;
    unitPriceInPaise: number;
    quantity: number;
    lineTotalInPaise: number;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    status: PaymentStatus;
    amountInPaise: number;
    createdAt: string;
    providerPaymentId: string | null;
    errorMessage: string | null;
  }>;
  refunds: Array<{
    id: string;
    amountInPaise: number;
    type: "FULL" | "PARTIAL";
    status: "PENDING" | "PROCESSED" | "FAILED";
    initiatedBy: string;
    reason: string;
    createdAt: string;
  }>;
  notes: string | null;
  assignedAdmin: { id: string; name: string | null; username: string } | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  trackingUrl: string | null;
};

function getAllowedNextStatuses(current: OrderStatus, role: AdminRole): OrderStatus[] {
  if (role === "EMPLOYEE") return [];
  const transitions = Array.from(ORDER_STATUS_TRANSITIONS[current] ?? []);
  if (role === "MANAGER") {
    return transitions.filter((next) => !(current === "SHIPPED" && next === "CANCELLED"));
  }
  return transitions;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

export function AdminOrderDetail({
  orderId,
  role,
}: {
  orderId: string;
  role: AdminRole;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [selectedAdminId, setSelectedAdminId] = useState<string>("__KEEP__");
  const [trackingUrlDraft, setTrackingUrlDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundDialogDefaults, setRefundDialogDefaults] = useState<{ type: "FULL" | "PARTIAL"; cancelOrder: boolean }>({
    type: "FULL",
    cancelOrder: true,
  });

  const canManageAssignment = role === "SUPER_ADMIN" || role === "ADMIN";
  const canEditNotes = role === "SUPER_ADMIN" || role === "ADMIN";

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderResponse, usersResponse] = await Promise.all([
        fetch(`/api/admin/orders/${orderId}`, { cache: "no-store" }),
        canManageAssignment ? fetch("/api/admin/users", { cache: "no-store" }) : Promise.resolve(null),
      ]);

      const orderPayload = (await orderResponse.json()) as OrderDetail | { error?: { message?: string } };
      if (!orderResponse.ok) {
        throw new Error(extractErrorMessage(orderPayload, "Failed to load order."));
      }

      const orderData = orderPayload as OrderDetail;
      setOrder(orderData);
      setNoteDraft(orderData.notes ?? "");
      setTrackingUrlDraft(orderData.trackingUrl ?? "");
      setSelectedAdminId(orderData.assignedAdmin?.id ?? "__UNASSIGNED__");

      if (usersResponse) {
        const usersPayload = (await usersResponse.json()) as
          | AdminUserSummary[]
          | { items?: AdminUserSummary[]; error?: { message?: string } };
        if (usersResponse.ok) {
          if (Array.isArray(usersPayload)) {
            setAdminUsers(usersPayload);
          } else if (Array.isArray(usersPayload.items)) {
            setAdminUsers(usersPayload.items);
          }
        }
      }
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, canManageAssignment]);

  const transitionOptions = useMemo(() => {
    if (!order) return [];
    return getAllowedNextStatuses(order.status, role);
  }, [order, role]);

  const updateStatus = async () => {
    if (!order || !selectedStatus) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          notes: noteDraft,
          ...(selectedStatus === "SHIPPED" && trackingUrlDraft.trim()
            ? { trackingUrl: trackingUrlDraft.trim() }
            : {}),
        }),
      });
      const payload = (await response.json()) as { order?: OrderDetail; error?: { message?: string } };
      if (!response.ok || !payload.order) {
        throw new Error(extractErrorMessage(payload, "Could not update order status."));
      }
      setOrder(payload.order);
      setNoteDraft(payload.order.notes ?? "");
      setTrackingUrlDraft(payload.order.trackingUrl ?? "");
      setSelectedStatus("");
      setSuccessToast(`Order moved to ${payload.order.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order status.");
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!order) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: order.status, notes: noteDraft }),
      });
      const payload = (await response.json()) as { order?: OrderDetail; error?: { message?: string } };
      if (!response.ok || !payload.order) {
        throw new Error(extractErrorMessage(payload, "Could not save notes."));
      }
      setOrder(payload.order);
      setSuccessToast("Notes saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save notes.");
    } finally {
      setSaving(false);
    }
  };

  const reassignOrder = async (nextAdminId: string) => {
    if (!order) return;
    const assignedAdminId = nextAdminId === "__UNASSIGNED__" ? null : nextAdminId;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAdminId }),
      });
      const payload = (await response.json()) as { order?: OrderDetail; error?: { message?: string } };
      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, "Could not reassign order."));
      }
      if (payload.order) {
        setOrder(payload.order);
      } else {
        await loadOrder();
      }
      setSelectedAdminId(nextAdminId);
      setSuccessToast("Order assignment updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reassign order.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-red-600">{error ?? "Order not found."}</p>;
  }

  const latestPayment = order.payments[0] ?? null;
  const refundedInPaise = order.refunds.reduce((total, refund) => {
    if (refund.status === "FAILED") return total;
    return total + refund.amountInPaise;
  }, 0);
  const remainingRefundableInPaise = Math.max(0, order.totalInPaise - refundedInPaise);
  const hasCompletedPayment = order.payments.some((payment) => payment.status === "COMPLETED");

  return (
    <div className="space-y-6">
      {successToast ? (
        <div className="sticky top-2 z-10 flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <span>{successToast}</span>
          <button type="button" onClick={() => setSuccessToast(null)} className="font-medium">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link href="/admin/orders" className="text-sm text-steel-600 hover:underline">
            ← Back to orders
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {transitionOptions.length > 0 ? (
            <>
            <Select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)}>
              <option value="">Update status</option>
              {transitionOptions.map((next) => (
                <option key={next} value={next}>
                  {next}
                </option>
              ))}
            </Select>
            <Button onClick={() => void updateStatus()} disabled={!selectedStatus || saving}>
              Apply
            </Button>
            {selectedStatus === "SHIPPED" ? (
              <Input
                value={trackingUrlDraft}
                onChange={(event) => setTrackingUrlDraft(event.target.value)}
                placeholder="Paste courier tracking link (e.g., https://www.bluedart.com/tracking/...)"
                className="w-full min-w-[320px]"
              />
            ) : null}
            </>
          ) : null}
          {order.status !== "DELIVERED" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setRefundDialogDefaults({ type: "FULL", cancelOrder: true });
                  setRefundDialogOpen(true);
                }}
                disabled={remainingRefundableInPaise <= 0}
              >
                Cancel &amp; Refund
              </Button>
            ) : null}
          {hasCompletedPayment && remainingRefundableInPaise > 0 ? (
            <Button
              variant="outline"
              onClick={() => {
                setRefundDialogDefaults({ type: "PARTIAL", cancelOrder: false });
                setRefundDialogOpen(true);
              }}
            >
              Issue Refund
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Unit price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={`${item.productSlugSnapshot}-${item.productNameSnapshot}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-steel-100" />
                          <div>
                            <p className="font-medium">{item.productNameSnapshot}</p>
                            <p className="text-xs text-steel-500">/{item.productSlugSnapshot}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatInr(item.unitPriceInPaise)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatInr(item.lineTotalInPaise)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 space-y-1 text-sm">
                <p>Subtotal: {formatInr(order.subtotalInPaise)}</p>
                <p>Shipping: {formatInr(order.shippingInPaise)}</p>
                <p>Tax: {formatInr(order.taxInPaise)}</p>
                <p className="text-base font-semibold">Total: {formatInr(order.totalInPaise)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                status={order.status}
                timestamps={{
                  PENDING: order.createdAt,
                  CONFIRMED: order.confirmedAt,
                  SHIPPED: order.shippedAt,
                  DELIVERED: order.deliveredAt,
                  CANCELLED: order.cancelledAt,
                }}
              />
              {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
                <div className="mt-4 rounded-md border border-steel-300 bg-blueprint-100/50 p-3 text-sm">
                  {order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Open courier tracking
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="text-steel-600">Tracking details not added yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <RefundHistoryPanel refunds={order.refunds} />

          <Card>
            <CardHeader>
              <CardTitle>Internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Add operational notes for this order"
                disabled={!canEditNotes}
              />
              <Button onClick={() => void saveNotes()} disabled={!canEditNotes || saving}>
                Save notes
              </Button>
              {!canEditNotes ? (
                <p className="text-xs text-steel-500">Only ADMIN and SUPER_ADMIN can edit notes.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <PaymentStatusBadge status={order.paymentStatus} />
              <p>Provider: {latestPayment?.provider ?? "—"}</p>
              <p>Payment ID: {latestPayment?.providerPaymentId ?? "—"}</p>
              <p>Status: {latestPayment?.status ?? "—"}</p>
              <p>Amount: {latestPayment ? formatInr(latestPayment.amountInPaise) : "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.payments.length === 0 ? (
                <p className="text-steel-500">No payment attempts yet.</p>
              ) : (
                order.payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="space-y-1 border-b border-steel-100 pb-2 last:border-b-0 last:pb-0">
                    <p className="font-medium">Transaction: {payment.providerPaymentId ?? "—"}</p>
                    <p>Amount: {formatInr(payment.amountInPaise)}</p>
                    <p>Status: {payment.status}</p>
                    <p>Error: {payment.errorMessage ?? "—"}</p>
                    <p className="text-xs text-steel-500">{formatDateTime(payment.createdAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Name: {order.user?.name ?? order.shippingAddress.fullName}</p>
              <p>Email: {order.user?.email ?? order.guestEmail ?? "—"}</p>
              <p>Phone: {order.user?.phone ?? order.shippingAddress.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{order.assignedAdmin ? order.assignedAdmin.name || order.assignedAdmin.username : "Unassigned"}</p>
              {canManageAssignment ? (
                <Select
                  value={selectedAdminId}
                  onChange={(event) => void reassignOrder(event.target.value)}
                  disabled={saving}
                >
                  <option value="__UNASSIGNED__">Unassigned</option>
                  {adminUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {(user.name || user.username) + ` (${user.role})`}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="text-xs text-steel-500">Read-only for your role.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-steel-500">Created: {formatDateTime(order.createdAt)}</p>

      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        orderId={order.id}
        remainingRefundableInPaise={remainingRefundableInPaise}
        defaultType={refundDialogDefaults.type}
        defaultCancelOrder={refundDialogDefaults.cancelOrder}
        onSuccess={async () => {
          await loadOrder();
        }}
      />
    </div>
  );
}
