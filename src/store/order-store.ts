import { create } from 'zustand';
import { Alert } from 'react-native';
import { makeApiCall, API_ENDPOINTS } from '@utils/api-config';

export interface Order {
  order_id: string;
  firstname: string;
  lastname: string;
  status: string;
  date_added: string;
  total: string;
  currency_code: string;
  currency_value: string;
}

interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('🔍 ORDER STORE: Fetching order history...');

      // Check if user is authenticated first
      const { useAuthStore } = await import('./auth-store');
      const { isAuthenticated, user } = useAuthStore.getState();
      
      if (!isAuthenticated || !user) {
        console.warn('❌ ORDER STORE: User not authenticated, cannot fetch orders');
        set({ 
          orders: [], 
          isLoading: false,
          error: 'Please login to view your orders'
        });
        return;
      }

      console.log('👤 ORDER STORE: Fetching orders for user:', {
        customer_id: user.customer_id,
        email: user.email,
        name: `${user.firstname} ${user.lastname}`
      });

      const response = await makeApiCall(API_ENDPOINTS.orderHistory, {
        method: 'GET'
      });

      console.log('📦 ORDER STORE: Raw order history response:', JSON.stringify(response, null, 2));

      if (response.success === 1 && Array.isArray(response.data)) {
        console.log(`📊 ORDER STORE: Received ${response.data.length} orders from API`);
        
        // Filter orders to only show the current user's orders as a safety measure
        // This handles cases where the API might return other users' orders
        const currentUserOrders = response.data.filter((order: Order) => {
          const orderName = `${order.firstname?.toLowerCase()} ${order.lastname?.toLowerCase()}`.trim();
          const userName = `${user.firstname?.toLowerCase()} ${user.lastname?.toLowerCase()}`.trim();
          
          return orderName === userName;
        });

        console.log(`🎯 ORDER STORE: Filtered to ${currentUserOrders.length} orders for current user`);
        
        // Process orders to ensure all required fields are present
        const enhancedOrders = currentUserOrders.map((order: Order) => {
          return {
            ...order,
            // Ensure required fields have default values if missing
            status: order.status || 'Processing',
            currency_code: order.currency_code || 'KWD',
            currency_value: order.currency_value || '1.000'
          };
        });

        console.log('✅ ORDER STORE: Final processed orders:', enhancedOrders);

        set({ 
          orders: enhancedOrders, 
          isLoading: false 
        });
      } else {
        console.warn('❌ ORDER STORE: No orders received or invalid format:', response);
        set({ 
          orders: [], 
          isLoading: false,
          error: 'No orders found'
        });
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      const errorMessage = error.message || 'Failed to load orders';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      
      if (!error.handled) {
        Alert.alert('Error', errorMessage);
      }
    }
  }
})); 