"use server";

import { redirect } from "next/navigation";

import { requireAdmin, requireUser } from "@/lib/auth";
import { activateMembershipFromPayment, calculateDiscountedPrice, rejectPaymentRequest } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { storeReceiptFile } from "@/lib/storage";

export async function submitPaymentAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId") || "");
  const phoneNumber = String(formData.get("phoneNumber") || "").trim();
  const couponCode = String(formData.get("couponCode") || "").trim().toUpperCase();
  const note = String(formData.get("note") || "").trim();
  const receipt = formData.get("receipt");

  if (!planId || !phoneNumber || !(receipt instanceof File) || receipt.size === 0) {
    redirect("/dashboard/billing?error=missing-fields");
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { track: true },
  });

  if (!plan || !plan.isActive) {
    redirect("/dashboard/billing?error=invalid-plan");
  }

  const existingPending = await prisma.paymentRequest.findFirst({
    where: {
      userId: user.id,
      status: "SUBMITTED",
    },
  });

  if (existingPending) {
    redirect("/dashboard/billing?error=pending-exists");
  }

  let coupon =
    couponCode.length > 0
      ? await prisma.coupon.findFirst({
          where: {
            code: couponCode,
            isActive: true,
          },
        })
      : null;

  if (coupon?.expiresAt && coupon.expiresAt < new Date()) {
    coupon = null;
  }

  if (coupon?.planScope && coupon.planScope !== plan.scope) {
    coupon = null;
  }

  if (coupon?.trackId && coupon.trackId !== plan.trackId) {
    coupon = null;
  }

  if (coupon?.maxUses !== null && coupon?.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    coupon = null;
  }

  if (coupon?.perUserLimit) {
    const userRedemptions = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        userId: user.id,
      },
    });

    if (userRedemptions >= coupon.perUserLimit) {
      coupon = null;
    }
  }

  const pricing = calculateDiscountedPrice(plan.priceCents, coupon);
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

  redirect("/dashboard/billing?success=submitted");
}

export async function approvePaymentAction(formData: FormData) {
  const admin = await requireAdmin();
  const paymentRequestId = String(formData.get("paymentRequestId") || "");
  const adminNote = String(formData.get("adminNote") || "").trim();

  if (!paymentRequestId) {
    redirect("/admin/payments?error=missing-id");
  }

  await activateMembershipFromPayment({
    paymentRequestId,
    actorUserId: admin.id,
    adminNote: adminNote || null,
  });

  redirect("/admin/payments?success=approved");
}

export async function rejectPaymentAction(formData: FormData) {
  const admin = await requireAdmin();
  const paymentRequestId = String(formData.get("paymentRequestId") || "");
  const adminNote = String(formData.get("adminNote") || "").trim();

  if (!paymentRequestId) {
    redirect("/admin/payments?error=missing-id");
  }

  await rejectPaymentRequest({
    paymentRequestId,
    actorUserId: admin.id,
    adminNote: adminNote || null,
  });

  redirect("/admin/payments?success=rejected");
}
