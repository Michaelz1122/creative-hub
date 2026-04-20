"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateTrackCommunityAction(formData: FormData) {
  await requireAdmin();
  const trackId = String(formData.get("trackId") || "");
  const inviteUrl = String(formData.get("inviteUrl") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const isEnabled = String(formData.get("isEnabled") || "") === "true";

  if (!trackId) {
    redirect("/admin/tracks");
  }

  await prisma.trackCommunity.upsert({
    where: { trackId },
    update: {
      inviteUrl: inviteUrl || null,
      description: description || null,
      isEnabled,
    },
    create: {
      trackId,
      label: "Track community",
      inviteUrl: inviteUrl || null,
      description: description || null,
      isEnabled,
    },
  });

  redirect("/admin/tracks?success=community-updated");
}
