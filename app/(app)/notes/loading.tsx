import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/locales";

export default async function NotesLoading() {
  const locale = await getRequestLocale();
  return <div className="border-y border-[var(--line)] py-6 text-sm text-[var(--ink-muted)]" aria-live="polite">{translate(locale, "notes.loading")}</div>;
}
