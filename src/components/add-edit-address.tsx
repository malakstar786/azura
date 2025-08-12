import { useTranslation } from '@/i18n/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useAddressStore } from '@store/address-store';
import { useAuthStore } from '@store/auth-store';
import { theme } from '@theme';
import { getActiveCountryId } from '@utils/api-config';
import { Country, Governorate, LocationService, Zone } from '@utils/location-service';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function uniqueBy<T, K extends string | number>(items: T[], keyFn: (item: T) => K): T[] {
  const map = new Map<K, T>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}

interface FormData {
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
  address_id?: string;
}

interface ImprovedAddEditAddressProps {
  address?: FormData;
  onClose: () => void;
  onAddressUpdated?: () => void;
  context?: 'account' | 'checkout';
  customSaveFunction?: (addressData: any) => Promise<boolean>;
}

export default function ImprovedAddEditAddress({ address, onClose, onAddressUpdated, context, customSaveFunction }: ImprovedAddEditAddressProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addAddress, updateAddress, isLoading, fetchAddresses } = useAddressStore();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstname: address?.firstname || '',
    lastname: address?.lastname || '',
    phone: address?.phone || '',
    company: address?.company || '',
    address_1: address?.address_1 || '',
    address_2: address?.address_2 || '',
    city: address?.city || '',
    postcode: address?.postcode || '',
    country_id: address?.country_id || '',
    zone_id: address?.zone_id || '',
    custom_field: {
      '30': address?.custom_field?.['30'] || '',
      '31': address?.custom_field?.['31'] || '',
      '32': address?.custom_field?.['32'] || '',
      '33': address?.custom_field?.['33'] || '',
      '35': address?.custom_field?.['35'] || ''
    },
    default: address?.default || false,
    address_id: address?.address_id
  });

  // Separate state for full name to allow free typing with spaces
  const [fullName, setFullName] = useState(() => {
    const first = address?.firstname || '';
    const last = address?.lastname || '';
    return first + (last ? ' ' + last : '');
  });

  // Location data state
  const [countries, setCountries] = useState<Country[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<Zone[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState<Governorate | null>(null);
  const [selectedArea, setSelectedArea] = useState<Zone | null>(null);

  // Modal states
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showGovernorateModal, setShowGovernorateModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  
  // Loading states
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingGovernorates, setLoadingGovernorates] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Load countries on component mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Load governorates when country is selected
  useEffect(() => {
    if (formData.country_id) {
      loadGovernorates(formData.country_id);
    }
  }, [formData.country_id]);

  // Pre-populate form when editing an address
  useEffect(() => {
    if (address) {
      // Pre-populate form with existing address data
      setFormData({
        firstname: address.firstname || '',
        lastname: address.lastname || '',
        phone: address.phone || '',
        company: address.company || '',
        address_1: address.address_1 || '',
        address_2: address.address_2 || '',
        city: address.city || '',
        postcode: address.postcode || '',
        country_id: address.country_id || formData.country_id || '',
        zone_id: address.zone_id || '',
        custom_field: address.custom_field || {
          '30': '',
          '31': '',
          '32': '',
          '33': '',
          '35': ''
        },
        default: address.default || false,
        address_id: address.address_id
      });
      
      // Set selected country
      if (address.country_id && countries.length > 0) {
        const country = countries.find(c => c.country_id === address.country_id);
        if (country) {
          setSelectedCountry(country);
        }
      }
      
      // Set selected governorate
      if (address.zone_id && governorates.length > 0) {
        const governorate = governorates.find(g => g.governorate_id === address.zone_id);
        if (governorate) {
          setSelectedGovernorate(governorate);
          loadAreas(address.zone_id);
        }
      }
    }
    // Note: For new addresses, we keep the form empty (no pre-filling with user data)
  }, [address, countries, governorates]);

  const loadCountries = async () => {
    try {
      setLoadingCountries(true);
      const countriesData = await LocationService.getCountries();
      const uniqueCountries = uniqueBy<Country, string>(countriesData, (c) => c.country_id);
      setCountries(uniqueCountries);
      
      // Set selected country based on active stored country id
      const activeCountryId = await getActiveCountryId();
      const active = uniqueCountries.find((c: Country) => c.country_id === activeCountryId) || null;
      setSelectedCountry(active);
      if (active) setFormData((prev) => ({ ...prev, country_id: active.country_id }));
    } catch (error) {
      console.error('Error loading countries:', error);
      Alert.alert(t('common.error'), t('error.serverError'));
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadGovernorates = async (countryId: string) => {
    try {
      setLoadingGovernorates(true);
      const locationData = await LocationService.getGovernoratesAndAreas(countryId);
      const uniqueGovernorates = uniqueBy<Governorate, string>(locationData.governorates || [], (g) => g.governorate_id);
      setGovernorates(uniqueGovernorates);
      setAreas([]); // Clear areas when country changes
      setSelectedGovernorate(null);
      setSelectedArea(null);
    } catch (error) {
      console.error('Error loading governorates:', error);
      Alert.alert(t('common.error'), t('error.serverError'));
    } finally {
      setLoadingGovernorates(false);
    }
  };

  const loadAreas = async (governorateId: string) => {
    try {
      setLoadingAreas(true);
      const areasData = await LocationService.getAreasByGovernorate(formData.country_id, governorateId);
      const uniqueAreas = uniqueBy<Zone, string>(areasData, (a) => a.zone_id);
      setAreas(uniqueAreas);
      setSelectedArea(null);
    } catch (error) {
      console.error('Error loading areas:', error);
      Alert.alert(t('common.error'), t('error.serverError'));
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setFormData({ ...formData, country_id: country.country_id, zone_id: '' });
    setShowCountryModal(false);
  };

  const handleGovernorateSelect = (governorate: Governorate) => {
    setSelectedGovernorate(governorate);
    setFormData({ ...formData, city: governorate.name });
    loadAreas(governorate.governorate_id);
    setShowGovernorateModal(false);
  };

  const handleAreaSelect = (area: Zone) => {
    setSelectedArea(area);
    setFormData({ ...formData, zone_id: area.zone_id });
    setShowAreaModal(false);
  };

  const validateForm = () => {
    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    
    if (nameParts.length < 2) {
      Alert.alert(t('common.error'), t('validation.fullNameRequired'));
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert(t('common.error'), t('validation.invalidMobile'));
      return false;
    }
    if (!formData.country_id) {
      Alert.alert(t('common.error'));
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert(t('common.error'), t('address.selectGovernorate'));
      return false;
    }
    if (!formData.zone_id) {
      Alert.alert(t('common.error'), t('address.selectArea'));
      return false;
    }
    if (!formData.custom_field['30'].trim()) {
      Alert.alert(t('common.error'), t('address.block'));
      return false;
    }
    if (!formData.custom_field['31'].trim()) {
      Alert.alert(t('common.error'), t('address.street'));
      return false;
    }
    if (!formData.custom_field['32'].trim()) {
      Alert.alert(t('common.error'), t('address.building'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    // Split full name before validation and submission
    const splitName = () => {
      const trimmedName = fullName.trim();
      if (trimmedName === '') {
        return { firstname: '', lastname: '' };
      }
      
      const lastSpaceIndex = trimmedName.lastIndexOf(' ');
      if (lastSpaceIndex === -1) {
        return { firstname: trimmedName, lastname: '' };
      }
      
      return {
        firstname: trimmedName.substring(0, lastSpaceIndex),
        lastname: trimmedName.substring(lastSpaceIndex + 1)
      };
    };

    const { firstname, lastname } = splitName();
    const updatedFormData = { ...formData, firstname, lastname };

    if (!validateForm()) return;

    try {
      // Prepare address data for different contexts
      if (context === 'checkout' && customSaveFunction && !formData.address_id) {
        // Get user's email from auth store
        const { user } = useAuthStore.getState();
        
        // For new addresses in checkout context, use custom payment address endpoint
        const addressData = {
          firstname: updatedFormData.firstname,
          lastname: updatedFormData.lastname || '',
          telephone: updatedFormData.phone || user?.telephone || '',
          email: user?.email || '', // Use user's email from auth store
          country_id: updatedFormData.country_id,
          city: updatedFormData.city,
          zone_id: updatedFormData.zone_id,
          address_2: updatedFormData.address_2 || '',
          custom_field: {
            '30': updatedFormData.custom_field['30'], // Block
            '31': updatedFormData.custom_field['31'], // Street
            '32': updatedFormData.custom_field['32'], // House Building
            '33': updatedFormData.custom_field['33'], // Apartment No.
            '35': updatedFormData.custom_field['35'] || '' // avenue
          }
        };

        const success = await customSaveFunction(addressData);
        if (success) {
          if (onAddressUpdated) {
            onAddressUpdated();
          }
          onClose();
        }
      } else {
        // For account context or editing existing addresses, use existing address store logic
        const addressData = {
          firstName: updatedFormData.firstname,
          lastName: updatedFormData.lastname || '',
          phone: updatedFormData.phone,
          city: updatedFormData.city,
          block: updatedFormData.custom_field['30'],
          street: updatedFormData.custom_field['31'],
          houseNumber: updatedFormData.custom_field['32'],
          apartmentNumber: updatedFormData.custom_field['33'] || '',
          avenue: updatedFormData.custom_field['35'] || '',
          additionalDetails: updatedFormData.address_2 || '',
          isDefault: updatedFormData.default,
          country_id: updatedFormData.country_id,
          zone_id: updatedFormData.zone_id
        };

        if (updatedFormData.address_id) {
          await updateAddress(updatedFormData.address_id, addressData);
        } else {
          await addAddress(addressData);
        }

        // Auto-refresh addresses
        await fetchAddresses();
        
        if (onAddressUpdated) {
          onAddressUpdated();
        }
        
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to save address:', error);
      Alert.alert('Error', error.message || 'Failed to save address');
    }
  };

  const renderDropdownModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    data: any[],
    onSelect: (item: any) => void,
    loading: boolean,
    renderItem: (item: any) => string
  ) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.dropdownModal}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.black} />
            </View>
          ) : (
              <FlatList
              data={Array.isArray(data)
                ? uniqueBy<any, string | number>(
                    data,
                    (it: any) => {
                      if (it && typeof it === 'object') {
                        if ('zone_id' in it) return (it as Zone).zone_id;
                        if ('governorate_id' in it) return (it as Governorate).governorate_id;
                        if ('country_id' in it) return (it as Country).country_id;
                      }
                      return JSON.stringify(it);
                    }
                  )
                : []}
              keyExtractor={(item, index) => {
                if (typeof item === 'object' && item) {
                  if ('zone_id' in item) return `area-${(item as Zone).zone_id}`;
                  if ('governorate_id' in item) return `governorate-${(item as Governorate).governorate_id}`;
                  if ('country_id' in item) return `country-${(item as Country).country_id}`;
                }
                return `${title}-${index}`;
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => onSelect(item)}
                >
                  <Text style={styles.dropdownItemText}>{renderItem(item)}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {address ? t('address.edit') : t('address.addNew')}
          </Text>
        </View>

        {/* Form Content */}
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            style={styles.formContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
          {/* Full Name Field */}
          <TextInput
            style={styles.input}
            placeholder={t('signup.fullName')}
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#999"
          />

          {/* Phone Field */}
          <TextInput
            style={styles.input}
            placeholder={t('address.mobile')}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />

          {/* Country Dropdown */}
          <TouchableOpacity 
            style={styles.dropdownInput}
            onPress={() => setShowCountryModal(true)}
          >
            <Text style={selectedCountry ? styles.inputText : styles.placeholderText}>
              {selectedCountry ? selectedCountry.name : t('account.country')}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#000" />
          </TouchableOpacity>

          {/* City/Governorate Dropdown */}
          <TouchableOpacity 
            style={styles.dropdownInput}
            onPress={() => setShowGovernorateModal(true)}
            disabled={!formData.country_id}
          >
            <Text style={selectedGovernorate ? styles.inputText : styles.placeholderText}>
              {selectedGovernorate ? selectedGovernorate.name : t('address.governorate')}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#000" />
          </TouchableOpacity>

          {/* Area Dropdown */}
          <TouchableOpacity 
            style={styles.dropdownInput}
            onPress={() => setShowAreaModal(true)}
            disabled={!selectedGovernorate}
          >
            <Text style={selectedArea ? styles.inputText : styles.placeholderText}>
              {selectedArea ? selectedArea.name : t('address.area')}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#000" />
          </TouchableOpacity>

          {/* Block and Street Row */}
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder={t('address.block')}
              value={formData.custom_field['30']}
              onChangeText={(text) => setFormData({
                ...formData,
                custom_field: { ...formData.custom_field, '30': text }
              })}
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder={t('address.street')}
              value={formData.custom_field['31']}
              onChangeText={(text) => setFormData({
                ...formData,
                custom_field: { ...formData.custom_field, '31': text }
              })}
              placeholderTextColor="#999"
            />
          </View>

          {/* House Building and Apartment Row */}
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder={t('address.building')}
              value={formData.custom_field['32']}
              onChangeText={(text) => setFormData({
                ...formData,
                custom_field: { ...formData.custom_field, '32': text }
              })}
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder={t('address.apartment')}
              value={formData.custom_field['33']}
              onChangeText={(text) => setFormData({
                ...formData,
                custom_field: { ...formData.custom_field, '33': text }
              })}
              placeholderTextColor="#999"
            />
          </View>

          {/* Avenue Field */}
          <TextInput
            style={styles.input}
            placeholder={t('address.additionalInfo')}
            value={formData.custom_field['35']}
            onChangeText={(text) => setFormData({
              ...formData,
              custom_field: { ...formData.custom_field, '35': text }
            })}
            placeholderTextColor="#999"
          />

          {/* Address Line 2 */}
          <TextInput
            style={styles.input}
            placeholder={t('address.additionalInfo')}
            value={formData.address_2}
            onChangeText={(text) => setFormData({ ...formData, address_2: text })}
            placeholderTextColor="#999"
            multiline
          />

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{address ? t('address.update') : t('address.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Dropdown Modals */}
        {renderDropdownModal(
          showCountryModal,
          () => setShowCountryModal(false),
          t('account.country'),
          countries,
          handleCountrySelect,
          loadingCountries,
          (country: Country) => country.name
        )}

        {renderDropdownModal(
          showGovernorateModal,
          () => setShowGovernorateModal(false),
          t('address.selectGovernorate'),
          governorates,
          handleGovernorateSelect,
          loadingGovernorates,
          (governorate: Governorate) => governorate.name
        )}

        {renderDropdownModal(
          showAreaModal,
          () => setShowAreaModal(false),
          t('address.selectArea'),
          areas,
          handleAreaSelect,
          loadingAreas,
          (area: Zone) => area.name
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    marginEnd: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 0,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    textAlign: getTextAlign(),
  },
  dropdownInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 0,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  rowInputs: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    flexDirection: getFlexDirection('row'),
    padding: 16,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.black,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  dropdownHeader: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  dropdownItem: {
    padding: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
}); 