import ErrorBoundary from '@components/ErrorBoundary';
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


function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { isFirstTimeUser, isRTL, currentLanguage, init, isLoading, checkAndSetNavigationLock } = useLanguageStore();
  const router = useRouter();
  const navigationPerformedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    async function prepare() {
      try {


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
          // Navigate to language selection (route path)
          router.replace('/language-selection');
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
          <View style={{ flex: 1 }} key={`${isRTL}-${currentLanguage}` as any}>
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

export default RootLayout;
