import type { AppMessages } from "@/i18n/messages";
import { formats } from "@/i18n/request";
import { routing } from "@/i18n/routing";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: AppMessages;
    Formats: typeof formats;
  }
}
