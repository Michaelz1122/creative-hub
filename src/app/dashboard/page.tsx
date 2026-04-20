import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { completeTaskAction } from "@/app/actions/roadmap";
import { getDashboardData } from "@/lib/dashboard";
import { requireUser } from "@/lib/auth";

export default async function DashboardOverviewPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  if (!data) {
    return null;
  }

  const learnerName = data.user.name || data.user.email;
  const activeMembership = data.entitlements.activeMemberships[0];

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface rounded-[30px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Welcome back</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">
                {learnerName}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                هذا الـ dashboard أصبح يقرأ العضويات الحقيقية والـ roadmap الحقيقية من قاعدة البيانات. هدفه أن يخبرك الآن: هل عندك access، ما الأسبوع الحالي، وما المهمة التالية.
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:text-white"
              >
                Logout
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Membership</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {activeMembership?.plan.name ?? "No active membership"}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Track access</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {data.entitlements.hasAllAccess
                  ? "All access"
                  : `${data.entitlements.activeTrackIds.length} active track`}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pending payment</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {data.pendingPayment ? "Under review" : "No pending request"}
              </p>
            </div>
          </div>
        </div>

        <div className="surface rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent-soft)]">
            Continue learning
          </p>
          {data.primaryTrack && data.primaryTrack.accessible ? (
            <>
              <h2 className="mt-3 text-2xl font-semibold text-white">{data.primaryTrack.name}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Progress: {data.primaryTrack.completedTasks}/{data.primaryTrack.totalTasks} tasks completed.
              </p>
              <div className="mt-5 h-3 rounded-full bg-white/8">
                <div
                  className="h-3 rounded-full bg-[var(--color-accent)]"
                  style={{ width: `${data.primaryTrack.progressPercent}%` }}
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/tracks/${data.primaryTrack.slug}`}
                  className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                >
                  Open track workspace
                </Link>
                <Link
                  href="/dashboard/roadmap"
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                >
                  Open roadmap
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-2xl font-semibold text-white">Unlock your first track</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                لا يوجد access فعّال حتى الآن. ارفع إثبات الدفع من صفحة billing ليتم فتح المسار بعد المراجعة.
              </p>
              <Link
                href="/dashboard/billing"
                className="mt-6 inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Go to billing
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Current week</h2>
          {data.currentWeek ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                <p className="text-lg font-semibold text-white">{data.currentWeek.titleAr}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{data.currentWeek.objectiveAr}</p>
              </div>
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Expected outcome</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {data.currentWeek.expectedOutcomeAr}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-400">No active week yet.</p>
          )}
        </article>

        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Today&apos;s next task</h2>
          {data.todayTask ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">{data.todayTask.day.titleAr}</p>
                <p className="mt-2 text-lg font-semibold text-white">{data.todayTask.titleAr}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{data.todayTask.instructionsAr}</p>
              </div>
              <form action={completeTaskAction}>
                <input type="hidden" name="taskId" value={data.todayTask.id} />
                <input type="hidden" name="redirectTo" value="/dashboard" />
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                >
                  Mark task as complete
                </button>
              </form>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-400">All visible tasks are completed.</p>
          )}
        </article>
      </section>

      <section className="surface rounded-[30px] p-6">
        <h2 className="text-2xl font-semibold text-white">Notifications</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300"
            >
              <p className="font-semibold text-white">{notification.titleAr}</p>
              <p className="mt-2">{notification.bodyAr || notification.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
