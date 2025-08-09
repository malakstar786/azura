import { useLanguageStore } from '@store/language-store'

export function appendLanguageParam(url: string): string {
  const language = useLanguageStore.getState().currentLanguage
  if (language !== 'ar') return url
  try {
    const urlObj = new URL(url)
    // Avoid duplicating language param
    if (!urlObj.searchParams.has('language')) {
      urlObj.searchParams.set('language', 'ar')
    }
    return urlObj.toString()
  } catch {
    // Fallback for relative URLs without base
    const hasQuery = url.includes('?')
    if (/([?&])language=/.test(url)) return url
    return `${url}${hasQuery ? '&' : '?'}language=ar`
  }
}


