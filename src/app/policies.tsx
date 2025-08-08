import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@theme';
import { getFlexDirection } from '@utils/rtlStyles';
import { useTranslation } from '@utils/translations';

export default function PoliciesScreen() {
  const { t } = useTranslation();
  
  const handlePolicyPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Don't know how to open URI: " + url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
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
              <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('policies.title')}</Text>
        <View style={styles.divider} />

        <View style={styles.policiesContainer}>
          <TouchableOpacity
            style={styles.policyOption}
            onPress={() => handlePolicyPress('https://new.azurakwt.com/en-gb/information/about-us')}
          >
            <Text style={styles.policyText}>{t('policies.aboutUs')}</Text>
            <Ionicons name="open-outline" size={20} color={theme.colors.black} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.policyOption}
            onPress={() => handlePolicyPress('https://new.azurakwt.com/en-gb?route=information/contact')}
          >
            <Text style={styles.policyText}>{t('policies.contactUs')}</Text>
            <Ionicons name="open-outline" size={20} color={theme.colors.black} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.policyOption}
            onPress={() => handlePolicyPress('https://new.azurakwt.com/en-gb/information/terms')}
          >
            <Text style={styles.policyText}>{t('policies.terms')}</Text>
            <Ionicons name="open-outline" size={20} color={theme.colors.black} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.policyOption}
            onPress={() => handlePolicyPress('https://new.azurakwt.com/en-gb/information/privacy')}
          >
            <Text style={styles.policyText}>{t('policies.privacy')}</Text>
            <Ionicons name="open-outline" size={20} color={theme.colors.black} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.black,
    marginBottom: theme.spacing.xl,
  },
  policiesContainer: {
    gap: theme.spacing.xs,
  },
  policyOption: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.mediumGray,
    marginBottom: theme.spacing.sm,
  },
  policyText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
  },
}); 