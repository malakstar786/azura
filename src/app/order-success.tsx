import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@theme';
import { getTextAlign, getFlexDirection } from '@utils/rtlStyles';

interface OrderData {
  order_id: string;
  store_name: string;
  firstname: string;
  lastname: string;
  email: string;
  date_added: string;
  total: string;
  payment_method: string;
  line_items?: any[];
}

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    // Get order data from navigation params or local storage
    const orderDataString = params.orderData as string;
    if (orderDataString) {
      try {
        const data = JSON.parse(orderDataString);
        setOrderData(data);
      } catch (e) {
        console.error('Error parsing order data:', e);
      }
    }
  }, [params.orderData]); // Only depend on the specific param we need

  const handleContinueShopping = () => {
    // Navigate to home and reset navigation stack
    router.replace('/(shop)');
  };


  const formatOrderId = (orderId: string) => {
    return `#${orderId}`;
  };

  // Extract product data from line_items in the API response
  const getProductData = () => {
    if (orderData?.line_items && orderData.line_items.length > 0) {
      const lineItem = orderData.line_items[0];
      return {
        sku: lineItem.product_data?.sku || lineItem.model || 'N/A',
        name: lineItem.name || lineItem.product_data?.name || 'Product information not available',
        quantity: lineItem.quantity || 1,
      };
    }
    return {
      sku: 'N/A',
      name: 'Product information not available',
      quantity: 1,
    };
  };

  const productData = getProductData();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.checkIcon}>
          <Ionicons name="checkmark" size={32} color={theme.colors.white} />
        </View>
        
        <Text style={styles.thankYouTitle}>THANK YOU</Text>
        <Text style={styles.successMessage}>
          YOUR ORDER HAS BEEN PLACED SUCCESSFULLY
        </Text>
      </View>

      <View style={styles.orderCard}>
        <View style={styles.productSection}>
          <View style={styles.productInfo}>
            <Text style={styles.sku}>SKU: {productData.sku}</Text>
            <Text style={styles.productName}>{productData.name}</Text>
            <Text style={styles.quantity}>QTY: {productData.quantity}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ORDER ID</Text>
            <Text style={styles.detailValue}>
              {orderData?.order_id ? formatOrderId(orderData.order_id) : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>EMAIL</Text>
            <Text style={styles.detailValue}>
              {orderData?.email ? orderData.email.toUpperCase() : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PAYMENT METHOD</Text>
            <Text style={styles.detailValue}>
              {orderData?.payment_method ? orderData.payment_method.toUpperCase() : 'K-NET'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinueShopping}>
        <Text style={styles.continueButtonText}>CONTINUE SHOPPING</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  checkIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.success || '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  thankYouTitle: {
    fontSize: 28,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  successMessage: {
    fontSize: 14,
    color: theme.colors.success || '#4CAF50',
    fontWeight: theme.typography.weights.medium as any,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.borderColor,
    padding: 20,
    marginBottom: 40,
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
  continueButton: {
    backgroundColor: theme.colors.black,
    paddingVertical: 16,
    borderRadius: 0,
    alignItems: 'center',
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.semibold as any,
    letterSpacing: 1,
  },
}); 