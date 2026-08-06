import type { Locale } from "./models";

const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;
/** Harakat, hamza marks, superscript alef, and the Quranic annotation block. */
const ARABIC_MARKS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
/** Tatweel plus the zero-width and bidi controls that survive copy-paste. */
const INVISIBLES = /[\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const PUNCTUATION = /[\p{P}\p{S}]/gu;

/**
 * Folds a query and a catalog term onto the same key: NFKD compatibility
 * decomposition, Arabic marks/tatweel removal, Alef/Yaa/Taa-marbuta and Persian
 * letter unification, Arabic-Indic digit folding, and punctuation/whitespace
 * collapse. Search then matches on curated aliases rather than guessed stems.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(ARABIC_MARKS, "")
    .replace(INVISIBLES, "")
    .replace(ARABIC_INDIC_DIGITS, (digit) => String((digit.codePointAt(0)! - 0x0660) % 16))
    .replace(/[آأإاٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىی]/g, "ي")
    .replace(/ک/g, "ك")
    .replace(/ھ/g, "ه")
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim()
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

export function formatTime(value: string | Date, locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTime(value: string | Date, locale: Locale = "ar"): string {
  return `${formatDate(value, locale)} · ${formatTime(value, locale)}`;
}
