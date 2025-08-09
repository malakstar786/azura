import CurrencyDropdown from '@components/CurrencyDropdown';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@store/auth-store';
import { useLanguageStore } from '@store/language-store';
import { theme } from '@theme';
import { API_ENDPOINTS, makeApiCall } from '@utils/api-config';
import { getFlexDirection } from '@utils/rtlStyles';
import { useTranslation } from '@utils/translations';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AccountScreen() {
  const { user, isAuthenticated, clearUser } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();

  // Fetch user profile data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Use the account|edit endpoint with POST method as documented in instructions.md
      const response = await makeApiCall(API_ENDPOINTS.updateProfile, {
        method: 'POST',
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          telephone: user.telephone || '',
        }
      });
      
      if (response.success === 1 && response.data) {
        setUserProfile(response.data);
      } else {
        throw new Error(Array.isArray(response.error) ? response.error[0] : 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to fetch user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Since there's no logout API endpoint in instructions.md,
              // we'll just clear the local user data
              await clearUser();
              await AsyncStorage.removeItem('@azura_user');
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.black} />
        <Text style={styles.loadingText}>{t('account.loading')}</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('account.title')}</Text>
          <Text style={styles.subtitle}>{t('account.subtitleUpper')}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.optionsContainer}>
          <View style={styles.option}>
            <View style={styles.optionRow}>
              <Image 
                source={require('@assets/account_tab/location_icon.png')} 
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>{t('account.country')}</Text>
            </View>
            <CurrencyDropdown />
          </View>

          <TouchableOpacity 
            style={styles.option}
            onPress={() => router.push('/account/language')}
          >
            <View style={styles.optionRow}>
              <Image 
                source={require('@assets/account_tab/language_icon.png')} 
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>{t('account.language')}</Text>
            </View>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.colors.black} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option}
            onPress={() => router.push('/policies')}
          >
            <View style={styles.optionRow}>
              <Image 
                source={require('@assets/account_tab/policies_icon.png')} 
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>{t('account.policies')}</Text>
            </View>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.colors.black} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.loginButtonText}>{t('account.login')}</Text>
        </TouchableOpacity>

        <View style={styles.socialSection}>
          <Text style={styles.followUsText}>{t('account.followUs')}</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => Linking.openURL('https://www.facebook.com/azura.com.kw/')}
            >
              <Image 
                source={require('@assets/account_tab/facebook_icon.png')} 
                style={styles.socialIconImage}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => Linking.openURL('https://www.instagram.com/azuranails/')}
            >
              <Image 
                source={require('@assets/account_tab/instagram_icon.png')} 
                style={styles.socialIconImage}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => Linking.openURL('https://api.whatsapp.com/send?phone=96599779566')}
            >
              <Image 
                source={require('@assets/account_tab/whatsapp_icon.png')} 
                style={[
                  styles.socialIconImage,
                  isRTL ? { transform: [{ scaleX: -1 }] } : null
                ]}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => Linking.openURL('mailto:contact-us@azura.com.kw')}
            >
              <Image 
                source={require('@assets/account_tab/email.png')} 
                style={styles.socialIconImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const displayName = userProfile ? 
    `${userProfile.firstname} ${userProfile.lastname}` : 
    user ? `${user.firstname} ${user.lastname}` : 'User';

  const email = userProfile ? userProfile.email : user?.email || '';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('account.title')}</Text>
        <Text style={styles.subtitle}>{t('account.subtitle')}</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.optionsContainer}>
        <View style={styles.option}>
          <View style={styles.optionRow}>
            <Image 
              source={require('@assets/account_tab/location_icon.png')} 
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>{t('account.country')}</Text>
          </View>
          <CurrencyDropdown />
        </View>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => router.push('/account/language')}
        >
          <View style={styles.optionRow}>
            <Image 
              source={require('@assets/account_tab/language_icon.png')} 
              style={[
                styles.optionIcon,
                isRTL ? { transform: [{ scaleX: -1 }] } : null
              ]}
            />
            <Text style={styles.optionText}>{t('account.language')}</Text>
          </View>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.colors.black} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => router.push('/account/details')}
        >
          <View style={styles.optionRow}>
            <Image 
              source={require('@assets/account_tab/details_icon.png')} 
              style={[
                styles.optionIcon,
                isRTL ? { transform: [{ scaleX: -1 }] } : null
              ]}
            />
            <Text style={styles.optionText}>{t('account.details')}</Text>
          </View>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.colors.black} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => router.push('/account/address')}
        >
          <View style={styles.optionRow}>
            <Image 
              source={require('@assets/account_tab/location_icon.png')} 
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>{t('account.address')}</Text>
          </View>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.colors.black} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => router.push('/account/orders')}
        >
          <View style={styles.optionRow}>
            <Image 
              source={require('@assets/account_tab/orders_icon.png')} 
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>{t('account.orders')}</Text>
          </View>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.colors.black} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => router.push('/policies')}
        >
          <View style={styles.optionRow}>
            <Image 
              source={require('@assets/account_tab/policies_icon.png')} 
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>{t('account.policies')}</Text>
          </View>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.colors.black} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>{t('account.logout')}</Text>
      </TouchableOpacity>

      <View style={styles.socialSection}>
        <Text style={styles.followUsText}>{t('account.followUs')}</Text>
        <View style={styles.socialIcons}>
          <TouchableOpacity 
            style={styles.socialIcon}
            onPress={() => Linking.openURL('https://www.facebook.com/azura.com.kw/')}
          >
            <Image 
              source={require('@assets/account_tab/facebook_icon.png')} 
              style={styles.socialIconImage}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialIcon}
            onPress={() => Linking.openURL('https://www.instagram.com/azuranails/')}
          >
            <Image 
              source={require('@assets/account_tab/instagram_icon.png')} 
              style={styles.socialIconImage}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialIcon}
            onPress={() => Linking.openURL('https://api.whatsapp.com/send?phone=96599779566')}
          >
            <Image 
              source={require('@assets/account_tab/whatsapp_icon.png')} 
              style={styles.socialIconImage}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialIcon}
            onPress={() => Linking.openURL('mailto:contact-us@azura.com.kw')}
          >
            <Image 
              source={require('@assets/account_tab/email.png')} 
              style={styles.socialIconImage}
            />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.black,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    fontWeight: theme.typography.weights.medium as any,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 2,
    backgroundColor: theme.colors.black,
    marginTop: theme.spacing.sm,
  },
  optionsContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  option: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  optionRow: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  optionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  optionText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.black,
    fontWeight: theme.typography.weights.bold as any,
  },
  loginButton: {
    backgroundColor: theme.colors.black,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    letterSpacing: 1,
  },
  logoutButton: {
    backgroundColor: theme.colors.red,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
  },
  menuItem: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  menuItemText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.black,
  },
  socialSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  followUsText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    fontWeight: theme.typography.weights.medium as any,
    letterSpacing: 2,
    marginBottom: theme.spacing.lg,
  },
  socialIcons: {
    flexDirection: getFlexDirection('row'),
    gap: theme.spacing.md,
  },
  socialIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
}); 