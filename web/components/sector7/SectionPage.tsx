export function SectionPage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="font-label text-xs uppercase tracking-widest text-secondary lg:text-sm">
          {kicker}
        </p>
        <h2 className="font-headline text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {title}
        </h2>
      </header>
      {children}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden border border-outline-variant/15 bg-surface-container ${className}`}
    >
      <div className="flex items-center justify-between gap-2 bg-surface-container-high px-3 py-2 sm:px-4">
        <span className="font-label text-xs uppercase tracking-widest text-white lg:text-sm">
          {title}
        </span>
        {action}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}
