import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/utils";
import { PrintButton } from "@/components/storefront/print-button";

type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  gstin?: string | null;
};

const COMPANY_NAME = "Delta Mills Store";
const COMPANY_ADDRESS = "78/45 Latouche Road, Anwar Ganj, Kanpur - 208001";
const COMPANY_GSTIN = "09AAAAA0000A1Z5";
const DEFAULT_HSN = "8481";

function gstLabel(state: string) {
  const isIntraState = state.trim().toLowerCase() === "uttar pradesh";
  return isIntraState ? "intra" as const : "inter" as const;
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { product: true } },
      user: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  let shippingAddress: ShippingAddress;
  try {
    shippingAddress = JSON.parse(order.shippingAddressJson) as ShippingAddress;
  } catch {
    shippingAddress = {
      fullName: order.user?.name ?? order.guestEmail ?? "Customer",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
    };
  }

  const gstType = gstLabel(shippingAddress.state);
  const subtotal = order.subtotalInPaise;
  const shipping = order.shippingInPaise;
  const taxableAmount = subtotal + shipping;
  const gstAmount = order.taxInPaise;
  const grandTotal = order.totalInPaise;

  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const latestPayment = order.payments[0];
  const paymentStatus = latestPayment?.status ?? order.paymentStatus;

  return (
    <div className="min-h-screen bg-white">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style>{`@media print { body { margin: 0; } .no-print { display: none !important; } }`}</style>

      {/* Toolbar – hidden on print */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-steel-300 bg-alloy-white px-6 py-3">
        <Link href={`/account/orders/${order.orderNumber}`} className="font-mono text-xs uppercase text-steel-500 underline-offset-2 hover:underline">
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      {/* Invoice document */}
      <div className="mx-auto max-w-[800px] bg-white p-8 print:p-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-forge-950 pb-6">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-[0.06em] text-forge-950">
              {COMPANY_NAME}
            </h1>
            <p className="mt-1 text-sm text-steel-600">{COMPANY_ADDRESS}</p>
            <p className="mt-0.5 font-mono text-xs text-steel-500">GSTIN: {COMPANY_GSTIN}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold uppercase tracking-[0.08em] text-iron-800">Tax Invoice</p>
            <p className="mt-1 font-mono text-sm font-semibold text-forge-950">{order.orderNumber}</p>
            <p className="font-mono text-xs text-steel-500">{invoiceDate}</p>
            <span
              className={`mt-2 inline-block px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] ${
                paymentStatus === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : paymentStatus === "REFUNDED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {paymentStatus}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-steel-500">Bill To</p>
            <p className="mt-1 font-semibold text-iron-800">{shippingAddress.fullName}</p>
            <p className="text-sm text-steel-600">
              {shippingAddress.line1}
              {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}
            </p>
            <p className="text-sm text-steel-600">
              {shippingAddress.city}
              {shippingAddress.state ? `, ${shippingAddress.state}` : ""}
              {shippingAddress.pincode ? ` - ${shippingAddress.pincode}` : ""}
            </p>
            {shippingAddress.phone && (
              <p className="text-sm text-steel-600">{shippingAddress.phone}</p>
            )}
            {order.user?.email ?? order.guestEmail ? (
              <p className="text-sm text-steel-600">{order.user?.email ?? order.guestEmail}</p>
            ) : null}
            {shippingAddress.gstin && (
              <p className="mt-1 font-mono text-xs text-steel-500">GSTIN: {shippingAddress.gstin}</p>
            )}
            {order.user?.gstin && !shippingAddress.gstin && (
              <p className="mt-1 font-mono text-xs text-steel-500">GSTIN: {order.user.gstin}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-steel-500">Invoice Details</p>
            <div className="mt-1 space-y-1 text-sm text-steel-600">
              <p>Invoice No: <span className="font-mono font-semibold text-iron-800">{order.orderNumber}</span></p>
              <p>Date: <span className="font-semibold text-iron-800">{invoiceDate}</span></p>
              <p>Order Status: <span className="font-semibold text-iron-800">{order.status}</span></p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-8">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-forge-950 text-alloy-white">
                <th className="px-3 py-2 text-left font-display text-xs font-semibold uppercase tracking-[0.06em]">Product</th>
                <th className="px-3 py-2 text-center font-display text-xs font-semibold uppercase tracking-[0.06em]">HSN</th>
                <th className="px-3 py-2 text-center font-display text-xs font-semibold uppercase tracking-[0.06em]">Qty</th>
                <th className="px-3 py-2 text-right font-display text-xs font-semibold uppercase tracking-[0.06em]">Unit Price</th>
                <th className="px-3 py-2 text-right font-display text-xs font-semibold uppercase tracking-[0.06em]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-blueprint-100/30"}>
                  <td className="border-b border-steel-200 px-3 py-2 font-medium text-iron-800">
                    {item.productNameSnapshot}
                    {item.product.sku && (
                      <span className="ml-2 font-mono text-[0.65rem] text-steel-500">({item.product.sku})</span>
                    )}
                  </td>
                  <td className="border-b border-steel-200 px-3 py-2 text-center font-mono text-xs text-steel-500">
                    {item.product.hsn ?? DEFAULT_HSN}
                  </td>
                  <td className="border-b border-steel-200 px-3 py-2 text-center">{item.quantity}</td>
                  <td className="border-b border-steel-200 px-3 py-2 text-right font-mono">
                    {formatInr(item.unitPriceInPaise)}
                  </td>
                  <td className="border-b border-steel-200 px-3 py-2 text-right font-mono font-semibold">
                    {formatInr(item.lineTotalInPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-steel-600">Subtotal</span>
              <span className="font-mono">{formatInr(subtotal)}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between">
                <span className="text-steel-600">Shipping</span>
                <span className="font-mono">{formatInr(shipping)}</span>
              </div>
            )}
            {gstAmount > 0 && (
              <>
                {gstType === "intra" ? (
                  <>
                    <div className="flex justify-between text-steel-600">
                      <span>CGST @ 9%</span>
                      <span className="font-mono">{formatInr(Math.round(gstAmount / 2))}</span>
                    </div>
                    <div className="flex justify-between text-steel-600">
                      <span>SGST @ 9%</span>
                      <span className="font-mono">{formatInr(Math.round(gstAmount / 2))}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-steel-600">
                    <span>IGST @ 18%</span>
                    <span className="font-mono">{formatInr(gstAmount)}</span>
                  </div>
                )}
              </>
            )}
            {gstAmount === 0 && taxableAmount > 0 && (
              <div className="flex justify-between text-steel-600">
                <span>{gstType === "intra" ? "GST (incl.)" : "GST"}</span>
                <span className="font-mono text-xs">—</span>
              </div>
            )}
            <div className="flex justify-between border-t border-forge-950 pt-2 font-bold">
              <span className="font-display text-base uppercase tracking-[0.04em]">Grand Total</span>
              <span className="font-mono text-base">{formatInr(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-steel-300 pt-4">
          <p className="text-center font-mono text-[0.65rem] text-steel-500 uppercase tracking-[0.08em]">
            This is a computer-generated invoice and does not require a signature.
          </p>
          <p className="mt-1 text-center font-mono text-[0.6rem] text-steel-400">
            {COMPANY_NAME} · {COMPANY_ADDRESS} · GSTIN: {COMPANY_GSTIN}
          </p>
        </div>
      </div>
    </div>
  );
}
