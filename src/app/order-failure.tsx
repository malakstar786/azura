import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@theme';
import { useTranslation } from '@utils/translations';

export default function OrderFailureScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleTryAgain = () => {
    // Navigate back to checkout
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.errorIcon}>
          <View style={styles.receiptIcon}>
            <Ionicons name="receipt-outline" size={40} color={theme.colors.black} />
            <View style={styles.xIcon}>
              <Ionicons name="close" size={24} color={theme.colors.black} />
            </View>
          </View>
        </View>
        
        <Text style={styles.errorTitle}>{t('order.errorTitle')}</Text>
        <Text style={styles.errorMessage}>
          {t('order.errorMessage')}
        </Text>
        <Text style={styles.errorSubMessage}>
          {t('order.errorSubMessage')}
        </Text>
      </View>

      <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
        <Text style={styles.tryAgainButtonText}>{t('order.tryAgain')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 120,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  errorIcon: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: theme.colors.black,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
  },
  xIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.semibold as any,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubMessage: {
    fontSize: 16,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.semibold as any,
    textAlign: 'center',
  },
  tryAgainButton: {
    backgroundColor: theme.colors.black,
    paddingVertical: 16,
    borderRadius: 0,
    alignItems: 'center',
    marginBottom: 40,
  },
  tryAgainButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.semibold as any,
    letterSpacing: 1,
  },
}); 