import { MembershipStatus, PlanScope, type Coupon, type Plan, type PrismaClient } from "@prisma/client";

import { calculateDiscountedPrice } from "@/lib/payments";
import { ValidationError } from "@/lib/validation";

type PlanWithTrack = Plan & {
  track?: {
    id: string;
    nameAr: string;
  } | null;
};

type CouponDbClient = Pick<PrismaClient, "coupon" | "couponRedemption" | "membership" | "notification" | "auditLog">;

export async function validateCouponForPlan(input: {
  db: Pick<PrismaClient, "coupon" | "couponRedemption">;
  userId: string;
  plan: PlanWithTrack;
  couponCode: string;
  requireFreeCoupon?: boolean;
}) {
  const coupon = await input.db.coupon.findFirst({
    where: {
      code: input.couponCode,
      isActive: true,
    },
  });

  if (!coupon) {
    throw new ValidationError("invalid-coupon", "Coupon is invalid.");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ValidationError("coupon-expired", "Coupon is expired.");
  }

  if (coupon.planScope && coupon.planScope !== input.plan.scope) {
    throw new ValidationError("coupon-scope-mismatch", "Coupon does not apply to this plan.");
  }

  if (coupon.trackId && coupon.trackId !== input.plan.trackId) {
    throw new ValidationError("coupon-track-mismatch", "Coupon does not apply to this track.");
  }

  if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    throw new ValidationError("coupon-maxed", "Coupon has reached its usage limit.");
  }

  if (coupon.perUserLimit) {
    const userRedemptions = await input.db.couponRedemption.count({
      where: {
        couponId: coupon.id,
        userId: input.userId,
      },
    });

    if (userRedemptions >= coupon.perUserLimit) {
      throw new ValidationError("coupon-user-limit", "Coupon usage limit reached for this user.");
    }
  }

  if (input.requireFreeCoupon && coupon.discountType !== "free") {
    throw new ValidationError("coupon-not-free", "Coupon is not a free access coupon.");
  }

  const pricing = calculateDiscountedPrice(input.plan.priceCents, coupon);

  return {
    coupon,
    pricing,
  };
}

export async function redeemFreeCouponForPlan(input: {
  db: CouponDbClient;
  coupon: Coupon;
  plan: PlanWithTrack;
  userId: string;
  actorUserId?: string | null;
}) {
  const existingMembership = await input.db.membership.findUnique({
    where: {
      userId_planId: {
        userId: input.userId,
        planId: input.plan.id,
      },
    },
  });

  if (
    existingMembership?.status === MembershipStatus.ACTIVE &&
    (!existingMembership.expiresAt || existingMembership.expiresAt > new Date())
  ) {
    throw new ValidationError("membership-already-active", "This membership is already active.");
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + input.plan.durationDays);

  const membership = await input.db.membership.upsert({
    where: {
      userId_planId: {
        userId: input.userId,
        planId: input.plan.id,
      },
    },
    update: {
      status: MembershipStatus.ACTIVE,
      startsAt: now,
      expiresAt,
      grantedById: input.actorUserId ?? null,
      source: "free_coupon_redemption",
    },
    create: {
      userId: input.userId,
      planId: input.plan.id,
      status: MembershipStatus.ACTIVE,
      startsAt: now,
      expiresAt,
      grantedById: input.actorUserId ?? null,
      source: "free_coupon_redemption",
    },
  });

  const redemptionKey = `free:${input.coupon.id}:${input.userId}:${input.plan.id}`;
  const existingRedemption = await input.db.couponRedemption.findUnique({
    where: { redemptionKey },
  });

  if (!existingRedemption) {
    await input.db.coupon.update({
      where: { id: input.coupon.id },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });

    await input.db.couponRedemption.create({
      data: {
        couponId: input.coupon.id,
        userId: input.userId,
        redemptionKey,
      },
    });
  }

  await input.db.notification.create({
    data: {
      userId: input.userId,
      type: "MEMBERSHIP",
      title: "Free access activated",
      titleAr: "تم تفعيل الوصول المجاني",
      body: `Your ${input.plan.name} access is now active.`,
      bodyAr:
        input.plan.scope === PlanScope.ALL_ACCESS
          ? "تم فتح كل المسارات المتاحة على حسابك باستخدام كوبون مجاني."
          : `تم فتح ${input.plan.nameAr} على حسابك باستخدام كوبون مجاني.`,
      href: "/dashboard/billing",
    },
  });

  await input.db.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? input.userId,
      entityType: "CouponRedemption",
      entityId: redemptionKey,
      action: "redeem_free_coupon",
      summary: `Redeemed free coupon ${input.coupon.code} for user ${input.userId}`,
      payload: {
        couponCode: input.coupon.code,
        planCode: input.plan.code,
        membershipId: membership.id,
      },
    },
  });

  return membership;
}
