export default function DashboardFeedbackPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Feedback Center
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">مركز مراجعة أنضج من مجرد form بسيط</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          المستخدم سيتمكن من رفع project أو portfolio link، متابعة الحالة، استلام الرد، ومعرفة إذا كان مطلوب revision أو تم إغلاق المراجعة.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          "Submitted",
          "Under Review",
          "Reviewed",
          "Needs Revision",
        ].map((status) => (
          <div key={status} className="surface rounded-[30px] p-6">
            <p className="text-sm font-semibold text-white">{status}</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Status-driven workflow with history, notes, and future capacity for richer response formats.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

