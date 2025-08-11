import { useTranslation } from '@/i18n/useTranslation';
import AddEditAddress from '@components/add-edit-address';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Address, useAuthStore } from '@store/auth-store';
import { useCartStore } from '@store/cart-store';
import { theme } from '@theme';
import { API_BASE_URL, API_ENDPOINTS, makeApiCall } from '@utils/api-config';
import { getFlexDirection } from '@utils/rtlStyles';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

let ApplePay: any;
let CompleteStatus: any;
let MerchantCapability: any;
let PaymentNetwork: any;
let isApplePayModuleAvailable = false;

if (Platform.OS === 'ios') {
  try {
    const mod = require('apple-pay-react-native-expo');
    ApplePay = mod.default ?? mod;
    CompleteStatus = mod.CompleteStatus;
    MerchantCapability = mod.MerchantCapability;
    PaymentNetwork = mod.PaymentNetwork;
    isApplePayModuleAvailable = true;
  } catch (e) {
    console.log('Apple Pay error', e);
    console.warn('[ApplePay] Native module not available in this build. Rebuild the dev client to enable Apple Pay.', e);
    isApplePayModuleAvailable = false;
  }
}

export default function CheckoutScreen() {
  const { isAuthenticated } = useAuthStore();
  const { addresses, fetchAddresses } = useAuthStore();
  const { items, total, clearCart, getCart } = useCartStore();
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showShippingAddressModal, setShowShippingAddressModal] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<any>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [localAddress, setLocalAddress] = useState<any>(null); // For unauthenticated users
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [applePayLoading, setApplePayLoading] = useState(false);
  const [orderConfirmationData, setOrderConfirmationData] = useState<any>(null);


  // Dynamic shipping cost calculation based on selected shipping method
  const getShippingCost = () => {
    if (!selectedShippingMethod || !selectedShippingMethod.cost) {
      return 0;
    }
    // Parse cost from string like "0.000 KD" to number
    const costString = selectedShippingMethod.cost.toString();
    const costNumber = parseFloat(costString.replace(/[^\d.]/g, ''));
    return isNaN(costNumber) ? 0 : costNumber;
  };

  const shippingCost = getShippingCost();
  const orderTotal = total + shippingCost;

  // Helper function to check if all required fields are completed
  const isCheckoutComplete = () => {
    const hasAddress = isAuthenticated ? !!selectedAddress : !!localAddress;
    const hasShippingAddress = shipToDifferentAddress ? !!shippingAddress : true;
    return hasAddress && hasShippingAddress && !!selectedShippingMethod && !!selectedPaymentMethod;
  };

  // Helper function to parse price strings to numeric values for Apple Pay
  const parsePrice = (priceString: string): number => {
    // Remove all non-digit and non-decimal characters
    const numericValue = parseFloat(priceString.replace(/[^\d.]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  };


  // Apple Pay payment processor - called when Place Order button is clicked
  const onApplePayButtonClicked = async (orderId: string, confirmedOrderData?: any) => {
    const startTime = Date.now();
    const sessionId = `APL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🍏 [ApplePay] ========== APPLE PAY FLOW START ==========');
    
    // Availability & platform validation
    if (!isApplePayModuleAvailable) {
      Alert.alert('Apple Pay Unavailable', 'Reinstall the development build to enable Apple Pay.');
      return false;
    }
    if (Platform.OS !== 'ios') {
      console.log('❌ [ApplePay] Aborting Apple Pay flow');
      Alert.alert('Apple Pay is only available on iOS.');
      return false;
    }
    console.log('✅ [ApplePay] Platform check passed - iOS detected');

    // Device capability checks
    setApplePayLoading(true);
    
    try {
      console.log('🍏 [ApplePay] ========== PAYMENT CALCULATION PHASE ==========');
      
      // Calculate total amount for Apple Pay
      const totalAmount = parsePrice(formatPrice(orderTotal));
      
      // Validation checks
      if (isNaN(totalAmount) || totalAmount <= 0) {
        console.error('❌ [ApplePay] Invalid total amount calculated:', totalAmount);
        throw new Error('Invalid payment amount calculated');
      }
      console.log('✅ [ApplePay] Payment amount validation passed');
      
      console.log('🍏 [ApplePay] ========== PAYMENT REQUEST PREPARATION ==========');

      
      // Prepare Apple Pay request with detailed line items for better user experience
      console.log('🍏 [ApplePay] Configuring payment request object...');
      
      const paymentRequest = {
        merchantIdentifier: 'merchant.kw.com.azura',
        countryCode: 'KW',
        currencyCode: 'KWD',
        supportedNetworks: [
          PaymentNetwork.visa,
          PaymentNetwork.masterCard,
        ],
        merchantCapabilities: [
          MerchantCapability["3DS"],
        ],
        paymentSummaryItems: [
          // Add items from cart with subtotal
          {
            label: 'Items Subtotal',
            amount: total
          },
          // Add shipping if applicable
          ...(shippingCost > 0 ? [{
            label: 'Shipping',
            amount: shippingCost
          }] : []),
          {
            label: 'Azura',
            amount: totalAmount
          }
        ]
      };
      
      console.log('🍏 [ApplePay] Payment request configuration complete:');
      
      console.log('🍏 [ApplePay] ========== APPLE PAY SHEET PRESENTATION ==========');

      // Request Apple Pay payment
      const paymentSheetStartTime = Date.now();
      const paymentResponse = await ApplePay.show(paymentRequest);
      const paymentSheetDuration = Date.now() - paymentSheetStartTime;
      
      console.log('🍏 [ApplePay] ========== PAYMENT AUTHORIZATION RECEIVED ==========');
      
      if (paymentResponse) {
        
        
        
        // Log specific Apple Pay response properties if they exist
        const responseAny = paymentResponse as any;
        if (responseAny.data) {
          console.log('🔍 [ApplePay] - Payment data type:', typeof responseAny.data);
          console.log('🔍 [ApplePay] - Payment data content:', JSON.stringify(responseAny.data, null, 2));
        }
        if (responseAny.transactionId) {
          console.log('🔍 [ApplePay] - Transaction ID:', responseAny.transactionId);
        }
      }
      
      // Generate track ID
      const trackId = `ORDER_${Date.now()}`;

      console.log('🍏 [ApplePay] ========== BACKEND PROCESSING PREPARATION ==========');
      
      // Extract payment network and construct payment method object
      const paymentNetwork = (paymentResponse as any).paymentNetwork;
      const paymentMethodObject = {
        network: paymentNetwork,
        type: 'credit', // Default type since Apple Pay typically uses credit transactions
        displayName: `${paymentNetwork}` // Basic display name format
      };

      const requestBody = {
        token: {
          paymentData: paymentResponse,
          paymentMethod: paymentMethodObject
        },
        amount: totalAmount.toString(),
        currencyCode: '414', // KWD currency code
        trackId: trackId, 
        trackid: trackId, 
        order_id: orderId
      };
      
      console.log('🍏 [ApplePay] Backend request payload prepared:');
      
      const apiEndpoint = `${API_BASE_URL}/index.php?route=extension/opencart/payment/applepay_knet|processPaymentApp`;
      
      console.log('🍏 [ApplePay] Initiating backend API call...');
      const apiCallStartTime = Date.now();
      
      const processResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      
      if (!processResponse.ok) {
        throw new Error(`Server error: ${processResponse.status} ${processResponse.statusText}`);
      }
      console.log('✅ [ApplePay] HTTP response validation passed');
      
      
      // Check if the response is valid JSON
      let result;
      try {
        console.log('🍏 [ApplePay] Extracting response text...');
        const responseText = await processResponse.text();
        
        // Check if response starts with HTML (common error case)
        if (responseText.trim().startsWith('<')) {
          console.error('❌ [ApplePay] Response format error: Server returned HTML instead of JSON');
          console.error('❌ [ApplePay] HTML response preview:', responseText.substring(0, 300));
          throw new Error('Server returned HTML instead of JSON. Possible server error.');
        }
        
        // Validate JSON format
        if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
          console.error('❌ [ApplePay] Response format error: Not valid JSON format');
          console.error('❌ [ApplePay] Response content:', responseText);
          throw new Error('Server response is not in JSON format');
        }
        
        console.log('🍏 [ApplePay] Parsing JSON response...');
        // Parse JSON
        result = JSON.parse(responseText);
        
      
      } catch (error) {
        const parseError = error as Error;
        throw new Error('Invalid response from server: ' + parseError.message);
      }
      
      if (result.status === 'success') {      
        await ApplePay.complete(CompleteStatus.success);
        console.log('✅ [ApplePay] Apple Pay SDK notified of successful completion');
  
        await clearCart();
        console.log('✅ [ApplePay] Shopping cart cleared successfully');
        
        // Prepare success page data using confirmed order data (same fields as WebView)
        const baseOrderData = confirmedOrderData || orderConfirmationData;
        if (baseOrderData) {
          const orderData = {
            order_id: baseOrderData.order_id,
            store_name: baseOrderData.store_name,
            firstname: baseOrderData.firstname,
            lastname: baseOrderData.lastname,
            email: baseOrderData.email,
            date_added: baseOrderData.date_added,
            total: baseOrderData.total,
            payment_method: baseOrderData.payment_method,
            line_items: baseOrderData.line_items,
          };
          console.log('🍏 [ApplePay] Success page data prepared:', JSON.stringify(orderData, null, 2));
          router.replace({
            pathname: '/order-success',
            params: { orderData: JSON.stringify(orderData) }
          });
        } else {
          console.log('🍏 [ApplePay] No order data available, navigating to success without params');
          router.replace('/order-success');
        }
        console.log('✅ [ApplePay] Navigation to success page completed');
        console.log('✅ [ApplePay] Apple Pay flow completed successfully');
        return true;
      } else {
        console.log('🍏 [ApplePay] ========== FAILURE FLOW ==========');
        
        console.log('🍏 [ApplePay] Completing Apple Pay transaction with failure status...');
        await ApplePay.complete(CompleteStatus.failure);
        console.log('✅ [ApplePay] Apple Pay SDK notified of failure completion');
        
        const errorMessage = result.message || 'An error occurred during payment processing.';
        console.log('🍏 [ApplePay] Showing error alert to user:', errorMessage);
        Alert.alert('Payment Failed', errorMessage);
        
        console.log('🍏 [ApplePay] Navigating to order failure page...');
        router.replace('/order-failure');
        console.log('✅ [ApplePay] Navigation to failure page completed');
        return false;
      }
    } catch (error: any) {
      console.log('🍏 [ApplePay] ========== ERROR HANDLING ==========');
      console.error('❌ [ApplePay] Payment flow encountered an error');
      console.error('❌ [ApplePay] Error type:', typeof error);
      
      const userErrorMessage = error?.message || 'Apple Pay payment failed';
      Alert.alert('Apple Pay Error', userErrorMessage);
      
      // Ensure we complete the payment with failure if needed
      console.log('🍏 [ApplePay] Attempting to complete Apple Pay transaction with failure status...');
      try {
        await ApplePay.complete(CompleteStatus.failure);
        console.log('✅ [ApplePay] Successfully notified Apple Pay SDK of failure');
      } catch (completeError: any) {
        console.error('❌ [ApplePay] Critical: Failed to complete Apple Pay transaction');
        // Ignore errors when completing payment in error state
      }
      return false;
    } finally {
      const totalDuration = Date.now() - startTime;
      setApplePayLoading(false);
      console.log('🍏 [ApplePay] ========== APPLE PAY FLOW END ==========');
    }
  };

  // Load addresses and cart on mount
  useEffect(() => {
    const initializeCheckout = async () => {
      
      // Always fetch cart data
      await getCart();
      
      if (isAuthenticated) {
        loadAddresses();
      } else {
        // Load local address for unauthenticated users
        loadLocalAddress();
      }
      
    };
    
    initializeCheckout();
  }, [isAuthenticated]);

  // Set address in checkout session and fetch shipping/payment methods when address is available
  useEffect(() => {
    if ((isAuthenticated && selectedAddress) || (!isAuthenticated && localAddress)) {
      setAddressInCheckoutAndFetchMethods();
    } else {
      // Clear methods when no address
      setShippingMethods([]);
      setPaymentMethods([]);
      setSelectedShippingMethod(null);
      setSelectedPaymentMethod(null);
    }
  }, [selectedAddress, localAddress, isAuthenticated]);

  const loadAddresses = async () => {
    setAddressLoading(true);
    
    try {
      // Fetch addresses directly for checkout to get the original order
      
      const response = await makeApiCall(API_ENDPOINTS.addresses, {
        method: 'GET'
      });
      
      console.log('🏠 [Addresses] Raw API response:', JSON.stringify(response, null, 2));
      
      if (response.success === 1 && Array.isArray(response.data) && response.data.length > 0) {
        
        // Get the LAST address from the original API response (most recent)
        // The API returns addresses in order of creation, so the last one is the newest
        const mostRecentAddress = response.data[response.data.length - 1];
        setSelectedAddress(mostRecentAddress);
        
      } else {
        setSelectedAddress(null);
      }
      
      // Also fetch for the address store (for the address modal)
      await fetchAddresses();
    } catch (error) {
      setSelectedAddress(null);
    }
    
    setAddressLoading(false);
  };

  const loadLocalAddress = async () => {
    
    try {
      const savedAddress = await AsyncStorage.getItem('@checkout_local_address');
      
      
      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        
        setLocalAddress(parsedAddress);
      } else {
      }
    } catch (error) {
    }
  };

  const saveLocalAddress = async (address: any) => {
    
    try {
      const addressJson = JSON.stringify(address);
      await AsyncStorage.setItem('@checkout_local_address', addressJson);
      setLocalAddress(address);
    } catch (error) {
      console.error('❌ [Save Local Address] Error saving local address:', error);
    }
  };

  const setAddressInCheckoutAndFetchMethods = async () => {
    
    setMethodsLoading(true);
    
    try {
      const currentAddress = isAuthenticated ? selectedAddress : localAddress;

      if (!currentAddress) {
        return;
      }

      // For both authenticated and unauthenticated users, send complete address data
      if (isAuthenticated && selectedAddress) {
        
        // Get user's email and phone from auth store
        const { user } = useAuthStore.getState();
        console.log('🔄 [Address Setup] User from auth store:', user ? {
          email: user.email,
          telephone: user.telephone,
          firstname: user.firstname,
          lastname: user.lastname
        } : 'No user data');
        
        // Set payment address in checkout session using complete address data
        const addressData = {
          firstname: selectedAddress.firstname,
          lastname: selectedAddress.lastname,
          email: user?.email || '', // Use user's email from auth store
          telephone: selectedAddress.telephone || user?.telephone || '',
          country_id: "114", // Kuwait
          city: selectedAddress.city,
          zone_id: selectedAddress.zone_id,
          address_2: selectedAddress.address_2 || "",
          custom_field: {
            "32": selectedAddress.custom_field['32'] || "", // House Building
            "30": selectedAddress.custom_field['30'] || "", // Block
            "31": selectedAddress.custom_field['31'] || "", // Street
            "33": selectedAddress.custom_field['33'] || "", // Apartment No.
            "35": selectedAddress.custom_field['35'] || ""  // avenue
          }
        };

        // Set payment address
        const paymentAddressResponse = await makeApiCall('/index.php?route=extension/mstore/payment_address|save', {
          method: 'POST',
          data: addressData
        });

        // Set shipping address (same as payment)
        const shippingAddressResponse = await makeApiCall('/index.php?route=extension/mstore/shipping_address|save', {
          method: 'POST',
          data: addressData
        });
      } else if (!isAuthenticated && localAddress) {
        
        // For unauthenticated users, set address data directly
        const addressData = {
          firstname: localAddress.firstname,
          lastname: localAddress.lastname,
          email: localAddress.email || '', // Use email from local address data
          telephone: localAddress.telephone || '',
          country_id: "114", // Kuwait
          city: localAddress.city,
          zone_id: localAddress.zone_id,
          address_2: localAddress.address_2 || "",
          custom_field: {
            "32": localAddress.custom_field?.['32'] || "", // House Building
            "30": localAddress.custom_field?.['30'] || "", // Block
            "31": localAddress.custom_field?.['31'] || "", // Street
            "33": localAddress.custom_field?.['33'] || "", // Apartment No.
            "35": localAddress.custom_field?.['35'] || ""  // avenue
          }
        };

        // Set payment address
        const paymentAddressResponse = await makeApiCall('/index.php?route=extension/mstore/payment_address|save', {
          method: 'POST',
          data: addressData
        });

        // Set shipping address (same as payment)
        const shippingAddressResponse = await makeApiCall('/index.php?route=extension/mstore/shipping_address|save', {
          method: 'POST',
          data: addressData
        });
      }

      // Now fetch shipping and payment methods
      await fetchShippingAndPaymentMethods();

    } catch (error) {
      console.error('❌ [Address Setup] Error setting address in checkout session:', error);
      setShippingMethods([]);
      setPaymentMethods([]);
      setSelectedShippingMethod(null);
      setSelectedPaymentMethod(null);
    } finally {
      setMethodsLoading(false);
    }
  };

  const fetchShippingAndPaymentMethods = async () => {
    
    try {
      // Get current language for API calls
      const { useLanguageStore } = await import('@store/language-store');
      const { currentLanguage } = useLanguageStore.getState();
      const shippingResponse = await makeApiCall('/index.php?route=extension/mstore/shipping_method', {
        method: 'GET',
        params: currentLanguage === 'ar' ? { language: 'ar' } : undefined
      });
      
      if (shippingResponse.success === 1 && shippingResponse.data) {
        
        // Parse shipping methods from nested structure
        if (shippingResponse.data.shipping_methods && typeof shippingResponse.data.shipping_methods === 'object') {
          
          const parsedMethods = [];
          
          // Iterate through shipping methods (e.g., "flat")
          for (const methodKey in shippingResponse.data.shipping_methods) {
            const method = shippingResponse.data.shipping_methods[methodKey];
            
            // Iterate through quotes within each method
            if (method.quote && typeof method.quote === 'object') {
              
              for (const quoteKey in method.quote) {
                const quote = method.quote[quoteKey];
                
                const parsedMethod = {
                  ...quote,
                  title: quote.title || method.title,
                  sort_order: method.sort_order
                };
                parsedMethods.push(parsedMethod);
              }
            } else {
            }
          }
          
          if (parsedMethods.length > 0) {
            setShippingMethods(parsedMethods);
          } else {
            setShippingMethods([]);
            setSelectedShippingMethod(null);
          }
        } else {
          // No shipping methods available - this is expected if address is not set properly
          setShippingMethods([]);
          setSelectedShippingMethod(null);
        }
      } else {
        console.log('🚚 [Shipping] Shipping response unsuccessful or no data');
      }
      
      // Fetch payment methods with language parameter
      const paymentResponse = await makeApiCall('/index.php?route=extension/mstore/payment_method', {
        method: 'GET',
        params: currentLanguage === 'ar' ? { language: 'ar' } : undefined
      });
      
      if (paymentResponse.success === 1 && paymentResponse.data) {
        
        // Parse payment methods from object structure
        if (paymentResponse.data.payment_methods && typeof paymentResponse.data.payment_methods === 'object') {
          
          const parsedMethods = [];
          
          // Iterate through payment methods (e.g., "custom", "knet", "cod")
          for (const methodKey in paymentResponse.data.payment_methods) {
            const method = paymentResponse.data.payment_methods[methodKey];
            
            const parsedMethod = {
              ...method,
              sort_order: method.sort_order || "999" // Default sort order if not provided
            };
            parsedMethods.push(parsedMethod);
          }
          
          if (parsedMethods.length > 0) {
            setPaymentMethods(parsedMethods);
          } else {
            setPaymentMethods([]);
            setSelectedPaymentMethod(null);
          }
        } else {
          // No payment methods available - this is expected if address is not set properly
          setPaymentMethods([]);
          setSelectedPaymentMethod(null);
        }
      } else {
      }
      
    } catch (error) {
      setShippingMethods([]);
      setPaymentMethods([]);
      setSelectedShippingMethod(null);
      setSelectedPaymentMethod(null);
    }
    
    console.log('🚚💳 [Methods] Shipping and payment methods fetch completed');
  };

  const handleEditAddress = () => {
    setIsEditingAddress(true);
    setIsAddingNewAddress(false);
    setShowAddressModal(true);
  };

  const handleAddAddress = () => {
    setIsAddingNewAddress(true);
    setIsEditingAddress(false);
    setShowAddressModal(true);
  };

  const handleAddShippingAddress = () => {
    setIsAddingNewAddress(true);
    setIsEditingAddress(false);
    setShowShippingAddressModal(true);
  };

  const handleEditShippingAddress = () => {
    setIsEditingAddress(true);
    setIsAddingNewAddress(false);
    setShowShippingAddressModal(true);
  };

  const handleShippingMethodSelection = async (method: any) => {
    console.log('🚚 [Shipping Selection] User selected shipping method');
    console.log('🚚 [Shipping Selection] Selected method:', JSON.stringify(method, null, 2));
    
    setSelectedShippingMethod(method);
    
    try {
      // Call set shipping method API immediately when user selects
      const methodCode = method?.code || "flat.flat";
      
      const response = await makeApiCall(API_ENDPOINTS.setShippingMethod, {
        method: 'POST',
        data: {
          shipping_method: methodCode
        }
      });
      
      if (response.success === 1) {
      } else {
      }
    } catch (error) {
      console.error('❌ [Shipping Selection] Error setting shipping method:', error);
    }
  };

  const handlePaymentMethodSelection = async (method: any) => {
    
    // Check if Apple Pay KNET is selected
    if (method?.code === 'applepay_knet') {
    }
    
    setSelectedPaymentMethod(method);
    
    try {
      // Call set payment method API immediately when user selects
      const methodCode = method?.code || "cod";
      
      const response = await makeApiCall(API_ENDPOINTS.setPaymentMethod, {
        method: 'POST',
        data: {
          payment_method: methodCode
        }
      });
      
      if (response.success === 1) {
      } else {
      }
    } catch (error) {
      console.error('❌ [Payment Selection] Error setting payment method:', error);
    }
  };

  const handlePlaceOrder = async () => {
    // Clear previous general errors
    setError(null);
    setIsLoading(true);

    try {
      
      // Verify all required selections are made
      if (!selectedShippingMethod) {
        throw new Error('Shipping method not selected');
      }

      if (!selectedPaymentMethod) {
        throw new Error('Payment method not selected');
      }

      // For Apple Pay, ensure we set the correct payment method first
      if (selectedPaymentMethod?.code === 'applepay_knet' && Platform.OS === 'ios') {
        // Explicitly set payment method to Apple Pay KNET
        await makeApiCall(API_ENDPOINTS.setPaymentMethod, {
          method: 'POST',
          data: {
            payment_method: 'applepay_knet' 
          }
        });
      }
      
      
      const confirmResponse = await makeApiCall(API_ENDPOINTS.confirmOrder, {
        method: 'POST'
      });
      // If order creation failed, throw error
      if (confirmResponse.success !== 1) {
        throw new Error('Failed to create order.');
      }

      // Store the order confirmation data for later use
      setOrderConfirmationData(confirmResponse.data);

      // Now handle payment method-specific flows
      if (selectedPaymentMethod?.code === 'applepay_knet' && Platform.OS === 'ios') {
        // Trigger Apple Pay payment flow with the order ID
        const success = await onApplePayButtonClicked(confirmResponse.data.order_id, confirmResponse.data);
        setIsLoading(false);
        return;
      }

      // For other payment methods with redirect URL (KNet, Credit Card)
      if (confirmResponse.data.redirect_url) {
        // Decode HTML entities and fix URL format
        let processedUrl = confirmResponse.data.redirect_url.replace(/&amp;/g, '&');
        // Fix specific URL format: change "&order_id=" to "&amp&order_id="
        processedUrl = processedUrl.replace(/&order_id=/g, '&amp&order_id=');
        
        // Open payment gateway in WebView
        setPaymentUrl(processedUrl);
        setShowPaymentWebView(true);
        setIsLoading(false);
        return;
      }
      
      // For COD or direct payments without redirect_url
      setOrderSuccess(true);
      
      // Clear cart
      await clearCart();
      console.log('🛒 [Order] Cart cleared');

      // Extract important order data for success page
      const orderData = {
        order_id: confirmResponse.data.order_id,
        store_name: confirmResponse.data.store_name,
        firstname: confirmResponse.data.firstname,
        lastname: confirmResponse.data.lastname,
        email: confirmResponse.data.email,
        date_added: confirmResponse.data.date_added,
        total: confirmResponse.data.total,
        payment_method: confirmResponse.data.payment_method,
        line_items: confirmResponse.data.line_items,
      };

      // Redirect to success page with order data
      router.replace({
        pathname: '/order-success',
        params: { orderData: JSON.stringify(orderData) }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while placing the order');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment WebView navigation changes
  const handlePaymentNavigation = async (navState: any) => {
    const currentUrl = navState.url;
    console.log('🌐 [WebView Navigation] Payment WebView navigation event');
    console.log('🌐 [WebView Navigation] Current URL:', currentUrl);
    
    // Monitor for success URL
    if (currentUrl.includes('checkout/success')) {
      
      // Close WebView
      setShowPaymentWebView(false);
      setPaymentUrl(null);
      
      // Clear cart
      await clearCart();
      console.log('✅ [WebView Navigation] Cart cleared successfully');
      
      // Prepare order data for success page using stored confirmation data
      if (orderConfirmationData) {
        const orderData = {
          order_id: orderConfirmationData.order_id,
          store_name: orderConfirmationData.store_name,
          firstname: orderConfirmationData.firstname,
          lastname: orderConfirmationData.lastname,
          email: orderConfirmationData.email,
          date_added: orderConfirmationData.date_added,
          total: orderConfirmationData.total,
          payment_method: orderConfirmationData.payment_method,
          line_items: orderConfirmationData.line_items,
        };
        
        console.log('✅ [WebView Navigation] Navigating to success page with order data:', JSON.stringify(orderData, null, 2));
        router.replace({
          pathname: '/order-success',
          params: { orderData: JSON.stringify(orderData) }
        });
      } else {
        console.log('✅ [WebView Navigation] No order confirmation data available, navigating without data');
        router.replace('/order-success');
      }
      return;
    }

    // Monitor for failure URL (checkout/cart)
    if (currentUrl.includes('checkout/cart')) {
      
      // Close WebView
      setShowPaymentWebView(false);
      setPaymentUrl(null);
      
      // Navigate to failure page
      router.replace('/order-failure');
      return;
    }
    
    // Log other navigation patterns for debugging
    if (currentUrl.includes('knet') || currentUrl.includes('kpay')) {
    }
    
    if (currentUrl.includes('cybersource')) {
    }
  };

  // Close payment WebView manually
  const closePaymentWebView = () => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setIsLoading(false);
  };

  const formatPrice = (price: number) => {
    return `KD ${price.toFixed(3)}`;
  };


  const addPaymentAddress = async (addressData: any) => {
    
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        
        // Get user's email from auth store
        const { user } = useAuthStore.getState();
        
        // For authenticated users, use the payment address endpoint
        const requestData = {
          firstname: addressData.firstname,
          lastname: addressData.lastname,
          email: addressData.email || user?.email || '',
          telephone: addressData.telephone || addressData.phone || user?.telephone || '',
          country_id: "114", // Kuwait
          city: addressData.city,
          zone_id: addressData.zone_id,
          address_2: addressData.address_2 || "",
          custom_field: {
            "32": addressData.custom_field?.['32'] || "", // House Building
            "30": addressData.custom_field?.['30'] || "", // Block
            "31": addressData.custom_field?.['31'] || "", // Street
            "33": addressData.custom_field?.['33'] || "", // Apartment No.
            "35": addressData.custom_field?.['35'] || ""  // avenue
          }
        };

        const response = await makeApiCall('/index.php?route=extension/mstore/payment_address|save', {
          method: 'POST',
          data: requestData,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.success === 1) {
          
          // Refresh addresses for authenticated users and get the most recent one
          await loadAddresses(); // This will automatically select the most recent address
          
          // Explicitly trigger method fetching after address is set
          await setAddressInCheckoutAndFetchMethods();
          
          setIsLoading(false);
          return true;
        } else {
          throw new Error(response.error?.[0] || 'Failed to add address');
        }
      } else {
        console.log('🏠 [Add Address] Processing unauthenticated user address');
        
        // For unauthenticated users, save in the same format as API response
        const localAddressData = {
          address_id: Date.now().toString(), // Generate a temporary ID
          firstname: addressData.firstname,
          lastname: addressData.lastname,
          company: '',
          address_1: `${addressData.custom_field?.['30']} ${addressData.custom_field?.['31']} ${addressData.custom_field?.['32']}`,
          address_2: addressData.address_2 || '',
          city: addressData.city,
          postcode: '',
          country_id: addressData.country_id,
          zone_id: addressData.zone_id,
          custom_field: {
            '30': addressData.custom_field?.['30'] || '', // Block
            '31': addressData.custom_field?.['31'] || '', // Street
            '32': addressData.custom_field?.['32'] || '', // Building
            '33': addressData.custom_field?.['33'] || '', // Apartment
            '35': addressData.custom_field?.['35'] || ''  // Avenue
          },
          default: false
        };

        await saveLocalAddress(localAddressData);
        await setAddressInCheckoutAndFetchMethods();
        
        setIsLoading(false);
        return true;
      }
    } catch (error: any) {
      console.error('❌ [Add Address] Error adding payment address:', error);
      Alert.alert('Error', error.message || 'Failed to add address');
      return false;
    }
  };

  const addShippingAddress = async (addressData: any) => {
    try {
      setIsLoading(true);
      
      // Get user's email from auth store
      const { user } = useAuthStore.getState();
      
      const requestData = {
        firstname: addressData.firstname,
        lastname: addressData.lastname,
        email: addressData.email || user?.email || '',
        telephone: addressData.telephone || addressData.phone || user?.telephone || '',
        country_id: "114", // Kuwait
        city: addressData.city || "1",
        zone_id: addressData.zone_id || "4868",
        address_2: addressData.address_2 || "",
        custom_field: {
          "32": addressData.custom_field?.['32'] || "", // House Building
          "30": addressData.custom_field?.['30'] || "", // Block
          "31": addressData.custom_field?.['31'] || "", // Street
          "33": addressData.custom_field?.['33'] || "", // Apartment No.
          "35": addressData.custom_field?.['35'] || ""  // avenue
        }
      };

      console.log('Adding shipping address:', requestData);

      const response = await makeApiCall('/index.php?route=extension/mstore/shipping_address|save', {
        method: 'POST',
        data: requestData,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Shipping address response:', response);

      if (response.success === 1) {
        // Use the response data directly for shipping address
        setShippingAddress(response.data);
        setIsLoading(false);
        return true;
      } else {
        throw new Error(response.error?.[0] || 'Failed to add shipping address');
      }
    } catch (error: any) {
      console.error('Error adding shipping address:', error);
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Failed to add shipping address');
      return false;
    }
  };

  if (addressLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('checkout.title')}</Text>
          <Text style={styles.subtitle}>{t('checkout.easyShoppingWithAzura')}</Text>
        </View>

        {/* Billing Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-outline" size={20} color="#000" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>{t('checkout.billingShippingAddress')}</Text>
          </View>
          
          {/* Display address based on authentication status */}
          {(isAuthenticated && selectedAddress) || (!isAuthenticated && localAddress) ? (
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>
                {isAuthenticated && selectedAddress ? 
                  `${selectedAddress.firstname} ${selectedAddress.lastname}` :
                  localAddress ? `${localAddress.firstname} ${localAddress.lastname}` : ''
                }
              </Text>
              <Text style={styles.addressLocation}>
                Kuwait,
              </Text>
              <Text style={styles.addressLocation}>
                {isAuthenticated && selectedAddress ? selectedAddress.city : localAddress?.city}, Area
              </Text>
              <Text style={styles.addressDetails}>
                {isAuthenticated && selectedAddress ? 
                  `Block ${selectedAddress.custom_field['30']}, Street ${selectedAddress.custom_field['31']}, House Building ${selectedAddress.custom_field['32']}${selectedAddress.custom_field['35'] ? ', Avenue ' + selectedAddress.custom_field['35'] : ''}` :
                  localAddress ? `Block ${localAddress.custom_field?.['30']}, Street ${localAddress.custom_field?.['31']}, House Building ${localAddress.custom_field?.['32']}${localAddress.custom_field?.['35'] ? ', Avenue ' + localAddress.custom_field?.['35'] : ''}` : ''
                }
              </Text>
              {((isAuthenticated && selectedAddress?.address_2) || (!isAuthenticated && localAddress?.address_2)) && (
                <Text style={styles.addressDetails}>
                  {isAuthenticated && selectedAddress ? selectedAddress.address_2 : localAddress?.address_2}
                </Text>
              )}
              <TouchableOpacity 
                style={styles.editAddressButton}
                onPress={handleEditAddress}
              >
                <Ionicons name="create-outline" size={16} color="#000" />
                <Text style={styles.editAddressText}>{t('checkout.editAddress')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addAddressButton}
              onPress={handleAddAddress}
            >
              <View style={styles.addAddressContent}>
                <Ionicons name="add-circle-outline" size={24} color="#000" />
                <Text style={styles.addAddressText}>{t('checkout.addAddress')}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.shipToDifferentRow}
            onPress={() => setShipToDifferentAddress(!shipToDifferentAddress)}
          >
            <View style={styles.customCheckbox}>
              {shipToDifferentAddress && <View style={styles.checkboxFill} />}
            </View>
            <Text style={styles.shipToDifferentText}>{t('checkout.shipToDifferentAddress')}</Text>
          </TouchableOpacity>

          {shipToDifferentAddress && (
            <View style={[styles.section, styles.shippingAddressSection]}>
              <Text style={styles.shippingAddressTitle}>{t('checkout.shippingAddressTitle')}</Text>
              {shippingAddress ? (
                <View style={styles.addressCard}>
                  <Text style={styles.addressName}>
                    {shippingAddress.firstname} {shippingAddress.lastname}
                  </Text>
                  <Text style={styles.addressLocation}>
                    Kuwait,
                  </Text>
                  <Text style={styles.addressLocation}>
                    {shippingAddress.city_name || shippingAddress.city}, {shippingAddress.zone || 'Area'}
                  </Text>
                  <Text style={styles.addressDetails}>
                    Block {shippingAddress.custom_field['30']}, Street {shippingAddress.custom_field['31']}, House Building {shippingAddress.custom_field['32']}{shippingAddress.custom_field['35'] ? ', Avenue ' + shippingAddress.custom_field['35'] : ''}
                  </Text>
                  {shippingAddress.address_2 && (
                    <Text style={styles.addressDetails}>
                      {shippingAddress.address_2}
                    </Text>
                  )}
                  <TouchableOpacity 
                    style={styles.editAddressButton}
                    onPress={handleEditShippingAddress}
                  >
                    <Ionicons name="create-outline" size={16} color="#000" />
                    <Text style={styles.editAddressText}>{t('checkout.editAddress')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addAddressButton}
                  onPress={handleAddShippingAddress}
                >
                  <View style={styles.addAddressContent}>
                    <Ionicons name="add-circle-outline" size={24} color="#000" />
                    <Text style={styles.addAddressText}>{t('checkout.addShippingAddressButton')}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {!isAuthenticated && !localAddress && (
            <Text style={styles.validationError}>{t('checkout.addBillingAddress')}</Text>
          )}
          
          {isAuthenticated && !selectedAddress && (
            <Text style={styles.validationError}>{t('checkout.addBillingAddress')}</Text>
          )}
          
          {shipToDifferentAddress && !shippingAddress && (
            <Text style={styles.validationError}>{t('checkout.addShippingAddress')}</Text>
          )}
        </View>

        {/* Shipping Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="car-outline" size={20} color="#000" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>{t('checkout.selectShipping')}</Text>
          </View>
          
          {methodsLoading ? (
            <View style={styles.methodsLoadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.methodsLoadingText}>{t('checkout.loadingShippingMethods')}</Text>
            </View>
          ) : shippingMethods.length > 0 ? (
            <View style={styles.methodsList}>
              {shippingMethods.map((method: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.methodOption,
                    selectedShippingMethod === method && styles.selectedMethodOption
                  ]}
                  onPress={() => handleShippingMethodSelection(method)}
                >
                  <View style={styles.methodRadio}>
                    <View style={[
                      styles.radioOuter,
                      selectedShippingMethod === method && styles.radioSelected
                    ]}>
                      {selectedShippingMethod === method && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodTitle}>{method.title || method.name}</Text>
                    {method.text && (
                      <Text style={styles.methodCost}>{method.text}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
                        <View style={styles.noMethodsContainer}>
              <Text style={styles.noMethodsText}>
                {(isAuthenticated && selectedAddress) || (!isAuthenticated && localAddress)
                  ? t('checkout.noShippingMethods')
                  : t('checkout.addAddressForShipping')
                }
              </Text>
            </View>
          )}
          
          {!selectedShippingMethod && ((isAuthenticated && selectedAddress) || (!isAuthenticated && localAddress)) && (
            <Text style={styles.validationError}>{t('checkout.selectShippingMethod')}</Text>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="card-outline" size={20} color="#000" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>{t('checkout.selectPaymentTitle')}</Text>
          </View>
          
          {methodsLoading ? (
            <View style={styles.methodsLoadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.methodsLoadingText}>{t('checkout.loadingPaymentMethods')}</Text>
            </View>
          ) : paymentMethods.length > 0 ? (
            <View style={styles.methodsList}>
              {paymentMethods.filter((method: any) => {
                // Filter out Apple Pay for non-iOS platforms
                if (method.code === 'applepay_knet' && Platform.OS !== 'ios') {
                  return false;
                }
                return true;
              }).map((method: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.methodOption,
                    method.code === 'applepay_knet' ? styles.applePayMethodOption : null,
                    selectedPaymentMethod === method && styles.selectedMethodOption,
                    selectedPaymentMethod === method && method.code === 'applepay_knet' && styles.selectedApplePayMethodOption
                  ]}
                  onPress={() => {
                    handlePaymentMethodSelection(method);
                  }}
                >
                  <View style={styles.methodRadio}>
                    <View style={[
                      styles.radioOuter,
                      selectedPaymentMethod === method && styles.radioSelected
                    ]}>
                      {selectedPaymentMethod === method && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.methodInfo}>
                    {method.code === 'applepay_knet' ? (
                      <View style={styles.applePayMethodContent}>
                        <View style={[
                          styles.applePayBadge,
                          selectedPaymentMethod === method ? styles.applePayBadgeSelected : styles.applePayBadgeUnselected
                        ]}>
                    <Ionicons 
                      name="logo-apple" 
                            size={16} 
                            color={selectedPaymentMethod === method ? "#fff" : "#fff"} 
                            style={styles.appleLogoIcon}
                    />
                  <Text style={[
                    styles.applePayText,
                            selectedPaymentMethod === method ? styles.applePayTextSelected : styles.applePayTextUnselected
                  ]}>
                            Pay
                  </Text>
                    </View>
                        <Text style={styles.methodSubtext}>Apple Pay via KNET</Text>
                  </View>
                    ) : (
                      <>
                        <Text style={styles.methodTitle}>{method.title || method.name}</Text>
                        {method.terms && (
                          <Text style={styles.methodTerms}>{method.terms}</Text>
                        )}
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noMethodsContainer}>
              <Text style={styles.noMethodsText}>
                {(isAuthenticated && selectedAddress) || (!isAuthenticated && localAddress) 
                  ? t('checkout.noPaymentMethods')
                  : t('checkout.addAddressForPayment')
                }
              </Text>
            </View>
          )}
          
          {!selectedPaymentMethod && ((isAuthenticated && selectedAddress) || (!isAuthenticated && localAddress)) && (
            <Text style={styles.validationError}>{t('checkout.selectPaymentMethod')}</Text>
          )}
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cube-outline" size={20} color="#000" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>{t('checkout.orderSummaryTitle')}</Text>
          </View>
          
          {/* Product subheading and product list */}
          <Text style={styles.productSubheading}>{t('checkout.product')}</Text>
          
          <FlatList
            data={items}
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            keyExtractor={(item) => item.cart_id}
            renderItem={({ item }) => (
              <View style={styles.productCard}>
                <Image
                  source={{ uri: item.thumb }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
                    {item.name.toUpperCase()}
                  </Text>
                  <Text style={styles.productQuantity}>x {item.quantity}</Text>
                  <Text style={styles.productPrice}>{item.total}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.productsContainer}
            ListEmptyComponent={
              <View style={styles.emptyProductsContainer}>
                <Text style={styles.emptyProductsText}>{t('checkout.noProducts')}</Text>
              </View>
            }
          />
          
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('checkout.itemSubtotal')}</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('checkout.shippingFee')}</Text>
              <Text style={styles.totalValue}>
                {selectedShippingMethod ? formatPrice(shippingCost) : formatPrice(0)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>{t('checkout.grandTotal')}</Text>
              <Text style={styles.grandTotalValue}>{formatPrice(orderTotal)}</Text>
            </View>
          </View>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (isLoading || 
             (!isAuthenticated && !localAddress) || 
             (isAuthenticated && !selectedAddress) ||
             (shipToDifferentAddress && !shippingAddress) ||
             !selectedPaymentMethod || 
             !selectedShippingMethod) && styles.disabledButton
          ]}
          onPress={handlePlaceOrder}
          disabled={isLoading || 
                   (!isAuthenticated && !localAddress) || 
                   (isAuthenticated && !selectedAddress) ||
                   (shipToDifferentAddress && !shippingAddress) ||
                   !selectedPaymentMethod || 
                   !selectedShippingMethod}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>
              {isCheckoutComplete() ? t('checkout.placeOrder') : t('checkout.completeDetails')}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>By Proceeding, I've read and accept the terms & conditions.</Text>
          
          <View style={styles.paymentMethodsSection}>
            <Text style={styles.paymentMethodsTitle}>{t('checkout.paymentMethodsTitle')}</Text>
            <View style={styles.paymentMethodsRow}>
              <Ionicons name="card" size={24} color="#666" style={styles.paymentMethodIcon} />
              <Ionicons name="card" size={24} color="#666" style={styles.paymentMethodIcon} />
              <Ionicons name="card" size={24} color="#666" style={styles.paymentMethodIcon} />
            </View>
          </View>

          <View style={styles.securePaymentSection}>
            <Text style={styles.securePaymentTitle}>SECURE PAYMENT</Text>
            <Text style={styles.securePaymentText}>
              YOUR CREDIT CARD DETAILS ARE SAFE WITH US.{'\n'}
              ALL THE INFORMATION IS PROTECTED USING SECURE SOCKETS{'\n'}
              LAYER (SSL) TECHNOLOGY.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Address Modal */}
      {showAddressModal && (
        <AddEditAddress
          context="checkout"
          customSaveFunction={addPaymentAddress}
          onClose={() => {
            setShowAddressModal(false);
            setIsAddingNewAddress(false);
            setIsEditingAddress(false);
          }}
          address={isEditingAddress && selectedAddress ? {
            firstname: selectedAddress.firstname,
            lastname: selectedAddress.lastname,
            phone: '',
            company: selectedAddress.company || '',
            address_1: selectedAddress.address_1,
            address_2: selectedAddress.address_2 || '',
            city: selectedAddress.city,
            postcode: selectedAddress.postcode || '',
            country_id: selectedAddress.country_id,
            zone_id: selectedAddress.zone_id,
            custom_field: {
              '30': selectedAddress.custom_field['30'] || '',
              '31': selectedAddress.custom_field['31'] || '',
              '32': selectedAddress.custom_field['32'] || '',
              '33': selectedAddress.custom_field['33'] || '',
              '35': selectedAddress.custom_field['35'] || ''
            },
            default: selectedAddress.default,
            address_id: selectedAddress.address_id
          } : undefined}
          onAddressUpdated={async () => {
            // Refresh addresses and automatically select the most recent one
            if (isAuthenticated) {
              await loadAddresses(); // This will get the most recent address
            }
            
            // Always refresh shipping and payment methods after address change
            setTimeout(() => {
              setAddressInCheckoutAndFetchMethods();
            }, 500); // Small delay to ensure address is properly set
            
            setShowAddressModal(false);
            setIsAddingNewAddress(false);
            setIsEditingAddress(false);
          }}
        />
      )}

      {/* Add/Edit Shipping Address Modal */}
      {showShippingAddressModal && (
        <AddEditAddress
          context="checkout"
          customSaveFunction={addShippingAddress}
          onClose={() => {
            setShowShippingAddressModal(false);
            setIsAddingNewAddress(false);
            setIsEditingAddress(false);
          }}
          address={isEditingAddress && shippingAddress ? {
            firstname: shippingAddress.firstname,
            lastname: shippingAddress.lastname,
            phone: shippingAddress.telephone || '',
            company: shippingAddress.company || '',
            address_1: shippingAddress.address_1,
            address_2: shippingAddress.address_2 || '',
            city: shippingAddress.city,
            postcode: shippingAddress.postcode || '',
            country_id: shippingAddress.country_id,
            zone_id: shippingAddress.zone_id,
            custom_field: {
              '30': shippingAddress.custom_field['30'] || '',
              '31': shippingAddress.custom_field['31'] || '',
              '32': shippingAddress.custom_field['32'] || '',
              '33': shippingAddress.custom_field['33'] || '',
              '35': shippingAddress.custom_field['35'] || ''
            },
            default: shippingAddress.default,
            address_id: shippingAddress.address_id
          } : undefined}
          onAddressUpdated={async () => {
            // Refresh shipping and payment methods after shipping address is updated
            setTimeout(() => {
              setAddressInCheckoutAndFetchMethods();
            }, 500); // Small delay to ensure address is properly set
            
            setShowShippingAddressModal(false);
            setIsAddingNewAddress(false);
            setIsEditingAddress(false);
          }}
        />
      )}

      {/* Payment WebView Modal */}
      {showPaymentWebView && paymentUrl && (
        <Modal
          visible={showPaymentWebView}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closePaymentWebView}
        >
          <View style={styles.paymentWebViewContainer}>
            {/* Header with close button */}
            <View style={styles.paymentWebViewHeader}>
              <Text style={styles.paymentWebViewTitle}>Secure Payment</Text>
              <TouchableOpacity
                style={styles.paymentWebViewCloseButton}
                onPress={closePaymentWebView}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {/* WebView */}
            <WebView
              source={{ uri: paymentUrl }}
              style={styles.paymentWebView}
              onNavigationStateChange={handlePaymentNavigation}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.paymentWebViewLoading}>
                  <ActivityIndicator size="large" color="#000" />
                  <Text style={styles.paymentWebViewLoadingText}>Loading secure payment...</Text>
                </View>
              )}
              // Security settings
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={false}
              mediaPlaybackRequiresUserAction={true}
              // Additional security
              onShouldStartLoadWithRequest={(request) => {
                // Only allow navigation to trusted domains
                const url = request.url.toLowerCase();
                const trustedDomains = [
                  'azura.com.kw',
                  'azura.com.kw',                  // Azura main domain
                  'kpaytest.com.kw',               // KNet test environment
                  'knet.com.kw',                   // KNet production environment  
                  'kpg.com.kw',                    // KNet payment gateway
                  'www.kpay.com.kw',               // KPay payment gateway
                  'testsecureacceptance.cybersource.com',  // CyberSource test environment
                  'secureacceptance.cybersource.com',      // CyberSource production environment
                  'tm.cybersource.com',            // CyberSource device fingerprinting
                  'h.online-metrix.net',           // ThreatMetrix device fingerprinting
                  'ps4acs.netcetera-payment.ch',   // Netcetera 3D Secure ACS
                  'geo.cardinalcommerce.com',      // CardinalCommerce geolocation and device fingerprinting
                  'geoissuer.cardinalcommerce.com', // CardinalCommerce issuer device fingerprinting
                  'geostag.cardinalcommerce.com',  // CardinalCommerce device fingerprinting
                  '0merchantacsstag.cardinalcommerce.com', // CardinalCommerce ACS
                  'centinelapistag.cardinalcommerce.com',  // CardinalCommerce Centinel API
                ];
                
                // Special handling for about:blank
                if (url === 'about:blank') {
                  return true;
                }
                
                const isAllowed = trustedDomains.some(domain => url.includes(domain));
                if (!isAllowed) {
                  console.warn('Blocked navigation to untrusted domain:', request.url);
                }
                return isAllowed;
              }}
            />
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.black,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitleRow: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginEnd: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textTransform: 'uppercase',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  addressLocation: {
    fontSize: 14,
    color: '#000',
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 14,
    color: '#000',
    marginBottom: 2,
  },
  editAddressButton: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 18,
    borderTopWidth: 2,
    borderColor: theme.colors.black,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  editAddressText: {
    fontSize: 15,
    color: theme.colors.black,
    marginStart: 4,
  },
  addAddressButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  addAddressContent: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressText: {
    marginStart: 8,
    fontSize: 14,
    color: '#000',
  },
  shipToDifferentRow: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginVertical: 10,
    paddingStart: 3,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 8,
  },
  checkboxFill: {
    width: 12,
    height: 12,
    backgroundColor: '#000',
  },
  shipToDifferentText: {
    fontSize: 14,
    color: '#000',
  },
  totalSection: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    padding: 12,
  },
  totalRow: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  paymentOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    padding: 16,
    marginBottom: 8,
  },
  selectedPayment: {
    borderColor: '#000',
  },
  radioContainer: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  },
  paymentIcon: {
    marginEnd: 12,
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  selectedPaymentText: {
    color: '#000',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#000',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  placeOrderButton: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentMethodsSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentMethodsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  paymentMethodsRow: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'center',
    gap: 8,
  },
  paymentMethodIcon: {
    marginHorizontal: 4,
  },
  securePaymentSection: {
    alignItems: 'center',
  },
  securePaymentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  securePaymentText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000',
  },
  shippingAddressSection: {
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  shippingAddressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  productCard: {
    width: 160,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 8,
    marginEnd: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginBottom: 8,
  },
  productInfo: {
    width: '100%',
    alignItems: 'center',
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  productQuantity: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
    textAlign: 'center',
  },
  productsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  productSubheading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyProductsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: 14,
    color: '#666',
  },
  methodsLoader: {
    marginTop: 8,
    marginBottom: 8,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodSubtext: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  methodsList: {
    padding: 8,
  },
  methodOption: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedMethodOption: {
    borderColor: '#000',
    backgroundColor: '#f8f8f8',
  },
  methodRadio: {
    marginEnd: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  methodCost: {
    fontSize: 12,
    color: '#666',
  },
  methodTerms: {
    fontSize: 12,
    color: '#666',
  },
  methodsLoadingContainer: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    padding: 16,
    justifyContent: 'center',
  },
  methodsLoadingText: {
    fontSize: 14,
    color: '#666',
    marginStart: 8,
  },
  noMethodsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noMethodsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  validationError: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 8,
    marginStart: 16,
    fontWeight: '500',
  },
  // Payment WebView styles
  paymentWebViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  paymentWebViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  paymentWebViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  paymentWebViewCloseButton: {
    padding: 8,
  },
  paymentWebView: {
    flex: 1,
  },
  paymentWebViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  paymentWebViewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  // Apple Pay styles
  applePayButton: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#fff',
  },
  selectedApplePayButton: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  applePayIcon: {
    marginEnd: 12,
  },
  selectedApplePayText: {
    color: '#ffffff',
  },
  applePayMethodOption: {
    backgroundColor: '#f2f2f2',
    borderColor: '#e0e0e0',
  },
  selectedApplePayMethodOption: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  applePayMethodContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  applePayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  applePayBadgeSelected: {
    backgroundColor: '#000000',
  },
  applePayBadgeUnselected: {
    backgroundColor: '#000000',
  },
  appleLogoIcon: {
    marginRight: 2,
  },
  applePayText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  applePayTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  applePayTextUnselected: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 