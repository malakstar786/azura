## Localization and RTL Implementation Guide (Expo SDK 53)

This guide explains exactly how to implement localization (English/Arabic) and full RTL support in the Azura app using Expo Localization and `i18n-js`, aligned with our PRD and development practices.

### Goals (from PRD)
- First-time users see a language selection screen right after the splash.
- Existing users can change language from the Account tab.
- All API calls must include `language=ar` when Arabic is selected.
- Full RTL behavior for Arabic users (layout direction, text alignment, icon mirroring where needed).

### Packages
- Use pnpm only (see development guide).

```bash
pnpm add expo-localization i18n-js @react-native-async-storage/async-storage
```

Notes:
- `expo-localization` provides device locale info, including `textDirection`.
- `i18n-js` manages translation dictionaries.
- `@react-native-async-storage/async-storage` persists the user’s language choice.

Optional (not required): add the `expo-localization` config plugin in `app.json`.

```json
{
  "expo": {
    "plugins": ["expo-localization"]
  }
}
```

### Directory structure
We keep all i18n code under `src/i18n` and translation files per locale.

```
src/
  i18n/
    index.ts
    locales/
      en.json
      ar.json
```

### Translation dictionaries
Create `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`.

Example keys (expand as needed):

```json
// src/i18n/locales/en.json
{
  "app": {
    "title": "AZURA",
    "ok": "OK",
    "cancel": "Cancel"
  },
  "language": {
    "english": "English",
    "arabic": "Arabic",
    "choose": "Choose your language"
  }
}
```

```json
// src/i18n/locales/ar.json
{
  "app": {
    "title": "أزورَا",
    "ok": "حسناً",
    "cancel": "إلغاء"
  },
  "language": {
    "english": "الإنجليزية",
    "arabic": "العربية",
    "choose": "اختر لغتك"
  }
}
```

### i18n initialization
Create `src/i18n/index.ts` to initialize `i18n-js` and expose helpers. Use aliases as per the development guide.

```ts
// src/i18n/index.ts
import * as Localization from 'expo-localization'
import i18n from 'i18n-js'
import en from './locales/en.json'
import ar from './locales/ar.json'

// Map supported language tags to our keys
export type SupportedLanguage = 'en' | 'ar'
export const supportedLanguages: SupportedLanguage[] = ['en', 'ar']

// i18n configuration
i18n.translations = { en, ar }
i18n.defaultLocale = 'en'
i18n.fallbacks = true

// Resolve best language from device
export function getBestDeviceLanguage(): SupportedLanguage {
  const [primary] = Localization.getLocales()
  const tag = primary?.languageTag?.toLowerCase() ?? 'en'
  if (tag.startsWith('ar')) return 'ar'
  return 'en'
}

export function setI18nLanguage(lang: SupportedLanguage) {
  i18n.locale = lang
}

export function t(key: string, options?: i18n.TranslateOptions) {
  return i18n.t(key, options)
}

// Returns 'rtl' | 'ltr' for current locale
export function getTextDirectionFor(lang: SupportedLanguage): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}

// Convenience
export function isRTL(lang: SupportedLanguage): boolean {
  return getTextDirectionFor(lang) === 'rtl'
}
```

### Locale store (Zustand) with persistence
Create a small store to hold the chosen language and expose a setter. Persist using AsyncStorage so we can restore on next launch.

```ts
// src/store/locale-store.ts
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getBestDeviceLanguage, setI18nLanguage, isRTL, type SupportedLanguage } from '@/i18n'
import { I18nManager, Platform } from 'react-native'

interface LocaleState {
  language: SupportedLanguage
  rtl: boolean
  initialized: boolean
  init: () => Promise<void>
  setLanguage: (lang: SupportedLanguage) => Promise<void>
}

const STORAGE_KEY = 'azura.language'

export const useLocaleStore = create<LocaleState>((set, get) => ({
  language: 'en',
  rtl: false,
  initialized: false,

  init: async () => {
    try {
      const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as SupportedLanguage | null
      const lang: SupportedLanguage = saved ?? getBestDeviceLanguage()
      setI18nLanguage(lang)
      const rtl = isRTL(lang)
      set({ language: lang, rtl, initialized: true })
      // Set native layout direction at boot (no reload needed if unchanged)
      I18nManager.allowRTL(true)
      if (I18nManager.isRTL !== rtl) {
        I18nManager.forceRTL(rtl)
        // A full app reload is required for native direction changes to apply across the tree.
        // In dev, Metro reload is enough; in production, prompt user to restart or trigger an updates reload.
      }
    } catch {
      const lang = 'en' as const
      setI18nLanguage(lang)
      set({ language: lang, rtl: false, initialized: true })
    }
  },

  setLanguage: async (lang) => {
    setI18nLanguage(lang)
    const rtl = isRTL(lang)
    await AsyncStorage.setItem(STORAGE_KEY, lang)
    set({ language: lang, rtl })

    I18nManager.allowRTL(true)
    const mustReload = I18nManager.isRTL !== rtl
    if (mustReload) {
      I18nManager.forceRTL(rtl)
      // See RTL reload guidance below
    }
  },
}))
```

### App entry integration (expo-router)
In the root layout (`src/app/_layout.tsx`), initialize locale before rendering the tree. Apply logical layout and text alignment styles using `rtl` from the store to avoid relying solely on native reloads.

