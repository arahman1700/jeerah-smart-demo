import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { Locale } from "../domain/models";
import { translate, type MessageKey } from "./messages";

type I18nValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children, initialLocale = "en" }: PropsWithChildren<{ initialLocale?: Locale }>) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const t = useCallback((key: MessageKey, values?: Record<string, string | number>) => translate(locale, key, values), [locale]);
  const value = useMemo<I18nValue>(() => ({ locale, dir: locale === "ar" ? "rtl" : "ltr", t, setLocale }), [locale, t]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
