import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { useLanguageStore } from '@store/language-store';
import React from 'react';
import { DevSettings, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Optional: use expo-updates if available in production for a clean reload
let Updates: { reloadAsync?: () => Promise<void> } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Updates = require('expo-updates');
} catch {
  Updates = null;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<unknown>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<unknown>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log for diagnostics (integrate Sentry or error reporter here if/when added)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = async () => {
    this.setState({ hasError: false, error: null });
    if (Platform.OS !== 'web') {
      if (__DEV__) DevSettings.reload();
      else if (Updates?.reloadAsync) await Updates.reloadAsync();
    }
  };

  render() {
    if (this.state.hasError) return <ErrorFallback onRetry={this.handleRetry} error={this.state.error} />;
    return this.props.children as React.ReactElement;
  }
}

interface ErrorFallbackProps {
  onRetry: () => void | Promise<void>;
  error?: Error | null;
}

function ErrorFallback({ onRetry, error }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const isRTL = useLanguageStore((s) => s.isRTL);
  const showDetails = __DEV__ && error?.message;

  return (
    <SafeAreaView style={styles.container} accessibilityRole="alert" testID="error-boundary">
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t('common.error')}</Text>
        <Text style={[styles.message, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('order.errorSubMessage')}
        </Text>
        {showDetails ? (
          <Text style={[styles.details, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={4}>
            {error?.message}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Text onPress={onRetry} accessibilityRole="button" style={styles.retryButton}>
            {t('common.retry')}
          </Text>
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
  },
  retryButton: {
    backgroundColor: theme.colors.buttonPrimary,
    color: theme.colors.white,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
});
