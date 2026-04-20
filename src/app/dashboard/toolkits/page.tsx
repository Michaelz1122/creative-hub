import { getEntitlementSummary, hasTrackAccess, type MembershipWithPlan } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardToolkitsPage({
  searchParams,
}: {
  searchParams?: Promise<{ track?: string; category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser();

  const [memberships, tracks, toolkitItems] = await Promise.all([
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
      orderBy: { createdAt: "asc" },
    }),
    prisma.toolkitItem.findMany({
      where: {
        isPublished: true,
        ...(resolvedSearchParams?.track ? { trackId: resolvedSearchParams.track } : {}),
        ...(resolvedSearchParams?.category ? { category: resolvedSearchParams.category } : {}),
      },
      include: {
        track: true,
        roadmapLinks: {
          include: {
            task: {
              include: {
                day: {
                  include: {
                    week: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const entitlements = getEntitlementSummary(memberships);
  const categories = Array.from(new Set(toolkitItems.map((item) => item.category)));
  const groupedItems = categories.map((category) => ({
    category,
    items: toolkitItems.filter((item) => item.category === category),
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Toolkit Layer
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">افتح فقط الأدوات التي تخدم خطوتك الحالية</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          الـ toolkits هنا طبقة دعم حقيقية للمسار. كل item يظهر مع فئته وهل هي مفتوحة لك الآن، وإن
          كانت مرتبطة بمهمة في الـ roadmap فسيظهر مكانها.
        </p>
      </div>

      <form className="surface rounded-[30px] p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <select
            name="track"
            defaultValue={resolvedSearchParams?.track || ""}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          >
            <option value="" className="bg-slate-950">
              كل المسارات
            </option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id} className="bg-slate-950">
                {track.nameAr}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={resolvedSearchParams?.category || ""}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          >
            <option value="" className="bg-slate-950">
              كل الفئات
            </option>
            {categories.map((category) => (
              <option key={category} value={category} className="bg-slate-950">
                {category}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Apply filters
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {groupedItems.map((group) => (
          <section key={group.category} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-white">{group.category}</h2>
              <span className="text-sm text-slate-500">{group.items.length} item(s)</span>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {group.items.map((item) => {
                const unlocked = hasTrackAccess(entitlements, item.trackId);

                return (
                  <article key={item.id} className="surface rounded-[30px] p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {item.track?.nameAr}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          unlocked
                            ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                            : "border border-amber-400/20 bg-amber-500/10 text-amber-200"
                        }`}
                      >
                        {unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-white">{item.titleAr}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.summaryAr}</p>
                    {item.roadmapLinks[0]?.task ? (
                      <div className="mt-4 rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                        مرتبط بمهمة: {item.roadmapLinks[0].task.titleAr} -{" "}
                        {item.roadmapLinks[0].task.day.week.titleAr}
                      </div>
                    ) : null}
                    {unlocked && item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex text-sm text-[var(--color-accent-soft)] transition hover:text-white"
                      >
                        Open toolkit item
                      </a>
                    ) : (
                      <p className="mt-5 text-sm text-slate-500">
                        هذه الأداة ستظهر للاستخدام بعد فتح المسار المناسب.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {toolkitItems.length === 0 ? (
        <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
          لا توجد أدوات مطابقة للفلاتر الحالية.
        </div>
      ) : null}
    </div>
  );
}
