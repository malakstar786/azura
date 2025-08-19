import AsyncStorage from '@react-native-async-storage/async-storage';
import { appendLanguageParam } from '@utils/api-language';
import axios from 'axios';
import * as Crypto from 'expo-crypto';

// Core API configuration
export const API_BASE_URL = 'https://azura.com.kw';

// Persisted keys
const ACTIVE_COUNTRY_STORAGE_KEY = '@azura.active_country_id';
const ACTIVE_CURRENCY_CODE_KEY = '@azura.active_currency_code';

// API Endpoints
export const API_ENDPOINTS = {
  login: '/index.php?route=extension/mstore/account|login',
  register: '/index.php?route=extension/mstore/account|register',
  forgotPassword: '/index.php?route=extension/mstore/account|forgetPassword',
  updateProfile: '/index.php?route=extension/mstore/account|edit',
  editAddress: '/index.php?route=extension/mstore/account|edit_address',
  addresses: '/index.php?route=extension/mstore/account|addresses',
  homeServiceBlock: '/index.php?route=extension/mstore/home|serviceBlock',
  homeSliderBlock: '/index.php?route=extension/mstore/home|sliderblock',
  homeFeaturesBlock1: '/index.php?route=extension/mstore/home|featuresblock1',
  homeFeaturesBlock2: '/index.php?route=extension/mstore/home|featuresblock2',
  homeFeaturesBlock3: '/index.php?route=extension/mstore/home|featuresBlock3',
  homeFeaturesBlock4: '/index.php?route=extension/mstore/home|featuresBlock4',
  homeFeaturesBlock5: '/index.php?route=extension/mstore/home|featuresBlock5',
  homeFeaturesBlock6: '/index.php?route=extension/mstore/home|featuresBlock6',
  menu: '/index.php?route=extension/mstore/menu',
  products: '/index.php?route=extension/mstore/product',
  productDetail: '/index.php?route=extension/mstore/product|detail',
  orderHistory: '/index.php?route=extension/mstore/order|all',
  cart: '/index.php?route=extension/mstore/cart',
  addToCart: '/index.php?route=extension/mstore/cart|add',
  updateCart: '/index.php?route=extension/mstore/cart|edit',
  removeFromCart: '/index.php?route=extension/mstore/cart|remove',
  emptyCart: '/index.php?route=extension/mstore/cart|emptyCart',
  shippingMethods: '/index.php?route=extension/mstore/shipping_method',
  setShippingMethod: '/index.php?route=extension/mstore/shipping_method|save',
  paymentMethods: '/index.php?route=extension/mstore/payment_method',
  setPaymentMethod: '/index.php?route=extension/mstore/payment_method|save',
  confirmOrder: '/index.php?route=extension/mstore/order|confirm',
  currencies: '/index.php?route=extension/mstore/currency',
  changeCurrency: '/index.php?route=extension/mstore/currency|Save',
  countries: '/index.php?route=extension/mstore/account|getCountries',
  governoratesAndAreas: '/index.php?route=localisation/country',
  shippingAddressSave: '/index.php?route=extension/mstore/shipping_address|save',
  paymentAddressSave: '/index.php?route=extension/mstore/payment_address|save',
};

// Network error codes (avoid enums per code style)
export const NETWORK_ERROR_CODES = {
  TIMEOUT: 'TIMEOUT',
  NO_CONNECTION: 'NO_CONNECTION',
  SERVER_ERROR: 'SERVER_ERROR',
} as const
export type NetworkErrorCode = typeof NETWORK_ERROR_CODES[keyof typeof NETWORK_ERROR_CODES]

// OCSESSID Management
const OCSESSID_STORAGE_KEY = '@azura_ocsessid';

// Generate a random OCSESSID
export const generateRandomOCSESSID = async (): Promise<string> => {
  try {
    // Generate a random UUID using expo-crypto
    const randomId = await Crypto.randomUUID();
    return randomId.replace(/-/g, '');
  } catch (error) {
    // Fallback to a simpler method if expo-crypto fails
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
};

// Store OCSESSID in AsyncStorage
export const setOCSESSID = async (ocsessid: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(OCSESSID_STORAGE_KEY, ocsessid);
    console.log(`[API] Stored OCSESSID: ${ocsessid?.slice(0, 6)}***${ocsessid?.slice(-4)}`);
    // Add a small delay to ensure the OCSESSID is properly stored
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error('Failed to store OCSESSID:', error);
    throw error; // Rethrow to handle the error in the calling function
  }
};

