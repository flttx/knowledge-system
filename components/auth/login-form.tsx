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
    <form action={formAction} className="mt-5 space-y-4 font-sans">
      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-zinc-800 dark:text-zinc-300"
          htmlFor="username"
        >
          {t("auth.username")}
        </label>
        <input
          autoComplete="username"
          className="h-10 w-full rounded-lg border border-black/15 bg-white dark:border-white/15 dark:bg-[#080d18] px-3.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-2xs outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#C9A85D] focus:ring-2 focus:ring-[#C9A85D]/25"
          id="username"
          name="username"
          required
          type="text"
        />
      </div>

      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-zinc-800 dark:text-zinc-300"
          htmlFor="password"
        >
          {t("auth.password")}
        </label>
        <input
          autoComplete="current-password"
          className="h-10 w-full rounded-lg border border-black/15 bg-white dark:border-white/15 dark:bg-[#080d18] px-3.5 text-sm text-zinc-900 dark:text-zinc-100 shadow-2xs outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#C9A85D] focus:ring-2 focus:ring-[#C9A85D]/25"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs leading-relaxed text-red-700 dark:text-red-300"
          role="alert"
        >
          {state.error === "INVALID_CREDENTIALS" ? t("auth.invalid") : t("auth.unavailable")}
        </p>
      ) : null}

      <Button
        aria-busy={isPending}
        className="w-full mt-2 h-10 border border-black/10 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-[#C9A85D]/50 dark:bg-[#10141f] dark:text-[#f3e3be] dark:hover:bg-[#181f2f] dark:hover:border-[#C9A85D]/80 active:scale-[0.99] shadow-xs font-medium transition-all text-xs tracking-wider uppercase focus-visible:ring-[#C9A85D]"
        disabled={isPending}
        type="submit"
        size="md"
      >
        {isPending ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
    </form>
  );
}
