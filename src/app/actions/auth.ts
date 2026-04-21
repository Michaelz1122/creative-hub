"use server";

import { redirect } from "next/navigation";

import {
  authenticateWithPassword,
  clearSessionCookie,
  getRequestContext,
  getUserPermissionKeys,
  invalidateCurrentSession,
} from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireFormString, rethrowRedirectError, ValidationError } from "@/lib/validation";

export async function loginAction(formData: FormData) {
  let destination = "/dashboard";

  try {
    const email = requireFormString(formData, "email", { maxLength: 190 }).toLowerCase();
    const password = requireFormString(formData, "password", { minLength: 8, maxLength: 200 });
    const { ipAddress } = await getRequestContext();

    await enforceRateLimit({
      scope: "login",
      key: `${email}:${ipAddress}`,
      limit: 5,
      windowMs: 1000 * 60 * 15,
      blockMs: 1000 * 60 * 30,
    });

    const user = await authenticateWithPassword(email, password);
    const permissions = getUserPermissionKeys(user);

    if (permissions.length > 0) {
      destination = "/admin";
    }
  } catch (error) {
    rethrowRedirectError(error);

    if (error instanceof ValidationError) {
      redirect(`/login?error=${error.code}`);
    }

    redirect("/login?error=login-failed");
  }

  redirect(destination);
}

export async function logoutAction() {
  await invalidateCurrentSession();
  await clearSessionCookie();
  redirect("/login");
}
