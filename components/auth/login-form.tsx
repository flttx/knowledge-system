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
    <form action={formAction} className="mt-6 space-y-4 font-sans">
      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-[#2E2C27]"
          htmlFor="username"
        >
          {t("auth.username")}
        </label>
        <input
          autoComplete="username"
          className="h-10 w-full rounded-lg border border-[#D8D2C5] bg-white px-3.5 text-sm text-[#1C1B18] shadow-xs outline-none transition-all placeholder-[#9E988E] focus:border-[#C9A85D] focus:ring-2 focus:ring-[#C9A85D]/25"
          id="username"
          name="username"
          placeholder={t("auth.usernamePlaceholder")}
          required
          type="text"
        />
      </div>

      <div>
        <label
          className="mb-1.5 block text-xs font-medium text-[#2E2C27]"
          htmlFor="password"
        >
          {t("auth.password")}
        </label>
        <input
          autoComplete="current-password"
          className="h-10 w-full rounded-lg border border-[#D8D2C5] bg-white px-3.5 text-sm text-[#1C1B18] shadow-xs outline-none transition-all placeholder-[#9E988E] focus:border-[#C9A85D] focus:ring-2 focus:ring-[#C9A85D]/25"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-[#EAC4C4] bg-[#FDF2F2] px-3.5 py-2.5 text-xs leading-relaxed text-[#A62B2B]"
          role="alert"
        >
          {state.error === "INVALID_CREDENTIALS" ? t("auth.invalid") : t("auth.unavailable")}
        </p>
      ) : null}

      <Button
        aria-busy={isPending}
        className="w-full mt-3 h-10 border border-[#C9A85D]/50 bg-[#0E1118] text-[#F9F7F1] hover:bg-[#181E2C] hover:border-[#C9A85D]/80 active:bg-[#07090E] shadow-sm font-medium transition-all text-xs tracking-wider uppercase focus-visible:ring-[#C9A85D]"
        disabled={isPending}
        type="submit"
        size="md"
      >
        {isPending ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
    </form>
  );
}
