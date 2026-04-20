import Image from "next/image";

import { approvePaymentAction, rejectPaymentAction } from "@/app/actions/payments";
import { prisma } from "@/lib/prisma";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [submittedRequests, processedRequests] = await Promise.all([
    prisma.paymentRequest.findMany({
      where: { status: "SUBMITTED" },
      include: {
        user: true,
        plan: {
          include: {
            track: true,
          },
        },
      },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.paymentRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: {
        user: true,
        plan: true,
      },
      orderBy: { reviewedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Payments
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Real payment review queue</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          approve هنا ينشئ أو يحدّث membership فعلية ويضيف notification وaudit log. reject يحدث الحالة ويرسل notification للمستخدم.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Payment request updated successfully.
        </div>
      ) : null}

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold text-white">Submitted requests</h2>
        {submittedRequests.length === 0 ? (
          <div className="surface rounded-[30px] p-6 text-sm text-slate-400">
            No submitted payment requests right now.
          </div>
        ) : (
          submittedRequests.map((request) => {
            const pricingSnapshot = request.pricingSnapshot as {
              originalPrice?: number;
              discountAmount?: number;
              finalPrice?: number;
              currency?: string;
            };

            return (
              <article key={request.id} className="surface rounded-[30px] p-6">
                <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                  <div className="relative min-h-64 overflow-hidden rounded-[28px] border border-white/8">
                    <Image
                      src={request.receiptUrl}
                      alt="Receipt screenshot"
                      fill
                      sizes="(max-width: 1280px) 100vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-400">{request.user.email}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">{request.plan.nameAr}</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                        <p>Phone: {request.phoneNumber}</p>
                        <p className="mt-2">Coupon: {request.couponCodeSnapshot || "None"}</p>
                        <p className="mt-2">Submitted: {new Date(request.submittedAt).toLocaleString()}</p>
                      </div>
                      <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                        <p>Original: {pricingSnapshot.originalPrice} {pricingSnapshot.currency}</p>
                        <p className="mt-2">Discount: {pricingSnapshot.discountAmount} {pricingSnapshot.currency}</p>
                        <p className="mt-2">Final: {pricingSnapshot.finalPrice} {pricingSnapshot.currency}</p>
                      </div>
                    </div>
                    {request.note ? (
                      <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                        {request.note}
                      </div>
                    ) : null}
                    <div className="grid gap-4 md:grid-cols-2">
                      <form action={approvePaymentAction} className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                        <input type="hidden" name="paymentRequestId" value={request.id} />
                        <textarea
                          name="adminNote"
                          rows={3}
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                          placeholder="Approval note"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                        >
                          Approve and unlock access
                        </button>
                      </form>
                      <form action={rejectPaymentAction} className="space-y-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                        <input type="hidden" name="paymentRequestId" value={request.id} />
                        <textarea
                          name="adminNote"
                          rows={3}
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                          placeholder="Rejection note"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-red-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                        >
                          Reject request
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Recently processed</h2>
        <div className="grid gap-4">
          {processedRequests.map((request) => (
            <div
              key={request.id}
              className="surface rounded-[24px] p-4 text-sm leading-7 text-slate-300"
            >
              <p className="font-semibold text-white">
                {request.user.email} - {request.plan.nameAr}
              </p>
              <p className="mt-2">
                {request.status} - {request.adminNote || "No admin note"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
