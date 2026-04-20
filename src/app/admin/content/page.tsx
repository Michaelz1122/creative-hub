export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Content
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Content and toolkit operations</h1>
      </div>
      <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
        هنا سيتجمع content library وtoolkit relations وfeatured items وpublish states مع ربطها بالمسارات وبالـ roadmap tasks.
      </div>
    </div>
  );
}

