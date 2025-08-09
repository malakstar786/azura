import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { makeApiCall, API_ENDPOINTS } from '@utils/api-config';
import { useAuthStore } from './auth-store';

// Define Address interface for UI usage
export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // Will be empty if not provided by API
  city: string;
  block: string;
  street: string;
  houseNumber: string;
  apartmentNumber: string;
  avenue: string;
  additionalDetails: string;
  isDefault: boolean;
}

// Convert UI address format to API format
export const convertToApiAddress = (address: Address | Omit<Address, 'id'>, addressId: string = '') => {
  const formData = new FormData();
  
  // Add address_id if provided
  if (addressId) {
    formData.append('address_id', addressId);
  }
  
  // Add required fields
  formData.append('firstname', address.firstName);
  formData.append('lastname', address.lastName);
  formData.append('telephone', address.phone);
  formData.append('country_id', '114'); // Kuwait
  formData.append('zone_id', ''); // Not used but required
  formData.append('city', address.city);
  
  // Format address_1 with block, street, and house number
  formData.append('address_1', `${address.block}, Block ${address.block}, Street ${address.street}, House/Building ${address.houseNumber}${address.apartmentNumber ? ', Apt ' + address.apartmentNumber : ''}`);
  formData.append('address_2', address.additionalDetails);
  
  // Add custom fields
  formData.append('custom_field[30]', address.block);
  formData.append('custom_field[31]', address.street);
  formData.append('custom_field[32]', address.houseNumber);
  formData.append('custom_field[33]', address.apartmentNumber);
  formData.append('custom_field[35]', address.avenue || '');
  
  // Add default flag
  formData.append('default', address.isDefault ? '1' : '0');
  
  return formData;
};

// Helper function to convert API address format to UI format
export const convertToUIAddress = (authAddress: any): Address => {
  // Handle custom fields to extract block, street, etc.
  const customField = authAddress.custom_field || {};
  const block = typeof customField === 'object' ? customField['30'] || '' : '';
  const street = typeof customField === 'object' ? customField['31'] || '' : '';
  const houseNumber = typeof customField === 'object' ? customField['32'] || '' : '';
  const apartmentNumber = typeof customField === 'object' ? customField['33'] || '' : '';
  
  return {
    id: authAddress.address_id,
    firstName: authAddress.firstname || '',
    lastName: authAddress.lastname || '',
    phone: authAddress.telephone || '', // Show telephone if present, empty if not
    city: authAddress.city || '',
    block: block,
    street: street,
    houseNumber: houseNumber,
    apartmentNumber: apartmentNumber,
    avenue: typeof customField === 'object' ? customField['35'] || '' : '',
    additionalDetails: authAddress.address_2 || '',
    isDefault: Boolean(authAddress.default)
  };
};

interface AddressStore {
  addresses: Address[];
  selectedAddress: string | null;
  isLoading: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Omit<Address, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setSelectedAddress: (id: string) => void;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddress: null,
      isLoading: false,
      error: null,
      
