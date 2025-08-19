import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCartStore } from '@store/cart-store';
import {
  API_ENDPOINTS,
  generateRandomOCSESSID,
  getOrCreateOCSESSID,
  makeApiCall,
  NETWORK_ERROR_CODES,
  setOCSESSID
} from '@utils/api-config';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Address {
  address_id: string;
  firstname: string;
  lastname: string;
  company: string;
  address_1: string;
  address_2: string;
  postcode: string;
  city: string;
  city_name?: string; // For shipping address responses
  zone_id: string;
  zone: string;
  zone_code?: string; // For shipping address responses
  country_id: string;
  country: string;
  iso_code_2?: string; // For shipping address responses
  iso_code_3?: string; // For shipping address responses
  address_format?: string; // For shipping address responses
  telephone?: string; // For shipping address responses
  custom_field: {
    '30': string; // block
    '31': string; // street  
    '32': string; // building
    '33': string; // apartment
    '35': string; // avenue
    [key: string]: any; // allow other fields
  };
  default: boolean;
}

export interface User {
  customer_id: string;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  token?: string;
}

export interface AuthState {
  user: User | null;
  addresses: Address[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  clearUser: () => void;
  signup: (userData: Omit<User, 'customer_id'> & { password: string }) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  fetchAddresses: () => Promise<Address[]>;
  addAddress: (address: Omit<Address, 'address_id'>) => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  clearError: () => void;
  logout: () => void;
  validateSession: () => Promise<boolean>;
}

// Function to handle common API errors
const handleApiError = (error: any, fallbackMessage: string) => {
  console.error('Auth API Error:', error);
  
  if (error.code === NETWORK_ERROR_CODES.NO_CONNECTION) {
    throw new Error('Unable to connect to server. Please check your internet connection and try again.');
  } else if (error.code === NETWORK_ERROR_CODES.TIMEOUT) {
    throw new Error('Request timed out. Please try again.');
  } else if (error.response?.data?.error) {
    // Handle server error messages
    const errorMessage = Array.isArray(error.response.data.error) 
      ? error.response.data.error[0] 
      : error.response.data.error;
    throw new Error(errorMessage || fallbackMessage);
  } else {
    throw new Error(error.message || fallbackMessage);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      addresses: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          // Generate and set a new OCSESSID for the session
          const ocsessid = await getOrCreateOCSESSID();
          await setOCSESSID(ocsessid);

          const response = await makeApiCall(API_ENDPOINTS.login, {
            method: 'POST',
            data: { 
              email, 
              password
            }
          });

          if (response.success === 1 && response.data) {
            // Update user state with the correct data structure
            const userData = {
              customer_id: response.data.customer_id,
              firstname: response.data.firstname,
              lastname: response.data.lastname,
              email: response.data.email,
              telephone: response.data.telephone,
            };

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            // After successful login, fetch user addresses
            try {
              const addresses = await get().fetchAddresses();
              set({ addresses });
            } catch (addressError) {
              // Continue even if address fetch fails (silent failure)
            }

            // Fetch cart after successful login
            await useCartStore.getState().getCart();
            // Note: getCart() handles errors internally and doesn't throw
          } else {
            throw new Error('Invalid credentials');
          }
        } catch (error: any) {
          // Simplified error handling without console errors
          const errorMessage = 'Invalid credentials';
          
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null
          });
          throw new Error(errorMessage);
        }
      },

      clearUser: () => {
        set({ 
          user: null,
          addresses: [],
          isAuthenticated: false,
          error: null
        });
      },

      signup: async (userData) => {
        try {
          set({ isLoading: true, error: null });

          // Generate and use a fresh OCSESSID for registration
          const freshOCSESSID = await generateRandomOCSESSID();
          await setOCSESSID(freshOCSESSID);
          console.log('🔑 AUTH STORE: Generated fresh OCSESSID:', freshOCSESSID);

          // Prepare the exact data format as specified by the user
          const signupData = {
            firstname: userData.firstname,
            lastname: userData.lastname,
            telephone: userData.telephone,
            email: userData.email,
            password: userData.password
          };


          try {
            const response = await makeApiCall(API_ENDPOINTS.register, {
              method: 'POST',
              data: signupData
            });


            if (response.success === 1) {
              // If signup is successful, automatically log in
              try {
                await get().login(userData.email, userData.password);
              } catch (loginError) {
                // Still consider signup successful even if auto-login fails
                set({
                  isLoading: false,
                  error: null
                });
              }
            } else {
              console.error('❌ AUTH STORE: Signup failed with response:', response);
              throw new Error(
                Array.isArray(response.error) ? response.error[0] : 'Registration failed'
              );
            }
          } catch (error: any) {
            console.error('❌ AUTH STORE: Signup API error occurred:', error);
            console.error('❌ AUTH STORE: Error details:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
              headers: error.response?.headers
            });
            
            // Check for server-side errors in the response
            if (error.response?.data && typeof error.response.data === 'string') {
              // Handle the specific utf8_strlen error from the server
              if (error.response.data.includes('utf8_strlen()')) {
                console.error('❌ AUTH STORE: Server has a function definition error. Treating as temporary server issue.');
                throw new Error('The registration service is temporarily unavailable. Please try again later or contact support.');
              }
            }
            
            throw error; // Rethrow for general error handling
          }
        } catch (error: any) {
          console.error('❌ AUTH STORE: Final signup error:', error);
          console.error('❌ AUTH STORE: Final error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          set({ 
            isLoading: false, 
            error: error.message || 'Registration failed. Please try again.',
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      updateUser: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('You must be logged in to update your profile');
          }

          const response = await makeApiCall(API_ENDPOINTS.updateProfile, {
            method: 'POST',
            data: { 
              firstname: userData.firstname || currentUser.firstname,
              lastname: userData.lastname || currentUser.lastname,
              email: userData.email || currentUser.email,
              telephone: userData.telephone || currentUser.telephone
            }
          });

          if (response.success === 1) {
            set({
              user: { ...currentUser, ...userData },
              isLoading: false
            });
          } else {
            throw new Error(
              Array.isArray(response.error) ? response.error[0] : 'Failed to update profile'
            );
          }
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update profile' 
          });
          throw error;
        }
      },

      fetchAddresses: async () => {
        set({ isLoading: true, error: null });

        try {
          // Must be authenticated
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) {
            console.warn('User not authenticated, cannot fetch addresses');
            set({ isLoading: false });
            return [];
          }

          // Use the proper addresses endpoint with GET method
          const response = await makeApiCall(API_ENDPOINTS.addresses, {
            method: 'GET'
          });

          if (response.success === 1 && Array.isArray(response.data)) {
            // We got an array of addresses from the server
            return response.data;
          } else {
            // Probably an empty array or an error
            return [];
          }
        } catch (error: any) {
          console.error('Error fetching addresses:', error);
          set({ isLoading: false, error: error.message || 'Failed to fetch addresses' });
          return [];
        } finally {
          set({ isLoading: false });
        }
      },

      addAddress: async (address) => {
        try {
          set({ isLoading: true, error: null });
          
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('You must be logged in to add an address');
          }
          
          // Create FormData for multipart/form-data request
          const formData = new FormData();
          
          // DO NOT include address_id for new addresses
          // The server expects address_id to be absent for new address creation
          
          formData.append('firstname', address.firstname);
          formData.append('lastname', address.lastname);
          formData.append('company', address.company || '');
          formData.append('address_1', address.address_1);
          formData.append('address_2', address.address_2 || '');
          formData.append('city', address.city);
          formData.append('postcode', address.postcode || '');
          // Require explicit country and zone from UI; do not fallback to Kuwait
          if (address.country_id) formData.append('country_id', address.country_id);
          if (address.zone_id) formData.append('zone_id', address.zone_id);
          
          // Add custom fields
          if (address.custom_field) {
            Object.entries(address.custom_field).forEach(([key, value]) => {
              formData.append(`custom_field[${key}]`, String(value));
            });
          }
          
          // Add default flag
          formData.append('default', address.default ? '1' : '0');
          
          const response = await makeApiCall(API_ENDPOINTS.editAddress, {
            method: 'POST',
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.success === 1) {
            // Fetch updated addresses
            const addresses = await get().fetchAddresses();
            set({ addresses, isLoading: false });
            return response.data;
          } else {
            throw new Error(
              Array.isArray(response.error) ? response.error[0] : 'Failed to add address'
            );
          }
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to add address' 
          });
          throw error;
        }
      },

      updateAddress: async (address) => {
        try {
          set({ isLoading: true, error: null });
          
          // Use account|edit_address endpoint with POST method as specified in the documentation
          // Format data as form-data as specified in the documentation
          const formData = new FormData();
          
          // Add address_id for the address to update
          formData.append('address_id', address.address_id);
          formData.append('firstname', address.firstname);
          formData.append('lastname', address.lastname);
          formData.append('country_id', address.country_id);
          formData.append('zone_id', address.zone_id);
          formData.append('city', address.city);
          
          // Handle custom fields for block, street, etc.
          if (address.custom_field) {
            if (address.custom_field['30']) formData.append('custom_field[30]', address.custom_field['30']);
            if (address.custom_field['31']) formData.append('custom_field[31]', address.custom_field['31']);
            if (address.custom_field['32']) formData.append('custom_field[32]', address.custom_field['32']);
            if (address.custom_field['33']) formData.append('custom_field[33]', address.custom_field['33']);
          }
          
          formData.append('address_2', address.address_2 || '');
          formData.append('default', address.default ? '1' : '0');
          
          const response = await makeApiCall(API_ENDPOINTS.editAddress, {
            method: 'POST',
            data: formData
          });
          
          if (response.success === 1) {
            // Address updated successfully
            set({ isLoading: false });
          } else {
            throw new Error(
              Array.isArray(response.error) ? response.error[0] : 'Failed to update address'
            );
          }
        } catch (error: any) {
          console.error('Update address error:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update address' 
          });
          throw error;
        }
      },

      deleteAddress: async (addressId) => {
        try {
          set({ isLoading: true, error: null });
          
          // Check if user is authenticated
          if (!get().isAuthenticated || !get().user) {
            throw new Error('You must be logged in to delete an address');
          }
          
          // Use account|edit_address endpoint with POST method to delete an address
          const formData = new FormData();
          formData.append('address_id', addressId);
          formData.append('remove', '1'); // Flag to indicate deletion
          
          // Include user information as required
          formData.append('firstname', get().user?.firstname || '');
          formData.append('lastname', get().user?.lastname || '');
          
          const response = await makeApiCall(API_ENDPOINTS.editAddress, {
            method: 'POST',
            data: formData
          });
          
          if (response.success === 1) {
            // Address deleted successfully
            // Update the local addresses list by removing the deleted address
            const updatedAddresses = get().addresses.filter(
              address => address.address_id !== addressId
            );
            set({ addresses: updatedAddresses, isLoading: false });
            Alert.alert('Success', 'Address deleted successfully');
          } else {
            throw new Error(
              Array.isArray(response.error) ? response.error[0] : 'Failed to delete address'
            );
          }
        } catch (error: any) {
          console.error('Delete address error:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to delete address' 
          });
          Alert.alert('Error', error.message || 'Failed to delete address');
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      validateSession: async () => {
        try {
          // Quick check - if no user data, definitely not authenticated
          const { user, isAuthenticated } = get();
          if (!isAuthenticated || !user) {
            return false;
          }

          // Try to fetch addresses as a session validation test
          // This endpoint requires authentication and will fail if session is invalid
          const response = await makeApiCall(API_ENDPOINTS.addresses, {
            method: 'GET'
          });

          // If addresses call succeeds, session is valid
          if (response.success === 1) {
            return true;
          } else {
            // Session invalid, clear auth state
            set({ 
              isAuthenticated: false, 
              user: null,
              addresses: [],
              error: null
            });
            return false;
          }
        } catch (error: any) {
          // Session invalid, clear auth state
          set({ 
            isAuthenticated: false, 
            user: null,
            addresses: [],
            error: null
          });
          return false;
        }
      },

      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null,
          addresses: [],
          isLoading: false,
          error: null
        });
        // Clear cart when logging out
        useCartStore.getState().clearCart();
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 