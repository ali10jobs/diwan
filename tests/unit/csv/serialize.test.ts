import { csvEscape, csvRow, UTF8_BOM } from "@/lib/csv/serialize";

describe("csvEscape", () => {
  it("passes through values that don't need quoting", () => {
    expect(csvEscape("hello")).toBe("hello");
    expect(csvEscape("123.45")).toBe("123.45");
    expect(csvEscape("")).toBe("");
  });

  it("quotes values containing commas, quotes, or newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('he said "hi"')).toBe('"he said ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscape("line1\r\nline2")).toBe('"line1\r\nline2"');
  });
});

describe("csvRow", () => {
  it("joins cells with comma and terminates with CRLF", () => {
    expect(csvRow(["a", "b", "c"])).toBe("a,b,c\r\n");
  });

  it("escapes individual cells", () => {
    expect(csvRow(["plain", 'with "quote"', "with,comma"])).toBe(
      'plain,"with ""quote""","with,comma"\r\n',
    );
  });
});

describe("UTF8_BOM", () => {
  it("is the 3-byte UTF-8 BOM", () => {
    expect(UTF8_BOM).toBe("﻿");
    const bytes = Buffer.from(UTF8_BOM, "utf8");
    expect(Array.from(bytes)).toEqual([0xef, 0xbb, 0xbf]);
  });
});
