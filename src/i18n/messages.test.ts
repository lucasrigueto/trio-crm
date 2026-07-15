import { describe, expect, it } from "vitest";
import { getMessages, messagesByLocale } from "./messages";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n messages", () => {
  it("keeps pt-BR and en-US catalog keys aligned", () => {
    const ptKeys = flattenKeys(messagesByLocale["pt-BR"]).sort();
    const enKeys = flattenKeys(messagesByLocale["en-US"]).sort();

    expect(enKeys).toEqual(ptKeys);
  });

  it("loads messages by locale", () => {
    expect(getMessages("pt-BR").common.actions.save).toBe("Salvar");
    expect(getMessages("en-US").common.actions.save).toBe("Save");
  });
});
