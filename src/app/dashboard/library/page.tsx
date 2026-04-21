import { getEntitlementSummary, hasTrackAccess, type MembershipWithPlan } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    track?: string;
    difficulty?: string;
    required?: string;
    type?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
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
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const entitlements = getEntitlementSummary(memberships);
  const accessibleTrackIds = entitlements.hasAllAccess
    ? undefined
    : tracks.filter((track) => hasTrackAccess(entitlements, track.id)).map((track) => track.id);

  const items = await prisma.contentItem.findMany({
    where: {
      isPublished: true,
      ...(resolvedSearchParams?.track ? { trackId: resolvedSearchParams.track } : {}),
      ...(resolvedSearchParams?.difficulty ? { difficulty: resolvedSearchParams.difficulty as never } : {}),
      ...(resolvedSearchParams?.type ? { type: resolvedSearchParams.type as never } : {}),
      ...(resolvedSearchParams?.required === "required"
        ? { isRequired: true }
        : resolvedSearchParams?.required === "optional"
          ? { isRequired: false }
          : {}),
      ...(accessibleTrackIds ? { trackId: { in: accessibleTrackIds } } : {}),
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
    orderBy: [{ isFeatured: "desc" }, { isRequired: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const accessibleTracks = tracks.filter((track) => hasTrackAccess(entitlements, track.id));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Content Library
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">اعرف ماذا تحتاج الآن فقط</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          المكتبة هنا ليست pile عشوائي. كل item واضح بصعوبته ووقته وهل هو required، وإذا كان
          مرتبطًا بمهمة داخل الـ roadmap فسيظهر لك ذلك مباشرة.
        </p>
      </div>

      <form className="surface rounded-[30px] p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <select
            name="track"
            defaultValue={resolvedSearchParams?.track || ""}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          >
            <option value="" className="bg-slate-950">
              كل المسارات المتاحة
            </option>
            {accessibleTracks.map((track) => (
              <option key={track.id} value={track.id} className="bg-slate-950">
                {track.nameAr}
              </option>
            ))}
          </select>
          <select
            name="difficulty"
            defaultValue={resolvedSearchParams?.difficulty || ""}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          >
            <option value="" className="bg-slate-950">
              كل المستويات
            </option>
            {["BEGINNER", "FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"].map((level) => (
              <option key={level} value={level} className="bg-slate-950">
                {level}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={resolvedSearchParams?.type || ""}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          >
            <option value="" className="bg-slate-950">
              كل الأنواع
            </option>
            {["VIDEO", "ARTICLE", "GUIDE", "NOTE", "REFERENCE", "DOWNLOAD", "CHECKLIST"].map((type) => (
              <option key={type} value={type} className="bg-slate-950">
                {type}
              </option>
            ))}
          </select>
          <select
            name="required"
            defaultValue={resolvedSearchParams?.required || ""}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          >
            <option value="" className="bg-slate-950">
              الكل
            </option>
            <option value="required" className="bg-slate-950">
              Required only
            </option>
            <option value="optional" className="bg-slate-950">
              Optional only
            </option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
        >
          Apply filters
        </button>
      </form>

      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="surface rounded-[30px] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {item.track?.nameAr}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {item.type}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {item.difficulty}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {item.isRequired ? "Required" : "Optional"}
              </span>
              {item.isFeatured ? (
                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                  Featured
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">{item.titleAr}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{item.summaryAr}</p>
            <p className="mt-3 text-sm text-slate-500">الوقت المتوقع: {item.estimatedMinutes} دقيقة</p>
            {item.roadmapLinks[0]?.task ? (
              <div className="mt-4 rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                مرتبط بمهمة: {item.roadmapLinks[0].task.titleAr} - {item.roadmapLinks[0].task.day.week.titleAr}
              </div>
            ) : null}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex text-sm text-[var(--color-accent-soft)] transition hover:text-white"
              >
                Open resource
              </a>
            ) : null}
          </article>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
          لا توجد عناصر تطابق الفلاتر الحالية. غيّر الفلاتر لترى محتوى مناسبًا لخطوتك الحالية.
        </div>
      ) : null}
    </div>
  );
}
