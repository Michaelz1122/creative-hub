import { dashboardSnapshot } from "@/lib/site-content";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface rounded-[30px] p-6">
          <p className="text-sm text-slate-400">Welcome back</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">
            أهلاً {dashboardSnapshot.learnerName}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            الـ dashboard في النسخة الجديدة ليس مجرد links. هو نقطة قرار يومية: ماذا أفعل الآن، ماذا أنهيت، وما الذي ينتظرني هذا الأسبوع.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Membership", value: dashboardSnapshot.membershipLabel },
              { label: "Status", value: dashboardSnapshot.membershipStatus },
              { label: "Completion", value: `${dashboardSnapshot.completionRate}%` },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent-soft)]">
            Start here
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Today&apos;s tasks</h2>
          <div className="mt-5 space-y-3">
            {dashboardSnapshot.todayTasks.map((task) => (
              <div key={task} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-slate-300">
                {task}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Current week snapshot</h2>
          <div className="mt-5 space-y-3">
            {[
              "Objective: build repeatable social media design workflow",
              "Expected output: 2 polished deliverables",
              "Quiz unlock: نهاية الأسبوع",
              "Common blockers: font pairing, export size, hierarchy clarity",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Notifications & reminders</h2>
          <div className="mt-5 space-y-3">
            {dashboardSnapshot.notifications.map((item) => (
              <div key={item} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

