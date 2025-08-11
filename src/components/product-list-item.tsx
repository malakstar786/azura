import { useTranslation } from '@/i18n/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@store/cart-store';
import { theme } from '@theme';
import { getAbsolutePosition, getFlexDirection, getTextAlign } from '@utils/rtlStyles';
import { Link, router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import type { Product } from '../types/api';

export const ProductListItem = ({
  product,
}: {
  product: Product;
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { addToCart, items, incrementQuantity, decrementQuantity } = useCartStore();
  const cartItem = items.find(item => item.product_id === product.product_id);

  const handleAddToCart = () => {
    addToCart(product.product_id, 1);
    toast.show(t('product.addedToCart'), {
      type: 'success',
      placement: 'top',
      duration: 1500,
    });
  };

  const handleBuyNow = () => {
    if (!cartItem) {
      handleAddToCart();
    }
    router.push('/checkout');
  };

  const handleIncrement = () => {
    if (cartItem) {
      incrementQuantity(product.product_id);
      toast.show(t('product.quantity'), {
        type: 'success',
        placement: 'top',
        duration: 1500,
      });
    }
  };

  const handleDecrement = () => {
    if (cartItem) {
      const currentQuantity = typeof cartItem.quantity === 'string' 
        ? parseInt(cartItem.quantity, 10) 
        : cartItem.quantity;
        
      if (currentQuantity > 1) {
        decrementQuantity(product.product_id);
        toast.show(t('product.quantity'), {
          type: 'success',
          placement: 'top',
          duration: 1500,
        });
      }
    }
  };

  return (
    <View style={styles.item}>
      <Link asChild href={`/product/${product.product_id}`}>
        <Pressable style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image.startsWith('http') 
              ? product.image 
              : `https://azura.com.kw/image/${product.image}`
            }} 
            style={styles.image} 
          />
          {product.special && (
            <View style={styles.specialBadge}>
              <Ionicons name="pricetag" size={12} color="white" />
              <Text style={styles.specialBadgeText}>{t('product.newArrival')}</Text>
            </View>
          )}
        </Pressable>
      </Link>

      <View style={styles.details}>
        <Link asChild href={`/product/${product.product_id}`}>
          <Pressable>
            <Text style={styles.title}>{product.name}</Text>
          </Pressable>
        </Link>
        <Text style={styles.price}>{product.price}</Text>

        <View style={styles.buttonContainer}>
          {cartItem ? (
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={handleDecrement}
                style={[styles.quantityButton, styles.minusButton]}
                disabled={cartItem.quantity === 1}
              >
                <Ionicons 
                  name="remove" 
                  size={20} 
                  color={cartItem.quantity === 1 ? theme.colors.lightGray : theme.colors.black} 
                />
              </TouchableOpacity>
              <View style={styles.quantityTextContainer}>
                <Text style={styles.quantityText}>{cartItem.quantity}</Text>
              </View>
              <TouchableOpacity 
                onPress={handleIncrement} 
                style={[styles.quantityButton, styles.plusButton]}
              >
                <Ionicons name="add" size={20} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleAddToCart} style={styles.addToCartButton}>
              <Ionicons name="cart-outline" size={16} color={theme.colors.white} />
            <Text style={styles.buttonText}>{t('product.addToCart')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleBuyNow} style={styles.buyNowButton}>
            <Ionicons name="flash-outline" size={16} color={theme.colors.white} />
          <Text style={styles.buttonText}>{t('product.buyNow')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flex: 1,
    backgroundColor: theme.colors.background,
    margin: theme.spacing.sm,
    maxWidth: '47%',
  },
  imageContainer: {
    aspectRatio: 1,
    width: '100%',
    backgroundColor: theme.colors.veryLightGray,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  specialBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    ...getAbsolutePosition('left', theme.spacing.sm),
    backgroundColor: theme.colors.red,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  specialBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold as any,
  },
  details: {
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.textPrimary,
    textAlign: getTextAlign(),
  },
  price: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.textPrimary,
    textAlign: getTextAlign(),
  },
  buttonContainer: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  addToCartButton: {
    backgroundColor: theme.colors.buttonPrimary,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buyNowButton: {
    backgroundColor: theme.colors.red,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
  },
  quantityControls: {
    flexDirection: getFlexDirection('row'),
    height: 36,
  },
  quantityButton: {
    width: 36,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  plusButton: {
    backgroundColor: theme.colors.buttonPrimary,
  },
  minusButton: {
    backgroundColor: theme.colors.buttonSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
  },
  quantityTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderColor,
  },
  quantityText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.textPrimary,
  },
});