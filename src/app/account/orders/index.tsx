import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/auth-store';
import { useLanguageStore } from '@store/language-store';
import { API_BASE_URL, API_ENDPOINTS, getCurrentOCSESSID } from '@utils/api-config';
import { appendLanguageParam } from '@utils/api-language';
import { getFlexDirection } from '@utils/rtlStyles';
import { useTranslation } from '@utils/translations';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Order {
  order_id: string;
  firstname: string;
  lastname: string;
  status: string;
  date_added: string;
  total: string;
  currency_code: string;
  currency_value: string;
}

interface OrderResponse {
  success: number;
  error: string[];
  data: Order[];
}

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { currentLanguage } = useLanguageStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login to view your orders');
      router.back();
      return;
    }

    try {
      const ocsessid = await getCurrentOCSESSID();
      if (!ocsessid) {
        Alert.alert('Error', 'Session expired. Please login again.');
        router.back();
        return;
      }

      let url = `${API_BASE_URL}${API_ENDPOINTS.orderHistory}`
      url = appendLanguageParam(url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `OCSESSID=${ocsessid}`,
        },
      });

      const data: OrderResponse = await response.json();

      if (data.success === 1) {
        setOrders(data.data || []);
        setFilteredOrders(data.data || []);
      } else {
        Alert.alert('Error', 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Re-fetch when language changes to localize server content
  }, [currentLanguage]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOrders(orders);
    } else {
      // Search by order ID using regex for flexible matching
      const regex = new RegExp(searchQuery.replace(/\s+/g, ''), 'i');
      const filtered = orders.filter(order => 
        regex.test(order.order_id.replace(/\s+/g, ''))
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return theme.colors.pending;
      case 'processing':
        return theme.colors.processing;
      case 'shipped':
        return theme.colors.shipped;
      case 'delivered':
        return theme.colors.delivered;
      case 'cancelled':
      case 'failed':
        return theme.colors.failed;
      default:
        return theme.colors.statusDefault;
    }
  };

  const getTranslatedStatus = (status: string) => {
    // For now, return the original status since we don't have predefined translation keys for all status values
    // This can be expanded later with specific status translations
    return status;
  };

  const renderOrderItem = (order: Order) => (
    <View key={order.order_id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>{t('orders.orderId')}</Text>
          <Text style={styles.orderIdValue}>#{order.order_id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getTranslatedStatus(order.status)}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>{t('orders.customer')}</Text>
          <Text style={styles.orderValue}>{order.firstname} {order.lastname}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>{t('orders.date')}</Text>
          <Text style={styles.orderValue}>{formatDate(order.date_added)}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>{t('orders.total')}</Text>
          <Text style={styles.orderTotal}>{order.total} {order.currency_code}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: t('orders.title'),
            headerBackTitle: '',
            headerTintColor: theme.colors.black,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.black} />
          <Text style={styles.loadingText}>{t('orders.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('orders.title'),
          headerBackTitle: '',
          headerTintColor: theme.colors.black,
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.mediumGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('orders.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.mediumGray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.mediumGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.mediumGray} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('orders.noOrdersFound') : t('orders.noOrders')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? t('orders.noOrdersFoundDescription').replace('{0}', searchQuery)
                : t('orders.noOrdersDescription')
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>{t('orders.clearSearch')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            <Text style={styles.ordersCount}>
              {t('orders.ordersCount')
                .replace('{0}', filteredOrders.length.toString())
                .replace('{1}', filteredOrders.length === 1 ? t('orders.order') : t('orders.orders'))
              }
            </Text>
            {filteredOrders.map(renderOrderItem)}
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.lightGray,
  },
  searchInputContainer: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
  },
  searchIcon: {
    marginEnd: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
  },
  clearButton: {
    marginStart: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  ordersContainer: {
    padding: theme.spacing.md,
  },
  ordersCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.md,
    fontWeight: theme.typography.weights.medium as any,
  },
  orderCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    ...theme.shadows.md,
  },
  orderHeader: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    marginBottom: 2,
  },
  orderIdValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.white,
  },
  orderDetails: {
    gap: theme.spacing.sm,
  },
  orderRow: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.mediumGray,
    fontWeight: theme.typography.weights.medium as any,
  },
  orderValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    fontWeight: theme.typography.weights.medium as any,
  },
  orderTotal: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.black,
    fontWeight: theme.typography.weights.bold as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  clearSearchButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.black,
    borderRadius: theme.borderRadius.sm,
  },
  clearSearchText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
  },
}); 