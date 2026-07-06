import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

type OrderEmailData = {
  orderNumber: string;
  totalInPaise: number;
  user?: { email?: string | null; name?: string | null } | null;
  guestEmail?: string | null;
  items: Array<{
    productNameSnapshot?: string;
    quantity: number;
    unitPriceInPaise?: number;
    lineTotalInPaise?: number;
  }>;
};

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function createTransport(): Transporter {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const transporter = createTransport();
const FROM = process.env.SMTP_FROM ?? "Delta Mill Stores <noreply@deltamill.in>";
const isPreview = !process.env.SMTP_HOST;

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  if (isPreview) {
    console.log("[EMAIL PREVIEW]", { to, subject, html });
    return;
  }

  await transporter.sendMail({ from: FROM, to, subject, html });
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<void> {
  const recipientEmail = order.user?.email ?? order.guestEmail;
  if (!recipientEmail) return;

  const recipientName = order.user?.name ?? "Valued Customer";

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${item.productNameSnapshot ?? "Product"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${item.lineTotalInPaise != null ? formatRupees(item.lineTotalInPaise) : "-"}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1f2937">Order Confirmed — Delta Mill Stores</h2>
      <p>Hello ${recipientName},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been received and is being processed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px 12px;text-align:left">Product</th>
            <th style="padding:8px 12px;text-align:center">Qty</th>
            <th style="padding:8px 12px;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="font-size:16px"><strong>Order Total: ${formatRupees(order.totalInPaise)}</strong></p>
      <p style="color:#6b7280;font-size:13px">You will receive another email when your order ships.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">Delta Mill Stores — Industrial Hardware B2B</p>
    </div>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `Order Confirmed #${order.orderNumber} — Delta Mill Stores`,
    html,
  });
}

export async function sendOrderStatusEmail(
  order: OrderEmailData,
  newStatus: string,
): Promise<void> {
  const recipientEmail = order.user?.email ?? order.guestEmail;
  if (!recipientEmail) return;

  const recipientName = order.user?.name ?? "Valued Customer";

  const statusLabels: Record<string, string> = {
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  const statusLabel = statusLabels[newStatus] ?? newStatus;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1f2937">Order Update — Delta Mill Stores</h2>
      <p>Hello ${recipientName},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> status has been updated to <strong>${statusLabel}</strong>.</p>
      <p>Order Total: ${formatRupees(order.totalInPaise)}</p>
      <p style="color:#6b7280;font-size:13px">If you have any questions, please contact our support team.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">Delta Mill Stores — Industrial Hardware B2B</p>
    </div>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `Order Update #${order.orderNumber}: ${statusLabel} — Delta Mill Stores`,
    html,
  });
}
