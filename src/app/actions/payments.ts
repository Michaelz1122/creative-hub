"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission, requireUser } from "@/lib/auth";
import { redeemFreeCouponForPlan, validateCouponForPlan } from "@/lib/coupons";
import { activateMembershipFromPayment, calculateDiscountedPrice, rejectPaymentRequest } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getReceiptUploadRules, storeReceiptFile } from "@/lib/storage";
import {
  getActionErrorCode,
  parseCouponCodeField,
  parseEgyptPhoneField,
  rethrowRedirectError,
  requireFormString,
  validateUploadFile,
  ValidationError,
} from "@/lib/validation";

function revalidatePaymentSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/community");
  revalidatePath("/dashboard/tracks");
  revalidatePath("/admin/payments");
}

export async function submitPaymentAction(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit({
      scope: "payment-submit",
      key: user.id,
      limit: 3,
      windowMs: 1000 * 60 * 30,
      blockMs: 1000 * 60 * 30,
    });

    const planId = requireFormString(formData, "planId");
    const phoneNumber = parseEgyptPhoneField(formData, "phoneNumber");
    const couponCode = parseCouponCodeField(formData, "couponCode", { optional: true });
    const note = String(formData.get("note") || "").trim();
    const receipt = validateUploadFile(formData.get("receipt"), {
      required: true,
      ...getReceiptUploadRules(),
    });

    if (!receipt) {
      throw new ValidationError("missing-file", "A receipt image is required.");
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { track: true },
    });

    if (!plan || !plan.isActive) {
      throw new ValidationError("invalid-plan", "Selected plan is invalid.");
    }

    const existingPending = await prisma.paymentRequest.findFirst({
      where: {
        userId: user.id,
        status: "SUBMITTED",
      },
    });

    if (existingPending) {
      throw new ValidationError("pending-exists", "A pending payment request already exists.");
    }

    let coupon = null;
    let pricing = calculateDiscountedPrice(plan.priceCents, null);

    if (couponCode) {
      const couponValidation = await validateCouponForPlan({
        db: prisma,
        userId: user.id,
        plan,
        couponCode,
      });

      coupon = couponValidation.coupon;
      pricing = couponValidation.pricing;
    }

    const receiptUrl = await storeReceiptFile(receipt);

    await prisma.paymentRequest.create({
      data: {
        userId: user.id,
        planId: plan.id,
        couponCodeSnapshot: coupon?.code ?? null,
        pricingSnapshot: {
          originalPrice: pricing.originalPrice,
          discountAmount: pricing.discountAmount,
          finalPrice: pricing.finalPrice,
          currency: plan.currency,
          planCode: plan.code,
          planName: plan.name,
        },
        receiptUrl,
        phoneNumber,
        note: note || null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "PAYMENT",
        title: "Payment submitted",
        titleAr: "تم إرسال طلب الدفع",
        body: "Your receipt is now waiting for admin review.",
        bodyAr: "تم إرسال إثبات الدفع وهو الآن في انتظار مراجعة الإدارة.",
        href: "/dashboard/billing",
      },
    });

    revalidatePaymentSurfaces();
    redirect("/dashboard/billing?success=submitted");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/dashboard/billing?error=${getActionErrorCode(error, "payment-submit-failed")}`);
  }
}

export async function redeemFreeCouponAction(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit({
      scope: "coupon-redeem",
      key: user.id,
      limit: 5,
      windowMs: 1000 * 60 * 30,
      blockMs: 1000 * 60 * 30,
    });

    const planId = requireFormString(formData, "planId");
    const couponCode = parseCouponCodeField(formData, "couponCode");

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { track: true },
    });

    if (!plan || !plan.isActive) {
      throw new ValidationError("invalid-plan", "Selected plan is invalid.");
    }

    const { coupon } = await validateCouponForPlan({
      db: prisma,
      userId: user.id,
      plan,
      couponCode,
      requireFreeCoupon: true,
    });

    await prisma.$transaction(async (tx) => {
      await redeemFreeCouponForPlan({
        db: tx,
        coupon,
        plan,
        userId: user.id,
      });
    });

    revalidatePaymentSurfaces();
    redirect("/dashboard/billing?success=free-redeemed");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/dashboard/billing?error=${getActionErrorCode(error, "free-redeem-failed")}`);
  }
}

export async function approvePaymentAction(formData: FormData) {
  const admin = await requirePermission("payments.review");

  try {
    const paymentRequestId = requireFormString(formData, "paymentRequestId");
    const adminNote = String(formData.get("adminNote") || "").trim();

    await activateMembershipFromPayment({
      paymentRequestId,
      actorUserId: admin.id,
      adminNote: adminNote || null,
    });

    revalidatePaymentSurfaces();
    redirect("/admin/payments?success=approved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/payments?error=${getActionErrorCode(error, "approve-failed")}`);
  }
}

export async function rejectPaymentAction(formData: FormData) {
  const admin = await requirePermission("payments.review");

  try {
    const paymentRequestId = requireFormString(formData, "paymentRequestId");
    const adminNote = String(formData.get("adminNote") || "").trim();

    await rejectPaymentRequest({
      paymentRequestId,
      actorUserId: admin.id,
      adminNote: adminNote || null,
    });

    revalidatePaymentSurfaces();
    redirect("/admin/payments?success=rejected");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/payments?error=${getActionErrorCode(error, "reject-failed")}`);
  }
}
