import { adminSnapshot } from "@/lib/site-content";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Admin Overview
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Control center foundation</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          هذه الصفحة تمثل نقطة البداية لـ admin أهدأ وأوضح: صورة تشغيلية، queue review، ومداخل منظمة لباقي المجالات بدل التشتت في صفحات كثيرة غير مترابطة.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Total users", value: adminSnapshot.totalUsers },
          { label: "Active memberships", value: adminSnapshot.activeMemberships },
          { label: "Pending payments", value: adminSnapshot.pendingPayments },
          { label: "Pending feedback", value: adminSnapshot.pendingFeedback },
          { label: "Approval rate", value: adminSnapshot.approvalRate },
          { label: "Top demand", value: adminSnapshot.topDemand },
        ].map((item) => (
          <div key={item.label} className="surface rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">What changes in the new admin?</h2>
          <div className="mt-5 space-y-3">
            {[
              "Permissions become modular and action-based",
              "Payments move into a real review queue",
              "Roadmap builder becomes first-class",
              "Landing builder stays, but cleaner and more structured",
              "Emails, announcements, and settings become operational modules",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </article>
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Core queues</h2>
          <div className="mt-5 space-y-3">
            {[
              "Pending payments with screenshot preview",
              "Feedback inbox by track and status",
              "Roadmap publishing states",
              "Membership expiry and renewal signals",
              "Audit logs for sensitive actions",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
