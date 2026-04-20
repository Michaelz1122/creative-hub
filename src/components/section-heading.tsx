type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent-soft)]">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold text-white md:text-4xl">{title}</h2>
      <p className="text-base leading-8 text-slate-300">{description}</p>
    </div>
  );
}

