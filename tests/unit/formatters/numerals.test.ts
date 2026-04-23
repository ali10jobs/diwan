import { buildLocaleTag, resolveNumberingSystem } from "@/lib/formatters/numerals";

describe("resolveNumberingSystem", () => {
  it("honors explicit arab preference regardless of locale", () => {
    expect(resolveNumberingSystem("en", "arab")).toBe("arab");
    expect(resolveNumberingSystem("ar", "arab")).toBe("arab");
  });

  it("honors explicit latn preference regardless of locale", () => {
    expect(resolveNumberingSystem("en", "latn")).toBe("latn");
    expect(resolveNumberingSystem("ar", "latn")).toBe("latn");
  });

  it("auto maps en→latn and ar→arab", () => {
    expect(resolveNumberingSystem("en", "auto")).toBe("latn");
    expect(resolveNumberingSystem("ar", "auto")).toBe("arab");
  });
});

describe("buildLocaleTag", () => {
  it("produces BCP-47 tag with numbering-system extension", () => {
    expect(buildLocaleTag("en", "auto")).toBe("en-US-u-nu-latn");
    expect(buildLocaleTag("ar", "auto")).toBe("ar-SA-u-nu-arab");
    expect(buildLocaleTag("ar", "latn")).toBe("ar-SA-u-nu-latn");
    expect(buildLocaleTag("en", "arab")).toBe("en-US-u-nu-arab");
  });
});
