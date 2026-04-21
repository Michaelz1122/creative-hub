import { EmailDeliveryStatus, type Prisma } from "@prisma/client";

import { getAppUrl, getEmailDeliveryMode, getEmailSenderConfig, getResendConfig } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type SendTransactionalEmailInput = {
  userId?: string | null;
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  payload?: Record<string, unknown>;
};

function buildEmailHeaders() {
  const sender = getEmailSenderConfig();

  return {
    from: sender.fromEmail,
    reply_to: sender.replyTo,
  };
}

function buildPreviewPayload(payload?: Record<string, unknown>): Prisma.InputJsonValue | undefined {
  if (getEmailDeliveryMode() === "send") {
    if (!payload) {
      return undefined;
    }

    const safePayload = { ...payload };
    delete safePayload.actionUrl;
    delete safePayload.resetUrl;
    delete safePayload.verificationUrl;
    return safePayload as Prisma.InputJsonValue;
  }

  return {
    ...(payload || {}),
    appUrl: getAppUrl().toString(),
  } as Prisma.InputJsonValue;
}

export async function sendTransactionalEmail(input: SendTransactionalEmailInput) {
  const deliveryMode = getEmailDeliveryMode();

  if (deliveryMode === "log") {
    await prisma.emailDeliveryLog.create({
      data: {
        userId: input.userId ?? null,
        toEmail: input.toEmail,
        template: input.template,
        subject: input.subject,
        status: EmailDeliveryStatus.LOGGED,
        provider: "log",
        payload: buildPreviewPayload(input.payload),
      },
    });

    return {
      status: EmailDeliveryStatus.LOGGED,
    };
  }

  const resendConfig = getResendConfig();
  const sender = buildEmailHeaders();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender.from,
        to: [input.toEmail],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(sender.reply_to ? { reply_to: sender.reply_to } : {}),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorPayload = await response.text();

      await prisma.emailDeliveryLog.create({
        data: {
          userId: input.userId ?? null,
          toEmail: input.toEmail,
          template: input.template,
          subject: input.subject,
          status: EmailDeliveryStatus.FAILED,
          provider: "resend",
          errorMessage: errorPayload.slice(0, 1000),
          payload: buildPreviewPayload(input.payload),
        },
      });

      throw new Error("Transactional email delivery failed.");
    }

    const result = (await response.json()) as {
      id?: string;
    };

    await prisma.emailDeliveryLog.create({
      data: {
        userId: input.userId ?? null,
        toEmail: input.toEmail,
        template: input.template,
        subject: input.subject,
        status: EmailDeliveryStatus.SENT,
        provider: "resend",
        providerMessageId: result.id,
        payload: buildPreviewPayload(input.payload),
      },
    });

    return {
      status: EmailDeliveryStatus.SENT,
      providerMessageId: result.id,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Transactional email delivery failed.") {
      throw error;
    }

    await prisma.emailDeliveryLog.create({
      data: {
        userId: input.userId ?? null,
        toEmail: input.toEmail,
        template: input.template,
        subject: input.subject,
        status: EmailDeliveryStatus.FAILED,
        provider: "resend",
        errorMessage: error instanceof Error ? error.message.slice(0, 1000) : "Unknown email error.",
        payload: buildPreviewPayload(input.payload),
      },
    });

    throw new Error("Transactional email delivery failed.");
  }
}

export function buildActionUrl(pathname: string) {
  return new URL(pathname, getAppUrl()).toString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderSimpleEmail(input: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const heading = escapeHtml(input.heading);
  const body = escapeHtml(input.body).replace(/\n/g, "<br />");
  const ctaLabel = input.ctaLabel ? escapeHtml(input.ctaLabel) : null;
  const ctaUrl = input.ctaUrl ? escapeHtml(input.ctaUrl) : null;

  return `
    <div style="background:#0b1020;padding:32px;font-family:Arial,sans-serif;color:#f8fafc">
      <div style="max-width:560px;margin:0 auto;background:#11172b;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px">
        <p style="margin:0 0 16px;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#f3b63f">Creative Hub</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.3">${heading}</h1>
        <p style="margin:0;font-size:15px;line-height:1.9;color:#cbd5e1">${body}</p>
        ${
          ctaLabel && ctaUrl
            ? `<p style="margin:24px 0 0"><a href="${ctaUrl}" style="display:inline-block;background:#f3b63f;color:#0b1020;text-decoration:none;padding:14px 18px;border-radius:999px;font-weight:700">${ctaLabel}</a></p>`
            : ""
        }
      </div>
    </div>
  `;
}
