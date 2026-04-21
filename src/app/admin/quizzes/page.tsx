import {
  deleteQuizAction,
  deleteQuizChoiceAction,
  deleteQuizQuestionAction,
  saveQuizAction,
  saveQuizChoiceAction,
  saveQuizQuestionAction,
} from "@/app/actions/quizzes";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputClassName = "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";

function QuizForm({
  tracks,
  selectedTrackId,
  weekOptions,
  dayOptions,
  values,
  submitLabel,
}: {
  tracks: Awaited<ReturnType<typeof prisma.track.findMany>>;
  selectedTrackId: string;
  weekOptions: Array<{ id: string; label: string }>;
  dayOptions: Array<{ id: string; label: string }>;
  values?: {
    id?: string;
    trackId?: string;
    weekId?: string | null;
    dayId?: string | null;
    title?: string;
    titleAr?: string;
    scope?: string;
    passingScore?: number | null;
    completionRule?: string;
    isPublished?: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={saveQuizAction} className="grid gap-4">
      {values?.id ? <input type="hidden" name="quizId" value={values.id} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <select name="trackId" defaultValue={values?.trackId || selectedTrackId} className={inputClassName}>
          {tracks.map((track) => (
            <option key={track.id} value={track.id} className="bg-slate-950">
              {track.nameAr}
            </option>
          ))}
        </select>
        <select name="scope" defaultValue={values?.scope || "weekly"} className={inputClassName}>
          <option value="weekly" className="bg-slate-950">
            Weekly
          </option>
          <option value="day" className="bg-slate-950">
            Day assessment
          </option>
          <option value="track" className="bg-slate-950">
            Track assessment
          </option>
          <option value="final" className="bg-slate-950">
            Final assessment
          </option>
        </select>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <input name="title" defaultValue={values?.title || ""} placeholder="Quiz title" className={inputClassName} />
        <input name="titleAr" defaultValue={values?.titleAr || ""} placeholder="عنوان الاختبار" className={inputClassName} />
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <select name="weekId" defaultValue={values?.weekId || ""} className={inputClassName}>
          <option value="" className="bg-slate-950">
            No week link
          </option>
          {weekOptions.map((week) => (
            <option key={week.id} value={week.id} className="bg-slate-950">
              {week.label}
            </option>
          ))}
        </select>
        <select name="dayId" defaultValue={values?.dayId || ""} className={inputClassName}>
          <option value="" className="bg-slate-950">
            No day link
          </option>
          {dayOptions.map((day) => (
            <option key={day.id} value={day.id} className="bg-slate-950">
              {day.label}
            </option>
          ))}
        </select>
        <input
          name="passingScore"
          type="number"
          min={0}
          max={100}
          defaultValue={values?.passingScore ?? 70}
          placeholder="Passing score"
          className={inputClassName}
        />
        <select name="completionRule" defaultValue={values?.completionRule || "pass_score"} className={inputClassName}>
          <option value="pass_score" className="bg-slate-950">
            Pass by score
          </option>
          <option value="completion_only" className="bg-slate-950">
            Completion only
          </option>
        </select>
      </div>
      <select name="isPublished" defaultValue={String(values?.isPublished ?? false)} className={inputClassName}>
        <option value="false" className="bg-slate-950">
          Draft
        </option>
        <option value="true" className="bg-slate-950">
          Published
        </option>
      </select>
      <button
        type="submit"
        className="w-fit rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams?: Promise<{ track?: string; success?: string; error?: string }>;
}) {
  await requirePermission("quizzes.manage");
  const resolvedSearchParams = await searchParams;
  const tracks = await prisma.track.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const selectedTrackId = resolvedSearchParams?.track || tracks[0]?.id || "";
  const selectedTrack = selectedTrackId
    ? await prisma.track.findUnique({
        where: { id: selectedTrackId },
        include: {
          roadmapWeeks: {
            orderBy: { order: "asc" },
            include: {
              days: {
                orderBy: { order: "asc" },
              },
            },
          },
          quizzes: {
            orderBy: { createdAt: "desc" },
            include: {
              week: true,
              day: {
                include: {
                  week: true,
                },
              },
              questions: {
                orderBy: { order: "asc" },
                include: {
                  choices: true,
                },
              },
              attempts: {
                orderBy: { submittedAt: "desc" },
                include: {
                  user: true,
                },
                take: 5,
              },
            },
          },
        },
      })
    : null;

  const weekOptions =
    selectedTrack?.roadmapWeeks.map((week) => ({
      id: week.id,
      label: `${week.order}. ${week.titleAr}`,
    })) || [];

  const dayOptions =
    selectedTrack?.roadmapWeeks.flatMap((week) =>
      week.days.map((day) => ({
        id: day.id,
        label: `${week.order}.${day.order} - ${day.titleAr}`,
      })),
    ) || [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Quizzes
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">تشغيل الاختبارات والنتائج</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          من هنا تقدر تنشئ الاختبارات، تربطها بالمسار أو الأسبوع أو اليوم، تضيف الأسئلة والاختيارات والإجابات الصحيحة، ثم تراجع
          آخر نتائج المتعلمين.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم حفظ آخر تعديل في الاختبارات بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          لم يكتمل الحفظ. راجع الحقول المطلوبة ثم أعد المحاولة.
        </div>
      ) : null}

      <section className="surface rounded-[30px] p-6">
        <p className="text-sm text-slate-400">اختر المسار الذي تريد إدارة اختباراتِه</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {tracks.map((track) => (
            <a
              key={track.id}
              href={`/admin/quizzes?track=${track.id}`}
              className={`rounded-full px-4 py-2 text-sm transition ${
                track.id === selectedTrackId
                  ? "bg-[var(--color-accent)] font-semibold text-slate-950"
                  : "border border-white/10 text-white hover:border-white/20 hover:bg-white/5"
              }`}
            >
              {track.nameAr}
            </a>
          ))}
        </div>
      </section>

      {selectedTrack ? (
        <>
          <section className="surface rounded-[30px] p-6">
            <h2 className="text-2xl font-semibold text-white">إضافة quiz جديدة</h2>
            <div className="mt-6">
              <QuizForm
                tracks={tracks}
                selectedTrackId={selectedTrack.id}
                weekOptions={weekOptions}
                dayOptions={dayOptions}
                submitLabel="Create quiz"
              />
            </div>
          </section>

          <section className="space-y-5">
            {selectedTrack.quizzes.map((quiz) => (
              <article key={quiz.id} className="surface rounded-[30px] p-6">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>{quiz.scope}</span>
                  <span>{quiz.week?.titleAr || "No week link"}</span>
                  <span>{quiz.day?.titleAr || "No day link"}</span>
                  <span>{quiz.isPublished ? "Published" : "Draft"}</span>
                  <span>{quiz.attempts.length} recent attempt(s)</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-white">{quiz.titleAr}</h2>
                <div className="mt-5">
                  <QuizForm
                    tracks={tracks}
                    selectedTrackId={selectedTrack.id}
                    weekOptions={weekOptions}
                    dayOptions={dayOptions}
                    submitLabel="Save quiz changes"
                    values={{
                      id: quiz.id,
                      trackId: quiz.trackId,
                      weekId: quiz.weekId,
                      dayId: quiz.dayId,
                      title: quiz.title,
                      titleAr: quiz.titleAr,
                      scope: quiz.scope,
                      passingScore: quiz.passingScore,
                      completionRule: quiz.completionRule,
                      isPublished: quiz.isPublished,
                    }}
                  />
                </div>
                <form action={deleteQuizAction} className="mt-4">
                  <input type="hidden" name="quizId" value={quiz.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                  >
                    Delete quiz
                  </button>
                </form>

                <div className="mt-8 rounded-[26px] border border-dashed border-white/10 p-5">
                  <h3 className="text-lg font-semibold text-white">إضافة سؤال جديد</h3>
                  <form action={saveQuizQuestionAction} className="mt-5 grid gap-4">
                    <input type="hidden" name="quizId" value={quiz.id} />
                    <div className="grid gap-4 xl:grid-cols-3">
                      <input name="order" type="number" min={1} defaultValue={quiz.questions.length + 1} className={inputClassName} />
                      <input name="type" defaultValue="multiple_choice" className={inputClassName} />
                      <button
                        type="submit"
                        className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                      >
                        Create question
                      </button>
                    </div>
                    <input name="prompt" placeholder="Question prompt" className={inputClassName} />
                    <input name="promptAr" placeholder="نص السؤال" className={inputClassName} />
                    <textarea name="explanation" rows={3} placeholder="Optional explanation" className={inputClassName} />
                    <textarea name="explanationAr" rows={3} placeholder="شرح إضافي بالعربي" className={inputClassName} />
                  </form>
                </div>

                <div className="mt-8 space-y-5">
                  {quiz.questions.map((question) => (
                    <div key={question.id} className="rounded-[26px] border border-white/6 bg-white/[0.03] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Question {question.order}</p>
                          <h3 className="mt-2 text-lg font-semibold text-white">{question.promptAr}</h3>
                        </div>
                        <form action={deleteQuizQuestionAction}>
                          <input type="hidden" name="questionId" value={question.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                          >
                            Delete question
                          </button>
                        </form>
                      </div>

                      <form action={saveQuizQuestionAction} className="mt-5 grid gap-4">
                        <input type="hidden" name="quizId" value={quiz.id} />
                        <input type="hidden" name="questionId" value={question.id} />
                        <div className="grid gap-4 xl:grid-cols-2">
                          <input name="order" type="number" min={1} defaultValue={question.order} className={inputClassName} />
                          <input name="type" defaultValue={question.type} className={inputClassName} />
                        </div>
                        <input name="prompt" defaultValue={question.prompt} className={inputClassName} />
                        <input name="promptAr" defaultValue={question.promptAr} className={inputClassName} />
                        <textarea name="explanation" rows={3} defaultValue={question.explanation || ""} className={inputClassName} />
                        <textarea name="explanationAr" rows={3} defaultValue={question.explanationAr || ""} className={inputClassName} />
                        <button
                          type="submit"
                          className="w-fit rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                        >
                          Save question
                        </button>
                      </form>

                      <div className="mt-6 rounded-[22px] border border-dashed border-white/10 p-4">
                        <h4 className="text-base font-semibold text-white">إضافة choice جديدة</h4>
                        <form action={saveQuizChoiceAction} className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_180px_180px]">
                          <input type="hidden" name="questionId" value={question.id} />
                          <input name="label" placeholder="Choice label" className={inputClassName} />
                          <input name="labelAr" placeholder="نص الاختيار" className={inputClassName} />
                          <select name="isCorrect" defaultValue="false" className={inputClassName}>
                            <option value="false" className="bg-slate-950">
                              Incorrect
                            </option>
                            <option value="true" className="bg-slate-950">
                              Correct
                            </option>
                          </select>
                          <button
                            type="submit"
                            className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                          >
                            Create choice
                          </button>
                        </form>
                      </div>

                      <div className="mt-6 space-y-3">
                        {question.choices.map((choice) => (
                          <div key={choice.id} className="rounded-[22px] border border-white/6 bg-black/20 p-4">
                            <form action={saveQuizChoiceAction} className="grid gap-4 xl:grid-cols-[1fr_1fr_180px_auto_auto]">
                              <input type="hidden" name="questionId" value={question.id} />
                              <input type="hidden" name="choiceId" value={choice.id} />
                              <input name="label" defaultValue={choice.label} className={inputClassName} />
                              <input name="labelAr" defaultValue={choice.labelAr} className={inputClassName} />
                              <select name="isCorrect" defaultValue={String(choice.isCorrect)} className={inputClassName}>
                                <option value="false" className="bg-slate-950">
                                  Incorrect
                                </option>
                                <option value="true" className="bg-slate-950">
                                  Correct
                                </option>
                              </select>
                              <button
                                type="submit"
                                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/5"
                              >
                                Save choice
                              </button>
                            </form>
                            <form action={deleteQuizChoiceAction} className="mt-3">
                              <input type="hidden" name="choiceId" value={choice.id} />
                              <button
                                type="submit"
                                className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                              >
                                Delete choice
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white">Recent learner results</h3>
                  <div className="mt-4 space-y-3">
                    {quiz.attempts.length ? (
                      quiz.attempts.map((attempt) => (
                        <div key={attempt.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                          <p>{attempt.user.email}</p>
                          <p className="mt-2 text-slate-500">
                            Score: {attempt.score ?? "N/A"} - Status: {attempt.status} - {new Date(attempt.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                        لا توجد نتائج متعلم لهذا الاختبار بعد.
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : (
        <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
          لا توجد مسارات متاحة بعد لإدارة الاختبارات.
        </div>
      )}
    </div>
  );
}
