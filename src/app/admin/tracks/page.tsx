import { updateTrackCommunityAction } from "@/app/actions/tracks";
import { prisma } from "@/lib/prisma";

export default async function AdminTracksPage() {
  const tracks = await prisma.track.findMany({
    include: {
      community: true,
      plans: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Tracks
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Community gating and track operations</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          في Slice 3، أهم شيء هنا هو تشغيل community gating عمليًا: رابط واتساب موجود في الـ DB، ويمكن تغييره أو تعطيله من الإدارة.
        </p>
      </div>

      <div className="space-y-5">
        {tracks.map((track) => (
          <article key={track.id} className="surface rounded-[30px] p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xl font-semibold text-white">{track.nameAr}</p>
                <p className="mt-2 text-sm leading-7 text-slate-400">{track.summaryAr}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {track.plans.length} plan(s)
              </div>
            </div>

            <form action={updateTrackCommunityAction} className="mt-6 grid gap-4">
              <input type="hidden" name="trackId" value={track.id} />
              <div>
                <label className="mb-2 block text-sm text-slate-300">Community description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={track.community?.description || ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Invite URL</label>
                <input
                  name="inviteUrl"
                  defaultValue={track.community?.inviteUrl || ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Visibility</label>
                <select
                  name="isEnabled"
                  defaultValue={String(track.community?.isEnabled ?? false)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                >
                  <option value="true" className="bg-slate-950">Enabled for entitled members</option>
                  <option value="false" className="bg-slate-950">Hidden</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-fit rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Save community settings
              </button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
