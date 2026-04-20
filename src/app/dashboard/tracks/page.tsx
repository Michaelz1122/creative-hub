import Link from "next/link";

import { getDashboardData } from "@/lib/dashboard";
import { requireUser } from "@/lib/auth";

export default async function DashboardTracksPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          My Tracks
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">المسارات والـ access الحقيقي</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          كل كارت هنا يعتمد على membership entitlements الفعلية، وليس على placeholder state.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {data.tracks.map((track) => (
          <article key={track.id} className="surface rounded-[30px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-white">{track.name}</p>
                <p className="mt-1 text-sm text-slate-400">{track.nameAr}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {track.accessible ? "Unlocked" : track.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{track.summaryAr}</p>
            <div className="mt-6 rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">Progress</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {track.completedTasks}/{track.totalTasks} tasks
              </p>
            </div>
            {track.accessible ? (
              <Link
                href={`/dashboard/tracks/${track.slug}`}
                className="mt-6 inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Open workspace
              </Link>
            ) : (
              <p className="mt-6 text-sm text-slate-400">
                Access opens after plan approval or all-access membership.
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
