import { translations, type TranslationKeys } from '@utils/translations'
import * as Localization from 'expo-localization'
import i18n from 'i18n-js'

export type SupportedLanguage = 'en' | 'ar'

// Register dictionaries from our existing translations file
i18n.translations = {
  en: translations.en,
  ar: translations.ar,
}

i18n.defaultLocale = 'en'
i18n.fallbacks = true

export function getBestDeviceLanguage(): SupportedLanguage {
  const [primary] = Localization.getLocales()
  const tag = primary?.languageTag?.toLowerCase() ?? 'en'
  if (tag.startsWith('ar')) return 'ar'
  return 'en'
}

export function setI18nLanguage(lang: SupportedLanguage): void {
  i18n.locale = lang
}

export function t(key: TranslationKeys, options?: any): string {
  return i18n.t(key as unknown as string, options)
}

export function getTextDirectionFor(lang: SupportedLanguage): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}

export function isRTL(lang: SupportedLanguage): boolean {
  return getTextDirectionFor(lang) === 'rtl'
}


