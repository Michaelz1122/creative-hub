import Image from "next/image";

import { redeemFreeCouponAction, submitPaymentAction } from "@/app/actions/payments";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { getReceiptUploadRules } from "@/lib/storage";

const billingErrorMessages: Record<string, string> = {
  "invalid-plan": "الخطة المختارة غير صالحة أو لم تعد نشطة.",
  "pending-exists": "لديك بالفعل طلب دفع قيد المراجعة. انتظر مراجعته أولًا قبل إرسال طلب جديد.",
  "missing-file": "ارفع صورة واضحة لإثبات الدفع قبل الإرسال.",
  "empty-file": "ملف الإيصال فارغ. جرّب رفع صورة صحيحة.",
  "file-too-large": "حجم صورة الإيصال أكبر من الحد المسموح. حاول تقليل الحجم ثم أعد الرفع.",
  "invalid-file-type": "نوع الملف غير مدعوم. ارفع PNG أو JPG أو WEBP فقط.",
  "storage-not-configured": "رفع الإيصالات غير متاح حاليًا. تواصل مع الإدارة أو جرّب لاحقًا.",
  "upload-unreachable": "تعذر الوصول إلى خدمة رفع الإيصالات. حاول مرة أخرى بعد قليل.",
  "upload-failed": "فشل رفع الإيصال. حاول مرة أخرى بصورة أوضح.",
  "upload-invalid-response": "اكتمل الرفع بشكل غير مكتمل. حاول مرة أخرى.",
  "invalid-coupon": "الكوبون غير صحيح.",
  "coupon-expired": "هذا الكوبون انتهت صلاحيته.",
  "coupon-scope-mismatch": "هذا الكوبون لا ينطبق على الخطة المختارة.",
  "coupon-track-mismatch": "هذا الكوبون لا ينطبق على هذا المسار.",
  "coupon-maxed": "تم الوصول إلى الحد الأقصى لاستخدام هذا الكوبون.",
  "coupon-user-limit": "وصلت للحد المسموح لك لاستخدام هذا الكوبون.",
  "coupon-not-free": "هذا الكوبون ليس كوبون وصول مجاني مباشر.",
  "membership-already-active": "هذه العضوية مفعّلة بالفعل على حسابك.",
  "payment-submit-rate-limited": "تم إيقاف إرسال طلبات الدفع مؤقتًا بسبب كثرة المحاولات. حاول مرة أخرى بعد قليل.",
  "coupon-redeem-rate-limited": "تم إيقاف تفعيل الكوبونات مؤقتًا بسبب كثرة المحاولات. حاول مرة أخرى بعد قليل.",
};

const billingSuccessMessages: Record<string, string> = {
  submitted: "تم إرسال طلب الدفع بنجاح وهو الآن تحت المراجعة.",
  "free-redeemed": "تم تفعيل الوصول المجاني على حسابك مباشرة.",
};

