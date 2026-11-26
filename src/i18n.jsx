import { createContext, useContext } from 'react';
import en from './locales/en.js';
import hy from './locales/hy.js';

export const LANGS = ['hy', 'en'];
export const DEFAULT_LANG = 'hy';

// UI copy lives in src/locales/<lang>.js (one key per line; `npm run i18n:check` finds gaps).
// Product names and descriptions live in the catalog data. Missing keys fall back to English, then to the key itself.
const DICT = { en, hy };

export const translate = (lang, key) => DICT[lang]?.[key] ?? DICT.en[key] ?? key;

const LangCtx = createContext(DEFAULT_LANG);
export const LangProvider = ({ lang, children }) => <LangCtx.Provider value={lang}>{children}</LangCtx.Provider>;
export const useLang = () => useContext(LangCtx);

export function useT() {
  const lang = useLang();
  const t = (key, vars) => {
    let s = DICT[lang]?.[key] ?? DICT.en[key] ?? key;
    if (vars) for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
    return s;
  };
  // pick the right language from a {en, hy} object coming from the catalog
  t.pick = obj => (obj && (obj[lang] || obj.en)) || '';
  t.lang = lang;
  t.path = p => `/${lang}${p.startsWith('/') ? p : '/' + p}`;
  return t;
}
