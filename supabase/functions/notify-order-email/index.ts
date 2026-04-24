import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";
import nodemailer from "nodemailer";

type OrderNotificationPayload = {
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  subtotal: number | string;
};

const jsonHeaders = {
  "Content-Type": "application/json",
};

const requiredFields: Array<keyof OrderNotificationPayload> = [
  "order_number",
  "customer_name",
  "phone",
  "city",
  "payment_method",
  "payment_status",
  "order_status",
  "subtotal",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyValue(value: unknown): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" && value.trim().length > 0;
}

function getMissingFields(payload: Partial<OrderNotificationPayload>): string[] {
  return requiredFields.filter((field) => !isNonEmptyValue(payload[field]));
}

function formatSubtotal(subtotal: number | string): string {
  const numericSubtotal =
    typeof subtotal === "number" ? subtotal : Number.parseFloat(subtotal);

  if (Number.isFinite(numericSubtotal)) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericSubtotal);
  }

  return String(subtotal);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return Response.json(
      {
        success: false,
        error: "Method not allowed. Use POST.",
      },
      {
        status: 405,
        headers: {
          ...corsHeaders,
          ...jsonHeaders,
          Allow: "POST",
        },
      },
    );
  }

  let payload: Partial<OrderNotificationPayload>;

  try {
    const body = await request.json();

    if (!isRecord(body)) {
      throw new Error("Request body must be a JSON object.");
    }

    payload = body as Partial<OrderNotificationPayload>;
  } catch {
    return Response.json(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      {
        status: 400,
        headers: {
          ...corsHeaders,
          ...jsonHeaders,
        },
      },
    );
  }

  const missingFields = getMissingFields(payload);

  if (missingFields.length > 0) {
    return Response.json(
      {
        success: false,
        error: "Missing required order fields.",
        missing_fields: missingFields,
      },
      {
        status: 400,
        headers: {
          ...corsHeaders,
          ...jsonHeaders,
        },
      },
    );
  }

  try {
    const smtpHost = getEnv("GMAIL_SMTP_HOST");
    const smtpPort = Number.parseInt(getEnv("GMAIL_SMTP_PORT"), 10);
    const smtpUser = getEnv("GMAIL_SMTP_USER");
    const smtpPass = getEnv("GMAIL_SMTP_PASS");
    const orderNotifyTo = getEnv("ORDER_NOTIFY_TO");

    if (!Number.isFinite(smtpPort) || smtpPort !== 465) {
      throw new Error(
        "GMAIL_SMTP_PORT must be set to 465 for secure Gmail SMTP.",
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subtotal = formatSubtotal(payload.subtotal!);
    const htmlRows = [
      ["Order Number", escapeHtml(payload.order_number!)],
      ["Customer Name", escapeHtml(payload.customer_name!)],
      ["Phone", escapeHtml(payload.phone!)],
      ["City", escapeHtml(payload.city!)],
      ["Payment Method", escapeHtml(payload.payment_method!)],
      ["Payment Status", escapeHtml(payload.payment_status!)],
      ["Order Status", escapeHtml(payload.order_status!)],
      ["Subtotal", escapeHtml(subtotal)],
    ]
      .map(
        ([label, value]) =>
          `<tr><td><strong>${label}</strong></td><td>${value}</td></tr>`,
      )
      .join("");
    const subject = `New Order Received - ${payload.order_number}`;
    const text = [
      "A new order has been placed.",
      "",
      `Order Number: ${payload.order_number}`,
      `Customer Name: ${payload.customer_name}`,
      `Phone: ${payload.phone}`,
      `City: ${payload.city}`,
      `Payment Method: ${payload.payment_method}`,
      `Payment Status: ${payload.payment_status}`,
      `Order Status: ${payload.order_status}`,
      `Subtotal: ${subtotal}`,
    ].join("\n");

    const html = `
      <h2>New Order Received</h2>
      <p>A new order has been placed.</p>
      <table cellpadding="6" cellspacing="0" border="0">
        ${htmlRows}
      </table>
    `;

    const info = await transporter.sendMail({
      from: smtpUser,
      to: orderNotifyTo,
      subject,
      text,
      html,
    });

    return Response.json(
      {
        success: true,
        message: "Order notification email sent successfully.",
        message_id: info.messageId,
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          ...jsonHeaders,
        },
      },
    );
  } catch (error) {
    console.error("notify-order-email failed", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while sending notification email.";

    return Response.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
        headers: {
          ...corsHeaders,
          ...jsonHeaders,
        },
      },
    );
  }
});
