import { useLanguageStore } from '@store/language-store';
import { Stack } from 'expo-router';

export default function CheckoutLayout() {
  const { isRTL } = useLanguageStore();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
        animation: isRTL ? 'slide_from_left' : 'slide_from_right',
        presentation: 'card',
      }}
    />
  );
} 