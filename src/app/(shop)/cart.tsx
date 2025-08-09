import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/auth-store';
import { useCartStore } from '@store/cart-store';
import { useLanguageStore } from '@store/language-store';
import { CartItem } from '@utils/api-config';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Import the empty cart icon
const emptyCartIcon = require('@assets/empty_cart_icon.png');

// Helper function to construct proper image URL
const getImageUrl = (item: CartItem): string => {
  const imageSource = item.thumb || item.image;
  
  if (!imageSource) {
    return 'https://via.placeholder.com/100x100/EFEFEF/5D5D5D?text=No+Image';
  }
  
  // If it's already a full URL, return as is
  if (imageSource.startsWith('http')) {
    return imageSource;
  }
  
  // If it's a relative path, construct the full URL
  // Handle different possible formats from the API
  if (imageSource.startsWith('cache/') || imageSource.startsWith('catalog/')) {
    return `https://new.azurakwt.com/image/${imageSource}`;
  }
  
  // For simple filenames, try the cache path first
  return `https://new.azurakwt.com/image/cache/catalog/productsimage/${imageSource}`;
};

const { width } = Dimensions.get('window');

type DeleteModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: CartItem;
};

const DeleteConfirmationModal = ({ visible, onClose, onConfirm, item }: DeleteModalProps) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={styles.deleteModalContent}>
          <Text style={styles.deleteModalTitle}>
            {t('cart.removeFromCart')}
          </Text>
          
          <View style={styles.deleteModalItem}>
            <Image 
              source={{ uri: getImageUrl(item) }} 
              style={styles.deleteModalImage} 
              resizeMode="contain"
            />
            <View style={styles.deleteModalItemDetails}>
              <Text style={styles.deleteModalSku}>
                SKU:{item.sku || item.product_id}
              </Text>
              <Text style={styles.deleteModalItemTitle}>
                {item.name.toUpperCase()}
              </Text>
              <Text style={styles.deleteModalQuantity}>
                QTY: {item.quantity}
              </Text>
              <Text style={styles.deleteModalPrice}>
                {item.total || (parseFloat(item.price.replace(/[^\d.]/g, '')) * Number(item.quantity)).toFixed(3)} KD
              </Text>
            </View>
          </View>

          <View style={styles.deleteModalButtons}>
            <TouchableOpacity 
              style={[styles.deleteModalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.deleteModalButton, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{t('cart.yesRemove')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CartItemRow = ({
  item,
  onRemove,
  onUpdateQuantity,
  onIncrement,
  onDecrement,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onIncrement: (id: string) => Promise<void>;
  onDecrement: (id: string) => Promise<void>;
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const quantities = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleIncrement = async () => {
    console.log('Increment button pressed for item:', item.cart_id, 'stock:', item.stock, 'maximum:', item.maximum);
    
    // Only check if we're updating to prevent double-clicks
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onIncrement(item.cart_id);
    } catch (error) {
      console.error('Error incrementing quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async () => {
    console.log('Decrement button pressed for item:', item.cart_id, 'quantity:', item.quantity, 'minimum:', item.minimum);
    
    // Only check if we're updating to prevent double-clicks
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onDecrement(item.cart_id);
    } catch (error) {
      console.error('Error decrementing quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantitySelect = async (qty: number) => {
    if (!item.stock) return;
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.cart_id, qty);
    } finally {
      setIsUpdating(false);
      setShowQuantityModal(false);
    }
  };

  return (
    <View style={styles.cartItemRow}>
      <Image 
        source={{ uri: getImageUrl(item) }} 
        style={styles.itemImage} 
        resizeMode="contain"
      />
      <View style={[styles.itemDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.itemSku, { textAlign: getTextAlign() }]}>
          SKU: {item.sku || item.product_id}
        </Text>
        <Text style={[styles.itemTitle, { textAlign: getTextAlign() }]}>
          {item.name.toUpperCase()}
        </Text>
        <View style={[styles.quantityContainer, { flexDirection: getFlexDirection('row') }]}>
          <TouchableOpacity 
            onPress={handleDecrement}
            style={[styles.quantityButton, isUpdating && styles.disabledButton]}
            disabled={isUpdating}
          >
            <Text style={[styles.quantityButtonText, isUpdating && styles.disabledText]}>-</Text>
          </TouchableOpacity>
          <View style={styles.quantityDisplay}>
            <Text style={[styles.itemQuantity, isUpdating && styles.disabledText]}>
              QTY: {item.quantity}
            </Text>
            <TouchableOpacity 
              style={[styles.quantityDropdown, isUpdating && styles.disabledButton]}
              onPress={() => !isUpdating && setShowQuantityModal(true)}
              disabled={isUpdating || !item.stock}
            >
              <Ionicons 
                name="chevron-down" 
                size={14} 
                color={isUpdating ? theme.colors.mediumGray : theme.colors.black} 
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            onPress={handleIncrement}
            style={[styles.quantityButton, isUpdating && styles.disabledButton]}
            disabled={isUpdating}
          >
            <Text style={[styles.quantityButtonText, isUpdating && styles.disabledText]}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.itemPrice, { textAlign: getTextAlign() }]}>
          {item.total || (parseFloat(item.price) * Number(item.quantity)).toFixed(3)} KD
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => setShowDeleteModal(true)} 
        style={styles.removeButton}
      >
        <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
      </TouchableOpacity>

      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onRemove(item.cart_id);
          setShowDeleteModal(false);
        }}
        item={item}
      />

      <Modal
        visible={showQuantityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuantityModal(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              {quantities.map((qty) => (
                <TouchableOpacity
                  key={qty}
                  style={[
                    styles.quantityOption,
                    qty === item.quantity && styles.selectedQuantity,
                  ]}
                  onPress={() => handleQuantitySelect(qty)}
                >
                  <Text style={[
                    styles.quantityOptionText,
                    qty === item.quantity && styles.selectedQuantityText,
                  ]}>
                    {qty}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function CartScreen() {
  const { t } = useTranslation();
  const { isRTL, currentLanguage } = useLanguageStore();
  const { items, removeItem, updateQuantity, incrementQuantity, decrementQuantity, getTotalPrice, clearCart, getCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Refresh cart when language changes to get localized product names
  useEffect(() => {
    getCart();
  }, [currentLanguage, getCart]);

  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    await updateQuantity(productId, quantity);
  };

  const handleEmptyCart = () => {
    Alert.alert(
      t('cart.emptyCartConfirm'),
      t('cart.emptyCartMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('cart.emptyCartConfirmButton'), 
          style: 'destructive',
          onPress: () => clearCart()
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('cart.loginRequired'),
        t('cart.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.signIn'), onPress: () => router.push('/auth') },
        ]
      );
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyHeaderContainer}>
          <Text style={[styles.emptyTitle, { textAlign: getTextAlign() }]}>
            {t('nav.cart')}
          </Text>
        </View>
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
        </View>
        <View style={styles.emptyContainer}>
          <Image 
            source={emptyCartIcon} 
            style={[
              styles.emptyCartIcon,
              isRTL ? { transform: [{ scaleX: -1 }] } : null
            ]} 
          />
          <Text style={styles.emptyCartTitle}>
{t('cart.empty')}
          </Text>
          <Link href="/(shop)" asChild>
            <TouchableOpacity style={styles.shopButton}>
              <Text style={styles.shopButtonText}>{t('cart.startShopping')}</Text>
              <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={16} color={theme.colors.white} style={styles.shopButtonIcon} />
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { textAlign: getTextAlign() }]}>
          {t('nav.cart')}
        </Text>
        <TouchableOpacity 
          style={styles.emptyCartButton}
          onPress={handleEmptyCart}
        >
          <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          <Text style={styles.emptyCartButtonText}>{t('cart.emptyCart')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
      </View>
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.cart_id}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onRemove={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onIncrement={incrementQuantity}
            onDecrement={decrementQuantity}
          />
        )}
        style={styles.cartList}
        contentContainerStyle={styles.cartListContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>{t('cart.total')} : {getTotalPrice().toFixed(3)} KD</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                      <Text style={styles.checkoutButtonText}>{t('cart.checkout')}</Text>
          <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Route-level ErrorBoundary for this high-risk route
export function ErrorBoundary({ error }: { error: Error }) {
  // Lazy import to avoid circular deps during SSR
  const Fallback = require('@components/RouteErrorFallback').default;
  return <Fallback error={error} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  headerContainer: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    marginTop: 20,
    paddingStart: 0,
    color: theme.colors.black,
    flex: 1,
  },
  emptyHeaderContainer: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    flex: 1,
    paddingStart: 20,
  },
  dividerContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 2,
    backgroundColor: theme.colors.black,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.xxl,
  },
  emptyCartIcon: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.xl,
  },
  emptyCartTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.mediumGray,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  shopButton: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
  },
  shopButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    marginEnd: theme.spacing.sm,
  },
  shopButtonIcon: {
    marginStart: theme.spacing.xs,
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    paddingBottom: theme.spacing.lg,
  },
  emptyCartButton: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.white,
  },
  emptyCartButtonText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
    marginStart: theme.spacing.xs,
    fontWeight: theme.typography.weights.medium as any,
  },
  cartItemRow: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightBorder,
    backgroundColor: theme.colors.white,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.sm,
    marginEnd: theme.spacing.md,
    backgroundColor: theme.colors.veryLightGray,
  },
  itemDetails: {
    flex: 1,
    alignItems: 'flex-start',
  },
  itemSku: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    marginBottom: 4,
    fontWeight: theme.typography.weights.medium as any,
  },
  itemTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  quantityContainer: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 2,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  quantityButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
  },
  quantityDisplay: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  quantityDropdown: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginStart: theme.spacing.xs,
  },
  itemQuantity: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.mediumGray,
  },
  itemPrice: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.mediumGray,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.black,
    backgroundColor: theme.colors.white,
  },
  totalContainer: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.black,
    textAlign: getTextAlign() === 'left' ? 'right' : 'left',
  },
  totalPrice: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
  },
  checkoutButton: {
    backgroundColor: theme.colors.black,
    paddingVertical: theme.spacing.lg,
    borderRadius: 0,
    alignItems: 'center',
    flexDirection: getFlexDirection('row'),
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    letterSpacing: 1,
    marginEnd: theme.spacing.sm,
  },
  // Modal styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxHeight: '45%',
  },
  deleteModalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  deleteModalItem: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  deleteModalImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    marginEnd: theme.spacing.lg,
    backgroundColor: theme.colors.veryLightGray,
  },
  deleteModalItemDetails: {
    flex: 1,
    alignItems: 'flex-start',
  },
  deleteModalSku: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    marginBottom: 4,
    fontWeight: theme.typography.weights.medium as any,
  },
  deleteModalItemTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: 8,
    lineHeight: 22,
  },
  deleteModalQuantity: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
    marginBottom: 4,
    fontWeight: theme.typography.weights.medium as any,
  },
  deleteModalPrice: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
  },
  deleteModalButtons: {
    flexDirection: getFlexDirection('row'),
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    borderRadius: 0,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.black,
  },
  confirmButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 0.5,
    borderColor: theme.colors.black,
  },
  cancelButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold as any,
    letterSpacing: 0.5,
  },
  confirmButtonText: {
    color: theme.colors.black,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold as any,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    maxHeight: 300,
    minWidth: 200,
  },
  quantityOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightBorder,
  },
  selectedQuantity: {
    backgroundColor: theme.colors.lightGray,
  },
  quantityOptionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    textAlign: 'center',
  },
  selectedQuantityText: {
    fontWeight: theme.typography.weights.bold as any,
  },
}); 