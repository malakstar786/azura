import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import AddEditAddress from '@components/add-edit-address';
import { Ionicons } from '@expo/vector-icons';
import { Address, useAddressStore } from '@store/address-store';
import { useAuthStore } from '@store/auth-store';
import { useLanguageStore } from '@store/language-store';
import { getFlexDirection } from '@utils/rtlStyles';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Define the interface for AddressFormData to match AddEditAddress component
interface AddressFormData {
  address_id?: string;
  firstname: string;
  lastname: string;
  phone: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  postcode: string;
  country_id: string;
  zone_id: string;
  custom_field: {
    '30': string; // block
    '31': string; // street
    '32': string; // building
    '33': string; // apartment
    '35': string; // avenue
  };
  default: boolean;
}

export default function AddressScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const { addresses, fetchAddresses, deleteAddress, isLoading } = useAddressStore();
  const { isAuthenticated } = useAuthStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressFormData | undefined>(undefined);

  // Fetch addresses when the component mounts
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Fetching addresses...');
      fetchAddresses()
        .then(() => {
          console.log('Addresses fetched successfully');
        })
        .catch((error) => {
          console.error('Error fetching addresses:', error);
        });
    }
  }, [isAuthenticated, fetchAddresses]);

  // Log addresses when they change
  useEffect(() => {
    console.log('Current addresses:', addresses);
  }, [addresses]);

  const handleAddAddress = () => {
    setEditingAddress(undefined);
    setIsModalVisible(true);
  };

  const handleEditAddress = (address: Address) => {
    // Convert address format for the edit form
    const formData: AddressFormData = {
      address_id: address.id,
      firstname: address.firstName,
      lastname: address.lastName,
      phone: address.phone || '', // Use actual phone from address data
      city: address.city,
      address_1: `Block ${address.block}, Street ${address.street}, House/Building ${address.houseNumber}${address.apartmentNumber ? ', Apt ' + address.apartmentNumber : ''}`,
      address_2: address.additionalDetails,
      company: '',
      postcode: '',
      country_id: '114', // Kuwait
      zone_id: '1785',   // Kuwait City
      custom_field: {
        '30': address.block, // Block
        '31': address.street, // Street
        '32': address.houseNumber, // Building
        '33': address.apartmentNumber, // Apartment
        '35': address.avenue || '' // Use actual avenue from address data
      },
      default: address.isDefault
    };
    
    setEditingAddress(formData);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingAddress(undefined);
    // Auto-refresh will be handled by the improved component
  };

  const handleAddressUpdated = async () => {
    // Auto-refresh addresses when an address is added/updated
    await fetchAddresses();
  };

  const renderAddress = (address: Address) => (
    <View key={address.id} style={styles.addressCard}>
      <View style={styles.addressContent}>
        <Text style={styles.name}>{address.firstName} {address.lastName}</Text>
        <Text style={styles.addressText}>Kuwait,</Text>
        <Text style={styles.addressText}>{address.city || 'Salmiya'}</Text>
        <Text style={styles.addressText}>
          Block -{address.block}, Street-{address.street}, House Building -{address.houseNumber}{address.avenue ? ', Avenue-' + address.avenue : ''}
        </Text>
        {address.additionalDetails ? (
          <Text style={styles.addressText}>Address Line 2 ({address.additionalDetails})</Text>
        ) : null}
      </View>
      <Pressable 
        onPress={() => handleEditAddress(address)}
        style={styles.editButton}
      >
        <Ionicons name="create-outline" size={18} color={theme.colors.black} />
        <Text style={styles.editButtonText}>{t('addresses.edit')}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('addresses.title'),
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="black" />
            </Pressable>
          ),
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.black} />
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          {addresses.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>{t('addresses.noAddresses')}</Text>
              <Text style={styles.emptyStateSubtitle}>
                {t('addresses.noAddressesDescription')}
              </Text>
              <Pressable 
                style={styles.addAddressButton}
                onPress={handleAddAddress}
              >
                <Text style={styles.addAddressText}>{t('addresses.addNew')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {addresses.map(renderAddress)}
              <Pressable 
                style={[styles.addAddressButton, styles.addMoreButton]}
                onPress={handleAddAddress}
              >
                <Ionicons name="add" size={20} color={theme.colors.black} style={styles.addIcon} />
                <Text style={styles.addAddressText}>{t('addresses.addNew')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}

      {isModalVisible && (
        <AddEditAddress
          context="account"
          address={editingAddress}
          onClose={handleCloseModal}
          onAddressUpdated={handleAddressUpdated}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '700',
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  addAddressButton: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: getFlexDirection('row'),
    marginBottom: theme.spacing.lg,
  },
  addMoreButton: {
    marginTop: theme.spacing.md,
  },
  addIcon: {
    marginEnd: theme.spacing.sm,
  },
  addAddressText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    fontWeight: '500',
  },
  addressCard: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  addressContent: {
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '500',
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.xs / 2,
  },
  editButton: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.black,
  },
  editButtonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.black,
  },
}); 