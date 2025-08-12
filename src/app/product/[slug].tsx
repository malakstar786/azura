import { useTranslation } from '@/i18n/useTranslation';
import { useAuthStore } from '@store/auth-store';
import { useCartStore } from '@store/cart-store';
import { useLanguageStore } from '@store/language-store';
import { publicApi } from '@utils/api-service';
import { getFlexDirection } from '@utils/rtlStyles';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

const { width } = Dimensions.get('window');

interface Product {
  product_id: string;
  name: string;
  description: string;
  meta_title: string;
  price: string;
  image: string;
  images: string[];
  category_id: string;
  category_name: string;
  stock_status: string;
  sku: string;
  quantity: number;
  date_added: string;
}


const ProductDetails = () => {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const toast = useToast();
  const { t } = useTranslation();
  const { currentLanguage, lastUpdated } = useLanguageStore();
  const { isAuthenticated, validateSession } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { items, addToCart, incrementQuantity, decrementQuantity } = useCartStore();
  const cartItem = items.find(item => item.product_id === slug);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await publicApi.getProductDetail(slug);
        console.log('🔍 [PRODUCT] Product detail response:', response);
        
        if (response.success === 1 && response.data) {
          console.log('🔍 [PRODUCT] ========== PRODUCT DETAIL UI PROCESSING ==========');
          console.log('🔍 [PRODUCT] Product ID:', response.data.product_id);
          console.log('🔍 [PRODUCT] Product Name:', response.data.name);
          console.log('🔍 [PRODUCT] Stock Status Raw:', `"${response.data.stock_status}"`);
          console.log('🔍 [PRODUCT] Stock Status Type:', typeof response.data.stock_status);
          console.log('🔍 [PRODUCT] Quantity:', response.data.quantity);
          console.log('🔍 [PRODUCT] Is Quantity > 0?:', Number(response.data.quantity) > 0);
          console.log('🔍 [PRODUCT] Will show as In Stock?:', Number(response.data.quantity) > 0);
          console.log('🔍 [PRODUCT] Will show as Out of Stock?:', Number(response.data.quantity) <= 0);
          console.log('🔍 [PRODUCT] Buttons will be disabled?:', Number(response.data.quantity) <= 0);
          console.log('🔍 [PRODUCT] Cart item exists?:', !!cartItem);
          console.log('🔍 [PRODUCT] ========== END PRODUCT DETAIL UI PROCESSING ==========');
          
          setProduct(response.data);
          
          // If this product is in the cart, set the initial quantity
          if (cartItem) {
            setQuantity(typeof cartItem.quantity === 'string' ? parseInt(cartItem.quantity, 10) : cartItem.quantity);
          }
        } else {
          console.log('🔍 [PRODUCT] ❌ Product detail API call failed:', response.error);
          throw new Error(Array.isArray(response.error) ? response.error[0] : 'Failed to load product');
        }
      } catch (err: any) {
        console.error('Error fetching product details:', err);
        setError(err.message || 'Could not load product details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug, cartItem, currentLanguage, lastUpdated]);

  const handleIncrement = () => {
    if (quantity < 10) {
      setQuantity(prev => prev + 1);
      if (cartItem) {
        incrementQuantity(product?.product_id || '');
      }
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
      if (cartItem) {
        decrementQuantity(product?.product_id || '');
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (Number(product.quantity) <= 0) {
      toast.show('This product is currently out of stock.', {
        type: 'error',
        placement: 'bottom',
      });
      return;
    }

    if (quantity > Number(product.quantity)) {
      toast.show(`Only ${product.quantity} items available.`, {
        type: 'error',
        placement: 'bottom',
      });
      return;
    }

    addToCart(product.product_id, quantity);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    // Check if user is authenticated and validate session
    if (!isAuthenticated) {
      // Persist a pending checkout item for post-auth merge and go to auth
      try {
        const pending = [{ product_id: product.product_id, quantity }];
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('@azura.pending_cart', JSON.stringify(pending));
      } catch {}
      router.push('/auth?redirect=checkout');
      return;
    }

    // First add product to cart when authenticated
    handleAddToCart();
    
    // If user appears authenticated, validate the session with server
    const isSessionValid = await validateSession();
    if (!isSessionValid) {
      // Session is invalid, redirect to auth for checkout
      router.push('/auth?redirect=checkout');
      return;
    }
    
    // If authenticated and session is valid, proceed to checkout
    router.push('/checkout');
  };

  const isInStock = Number(product?.quantity || 0) > 0;
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isNewArrival = () => {
    const addedDate = new Date(product.date_added || '');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return isInStock && addedDate >= thirtyDaysAgo;
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      <Stack.Screen 
        options={{ 
          headerTitle: '',
          headerShadowVisible: false,
        }} 
      />

      {isNewArrival() && (
        <View style={styles.newArrivalContainer}>
          <Text style={styles.newArrivalText}>NEW ARRIVAL</Text>
        </View>
      )}

      <Image 
        source={{ uri: `https://azura.com.kw/image/${product.image}` }} 
        style={styles.productImage} 
      />

      <View style={styles.content}>
        <Text style={styles.categoryAndSku}>
          {product.category_name} | SKU: {product.sku}
        </Text>

        <Text style={styles.title}>{product.name}</Text>

        {product.description ? (
          <>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                {(() => {
                  const plain = product.description.replace(/<\/?[^>]+(>|$)/g, "");
                  if (isDescriptionExpanded) return plain;
                  const preview = plain.slice(0, 100);
                  return plain.length > 100 ? `${preview}…` : preview;
                })()}
              </Text>
            </View>
            {product.description.replace(/<\/?[^>]+(>|$)/g, "").length > 100 && (
              <TouchableOpacity onPress={() => setIsDescriptionExpanded(v => !v)}>
                <Text style={styles.readMore}>{isDescriptionExpanded ? 'READ LESS' : 'READ MORE'}</Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}

        <Text style={styles.price}>{product.price}</Text>
        <Text style={styles.stockStatus}>
          {isInStock ? "In Stock" : "Out of Stock"}
        </Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={[styles.quantityButton, styles.minusButton]} 
            onPress={handleDecrement}
            disabled={!isInStock}
          >
            <Text style={[styles.quantityButtonText, styles.minusButtonText]}>−</Text>
          </TouchableOpacity>
          <View style={styles.quantityTextContainer}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.quantityButton, styles.plusButton]} 
            onPress={handleIncrement}
            disabled={!isInStock}
          >
            <Text style={[styles.quantityButtonText, styles.plusButtonText]}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.addToCartButton, !isInStock && styles.disabledButton]} 
            onPress={handleAddToCart}
            disabled={!isInStock}
          >
            <Text style={styles.buttonText}>ADD TO CART</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.buyNowButton, !isInStock && styles.disabledButton]} 
            onPress={handleBuyNow}
            disabled={!isInStock}
          >
            <Text style={styles.buttonText}>BUY NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  newArrivalContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 1,
  },
  newArrivalText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  productImage: {
    width: width,
    height: width,
    resizeMode: 'contain',
  },
  content: {
    padding: 16,
  },
  categoryAndSku: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginBottom: 24,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  stockStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: getFlexDirection('row'),
    height: 44,
    marginBottom: 16,
  },
  quantityButton: {
    width: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    backgroundColor: '#000',
  },
  minusButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '500',
  },
  plusButtonText: {
    color: '#fff',
  },
  minusButtonText: {
    color: '#000',
  },
  quantityTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  quantityText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 8,
  },
  addToCartButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyNowButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});