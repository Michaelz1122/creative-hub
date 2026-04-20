"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  caption: string;
};

type WorkspaceShellProps = {
  title: string;
  description: string;
  badge: string;
  navItems: NavItem[];
  children: ReactNode;
};

export function WorkspaceShell({
  title,
  description,
  badge,
  navItems,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#172033_0%,#05070c_45%,#020306_100%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 md:px-6 lg:flex-row">
        <aside className="w-full rounded-[28px] border border-white/8 bg-white/5 p-5 backdrop-blur md:p-6 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-80">
          <div className="space-y-6">
            <BrandMark />
            <div className="rounded-[24px] border border-white/8 bg-black/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
                {badge}
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-white">{title}</h1>
              <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-[22px] border px-4 py-3 transition",
                      isActive
                        ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10"
                        : "border-white/6 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]"
                    )}
                  >
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">{item.caption}</p>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-[32px] border border-white/8 bg-[rgba(8,11,19,0.82)] p-5 backdrop-blur md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
