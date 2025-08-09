import { t as i18nTranslate, setI18nLanguage } from '@/i18n'
import { useLanguageStore } from '@store/language-store'
import type { TranslationKeys } from '@utils/translations'
import React from 'react'

function formatWithPlaceholders(template: string, values?: Array<string | number>): string {
  if (!values || values.length === 0) return template
  return values.reduce((acc: string, value, index) => acc.replace(new RegExp(`\\{${index}\\}`, 'g'), String(value)), template)
}

export function useTranslation() {
  const currentLanguage = useLanguageStore((s) => s.currentLanguage)

  // Ensure i18n instance tracks latest language for direct t() calls in non-hook modules
  React.useEffect(() => {
    setI18nLanguage(currentLanguage as any)
  }, [currentLanguage])

  const t = React.useCallback(
    (key: TranslationKeys, params?: Array<string | number>) => {
      const raw = i18nTranslate(key as unknown as any)
      return formatWithPlaceholders(raw, params)
    },
    [currentLanguage]
  )

  return { t, currentLanguage }
}


