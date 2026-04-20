"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleContentPublishAction(formData: FormData) {
  await requireAdmin();
  const contentId = String(formData.get("contentId") || "");
  const nextValue = String(formData.get("nextValue") || "") === "true";

  if (!contentId) {
    redirect("/admin/content");
  }

  await prisma.contentItem.update({
    where: { id: contentId },
    data: { isPublished: nextValue },
  });

  redirect("/admin/content");
}

export async function toggleToolkitPublishAction(formData: FormData) {
  await requireAdmin();
  const toolkitId = String(formData.get("toolkitId") || "");
  const nextValue = String(formData.get("nextValue") || "") === "true";

  if (!toolkitId) {
    redirect("/admin/content");
  }

  await prisma.toolkitItem.update({
    where: { id: toolkitId },
    data: { isPublished: nextValue },
  });

  redirect("/admin/content");
}

export async function toggleToolkitFeaturedAction(formData: FormData) {
  await requireAdmin();
  const toolkitId = String(formData.get("toolkitId") || "");
  const nextValue = String(formData.get("nextValue") || "") === "true";

  if (!toolkitId) {
    redirect("/admin/content");
  }

  await prisma.toolkitItem.update({
    where: { id: toolkitId },
    data: { isFeatured: nextValue },
  });

  redirect("/admin/content");
}

