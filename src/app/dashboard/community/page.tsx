import { getEntitlementSummary, hasTrackAccess, type MembershipWithPlan } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardCommunityPage() {
  const user = await requireUser();
  const [memberships, tracks] = await Promise.all([
    prisma.membership.findMany({
      where: { userId: user.id },
      include: {
        plan: {
          include: {
            track: true,
          },
        },
      },
    }) as Promise<MembershipWithPlan[]>,
    prisma.track.findMany({
      include: {
        community: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const entitlements = getEntitlementSummary(memberships);
  const visibleCommunities = tracks.filter(
    (track) => hasTrackAccess(entitlements, track.id) && track.community?.isEnabled && track.community.inviteUrl,
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Community
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">روابط المجتمع تظهر فقط عند وجود access</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          هنا ترى فقط المجتمعات المفتوحة لك الآن. لا يوجد تعقيد إضافي: إذا كان المسار مفتوحًا على
          حسابك فسيظهر رابط الواتساب الخاص به هنا مباشرة.
        </p>
      </div>

      {visibleCommunities.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {visibleCommunities.map((track) => (
            <article key={track.id} className="surface rounded-[30px] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-white">{track.nameAr}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {track.community?.description || "Members-only track community."}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  متاح الآن
                </span>
              </div>
              <a
                href={track.community?.inviteUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Open WhatsApp community
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
          لا يوجد Community مفتوح على حسابك الآن. فعّل مسارًا أولًا وسيظهر رابط الواتساب الخاص به هنا
          مباشرة.
        </div>
      )}
    </div>
  );
}
