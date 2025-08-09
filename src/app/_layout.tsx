import ErrorBoundary from '@components/ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { useLanguageStore } from '@store/language-store';
import { theme } from '@theme';
import { getOrCreateOCSESSID } from '@utils/api-config';
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from "react-native-toast-notifications";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

// Initialize Sentry as early as possible in the app lifecycle
Sentry.init({
  dsn: 'https://dc70f4727ce6f5731cf5b126b02b3f7b@o4509813436055552.ingest.de.sentry.io/4509813455519824',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  spotlight: __DEV__,
});

function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { isFirstTimeUser, isRTL, init, isLoading, checkAndSetNavigationLock } = useLanguageStore();
  const router = useRouter();
  const navigationPerformedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    async function prepare() {
      try {
        // For debugging - uncomment to reset specific parts of app state
        // await resetAppState(); // Reset all app state
        // await clearNavigationLock(); // Only clear navigation lock
        // await resetFirstTimeUser(); // Only reset first-time user flag
        

        // Initialize OCSESSID first with extra safety
        try {
          await getOrCreateOCSESSID();
        } catch (ocsessidError) {
          console.warn('OCSESSID initialization failed, continuing with fallback:', ocsessidError);
        }
        
        // Initialize language store with extra safety
        try {
          await init();
        } catch (languageError) {
          console.warn('Language initialization failed, using defaults:', languageError);
          // Set safe fallback state if language store fails
          if (isMounted) {
            setIsReady(true);
          }
          return; // Exit early to prevent further issues
        }
        
        // Hide the native splash screen safely when initialization is complete
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.warn('SplashScreen.hideAsync failed:', splashError);
        }
        
        // Mark the app as ready only if component is still mounted
        if (isMounted) {
          setIsReady(true);
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
        // Always mark as ready to prevent infinite loading
        if (isMounted) {
          setIsReady(true);
        }
      }
    }
    
    prepare();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle navigation once after splash screen is hidden
  useEffect(() => {
    async function handleNavigation() {
      if (isReady && !navigationPerformedRef.current) {
        navigationPerformedRef.current = true;
        
        // Check if we've already navigated to language selection in this session
        const hasNavigationLock = await checkAndSetNavigationLock();
        
        if (isFirstTimeUser && !hasNavigationLock) {
          console.log("First time user detected, navigating to language selection");
          // Set AsyncStorage directly to ensure consistency
          await AsyncStorage.setItem('isFirstTimeUser', 'false');
          // Navigate to language selection
          router.replace("language-selection/index" as any);
        } else {
          console.log("Not first time user or navigation already occurred, staying on main screen");
        }
      }
    }
    handleNavigation();
  }, [isReady, isFirstTimeUser, checkAndSetNavigationLock, router]);

  // While initializing, keep rendering nothing so the native splash remains visible
  if (!isReady || isLoading) return null;

  return (
    <ToastProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
          <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.white,
            },
            headerTintColor: theme.colors.black,
            // Configure RTL-aware navigation direction
            animation: isRTL ? 'slide_from_left' : 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="(shop)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="categories"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="product"
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="auth" 
            options={{ headerShown: true }} 
          />
          <Stack.Screen
            name="orders/index"
            options={{
              headerShown: false,
              animation: isRTL ? 'slide_from_left' : 'slide_from_right',
              presentation: 'card'
            }}
          />
          <Stack.Screen
            name="checkout"
            options={{
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="language-selection/index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="policies" 
            options={{ headerShown: true }} 
          />
          <Stack.Screen
            name="order-success"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="order-failure"
            options={{ headerShown: false }}
          />
          </Stack>
          </View>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ToastProvider>
  );
}

export default Sentry.wrap(RootLayout);
