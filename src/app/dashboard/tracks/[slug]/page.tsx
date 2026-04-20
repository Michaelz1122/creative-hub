import Link from "next/link";
import { notFound } from "next/navigation";

import { completeTaskAction } from "@/app/actions/roadmap";
import { getEntitlementSummary, hasTrackAccess, type MembershipWithPlan } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardTrackWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();

  const [track, memberships] = await Promise.all([
    prisma.track.findUnique({
      where: { slug },
      include: {
        community: true,
        roadmapWeeks: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          include: {
            quizzes: true,
            days: {
              orderBy: { order: "asc" },
              include: {
                tasks: {
                  orderBy: { order: "asc" },
                  include: {
                    completions: {
                      where: { userId: user.id },
                    },
                    resources: {
                      include: {
                        contentItem: true,
                        toolkitItem: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
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
  ]);

  if (!track) {
    notFound();
  }

  const entitlements = getEntitlementSummary(memberships);
  const accessible = hasTrackAccess(entitlements, track.id);
  const firstIncompleteTask =
    track.roadmapWeeks
      .flatMap((week) =>
        week.days.flatMap((day) =>
          day.tasks.map((task) => ({
            ...task,
            day,
            week,
          })),
        ),
      )
      .find((task) => task.completions.length === 0) || null;

  if (!accessible) {
    return (
      <div className="space-y-6">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Locked track
        </p>
        <h1 className="text-4xl font-semibold text-white">{track.nameAr}</h1>
        <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
          هذا المسار موجود فعلًا لكن لا يمكن فتحه قبل تفعيل membership مرتبطة به أو all-access.
          <div className="mt-5">
            <Link
              href="/dashboard/billing"
              className="inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            >
              Go to billing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
            Active learner workspace
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{track.nameAr}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{track.summaryAr}</p>
        </div>
        {track.community?.inviteUrl && track.community.isEnabled ? (
          <a
            href={track.community.inviteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
          >
            Open WhatsApp community
          </a>
        ) : null}
      </div>

      {firstIncompleteTask ? (
        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="surface rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent-soft)]">
              What should I do now?
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{firstIncompleteTask.titleAr}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{firstIncompleteTask.instructionsAr}</p>
            <p className="mt-3 text-sm text-slate-400">
              الناتج المطلوب الآن: {firstIncompleteTask.expectedOutputAr}
            </p>
          </article>
          <article className="surface rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent-soft)]">
              Relevant help
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                {firstIncompleteTask.helpNotesAr}
              </div>
              {firstIncompleteTask.resources.map((resource) => (
                <div key={resource.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                  <p className="font-semibold text-white">{resource.label}</p>
                  <p className="mt-2">{resource.contentItem?.titleAr || resource.toolkitItem?.titleAr}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      <div className="space-y-5">
        {track.roadmapWeeks.map((week) => (
          <article key={week.id} className="surface rounded-[30px] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xl font-semibold text-white">{week.titleAr}</p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{week.objectiveAr}</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">{week.expectedOutcomeAr}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Quiz: {week.quizzes[0]?.titleAr || "No quiz yet"}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {week.days.map((day) => (
                <div key={day.id} className="rounded-[26px] border border-white/6 bg-white/[0.03] p-5">
                  <p className="text-lg font-semibold text-white">{day.titleAr}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{day.descriptionAr}</p>
                  <div className="mt-4 space-y-4">
                    {day.tasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-white/6 bg-black/20 p-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="max-w-3xl">
                            <p className="text-base font-semibold text-white">{task.titleAr}</p>
                            <p className="mt-2 text-sm leading-7 text-slate-300">{task.instructionsAr}</p>
                            <p className="mt-3 text-sm text-slate-400">
                              الناتج المتوقع: {task.expectedOutputAr}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              المدة المتوقعة: {task.estimatedMinutes} دقيقة
                            </p>
                          </div>
                          <div className="flex flex-col items-start gap-3">
                            {task.completions.length > 0 ? (
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                                Completed
                              </span>
                            ) : (
                              <form action={completeTaskAction}>
                                <input type="hidden" name="taskId" value={task.id} />
                                <input
                                  type="hidden"
                                  name="redirectTo"
                                  value={`/dashboard/tracks/${track.slug}`}
                                />
                                <button
                                  type="submit"
                                  className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                                >
                                  Mark complete
                                </button>
                              </form>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                            <p className="text-sm font-semibold text-white">Help notes</p>
                            <p className="mt-2 text-sm leading-7 text-slate-400">{task.helpNotesAr}</p>
                          </div>
                          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                            <p className="text-sm font-semibold text-white">Checklist</p>
                            <ul className="mt-2 space-y-2 text-sm text-slate-400">
                              {((task.checklist as string[] | null) || []).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          {task.resources.map((resource) => (
                            <div
                              key={resource.id}
                              className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300"
                            >
                              <p className="font-semibold text-white">{resource.label}</p>
                              <p className="mt-2">
                                {resource.contentItem?.titleAr || resource.toolkitItem?.titleAr}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
