import Link from "next/link";
import type { ReactNode } from "react";

import {
  deleteRoadmapDayAction,
  deleteRoadmapTaskAction,
  deleteRoadmapWeekAction,
  saveRoadmapDayAction,
  saveRoadmapTaskAction,
  saveRoadmapWeekAction,
} from "@/app/actions/roadmap";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputClassName = "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";

function BooleanSelect({
  name,
  value,
  trueLabel,
  falseLabel,
}: {
  name: string;
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <select name={name} defaultValue={String(value)} className={inputClassName}>
      <option value="true" className="bg-slate-950">
        {trueLabel}
      </option>
      <option value="false" className="bg-slate-950">
        {falseLabel}
      </option>
    </select>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function ResourceSelector<T extends { id: string }>({
  name,
  title,
  options,
  selectedIds,
  getLabel,
}: {
  name: string;
  title: string;
  options: T[];
  selectedIds: string[];
  getLabel: (item: T) => string;
}) {
  if (options.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
        لا توجد عناصر متاحة للربط في هذا المسار بعد.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/6 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="grid gap-3">
        {options.map((item) => (
          <label key={item.id} className="flex items-start gap-3 rounded-2xl border border-white/6 p-3 text-sm text-slate-300">
            <input
              type="checkbox"
              name={name}
              value={item.id}
              defaultChecked={selectedIds.includes(item.id)}
              className="mt-1"
            />
            <span>{getLabel(item)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default async function AdminRoadmapPage({
  searchParams,
}: {
  searchParams?: Promise<{ track?: string; week?: string; success?: string; error?: string }>;
}) {
  await requirePermission("roadmap.manage");
  const resolvedSearchParams = await searchParams;
  const tracks = await prisma.track.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const selectedTrackId = resolvedSearchParams?.track || tracks[0]?.id || "";
  const selectedTrack = selectedTrackId
    ? await prisma.track.findUnique({
        where: { id: selectedTrackId },
        include: {
          contentItems: {
            orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
          },
          toolkitItems: {
            orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          },
          roadmapWeeks: {
            orderBy: { order: "asc" },
            include: {
              quizzes: {
                orderBy: { createdAt: "asc" },
              },
              days: {
                orderBy: { order: "asc" },
                include: {
                  tasks: {
                    orderBy: { order: "asc" },
                    include: {
                      resources: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    : null;

  const selectedWeek =
    selectedTrack?.roadmapWeeks.find((week) => week.id === resolvedSearchParams?.week) ||
    selectedTrack?.roadmapWeeks[0] ||
    null;
  const selectedQuiz = selectedWeek?.quizzes[0] || null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Roadmap Builder
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">إدارة الـ roadmap خطوة بخطوة</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          اختر المسار ثم الأسبوع الذي تريد تشغيله. من نفس الصفحة تقدر تضيف أسابيع وأيام ومهام، وتربط المحتوى والأدوات، وتحدد
          الـ expected output والـ help notes والـ quiz الأسبوعي.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم حفظ آخر تعديل في الـ roadmap بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          لم يكتمل الحفظ. تأكد من الحقول الأساسية ثم أعد المحاولة.
        </div>
      ) : null}

      <section className="surface rounded-[30px] p-6">
        <p className="text-sm text-slate-400">اختر المسار الذي تعمل عليه الآن</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {tracks.map((track) => (
            <Link
              key={track.id}
              href={`/admin/roadmap?track=${track.id}`}
              className={`rounded-full px-4 py-2 text-sm transition ${
                track.id === selectedTrackId
                  ? "bg-[var(--color-accent)] font-semibold text-slate-950"
                  : "border border-white/10 text-white hover:border-white/20 hover:bg-white/5"
              }`}
            >
              {track.nameAr}
            </Link>
          ))}
        </div>
      </section>

      {selectedTrack ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="surface rounded-[30px] p-6">
              <h2 className="text-2xl font-semibold text-white">إضافة أسبوع جديد</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                ابدأ بعنوان واضح وهدف أسبوعي بسيط، ثم أضف الشرح والناتج المتوقع وانشره عندما يصبح جاهزًا.
              </p>
              <form action={saveRoadmapWeekAction} className="mt-6 grid gap-4">
                <input type="hidden" name="trackId" value={selectedTrack.id} />
                <div className="grid gap-4 xl:grid-cols-3">
                  <Field label="الترتيب">
                    <input name="order" type="number" min={1} defaultValue={selectedTrack.roadmapWeeks.length + 1} className={inputClassName} />
                  </Field>
                  <Field label="النشر">
                    <BooleanSelect name="isPublished" value={false} trueLabel="Published" falseLabel="Draft" />
                  </Field>
                  <Field label="Quiz publish">
                    <BooleanSelect name="quizIsPublished" value={false} trueLabel="Published" falseLabel="Draft" />
                  </Field>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Field label="العنوان">
                    <input name="title" className={inputClassName} />
                  </Field>
                  <Field label="العنوان بالعربي">
                    <input name="titleAr" className={inputClassName} />
                  </Field>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Field label="الهدف الأسبوعي">
                    <textarea name="objective" rows={3} className={inputClassName} />
                  </Field>
                  <Field label="الهدف الأسبوعي بالعربي">
                    <textarea name="objectiveAr" rows={3} className={inputClassName} />
                  </Field>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Field label="شرح إضافي">
                    <textarea name="explanation" rows={3} className={inputClassName} />
                  </Field>
                  <Field label="شرح إضافي بالعربي">
                    <textarea name="explanationAr" rows={3} className={inputClassName} />
                  </Field>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Field label="الناتج المتوقع">
                    <textarea name="expectedOutcome" rows={3} className={inputClassName} />
                  </Field>
                  <Field label="الناتج المتوقع بالعربي">
                    <textarea name="expectedOutcomeAr" rows={3} className={inputClassName} />
                  </Field>
                </div>
                <div className="grid gap-4 xl:grid-cols-4">
                  <Field label="Quiz title">
                    <input name="quizTitle" className={inputClassName} />
                  </Field>
                  <Field label="Quiz title بالعربي">
                    <input name="quizTitleAr" className={inputClassName} />
                  </Field>
                  <Field label="Quiz scope">
                    <select name="quizScope" defaultValue="weekly" className={inputClassName}>
                      <option value="weekly" className="bg-slate-950">
                        weekly
                      </option>
                      <option value="milestone" className="bg-slate-950">
                        milestone
                      </option>
                      <option value="final" className="bg-slate-950">
                        final
                      </option>
                    </select>
                  </Field>
                  <Field label="Passing score">
                    <input name="quizPassingScore" type="number" min={0} max={100} defaultValue={70} className={inputClassName} />
                  </Field>
                </div>
                <button
                  type="submit"
                  className="w-fit rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                >
                  Create week
                </button>
              </form>
            </article>

            <article className="surface rounded-[30px] p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">أسابيع {selectedTrack.nameAr}</h2>
                <span className="text-sm text-slate-500">{selectedTrack.roadmapWeeks.length} week(s)</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {selectedTrack.roadmapWeeks.map((week) => (
                  <Link
                    key={week.id}
                    href={`/admin/roadmap?track=${selectedTrack.id}&week=${week.id}`}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      selectedWeek?.id === week.id
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent-soft)]"
                        : "border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="font-semibold">{week.order}. {week.titleAr}</div>
                    <div className="mt-1 text-xs text-slate-500">{week.isPublished ? "Published" : "Draft"}</div>
                  </Link>
                ))}
              </div>
            </article>
          </section>

          {selectedWeek ? (
            <>
              <section className="surface rounded-[30px] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">الأسبوع المحدد الآن</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{selectedWeek.titleAr}</h2>
                  </div>
                  <form action={deleteRoadmapWeekAction}>
                    <input type="hidden" name="weekId" value={selectedWeek.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                    >
                      Delete week
                    </button>
                  </form>
                </div>

                <form action={saveRoadmapWeekAction} className="mt-6 grid gap-4">
                  <input type="hidden" name="trackId" value={selectedTrack.id} />
                  <input type="hidden" name="weekId" value={selectedWeek.id} />
                  {selectedQuiz ? <input type="hidden" name="quizId" value={selectedQuiz.id} /> : null}
                  <div className="grid gap-4 xl:grid-cols-3">
                    <Field label="الترتيب">
                      <input name="order" type="number" min={1} defaultValue={selectedWeek.order} className={inputClassName} />
                    </Field>
                    <Field label="النشر">
                      <BooleanSelect name="isPublished" value={selectedWeek.isPublished} trueLabel="Published" falseLabel="Draft" />
                    </Field>
                    <Field label="Quiz publish">
                      <BooleanSelect name="quizIsPublished" value={selectedQuiz?.isPublished ?? false} trueLabel="Published" falseLabel="Draft" />
                    </Field>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Field label="العنوان">
                      <input name="title" defaultValue={selectedWeek.title} className={inputClassName} />
                    </Field>
                    <Field label="العنوان بالعربي">
                      <input name="titleAr" defaultValue={selectedWeek.titleAr} className={inputClassName} />
                    </Field>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Field label="الهدف الأسبوعي">
                      <textarea name="objective" rows={3} defaultValue={selectedWeek.objective} className={inputClassName} />
                    </Field>
                    <Field label="الهدف الأسبوعي بالعربي">
                      <textarea name="objectiveAr" rows={3} defaultValue={selectedWeek.objectiveAr} className={inputClassName} />
                    </Field>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Field label="شرح إضافي">
                      <textarea name="explanation" rows={3} defaultValue={selectedWeek.explanation || ""} className={inputClassName} />
                    </Field>
                    <Field label="شرح إضافي بالعربي">
                      <textarea name="explanationAr" rows={3} defaultValue={selectedWeek.explanationAr || ""} className={inputClassName} />
                    </Field>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Field label="الناتج المتوقع">
                      <textarea name="expectedOutcome" rows={3} defaultValue={selectedWeek.expectedOutcome || ""} className={inputClassName} />
                    </Field>
                    <Field label="الناتج المتوقع بالعربي">
                      <textarea name="expectedOutcomeAr" rows={3} defaultValue={selectedWeek.expectedOutcomeAr || ""} className={inputClassName} />
                    </Field>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-4">
                    <Field label="Quiz title">
                      <input name="quizTitle" defaultValue={selectedQuiz?.title || ""} className={inputClassName} />
                    </Field>
                    <Field label="Quiz title بالعربي">
                      <input name="quizTitleAr" defaultValue={selectedQuiz?.titleAr || ""} className={inputClassName} />
                    </Field>
                    <Field label="Quiz scope">
                      <select name="quizScope" defaultValue={selectedQuiz?.scope || "weekly"} className={inputClassName}>
                        <option value="weekly" className="bg-slate-950">
                          weekly
                        </option>
                        <option value="milestone" className="bg-slate-950">
                          milestone
                        </option>
                        <option value="final" className="bg-slate-950">
                          final
                        </option>
                      </select>
                    </Field>
                    <Field label="Passing score">
                      <input
                        name="quizPassingScore"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={selectedQuiz?.passingScore ?? 70}
                        className={inputClassName}
                      />
                    </Field>
                  </div>
                  <button
                    type="submit"
                    className="w-fit rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                  >
                    Save week details
                  </button>
                </form>
              </section>

              <section className="surface rounded-[30px] p-6">
                <h2 className="text-2xl font-semibold text-white">إضافة يوم جديد داخل {selectedWeek.titleAr}</h2>
                <form action={saveRoadmapDayAction} className="mt-6 grid gap-4 xl:grid-cols-5">
                  <input type="hidden" name="weekId" value={selectedWeek.id} />
                  <Field label="الترتيب">
                    <input name="order" type="number" min={1} defaultValue={selectedWeek.days.length + 1} className={inputClassName} />
                  </Field>
                  <Field label="العنوان">
                    <input name="title" className={inputClassName} />
                  </Field>
                  <Field label="العنوان بالعربي">
                    <input name="titleAr" className={inputClassName} />
                  </Field>
                  <Field label="الوقت بالدقائق">
                    <input name="estimatedMinutes" type="number" min={0} defaultValue={0} className={inputClassName} />
                  </Field>
                  <Field label="الحالة">
                    <BooleanSelect name="isLockedByDefault" value={false} trueLabel="Locked by default" falseLabel="Open" />
                  </Field>
                  <div className="xl:col-span-2">
                    <Field label="وصف">
                      <textarea name="description" rows={3} className={inputClassName} />
                    </Field>
                  </div>
                  <div className="xl:col-span-2">
                    <Field label="وصف بالعربي">
                      <textarea name="descriptionAr" rows={3} className={inputClassName} />
                    </Field>
                  </div>
                  <div className="xl:self-end">
                    <button
                      type="submit"
                      className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                    >
                      Create day
                    </button>
                  </div>
                </form>
              </section>

              <div className="space-y-6">
                {selectedWeek.days.map((day) => (
                  <article key={day.id} className="surface rounded-[30px] p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Day {day.order}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{day.titleAr}</h3>
                      </div>
                      <form action={deleteRoadmapDayAction}>
                        <input type="hidden" name="dayId" value={day.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                        >
                          Delete day
                        </button>
                      </form>
                    </div>

                    <form action={saveRoadmapDayAction} className="mt-6 grid gap-4">
                      <input type="hidden" name="weekId" value={selectedWeek.id} />
                      <input type="hidden" name="dayId" value={day.id} />
                      <div className="grid gap-4 xl:grid-cols-5">
                        <Field label="الترتيب">
                          <input name="order" type="number" min={1} defaultValue={day.order} className={inputClassName} />
                        </Field>
                        <Field label="العنوان">
                          <input name="title" defaultValue={day.title} className={inputClassName} />
                        </Field>
                        <Field label="العنوان بالعربي">
                          <input name="titleAr" defaultValue={day.titleAr} className={inputClassName} />
                        </Field>
                        <Field label="الوقت بالدقائق">
                          <input
                            name="estimatedMinutes"
                            type="number"
                            min={0}
                            defaultValue={day.estimatedMinutes ?? 0}
                            className={inputClassName}
                          />
                        </Field>
                        <Field label="الحالة">
                          <BooleanSelect
                            name="isLockedByDefault"
                            value={day.isLockedByDefault}
                            trueLabel="Locked by default"
                            falseLabel="Open"
                          />
                        </Field>
                      </div>
                      <div className="grid gap-4 xl:grid-cols-2">
                        <Field label="وصف">
                          <textarea name="description" rows={3} defaultValue={day.description || ""} className={inputClassName} />
                        </Field>
                        <Field label="وصف بالعربي">
                          <textarea name="descriptionAr" rows={3} defaultValue={day.descriptionAr || ""} className={inputClassName} />
                        </Field>
                      </div>
                      <button
                        type="submit"
                        className="w-fit rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                      >
                        Save day changes
                      </button>
                    </form>

                    <div className="mt-8 rounded-[26px] border border-dashed border-white/10 p-5">
                      <h4 className="text-lg font-semibold text-white">إضافة مهمة جديدة</h4>
                      <form action={saveRoadmapTaskAction} className="mt-5 grid gap-4">
                        <input type="hidden" name="dayId" value={day.id} />
                        <div className="grid gap-4 xl:grid-cols-5">
                          <Field label="الترتيب">
                            <input name="order" type="number" min={1} defaultValue={day.tasks.length + 1} className={inputClassName} />
                          </Field>
                          <Field label="العنوان">
                            <input name="title" className={inputClassName} />
                          </Field>
                          <Field label="العنوان بالعربي">
                            <input name="titleAr" className={inputClassName} />
                          </Field>
                          <Field label="الوقت بالدقائق">
                            <input name="estimatedMinutes" type="number" min={0} defaultValue={0} className={inputClassName} />
                          </Field>
                          <Field label="الحفظ">
                            <button
                              type="submit"
                              className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                            >
                              Create task
                            </button>
                          </Field>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          <Field label="Why it matters">
                            <textarea name="whyItMatters" rows={3} className={inputClassName} />
                          </Field>
                          <Field label="ليه المهمة دي مهمة؟">
                            <textarea name="whyItMattersAr" rows={3} className={inputClassName} />
                          </Field>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          <Field label="Instructions">
                            <textarea name="instructions" rows={4} className={inputClassName} />
                          </Field>
                          <Field label="الخطوات بالعربي">
                            <textarea name="instructionsAr" rows={4} className={inputClassName} />
                          </Field>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          <Field label="Expected output">
                            <textarea name="expectedOutput" rows={3} className={inputClassName} />
                          </Field>
                          <Field label="الناتج المتوقع بالعربي">
                            <textarea name="expectedOutputAr" rows={3} className={inputClassName} />
                          </Field>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          <Field label="Help notes">
                            <textarea name="helpNotes" rows={3} className={inputClassName} />
                          </Field>
                          <Field label="ملاحظات المساعدة بالعربي">
                            <textarea name="helpNotesAr" rows={3} className={inputClassName} />
                          </Field>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          <Field label="Common issues (سطر لكل نقطة)">
                            <textarea name="commonIssues" rows={4} className={inputClassName} />
                          </Field>
                          <Field label="Checklist (سطر لكل نقطة)">
                            <textarea name="checklist" rows={4} className={inputClassName} />
                          </Field>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          <ResourceSelector
                            name="contentResourceIds"
                            title="ربط عناصر من المكتبة"
                            options={selectedTrack.contentItems}
                            selectedIds={[]}
                            getLabel={(item) => `${item.titleAr} (${item.type})`}
                          />
                          <ResourceSelector
                            name="toolkitResourceIds"
                            title="ربط أدوات داعمة"
                            options={selectedTrack.toolkitItems}
                            selectedIds={[]}
                            getLabel={(item) => `${item.titleAr} (${item.category})`}
                          />
                        </div>
                      </form>
                    </div>

                    <div className="mt-8 space-y-5">
                      {day.tasks.map((task) => {
                        const selectedContentIds = task.resources
                          .filter((resource) => Boolean(resource.contentItemId))
                          .map((resource) => resource.contentItemId as string);
                        const selectedToolkitIds = task.resources
                          .filter((resource) => Boolean(resource.toolkitItemId))
                          .map((resource) => resource.toolkitItemId as string);

                        return (
                          <div key={task.id} className="rounded-[26px] border border-white/6 bg-white/[0.03] p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-sm text-slate-400">Task {task.order}</p>
                                <h4 className="mt-2 text-xl font-semibold text-white">{task.titleAr}</h4>
                              </div>
                              <form action={deleteRoadmapTaskAction}>
                                <input type="hidden" name="taskId" value={task.id} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                                >
                                  Delete task
                                </button>
                              </form>
                            </div>

                            <form action={saveRoadmapTaskAction} className="mt-5 grid gap-4">
                              <input type="hidden" name="dayId" value={day.id} />
                              <input type="hidden" name="taskId" value={task.id} />
                              <div className="grid gap-4 xl:grid-cols-4">
                                <Field label="الترتيب">
                                  <input name="order" type="number" min={1} defaultValue={task.order} className={inputClassName} />
                                </Field>
                                <Field label="العنوان">
                                  <input name="title" defaultValue={task.title} className={inputClassName} />
                                </Field>
                                <Field label="العنوان بالعربي">
                                  <input name="titleAr" defaultValue={task.titleAr} className={inputClassName} />
                                </Field>
                                <Field label="الوقت بالدقائق">
                                  <input
                                    name="estimatedMinutes"
                                    type="number"
                                    min={0}
                                    defaultValue={task.estimatedMinutes ?? 0}
                                    className={inputClassName}
                                  />
                                </Field>
                              </div>
                              <div className="grid gap-4 xl:grid-cols-2">
                                <Field label="Why it matters">
                                  <textarea name="whyItMatters" rows={3} defaultValue={task.whyItMatters || ""} className={inputClassName} />
                                </Field>
                                <Field label="ليه المهمة دي مهمة؟">
                                  <textarea name="whyItMattersAr" rows={3} defaultValue={task.whyItMattersAr || ""} className={inputClassName} />
                                </Field>
                              </div>
                              <div className="grid gap-4 xl:grid-cols-2">
                                <Field label="Instructions">
                                  <textarea name="instructions" rows={4} defaultValue={task.instructions} className={inputClassName} />
                                </Field>
                                <Field label="الخطوات بالعربي">
                                  <textarea name="instructionsAr" rows={4} defaultValue={task.instructionsAr} className={inputClassName} />
                                </Field>
                              </div>
                              <div className="grid gap-4 xl:grid-cols-2">
                                <Field label="Expected output">
                                  <textarea name="expectedOutput" rows={3} defaultValue={task.expectedOutput || ""} className={inputClassName} />
                                </Field>
                                <Field label="الناتج المتوقع بالعربي">
                                  <textarea name="expectedOutputAr" rows={3} defaultValue={task.expectedOutputAr || ""} className={inputClassName} />
                                </Field>
                              </div>
                              <div className="grid gap-4 xl:grid-cols-2">
                                <Field label="Help notes">
                                  <textarea name="helpNotes" rows={3} defaultValue={task.helpNotes || ""} className={inputClassName} />
                                </Field>
                                <Field label="ملاحظات المساعدة بالعربي">
                                  <textarea name="helpNotesAr" rows={3} defaultValue={task.helpNotesAr || ""} className={inputClassName} />
                                </Field>
                              </div>
                              <div className="grid gap-4 xl:grid-cols-2">
                                <Field label="Common issues (سطر لكل نقطة)">
                                  <textarea
                                    name="commonIssues"
                                    rows={4}
                                    defaultValue={((task.commonIssues as string[] | null) || []).join("\n")}
                                    className={inputClassName}
                                  />
                                </Field>
                                <Field label="Checklist (سطر لكل نقطة)">
                                  <textarea
                                    name="checklist"
                                    rows={4}
                                    defaultValue={((task.checklist as string[] | null) || []).join("\n")}
                                    className={inputClassName}
                                  />
                                </Field>
                              </div>
                              <div className="grid gap-4 xl:grid-cols-2">
                                <ResourceSelector
                                  name="contentResourceIds"
                                  title="ربط عناصر من المكتبة"
                                  options={selectedTrack.contentItems}
                                  selectedIds={selectedContentIds}
                                  getLabel={(item) => `${item.titleAr} (${item.type})`}
                                />
                                <ResourceSelector
                                  name="toolkitResourceIds"
                                  title="ربط أدوات داعمة"
                                  options={selectedTrack.toolkitItems}
                                  selectedIds={selectedToolkitIds}
                                  getLabel={(item) => `${item.titleAr} (${item.category})`}
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-fit rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                              >
                                Save task changes
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
              لا يوجد أسبوع محدد بعد. أضف أول أسبوع للمسار ثم ابدأ في ترتيب الأيام والمهام.
            </div>
          )}
        </>
      ) : (
        <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
          لا توجد مسارات بعد. أنشئ مسارًا أولًا حتى تبدأ تشغيل الـ roadmap.
        </div>
      )}
    </div>
  );
}
