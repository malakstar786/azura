import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { makeApiCall, API_ENDPOINTS } from '@utils/api-config';
import { theme } from '@/theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
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
          'Email Sent',
          response.data?.[0] || 'A password reset link has been sent to your email. Please check your email.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        setError(response.error?.[0] || 'Email not found');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: '',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={styles.content}>
        <Text style={styles.title}>FORGOT PASSWORD?</Text>
        <Text style={styles.subtitle}>RESET LINK WILL BE SENT TO YOUR EMAIL</Text>

        <View style={styles.divider} />

        <Text style={styles.instruction}>
          ENTER YOUR REGISTERED EMAIL
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="REGISTERED EMAIL"
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
            <Text style={styles.sendButtonText}>SEND</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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