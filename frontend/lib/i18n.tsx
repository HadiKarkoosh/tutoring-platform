'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Lang = 'ar' | 'en';

interface LangState {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  toggle: () => void;
}

const LangContext = createContext<LangState>({
  lang: 'ar',
  dir: 'rtl',
  toggle: () => {},
});

function applyLang(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('lang', lang);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');

  // Read-only on mount — must NOT also write localStorage here, or it races
  // with the toggle()-driven write and can stomp a saved 'en' back to 'ar'.
  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'ar') {
      setLangState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  function toggle() {
    setLangState((prev) => {
      const next: Lang = prev === 'ar' ? 'en' : 'ar';
      applyLang(next);
      return next;
    });
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return <LangContext.Provider value={{ lang, dir, toggle }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

type Dict<T> = Record<keyof T, { ar: string; en: string }>;
type Resolved<T> = Record<keyof T, string>;

/** Resolve a whole { key: { ar, en } } dictionary to { key: string } for the current language. */
export function useT<T extends Dict<T>>(dict: T): Resolved<T> {
  const { lang } = useLang();
  const out = {} as Resolved<T>;
  for (const key in dict) {
    out[key] = dict[key][lang];
  }
  return out;
}
