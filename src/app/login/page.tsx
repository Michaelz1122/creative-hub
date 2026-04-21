import Link from "next/link";

import { loginAction } from "@/app/actions/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD, LEARNER_EMAIL, LEARNER_PASSWORD } from "@/lib/seed-constants";

const loginErrorMessages: Record<string, string> = {
  "missing-email": "اكتب البريد الإلكتروني أولًا.",
  "missing-password": "اكتب كلمة المرور أولًا.",
  "password-too-short": "كلمة المرور قصيرة جدًا.",
  "invalid-credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحين.",
  "login-rate-limited": "تم إيقاف المحاولات مؤقتًا بسبب كثرة المحاولات. حاول مرة أخرى بعد قليل.",
  suspended: "هذا الحساب موقوف حاليًا.",
  "login-failed": "تعذر تسجيل الدخول الآن. حاول مرة أخرى.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;
  const showSeedCredentials = process.env.NODE_ENV !== "production";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="surface-strong w-full max-w-xl rounded-[36px] p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">Sign in</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">دخول آمن وبسيط إلى المنصة</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          استخدم البريد الإلكتروني وكلمة المرور الخاصة بحسابك. إذا كان الحساب يملك صلاحيات تشغيلية فسيتم توجيهك إلى
          لوحة الإدارة، وإلا ستدخل مباشرة إلى مساحة التعلّم.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {loginErrorMessages[error] || "تعذر تسجيل الدخول. راجع بياناتك ثم أعد المحاولة."}
          </div>
        ) : null}

        <form action={loginAction} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)]/60"
              placeholder={LEARNER_EMAIL}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)]/60"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Continue
          </button>
        </form>

        {showSeedCredentials ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Learner seed</p>
              <p className="mt-2">{LEARNER_EMAIL}</p>
              <p className="mt-1 text-slate-500">{LEARNER_PASSWORD}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Admin seed</p>
              <p className="mt-2">{ADMIN_EMAIL}</p>
              <p className="mt-1 text-slate-500">{ADMIN_PASSWORD}</p>
            </div>
          </div>
        ) : null}

        <Link href="/" className="mt-6 inline-flex text-sm text-slate-400 transition hover:text-white">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