// Get current OCSESSID from AsyncStorage
export const getCurrentOCSESSID = async (): Promise<string | null> => {
  try {
    const storedOcsessid = await AsyncStorage.getItem(OCSESSID_STORAGE_KEY);
    if (!storedOcsessid) {
      console.log('[API] No OCSESSID found in storage');
      return null;
    }
    return storedOcsessid;
  } catch (error) {
    console.error('Failed to get OCSESSID:', error);
    return null;
  }
};

// Get existing OCSESSID or generate a new one
export const getOrCreateOCSESSID = async (): Promise<string> => {
  try {
    const existingOCSESSID = await getCurrentOCSESSID();
    
    if (existingOCSESSID) {
      return existingOCSESSID;
    }
    
    const newOCSESSID = await generateRandomOCSESSID();
    await setOCSESSID(newOCSESSID);
    return newOCSESSID;
  } catch (error) {
    // If there's an error, generate a fallback OCSESSID
    console.error('Error in getOrCreateOCSESSID:', error);
    const fallbackOCSESSID = Math.random().toString(36).substring(2, 15);
    await setOCSESSID(fallbackOCSESSID);
    return fallbackOCSESSID;
  }
};

// ---- Debug helpers ----
function maskValue(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return String(value);
  if (value.length <= 6) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}

function stringifySafe(obj: any): string {
  try {
    if (obj instanceof FormData) {
      // React Native FormData keeps parts in _parts
      const parts: any[] = (obj as any)._parts || [];
      const simplified = parts.map(([k, v]) => {
        if (k === 'telephone' || k === 'email') {
          return [k, maskValue(String(v))];
        }
        return [k, typeof v === 'string' ? v : '[object]'];
      });
      return JSON.stringify({ formDataParts: simplified });
    }
    return JSON.stringify(obj);
  } catch (e) {
    return '[unserializable]';
  }
}

// Function to check if an error is a network error
export const isNetworkError = (error: any): boolean => {
  return (
    !!error && (
      error.code === NETWORK_ERROR_CODES.NO_CONNECTION ||
      error.code === NETWORK_ERROR_CODES.TIMEOUT ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED'
    )
  )
};

