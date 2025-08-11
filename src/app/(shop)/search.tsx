import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from '@store/language-store';
import { publicApi } from '@utils/api-service';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';


interface Product {
  product_id: string;
  name: string;
  price: string;
  image: string;
  stock_status: string;
  date_added: string;
  category_id: string;
  // Align with category listing logic: rely on numeric quantity to determine stock
  quantity?: number | string;
}


const SearchResultItem = ({ product }: { product: Product }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  
  return (
    <Pressable 
      style={[styles.resultItem, { flexDirection: getFlexDirection('row') }]}
      onPress={() => router.push(`/product/${product.product_id}` as any)}
    >
      <Image 
        source={{ uri: `https://azura.com.kw/image/${product.image}` }} 
        style={styles.productImage} 
      />
      <View style={[styles.productInfo, { alignItems: getTextAlign() === 'left' ? 'flex-start' : 'flex-end' }]}>
        <Text style={[styles.productTitle, { textAlign: getTextAlign() }]}>
          {product.name.toUpperCase()}
        </Text>
        <Text style={[styles.productPrice, { textAlign: getTextAlign() }]}>
          {product.price}
        </Text>
        <Text style={[styles.productStock, { textAlign: getTextAlign() }]}>
          {Number(product.quantity) > 0 ? t('product.inStock') : t('product.outOfStock')}
        </Text>
      </View>
      <Ionicons 
        name={isRTL ? "chevron-back" : "chevron-forward"} 
        size={20} 
        color={theme.colors.mediumGray} 
      />
    </Pressable>
  );
};

export default function SearchScreen() {
  const { t } = useTranslation();
  const { isRTL, currentLanguage, lastUpdated } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery]);

  // Fetch all products once on initial load
  useEffect(() => {
    const fetchAllProducts = async () => {
      if (productsLoaded) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await publicApi.getAllProducts();
        if (response.success === 1 && response.data) {
          const products: Product[] = (response.data.products || []).map((p: any) => ({
            ...p,
            // normalize quantity as number; fall back to 0 when missing
            quantity: typeof p.quantity === 'string' || typeof p.quantity === 'number' ? Number(p.quantity) : 0,
          }));
          setAllProducts(products);
          setProductsLoaded(true);
        } else {
          setError(Array.isArray(response.error) ? response.error[0] : t('common.error'));
        }
      } catch (err: any) {
        setError(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllProducts();
  }, [productsLoaded, t, currentLanguage, lastUpdated]);

  // Refetch products when language changes to localize names/prices
  useEffect(() => {
    setProductsLoaded(false);
  }, [currentLanguage, lastUpdated]);

  // Filter products when search query changes
  useEffect(() => {
    if (!productsLoaded) return;
    
    if (debouncedQuery.length < 2) {
      setFilteredProducts([]);
      return;
    }

    const searchLower = debouncedQuery.toLowerCase();
    const filtered = allProducts.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.product_id.toLowerCase().includes(searchLower)
    );
    
    // Sort by stock first (in stock first) then by recency similar to category page new arrivals logic
    const sorted = filtered.slice().sort((a, b) => {
      const aInStock = Number(a.quantity) > 0 ? 1 : 0;
      const bInStock = Number(b.quantity) > 0 ? 1 : 0;
      if (aInStock !== bInStock) return bInStock - aInStock;
      const aDate = new Date(a.date_added).getTime();
      const bDate = new Date(b.date_added).getTime();
      return bDate - aDate;
    });

    setFilteredProducts(sorted);
  }, [debouncedQuery, allProducts, productsLoaded]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { textAlign: getTextAlign() }]}>
        {t('search.title')}
      </Text>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
      </View>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { flexDirection: getFlexDirection('row') }]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={theme.colors.mediumGray} 
            style={[styles.searchIcon, { marginEnd: theme.spacing.sm }]} 
          />
          <TextInput
            style={[styles.searchInput, { textAlign: getTextAlign() }]}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.colors.mediumGray}
            value={searchQuery}
            onChangeText={handleSearch}
            editable={productsLoaded || !isLoading}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.mediumGray} />
            </Pressable>
          )}
        </View>
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.black} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}
      
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { textAlign: getTextAlign() }]}>{error}</Text>
          <Pressable 
            style={styles.retryButton}
            onPress={() => setProductsLoaded(false)}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      )}
      
      {!isLoading && !error && productsLoaded && searchQuery.length > 0 && filteredProducts.length === 0 && (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={60} color={theme.colors.mediumGray} style={styles.noResultsIcon} />
          <Text style={[styles.noResultsText, { textAlign: getTextAlign() }]}>
            {t('empty.noProducts')}
          </Text>
          <Text style={[styles.noResultsSubtext, { textAlign: getTextAlign() }]}>
            {t('empty.noProductsDescription')}
          </Text>
        </View>
      )}

      {!isLoading && !error && productsLoaded && searchQuery.length === 0 && (
        <View style={styles.emptySearchContainer}>
          <Ionicons name="search" size={60} color={theme.colors.mediumGray} style={styles.emptySearchIcon} />
          <Text style={[styles.emptySearchText, { textAlign: getTextAlign() }]}>
            {t('search.placeholder')}
          </Text>
          <Text style={[styles.emptySearchSubtext, { textAlign: getTextAlign() }]}>
            {t('search.typeMinChars', [2])}
          </Text>
        </View>
      )}

      {!isLoading && productsLoaded && filteredProducts.length > 0 && (
        <ScrollView 
          style={styles.results}
          contentContainerStyle={styles.resultsContent}
        >
          <View style={styles.resultsList}>
            {filteredProducts.map(product => (
              <SearchResultItem key={product.product_id} product={product} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  const Fallback = require('@components/RouteErrorFallback').default;
  return <Fallback error={error} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.black,
  },
  dividerContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 2,
    backgroundColor: theme.colors.black,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
    // marginEnd is applied inline for RTL support
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    paddingVertical: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
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
    paddingVertical: theme.spacing.xxl,
  },
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
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
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  noResultsIcon: {
    marginBottom: theme.spacing.lg,
  },
  noResultsText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
  },
  noResultsSubtext: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.mediumGray,
    textAlign: 'center',
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  emptySearchIcon: {
    marginBottom: theme.spacing.lg,
  },
  emptySearchText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
  },
  emptySearchSubtext: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.mediumGray,
    textAlign: 'center',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: theme.spacing.lg,
  },
  resultsList: {
    paddingHorizontal: theme.spacing.md,
  },
  resultItem: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightBorder,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    marginEnd: theme.spacing.md,
  },
  productInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  productTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.black,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: 2,
  },
  productStock: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mediumGray,
  },
}); 