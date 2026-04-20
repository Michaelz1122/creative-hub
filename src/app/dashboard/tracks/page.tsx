import { tracks } from "@/lib/site-content";

export default function DashboardTracksPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          My Tracks
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">المسارات الحالية والقادمة</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          هنا يظهر للمستخدم ما الذي فُتح له الآن، ما القادم لاحقًا، وما progress الحالي لكل مسار بدل أن يشعر أن المحتوى كله متراكم في مكان واحد.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {tracks.map((track) => (
          <article key={track.slug} className="surface rounded-[30px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold text-white">{track.name}</p>
                <p className="mt-1 text-sm text-slate-400">{track.arabicName}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {track.status === "active" ? "Unlocked" : "Coming Soon"}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{track.summary}</p>
            <div className="mt-6 rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Progress model</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Track progress will be calculated from task completions, quiz milestones, and membership entitlements.
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

