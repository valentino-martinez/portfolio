/* Small formatting helpers shared by pages and components. */

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** 2026-03-04 → "04 MAR 2026". Stamp-like, fixed width. */
export function stamp(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${d} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** 2026-03-04 → "2026.03" for terse listings. */
export function shortStamp(date: Date): string {
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Zero-padded plate numbers: 1 → "01". */
export function plateNo(section: number, index: number): string {
  return `${section}.${index + 1}`;
}

/** Rough reading time at 220wpm, minimum 1. */
export function readMinutes(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

/** Newest first, with drafts filtered out in production. */
export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T) {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

export function publicOnly<T extends { data: { draft?: boolean } }>(
  entries: T[]
): T[] {
  return import.meta.env.DEV ? entries : entries.filter((e) => !e.data.draft);
}
