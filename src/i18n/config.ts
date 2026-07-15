export const locales = ["pt-BR", "en-US"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "pt-BR";
export const localeCookieName = "TRIO_LOCALE";
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && locales.includes(value as AppLocale);
}

export function getSupportedLocale(value: unknown): AppLocale | undefined {
  return isLocale(value) ? value : undefined;
}

export function getLocaleFromPathname(pathname: string): AppLocale | undefined {
  const segment = pathname.split("/").filter(Boolean)[0];
  return getSupportedLocale(segment);
}

export function resolveRequestLocale({
  cookieLocale,
  routeLocale,
}: {
  cookieLocale?: unknown;
  routeLocale?: unknown;
}): AppLocale {
  return (
    getSupportedLocale(cookieLocale) ??
    getSupportedLocale(routeLocale) ??
    defaultLocale
  );
}
