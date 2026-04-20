import { adminRespondToFeedbackAction } from "@/app/actions/feedback";
import { prisma } from "@/lib/prisma";

const feedbackStatusLabels: Record<string, string> = {
  SUBMITTED: "تم الإرسال",
  UNDER_REVIEW: "تحت المراجعة",
  REVIEWED: "تمت المراجعة",
  NEEDS_REVISION: "مطلوب تعديل",
  CLOSED: "مغلق",
};

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const threads = await prisma.feedbackThread.findMany({
    include: {
      user: true,
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
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Feedback
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Inbox عملي للرد وتحديث الحالة</h1>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Feedback thread updated successfully.
        </div>
      ) : null}

      <div className="space-y-5">
        {threads.map((thread) => (
          <article key={thread.id} className="surface rounded-[30px] p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{thread.title}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {thread.user.email} - {thread.track?.nameAr} -{" "}
                  {feedbackStatusLabels[thread.status] || thread.status}
                </p>
              </div>
              {thread.submissionUrl ? (
                <a
                  href={thread.submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--color-accent-soft)] transition hover:text-white"
                >
                  Open submission
                </a>
              ) : null}
            </div>

            {thread.roadmapTask ? (
              <div className="mt-4 rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                Linked task: {thread.roadmapTask.titleAr} - {thread.roadmapTask.day.week.titleAr}
              </div>
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
                    {message.authorRole === "admin"
                      ? "Admin"
                      : message.authorUser?.name || message.authorUser?.email || "Learner"}
                  </p>
                  <p className="mt-2">{message.body}</p>
                </div>
              ))}
            </div>

            <form action={adminRespondToFeedbackAction} className="mt-6 space-y-4">
              <input type="hidden" name="threadId" value={thread.id} />
              <select
                name="status"
                defaultValue={thread.status}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              >
                {["SUBMITTED", "UNDER_REVIEW", "REVIEWED", "NEEDS_REVISION", "CLOSED"].map((status) => (
                  <option key={status} value={status} className="bg-slate-950">
                    {feedbackStatusLabels[status]}
                  </option>
                ))}
              </select>
              <textarea
                name="reply"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                placeholder="اكتب ردًا واضحًا وعمليًا للمتعلم"
              />
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Save reply and status
              </button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
