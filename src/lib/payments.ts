import { MembershipStatus, PaymentStatus, PlanScope, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

function getExpiryFromDuration(date: Date, durationDays: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + durationDays);
  return next;
}

export function calculateDiscountedPrice(
  basePrice: number,
  coupon:
    | {
        discountType: string;
        discountValue: number;
      }
    | null
    | undefined,
) {
  if (!coupon) {
    return {
      originalPrice: basePrice,
      discountAmount: 0,
      finalPrice: basePrice,
    };
  }

  if (coupon.discountType === "percentage") {
    const discountAmount = Math.min(basePrice, Math.round((basePrice * coupon.discountValue) / 100));
    return {
      originalPrice: basePrice,
      discountAmount,
      finalPrice: Math.max(0, basePrice - discountAmount),
    };
  }

  if (coupon.discountType === "fixed") {
    const discountAmount = Math.min(basePrice, coupon.discountValue);
    return {
      originalPrice: basePrice,
      discountAmount,
      finalPrice: Math.max(0, basePrice - discountAmount),
    };
  }

  return {
    originalPrice: basePrice,
    discountAmount: basePrice,
    finalPrice: 0,
  };
}

export async function activateMembershipFromPayment(input: {
  paymentRequestId: string;
  actorUserId?: string | null;
  adminNote?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const paymentRequest = await tx.paymentRequest.findUnique({
      where: { id: input.paymentRequestId },
      include: {
        user: true,
        plan: {
          include: {
            track: true,
          },
        },
      },
    });

    if (!paymentRequest) {
      throw new ValidationError("payment-not-found", "Payment request not found.");
    }

    if (paymentRequest.status === PaymentStatus.APPROVED) {
      const existingMembership = await tx.membership.findUnique({
        where: {
          userId_planId: {
            userId: paymentRequest.userId,
            planId: paymentRequest.planId,
          },
        },
        include: {
          plan: {
            include: {
              track: true,
            },
          },
        },
      });

      if (!existingMembership) {
        throw new ValidationError("approved-without-membership", "Approved payment has no membership.");
      }

      return {
        membership: existingMembership,
        paymentRequest,
      };
    }

    if (paymentRequest.status !== PaymentStatus.SUBMITTED) {
      throw new ValidationError("payment-not-submitted", "Only submitted payments can be approved.");
    }

    const now = new Date();
    const expiresAt = getExpiryFromDuration(now, paymentRequest.plan.durationDays);
    const coupon =
      paymentRequest.couponCodeSnapshot
        ? await tx.coupon.findUnique({
            where: { code: paymentRequest.couponCodeSnapshot },
          })
        : null;

    const membership = await tx.membership.upsert({
      where: {
        userId_planId: {
          userId: paymentRequest.userId,
          planId: paymentRequest.planId,
        },
      },
      update: {
        status: MembershipStatus.ACTIVE,
        startsAt: now,
        expiresAt,
        source: "manual_payment_approval",
        grantedById: input.actorUserId ?? null,
      },
      create: {
        userId: paymentRequest.userId,
        planId: paymentRequest.planId,
        status: MembershipStatus.ACTIVE,
        startsAt: now,
        expiresAt,
        source: "manual_payment_approval",
        grantedById: input.actorUserId ?? null,
      },
    });

    await tx.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        status: PaymentStatus.APPROVED,
        reviewedAt: now,
        adminNote: input.adminNote ?? null,
      },
    });

    await tx.paymentReviewLog.create({
      data: {
        paymentRequestId: paymentRequest.id,
        action: "approved",
        note: input.adminNote ?? null,
      },
    });

    if (coupon) {
      const redemptionKey = `payment:${paymentRequest.id}`;
      const existingRedemption = await tx.couponRedemption.findUnique({
        where: { redemptionKey },
      });

      if (!existingRedemption) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });

        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            userId: paymentRequest.userId,
            paymentRequestId: paymentRequest.id,
            redemptionKey,
          },
        });
      }
    }

    await tx.notification.create({
      data: {
        userId: paymentRequest.userId,
        type: "MEMBERSHIP",
        title: "Membership approved",
        titleAr: "تم قبول الدفع وتفعيل العضوية",
        body: `Your ${paymentRequest.plan.name} access is now active.`,
        bodyAr:
          paymentRequest.plan.scope === PlanScope.ALL_ACCESS
            ? "تم فتح كل المسارات المتاحة على حسابك."
            : `تم فتح مسار ${paymentRequest.plan.track?.nameAr ?? paymentRequest.plan.nameAr} على حسابك.`,
        href: "/dashboard",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        entityType: "PaymentRequest",
        entityId: paymentRequest.id,
        action: "approve",
        summary: `Approved payment for ${paymentRequest.user.email}`,
        payload: {
          planCode: paymentRequest.plan.code,
          membershipId: membership.id,
        } satisfies Prisma.InputJsonValue,
      },
    });

    return {
      membership,
      paymentRequest: {
        ...paymentRequest,
        adminNote: input.adminNote ?? null,
      },
    };
  });
}

export async function rejectPaymentRequest(input: {
  paymentRequestId: string;
  actorUserId?: string | null;
  adminNote?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const paymentRequest = await tx.paymentRequest.findUnique({
      where: { id: input.paymentRequestId },
      include: {
        user: true,
      },
    });

    if (!paymentRequest) {
      throw new ValidationError("payment-not-found", "Payment request not found.");
    }

    if (paymentRequest.status === PaymentStatus.REJECTED) {
      return paymentRequest;
    }

    if (paymentRequest.status !== PaymentStatus.SUBMITTED) {
      throw new ValidationError("payment-not-submitted", "Only submitted payments can be rejected.");
    }

    const now = new Date();

    await tx.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        status: PaymentStatus.REJECTED,
        reviewedAt: now,
        adminNote: input.adminNote ?? null,
      },
    });

    await tx.paymentReviewLog.create({
      data: {
        paymentRequestId: paymentRequest.id,
        action: "rejected",
        note: input.adminNote ?? null,
      },
    });

    await tx.notification.create({
      data: {
        userId: paymentRequest.userId,
        type: "PAYMENT",
        title: "Payment rejected",
        titleAr: "تم رفض طلب الدفع",
        body: input.adminNote || "Please review the admin note and submit a new receipt.",
        bodyAr: input.adminNote || "راجع ملاحظة الإدارة ثم ارفع إثباتًا جديدًا.",
        href: "/dashboard/billing",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        entityType: "PaymentRequest",
        entityId: paymentRequest.id,
        action: "reject",
        summary: `Rejected payment for ${paymentRequest.user.email}`,
      },
    });

    return {
      ...paymentRequest,
      adminNote: input.adminNote ?? null,
    };
  });
}
