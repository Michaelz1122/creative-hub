import Link from "next/link";

import { resetPasswordAction } from "@/app/actions/auth";

const resetPasswordErrorMessages: Record<string, string> = {
  "missing-token": "رابط الاستعادة غير مكتمل.",
  "invalid-token": "رابط الاستعادة غير صحيح.",
  "token-expired": "رابط الاستعادة انتهت صلاحيته. اطلب رابطًا جديدًا.",
  "token-already-used": "تم استخدام هذا الرابط بالفعل. اطلب رابطًا جديدًا.",
  "password-too-short": "كلمة المرور يجب أن تكون 10 حروف أو أكثر.",
  "password-missing-lowercase": "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل.",
  "password-missing-uppercase": "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل.",
  "password-missing-number": "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.",
  "reset-failed": "تعذر تحديث كلمة المرور الآن. حاول مرة أخرى.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token || "";
  const error = resolvedSearchParams?.error;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="surface-strong w-full max-w-xl rounded-[36px] p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">Reset password</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">اختر كلمة مرور جديدة</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          استخدم كلمة مرور قوية ثم عد لتسجيل الدخول بالحساب نفسه.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {resetPasswordErrorMessages[error] || "تعذر تحديث كلمة المرور الآن. حاول مرة أخرى."}
          </div>
        ) : null}

        {token ? (
          <form action={resetPasswordAction} className="mt-8 space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="password">
                New password
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
              Update password
            </button>
          </form>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
            افتح صفحة استعادة كلمة المرور أولًا لطلب رابط صالح.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/forgot-password" className="transition hover:text-white">
            Request a new link
          </Link>
          <Link href="/login" className="transition hover:text-white">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
