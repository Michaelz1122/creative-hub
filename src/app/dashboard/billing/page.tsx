export default function DashboardBillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Membership & Billing
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">عضويات واضحة ودفع يدوي مرتب</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          كل payment request يجب أن يحتفظ بـ plan snapshot، coupon snapshot، receipt URL، review notes، وmembership unlock action حتى يكون الـ audit trail نظيفًا.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">User flow</h2>
          <div className="mt-5 space-y-3">
            {[
              "Choose annual plan",
              "See Vodafone Cash instructions",
              "Upload receipt screenshot",
              "Wait for review",
              "Receive approval or rejection",
            ].map((step) => (
              <div key={step} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {step}
              </div>
            ))}
          </div>
        </article>
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Stored data</h2>
          <div className="mt-5 space-y-3">
            {[
              "Plan selected at purchase time",
              "Coupon code snapshot",
              "Original and discounted amount",
              "Admin notes and review timestamp",
              "Membership entitlement created on approval",
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

