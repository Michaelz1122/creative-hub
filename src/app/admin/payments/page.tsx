export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Payments
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Payment review queue</h1>
      </div>
      <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
        هذه المساحة مخصصة لمراجعة receipts، plan snapshots، coupon snapshots، approve أو reject مع admin note ثم إنشاء entitlement مناسب.
      </div>
    </div>
  );
}

