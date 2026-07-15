import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  getLocaleFromPathname,
  isLocale,
  locales,
  resolveRequestLocale,
} from "./config";

describe("i18n config", () => {
  it("uses pt-BR as the default locale and en-US as a supported locale", () => {
    expect(defaultLocale).toBe("pt-BR");
    expect(locales).toEqual(["pt-BR", "en-US"]);
  });

  it("validates supported locales only", () => {
    expect(isLocale("pt-BR")).toBe(true);
    expect(isLocale("en-US")).toBe(true);
    expect(isLocale("es-ES")).toBe(false);
  });

  it("resolves locale preference by cookie, route, then fallback", () => {
    expect(
      resolveRequestLocale({ cookieLocale: "en-US", routeLocale: "pt-BR" }),
    ).toBe("en-US");
    expect(resolveRequestLocale({ routeLocale: "en-US" })).toBe("en-US");
    expect(resolveRequestLocale({ cookieLocale: "es-ES" })).toBe("pt-BR");
  });

  it("can identify a future localized route prefix without requiring one", () => {
    expect(getLocaleFromPathname("/en-US/dashboard")).toBe("en-US");
    expect(getLocaleFromPathname("/dashboard")).toBeUndefined();
  });
});
