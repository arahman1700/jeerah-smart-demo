import type { Locale } from "./models";

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/ـ/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLocaleLowerCase();
}

export function formatSar(value: number, locale: Locale = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency", currency: "SAR", currencyDisplay: "code", maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | Date, locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Riyadh",
  }).format(typeof value === "string" ? new Date(value) : value);
}
