import { createFeedbackThreadAction } from "@/app/actions/feedback";
import { getEntitlementSummary, hasTrackAccess, type MembershipWithPlan } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const feedbackStatusLabels: Record<string, string> = {
  SUBMITTED: "تم الإرسال",
  UNDER_REVIEW: "تحت المراجعة",
  REVIEWED: "تمت المراجعة",
  NEEDS_REVISION: "مطلوب تعديل",
  CLOSED: "مغلق",
};

export default async function DashboardFeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser();

  const [memberships, tracks, feedbackThreads] = await Promise.all([
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
      include: {
        roadmapWeeks: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          include: {
            days: {
              orderBy: { order: "asc" },
              include: {
                tasks: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.feedbackThread.findMany({
      where: { userId: user.id },
      include: {
        track: true,
        roadmapTask: {
          include: {
            day: {
              include: {
                week: true,
              },
            },
          },
        },
        messages: {
          include: {
            authorUser: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const entitlements = getEntitlementSummary(memberships);
  const accessibleTracks = tracks.filter((track) => hasTrackAccess(entitlements, track.id));
  const taskOptions = accessibleTracks.flatMap((track) =>
    track.roadmapWeeks.flatMap((week) =>
      week.days.flatMap((day) =>
        day.tasks.map((task) => ({
          id: task.id,
          label: `${track.nameAr} - ${week.titleAr} - ${task.titleAr}`,
        })),
      ),
    ),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Feedback Center
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">ارفع شغلك وتابع الردود في مكان واحد</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          من هنا تسأل على خطوة محددة أو مشروع كامل، تربط الطلب بالمسار أو بالمهمة الحالية، ثم ترى
          الردود والحالة بدون تشتيت.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم إرسال طلب feedback بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          تعذر إرسال الطلب. تأكد من الحقول المطلوبة وأن عندك access للمسار المختار.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">طلب مراجعة جديد</h2>
          {accessibleTracks.length > 0 ? (
            <form action={createFeedbackThreadAction} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="trackId">
                  المسار
                </label>
                <select
                  id="trackId"
                  name="trackId"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  defaultValue={accessibleTracks[0]?.id}
                >
                  {accessibleTracks.map((track) => (
                    <option key={track.id} value={track.id} className="bg-slate-950">
                      {track.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="roadmapTaskId">
                  المهمة المرتبطة
                </label>
                <select
                  id="roadmapTaskId"
                  name="roadmapTaskId"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  defaultValue=""
                >
                  <option value="" className="bg-slate-950">
                    غير مرتبط بمهمة محددة
                  </option>
                  {taskOptions.map((task) => (
                    <option key={task.id} value={task.id} className="bg-slate-950">
                      {task.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="type">
                  نوع التسليم
                </label>
                <select
                  id="type"
                  name="type"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  defaultValue="project"
                >
                  <option value="project" className="bg-slate-950">
                    Project
                  </option>
                  <option value="portfolio" className="bg-slate-950">
                    Portfolio
                  </option>
                  <option value="design-file" className="bg-slate-950">
                    Design File
                  </option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="title">
                  عنوان الطلب
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="مثال: راجع تصميم promo الأسبوع الرابع"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="submissionUrl">
                  رابط العمل
                </label>
                <input
                  id="submissionUrl"
                  name="submissionUrl"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="رابط Behance أو Drive أو رابط مشاركة"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="note">
                  ماذا تريد مراجعته؟
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={5}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="اكتب ما الذي تريد رأيًا فيه بالضبط: hierarchy، الألوان، CTA، أو flow العرض..."
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Submit feedback request
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
              افتح مسارًا أولًا من صفحة العضوية حتى تتمكن من إرسال feedback مرتبط بالعمل الحقيقي داخل
              المسار.
            </div>
          )}
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">طلباتك الحالية</h2>
          {feedbackThreads.map((thread) => (
            <div key={thread.id} className="surface rounded-[30px] p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{thread.title}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {thread.track?.nameAr} - {feedbackStatusLabels[thread.status] || thread.status}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {thread.type}
                </span>
              </div>

              {thread.roadmapTask ? (
                <div className="mt-4 rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                  مرتبط بمهمة: {thread.roadmapTask.titleAr} - {thread.roadmapTask.day.week.titleAr}
                </div>
              ) : null}

              {thread.submissionUrl ? (
                <a
                  href={thread.submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm text-[var(--color-accent-soft)] transition hover:text-white"
                >
                  Open submitted link
                </a>
              ) : null}

              <div className="mt-5 space-y-3">
                {thread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl border p-4 text-sm leading-7 ${
                      message.authorRole === "admin"
                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                        : "border-white/6 bg-white/[0.03] text-slate-300"
                    }`}
                  >
                    <p className="font-semibold">
                      {message.authorRole === "admin" ? "رد الإدارة" : message.authorUser?.name || "أنت"}
                    </p>
                    <p className="mt-2">{message.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {feedbackThreads.length === 0 ? (
            <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
              لا توجد threads بعد. أرسل أول طلب مراجعة عندما تريد ردًا واضحًا على مشروعك أو مهمتك
              الحالية.
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
