"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { loginAction } from "@/lib/auth/actions";

const initialState = { error: null };

export function LoginForm() {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--ink)]" htmlFor="username">
          {t("auth.username")}
        </label>
        <input
          autoComplete="username"
          className="h-12 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          id="username"
          name="username"
          placeholder={t("auth.usernamePlaceholder")}
          required
          type="text"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--ink)]" htmlFor="password">
          {t("auth.password")}
        </label>
        <input
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      {state.error ? (
        <p aria-live="polite" className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm leading-6 text-[var(--danger)]">
          {state.error === "INVALID_CREDENTIALS" ? t("auth.invalid") : t("auth.unavailable")}
        </p>
      ) : null}
      <Button aria-busy={isPending} className="w-full" disabled={isPending} type="submit">
          {isPending ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
    </form>
  );
}
