import { resend } from "./resend.js";

const FROM = "Resend <onboarding@resend.dev>";

const COLORS = {
  primary: "#c0392b",
  text: "#1a1a1a",
  muted: "#666666",
  footer: "#999999",
  cardBg: "#f9f9f9",
  cardBorder: "#e5e5e5",
  white: "#ffffff",
} as const;

const FONTS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:${FONTS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="background-color:${COLORS.primary};padding:24px 40px;">
  <h1 style="margin:0;font-size:20px;font-weight:700;color:${COLORS.white};letter-spacing:0.5px;">ECOMMERCE</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;border-top:1px solid ${COLORS.cardBorder};">
  <p style="margin:0;font-size:12px;color:${COLORS.footer};text-align:center;">
    This is an automated notification. Please do not reply to this email.<br/>
    &copy; ${new Date().getFullYear()} Ecommerce. All rights reserved.
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:${COLORS.text};">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLORS.text};">${text}</p>`;
}

function mutedParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${COLORS.muted};">${text}</p>`;
}

function detailsCard(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:10px 16px;font-size:13px;font-weight:600;color:${COLORS.muted};white-space:nowrap;">${label}</td>
      <td style="padding:10px 16px;font-size:13px;color:${COLORS.text};">${value}</td>
    </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.cardBg};border:1px solid ${COLORS.cardBorder};border-radius:6px;margin-bottom:16px;">
  ${cells}
</table>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr>
    <td style="background-color:${COLORS.primary};border-radius:6px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:${COLORS.white};text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "#e67e22",
  confirmed: "#2980b9",
  shipped: "#8e44ad",
  delivered: "#27ae60",
  cancelled: "#c0392b",
};

// ─── Product Rejected ────────────────────────────────────────────────────────

export async function sendProductRejectedEmail({
  to,
  productName,
  reason,
}: {
  to: string;
  productName: string;
  reason: string;
}) {
  const html = wrapper(`
    ${heading("Product Rejected")}
    ${paragraph("Hi there,")}
    ${paragraph(`Your product <strong>${productName}</strong> has been reviewed and could not be approved.`)}
    ${detailsCard([
      ["Product", productName],
      ["Status", "Rejected"],
      ["Reason", reason],
    ])}
    ${mutedParagraph("Please review the feedback above and update your product before resubmitting.")}
    ${ctaButton("http://localhost:5173/seller/products", "View Products")}
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your product "${productName}" has been rejected`,
    html,
  });

  if (error) console.error("Failed to send product rejected email:", error.message);
}

// ─── Product Approved ────────────────────────────────────────────────────────

export async function sendProductApprovedEmail({
  to,
  productName,
}: {
  to: string;
  productName: string;
}) {
  const html = wrapper(`
    ${heading("Product Approved")}
    ${paragraph("Hi there,")}
    ${paragraph(`Great news! Your product <strong>${productName}</strong> has been approved and is now live on the marketplace.`)}
    ${detailsCard([
      ["Product", productName],
      ["Status", "Approved"],
    ])}
    ${ctaButton("http://localhost:5173/seller/products", "View Products")}
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your product "${productName}" has been approved`,
    html,
  });

  if (error) console.error("Failed to send product approved email:", error.message);
}

// ─── Order Status Changed ────────────────────────────────────────────────────

export async function sendOrderStatusEmail({
  to,
  buyerName,
  orderId,
  status,
}: {
  to: string;
  buyerName: string;
  orderId: string;
  status: string;
}) {
  const label = ORDER_STATUS_LABELS[status] || status;
  const color = ORDER_STATUS_COLORS[status] || COLORS.text;
  const shortId = orderId.slice(-8).toUpperCase();

  const html = wrapper(`
    ${heading("Order Status Updated")}
    ${paragraph(`Hi ${buyerName},`)}
    ${paragraph("Your order status has been updated.")}
    ${detailsCard([
      ["Order", `#${shortId}`],
      ["Status", `<span style="color:${color};font-weight:600;">${label}</span>`],
    ])}
    ${status === "shipped" ? paragraph("Your order is on its way! You can track it from your orders page.") : ""}
    ${status === "delivered" ? paragraph("Your order has been delivered. We hope you enjoy your purchase!") : ""}
    ${status === "cancelled" ? mutedParagraph("If you have any questions, please contact support.") : ""}
    ${ctaButton(`http://localhost:5173/order-confirmation/${orderId}`, "View Order")}
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Order #${shortId} — ${label}`,
    html,
  });

  if (error) console.error("Failed to send order status email:", error.message);
}

// ─── Seller Approved ─────────────────────────────────────────────────────────

export async function sendSellerApprovedEmail({
  to,
  sellerName,
}: {
  to: string;
  sellerName: string;
}) {
  const html = wrapper(`
    ${heading("Seller Account Approved")}
    ${paragraph(`Hi ${sellerName},`)}
    ${paragraph("Your seller account has been approved! You can now start listing products on the marketplace.")}
    ${detailsCard([["Status", "Approved"]])}
    ${ctaButton("http://localhost:5173/seller/products", "Start Selling")}
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Your seller account has been approved",
    html,
  });

  if (error) console.error("Failed to send seller approved email:", error.message);
}

// ─── Seller Rejected / Revoked ───────────────────────────────────────────────

export async function sendSellerRejectedEmail({
  to,
  sellerName,
  reason,
}: {
  to: string;
  sellerName: string;
  reason?: string;
}) {
  const reasonRow: [string, string][] = reason ? [["Reason", reason]] : [];

  const html = wrapper(`
    ${heading("Seller Application Update")}
    ${paragraph(`Hi ${sellerName},`)}
    ${paragraph("We regret to inform you that your seller application could not be approved at this time.")}
    ${detailsCard([["Status", "Not Approved"], ...reasonRow])}
    ${mutedParagraph("If you believe this was a mistake, please contact our support team.")}
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Your seller application has been declined",
    html,
  });

  if (error) console.error("Failed to send seller rejected email:", error.message);
}

// ─── User Banned ─────────────────────────────────────────────────────────────

export async function sendUserBannedEmail({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  const html = wrapper(`
    ${heading("Account Suspended")}
    ${paragraph(`Hi ${userName},`)}
    ${paragraph("Your account has been suspended by an administrator. You will no longer be able to access the platform.")}
    ${detailsCard([["Status", "Suspended"]])}
    ${mutedParagraph("If you believe this was done in error, please contact our support team.")}
  `);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Your account has been suspended",
    html,
  });

  if (error) console.error("Failed to send user banned email:", error.message);
}
