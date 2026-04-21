"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContentType, ResourceDifficulty } from "@prisma/client";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  getFormString,
  getOptionalFormString,
  parseBooleanField,
  parseEnumField,
  parseIntegerField,
  parseTagList,
  parseUrlField,
  rethrowRedirectError,
  requireFormString,
} from "@/lib/validation";

function getTrackId(formData: FormData, key: string) {
  const value = getFormString(formData, key);
  return value && value !== "global" ? value : null;
}

function revalidateContentSurfaces() {
  revalidatePath("/admin/content");
  revalidatePath("/dashboard/library");
  revalidatePath("/dashboard/toolkits");
}

export async function saveContentItemAction(formData: FormData) {
  const admin = await requirePermission("content.manage");

  try {
    const contentId = getFormString(formData, "contentId");
    const data = {
      trackId: getTrackId(formData, "trackId"),
      title: requireFormString(formData, "title", { maxLength: 160 }),
      titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
      type: parseEnumField(formData, "type", ContentType),
      provider: getOptionalFormString(formData, "provider", 120),
      summary: getOptionalFormString(formData, "summary", 1200),
      summaryAr: getOptionalFormString(formData, "summaryAr", 1200),
      url: parseUrlField(formData, "url", { optional: true }),
      difficulty: parseEnumField(formData, "difficulty", ResourceDifficulty),
      estimatedMinutes: parseIntegerField(formData, "estimatedMinutes", {
        min: 0,
        max: 1440,
        optional: true,
      }),
      isRequired: parseBooleanField(formData, "isRequired"),
      isFeatured: parseBooleanField(formData, "isFeatured"),
      isPublished: parseBooleanField(formData, "isPublished"),
      sortOrder: parseIntegerField(formData, "sortOrder", { min: 0, max: 10000, fallback: 0 }),
      tags: parseTagList(getFormString(formData, "tags")),
    };

    const item = contentId
      ? await prisma.contentItem.update({
          where: { id: contentId },
          data,
        })
      : await prisma.contentItem.create({
          data,
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "ContentItem",
        entityId: item.id,
        action: contentId ? "update" : "create",
        summary: `${contentId ? "Updated" : "Created"} content item ${item.title}`,
      },
    });

    revalidateContentSurfaces();
    redirect("/admin/content?success=content-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/content?error=${getActionErrorCode(error, "content-save-failed")}`);
  }
}

export async function deleteContentItemAction(formData: FormData) {
  const admin = await requirePermission("content.manage");

  try {
    const contentId = requireFormString(formData, "contentId");

    const deleted = await prisma.contentItem.delete({
      where: { id: contentId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "ContentItem",
        entityId: deleted.id,
        action: "delete",
        summary: `Deleted content item ${deleted.title}`,
      },
    });

    revalidateContentSurfaces();
    redirect("/admin/content?success=content-deleted");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/content?error=${getActionErrorCode(error, "content-delete-failed")}`);
  }
}

export async function saveToolkitItemAction(formData: FormData) {
  const admin = await requirePermission("content.manage");

  try {
    const toolkitId = getFormString(formData, "toolkitId");
    const data = {
      trackId: getTrackId(formData, "trackId"),
      title: requireFormString(formData, "title", { maxLength: 160 }),
      titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
      category: requireFormString(formData, "category", { maxLength: 120 }),
      summary: getOptionalFormString(formData, "summary", 1200),
      summaryAr: getOptionalFormString(formData, "summaryAr", 1200),
      fileUrl: parseUrlField(formData, "fileUrl", { optional: true }),
      previewImageUrl: parseUrlField(formData, "previewImageUrl", { optional: true }),
      isFeatured: parseBooleanField(formData, "isFeatured"),
      isPublished: parseBooleanField(formData, "isPublished"),
    };

    const item = toolkitId
      ? await prisma.toolkitItem.update({
          where: { id: toolkitId },
          data,
        })
      : await prisma.toolkitItem.create({
          data,
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "ToolkitItem",
        entityId: item.id,
        action: toolkitId ? "update" : "create",
        summary: `${toolkitId ? "Updated" : "Created"} toolkit item ${item.title}`,
      },
    });

    revalidateContentSurfaces();
    redirect("/admin/content?success=toolkit-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/content?error=${getActionErrorCode(error, "toolkit-save-failed")}`);
  }
}

export async function deleteToolkitItemAction(formData: FormData) {
  const admin = await requirePermission("content.manage");

  try {
    const toolkitId = requireFormString(formData, "toolkitId");

    const deleted = await prisma.toolkitItem.delete({
      where: { id: toolkitId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "ToolkitItem",
        entityId: deleted.id,
        action: "delete",
        summary: `Deleted toolkit item ${deleted.title}`,
      },
    });

    revalidateContentSurfaces();
    redirect("/admin/content?success=toolkit-deleted");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/content?error=${getActionErrorCode(error, "toolkit-delete-failed")}`);
  }
}
