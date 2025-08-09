import { useTranslation } from '@/i18n/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/auth-store';
import { useLanguageStore } from '@store/language-store';
import { theme } from '@theme';
import { getCurrentOCSESSID } from '@utils/api-config';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setError(t('cart.loginRequired'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const sessionId = getCurrentOCSESSID();
      const response = await fetch(
        'https://new.azurakwt.com/index.php?route=extension/mstore/order|all',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie': `OCSESSID=${sessionId}`,
            'User-Agent': 'Azura Mobile App',
          },
        }
      );

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please try again later.');
      }

      const data = await response.json();
      
      if (data.success === 1) {
        const ordersList = data.data || [];
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      } else {
        throw new Error(data.error?.join(', ') || t('error.serverError'));
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || t('error.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const filtered = orders.filter(order => regex.test(order.order_id));
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t('orders.title'), headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('orders.title')}</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loginRequiredText}>{t('cart.loginRequired')}</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('orders.title'), headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={theme.colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orders.title')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { flexDirection: getFlexDirection('row') }]}>
          <Ionicons name="search" size={20} color={theme.colors.mediumGray} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { textAlign: getTextAlign() }]}
            placeholder={t('orders.searchPlaceholder')}
            placeholderTextColor={theme.colors.mediumGray}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.mediumGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.black} />
          <Text style={styles.loadingText}>{t('orders.loading')}</Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && filteredOrders.length === 0 && searchQuery.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color={theme.colors.mediumGray} />
          <Text style={styles.emptyTitle}>{t('orders.noOrders')}</Text>
          <Text style={styles.emptySubtitle}>To see your orders</Text>
          <TouchableOpacity 
            style={styles.startShoppingButton} 
            onPress={() => router.push('/(shop)')}
          >
            <Text style={styles.startShoppingButtonText}>{t('empty.startShopping')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && filteredOrders.length === 0 && searchQuery.length > 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color={theme.colors.mediumGray} />
          <Text style={styles.emptyTitle}>{t('orders.noOrdersFound')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('orders.noOrdersFoundDescription').replace('{0}', searchQuery)}
          </Text>
          <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
            <Text style={styles.clearSearchButtonText}>{t('orders.clearSearch')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && filteredOrders.length > 0 && (
        <ScrollView
          style={styles.ordersList}
          contentContainerStyle={styles.ordersListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {searchQuery.length > 0 && (
            <Text style={styles.resultsCount}>
              {t('orders.ordersCount')
                .replace('{0}', filteredOrders.length.toString())
                .replace('{1}', filteredOrders.length === 1 ? t('orders.order') : t('orders.orders'))}
            </Text>
          )}
          
          {filteredOrders.map((order) => (
            <View key={order.order_id} style={styles.orderCard}>
              <View style={styles.productSection}>
                <View style={styles.productInfo}>
                          <Text style={styles.sku}>{t('order.sku')}00322100</Text>
        <Text style={styles.productName}>AZURA NAIL HARDENER</Text>
        <Text style={styles.quantity}>{t('order.qty')} 1</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('order.orderId')}</Text>
                  <Text style={styles.detailValue}>#{order.order_id}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('order.date')}</Text>
                  <Text style={styles.detailValue}>
                    {new Date(order.date_added).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('order.email')}</Text>
                  <Text style={styles.detailValue}>
                    {user?.email?.toUpperCase() || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('orders.status')}:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(order.status) }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('orders.total')}:</Text>
                  <Text style={styles.detailValue}>
                    {order.total} {order.currency_code}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightBorder,
  },
  backButton: {
    marginEnd: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    backgroundColor: theme.colors.veryLightGray,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  searchIcon: {
    marginEnd: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    paddingVertical: theme.spacing.sm,
  },
  clearButton: {
    marginStart: theme.spacing.sm,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.mediumGray,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  clearSearchButton: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  clearSearchButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loginRequiredText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.black,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  resultsCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
    ...theme.shadows.sm,
  },
  orderHeader: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  orderId: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  orderDetail: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginTop: theme.spacing.sm,
  },
  productSection: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginBottom: 20,
  },
  productInfo: {
    flex: 1,
  },
  sku: {
    fontSize: 12,
    color: theme.colors.mediumGray,
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderColor,
    marginBottom: 20,
  },
  orderDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.textPrimary,
    flex: 2,
    textAlign: getTextAlign() === 'left' ? 'right' : 'left',
  },
  startShoppingButton: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.lg,
  },
  startShoppingButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
}); 