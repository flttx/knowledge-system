"use client";

import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { PageContainer, PageHeader, Surface } from "@/components/ui/workspace";

interface LocalAgentToken {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
}

interface TokenResponse {
  items: LocalAgentToken[];
}

export function LocalAgentTokenManager() {
  const { locale, t } = useI18n();
  const [items, setItems] = useState<LocalAgentToken[]>([]);
  const [name, setName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/settings/local-agent-tokens", { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok || typeof body !== "object" || body === null || !("items" in body)) {
        throw new Error(t("common.error"));
      }
      setItems((body as TokenResponse).items);
    } catch {
      setError(t("common.error"));
    } finally {
      setIsPending(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function create(): Promise<void> {
    setError(null);
    setNewToken(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/settings/local-agent-tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body: unknown = await response.json();
      if (!response.ok || typeof body !== "object" || body === null || !("token" in body)) {
        throw new Error(t("common.error"));
      }
      setNewToken(typeof body.token === "string" ? body.token : null);
      setName("");
      await load();
    } catch {
      setError(t("common.error"));
    } finally {
      setIsPending(false);
    }
  }

  async function revoke(id: string): Promise<void> {
    setError(null);
    try {
      const response = await fetch(`/api/settings/local-agent-tokens/${id}`, { method: "POST" });
      if (!response.ok) throw new Error(t("common.error"));
      await load();
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <PageContainer width="detail" className="space-y-8">
      <PageHeader className="items-start"><div>
        <p className="workspace-eyebrow">{t("nav.localAgent")}</p>
        <h1 className="workspace-page-title">{t("localAgent.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{t("localAgent.description")}</p>
      </div></PageHeader>

      <div className="border-t border-[var(--line-strong)] pt-5">
        <label className="block text-sm font-semibold" htmlFor="token-name">{t("localAgent.name")}</label>
        <div className="mt-3 flex gap-3">
          <input
            className="workspace-input min-w-0 flex-1"
            id="token-name"
            onChange={(event) => setName(event.target.value)}
            placeholder={t("localAgent.namePlaceholder")}
            value={name}
          />
          <button
            aria-busy={isPending}
            className="rounded-lg bg-[var(--ink)] px-4 text-sm font-medium text-white disabled:opacity-50"
            disabled={isPending || !name.trim()}
            onClick={() => void create()}
            type="button"
          >
            {t("localAgent.create")}
          </button>
        </div>
      </div>

      {newToken ? (
        <Surface className="border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] p-4">
          <p className="text-sm font-semibold">{t("localAgent.copyNow")}</p>
          <code className="mt-3 block break-all rounded-lg bg-white p-3 text-xs">{newToken}</code>
        </Surface>
      ) : null}
      {error ? <p className="rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="space-y-3">
        {items.map((item) => (
          <div className="flex items-center gap-4 border-b border-[var(--line)] py-4" key={item.id}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-[var(--ink-faint)]">{t("localAgent.createdAt", { date: new Date(item.createdAt).toLocaleString(locale) })}</p>
            </div>
            {item.revokedAt ? (
              <span className="text-xs text-[var(--ink-faint)]">{t("localAgent.revoked")}</span>
            ) : (
              <button className="text-xs font-semibold text-[var(--danger)]" onClick={() => void revoke(item.id)} type="button">
                {t("localAgent.revoke")}
              </button>
            )}
          </div>
        ))}
        {!isPending && items.length === 0 ? <p className="text-sm text-[var(--ink-muted)]">{t("localAgent.empty")}</p> : null}
      </div>
    </PageContainer>
  );
}
