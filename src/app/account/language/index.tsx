import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from '@store/language-store';
import { getFlexDirection } from '@utils/rtlStyles';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LanguageScreen() {
  const { currentLanguage, setLanguage, isRTL } = useLanguageStore();
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>(currentLanguage);

  // Track when language is actually changed
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  const handleLanguageChange = async (language: 'en' | 'ar') => {
    // Only update if actually changing
    if (language !== currentLanguage) {
      setSelectedLanguage(language);
      await setLanguage(language);
      
      // Show confirmation and navigate back
      Alert.alert(
        language === 'en' ? 'Language Updated' : 'تم تحديث اللغة',
        language === 'en' 
          ? 'The app language has been changed to English.'
          : 'تم تغيير لغة التطبيق إلى العربية.',
        [
          { 
            text: t('common.ok'), 
            onPress: () => {
              // Navigate home first to refresh content with new language
              router.push('/(shop)');
            }
          }
        ]
      );
    } else {
      // If same language selected, just go back
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: '',
          headerStyle: { backgroundColor: theme.colors.white },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={theme.colors.black} />
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={styles.content}>
        <Text style={styles.title}>{t('language.select')}</Text>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[
              styles.languageButton, 
              selectedLanguage === 'en' && styles.selectedButton
            ]} 
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={selectedLanguage === 'en' ? styles.selectedText : styles.languageText}>
              {t('language.english')}
            </Text>
            {selectedLanguage === 'en' && (
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color="black" />
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.languageButton,
              selectedLanguage === 'ar' && styles.selectedButton
            ]} 
            onPress={() => handleLanguageChange('ar')}
          >
            <Text style={selectedLanguage === 'ar' ? styles.selectedText : styles.languageText}>
              {t('language.arabic')}
            </Text>
            {selectedLanguage === 'ar' && (
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color="black" />
              </View>
            )}
          </TouchableOpacity>
        </View>
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
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginVertical: theme.spacing.lg,
  },
  buttonsContainer: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  languageButton: {
    width: '48%',
    height: 140,
    borderWidth: 1,
    borderColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
  },
  languageText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
  },
  selectedText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
  },
  checkIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 