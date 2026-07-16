import { defaultLocale, type AppLocale } from "./config";
import enUSAuth from "../../messages/en-US/auth.json";
import enUSCommon from "../../messages/en-US/common.json";
import enUSNavigation from "../../messages/en-US/navigation.json";
import enUSSettings from "../../messages/en-US/settings.json";
import ptBRAuth from "../../messages/pt-BR/auth.json";
import ptBRCommon from "../../messages/pt-BR/common.json";
import ptBRNavigation from "../../messages/pt-BR/navigation.json";
import ptBRSettings from "../../messages/pt-BR/settings.json";

const enUSMessages = {
  auth: enUSAuth,
  common: enUSCommon,
  navigation: enUSNavigation,
  settings: enUSSettings,
};

type MessageTree = Record<string, unknown>;

function mergeMessages<T extends MessageTree>(base: T, override: MessageTree): T {
  const output: MessageTree = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = output[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      output[key] = mergeMessages(
        baseValue as MessageTree,
        value as MessageTree,
      );
    } else {
      output[key] = value;
    }
  }

  return output as T;
}

export const messagesByLocale = {
  "pt-BR": mergeMessages(enUSMessages, {
    auth: ptBRAuth,
    common: ptBRCommon,
    navigation: ptBRNavigation,
    settings: ptBRSettings,
  }),
  "en-US": {
    ...enUSMessages,
  },
} satisfies Record<AppLocale, typeof enUSMessages>;

export type AppMessages = (typeof messagesByLocale)[typeof defaultLocale];

export function getMessages(locale: AppLocale): AppMessages {
  return messagesByLocale[locale];
}
