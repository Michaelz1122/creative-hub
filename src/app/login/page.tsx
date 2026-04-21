import Link from "next/link";

import { loginAction, resendVerificationEmailAction } from "@/app/actions/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD, LEARNER_EMAIL, LEARNER_PASSWORD } from "@/lib/seed-constants";

const loginErrorMessages: Record<string, string> = {
  "missing-email": "اكتب البريد الإلكتروني أولًا.",
  "invalid-email": "البريد الإلكتروني غير صحيح.",
  "missing-password": "اكتب كلمة المرور أولًا.",
  "password-too-short": "كلمة المرور قصيرة جدًا.",
  "invalid-credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحين.",
  "email-not-verified": "لازم تفعّل البريد الإلكتروني أولًا قبل تسجيل الدخول.",
  "login-rate-limited": "تم إيقاف المحاولات مؤقتًا بسبب كثرة المحاولات. حاول مرة أخرى بعد قليل.",
  suspended: "هذا الحساب موقوف حاليًا.",
  "verification-resend-failed": "تعذر إعادة إرسال رسالة التفعيل الآن. حاول مرة أخرى بعد قليل.",
  "login-failed": "تعذر تسجيل الدخول الآن. حاول مرة أخرى.",
};

const loginSuccessMessages: Record<string, string> = {
  "verification-resent": "أرسلنا رسالة تفعيل جديدة إلى بريدك الإلكتروني.",
  "password-reset": "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.",
  "email-verified": "تم تفعيل البريد الإلكتروني بنجاح. يمكنك تسجيل الدخول الآن.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string; email?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;
  const success = resolvedSearchParams?.success;
  const hintedEmail = resolvedSearchParams?.email || "";
  const showSeedCredentials = process.env.NODE_ENV !== "production";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="surface-strong w-full max-w-xl rounded-[36px] p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">Sign in</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">دخول آمن وبسيط إلى المنصة</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          استخدم البريد الإلكتروني وكلمة المرور الخاصة بحسابك. إذا كان الحساب يملك صلاحيات تشغيلية فسيتم
          توجيهك إلى لوحة الإدارة، وإلا ستدخل مباشرة إلى مساحة التعلّم.
        </p>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {loginSuccessMessages[success] || "تم تنفيذ الإجراء بنجاح."}
          </div>
        ) : null}

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
              defaultValue={hintedEmail}
              autoComplete="email"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)]/60"
              placeholder={LEARNER_EMAIL}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm text-slate-300" htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-slate-400 transition hover:text-white">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)]/60"
              placeholder="••••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Continue
          </button>
        </form>

        {error === "email-not-verified" ? (
          <form action={resendVerificationEmailAction} className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <input type="hidden" name="email" value={hintedEmail} />
            <p className="text-sm leading-7 text-slate-300">
              إذا لم تصلك رسالة التفعيل أو انتهت صلاحية الرابط، اطلب رسالة جديدة من هنا.
            </p>
            <button
              type="submit"
              className="mt-4 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
            >
              Resend verification email
            </button>
          </form>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/signup" className="transition hover:text-white">
            Create learner account
          </Link>
          <Link href="/" className="transition hover:text-white">
            Back to homepage
          </Link>
        </div>

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
      </div>
    </div>
  );
}