// Function to make API calls
export const makeApiCall = async <T = any>(
  endpoint: string,
  options: { 
    method?: string; 
    data?: any; 
    headers?: Record<string, string>; 
    params?: Record<string, string> 
  } = {}
): Promise<ApiResponse<T>> => {
  try {
    // Ensure we have a valid OCSESSID
    const currentOcsessid = await getOrCreateOCSESSID();
    
    // Set default method to GET if not provided
    const method = options.method || 'GET';
    
    // Prepare URL with query params if needed
    // Support absolute endpoints (e.g., currency change on a different host)
    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    // Append language=ar when Arabic is active
    url = appendLanguageParam(url);
    if (options.params && Object.keys(options.params).length > 0) {
      const queryParams = new URLSearchParams(options.params).toString();
      url = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`;
    }
    
    // Set up headers
    const headers: Record<string, string> = {
      ...(options.headers || {}),
      'Accept': 'application/json',
      'User-Agent': 'Azura Mobile App',
      'Cookie': `OCSESSID=${currentOcsessid}`
    };

    // If Content-Type is not explicitly set and data is not FormData,
    // default to application/json
    if (!(options.data instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    // For FormData, don't set Content-Type manually - let axios handle it with proper boundary
    
    
    
    // Make the request with timeout and credentials
    const axiosConfig = {
      headers,
      timeout: 10000, // 10 second timeout
      validateStatus: (status: number) => status >= 200 && status < 500, // Accept all responses for error handling
      transformResponse: [(data: any) => {
        // If data is not a string, return it as is
        if (typeof data !== 'string') {
          return data;
        }
        
        // Check if the response contains HTML mixed with JSON
        if (data.includes('<b>Warning</b>') || data.includes('<b>Error</b>')) {
          
          
          // Extract just the JSON part from the response
          const jsonStart = data.indexOf('{');
          if (jsonStart >= 0) {
            try {
              return JSON.parse(data.substring(jsonStart));
            } catch (e) {
              // Return the original data if parsing fails
              return data;
            }
          }
        }
        
        // Try to parse JSON
        try {
          return JSON.parse(data);
        } catch (e) {
          // Return the raw data if it's not valid JSON
          return data;
        }
      }]
    };

    // Use fetch for FormData POSTs to avoid RN axios content-type quirks
    if (method.toUpperCase() === 'POST' && options.data instanceof FormData) {
      const fetchHeaders: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'Azura Mobile App',
        'Cookie': `OCSESSID=${currentOcsessid}`
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: fetchHeaders,
        body: options.data
      });
      const text = await res.text();
      let parsed: any = text;
      try {
        if (text.includes('<b>Warning</b>') || text.includes('<b>Error</b>')) {
          const jsonStart = text.indexOf('{');
          if (jsonStart >= 0) parsed = JSON.parse(text.substring(jsonStart));
        } else {
          parsed = JSON.parse(text);
        }
      } catch {}
      return parsed;
    }

    // Default axios path
    let response;
    if (method.toUpperCase() === 'GET') {
      response = await axios.get(url, axiosConfig);
    } else {
      response = await axios.post(url, options.data, axiosConfig);
    }

    // Handle response
    return response.data;
  } catch (error: any) {
    
    // Check if the error is an Axios error with a response
    if (error.response) {
      // If the server sent back HTML instead of JSON, provide a clearer error
      if (typeof error.response.data === 'string') {
        if (error.response.data.includes('utf8_strlen()')) {
          error.handled = true;
          error.response.data = { 
            error: ['The service is temporarily unavailable. Please try again later.'],
            success: 0
          };
        }
        else if (error.response.data.includes('<html>') || error.response.data.includes('<b>Error</b>') || error.response.data.includes('<b>Warning</b>')) {
          console.error('Server returned HTML instead of JSON:', error.response.data);
          error.handled = true;
          error.response.data = { 
            error: ['Server returned HTML instead of JSON. Please try again later.'],
            success: 0
          };
        }
      }
      
      // If the server provided an error message
      if (error.response.data && error.response.data.error) {
        if (Array.isArray(error.response.data.error)) {
          throw new Error(error.response.data.error[0] || 'Unknown error');
        } else {
          throw new Error(error.response.data.error || 'Unknown error');
        }
      }
    }
    
    // Network errors
    if (error.code === 'ECONNABORTED') {
      error.code = NETWORK_ERROR_CODES.TIMEOUT;
      throw error;
    }
    
    if (error.code === 'ERR_NETWORK') {
      error.code = NETWORK_ERROR_CODES.NO_CONNECTION;
      throw error;
    }
    
    // Re-throw the error
    throw error;
  }
};

// API Request Configuration
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  data?: any;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: number;
  data?: T;
  error?: string | string[];
}

// API Error Type
export interface ApiError {
  message: string;
  code?: string;
  response?: {
    status: number;
    data: any;
  };
}

// API Response Types
export interface Product {
  product_id: string;
  name: string;
  description: string;
  price: string;
  special: string;
  tax: string;
  rating: number;
  reviews: number;
  href: string;
  thumb: string;
  image: string;
  images: string[];
  options: any[];
  variants: any[];
}

export interface Category {
  category_id: string;
  name: string;
  image: string;
  href: string;
}

export interface ServiceBlock {
  heading_text: string;
  description: string;
  image: string;
  href: string;
}

export interface FeaturesBlock {
  subtitle: string;
  heading: string;
  description: string;
  image: string;
  href: string;
  products: Product[];
}

export interface CartItem {
  cart_id: string;
  product_id: string;
  name: string;
  model: string;
  thumb: string;
  image?: string;
  sku: string;
  quantity: string | number;
  stock: boolean;
  minimum: boolean;
  maximum: boolean;
  reward: number;
  price: string;
  total: string;
  option?: any[];
  href?: string;
}

export interface Order {
  order_id: string;
  order_number: string;
  date_added: string;
  status: string;
  total: string;
  href: string;
}

export interface Address {
  address_id: string;
  firstname: string;
  lastname: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  postcode: string;
  country: string;
  country_id: string;
  zone: string;
  zone_id: string;
  custom_field: any[];
}

export interface UserProfile {
  customer_id: string;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  fax: string;
  newsletter: boolean;
  customer_group_id: string;
  address_id: string;
  custom_field: any[];
}

// Get current language from store
const getCurrentLanguage = () => {
  const languageState = require('@store/language-store').useLanguageStore.getState();
  return languageState.currentLanguage;
};

// Special function to fetch cart data using native fetch API
// This is a workaround for Axios issues with decoding the cart response
export const fetchCartData = async (): Promise<ApiResponse<any>> => {
  try {
    const currentOcsessid = await getOrCreateOCSESSID();
    
    // Get current language for API call
    const language = getCurrentLanguage();
    
    // Construct URL with language parameter using proper URLSearchParams
    let url = `${API_BASE_URL}${API_ENDPOINTS.cart}`;
    url = appendLanguageParam(url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Azura Mobile App',
        'Cookie': `OCSESSID=${currentOcsessid}`
      }
    });
    
    // Get response text instead of json to handle mixed content
    const responseText = await response.text();
    
    // Parse JSON from the response text
    let jsonData;
    try {
      // If the response contains HTML warnings, extract just the JSON part
      if (responseText.includes('<b>Warning</b>') || responseText.includes('<b>Error</b>')) {
        const jsonStart = responseText.indexOf('{');
        if (jsonStart >= 0) {
          jsonData = JSON.parse(responseText.substring(jsonStart));
        } else {
          throw new Error('No JSON data found in response');
        }
      } else {
        // Try parsing the whole response as JSON
        jsonData = JSON.parse(responseText);
      }
      
      return jsonData;
    } catch (e) {
      return { 
        success: 1, 
        error: [],
        data: null
      };
    }
  } catch (error: any) {
    // Network or connection errors - handle gracefully
    if (error.message === 'Network request failed' || error.message === 'Failed to fetch') {
      return { 
        success: 1, 
        error: [],
        data: null
      };
    }
    
    return { 
      success: 0, 
      error: [error.message || 'Failed to fetch cart'],
      data: null
    };
  }
};

// Add the rest of the cart API functions
export const addToCart = async (productId: string, quantity: number): Promise<ApiResponse<any>> => {
  try {
    const currentOcsessid = await getOrCreateOCSESSID();
    
    // Get current language for API call
    const language = getCurrentLanguage();
    
    // Construct URL with language parameter
    let url = `${API_BASE_URL}${API_ENDPOINTS.addToCart}`;
    url = appendLanguageParam(url);
    
    // Ensure quantity is a positive integer
    const validQuantity = Math.max(1, Math.floor(quantity));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Azura Mobile App',
        'Cookie': `OCSESSID=${currentOcsessid}`
      },
      body: JSON.stringify([{ 
        product_id: productId, 
        quantity: validQuantity.toString() 
      }])
    });
    
    // Get response text
    const responseText = await response.text();
    
    // Parse JSON from the response text
    let jsonData;
    try {
      // Handle mixed content responses
      if (responseText.includes('<b>Warning</b>') || responseText.includes('<b>Error</b>')) {
        const jsonStart = responseText.indexOf('{');
        if (jsonStart >= 0) {
          jsonData = JSON.parse(responseText.substring(jsonStart));
        } else {
          throw new Error('No JSON data found in response');
        }
      } else {
        jsonData = JSON.parse(responseText);
      }
      
      // Validate response structure
      if (jsonData && typeof jsonData === 'object') {
        if (jsonData.success === 1) {
          // Success case - return the response as is
          return jsonData;
        } else if (Array.isArray(jsonData.error)) {
          // Error case with array of errors
          return {
            success: 0,
            error: jsonData.error,
            data: null
          };
        } else if (typeof jsonData.error === 'string') {
          // Error case with single error string
          return {
            success: 0,
            error: [jsonData.error],
            data: null
          };
        }
      }
      
      // If we get here, the response structure is unexpected
      throw new Error('Unexpected response structure from add to cart endpoint');
    } catch (e) {
      throw new Error('Failed to parse add to cart response');
    }
  } catch (error: any) {
    return { 
      success: 0, 
      error: [error.message || 'Failed to add to cart'],
      data: null
    };
  }
};

// Country/Currency helpers
// Kept here to avoid new files; used by address flows and location service

export async function setActiveCountryId(countryId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_COUNTRY_STORAGE_KEY, countryId);
  } catch {}
}

export async function getActiveCountryId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_COUNTRY_STORAGE_KEY);
    if (stored && stored.trim().length > 0) return stored;
  } catch {}
  // Fallback to Kuwait if nothing is stored (legacy behavior)
  return '114';
}

export async function setActiveCurrencyCode(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_CURRENCY_CODE_KEY, code);
  } catch {}
}

export async function getActiveCurrencyCode(): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(ACTIVE_CURRENCY_CODE_KEY)) || null;
  } catch {
    return null;
  }
}

export const updateCartQuantity = async (cartId: string, quantity: number): Promise<ApiResponse<any>> => {
  try {
    const currentOcsessid = await getOrCreateOCSESSID();
    
    const url = appendLanguageParam(`${API_BASE_URL}${API_ENDPOINTS.updateCart}`);
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append('cart_id', cartId);
    formData.append('quantity', quantity.toString());
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Azura Mobile App',
        'Cookie': `OCSESSID=${currentOcsessid}`
      },
      body: formData.toString()
    });
    
    // Get response text
    const responseText = await response.text();
    
    // Parse JSON from the response text
    let jsonData;
    try {
      // Handle mixed content responses
      if (responseText.includes('<b>Warning</b>') || responseText.includes('<b>Error</b>')) {
        const jsonStart = responseText.indexOf('{');
        if (jsonStart >= 0) {
          jsonData = JSON.parse(responseText.substring(jsonStart));
        } else {
          throw new Error('No JSON data found in response');
        }
      } else {
        jsonData = JSON.parse(responseText);
      }
      
      // Ensure proper response format
      if (jsonData && typeof jsonData === 'object') {
        if (jsonData.success === 1) {
          // Success case
          return jsonData;
        } else if (Array.isArray(jsonData.error)) {
          // Error case with array of errors
          return {
            success: 0,
            error: jsonData.error,
            data: null
          };
        } else if (typeof jsonData.error === 'string') {
          // Error case with single error string
          return {
            success: 0,
            error: [jsonData.error],
            data: null
          };
        }
      }
      
      // If we get here, the response structure is unexpected
      throw new Error('Unexpected response structure from update cart endpoint');
    } catch (e) {
      throw new Error('Failed to parse update cart response');
    }
  } catch (error: any) {
    return { 
      success: 0, 
      error: [error.message || 'Failed to update cart'],
      data: null
    };
  }
};

export const removeCartItem = async (cartId: string): Promise<ApiResponse<any>> => {
  try {
    const currentOcsessid = await getOrCreateOCSESSID();
    
    const url = appendLanguageParam(`${API_BASE_URL}${API_ENDPOINTS.removeFromCart}`);
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append('cart_id', cartId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Azura Mobile App',
        'Cookie': `OCSESSID=${currentOcsessid}`
      },
      body: formData.toString()
    });
    
    // Get response text
    const responseText = await response.text();
    
    // Parse JSON from the response text
    let jsonData;
    try {
      // Handle mixed content responses
      if (responseText.includes('<b>Warning</b>') || responseText.includes('<b>Error</b>')) {
        const jsonStart = responseText.indexOf('{');
        if (jsonStart >= 0) {
          jsonData = JSON.parse(responseText.substring(jsonStart));
        } else {
          throw new Error('No JSON data found in response');
        }
      } else {
        jsonData = JSON.parse(responseText);
      }
      
      return jsonData;
    } catch (e) {
      throw new Error('Failed to parse remove cart item response');
    }
  } catch (error: any) {
    return { 
      success: 0, 
      error: [error.message || 'Failed to remove cart item'],
      data: null
    };
  }
};

export const emptyCart = async (): Promise<ApiResponse<any>> => {
  try {
    const currentOcsessid = await getOrCreateOCSESSID();
    
    const url = appendLanguageParam(`${API_BASE_URL}${API_ENDPOINTS.emptyCart}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Azura Mobile App',
        'Cookie': `OCSESSID=${currentOcsessid}`
      }
    });
    // Get response text
    const responseText = await response.text();
    
    // Parse JSON from the response text
    let jsonData;
    try {
      // Handle mixed content responses
      if (responseText.includes('<b>Warning</b>') || responseText.includes('<b>Error</b>')) {
        const jsonStart = responseText.indexOf('{');
        if (jsonStart >= 0) {
          jsonData = JSON.parse(responseText.substring(jsonStart));
        } else {
          throw new Error('No JSON data found in response');
        }
      } else {
        jsonData = JSON.parse(responseText);
      }
      
      return jsonData;
    } catch (e) {
      throw new Error('Failed to parse empty cart response');
    }
  } catch (error: any) {
    return { 
      success: 0, 
      error: [error.message || 'Failed to empty cart'],
      data: null
    };
  }
}; 