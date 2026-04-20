export default function DashboardNotificationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Notifications
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">In-app + email events</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          المدفوعات، فتح العضوية، quiz availability، feedback review، roadmap reminders، والإعلانات كلها يجب أن تعيش داخل مركز تنبيهات واضح، مع email side effects عند الحاجة.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          "Payment submitted",
          "Payment approved",
          "Feedback reviewed",
          "Quiz available",
          "Milestone achieved",
          "Membership expiry reminder",
        ].map((item) => (
          <div key={item} className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

