import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import type { Formats } from "next-intl";
import { defaultLocale, localeCookieName, resolveRequestLocale } from "./config";
import { getMessages } from "./messages";

export const formats = {
  dateTime: {
    date: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
    dateTime: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  },
  number: {
    integer: {
      maximumFractionDigits: 0,
    },
    percent: {
      style: "percent",
      maximumFractionDigits: 1,
    },
    currency: {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  },
} satisfies Formats;

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies();
  const requestedLocale = await requestLocale;
  const locale = resolveRequestLocale({
    cookieLocale: cookieStore.get(localeCookieName)?.value,
    routeLocale: requestedLocale,
  });

  return {
    locale,
    messages: getMessages(locale),
    formats,
    timeZone: "America/Sao_Paulo",
    defaultTranslationValues: {},
    now: new Date(),
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[i18n]", error);
      }
    },
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter(Boolean).join(".");
      return path || defaultLocale;
    },
  };
});