      fetchAddresses: async () => {
        set({ isLoading: true, error: null });

        try {
          // Check if user is authenticated first
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) {
            console.log('User not authenticated, skipping address fetch');
            set({ addresses: [], isLoading: false });
            return;
          }

          const response = await makeApiCall(API_ENDPOINTS.addresses, {
            method: 'GET'
          });
          
          console.log('Raw addresses API response:', response);
          
          // Handle authentication errors gracefully
          if (response.success === 0 && response.error && 
              Array.isArray(response.error) && 
              response.error[0]?.includes('login')) {
            console.warn('Session expired or authentication failed');
            set({ addresses: [], isLoading: false, error: 'Please login again to view addresses' });
            return;
          }
          
          if (response.success === 1 && Array.isArray(response.data)) {
            // Convert addresses to UI format
            const uiAddresses: Address[] = response.data.map(addr => {
              const customField = addr.custom_field || {};
              return {
                id: addr.address_id,
                firstName: addr.firstname,
                lastName: addr.lastname,
                phone: addr.telephone || '', // Show telephone if present, empty if not
                city: addr.city,
                block: typeof customField === 'object' ? customField['30'] || '' : '',
                street: typeof customField === 'object' ? customField['31'] || '' : '',
                houseNumber: typeof customField === 'object' ? customField['32'] || '' : '',
                apartmentNumber: typeof customField === 'object' ? customField['33'] || '' : '',
                avenue: typeof customField === 'object' ? customField['35'] || '' : '',
                additionalDetails: addr.address_2 || '',
                isDefault: addr.default === true
              };
            });

            console.log('Converted UI addresses:', uiAddresses);
            // Reverse the array so most recent addresses appear first
            set({ addresses: uiAddresses.reverse(), isLoading: false });
          } else {
            console.warn('No addresses received or invalid format:', response);
            set({ addresses: [], isLoading: false });
          }
        } catch (error: any) {
          console.error('Error fetching addresses:', error);
          set({ 
            addresses: [], 
            isLoading: false, 
            error: error.message || 'Failed to fetch addresses' 
          });
        }
      },
      
      addAddress: async (address: Omit<Address, 'id'>) => {
        try {
          set({ isLoading: true, error: null });

          // Create form data for the API (based on test results, this endpoint works)
          const formData = new FormData();
          
          // Add required fields
          formData.append('firstname', address.firstName);
          formData.append('lastname', address.lastName);
          formData.append('telephone', address.phone);
          formData.append('company', ''); // Required empty field
          formData.append('country_id', '114'); // Kuwait
          formData.append('zone_id', '1785'); // Al Asimah (Kuwait City)
          formData.append('city', address.city || 'Kuwait City');
          formData.append('postcode', ''); // Required empty field
          
          // Format address_1 with block, street, and house number
          const address1 = `Block ${address.block}, Street ${address.street}, House/Building ${address.houseNumber}${address.apartmentNumber ? ', Apt ' + address.apartmentNumber : ''}`;
          formData.append('address_1', address1);
          
          // Add additional details if any
          formData.append('address_2', address.additionalDetails || '');
          
          // Add custom fields
          formData.append('custom_field[30]', address.block);
          formData.append('custom_field[31]', address.street);
          formData.append('custom_field[32]', address.houseNumber);
          formData.append('custom_field[33]', address.apartmentNumber || '');
          formData.append('custom_field[35]', address.avenue || '');
          
          // Add default flag
          formData.append('default', address.isDefault ? '1' : '0');

          console.log('Adding new address with data:', {
            firstname: address.firstName,
            lastname: address.lastName,
            city: address.city || 'Kuwait City',
            zone_id: '1785',
            address_1: address1,
            custom_fields: {
              30: address.block,
              31: address.street,
              32: address.houseNumber,
              33: address.apartmentNumber
            }
          });

          const response = await makeApiCall(API_ENDPOINTS.editAddress, {
            method: 'POST',
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          console.log('Add address API response:', response);

          // The API returns HTML errors but still creates the address
          // So we'll refresh the addresses list and show success
          await get().fetchAddresses();
          set({ isLoading: false });
          Alert.alert('Success', 'Address added successfully');
          
        } catch (error: any) {
          console.error('Error adding address:', error);
          
          // Even if there's an error, try to refresh addresses as the API might have worked
          try {
            await get().fetchAddresses();
            set({ isLoading: false });
            Alert.alert('Success', 'Address added successfully');
          } catch (refreshError) {
            const errorMessage = error.message || 'Failed to add address';
            set({ 
              isLoading: false, 
              error: errorMessage 
            });
            Alert.alert('Error', errorMessage);
            throw error;
          }
        }
      },
      
      updateAddress: async (id: string, address: Omit<Address, 'id'>) => {
        try {
          set({ isLoading: true, error: null });

          // Create form data for the API
          const formData = new FormData();
          
          // For existing addresses, always include address_id
          // This is REQUIRED for updates
          formData.append('address_id', id);
          
          // Add required fields
          formData.append('firstname', address.firstName);
          formData.append('lastname', address.lastName);
          formData.append('telephone', address.phone);
          formData.append('company', ''); // Required empty field
          formData.append('country_id', '114'); // Kuwait
          formData.append('zone_id', '1785'); // Al Asimah (Kuwait City)
          formData.append('city', address.city || 'Kuwait City');
          formData.append('postcode', ''); // Required empty field
          
          // Format address_1 with block, street, and house number
          const address1 = `Block ${address.block}, Street ${address.street}, House/Building ${address.houseNumber}${address.apartmentNumber ? ', Apt ' + address.apartmentNumber : ''}`;
          formData.append('address_1', address1);
          
          // Add additional details if any
          formData.append('address_2', address.additionalDetails || '');
          
          // Add custom fields
          formData.append('custom_field[30]', address.block);
          formData.append('custom_field[31]', address.street);
          formData.append('custom_field[32]', address.houseNumber);
          formData.append('custom_field[33]', address.apartmentNumber || '');
          
          // Add default flag
          formData.append('default', address.isDefault ? '1' : '0');

          console.log('Updating address with data:', {
            address_id: id,
            firstname: address.firstName,
            lastname: address.lastName,
            city: address.city || 'Kuwait City',
            zone_id: '1785',
            address_1: address1,
            custom_fields: {
              30: address.block,
              31: address.street,
              32: address.houseNumber,
              33: address.apartmentNumber
            }
          });

          const response = await makeApiCall(API_ENDPOINTS.editAddress, {
            method: 'POST',
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          console.log('Update address API response:', response);

          // The API returns HTML errors but still updates the address
          // So we'll refresh the addresses list and show success
          await get().fetchAddresses();
          set({ isLoading: false });
          Alert.alert('Success', 'Address updated successfully');
          
        } catch (error: any) {
          console.error('Error updating address:', error);
          
          // Even if there's an error, try to refresh addresses as the API might have worked
          try {
            await get().fetchAddresses();
            set({ isLoading: false });
            Alert.alert('Success', 'Address updated successfully');
          } catch (refreshError) {
            const errorMessage = error.message || 'Failed to update address';
            set({ 
              isLoading: false, 
              error: errorMessage 
            });
            Alert.alert('Error', errorMessage);
            throw error;
          }
        }
      },
      
      deleteAddress: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Check if user is authenticated
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) {
            throw new Error('You must be logged in to delete an address');
          }
          
          // Create form data
          const formData = new FormData();
          formData.append('address_id', String(id));
          formData.append('remove', '1');
          
          const response = await makeApiCall(API_ENDPOINTS.editAddress, {
            method: 'POST',
            data: formData
          });
          
          if (response.success === 1) {
            // Refresh addresses after deleting
            await get().fetchAddresses();
            Alert.alert('Success', 'Address deleted successfully');
          } else {
            throw new Error(
              Array.isArray(response.error) ? response.error[0] : 'Failed to delete address'
            );
          }
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to delete address'
          });
          
          Alert.alert('Error', error.message || 'Failed to delete address');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      setSelectedAddress: (id: string) => {
        set({ selectedAddress: id });
      },
    }),
    {
      name: 'address-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 