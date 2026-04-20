import Image from "next/image";

import { submitPaymentAction } from "@/app/actions/payments";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

export default async function DashboardBillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser();
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
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Membership & Billing
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">حالة العضوية والدفع في مكان واحد</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          هنا ترى ما هو مفتوح لك الآن، متى تنتهي العضوية، وما الذي ينتظر المراجعة أو تم قبوله أو رفضه سابقًا.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم إرسال طلب الدفع بنجاح وهو الآن تحت المراجعة.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          تعذر إرسال طلب الدفع. تأكد من الحقول المطلوبة أو من عدم وجود طلب pending حالي.
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Active memberships</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {data?.entitlements.activeMemberships.length || 0}
          </p>
        </div>
        <div className="surface rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Unlocked scope</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {data?.entitlements.hasAllAccess
              ? "All Access"
              : `${data?.entitlements.activeTrackIds.length || 0} track(s)`}
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
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Submit a new payment</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Vodafone Cash فقط حاليًا. ارفع screenshot واضحة وسيذهب الطلب مباشرة إلى admin review queue.
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
                accept="image/*"
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
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-slate-300">لا توجد عضوية مفعلة حتى الآن.</p>
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
                  {request.adminNote ? (
                    <p className="mt-3 text-sm leading-7 text-slate-300">{request.adminNote}</p>
                  ) : null}
                  {request.reviewLogs[0] ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                      Last review action: {request.reviewLogs[0].action}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

