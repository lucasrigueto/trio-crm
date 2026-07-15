import { defaultLocale, type AppLocale } from "./config";

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(
  value: DateInput,
  locale: AppLocale = defaultLocale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(toDate(value));
}

export function formatDateTime(
  value: DateInput,
  locale: AppLocale = defaultLocale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(toDate(value));
}

export function formatNumber(
  value: number,
  locale: AppLocale = defaultLocale,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(
  value: number,
  locale: AppLocale = defaultLocale,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatNumber(value, locale, {
    style: "percent",
    maximumFractionDigits: 1,
    ...options,
  });
}

export function formatCurrency(
  value: number,
  currency = "BRL",
  locale: AppLocale = defaultLocale,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatNumber(value, locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
}

export function formatRelativeTime(
  value: DateInput,
  base: DateInput = new Date(),
  locale: AppLocale = defaultLocale,
): string {
  const deltaSeconds = Math.round(
    (toDate(value).getTime() - toDate(base).getTime()) / 1000,
  );
  const absSeconds = Math.abs(deltaSeconds);
  const divisions = [
    { unit: "year", seconds: 60 * 60 * 24 * 365 },
    { unit: "month", seconds: 60 * 60 * 24 * 30 },
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ] as const;
  const division =
    divisions.find((candidate) => absSeconds >= candidate.seconds) ??
    divisions[divisions.length - 1];

  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    Math.round(deltaSeconds / division.seconds),
    division.unit,
  );
}