function renderBanner(type: "success" | "error", code?: string) {
  if (!code) {
    return null;
  }

  const message =
    type === "success"
      ? billingSuccessMessages[code] || "تم تنفيذ الإجراء بنجاح."
      : billingErrorMessages[code] || "تعذر إكمال الطلب. راجع البيانات ثم أعد المحاولة.";

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        type === "success"
          ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
          : "border border-red-400/20 bg-red-500/10 text-red-100"
      }`}
    >
      {message}
    </div>
  );
}

export default async function DashboardBillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser();
  const uploadRules = getReceiptUploadRules();

  const [plans, paymentRequests, data] = await Promise.all([
    prisma.plan.findMany({
      where: { isActive: true },
      include: { track: true },
      orderBy: { priceCents: "asc" },
    }),
    prisma.paymentRequest.findMany({
      where: { userId: user.id },
      include: {
        plan: true,
        reviewLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
    getDashboardData(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">Membership & Billing</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">حالة العضوية والدفع في مكان واحد</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          هنا ترى ما هو مفتوح لك الآن، متى تنتهي العضوية، وما الذي ينتظر المراجعة أو تم قبوله أو رفضه سابقًا.
        </p>
      </div>

      {renderBanner("success", resolvedSearchParams?.success)}
      {renderBanner("error", resolvedSearchParams?.error)}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Active memberships</p>
          <p className="mt-3 text-3xl font-semibold text-white">{data?.entitlements.activeMemberships.length || 0}</p>
        </div>
        <div className="surface rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Unlocked scope</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {data?.entitlements.hasAllAccess ? "All Access" : `${data?.entitlements.activeTrackIds.length || 0} track(s)`}
          </p>
        </div>
        <div className="surface rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pending requests</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {paymentRequests.filter((request) => request.status === "SUBMITTED").length}
          </p>
        </div>
        <div className="surface rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Next expiry</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {data?.entitlements.activeMemberships[0]?.expiresAt
              ? new Date(data.entitlements.activeMemberships[0].expiresAt).toLocaleDateString()
              : "No active expiry"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="space-y-6">
          <div className="surface rounded-[30px] p-6">
            <h2 className="text-2xl font-semibold text-white">Submit a new payment</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Vodafone Cash فقط حاليًا. ارفع screenshot واضحة، وسيذهب الطلب مباشرة إلى admin review queue.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
              Supported: PNG / JPG / WEBP - Max {Math.round(uploadRules.maxBytes / 1024 / 1024)} MB
            </p>

            <form action={submitPaymentAction} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="planId">
                  Plan
                </label>
                <select
                  id="planId"
                  name="planId"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  defaultValue={plans[0]?.id}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id} className="bg-slate-950">
                      {plan.nameAr} - {plan.priceCents} {plan.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="phoneNumber">
                  Vodafone Cash number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="couponCode">
                  Coupon code
                </label>
                <input
                  id="couponCode"
                  name="couponCode"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="WELCOME10"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="receipt">
                  Receipt screenshot
                </label>
                <input
                  id="receipt"
                  name="receipt"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:text-slate-950"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="note">
                  Note
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="أي ملاحظة إضافية للإدارة"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Submit payment request
              </button>
            </form>
          </div>

          <div className="surface rounded-[30px] p-6">
            <h2 className="text-2xl font-semibold text-white">Redeem free access coupon</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              لو لديك كوبون مجاني مباشر، فعّل الوصول من هنا بدون رفع إيصال. سيتم تطبيق نفس قيود الصلاحية والنطاق والحدود.
            </p>
            <form action={redeemFreeCouponAction} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="freePlanId">
                  Plan
                </label>
                <select
                  id="freePlanId"
                  name="planId"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  defaultValue={plans[0]?.id}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id} className="bg-slate-950">
                      {plan.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="freeCouponCode">
                  Free coupon code
                </label>
                <input
                  id="freeCouponCode"
                  name="couponCode"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="FREEGD"
                />
              </div>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
              >
                Redeem free coupon
              </button>
            </form>
          </div>
        </article>

        <article className="space-y-5">
          <div className="surface rounded-[30px] p-6">
            <h2 className="text-2xl font-semibold text-white">Current unlocked access</h2>
            {data?.entitlements.activeMemberships.length ? (
              <div className="mt-5 space-y-3">
                {data.entitlements.activeMemberships.map((membership) => (
                  <div key={membership.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                    <p className="font-semibold text-white">{membership.plan.nameAr}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Active until {membership.expiresAt ? new Date(membership.expiresAt).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {membership.plan.scope === "ALL_ACCESS"
                        ? "يفتح كل المسارات النشطة."
                        : `يفتح مسار ${membership.plan.track?.nameAr || membership.plan.nameAr}.`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-slate-300">لا توجد عضوية مفعّلة حتى الآن.</p>
            )}
          </div>

          <div className="surface rounded-[30px] p-6">
            <h2 className="text-2xl font-semibold text-white">Payment request history</h2>
            <div className="mt-5 space-y-4">
              {paymentRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-white">{request.plan.nameAr}</p>
                      <p className="mt-2 text-sm text-slate-400">
                        {request.status} - {new Date(request.submittedAt).toLocaleDateString()}
                      </p>
                      {request.reviewedAt ? (
                        <p className="mt-1 text-sm text-slate-500">
                          Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/8">
                      <Image src={request.receiptUrl} alt="Receipt" fill sizes="80px" className="object-cover" />
                    </div>
                  </div>
                  {request.adminNote ? <p className="mt-3 text-sm leading-7 text-slate-300">{request.adminNote}</p> : null}
                  {request.reviewLogs[0] ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                      Last review action: {request.reviewLogs[0].action}
                    </p>
                  ) : null}
                </div>
              ))}
              {paymentRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                  لا توجد طلبات دفع بعد على هذا الحساب.
                </div>
              ) : null}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
