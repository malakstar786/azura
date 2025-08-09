import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@theme';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: '' }} />
      <View style={styles.content}>
        <Link href='/(shop)'>
          <Text>{t('not.exist')}</Text>
          <Text style={styles.linkText}>{t('nav.home')}</Text>
        </Link>
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
    padding: theme.spacing.md,
  },
  linkText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium as any,
  },
});