import { useLanguageStore } from '@store/language-store'
import { I18nManager } from 'react-native'

export function getFlexDirection(base: 'row' | 'row-reverse' | 'column' | 'column-reverse' = 'row') {
  if (base === 'row' || base === 'row-reverse') {
    return I18nManager.isRTL ? 'row-reverse' : 'row'
  }
  return base
}

export function getTextAlign(defaultAlign: 'auto' | 'left' | 'right' | 'center' = 'auto') {
  if (defaultAlign !== 'auto') return defaultAlign
  return I18nManager.isRTL ? 'right' : 'left'
}

export function getAbsolutePosition(side: 'left' | 'right', value: number) {
  const actualSide = I18nManager.isRTL ? (side === 'left' ? 'right' : 'left') : side
  return { [actualSide]: value } as Record<'left' | 'right', number>
}

export function useRTL() {
  const isRTL = useLanguageStore((s) => s.isRTL)
  return { isRTL }
}


