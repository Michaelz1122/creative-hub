"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PlanScope } from "@prisma/client";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  getFormString,
  getOptionalFormString,
  parseBooleanField,
  parseCouponCodeField,
  parseDateTimeField,
  parseEnumField,
  parseIntegerField,
  rethrowRedirectError,
  ValidationError,
} from "@/lib/validation";

const DISCOUNT_TYPES = ["percentage", "fixed", "free"] as const;

function revalidateCouponSurfaces() {
  revalidatePath("/admin/coupons");
  revalidatePath("/dashboard/billing");
}

export async function saveCouponAction(formData: FormData) {
  const admin = await requirePermission("coupons.manage");

  try {
    const couponId = getFormString(formData, "couponId");
    const discountType = parseEnumField(formData, "discountType", DISCOUNT_TYPES);
    const rawPlanScope = getFormString(formData, "planScope");
    const trackId = getFormString(formData, "trackId") || null;
    const maxUses = parseIntegerField(formData, "maxUses", { min: 0, max: 100000, optional: true });
    const perUserLimit = parseIntegerField(formData, "perUserLimit", { min: 0, max: 10000, optional: true });
    const planScope = rawPlanScope ? parseEnumField(formData, "planScope", PlanScope) : null;

    if (maxUses !== null && perUserLimit !== null && perUserLimit > maxUses) {
      throw new ValidationError("per-user-greater-than-max", "Per-user limit cannot exceed max uses.");
    }

    if (planScope === PlanScope.ALL_ACCESS && trackId) {
      throw new ValidationError(
        "all-access-coupon-cannot-target-track",
        "All-access coupons cannot target a single track.",
      );
    }

    const data = {
      code: parseCouponCodeField(formData, "code"),
      label: getOptionalFormString(formData, "label", 120),
      discountType,
      discountValue:
        discountType === "free"
          ? 100
          : parseIntegerField(formData, "discountValue", {
              min: 0,
              max: 100000,
              fallback: 0,
            }),
      planScope,
      trackId: planScope === PlanScope.ALL_ACCESS ? null : trackId,
      maxUses,
      perUserLimit,
      expiresAt: parseDateTimeField(formData, "expiresAt"),
      isActive: parseBooleanField(formData, "isActive"),
    };

    const coupon = couponId
      ? await prisma.coupon.update({
          where: { id: couponId },
          data,
        })
      : await prisma.coupon.create({
          data,
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Coupon",
        entityId: coupon.id,
        action: couponId ? "update" : "create",
        summary: `${couponId ? "Updated" : "Created"} coupon ${coupon.code}`,
      },
    });

    revalidateCouponSurfaces();
    redirect("/admin/coupons?success=coupon-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/coupons?error=${getActionErrorCode(error, "coupon-save-failed")}`);
  }
}
