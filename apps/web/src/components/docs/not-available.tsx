import { routing } from "@/i18n/routing"
import type { LocaleOptions } from "@/lib/opendocs/types/i18n"

const messages: Record<LocaleOptions, string> = {
  ar: "هذا المحتوى غير متوفر بلغتك بعد",
  bn: "এই কনটেন্টটি এখনও আপনার ভাষায় উপলভ্য নয়",
  cs: "Tento obsah zatím není dostupný ve vašem jazyce",
  da: "Dette indhold er endnu ikke tilgængeligt på dit sprog",
  de: "Dieser Inhalt ist noch nicht in Ihrer Sprache verfügbar",
  el: "Αυτό το περιεχόμενο δεν είναι ακόμη διαθέσιμο στη γλώσσα σας",
  en: "This content is not available in your language yet",
  es: "Este contenido aún no está disponible en tu idioma",
  fi: "Tämä sisältö ei ole vielä saatavilla kielelläsi",
  fr: "Ce contenu n'est pas encore disponible dans votre langue",
  hi: "यह सामग्री अभी आपकी भाषा में उपलब्ध नहीं है",
  hr: "Ovaj sadržaj još nije dostupan na vašem jeziku",
  hu: "Ez a tartalom még nem érhető el az Ön nyelvén",
  id: "Konten ini belum tersedia dalam bahasa Anda",
  it: "Questo contenuto non è ancora disponibile nella tua lingua",
  ja: "このコンテンツはまだあなたの言語で利用できません",
  mr: "ही सामग्री अद्याप तुमच्या भाषेत उपलब्ध नाही",
  nl: "Deze inhoud is nog niet beschikbaar in je taal",
  no: "Dette innholdet er ikke tilgjengelig på språket ditt ennå",
  pl: "Ta treść nie jest jeszcze dostępna w Twoim języku",
  pt: "Este conteúdo ainda não está disponível em seu idioma",
  ro: "Acest conținut nu este încă disponibil în limba ta",
  ru: "Этот контент пока не доступен на вашем языке",
  sl: "Ta vsebina še ni na voljo v vašem jeziku",
  sr: "Овај садржај још није доступан на вашем језику",
  sv: "Det här innehållet är inte tillgängligt på ditt språk ännu",
  te: "ఈ కంటెంట్ ఇంకా మీ భాషలో అందుబాటులో లేదు",
  th: "เนื้อหานี้ยังไม่มีให้บริการในภาษาของคุณ",
  tr: "Bu içerik henüz dilinizde mevcut değil",
  uk: "Цей вміст ще недоступний вашою мовою",
  ur: "یہ مواد ابھی آپ کی زبان میں دستیاب نہیں ہے",
  zh: "此内容尚未提供您的语言版本"
}

type Props = {
  locale: LocaleOptions | string
}

export function DocNotAvailableInThisLanguage({ locale }: Props) {
  const message = messages[locale as LocaleOptions]

  return (
    <div className="rounded-md border border-amber-600/50 bg-amber-800/70 p-4">
      ⚠️ {message || messages[routing.defaultLocale]}.
    </div>
  )
}
