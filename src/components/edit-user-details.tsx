import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/auth-store';
import { useLanguageStore } from '@store/language-store';
import { getTextAlign } from '@utils/rtlStyles';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface EditUserDetailsProps {
  userData?: {
    firstname: string;
    lastname: string;
    email: string;
    telephone: string;
  };
  onCancel: () => void;
  onSubmit: (data: {
    firstname: string;
    lastname: string;
    email: string;
    telephone: string;
  }) => void;
}

export default function EditUserDetails({ 
  userData, 
  onCancel, 
  onSubmit 
}: EditUserDetailsProps) {
  const { user, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form data with provided userData or fallback to user from store
  const [formData, setFormData] = useState({
    firstname: userData?.firstname || user?.firstname || '',
    lastname: userData?.lastname || user?.lastname || '',
    email: userData?.email || user?.email || '',
    telephone: userData?.telephone || user?.telephone || '',
  });

  const [errors, setErrors] = useState({
    firstname: '',
    lastname: '',
    email: '',
    telephone: '',
  });

  const validate = () => {
    let isValid = true;
    const newErrors = {
      firstname: '',
      lastname: '',
      email: '',
      telephone: '',
    };

    // Validate firstname
    if (!formData.firstname.trim()) {
      newErrors.firstname = t('validation.firstNameRequired');
      isValid = false;
    }

    // Validate lastname
    if (!formData.lastname.trim()) {
      newErrors.lastname = t('validation.lastNameRequired');
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
      isValid = false;
    }

    // Validate telephone
    if (!formData.telephone.trim()) {
      newErrors.telephone = t('validation.mobileRequired');
      isValid = false;
    } else if (!/^\d{8,}$/.test(formData.telephone.replace(/\D/g, ''))) {
      newErrors.telephone = t('validation.invalidMobile');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    try {
      setIsLoading(true);
      
      if (onSubmit) {
        // Use the provided onSubmit callback
        onSubmit(formData);
      } else {
        // Fallback to direct API call via auth store
        await updateUser({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          telephone: formData.telephone,
        });
        
        Alert.alert(t('userDetails.saved'));
        onCancel();
      }
    } catch (error: any) {
      console.error('Error updating user details:', error);
      Alert.alert(t('common.error'), error.message || t('userDetails.error'));
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
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={theme.colors.black} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('details.editTitle')}</Text>
          <View style={styles.divider} />
          
          <View style={styles.fieldsContainer}>
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>{t('details.firstName')}</Text>
              <TextInput
                style={[styles.textInput, errors.firstname ? styles.inputError : null]}
                value={formData.firstname}
                onChangeText={(text) => setFormData({...formData, firstname: text})}
                placeholder={t('details.firstName')}
                autoCapitalize="words"
                textAlign={getTextAlign()}
                placeholderTextColor={theme.colors.mediumGray}
                editable={!isLoading}
              />
              {errors.firstname ? <Text style={styles.errorText}>{errors.firstname}</Text> : null}
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>{t('details.lastName')}</Text>
              <TextInput
                style={[styles.textInput, errors.lastname ? styles.inputError : null]}
                value={formData.lastname}
                onChangeText={(text) => setFormData({...formData, lastname: text})}
                placeholder={t('details.lastName')}
                autoCapitalize="words"
                textAlign={getTextAlign()}
                placeholderTextColor={theme.colors.mediumGray}
                editable={!isLoading}
              />
              {errors.lastname ? <Text style={styles.errorText}>{errors.lastname}</Text> : null}
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>{t('details.email')}</Text>
              <TextInput
                style={[styles.textInput, errors.email ? styles.inputError : null]}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                placeholder={t('details.email')}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign={getTextAlign()}
                placeholderTextColor={theme.colors.mediumGray}
                editable={!isLoading}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>{t('details.mobile')}</Text>
              <TextInput
                style={[styles.textInput, errors.telephone ? styles.inputError : null]}
                value={formData.telephone}
                onChangeText={(text) => setFormData({...formData, telephone: text})}
                placeholder={t('details.mobile')}
                keyboardType="phone-pad"
                textAlign={getTextAlign()}
                placeholderTextColor={theme.colors.mediumGray}
                editable={!isLoading}
              />
              {errors.telephone ? <Text style={styles.errorText}>{errors.telephone}</Text> : null}
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? t('common.loading') : t('details.saveButton')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  divider: {
    height: 2,
    backgroundColor: theme.colors.black,
    marginBottom: theme.spacing.lg,
  },
  fieldsContainer: {
    marginBottom: theme.spacing.lg,
  },
  fieldWrapper: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.typography.weights.bold as any,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    backgroundColor: theme.colors.white,
    textAlign: getTextAlign(),
  },
  inputError: {
    borderColor: theme.colors.red,
  },
  errorText: {
    color: theme.colors.red,
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  saveButton: {
    backgroundColor: theme.colors.black,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
  },
  cancelButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.black,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.black,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
  },
}); 