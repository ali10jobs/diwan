import { formatNumber, formatPercent } from "@/lib/formatters/number";

const ARABIC_INDIC = /[٠-٩]/;
const WESTERN = /[0-9]/;

describe("formatNumber", () => {
  it("renders Arabic-Indic digits for ar (auto)", () => {
    const out = formatNumber(1234567, "ar");
    expect(out).toMatch(ARABIC_INDIC);
    expect(out).not.toMatch(/[0-9]/);
  });

  it("renders Western digits for en (auto)", () => {
    const out = formatNumber(1234567, "en");
    expect(out).toBe("1,234,567");
  });

  it("forces Western digits in ar when numerals=latn", () => {
    const out = formatNumber(1234, "ar", { numerals: "latn" });
    expect(out).toMatch(WESTERN);
    expect(out).not.toMatch(ARABIC_INDIC);
  });

  it("forces Arabic-Indic digits in en when numerals=arab", () => {
    const out = formatNumber(1234, "en", { numerals: "arab" });
    expect(out).toMatch(ARABIC_INDIC);
  });

  it("respects Intl.NumberFormat options", () => {
    expect(formatNumber(0.5, "en", { style: "percent" })).toBe("50%");
  });
});

describe("formatPercent", () => {
  it("formats a ratio with up to 1 fraction digit", () => {
    expect(formatPercent(0.1234, "en")).toBe("12.3%");
  });

  it("uses Arabic-Indic digits for ar locale by default", () => {
    expect(formatPercent(0.5, "ar")).toMatch(ARABIC_INDIC);
  });
});
