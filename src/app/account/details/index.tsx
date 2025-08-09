import { useTranslation } from '@/i18n/useTranslation';
import EditUserDetails from '@components/edit-user-details';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/auth-store';
import { useLanguageStore } from '@store/language-store';
import { theme } from '@theme';
import { API_ENDPOINTS, makeApiCall } from '@utils/api-config';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function MyDetailsScreen() {
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasLeftForDeletion, setHasLeftForDeletion] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserDetails();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && hasLeftForDeletion) {
        // User returned to app after visiting delete URL
        setHasLeftForDeletion(false);
        logout();
         router.replace('/auth');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [hasLeftForDeletion, logout]);

  const fetchUserDetails = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Make sure to use the correct endpoint constant from API_ENDPOINTS
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
        setUserDetails(response.data);
      } else {
        throw new Error(Array.isArray(response.error) ? response.error[0] : 'Failed to fetch user details');
      }
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to fetch user details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComplete = async (updatedData: any) => {
    try {
      setIsLoading(true);
      await updateUser({
        firstname: updatedData.firstname,
        lastname: updatedData.lastname,
        email: updatedData.email,
        telephone: updatedData.telephone
      });
      
      // Refresh user details after update
      await fetchUserDetails();
      setIsEditing(false);
      Alert.alert('Success', 'Your details have been updated successfully.');
    } catch (error: any) {
      console.error('Error updating user details:', error);
      Alert.alert('Error', error.message || 'Failed to update user details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteData = async () => {
    Alert.alert(
      'Delete Data',
      'You will be redirected to delete your account data. When you return to the app, you will be logged out.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setHasLeftForDeletion(true);
            Linking.openURL('https://azura.com.kw/?route=account/account|remove');
          }
        }
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

  if (isEditing) {
    return (
      <EditUserDetails 
        userData={userDetails || user} 
        onCancel={() => setIsEditing(false)}
        onSubmit={handleEditComplete}
      />
    );
  }

  const displayData = userDetails || user;
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: '',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={theme.colors.black} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{t('details.title')}</Text>
        <View style={styles.divider} />
        
        <View style={styles.fieldsContainer}>
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('details.fullName')}</Text>
            <TextInput
              style={styles.textInput}
              value={`${displayData?.firstname} ${displayData?.lastname}`}
              editable={false}
              placeholderTextColor={theme.colors.mediumGray}
            />
          </View>
          
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('details.email')}</Text>
            <TextInput
              style={styles.textInput}
              value={displayData?.email}
              editable={false}
              keyboardType="email-address"
              placeholderTextColor={theme.colors.mediumGray}
            />
          </View>
          
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('details.mobile')}</Text>
            <TextInput
              style={styles.textInput}
              value={displayData?.telephone}
              editable={false}
              keyboardType="phone-pad"
              placeholderTextColor={theme.colors.mediumGray}
            />
          </View>
          
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t('details.password')}</Text>
            <TextInput
              style={styles.textInput}
              value="********"
              editable={false}
              secureTextEntry
              placeholderTextColor={theme.colors.mediumGray}
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>{t('details.editButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteData}
        >
          <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
        </TouchableOpacity>
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
  },
  editButton: {
    backgroundColor: theme.colors.black,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
  },
  editButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
  },
  deleteButton: {
    backgroundColor: theme.colors.red,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
  },
}); 