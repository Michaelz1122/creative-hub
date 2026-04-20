import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { marketingNav } from "@/lib/navigation";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[rgba(6,10,17,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-6 md:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white md:inline-flex"
          >
            الأسعار
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            ادخل المنصة
          </Link>
        </div>
      </div>
    </header>
  );
}

