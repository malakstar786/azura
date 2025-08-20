import { useTranslation } from '@/i18n/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@store/auth-store';
import { useCartStore } from '@store/cart-store';
import { theme } from '@theme';
import { API_ENDPOINTS, generateRandomOCSESSID, makeApiCall, setOCSESSID } from '@utils/api-config';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
import type { TranslationKeys } from '@utils/translations';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  I18nManager,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Auth() {
    const { t } = useTranslation();
    const { login, isAuthenticated } = useAuthStore();
    const { addToCart, getCart } = useCartStore();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    // Keep errors scoped per form to ensure messages render under the correct fields
    const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
    const [signupErrors, setSignupErrors] = useState<{ firstname?: string; lastname?: string; email?: string; telephone?: string; password?: string; form?: string }>({});
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    
    const { redirect } = useLocalSearchParams<{ redirect?: string }>();

    // Redirect if already authenticated
    useEffect(() => {
      const completePostAuthFlow = async () => {
        if (!isAuthenticated) return;
        try {
          // Merge any pending guest cart into user cart
          const pending = await AsyncStorage.getItem('@azura.pending_cart');
          if (pending) {
            const items: Array<{ product_id: string; quantity: number }> = JSON.parse(pending);
            for (const it of items) {
              const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
              await addToCart(it.product_id, qty);
            }
            await AsyncStorage.removeItem('@azura.pending_cart');
            await getCart();
          }
        } catch {}

        if (redirect === 'checkout') {
          router.replace('/checkout');
        } else if (redirect === 'cart') {
          // If the user arrived here via a cart/checkout intent, prefer checkout after signup too
          router.replace('/checkout');
        } else {
          // If we merged a pending cart, prefer checkout
          const hadPending = await AsyncStorage.getItem('@azura.pending_cart');
          if (hadPending) router.replace('/checkout');
          else router.replace('/');
        }
      };
      completePostAuthFlow();
    }, [isAuthenticated, redirect, addToCart, getCart]);

    // Login form state
    const [loginForm, setLoginForm] = useState({
      email: '',
      password: '',
    });

    // Signup form state
    const [signupForm, setSignupForm] = useState({
      firstname: '',
      lastname: '',
      email: '',
      telephone: '',
      password: '',
    });

    // Currency selection (signup-only, defer save until after account creation)
    interface Currency {
      title: string;
      code: string;
      symbol_left?: string;
      symbol_right?: string;
      image?: string;
    }
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isCurrencyLoading, setIsCurrencyLoading] = useState(false);

    useEffect(() => {
      const loadCurrencies = async () => {
        try {
          setIsCurrencyLoading(true);
          const response = await makeApiCall(API_ENDPOINTS.currencies, { method: 'GET' });
          if (response?.success === 1 && response.data?.currencies) {
            setCurrencies(response.data.currencies);
            // Do not auto-select any currency; require explicit user choice
          }
        } catch {}
        finally {
          setIsCurrencyLoading(false);
        }
      };
      loadCurrencies();
    }, []);

    const handleLoginInputChange = (field: keyof typeof loginForm, value: string) => {
      setLoginForm(prev => ({ ...prev, [field]: value }));
      if (loginErrors[field]) setLoginErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleSignupInputChange = (field: keyof typeof signupForm, value: string) => {
      setSignupForm(prev => ({ ...prev, [field]: value }));
      if (signupErrors[field as keyof typeof signupErrors]) setSignupErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleLogin = async () => {
      if (!loginForm.email || !loginForm.password) {
        setLoginErrors({ 
          email: !loginForm.email ? t('auth.loginError') : undefined,
          password: !loginForm.password ? t('auth.loginError') : undefined,
        });
        return;
      }
      
      setIsLoading(true);
      setLoginErrors({});
      
      try {
        await login(loginForm.email, loginForm.password);
        
        // Router will handle redirection in the useEffect hook
      } catch (error: any) {
        const errorMessage = t('auth.loginError');
        setLoginErrors({ email: errorMessage, password: errorMessage });
        Alert.alert(t('common.error'), errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSignup = async () => {
      
      // Validate all required fields
      const validationErrors: { firstname?: string; lastname?: string; email?: string; telephone?: string; password?: string } = {};
      
      if (!signupForm.firstname?.trim()) {
        validationErrors.firstname = t('validation.firstNameRequired');
      }
      if (!signupForm.lastname?.trim()) {
        validationErrors.lastname = t('validation.lastNameRequired');
      }
      
      if (!signupForm.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email)) {
        validationErrors.email = t('validation.invalidEmail');
      }
      
      if (!signupForm.telephone?.trim()) {
        validationErrors.telephone = t('validation.invalidMobile');
      } else if (!/^\d{8,}$/.test(signupForm.telephone.replace(/\D/g, ''))) {
        validationErrors.telephone = t('validation.invalidMobile');
      }
      
      if (!signupForm.password?.trim()) {
        validationErrors.password = t('validation.passwordTooShort');
      } else if (signupForm.password.length < 6) {
        validationErrors.password = t('validation.passwordTooShort');
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setSignupErrors(validationErrors);
        return;
      }
      
      setIsLoading(true);
      setSignupErrors({});

      const userData = {
        firstname: signupForm.firstname.trim(),
        lastname: signupForm.lastname.trim(),
        email: signupForm.email.trim(),
        telephone: signupForm.telephone.trim(),
        password: signupForm.password,
      };

      try {
        // 0) Fresh OCSESSID for registration, same as account flow
        const freshOCSESSID = await generateRandomOCSESSID();
        await setOCSESSID(freshOCSESSID);

        // 1) Create account
        const registerResponse = await makeApiCall(API_ENDPOINTS.register, {
          method: 'POST',
          data: userData,
        });

        if (registerResponse?.success !== 1) {
          throw new Error(Array.isArray(registerResponse?.error) ? registerResponse.error[0] : (registerResponse?.error || t('auth.registrationError')));
        }

        // 2) Save currency AFTER account creation (if user picked one)
        if (selectedCurrency?.code) {
          const body = new URLSearchParams();
          body.append('code', selectedCurrency.code);
          await makeApiCall(API_ENDPOINTS.changeCurrency, {
            method: 'POST',
            data: body.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
        }

        // 3) Log the user in
        await login(userData.email, userData.password);

        // Redirect handled by effect on isAuthenticated
      } catch (error: any) {
        console.error('AUTH.TSX: Signup error occurred:', error);
        
        let errorMessage = error?.message || t('auth.registrationError');
        
        // Handle specific error cases
        if (errorMessage.includes('temporarily unavailable')) {
          errorMessage = t('error.serverUnavailable');
        } else if (errorMessage.includes('already exists')) {
          errorMessage = t('auth.registrationError');
        }
        
        
        // If the message hints at an email conflict, show it under the email field.
        if (/mail|email|exists/i.test(errorMessage)) {
          setSignupErrors({ email: errorMessage });
        } else {
          // Otherwise show a top-level form error and keep field errors clean
          setSignupErrors({ form: errorMessage });
        }
        
        Alert.alert(t('common.error'), errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    const renderLoginForm = () => (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{t('auth.signIn')}</Text>
        <Text style={styles.formSubtitle}>{t('auth.welcomeBack')}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.instructionText}>
          {t('auth.enterLoginDetails')}
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            value={loginForm.email}
            onChangeText={text => handleLoginInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.mediumGray}
            editable={!isLoading}
            textAlign={getTextAlign()}
          />
          {loginErrors.email ? <Text style={styles.errorText}>{loginErrors.email}</Text> : null}
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('auth.password')}
              value={loginForm.password}
              onChangeText={text => handleLoginInputChange('password', text)}
              secureTextEntry={!showLoginPassword}
              placeholderTextColor={theme.colors.mediumGray}
              editable={!isLoading}
              textAlign={getTextAlign()}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowLoginPassword(!showLoginPassword)}
            >
              <Ionicons
                name={showLoginPassword ? "eye-off" : "eye"}
                size={20}
                color={theme.colors.mediumGray}
              />
            </TouchableOpacity>
          </View>
          {loginErrors.password ? <Text style={styles.errorText}>{loginErrors.password}</Text> : null}
        </View>
        
        <Link href="/forgot-password" asChild>
          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </Link>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>{t('auth.login')}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.switchModeButton}
          onPress={() => setIsLogin(false)}
        >
          <Text style={styles.switchModeText}>{t('auth.dontHaveAccount')}</Text>
        </TouchableOpacity>
      </View>
    );

    const renderSignupForm = () => (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{t('signup.title')}</Text>
        <Text style={styles.formSubtitle}>{t('signup.subtitle')}</Text>
        
        <View style={styles.divider} />
        
        {signupErrors.form ? (
          <Text style={[styles.errorText, { marginBottom: theme.spacing.sm }]}>
            {signupErrors.form}
          </Text>
        ) : null}

        <Text style={styles.instructionText}>
          {t('signup.instruction')}
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('auth.firstName')}
            value={signupForm.firstname}
            onChangeText={text => handleSignupInputChange('firstname', text)}
            placeholderTextColor={theme.colors.mediumGray}
            editable={!isLoading}
            textAlign={getTextAlign()}
          />
          {signupErrors.firstname ? <Text style={styles.errorText}>{signupErrors.firstname}</Text> : null}
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('auth.lastName')}
            value={signupForm.lastname}
            onChangeText={text => handleSignupInputChange('lastname', text)}
            placeholderTextColor={theme.colors.mediumGray}
            editable={!isLoading}
            textAlign={getTextAlign()}
          />
          {signupErrors.lastname ? <Text style={styles.errorText}>{signupErrors.lastname}</Text> : null}
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('signup.email')}
            value={signupForm.email}
            onChangeText={text => handleSignupInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.mediumGray}
            editable={!isLoading}
            textAlign={getTextAlign()}
          />
          {signupErrors.email ? <Text style={styles.errorText}>{signupErrors.email}</Text> : null}
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('signup.mobile')}
            value={signupForm.telephone}
            onChangeText={text => handleSignupInputChange('telephone', text)}
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.mediumGray}
            editable={!isLoading}
            textAlign={getTextAlign()}
          />
          {signupErrors.telephone ? <Text style={styles.errorText}>{signupErrors.telephone}</Text> : null}
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('signup.password')}
              value={signupForm.password}
              onChangeText={text => handleSignupInputChange('password', text)}
              secureTextEntry={!showSignupPassword}
              placeholderTextColor={theme.colors.mediumGray}
              editable={!isLoading}
              textAlign={getTextAlign()}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowSignupPassword(!showSignupPassword)}
            >
              <Ionicons
                name={showSignupPassword ? "eye-off" : "eye"}
                size={20}
                color={theme.colors.mediumGray}
              />
            </TouchableOpacity>
          </View>
          {signupErrors.password ? <Text style={styles.errorText}>{signupErrors.password}</Text> : null}
        </View>
        
        {/* Currency selector (deferred apply) */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setIsCurrencyOpen(true)}
            disabled={isLoading || isCurrencyLoading}
          >
            <Text style={styles.dropdownText}>{selectedCurrency?.title || t('account.selectCountry' as TranslationKeys)}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.black} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>{t('signup.signUp')}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.switchModeButton}
          onPress={() => setIsLogin(true)}
        >
          <Text style={styles.switchModeText}>{t('signup.alreadyHaveAccount')}</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <Stack.Screen options={{ headerShown: false }} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets
          >
            <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8, paddingHorizontal: 4, alignSelf: 'flex-start' }}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.black} style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
            </TouchableOpacity>
            {isLogin ? renderLoginForm() : renderSignupForm()}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Currency modal (outside scroll to overlay correctly) */}
        <Modal
          visible={isCurrencyOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsCurrencyOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsCurrencyOpen(false)}
          >
            <View style={styles.dropdownModal}>
              {isCurrencyLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.black} />
                </View>
              ) : (
                <FlatList
                  data={currencies}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.currencyItem}
                      onPress={() => {
                        setSelectedCurrency(item);
                        setIsCurrencyOpen(false);
                      }}
                    >
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.flagImage} />
                      ) : null}
                      <Text style={styles.currencyTitle}>{item.title}</Text>
                      {selectedCurrency?.code === item.code && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.black} />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.currencyList}
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
    },
    formContainer: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        paddingVertical: theme.spacing.md,
        // Ensure it doesn't get overlapped by any header-like container
        paddingTop: theme.spacing.md,
    },
    formTitle: {
        fontSize: theme.typography.sizes.xxxl,
        fontWeight: theme.typography.weights.bold as any,
        color: theme.colors.black,
        marginBottom: theme.spacing.xs,
    },
    formSubtitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.black,
        marginBottom: theme.spacing.md,
        fontWeight: theme.typography.weights.medium as any,
    },
    divider: {
        height: 2,
        backgroundColor: theme.colors.black,
        marginBottom: theme.spacing.lg,
        marginTop: theme.spacing.sm,
    },
    instructionText: {
        fontSize: theme.typography.sizes.sm,
        lineHeight: 18,
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
        textAlign: getTextAlign(),
    },
    dropdownButton: {
        flexDirection: getFlexDirection('row'),
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.black,
        backgroundColor: theme.colors.white,
    },
    dropdownText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.black,
        textAlign: getTextAlign(),
    },
    loadingContainer: {
        padding: theme.spacing.sm,
    },
    passwordContainer: {
        flexDirection: getFlexDirection('row'),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.black,
        backgroundColor: theme.colors.white,
    },
    passwordInput: {
        flex: 1,
        padding: theme.spacing.md,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.black,
        textAlign: getTextAlign(),
    },
    eyeButton: {
        padding: theme.spacing.md,
    },
    errorText: {
        color: theme.colors.red,
        fontSize: theme.typography.sizes.sm,
        marginTop: theme.spacing.xs,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.sm,
    },
    forgotPasswordText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.black,
        fontWeight: theme.typography.weights.medium as any,
    },
    submitButton: {
        backgroundColor: theme.colors.black,
        padding: theme.spacing.md,
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    submitButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.semibold as any,
    },
    switchModeButton: {
        alignItems: 'center',
    },
    switchModeText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.black,
        fontWeight: theme.typography.weights.medium as any,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownModal: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        maxHeight: 300,
        width: 200,
        shadowColor: theme.shadows.md.shadowColor,
        shadowOffset: theme.shadows.md.shadowOffset,
        shadowOpacity: theme.shadows.md.shadowOpacity,
        shadowRadius: theme.shadows.md.shadowRadius,
        elevation: theme.shadows.md.elevation,
    },
    currencyList: {
        maxHeight: 280,
    },
    currencyItem: {
        flexDirection: getFlexDirection('row'),
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
        gap: theme.spacing.sm,
    },
    flagImage: {
        width: 16,
        height: 12,
        resizeMode: 'contain',
    },
    currencyTitle: {
        flex: 1,
        fontSize: theme.typography.sizes.md,
        color: theme.colors.black,
        textAlign: getTextAlign(),
    },
});
