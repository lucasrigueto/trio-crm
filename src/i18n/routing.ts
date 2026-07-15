import { defineRouting } from "next-intl/routing";
import {
  defaultLocale,
  localeCookieMaxAge,
  localeCookieName,
  locales,
} from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeCookie: {
    name: localeCookieName,
    sameSite: "lax",
    maxAge: localeCookieMaxAge,
  },
});
