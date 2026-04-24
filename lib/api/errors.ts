import { NextResponse } from "next/server";
import type { ZodError } from "zod";

// `errorId` per CLAUDE.md → "Error Identification". Surface in both
// body and `x-error-id` header so the UI can correlate without parsing.

function makeErrorId(): string {
  // 10-char base32-ish id, no external dep.
  const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let out = "";
  for (let i = 0; i < 10; i++) out += CROCKFORD[Math.floor(Math.random() * 32)];
  return out;
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  const errorId = makeErrorId();
  const body = { error: { code, message, errorId, ...(extra ?? {}) } };
  return NextResponse.json(body, {
    status,
    headers: { "x-error-id": errorId },
  });
}

export function badRequestFromZod(err: ZodError): NextResponse {
  return jsonError(400, "invalid_query", "Query parameters are invalid", {
    issues: err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    })),
  });
}
