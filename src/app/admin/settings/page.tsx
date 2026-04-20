export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Platform settings direction</h1>
      </div>
      <div className="surface rounded-[30px] p-6 text-sm leading-7 text-slate-300">
        الإعدادات ستضم branding، payment instructions، email config، social links، defaults، وcode injection areas بشكل أكثر ترتيبًا وأمانًا.
      </div>
    </div>
  );
}
