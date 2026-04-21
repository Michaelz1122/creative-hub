"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MembershipStatus } from "@prisma/client";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  parseEnumField,
  parseIntegerField,
  rethrowRedirectError,
  requireFormString,
  ValidationError,
} from "@/lib/validation";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function revalidateUserSurfaces() {
  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/tracks");
  revalidatePath("/dashboard/community");
  revalidatePath("/dashboard/library");
  revalidatePath("/dashboard/toolkits");
}

export async function createUserNoteAction(formData: FormData) {
  const admin = await requirePermission("users.manage");

  try {
    const userId = requireFormString(formData, "userId");
    const body = requireFormString(formData, "body", { minLength: 3, maxLength: 1200 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new ValidationError("missing-user", "User was not found.");
    }

    await prisma.adminUserNote.create({
      data: {
        userId,
        authorUserId: admin.id,
        body,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "AdminUserNote",
        entityId: userId,
        action: "create",
        summary: `Added admin note for user ${userId}`,
      },
    });

    revalidateUserSurfaces();
    redirect("/admin/users?success=note-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/users?error=${getActionErrorCode(error, "note-save-failed")}`);
  }
}

export async function grantMembershipAction(formData: FormData) {
  const admin = await requirePermission("memberships.manage");

  try {
    const userId = requireFormString(formData, "userId");
    const planId = requireFormString(formData, "planId");
    const grantMode = parseEnumField(formData, "grantMode", ["manual", "complimentary"] as const);

    const [user, plan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isSuspended: true },
      }),
      prisma.plan.findUnique({
        where: { id: planId },
      }),
    ]);

    if (!user) {
      throw new ValidationError("missing-user", "User was not found.");
    }

    if (user.isSuspended) {
      throw new ValidationError("user-suspended", "Suspended users cannot receive access.");
    }

    if (!plan || !plan.isActive) {
      throw new ValidationError("invalid-plan", "Plan was not found.");
    }

    const now = new Date();
    const expiresAt = addDays(now, plan.durationDays);

    const membership = await prisma.membership.upsert({
      where: {
        userId_planId: {
          userId,
          planId,
        },
      },
      update: {
        status: MembershipStatus.ACTIVE,
        startsAt: now,
        expiresAt,
        grantedById: admin.id,
        source: grantMode === "complimentary" ? "complimentary_admin_grant" : "manual_admin_grant",
      },
      create: {
        userId,
        planId,
        status: MembershipStatus.ACTIVE,
        startsAt: now,
        expiresAt,
        grantedById: admin.id,
        source: grantMode === "complimentary" ? "complimentary_admin_grant" : "manual_admin_grant",
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "MEMBERSHIP",
        title: "Membership updated",
        titleAr: "تم تحديث العضوية",
        body: `Your ${plan.name} access is now active.`,
        bodyAr: `تم تفعيل ${plan.nameAr} على حسابك.`,
        href: "/dashboard/billing",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Membership",
        entityId: membership.id,
        action: grantMode === "complimentary" ? "grant_complimentary" : "grant_manual",
        summary: `Granted ${plan.code} to user ${userId}`,
      },
    });

    revalidateUserSurfaces();
    redirect("/admin/users?success=membership-granted");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/users?error=${getActionErrorCode(error, "membership-grant-failed")}`);
  }
}

export async function extendMembershipAction(formData: FormData) {
  const admin = await requirePermission("memberships.manage");

  try {
    const membershipId = requireFormString(formData, "membershipId");
    const extendDays = parseIntegerField(formData, "extendDays", { min: 1, max: 3650, fallback: 30 });

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new ValidationError("missing-membership", "Membership was not found.");
    }

    const now = new Date();
    const baseDate = membership.expiresAt && membership.expiresAt > now ? membership.expiresAt : now;
    const expiresAt = addDays(baseDate, extendDays);

    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: MembershipStatus.ACTIVE,
        startsAt: membership.startsAt ?? now,
        expiresAt,
        grantedById: admin.id,
        source: membership.source || "manual_extension",
      },
    });

    await prisma.notification.create({
      data: {
        userId: membership.userId,
        type: "MEMBERSHIP",
        title: "Membership extended",
        titleAr: "تم تمديد العضوية",
        body: `Your ${membership.plan.name} access was extended.`,
        bodyAr: `تم تمديد ${membership.plan.nameAr} على حسابك.`,
        href: "/dashboard/billing",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Membership",
        entityId: membership.id,
        action: "extend",
        summary: `Extended membership ${membership.id} by ${extendDays} days`,
      },
    });

    revalidateUserSurfaces();
    redirect("/admin/users?success=membership-extended");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/users?error=${getActionErrorCode(error, "membership-extend-failed")}`);
  }
}

export async function revokeMembershipAction(formData: FormData) {
  const admin = await requirePermission("memberships.manage");

  try {
    const membershipId = requireFormString(formData, "membershipId");

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new ValidationError("missing-membership", "Membership was not found.");
    }

    if (membership.status === MembershipStatus.REVOKED) {
      revalidateUserSurfaces();
      redirect("/admin/users?success=membership-revoked");
    }

    const now = new Date();

    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: MembershipStatus.REVOKED,
        expiresAt: now,
        grantedById: admin.id,
        source: "admin_revoke",
      },
    });

    await prisma.notification.create({
      data: {
        userId: membership.userId,
        type: "MEMBERSHIP",
        title: "Membership revoked",
        titleAr: "تم إيقاف العضوية",
        body: `Your ${membership.plan.name} access is no longer active.`,
        bodyAr: `تم إيقاف ${membership.plan.nameAr} على حسابك.`,
        href: "/dashboard/billing",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Membership",
        entityId: membership.id,
        action: "revoke",
        summary: `Revoked membership ${membership.id}`,
      },
    });

    revalidateUserSurfaces();
    redirect("/admin/users?success=membership-revoked");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/users?error=${getActionErrorCode(error, "membership-revoke-failed")}`);
  }
}
