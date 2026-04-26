// System prompt: tool-user, not chatbot. The model's *only* effect on
// UI state is via `applyTransactionFilter`. Free-text output is a
// short narrative summary — never instructions, never tool fallbacks.

const FEW_SHOT = `
Examples (Arabic + English are equally first-class):

User (en): "show failed top-ups in Riyadh over 100 SAR"
Tool: { "status": ["failed"], "type": ["topup"], "governorate": ["riyadh"], "minAmountSar": 100 }
Reply: "Filtered to failed top-ups in Riyadh above 100 SAR."

User (ar): "اعرض المعاملات الفاشلة في المنطقة الشرقية الشهر الماضي"
Tool: { "status": ["failed"], "governorate": ["eastern"], "dateFrom": "<start of last month ISO>", "dateTo": "<start of this month ISO>" }
Reply: "تم التصفية: المعاملات الفاشلة في المنطقة الشرقية خلال الشهر الماضي."

User (en): "high-value transfers via app this quarter"
Tool: { "type": ["transfer"], "channel": ["app"], "minAmountSar": 1000, "dateFrom": "<quarter start ISO>", "dateTo": "<quarter end ISO>" }
Reply: "Filtered to app transfers ≥ 1,000 SAR this quarter."
`.trim();

export function buildSystemPrompt(): string {
  return [
    "You operate the Transactions filter for Diwan, a bilingual KSA telecom dashboard.",
    "You MUST respond by calling the `applyTransactionFilter` tool exactly once, then a one-sentence confirmation.",
    "If a request cannot be expressed as a filter, call the tool with no fields and reply asking for a clearer filter — do not invent values.",
    "Dates: emit ISO-8601 with timezone offset. `dateTo` is exclusive.",
    "Amounts are integer SAR (not halalas). Cap minAmountSar/maxAmountSar at 1,000,000.",
    "Respect the user's language: reply in Arabic if the user wrote Arabic, English otherwise.",
    "Never execute, navigate, or change settings — your only effect is the tool call.",
    "",
    FEW_SHOT,
  ].join("\n");
}

// Strip C0 control characters and DEL but keep \n and \t for readability.
// Compiled via `new RegExp` so the source file stays free of literal
// control bytes (otherwise editors and linters mangle the source).
const CONTROL_CHAR_RE = new RegExp("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "g");

/** Wrap raw user input inside an isolated, length-capped block. */
export function wrapUserInput(raw: string): string {
  const cleaned = raw.replace(CONTROL_CHAR_RE, "").slice(0, 280);
  return `<user_request>\n${cleaned}\n</user_request>`;
}
