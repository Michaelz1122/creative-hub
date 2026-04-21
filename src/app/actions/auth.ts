"use server";

import { AuthTokenPurpose } from "@prisma/client";
import { redirect } from "next/navigation";

import {
  authenticateWithPassword,
  createAuthToken,
  clearSessionCookie,
  getLoginDestination,
  getRequestContext,
  invalidateCurrentSession,
  normalizeEmail,
  registerLearnerAccount,
  updatePasswordWithResetToken,
} from "@/lib/auth";
import { buildActionUrl, renderSimpleEmail, sendTransactionalEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { assertRateLimitNotBlocked, enforceRateLimit, resetRateLimitBucket } from "@/lib/rate-limit";
import {
  getOptionalFormString,
  parseEmailField,
  parsePasswordField,
  rethrowRedirectError,
  requireFormString,
  ValidationError,
} from "@/lib/validation";

async function sendVerificationEmail(user: { id: string; email: string; name: string | null }) {
  const verificationToken = await createAuthToken({
    userId: user.id,
    purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
    expiresInHours: 24,
  });

  const verificationUrl = buildActionUrl(`/verify-email?token=${verificationToken.rawToken}`);

  await sendTransactionalEmail({
    userId: user.id,
    toEmail: user.email,
    template: "auth-email-verification",
    subject: "Confirm your Creative Hub account",
    html: renderSimpleEmail({
      heading: "Confirm your account",
      body:
        "Use the button below to verify your email and activate your Creative Hub account. The link stays active for 24 hours.",
      ctaLabel: "Verify email",
      ctaUrl: verificationUrl,
    }),
    text: `Verify your Creative Hub account: ${verificationUrl}`,
    payload: {
      actionUrl: verificationUrl,
      purpose: "email_verification",
    },
  });
}

async function sendPasswordResetEmail(user: { id: string; email: string; name: string | null }) {
  const resetToken = await createAuthToken({
    userId: user.id,
    purpose: AuthTokenPurpose.PASSWORD_RESET,
    expiresInHours: 2,
  });

  const resetUrl = buildActionUrl(`/reset-password?token=${resetToken.rawToken}`);

  await sendTransactionalEmail({
    userId: user.id,
    toEmail: user.email,
    template: "auth-password-reset",
    subject: "Reset your Creative Hub password",
    html: renderSimpleEmail({
      heading: "Reset your password",
      body:
        "If you requested a password reset, use the button below to choose a new password. The link stays active for 2 hours.",
      ctaLabel: "Reset password",
      ctaUrl: resetUrl,
    }),
    text: `Reset your Creative Hub password: ${resetUrl}`,
    payload: {
      actionUrl: resetUrl,
      purpose: "password_reset",
    },
  });
}

export async function loginAction(formData: FormData) {
  let destination = "/dashboard";
  const attemptedEmail = String(formData.get("email") || "").trim().toLowerCase();
  let rateLimitKey = "";

  try {
    const email = parseEmailField(formData, "email");
    const password = requireFormString(formData, "password", { minLength: 10, maxLength: 200 });
    const { ipAddress } = await getRequestContext();
    rateLimitKey = `${email}:${ipAddress}`;

    await assertRateLimitNotBlocked({
      scope: "login",
      key: rateLimitKey,
    });

    const user = await authenticateWithPassword(email, password);
    await resetRateLimitBucket({
      scope: "login",
      key: rateLimitKey,
    });
    destination = getLoginDestination(user);
  } catch (error) {
    rethrowRedirectError(error);

    if (error instanceof ValidationError) {
      if (error.code === "invalid-credentials" && rateLimitKey) {
        try {
          await enforceRateLimit({
            scope: "login",
            key: rateLimitKey,
            limit: 5,
            windowMs: 1000 * 60 * 15,
            blockMs: 1000 * 60 * 30,
          });
        } catch (rateLimitError) {
          if (rateLimitError instanceof ValidationError) {
            const emailParam = attemptedEmail ? `&email=${encodeURIComponent(attemptedEmail)}` : "";
            redirect(`/login?error=${rateLimitError.code}${emailParam}`);
          }

          redirect("/login?error=login-failed");
        }
      }

      const emailParam = attemptedEmail ? `&email=${encodeURIComponent(attemptedEmail)}` : "";
      redirect(`/login?error=${error.code}${emailParam}`);
    }

    redirect("/login?error=login-failed");
  }

  redirect(destination);
}

export async function signupAction(formData: FormData) {
  try {
    const email = parseEmailField(formData, "email");
    const password = parsePasswordField(formData, "password");
    const name = getOptionalFormString(formData, "name", 120);

    const user = await registerLearnerAccount({
      email,
      name,
      password,
    });

    await sendVerificationEmail({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    redirect(`/signup?success=verify-email&email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    rethrowRedirectError(error);

    if (error instanceof ValidationError) {
      redirect(`/signup?error=${error.code}`);
    }

    redirect("/signup?error=signup-failed");
  }
}

export async function resendVerificationEmailAction(formData: FormData) {
  try {
    const email = parseEmailField(formData, "email");
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });

    if (user && !user.emailVerifiedAt) {
      await sendVerificationEmail({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    }

    redirect(`/login?success=verification-resent&email=${encodeURIComponent(email)}`);
  } catch (error) {
    rethrowRedirectError(error);

    if (error instanceof ValidationError) {
      redirect(`/login?error=${error.code}`);
    }

    redirect("/login?error=verification-resend-failed");
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  try {
    const email = parseEmailField(formData, "email");
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });

    if (user?.emailVerifiedAt && !user.isSuspended) {
      await sendPasswordResetEmail({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    }

    redirect("/forgot-password?success=reset-link-sent");
  } catch (error) {
    rethrowRedirectError(error);

    if (error instanceof ValidationError) {
      redirect(`/forgot-password?error=${error.code}`);
    }

    redirect("/forgot-password?error=reset-request-failed");
  }
}

export async function resetPasswordAction(formData: FormData) {
  try {
    const token = requireFormString(formData, "token", { minLength: 16, maxLength: 200 });
    const password = parsePasswordField(formData, "password");

    await updatePasswordWithResetToken({
      rawToken: token,
      newPassword: password,
    });

    redirect("/login?success=password-reset");
  } catch (error) {
    rethrowRedirectError(error);

    if (error instanceof ValidationError) {
      redirect(`/reset-password?token=${encodeURIComponent(String(formData.get("token") || ""))}&error=${error.code}`);
    }

    redirect(`/reset-password?token=${encodeURIComponent(String(formData.get("token") || ""))}&error=reset-failed`);
  }
}

export async function logoutAction() {
  await invalidateCurrentSession();
  await clearSessionCookie();
  redirect("/login");
}
