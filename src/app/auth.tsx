import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    Dimensions,
} from 'react-native';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@theme';
import { getTextAlign, getFlexDirection } from '@utils/rtlStyles';
import { useTranslation } from '@utils/translations';

export default function Auth() {
    const { login, signup, isAuthenticated } = useAuthStore();
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    
    const { redirect } = useLocalSearchParams<{ redirect?: string }>();

    // Redirect if already authenticated
    useEffect(() => {
      if (isAuthenticated) {
        if (redirect === 'checkout') {
          router.replace('/checkout');
        } else if (redirect === 'cart') {
          router.replace('/(shop)/cart');
        } else {
          router.replace('/');
        }
      }
    }, [isAuthenticated, redirect]);

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

    const handleLoginInputChange = (field: keyof typeof loginForm, value: string) => {
      setLoginForm(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    const handleSignupInputChange = (field: keyof typeof signupForm, value: string) => {
      setSignupForm(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    const handleLogin = async () => {
      if (!loginForm.email || !loginForm.password) {
        setErrors({ 
          email: !loginForm.email ? 'Email is required' : '',
          password: !loginForm.password ? 'Password is required' : ''
        });
        return;
      }
      
      setIsLoading(true);
      setErrors({});
      
      try {
        console.log('Login attempt with:', { email: loginForm.email });
        await login(loginForm.email, loginForm.password);
        
        // Router will handle redirection in the useEffect hook
      } catch (error: any) {
        // Show simple error message without console errors
        const errorMessage = 'Invalid credentials';
        
        setErrors({ 
          email: errorMessage, 
          password: errorMessage  
        });
        Alert.alert('Login Failed', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSignup = async () => {
      console.log('🔥 AUTH.TSX: SIGNUP BUTTON PRESSED - handleSignup called');
      console.log('📋 AUTH.TSX: Current signup form data:', signupForm);
      
      // Validate all required fields
      const validationErrors: Record<string, string> = {};
      
      if (!signupForm.firstname?.trim()) {
        validationErrors.firstname = 'Full name is required';
      }
      
      // We don't need lastname validation since we're using firstname for full name
      // if (!signupForm.lastname?.trim()) {
      //   validationErrors.lastname = 'Last name is required';
      // }
      
      if (!signupForm.email?.trim()) {
        validationErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email)) {
        validationErrors.email = 'Please enter a valid email address';
      }
      
      if (!signupForm.telephone?.trim()) {
        validationErrors.telephone = 'Mobile number is required';
      } else if (!/^\d{8,}$/.test(signupForm.telephone.replace(/\D/g, ''))) {
        validationErrors.telephone = 'Please enter a valid mobile number';
      }
      
      if (!signupForm.password?.trim()) {
        validationErrors.password = 'Password is required';
      } else if (signupForm.password.length < 6) {
        validationErrors.password = 'Password must be at least 6 characters long';
      }
      
      if (Object.keys(validationErrors).length > 0) {
        console.error('❌ AUTH.TSX: Validation failed:', validationErrors);
        setErrors(validationErrors);
        return;
      }
      
      console.log('✅ AUTH.TSX: Validation passed, starting signup process...');
      setIsLoading(true);
      setErrors({});
      
      // Parse full name into first name and last name
      let firstName = signupForm.firstname.trim();
      let lastName = '';

      // Split the full name by space and handle different cases
      const nameParts = signupForm.firstname.trim().split(' ');
      if (nameParts.length > 1) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }

      const userData = {
        firstname: firstName,
        lastname: lastName,
        email: signupForm.email.trim(),
        telephone: signupForm.telephone.trim(),
        password: signupForm.password,
      };

      console.log('📤 AUTH.TSX: Sending signup request with userData:', JSON.stringify(userData, null, 2));
      
      try {
        await signup(userData);
        
        console.log('✅ AUTH.TSX: Signup successful, redirection will be handled by useEffect');
        // Router will handle redirection in the useEffect hook
      } catch (error: any) {
        console.error('❌ AUTH.TSX: Signup error occurred:', error);
        console.error('❌ AUTH.TSX: Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        let errorMessage = error.message || 'An error occurred during signup';
        
        // Handle specific error cases
        if (errorMessage.includes('temporarily unavailable')) {
          errorMessage = 'The registration service is currently unavailable. Please try again later.';
        } else if (errorMessage.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
        }
        
        console.error('🔴 AUTH.TSX: Final error message shown to user:', errorMessage);
        
        setErrors({ 
          email: errorMessage
        });
        
        Alert.alert('Signup Failed', errorMessage);
      } finally {
        setIsLoading(false);
        console.log('🏁 AUTH.TSX: Signup process completed');
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
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
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
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
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
        
        <Text style={styles.instructionText}>
          {t('signup.instruction')}
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('signup.fullName')}
            value={signupForm.firstname}
            onChangeText={text => handleSignupInputChange('firstname', text)}
            placeholderTextColor={theme.colors.mediumGray}
            editable={!isLoading}
          />
          {errors.firstname && <Text style={styles.errorText}>{errors.firstname}</Text>}
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
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
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
          />
          {errors.telephone && <Text style={styles.errorText}>{errors.telephone}</Text>}
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
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
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
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLogin ? renderLoginForm() : renderSignupForm()}
        </ScrollView>
      </KeyboardAvoidingView>
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
    },
    formContainer: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        paddingVertical: theme.spacing.md,
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
});
