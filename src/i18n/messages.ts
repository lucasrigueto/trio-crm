import { defaultLocale, type AppLocale } from "./config";
import enUSCommon from "../../messages/en-US/common.json";
import ptBRCommon from "../../messages/pt-BR/common.json";

export const messagesByLocale = {
  "pt-BR": {
    common: ptBRCommon,
  },
  "en-US": {
    common: enUSCommon,
  },
} satisfies Record<AppLocale, { common: typeof ptBRCommon }>;

export type AppMessages = (typeof messagesByLocale)[typeof defaultLocale];

export function getMessages(locale: AppLocale): AppMessages {
  return messagesByLocale[locale];
}
