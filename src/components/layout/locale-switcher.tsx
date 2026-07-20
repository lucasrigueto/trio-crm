"use client";

import { Globe2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  localeCookieMaxAge,
  localeCookieName,
  type AppLocale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

const localeOptions: Array<{
  value: AppLocale;
  shortLabel: string;
  labelKey: "ptBR" | "enUS";
}> = [
  { value: "pt-BR", shortLabel: "PT", labelKey: "ptBR" },
  { value: "en-US", shortLabel: "EN", labelKey: "enUS" },
];

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations("navigation.language");

  function setLocale(nextLocale: AppLocale) {
    // Required to persist the locale before refreshing server-rendered copy.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${localeCookieName}=${nextLocale}; Path=/; Max-Age=${localeCookieMaxAge}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5"
      aria-label={t("label")}
    >
      <Globe2 className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden />
      {localeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLocale(option.value)}
          aria-label={t("switchTo", { locale: t(option.labelKey) })}
          aria-current={locale === option.value ? "true" : undefined}
          className={cn(
            "h-7 rounded px-2 text-[11px] font-semibold transition-colors",
            locale === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  );
}
