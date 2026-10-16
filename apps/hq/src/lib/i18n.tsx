// Bilingual UI: L("English", "عربي") picks the active language. Arabic switches
// the whole app to RTL. The choice is remembered per browser.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Dialect, Lang } from "./types";
import { toSaudi } from "./saudi";

interface Ctx { lang: Lang; setLang: (l: Lang) => void; L: (en: string, ar: string) => string; dir: "ltr" | "rtl" }
const I18nCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, L: en => en, dir: "ltr" });

const initial = (): Lang => {
  try { const s = localStorage.getItem("hq-lang"); if (s === "ar" || s === "en") return s; } catch { /* ignore */ }
  return /^ar\b/i.test(navigator.language) ? "ar" : "en";
};

/** dialect: Arabic copy set for client-facing screens ("sa" swaps the Egyptian strings for Saudi ones). */
export function I18nProvider({ children, force, dialect }: { children: ReactNode; force?: Lang; dialect?: Dialect }) {
  const [lang, setLangState] = useState<Lang>(force || initial());
  useEffect(() => { if (force) setLangState(force); }, [force]);
  const dir = lang === "ar" ? "rtl" : "ltr";
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem("hq-lang", l); } catch { /* ignore */ } };
  const L = (en: string, ar: string) => (lang === "ar" ? (dialect === "sa" ? toSaudi(ar) : ar) : en);
  return <I18nCtx.Provider value={{ lang, setLang, L, dir }}>{children}</I18nCtx.Provider>;
}
export const useI18n = () => useContext(I18nCtx);