```tsx
// src/app/_layout.tsx (excerpt)
import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useLocaleStore } from '@store/locale-store'
import { View, I18nManager } from 'react-native'

export default function RootLayout() {
  const { init, initialized, rtl } = useLocaleStore()

  useEffect(() => {
    init()
  }, [init])

  if (!initialized) return null

  return (
    <View style={{ flex: 1, direction: rtl ? 'rtl' : 'ltr' }}>
      <Stack screenOptions={{ headerBackTitleVisible: false }} />
    </View>
  )
}
```

Notes:
- The `direction` style helps align layout in JS immediately. Native mirroring from `I18nManager.forceRTL` applies after a reload.
- Keep using `start`/`end` logical styles so UI is direction-agnostic (see best practices below).

### First-run language selection screen
- Show immediately after splash if no saved language in storage (i.e., `initialized && !saved`). You can route to `src/app/auth.tsx` or a dedicated `src/app/language.tsx` screen.
- On select: call `useLocaleStore.getState().setLanguage('ar' | 'en')` then either:
  - For dev: `DevSettings.reload()` to apply native direction, or
  - For production: prompt the user to restart, or integrate `expo-updates` and call `Updates.reloadAsync()`.

Example handler:

```ts
import { DevSettings, Platform, Alert } from 'react-native'
// import * as Updates from 'expo-updates' // optional if added

async function onSelectLanguage(lang: 'en' | 'ar') {
  const { setLanguage } = useLocaleStore.getState()
  await setLanguage(lang)
  if (Platform.OS !== 'web') {
    // Dev reload is enough to re-mount with new native direction
    if (__DEV__) DevSettings.reload()
    else Alert.alert('Restart Required', 'Please restart the app to apply language direction changes.')
    // Or, if using expo-updates:
    // await Updates.reloadAsync()
  }
}
```

### Account tab language switcher
Provide a simple toggle inside the Account tab. Same behavior as above: set language, then reload per the same rule.

### Using translations in components
Prefer a thin wrapper so we can swap i18n engines if needed. Import from `@/i18n` and use `t()`.

```tsx
import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { t } from '@/i18n'
import { theme } from '@/theme'
import { useLocaleStore } from '@store/locale-store'

export function SectionTitle() {
  const rtl = useLocaleStore((s) => s.rtl)
  return <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>{t('app.title')}</Text>
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
})
```

### RTL best practices (critical)
- Use logical layout and spacing:
  - `paddingStart`/`paddingEnd`, `marginStart`/`marginEnd`
  - `textAlign: 'auto'` when possible; otherwise compute from `rtl`.
  - For rows, prefer `flexDirection: rtl ? 'row-reverse' : 'row'`.
- Avoid hardcoding `left`/`right` where semantics should be `start`/`end`.
- Icons/images that imply direction (chevrons, arrows) should mirror in RTL:

```tsx
import { I18nManager, Image, ImageSourcePropType } from 'react-native'

function DirectionalIcon({ source }: { source: ImageSourcePropType }) {
  return <Image source={source} style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
}
```

- Gradually refactor styles to be RTL-safe. Start with navigation headers, lists, and any LTR-specific paddings.

### API integration: pass language=ar
All API requests must include `language=ar` when Arabic is active. Add a small helper that reads the current language and appends the query parameter.

```ts
// src/utils/api-language.ts
import { useLocaleStore } from '@store/locale-store'

export function appendLanguageParam(url: string): string {
  const language = useLocaleStore.getState().language
  if (language !== 'ar') return url
  const hasQuery = url.includes('?')
  return `${url}${hasQuery ? '&' : '?'}language=ar`
}
```

Usage in fetch wrappers:

```ts
const url = appendLanguageParam(`${BASE_URL}/index.php?route=extension/mstore/product`)
const res = await fetch(url, { credentials: 'include' })
```

For POST endpoints that expect `application/json` or form-data bodies, the server expects `language` as a query param in the URL (not body). Always append via the helper.

### Numbers, dates, and currency
- Use built-in `Intl` for formatting. Example: `price.toLocaleString(language === 'ar' ? 'ar' : 'en-US')`.
- For currency symbols (e.g., KD), keep server-provided formats when available. If formatting client-side, prefer `Intl.NumberFormat(locale, { style: 'currency', currency: 'KWD' })`.

### Testing checklist
- Change device language to Arabic and launch the app:
  - Layout mirrors correctly (lists, headers, product cards).
  - Text aligns to the right where appropriate.
  - Directional icons mirror.
  - API URLs include `language=ar`.
- Toggle language from Account tab:
  - After confirming or restarting, the app direction updates globally.
  - Locale persists across relaunches.

### Common pitfalls and fixes
- Direction not applied after switching language: ensure `I18nManager.forceRTL(rtl)` is called and app is reloaded.
- Mixed alignment: refactor styles to use `start`/`end` and compute `textAlign` from store.
- Web platform: `I18nManager.forceRTL` has no effect. Rely on container `direction` style and logical CSS properties.

### Quick reference
- Get device locales: `Localization.getLocales()` → `[ { languageTag, languageCode, regionCode, textDirection } ]`
- Determine RTL: `textDirection === 'rtl'` or app language is `'ar'`.
- Set i18n language: `setI18nLanguage('en' | 'ar')`
- Native RTL: `I18nManager.allowRTL(true)` + `I18nManager.forceRTL(true|false)` then reload.

This setup aligns with our PRD and development guide, supports first-run selection, in-app switching, full RTL, and ensures all API calls are localized.

