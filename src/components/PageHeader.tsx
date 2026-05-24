// Version: 1.0
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
  meta,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label?: string };
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-0 transition mb-3"
        >
          <ChevronLeft size={14} /> {back.label ?? "Back"}
        </Link>
      )}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-ink-2 mt-0.5">{subtitle}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">{meta}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
