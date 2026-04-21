import Link from "next/link";

import { requestPasswordResetAction } from "@/app/actions/auth";

const forgotPasswordErrorMessages: Record<string, string> = {
  "missing-email": "اكتب البريد الإلكتروني أولًا.",
  "invalid-email": "البريد الإلكتروني غير صحيح.",
  "reset-request-failed": "تعذر إرسال رابط الاستعادة الآن. حاول مرة أخرى.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const success = resolvedSearchParams?.success;
  const error = resolvedSearchParams?.error;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="surface-strong w-full max-w-xl rounded-[36px] p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">Password reset</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">استرجاع كلمة المرور</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          اكتب بريدك الإلكتروني، وإذا كان الحساب موجودًا ومفعّلًا سنرسل لك رابطًا آمنًا لتعيين كلمة مرور
          جديدة.
        </p>

        {success === "reset-link-sent" ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            إذا كان الحساب موجودًا ومفعّلًا فستجد رسالة تحتوي على رابط الاستعادة خلال لحظات.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {forgotPasswordErrorMessages[error] || "تعذر إرسال رابط الاستعادة الآن. حاول مرة أخرى."}
          </div>
        ) : null}

        <form action={requestPasswordResetAction} className="mt-8 space-y-4">
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
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Send reset link
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/login" className="transition hover:text-white">
            Back to login
          </Link>
          <Link href="/" className="transition hover:text-white">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
