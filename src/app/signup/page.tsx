import Link from "next/link";

import { signupAction } from "@/app/actions/auth";

const signupErrorMessages: Record<string, string> = {
  "missing-email": "اكتب البريد الإلكتروني أولًا.",
  "invalid-email": "البريد الإلكتروني غير صحيح.",
  "missing-password": "اكتب كلمة المرور أولًا.",
  "password-too-short": "كلمة المرور يجب أن تكون 10 حروف أو أكثر.",
  "password-missing-lowercase": "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل.",
  "password-missing-uppercase": "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل.",
  "password-missing-number": "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.",
  "email-already-registered": "هذا البريد مسجل بالفعل. استخدم تسجيل الدخول أو استعادة كلمة المرور.",
  "signup-failed": "تعذر إنشاء الحساب الآن. حاول مرة أخرى.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string; email?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const success = resolvedSearchParams?.success;
  const error = resolvedSearchParams?.error;
  const email = resolvedSearchParams?.email || "";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="surface-strong w-full max-w-xl rounded-[36px] p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">Signup</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">أنشئ حسابك وابدأ بشكل صحيح</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          سنرسل لك رسالة تفعيل إلى بريدك الإلكتروني قبل أول تسجيل دخول. بعد التفعيل ستدخل مباشرة إلى
          مساحة التعلّم.
        </p>

        {success === "verify-email" ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            أنشأنا الحساب وأرسلنا رسالة التفعيل إلى {email || "بريدك الإلكتروني"}.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {signupErrorMessages[error] || "تعذر إنشاء الحساب الآن. حاول مرة أخرى."}
          </div>
        ) : null}

        <form action={signupAction} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              placeholder="اسمك"
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
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              placeholder="you@example.com"
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
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              placeholder="10+ chars with upper, lower, number"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Create account
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/login" className="transition hover:text-white">
            Already have an account?
          </Link>
          <Link href="/" className="transition hover:text-white">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
