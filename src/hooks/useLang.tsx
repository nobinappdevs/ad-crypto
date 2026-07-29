"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";
import ar from "@/i18n/ar.json";
import fr from "@/i18n/fr.json";
import hi from "@/i18n/hi.json";

export const LANG_STORAGE_KEY = "adcrypto_lang";
export const DEFAULT_LANG: LangCode = "en";
export type LangCode = "en" | "es" | "ar" | "fr" | "hi";

export const LANGUAGES: { code: LangCode; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DICTIONARIES: Record<LangCode, any> = { en, es, ar, fr, hi };
const RTL_LANGS: LangCode[] = ["ar"];

// "a.b.c" -> walk the object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lookup(dict: any, key: string): string | undefined {
  return key
    .split(".")
    .reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

function applyDocumentLang(code: LangCode) {
  document.documentElement.setAttribute("lang", code);
  document.documentElement.setAttribute("dir", RTL_LANGS.includes(code) ? "rtl" : "ltr");
}

function detectInitialLang(): LangCode {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(LANG_STORAGE_KEY);
  } catch {}
  const browser = navigator.language?.split("-")[0];
  const candidates = [saved, browser, DEFAULT_LANG];
  const match = candidates.find((c): c is LangCode => Boolean(c) && c! in DICTIONARIES);
  return match ?? DEFAULT_LANG;
}

type LangContextValue = {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: string) => string;
  languages: typeof LANGUAGES;
  dir: "ltr" | "rtl";
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  // Start at the default so server + first client render match...
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);

  // ...then adopt saved/browser language after mount.
  useEffect(() => {
    const initial = detectInitialLang();
    applyDocumentLang(initial);
    startTransition(() => setLangState(initial));
  }, []);

  function setLang(code: LangCode) {
    if (!DICTIONARIES[code]) return;
    setLangState(code);
    applyDocumentLang(code);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch {}
  }

  // active dict -> English fallback -> the key itself (missing strings stay visible)
  function t(key: string): string {
    const active = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG];
    return lookup(active, key) ?? lookup(DICTIONARIES[DEFAULT_LANG], key) ?? key;
  }

  return (
    <LangContext.Provider
      value={{
        lang,
        setLang,
        t,
        languages: LANGUAGES,
        dir: RTL_LANGS.includes(lang) ? "rtl" : "ltr",
      }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside a <LangProvider>");
  return ctx;
}
