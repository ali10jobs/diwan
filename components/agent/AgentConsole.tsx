"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { Send } from "lucide-react";
import { applyTransactionFilter, TOOL_NAME, type ApplyTransactionFilter } from "@/lib/ai/tools";

const MAX_INPUT = 280;

export function AgentConsole() {
  const t = useTranslations("agent");
  const router = useRouter();
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agent" }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAppliedToolCallId = useRef<string | null>(null);

  // When the latest assistant message contains a parsed tool call,
  // navigate to /transactions with the filter applied. We dedupe via
  // the toolCallId so the same call can't drive two navigations.
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest || latest.role !== "assistant") return;
    for (const part of latest.parts ?? []) {
      const tc = readToolCall(part);
      if (!tc) continue;
      if (lastAppliedToolCallId.current === tc.id) continue;
      const parsed = applyTransactionFilter.safeParse(tc.input);
      if (!parsed.success) continue;
      lastAppliedToolCallId.current = tc.id;
      router.push(`/transactions${toQueryString(parsed.data)}`);
      break;
    }
  }, [messages, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().slice(0, MAX_INPUT);
    if (!trimmed) return;
    setInput("");
    sendMessage({ text: trimmed });
    inputRef.current?.focus();
  };

  const isStreaming = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      <ul
        aria-label={t("conversationLabel")}
        className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4"
      >
        {messages.length === 0 ? (
          <li className="text-sm text-[color:var(--color-fg-muted)]">{t("emptyHint")}</li>
        ) : null}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} t={t} />
        ))}
        {isStreaming ? (
          <li
            aria-live="polite"
            className="self-start rounded-lg bg-[color:var(--color-bg)] px-3 py-2 text-xs text-[color:var(--color-fg-muted)]"
          >
            {t("thinking")}
          </li>
        ) : null}
        {error ? (
          <li
            role="alert"
            className="self-start rounded-lg border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 px-3 py-2 text-xs text-[color:var(--color-danger)]"
          >
            {error.message || t("errorGeneric")}
          </li>
        ) : null}
      </ul>

      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-2"
        // Reserve safe-area inset on iOS so the input clears the home indicator.
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <label htmlFor="agent-input" className="sr-only">
          {t("inputLabel")}
        </label>
        <textarea
          id="agent-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
          rows={2}
          maxLength={MAX_INPUT}
          placeholder={t("placeholder")}
          className="min-h-[2.75rem] flex-1 resize-none bg-transparent px-2 text-sm focus:outline-none"
          disabled={isStreaming}
        />
        <button
          type="submit"
          aria-label={t("send")}
          disabled={isStreaming || !input.trim()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[color:var(--color-primary)] text-[color:var(--color-primary-contrast)] disabled:opacity-50"
        >
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}

type ToolCallPart = { type: string; toolCallId?: string; input?: unknown; args?: unknown };

function readToolCall(part: unknown): { id: string; input: unknown } | null {
  if (!part || typeof part !== "object") return null;
  const p = part as ToolCallPart;
  if (typeof p.type !== "string") return null;
  // AI SDK v6 emits parts like `tool-applyTransactionFilter` with the
  // tool name suffixed onto the discriminator.
  const matches =
    p.type === `tool-${TOOL_NAME}` || p.type === "tool-call" || p.type === "tool-input-available";
  if (!matches) return null;
  const id = p.toolCallId;
  if (!id) return null;
  const input = p.input ?? p.args;
  if (input === undefined) return null;
  return { id, input };
}

function Bubble({ message, t }: { message: UIMessage; t: (key: string) => string }) {
  const isUser = message.role === "user";
  const text = (message.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
  const tool = (message.parts ?? []).map(readToolCall).find(Boolean) ?? null;

  return (
    <li
      className={`flex max-w-[42rem] flex-col gap-1 rounded-lg px-3 py-2 text-sm ${
        isUser
          ? "self-end bg-[color:var(--color-primary)]/12"
          : "self-start bg-[color:var(--color-bg)]"
      }`}
    >
      {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
      {tool ? <ToolCallBadge label={t("toolApplied")} input={tool.input} /> : null}
    </li>
  );
}

function ToolCallBadge({ label, input }: { label: string; input: unknown }) {
  const parsed = applyTransactionFilter.safeParse(input);
  const tags = parsed.success ? summarizeFilter(parsed.data) : [];
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-2 py-0.5 font-medium">
        {label}
      </span>
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-[color:var(--color-primary)]/12 px-2 py-0.5 font-mono text-[11px] text-[color:var(--color-primary)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function summarizeFilter(f: ApplyTransactionFilter): string[] {
  const out: string[] = [];
  if (f.status?.length) out.push(`status: ${f.status.join("|")}`);
  if (f.type?.length) out.push(`type: ${f.type.join("|")}`);
  if (f.channel?.length) out.push(`channel: ${f.channel.join("|")}`);
  if (f.governorate?.length) out.push(`gov: ${f.governorate.join("|")}`);
  if (f.minAmountSar !== undefined) out.push(`min: ${f.minAmountSar}`);
  if (f.maxAmountSar !== undefined) out.push(`max: ${f.maxAmountSar}`);
  if (f.dateFrom) out.push(`from: ${f.dateFrom.slice(0, 10)}`);
  if (f.dateTo) out.push(`to: ${f.dateTo.slice(0, 10)}`);
  return out;
}

function toQueryString(f: ApplyTransactionFilter): string {
  const params = new URLSearchParams();
  if (f.status?.length) params.set("status", f.status.join(","));
  if (f.type?.length) params.set("type", f.type.join(","));
  if (f.channel?.length) params.set("channel", f.channel.join(","));
  if (f.governorate?.length) params.set("governorate", f.governorate.join(","));
  // Tool emits SAR; URL contract is halalas.
  if (f.minAmountSar !== undefined) params.set("minAmount", String(f.minAmountSar * 100));
  if (f.maxAmountSar !== undefined) params.set("maxAmount", String(f.maxAmountSar * 100));
  if (f.dateFrom) params.set("dateFrom", f.dateFrom);
  if (f.dateTo) params.set("dateTo", f.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
