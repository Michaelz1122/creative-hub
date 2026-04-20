"use server";

import { redirect } from "next/navigation";

import { clearSessionCookie, signInWithEmail } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/seed-constants";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();

  if (!email) {
    redirect("/login?error=missing-email");
  }

  await signInWithEmail(email, name);

  if (email === ADMIN_EMAIL) {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

