import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/8 bg-black/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-white">Creative Hub</p>
          <p className="max-w-sm text-sm leading-7 text-slate-400">
            منصة مصرية للتعلم العملي المنظم في المجالات الإبداعية والديجيتال. الفكرة ليست محتوى كثير، بل نظام واضح يخليك تعرف تعمل إيه كل يوم.
          </p>
        </div>
        <div className="space-y-3 text-sm text-slate-300">
          <p className="font-semibold text-white">روابط أساسية</p>
          <Link href="/pricing" className="block transition hover:text-white">
            الأسعار
          </Link>
          <Link
            href="/tracks/graphic-design"
            className="block transition hover:text-white"
          >
            Graphic Design Track
          </Link>
          <Link href="/dashboard" className="block transition hover:text-white">
            Dashboard Preview
          </Link>
        </div>
        <div className="space-y-3 text-sm text-slate-300">
          <p className="font-semibold text-white">المرحلة الحالية</p>
          <p className="leading-7 text-slate-400">
            هذه النسخة هي foundation جديدة للمشروع: marketing أوضح، dashboard أقوى، roadmap كقلب المنتج، وadmin قابل للتوسع.
          </p>
        </div>
      </div>
    </footer>
  );
}

