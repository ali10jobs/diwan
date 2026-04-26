import { test, expect } from "@playwright/test";

// Phase 7 — Agent Console.
//
// We mock `/api/agent` with a deterministic UIMessage stream so the
// real model is out of the loop. Six seeded phrases (3 EN, 3 AR) map
// to known tool-call payloads — the *integration* the test verifies
// is "tool call → URL update on /transactions".

type Chunk = Record<string, unknown>;

const FIXTURES: Array<{ match: RegExp; reply: string; tool: Record<string, unknown> }> = [
  {
    match: /failed\s+top-?ups?\s+in\s+riyadh/i,
    reply: "Filtered to failed top-ups in Riyadh.",
    tool: { status: ["failed"], type: ["topup"], governorate: ["riyadh"] },
  },
  {
    match: /high-?value\s+transfers/i,
    reply: "Filtered to app transfers ≥ 1,000 SAR.",
    tool: { type: ["transfer"], channel: ["app"], minAmountSar: 1000 },
  },
  {
    match: /pending\s+bills/i,
    reply: "Filtered to pending bills.",
    tool: { status: ["pending"], type: ["bill"] },
  },
  {
    match: /المعاملات\s*الفاشلة/,
    reply: "تم التصفية: المعاملات الفاشلة في المنطقة الشرقية.",
    tool: { status: ["failed"], governorate: ["eastern"] },
  },
  {
    match: /تعبئة|تعبئات/,
    reply: "تم التصفية: عمليات التعبئة عبر التطبيق.",
    tool: { type: ["topup"], channel: ["app"] },
  },
  {
    match: /استرداد|استردادات/,
    reply: "تم التصفية: عمليات الاسترداد.",
    tool: { type: ["refund"] },
  },
];

function sseLine(c: Chunk): string {
  return `data: ${JSON.stringify(c)}\n\n`;
}

function buildStream(reply: string, tool: Record<string, unknown>): string {
  const messageId = "msg_test";
  const toolCallId = "call_test";
  const textId = "txt_test";
  const lines: Chunk[] = [
    { type: "start", messageId },
    { type: "start-step" },
    {
      type: "tool-input-available",
      toolCallId,
      toolName: "applyTransactionFilter",
      input: tool,
    },
    { type: "text-start", id: textId },
    { type: "text-delta", id: textId, delta: reply },
    { type: "text-end", id: textId },
    { type: "finish-step" },
    { type: "finish" },
  ];
  return lines.map(sseLine).join("") + "data: [DONE]\n\n";
}

async function mockAgent(page: import("@playwright/test").Page) {
  await page.route("**/api/agent", async (route) => {
    const req = route.request();
    const body = req.postDataJSON() as { messages?: Array<{ parts?: Array<{ text?: string }> }> };
    const last = body.messages?.[body.messages.length - 1];
    const text = (last?.parts ?? [])
      .map((p) => p.text ?? "")
      .join(" ")
      .trim();
    const fixture = FIXTURES.find((f) => f.match.test(text));
    const reply = fixture?.reply ?? "Filtered.";
    const tool = fixture?.tool ?? {};
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "x-vercel-ai-ui-message-stream": "v1",
      },
      body: buildStream(reply, tool),
    });
  });
}

test.describe("agent console", () => {
  test.beforeEach(async ({ page }) => {
    await mockAgent(page);
  });

  test("EN: failed top-ups in Riyadh → tool call → /transactions URL filter", async ({ page }) => {
    await page.goto("/en/agent");
    await page.locator("#agent-input").fill("show failed top-ups in Riyadh");
    await page.getByLabel("Send").click();

    // Tool-call dispatch navigates immediately, so assert the URL —
    // the chip render is best-effort and racy across viewports.
    await page.waitForURL(/\/en\/transactions\?.*status=failed/);
    expect(page.url()).toContain("type=topup");
    expect(page.url()).toContain("governorate=riyadh");
  });

  test("EN: high-value transfers via app → URL carries minAmount in halalas", async ({ page }) => {
    await page.goto("/en/agent");
    await page.locator("#agent-input").fill("high-value transfers via app");
    await page.getByLabel("Send").click();

    await page.waitForURL(/\/en\/transactions\?/);
    // Tool emits SAR (1000); URL contract is halalas (×100).
    expect(page.url()).toContain("minAmount=100000");
    expect(page.url()).toContain("channel=app");
  });

  test("AR: المعاملات الفاشلة في الشرقية → governorate=eastern", async ({ page }) => {
    await page.goto("/ar/agent");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.locator("#agent-input").fill("اعرض المعاملات الفاشلة في المنطقة الشرقية");
    await page.getByLabel("إرسال").click();

    await page.waitForURL(/\/ar\/transactions\?.*governorate=eastern/);
    expect(page.url()).toContain("status=failed");
  });

  test("input is capped at 280 chars", async ({ page }) => {
    await page.goto("/en/agent");
    const long = "a".repeat(400);
    await page.locator("#agent-input").fill(long);
    const value = await page.locator("#agent-input").inputValue();
    expect(value.length).toBe(280);
  });
});
