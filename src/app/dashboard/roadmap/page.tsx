export default function DashboardRoadmapPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Roadmap
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">شكل roadmap أبسط وأوضح</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          التجربة الجديدة تقسم المسار إلى أسابيع واضحة، وكل أسبوع فيه daily tasks، resources، expected output، common issues، ثم quiz أو milestone.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Week 4</h2>
          <div className="mt-5 space-y-3">
            {[
              "Objective: تبني workflow ثابت لتصميمات السوشيال ميديا",
              "Expected output: 2 polished social media posts",
              "Quiz: 5 quick questions + self-check",
              "Milestone: تعرف تكرر نفس العملية بنفسك",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">Daily task anatomy</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              "What to do",
              "Why it matters",
              "Resource to use",
              "Estimated time",
              "Expected output",
              "Common beginner issues",
              "Checklist",
              "Mark as complete",
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/6 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

