import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Language, useLanguageStore } from '@store/language-store';
import { getFlexDirection } from '@utils/rtlStyles';
import { useTranslation } from '@utils/translations';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LanguageSelectionProps {
  onLanguageSelected: () => void;
}

export default function LanguageSelection({ onLanguageSelected }: LanguageSelectionProps) {
  const { setLanguage, setIsFirstTimeUser, currentLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const handleLanguageSelect = async (language: Language) => {
    await setLanguage(language);
    setIsFirstTimeUser(false);
    onLanguageSelected();
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>{t('app.name')}</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('language.select')}</Text>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
        </View>

        <View style={styles.languagesContainer}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              styles.englishButton,
              currentLanguage === 'en' && styles.selectedEnglishButton,
            ]}
            onPress={() => handleLanguageSelect('en')}
          >
            <Text style={styles.englishText}>{t('language.english')}</Text>
            {currentLanguage === 'en' && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageButton,
              styles.arabicButton,
              currentLanguage === 'ar' && styles.selectedArabicButton,
            ]}
            onPress={() => handleLanguageSelect('ar')}
          >
            <Text style={styles.arabicText}>{t('language.arabic')}</Text>
            {currentLanguage === 'ar' && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={20} color="black" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 2,
    color: theme.colors.textPrimary,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.5,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  languagesContainer: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  languageButton: {
    width: '48%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    position: 'relative',
  },
  englishButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderColor: theme.colors.buttonPrimary,
  },
  arabicButton: {
    backgroundColor: theme.colors.buttonSecondary,
    borderColor: theme.colors.black,
  },
  selectedEnglishButton: {
    backgroundColor: theme.colors.buttonPrimary,
  },
  selectedArabicButton: {
    backgroundColor: theme.colors.buttonSecondary,
  },
  englishText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '500',
  },
  arabicText: {
    color: theme.colors.black,
    fontSize: 18,
    fontWeight: '500',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
}); 