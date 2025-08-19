import { getBestDeviceLanguage, setI18nLanguage } from '@/i18n';
import { theme } from '@/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, DevSettings, I18nManager, Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'en' | 'ar';

// Navigation lock key
const NAVIGATION_LOCK_KEY = '@azura_navigation_lock';

interface LanguageState {
  currentLanguage: Language;
  isRTL: boolean;
  isFirstTimeUser: boolean;
  isLoading: boolean;
  restartRequired: boolean;
  lastUpdated: number; // Add timestamp to track updates
  setLanguage: (language: Language) => Promise<void>;
  setIsFirstTimeUser: (isFirstTimeUser: boolean) => void;
  init: () => Promise<void>;
  initialize: () => Promise<void>; // deprecated alias for init
  clearRestartFlag: () => void;
  checkAndSetNavigationLock: () => Promise<boolean>;
}

// Check if navigation lock exists
const checkNavigationLock = async (): Promise<boolean> => {
  try {
    const lockExists = await AsyncStorage.getItem(NAVIGATION_LOCK_KEY);
    return lockExists === 'true';
  } catch (error) {
    console.error('Error checking navigation lock:', error);
    return false;
  }
};

// Set navigation lock
const setNavigationLock = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(NAVIGATION_LOCK_KEY, 'true');
  } catch (error) {
    console.error('Error setting navigation lock:', error);
  }
};

// Create store with persistence
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      // Default state
      currentLanguage: 'en',
      isRTL: false,
      isFirstTimeUser: true,
      isLoading: true,
      restartRequired: false,
      lastUpdated: Date.now(), // Initialize with current timestamp
      
      // Sets the language, updates I18nManager, and persists
      setLanguage: async (language: Language) => {
        const isNewRTL = language === 'ar';
        const directionChangeNeeded = I18nManager.isRTL !== isNewRTL;

        // 1) Apply locale and persist BEFORE any potential reload so the choice survives reload
        setI18nLanguage(language);

        // Update theme RTL properties for immediate UI consistency
        theme.rtl.isRTL = isNewRTL;
        theme.rtl.textAlign = isNewRTL ? 'right' : 'left';
        theme.rtl.flexDirection = isNewRTL ? 'row-reverse' : 'row';

        // Persist language for next app start
        try {
          await AsyncStorage.setItem('appLanguage', language);
        } catch (error) {
        }

        // Update store state so subscribers re-render immediately
        set({
          currentLanguage: language,
          isRTL: isNewRTL,
          restartRequired: directionChangeNeeded,
          lastUpdated: Date.now(),
        });

        // 2) If direction changed, update I18nManager and trigger reload last
        if (directionChangeNeeded) {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(isNewRTL);
          if (Platform.OS !== 'web') {
            try {
              if (__DEV__) {
                DevSettings.reload();
              } else {
                // Optional runtime import to avoid dependency requirement in dev
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const Updates = (() => { try { return require('expo-updates') } catch { return null } })();
                if (Updates?.reloadAsync) {
                  await Updates.reloadAsync();
                } else {
                  Alert.alert('Restart Required', 'Please restart the app to apply language direction changes.');
                }
              }
            } catch {
              Alert.alert('Restart Required', 'Please restart the app to apply language direction changes.');
            }
          }
        }
      },
      
      // Update first-time user flag
      setIsFirstTimeUser: (isFirstTimeUser: boolean) => {
        
        // Persist the first-time user status in AsyncStorage immediately
        try {
          AsyncStorage.setItem('isFirstTimeUser', isFirstTimeUser ? 'true' : 'false');
        } catch (err) {
        }
        
        set({ isFirstTimeUser });
      },
      
      // Check and set navigation lock
      checkAndSetNavigationLock: async () => {
        const lockExists = await checkNavigationLock();
        if (!lockExists) {
          await setNavigationLock();
          return false;
        }
        return true;
      },
      
      // Initializes language on app start
      init: async () => {
        try {
          
          // Check if user has completed first-time setup
          const isFirstTimeUserStored = await AsyncStorage.getItem('isFirstTimeUser');
          const isFirstTime = isFirstTimeUserStored !== 'false';
          
          // Get stored language preference from AsyncStorage
          const storedLanguage = await AsyncStorage.getItem('appLanguage');
          const deviceDefault = getBestDeviceLanguage() as Language;
          let initialLanguage: Language = deviceDefault; // Default to best device language
          
          // If appLanguage found, use it
          if (storedLanguage === 'en' || storedLanguage === 'ar') {
            initialLanguage = storedLanguage;
          } else {
            // If no appLanguage found, check the old persistence format for backwards compatibility
            const storedState = await AsyncStorage.getItem('language-storage');
            if (storedState) {
              try {
                const parsedState = JSON.parse(storedState);
                if (parsedState && parsedState.state && 
                    (parsedState.state.currentLanguage === 'en' || parsedState.state.currentLanguage === 'ar')) {
                  initialLanguage = parsedState.state.currentLanguage;
                  // Migrate the old format to the new one
                  await AsyncStorage.setItem('appLanguage', initialLanguage);
                }
              } catch (e) {
              }
            }
          }

          // Apply i18n language immediately
          setI18nLanguage(initialLanguage)

          // SAFE: Only update I18nManager if it's different and we're not in production
          const initialIsRTL = initialLanguage === 'ar';
          
          // Update theme RTL properties
          theme.rtl.isRTL = initialIsRTL;
          theme.rtl.textAlign = initialIsRTL ? 'right' : 'left';
          theme.rtl.flexDirection = initialIsRTL ? 'row-reverse' : 'row';
          
          set({ 
            currentLanguage: initialLanguage, 
            isRTL: initialIsRTL,
            isLoading: false,
            isFirstTimeUser: isFirstTime
          });

        } catch (error) {
          // Fallback to default if error
          set({ 
            currentLanguage: 'en', 
            isRTL: false,
            isLoading: false,
            isFirstTimeUser: true
          });
        }
      },
      initialize: async () => {
        // Backwards-compatible alias
        await (useLanguageStore.getState().init?.() ?? Promise.resolve());
      },
      clearRestartFlag: () => {
        set({ restartRequired: false });
      }
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 