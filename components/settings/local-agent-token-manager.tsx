"use client";

import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { EmptyState, PageContainer, PageHeader, Surface } from "@/components/ui/workspace";


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
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function create(): Promise<void> {
    if (!name.trim()) return;
    setError(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/settings/local-agent-tokens", {
        body: JSON.stringify({ name: name.trim() }),
        headers: { "content-type": "application/json" },
        method: "POST",
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
    <PageContainer width="detail" className="space-y-6">
      <PageHeader className="items-start">
        <div>
          <p className="workspace-eyebrow">{t("nav.localAgent")}</p>
          <h1 className="workspace-page-title">{t("localAgent.title")}</h1>
          <p className="workspace-page-description">{t("localAgent.description")}</p>
        </div>
      </PageHeader>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)]">
        <label className="block text-xs font-semibold text-[var(--ink)]" htmlFor="token-name">{t("localAgent.name")}</label>
        <div className="mt-2.5 flex gap-2.5">
          <input
            className="workspace-input min-w-0 flex-1"
            id="token-name"
            onChange={(event) => setName(event.target.value)}
            placeholder={t("localAgent.namePlaceholder")}
            value={name}
          />
          <Button
            aria-busy={isPending}
            disabled={isPending || !name.trim()}
            onClick={() => void create()}
            size="md"
            type="button"
          >
            {t("localAgent.create")}
          </Button>
        </div>
      </div>

      {newToken ? (
        <Surface className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)]/40 p-4">
          <p className="text-xs font-semibold text-[var(--accent-strong)]">{t("localAgent.copyNow")}</p>
          <code className="mt-2 block break-all rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2.5 font-mono text-xs text-[var(--ink)]">{newToken}</code>
        </Surface>
      ) : null}
      {error ? <p className="rounded-lg bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">{error}</p> : null}

      <div>
        {items.length > 0 ? (
          <div className="workspace-surface">
            {items.map((item) => (
              <div className="workspace-list-row flex items-center justify-between gap-4 py-3.5 px-5" key={item.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">{t("localAgent.createdAt", { date: new Date(item.createdAt).toLocaleString(locale) })}</p>
                </div>
                {item.revokedAt ? (
                  <span className="text-xs text-[var(--ink-faint)]">{t("localAgent.revoked")}</span>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => void revoke(item.id)} type="button">
                    {t("localAgent.revoke")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : !isPending ? (
          <EmptyState
            title="暂无 Local Agent Token"
            description="创建 Token 以便本地命令行或 Agent 工具连接知识库并提交提案。"
          />
        ) : null}
      </div>
    </PageContainer>
  );
}
