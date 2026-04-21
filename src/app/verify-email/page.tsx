import Link from "next/link";

import { verifyEmailAddress } from "@/lib/auth";
import { ValidationError } from "@/lib/validation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token;

  let status: "success" | "error" | "missing" = "missing";
  let message =
    "افتح الرابط الكامل من رسالة التفعيل حتى نستطيع تأكيد البريد الإلكتروني على هذا الحساب.";

  if (token) {
    try {
      await verifyEmailAddress(token);
      status = "success";
      message = "تم تفعيل البريد الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول إلى حسابك.";
    } catch (error) {
      status = "error";

      if (error instanceof ValidationError) {
        if (error.code === "token-expired") {
          message = "رابط التفعيل انتهت صلاحيته. اطلب رسالة تفعيل جديدة من صفحة تسجيل الدخول.";
        } else if (error.code === "token-already-used") {
          message = "تم استخدام رابط التفعيل بالفعل. إذا كان الحساب مفعّلًا يمكنك تسجيل الدخول مباشرة.";
        } else {
          message = "رابط التفعيل غير صحيح أو لم يعد صالحًا.";
        }
      } else {
        message = "تعذر تفعيل البريد الإلكتروني الآن. حاول مرة أخرى بعد قليل.";
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="surface-strong w-full max-w-xl rounded-[36px] p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">Verify email</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">تأكيد البريد الإلكتروني</h1>
        <div
          className={`mt-6 rounded-2xl px-4 py-4 text-sm leading-7 ${
            status === "success"
              ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
              : status === "error"
                ? "border border-red-400/20 bg-red-500/10 text-red-100"
                : "border border-white/10 bg-white/[0.03] text-slate-300"
          }`}
        >
          {message}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/login" className="transition hover:text-white">
            Go to login
          </Link>
          <Link href="/signup" className="transition hover:text-white">
            Create another account
          </Link>
        </div>
      </div>
    </div>
  );
}
