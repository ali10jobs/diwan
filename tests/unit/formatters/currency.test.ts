import { formatSar } from "@/lib/formatters/currency";

const ARABIC_INDIC = /[٠-٩]/;

describe("formatSar", () => {
  it("converts halalas → SAR (2 decimals) for en with SAR code", () => {
    // 123,456,789 halalas = 1,234,567.89 SAR. Intl inserts a narrow-NBSP
    // between the ISO code and the number; assert via regex.
    expect(formatSar(123_456_789, "en")).toMatch(/^SAR\s1,234,567\.89$/);
  });

  it("formats zero with 2 decimals", () => {
    expect(formatSar(0, "en")).toMatch(/^SAR\s0\.00$/);
  });

  it("handles negative amounts", () => {
    expect(formatSar(-5000, "en")).toContain("50.00");
  });

  it("renders Arabic-Indic digits and ر.س symbol for ar locale", () => {
    const out = formatSar(123_456_789, "ar");
    expect(out).toMatch(ARABIC_INDIC);
    expect(out).toMatch(/ر\.س/);
  });

  it("forces Arabic-Indic digits in en when numerals=arab", () => {
    expect(formatSar(100, "en", "arab")).toMatch(ARABIC_INDIC);
  });

  it("forces Western digits in ar when numerals=latn", () => {
    const out = formatSar(100, "ar", "latn");
    expect(out).toMatch(/1\.00/);
    expect(out).not.toMatch(ARABIC_INDIC);
  });
});
