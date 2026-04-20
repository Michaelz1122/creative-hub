export default function DashboardLibraryPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Content Library
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">المحتوى ليس pile عشوائي</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          كل item في المكتبة يجب أن يعرف المستخدم لماذا هو موجود، ما الذي سيتعلمه منه، ولأي أسبوع أو task هو مرتبط.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          "External lesson wrapped with context",
          "Arabic practical note",
          "Checklist or cheat sheet",
          "Required vs optional filter",
          "Week-linked resources",
          "Difficulty and estimated time",
        ].map((item) => (
          <div key={item} className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

