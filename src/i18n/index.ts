import { translations, type TranslationKeys } from '@utils/translations'
import * as Localization from 'expo-localization'
import { I18n, type TranslateOptions } from 'i18n-js'

interface Dictionary {
  [key: string]: any
}

function unflatten(flat: Dictionary): Dictionary {
  const result: Dictionary = {}
  for (const flatKey of Object.keys(flat)) {
    const value = flat[flatKey]
    const parts = flatKey.split('.')
    let node = result
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]
      const isLeaf = i === parts.length - 1
      if (isLeaf) {
        node[part] = value
      } else {
        if (!node[part] || typeof node[part] !== 'object') node[part] = {}
        node = node[part]
      }
    }
  }
  return result
}

export type SupportedLanguage = 'en' | 'ar'

// Create an I18n instance and register dictionaries
const i18n = new I18n({
  en: unflatten(translations.en as unknown as Dictionary),
  ar: unflatten(translations.ar as unknown as Dictionary),
})

i18n.defaultLocale = 'en'
;(i18n as any).enableFallback = true

export function getBestDeviceLanguage(): SupportedLanguage {
  const [primary] = Localization.getLocales()
  const tag = primary?.languageTag?.toLowerCase() ?? 'en'
  if (tag.startsWith('ar')) return 'ar'
  return 'en'
}

export function setI18nLanguage(lang: SupportedLanguage): void {
  i18n.locale = lang
}

export function t(key: TranslationKeys, options?: TranslateOptions): string {
  return i18n.t(key as unknown as string, options)
}

export function getTextDirectionFor(lang: SupportedLanguage): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}

export function isRTL(lang: SupportedLanguage): boolean {
  return getTextDirectionFor(lang) === 'rtl'
}


