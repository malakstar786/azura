import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { useLanguageStore } from '@store/language-store';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  error?: Error | null;
};

export default function RouteErrorFallback({ error }: Props) {
  const { t } = useTranslation();
  const isRTL = useLanguageStore((s) => s.isRTL);
  const pathname = usePathname();

  const handleRetry = () => {
    try {
      if (pathname) router.replace(pathname as any);
      else router.replace('/');
    } catch {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container} accessibilityRole="alert">
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t('common.error')}</Text>
        <Text style={[styles.message, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('order.errorSubMessage')}
        </Text>
        {__DEV__ && error?.message ? (
          <Text style={[styles.details, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={4}>
            {error?.message}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.homeButton}>
            <Text style={styles.homeText}>{t('nav.home')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    marginBottom: theme.spacing.sm,
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    marginBottom: theme.spacing.md,
  },
  details: {
    color: theme.colors.mediumGray,
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.buttonPrimary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  retryText: {
    color: theme.colors.white,
  },
  homeButton: {
    backgroundColor: theme.colors.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  homeText: {
    color: theme.colors.white,
  },
});


