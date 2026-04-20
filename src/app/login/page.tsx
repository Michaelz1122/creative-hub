import Link from "next/link";

import { loginAction } from "@/app/actions/auth";
import { ADMIN_EMAIL, LEARNER_EMAIL } from "@/lib/seed-constants";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="surface-strong w-full max-w-xl rounded-[36px] p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Sign in
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">ابدأ الدخول للمنتج الحقيقي</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          هذه المرحلة تستخدم sign-in بسيط بالبريد الإلكتروني لإنجاز core flow بسرعة: session، access، الدفع، والمراجعة. استخدم البريد seeded أدناه لتجربة المتعلم أو الإدارة.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            Please enter an email to continue.
          </div>
        ) : null}

        <form action={loginAction} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)]/60"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)]/60"
              placeholder={LEARNER_EMAIL}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Continue
          </button>
        </form>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Learner seed</p>
            <p className="mt-2">{LEARNER_EMAIL}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Admin seed</p>
            <p className="mt-2">{ADMIN_EMAIL}</p>
          </div>
        </div>

        <Link href="/" className="mt-6 inline-flex text-sm text-slate-400 transition hover:text-white">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
