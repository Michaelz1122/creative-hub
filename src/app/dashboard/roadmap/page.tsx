import Link from "next/link";

import { getDashboardData } from "@/lib/dashboard";
import { requireUser } from "@/lib/auth";

export default async function DashboardRoadmapPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  if (!data || !data.primaryTrack) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Roadmap
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Roadmap حقيقية من قاعدة البيانات</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          هذا المنظور يعرض الأسابيع المنشورة الحالية للمسار النشط، مع التقدم المحسوب من `TaskCompletion`.
        </p>
      </div>

      <div className="space-y-4">
        {data.primaryTrack.roadmapWeeks.map((week) => {
          const weekTasks = week.days.flatMap((day) => day.tasks);
          const completedCount = weekTasks.filter((task) => task.completions.length > 0).length;

          return (
            <article key={week.id} className="surface rounded-[30px] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{week.titleAr}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{week.objectiveAr}</p>
                </div>
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
                  {completedCount}/{weekTasks.length} tasks done
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {week.days.slice(0, 3).map((day) => (
                  <div key={day.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-white">{day.titleAr}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{day.descriptionAr}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <Link
        href={`/dashboard/tracks/${data.primaryTrack.slug}`}
        className="inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
      >
        Open full track workspace
      </Link>
    </div>
  );
}
