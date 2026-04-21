"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TrackStatus } from "@prisma/client";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  getOptionalFormString,
  parseBooleanField,
  parseIntegerField,
  parseSlugField,
  parseUrlField,
  rethrowRedirectError,
  requireFormString,
  ValidationError,
} from "@/lib/validation";

function revalidateTrackSurfaces(slug?: string | null) {
  revalidatePath("/admin/tracks");
  revalidatePath("/dashboard/tracks");
  revalidatePath("/dashboard/community");
  revalidatePath("/");
  revalidatePath("/pricing");
  if (slug) {
    revalidatePath(`/tracks/${slug}`);
    revalidatePath(`/dashboard/tracks/${slug}`);
  }
}

function parseTrackStatus(formData: FormData) {
  const value = requireFormString(formData, "status");

  if (!Object.values(TrackStatus).includes(value as TrackStatus)) {
    throw new ValidationError("invalid-status", "Track status is invalid.");
  }

  return value as TrackStatus;
}

export async function saveTrackAction(formData: FormData) {
  const admin = await requirePermission("tracks.manage");

  try {
    const trackId = getOptionalFormString(formData, "trackId", 80);
    const status = parseTrackStatus(formData);
    const communityLabel = getOptionalFormString(formData, "communityLabel", 160);
    const isCommunityEnabled = parseBooleanField(formData, "isCommunityEnabled");
    const data = {
      slug: parseSlugField(formData, "slug"),
      name: requireFormString(formData, "name", { maxLength: 120 }),
      nameAr: requireFormString(formData, "nameAr", { maxLength: 160 }),
      summary: requireFormString(formData, "summary", { minLength: 10, maxLength: 1200 }),
      summaryAr: requireFormString(formData, "summaryAr", { minLength: 10, maxLength: 1400 }),
      status,
      isFeatured: parseBooleanField(formData, "isFeatured"),
      sortOrder: parseIntegerField(formData, "sortOrder", { min: 0, max: 10000, fallback: 0 }),
      roadmapLengthDays: parseIntegerField(formData, "roadmapLengthDays", { min: 1, max: 365, fallback: 60 }),
      accentColor: getOptionalFormString(formData, "accentColor", 32),
      heroImageUrl: parseUrlField(formData, "heroImageUrl", { optional: true }),
    };

    const track = trackId
      ? await prisma.track.update({
          where: { id: trackId },
          data,
        })
      : await prisma.track.create({
          data,
        });

    await prisma.trackCommunity.upsert({
      where: { trackId: track.id },
      update: {
        label: communityLabel || `${track.name} community`,
        description: getOptionalFormString(formData, "communityDescription", 1200),
        inviteUrl: parseUrlField(formData, "inviteUrl", { optional: true }),
        isEnabled: isCommunityEnabled,
      },
      create: {
        trackId: track.id,
        label: communityLabel || `${track.name} community`,
        description: getOptionalFormString(formData, "communityDescription", 1200),
        inviteUrl: parseUrlField(formData, "inviteUrl", { optional: true }),
        isEnabled: isCommunityEnabled,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Track",
        entityId: track.id,
        action: trackId ? "update" : "create",
        summary: `${trackId ? "Updated" : "Created"} track ${track.slug}`,
      },
    });

    revalidateTrackSurfaces(track.slug);
    redirect("/admin/tracks?success=track-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/tracks?error=${getActionErrorCode(error, "track-save-failed")}`);
  }
}
