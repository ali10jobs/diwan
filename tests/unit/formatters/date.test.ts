import { formatDate } from "@/lib/formatters/date";

// Verification Checklist: "Hijri date picker round-trips 1 Ramadan 1446 ↔ 1 Mar 2025".
const MAR_1_2025 = new Date("2025-03-01T00:00:00Z");

describe("formatDate Gregorian", () => {
  it("formats a Gregorian date in en with medium style", () => {
    expect(formatDate(MAR_1_2025, "en", { dateStyle: "medium" })).toBe("Mar 1, 2025");
  });

  it("formats a Gregorian date in ar with Arabic-Indic digits", () => {
    const out = formatDate(MAR_1_2025, "ar", { dateStyle: "medium" });
    expect(out).toMatch(/[٠-٩]/);
    expect(out).toMatch(/٢٠٢٥/);
  });

  it("accepts ISO string input", () => {
    expect(formatDate("2025-03-01T00:00:00Z", "en")).toBe("Mar 1, 2025");
  });
});

describe("formatDate Hijri (islamic-umalqura)", () => {
  it("maps 1 Mar 2025 Gregorian → 1 Ramadan 1446 AH in en", () => {
    const out = formatDate(MAR_1_2025, "en", {
      calendar: "islamic-umalqura",
      dateStyle: "long",
    });
    expect(out).toContain("Ramadan");
    expect(out).toContain("1446");
    expect(out).toMatch(/\b1\b/);
  });

  it("maps 1 Mar 2025 Gregorian → ١ رمضان ١٤٤٦ in ar", () => {
    const out = formatDate(MAR_1_2025, "ar", {
      calendar: "islamic-umalqura",
      dateStyle: "long",
    });
    expect(out).toContain("رمضان");
    expect(out).toContain("١٤٤٦");
  });

  it("respects latn numerals override in ar Hijri", () => {
    const out = formatDate(MAR_1_2025, "ar", {
      calendar: "islamic-umalqura",
      dateStyle: "long",
      numerals: "latn",
    });
    expect(out).toContain("رمضان");
    expect(out).toMatch(/1446/);
    expect(out).not.toMatch(/[٠-٩]/);
  });
});
