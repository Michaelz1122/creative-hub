"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PlanScope } from "@prisma/client";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  getFormString,
  parseBooleanField,
  parseEnumField,
  parseIntegerField,
  rethrowRedirectError,
  requireFormString,
  ValidationError,
} from "@/lib/validation";

function revalidatePlanSurfaces() {
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  revalidatePath("/pricing");
}

export async function savePlanAction(formData: FormData) {
  const admin = await requirePermission("plans.manage");

  try {
    const planId = getFormString(formData, "planId");
    const code = requireFormString(formData, "code", { maxLength: 80 });
    const name = requireFormString(formData, "name", { maxLength: 120 });
    const nameAr = requireFormString(formData, "nameAr", { maxLength: 160 });
    const scope = parseEnumField(formData, "scope", PlanScope);
    const trackId = getFormString(formData, "trackId");

    if (scope === PlanScope.TRACK && !trackId) {
      throw new ValidationError("missing-trackId", "Track plans require a track.");
    }

    const data = {
      code,
      name,
      nameAr,
      scope,
      trackId: scope === PlanScope.TRACK ? trackId || null : null,
      priceCents: parseIntegerField(formData, "priceCents", { min: 0, max: 100000 }),
      currency: requireFormString(formData, "currency", { maxLength: 8 }),
      billingPeriod: requireFormString(formData, "billingPeriod", { maxLength: 40 }),
      durationDays: parseIntegerField(formData, "durationDays", { min: 1, max: 3650, fallback: 365 }),
      isActive: parseBooleanField(formData, "isActive"),
    };

    const plan = planId
      ? await prisma.plan.update({
          where: { id: planId },
          data,
        })
      : await prisma.plan.create({
          data,
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Plan",
        entityId: plan.id,
        action: planId ? "update" : "create",
        summary: `${planId ? "Updated" : "Created"} plan ${plan.code}`,
      },
    });

    revalidatePlanSurfaces();
    redirect("/admin/settings?success=plan-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/settings?error=${getActionErrorCode(error, "plan-save-failed")}`);
  }
}
