import { t } from '@/i18n';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, makeApiCall } from '@utils/api-config';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    I18nManager,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setError(t('validation.invalidEmail'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create FormData object for form submission
      const formData = new FormData();
      formData.append('email', email);

      const response = await makeApiCall(API_ENDPOINTS.forgotPassword, {
        method: 'POST',
        data: formData
      });

      if (response.success === 1) {
        Alert.alert(
          t('common.done'),
          response.data?.[0] || t('common.done'),
          [{ text: t('common.ok'), onPress: () => router.back() }]
        );
      } else {
        setError(response.error?.[0] || t('common.error'));
      }
    } catch (error: any) {
      setError(error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: '',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.black} style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
        <Text style={styles.subtitle}>{t('signup.subtitle')}</Text>

        <View style={styles.divider} />

        <Text style={styles.instruction}>{t('auth.enterLoginDetails')}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder={t('auth.email')}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.colors.mediumGray}
            editable={!isLoading}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.sendButtonText}>{t('common.ok')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    fontWeight: theme.typography.weights.medium as any,
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 2,
    backgroundColor: theme.colors.black,
    marginBottom: theme.spacing.lg,
  },
  instruction: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.black,
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    backgroundColor: theme.colors.white,
  },
  errorText: {
    color: theme.colors.red,
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  sendButton: {
    backgroundColor: theme.colors.black,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sendButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
  },
}); 