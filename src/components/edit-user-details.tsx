import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { useAuthStore } from '@store/auth-store';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{t('userDetails.title')}</Text>
          <Text style={styles.subtitle}>{t('userDetails.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.firstName')}</Text>
            <TextInput
              style={[styles.input, errors.firstname ? styles.inputError : null]}
              value={formData.firstname}
              onChangeText={(text) => setFormData({...formData, firstname: text})}
              placeholder={t('userDetails.firstName')}
              autoCapitalize="words"
            />
            {errors.firstname ? <Text style={styles.errorText}>{errors.firstname}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.lastName')}</Text>
            <TextInput
              style={[styles.input, errors.lastname ? styles.inputError : null]}
              value={formData.lastname}
              onChangeText={(text) => setFormData({...formData, lastname: text})}
              placeholder={t('userDetails.lastName')}
              autoCapitalize="words"
            />
            {errors.lastname ? <Text style={styles.errorText}>{errors.lastname}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.email')}</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder={t('userDetails.email')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('userDetails.mobile')}</Text>
            <TextInput
              style={[styles.input, errors.telephone ? styles.inputError : null]}
              value={formData.telephone}
              onChangeText={(text) => setFormData({...formData, telephone: text})}
              placeholder={t('userDetails.mobile')}
              keyboardType="phone-pad"
            />
            {errors.telephone ? <Text style={styles.errorText}>{errors.telephone}</Text> : null}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? t('common.loading') : t('userDetails.save')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    textAlign: getTextAlign(),
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    borderRadius: 4,
    paddingVertical: 16,
    width: '48%',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.black,
  },
  saveButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 4,
    paddingVertical: 16,
    width: '48%',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: theme.colors.white,
  },
}); 