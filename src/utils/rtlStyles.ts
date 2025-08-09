import { useLanguageStore } from '@store/language-store'

function getIsRTL(): boolean {
  return useLanguageStore.getState().isRTL
}

export function getFlexDirection(base: 'row' | 'row-reverse' | 'column' | 'column-reverse' = 'row') {
  if (base === 'row' || base === 'row-reverse') {
    return getIsRTL() ? 'row-reverse' : 'row'
  }
  return base
}

export function getTextAlign(defaultAlign: 'auto' | 'left' | 'right' | 'center' = 'auto') {
  if (defaultAlign !== 'auto') return defaultAlign
  return getIsRTL() ? 'right' : 'left'
}

export function getAbsolutePosition(side: 'left' | 'right', value: number) {
  const actualSide = getIsRTL() ? (side === 'left' ? 'right' : 'left') : side
  return { [actualSide]: value } as Record<'left' | 'right', number>
}

export function useRTL() {
  const isRTL = useLanguageStore((s) => s.isRTL)
  return { isRTL }
}


