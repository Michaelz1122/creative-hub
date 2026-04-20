import Link from "next/link";

export function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 text-white">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-accent),#f59e0b)] text-sm font-bold text-slate-950">
        CH
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-medium uppercase tracking-[0.28em] text-slate-400">
          Creative Hub
        </span>
        <span className="text-base font-semibold text-slate-100">
          التعلم بشكل أوضح
        </span>
      </span>
    </Link>
  );
}

