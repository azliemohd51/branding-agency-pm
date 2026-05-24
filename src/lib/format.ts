// Version: 1.0
export function formatDate(ts: number | null | undefined, opts?: { long?: boolean }): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  if (opts?.long) return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function daysUntil(ts: number | null | undefined): number | null {
  if (!ts) return null;
  const now = Date.now() / 1000;
  return Math.ceil((ts - now) / 86400);
}

export function relativeDeadline(ts: number | null | undefined): { text: string; tone: "ok" | "soon" | "overdue" | "muted" } {
  const d = daysUntil(ts);
  if (d === null) return { text: "No due date", tone: "muted" };
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, tone: "overdue" };
  if (d === 0) return { text: "Due today", tone: "soon" };
  if (d <= 3) return { text: `Due in ${d}d`, tone: "soon" };
  return { text: `Due in ${d}d`, tone: "ok" };
}

export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function dateInputValue(ts: number | null | undefined): string {
  if (!ts) return "";
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export function parseDateInput(v: string | null | undefined): number | null {
  if (!v) return null;
  const d = new Date(v + "T12:00:00");
  if (isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}
