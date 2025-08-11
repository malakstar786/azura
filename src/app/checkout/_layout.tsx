import { useLanguageStore } from '@store/language-store';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function CheckoutLayout() {
  const { isRTL } = useLanguageStore();
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        contentStyle: { backgroundColor: '#fff' },
        // Present checkout like a modal on both platforms for consistency
        presentation: 'modal',
        animation: isRTL ? 'slide_from_left' : 'slide_from_right',
        // Ensure proper top spacing on Android by adding a transparent title to keep default toolbar height
        headerTransparent: Platform.OS === 'android' ? false : undefined,
      }}
    />
  );
} 