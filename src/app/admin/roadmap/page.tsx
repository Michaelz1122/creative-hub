export default function AdminRoadmapPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Roadmap Builder
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Weeks, days, tasks, quizzes</h1>
      </div>
      <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
        الـ builder الجديد يجب أن يدير roadmap week-by-week وtask-by-task، مع resources وhelp notes وexpected outputs وquizzes بدون hardcoding.
      </div>
    </div>
  );
}

