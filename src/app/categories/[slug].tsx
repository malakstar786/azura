import { useTranslation } from '@/i18n/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/auth-store';
import { useCartStore } from '@store/cart-store';
import { useLanguageStore } from '@store/language-store';
import { publicApi } from '@utils/api-service';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
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
import type { Product as ApiProduct } from '../../types/api';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 15;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - (COLUMN_GAP * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

// Category IDs from API documentation
const CATEGORY_MAP: { [key: string]: string } = {
  'nail-care': '20',
  'fragrance': '57',
  'perfumes': '57',
  'makeup': '18'
};

interface Product extends ApiProduct {
  stock_status: string;
  date_added: string;
  quantity: number;
  sku: string;
  meta_title: string;
  meta_description: string;
  meta_keyword: string;
  tag: string;
  model: string;
  upc: string;
  ean: string;
  jan: string;
  isbn: string;
  mpn: string;
  location: string;
  manufacturer_id: string | null;
  manufacturer: string | null;
  reward: string | null;
  points: string;
  tax_class_id: string;
  date_available: string;
  weight: string;
  weight_class_id: string;
  length: string;
  width: string;
  height: string;
  length_class_id: string;
  subtract: string;
  rating: number;
  reviews: number;
  minimum: string;
  sort_order: string;
  status: string;
  date_modified: string;
  options: any[];
}

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryImage, setCategoryImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { t } = useTranslation();
  const { currentLanguage, lastUpdated } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();

  const getCategoryDescription = (categorySlug: string) => {
    switch(categorySlug) {
      case 'fragrance':
      case 'perfumes':
        return t('categories.fragrance_description') || 'Our new collection of fragrances offers a unique experience of freshness, where each spray takes you on a special journey.';
      case 'nail-care':
        return t('categories.nailcare_description') || 'Azura provides premium nail care products designed to promote the growth of long, strong, and healthy nails';
      case 'makeup':
        return t('categories.makeup_description') || 'Premium makeup for every occasion';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const categoryId = CATEGORY_MAP[slug as string];
        if (!categoryId) {
          throw new Error('Category not found');
        }

        // Fetch feature block based on category
        const featureBlockNumber = slug === 'nail-care' ? 2 :
                                   slug === 'makeup' ? 5 : 1;
        
        const featureResponse = await publicApi.getFeaturesBlock(featureBlockNumber);
        if (featureResponse.success === 1 && featureResponse.data) {
          setCategoryImage(featureResponse.data.image);
        }

        // Fetch products by category
        const response = await publicApi.getProductsByCategory(categoryId);
        console.log('📱 [CATEGORY] Category products response:', response);
        
        if (response.success === 1 && response.data) {
          // The API service now always returns data in the format { products: Product[], product_total: number }
          if (response.data.products && Array.isArray(response.data.products)) {
            console.log('📱 [CATEGORY] ========== PROCESSING PRODUCTS FOR UI ==========');
            console.log('📱 [CATEGORY] Total products received:', response.data.products.length);
            
            response.data.products.forEach((product: any, index: number) => {
              console.log('📱 [CATEGORY] UI Product Analysis:', index + 1);
              console.log('📱 [CATEGORY] - Product ID:', product.product_id);
              console.log('📱 [CATEGORY] - Product Name:', product.name);
              console.log('📱 [CATEGORY] - Stock Status Raw:', `"${product.stock_status}"`);
              console.log('📱 [CATEGORY] - Stock Status Type:', typeof product.stock_status);
              console.log('📱 [CATEGORY] - Quantity:', product.quantity);
                             console.log('📱 [CATEGORY] - Is Quantity > 0?:', Number(product.quantity) > 0);
               console.log('📱 [CATEGORY] - Will show as In Stock?:', Number(product.quantity) > 0);
               console.log('📱 [CATEGORY] - Will show as Out of Stock?:', Number(product.quantity) <= 0);
               console.log('📱 [CATEGORY] - Button disabled?:', Number(product.quantity) <= 0);
              console.log('📱 [CATEGORY] - Date Added:', product.date_added);
              console.log('📱 [CATEGORY] --------------------------------');
            });
            console.log('📱 [CATEGORY] ========== END UI PROCESSING ==========');
            
            setProducts(response.data.products as Product[]);
          } else {
            console.log('📱 [CATEGORY] ❌ No products array found in response data');
            setProducts([]);
          }
        } else {
          console.log('📱 [CATEGORY] ❌ API call failed:', response.error);
          throw new Error(Array.isArray(response.error) ? response.error[0] : 'Invalid response format');
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, currentLanguage, lastUpdated]);

  const isNewArrival = (product: Product) => {
    const isInStock = Number(product.quantity) > 0;
    const addedDate = new Date(product.date_added);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return isInStock && addedDate >= thirtyDaysAgo;
  };

  const addToCart = (product: Product) => {
    if (Number(product.quantity) <= 0) {
      toast.show('This product is currently out of stock.', {
        type: 'error',
        placement: 'bottom',
      });
      return;
    }
    useCartStore.getState().addToCart(product.product_id, 1);
  };

  const handleBuyNow = (product: Product) => {
    // Check if user is authenticated before proceeding
    if (!isAuthenticated) {
      // Redirect to auth page with checkout redirect parameter
      router.push('/auth?redirect=checkout');
      return;
    }
    
    addToCart(product);
    router.push('/checkout');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity 
        style={styles.productImageContainer}
        onPress={() => router.push(`/product/${item.product_id}`)}
      >
        <Image
          source={{ uri: `https://azura.com.kw/image/${item.image}` }}
          style={styles.productImage}
          resizeMode="cover"
        />
        {isNewArrival(item) && (
          <View style={styles.newArrivalBadge}>
                            <Text style={styles.newArrivalText}>{t('product.newArrival')}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.productInfo}>
        <Text style={styles.productCategory}>{slug === 'nail-care' ? 'NAIL CARE' : slug === 'makeup' ? 'MAKEUP' : 'FRAGRANCE'}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.addToCartButton]}
            onPress={() => addToCart(item)}
            disabled={Number(item.quantity) <= 0}
          >
            <Text style={styles.buttonText}>{t('product.addToCart')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buyNowButton]}
            onPress={() => handleBuyNow(item)}
            disabled={Number(item.quantity) <= 0}
          >
            <Text style={[styles.buttonText, styles.buyNowButtonText]}>{t('product.buyNow')}</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.stockStatus}>
          {(() => {
            const isInStock = Number(item.quantity) > 0;
            const statusText = isInStock ? t('product.inStock') : t('product.outOfStock');
            console.log(`📱 [RENDER] Product ${item.product_id} (${item.name}) - Quantity: ${item.quantity} → Showing: "${statusText}"`);
            return statusText;
          })()}
        </Text>
      </View>
    </View>
  );

  const renderProducts = () => {
    return (
      <View style={styles.productsGrid}>
        {products.map((item) => (
          <View key={item.product_id} style={styles.productWrapper}>
            {renderProduct({ item })}
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: categoryImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Category Info Section */}
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryDescription}>
            {getCategoryDescription(slug as string)}
          </Text>
          <Text style={styles.productCount}>
            {products.length} {t('categories.products')}
          </Text>
        </View>

        {/* Products Grid */}
        {renderProducts()}
      </ScrollView>

      {/* Back button outside ScrollView to keep it fixed */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  heroSection: {
    height: 300,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  categoryInfo: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryDescription: {
    flex: 1,
    color: '#000',
    fontSize: 14,
    lineHeight: 20,
    marginEnd: 20,
  },
  productCount: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  productsGrid: {
    padding: COLUMN_GAP,
    flexDirection: getFlexDirection('row'),
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: ITEM_WIDTH,
    marginBottom: COLUMN_GAP,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 0,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: ITEM_WIDTH * 1.2,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  newArrivalBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newArrivalText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#000',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButton: {
    backgroundColor: '#000',
  },
  buyNowButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  buyNowButtonText: {
    color: '#000',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  productCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  stockStatus: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: getTextAlign() === 'left' ? 'right' : 'left',
  },
});