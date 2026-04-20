export default function DashboardToolkitsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Toolkit Layer
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Toolkits كطبقة دعم وليست المنتج نفسه</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          الملفات والقوالب والـ cheatsheets ستظل مهمة، لكن دورها في النسخة الجديدة أن تسرّع التنفيذ داخل roadmap، لا أن تكون هي المنتج بالكامل.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {[
          "Track-specific categories",
          "Featured kit items",
          "Preview images and lock states",
          "Linked directly to tasks when relevant",
        ].map((item) => (
          <div key={item} className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

