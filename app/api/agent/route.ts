import { NextResponse } from "next/server";
import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { applyTransactionFilter, TOOL_DESCRIPTION, TOOL_NAME } from "@/lib/ai/tools";
import { jsonError } from "@/lib/api/errors";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { isQuotaExceeded, recordTokens } from "@/lib/ai/quota";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RATE_LIMIT_PER_MIN = Number(process.env.DIWAN_RATE_LIMIT_PER_MIN ?? 20);
const TOKEN_CAP = Number(process.env.DIWAN_DAILY_TOKEN_CAP ?? 500_000);
const MAX_REQUEST_BYTES = 4 * 1024;
const MAX_INPUT_CHARS = 280;
const MAX_OUTPUT_TOKENS = 400;

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

function isArabic(s: string): boolean {
  // Rough heuristic: any character in the Arabic block.
  return /[؀-ۿ]/.test(s);
}

/** Read `diwan.locale` from the Cookie header without next/headers — keeps
 *  this route handler self-contained and easier to unit-test. */
function readLocaleCookie(req: Request): "ar" | "en" {
  const raw = req.headers.get("cookie") ?? "";
  const match = raw.match(/(?:^|;\s*)diwan\.locale=([^;]+)/);
  return match?.[1] === "ar" ? "ar" : "en";
}

const LOCALIZED_ERRORS = {
  rate_limited: {
    en: "Too many requests. Please slow down.",
    ar: "عدد كبير من الطلبات. يُرجى التمهّل.",
  },
  quota_exceeded: {
    en: "Daily demo quota reached.",
    ar: "تم بلوغ الحد اليومي للنسخة التجريبية.",
  },
} as const;

export async function POST(req: Request): Promise<Response> {
  // 1. Size cap (CLAUDE.md → Security): reject anything over 4 KB.
  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_REQUEST_BYTES) {
    return jsonError(413, "request_too_large", "Request body exceeds 4 KB");
  }

  const locale = readLocaleCookie(req);

  // 2. Rate limit (per IP, in-memory token bucket).
  const key = clientKey(req);
  const rl = checkRateLimit(key, RATE_LIMIT_PER_MIN);
  if (!rl.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: {
          code: "rate_limited",
          message: LOCALIZED_ERRORS.rate_limited[locale],
          resetSeconds: rl.resetSeconds,
        },
      }),
      {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": String(rl.resetSeconds) },
      },
    );
  }

  // 3. Daily token cap (per warm worker).
  if (isQuotaExceeded(TOKEN_CAP)) {
    return jsonError(429, "quota_exceeded", LOCALIZED_ERRORS.quota_exceeded[locale]);
  }

  // 4. Parse + validate body.
  let body: { messages?: UIMessage[] };
  try {
    body = (await req.json()) as { messages?: UIMessage[] };
  } catch {
    return jsonError(400, "invalid_body", "Body must be JSON");
  }
  const messages = body.messages ?? [];
  const last = messages[messages.length - 1];
  const userText = lastUserText(last).slice(0, MAX_INPUT_CHARS);
  if (!userText) return jsonError(400, "empty_input", "User message is empty");

  const lang = isArabic(userText) ? "ar" : "en";

  // 5. Stream from the model via the Gateway. The tool is the only
  //    UI-affecting channel; free text is a localized confirmation.
  const modelId = process.env.AI_MODEL_ID ?? "anthropic/claude-haiku-4.5";

  const result = streamText({
    model: gateway(modelId),
    system: `${buildSystemPrompt()}\n\nReply language: ${lang}.`,
    messages: await convertToModelMessages(messages),
    tools: {
      [TOOL_NAME]: tool({
        description: TOOL_DESCRIPTION,
        inputSchema: applyTransactionFilter,
      }),
    },
    stopWhen: stepCountIs(2),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    onFinish: ({ usage }) => {
      const total =
        (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0) + (usage?.reasoningTokens ?? 0);
      if (Number.isFinite(total)) recordTokens(total);
    },
  });

  return result.toUIMessageStreamResponse();
}

function lastUserText(message: UIMessage | undefined): string {
  if (!message || message.role !== "user") return "";
  const parts = message.parts ?? [];
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
}
