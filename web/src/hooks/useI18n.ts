import { useCallback, useEffect, useState } from "preact/hooks";
import en from "../i18n/en.json";
import ja from "../i18n/ja.json";

type Lang = "en" | "ja";
type TranslationKey = keyof typeof en;

const translations: Record<Lang, Record<string, string>> = { en, ja };

const STORAGE_KEY = "icm-calc-lang";

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ja") return stored;
  } catch {
    // localStorage not available
  }
  return "en";
}

export function useI18n() {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: TranslationKey | string): string => {
      return translations[lang][key] ?? key;
    },
    [lang],
  );

  return { t, lang, setLang };
}
