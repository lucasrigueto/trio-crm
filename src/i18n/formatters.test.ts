import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "./formatters";

describe("i18n formatters", () => {
  it("formats dates and date-times per locale", () => {
    const date = new Date(Date.UTC(2026, 6, 15, 18, 30));

    expect(formatDate(date, "pt-BR", { timeZone: "UTC" })).toBe("15/07/2026");
    expect(formatDate(date, "en-US", { timeZone: "UTC" })).toBe("07/15/2026");
    expect(formatDateTime(date, "pt-BR", { timeZone: "UTC" })).toContain(
      "15/07/2026",
    );
  });

  it("formats numbers, percentages and currencies per locale", () => {
    expect(formatNumber(1234.5, "pt-BR")).toBe("1.234,5");
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
    expect(formatPercent(0.125, "pt-BR")).toBe("12,5%");
    expect(formatCurrency(1234, "BRL", "pt-BR")).toContain("R$");
    expect(formatCurrency(1234, "USD", "en-US")).toContain("$1,234");
  });

  it("formats relative time per locale", () => {
    const base = new Date("2026-07-15T12:00:00Z");
    const past = new Date("2026-07-14T12:00:00Z");

    expect(formatRelativeTime(past, base, "en-US")).toBe("yesterday");
    expect(formatRelativeTime(past, base, "pt-BR")).toContain("ontem");
  });
});
