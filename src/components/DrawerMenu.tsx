import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from '@store/language-store';
import { publicApi } from '@utils/api-service';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface MenuCategory {
  name: string;
  category_id: string;
  href: string;
  children: MenuSubCategory[];
}

interface MenuSubCategory {
  name: string;
  category_id: string;
  href: string;
  childs: any[];
}

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch menu data when drawer becomes visible
  useEffect(() => {
    if (visible && categories.length === 0) {
      fetchMenuData();
    }
  }, [visible]);

  const fetchMenuData = async () => {
    try {
      setIsLoading(true);
      const response = await publicApi.getMainMenu();
      
      if (response.success === 1 && response.data?.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      // Fallback to static data in case of error
      setCategories([
        {
          name: 'Nail Care',
          category_id: '20',
          href: '/nail-care',
          children: [
            { name: 'Nail Polish', category_id: '66', href: '/nail-polish', childs: [] },
            { name: 'Nail Care', category_id: '27', href: '/nail-care', childs: [] },
          ]
        },
        {
          name: 'Makeup',
          category_id: '18',
          href: '/makeup',
          children: [
            { name: 'Foundation', category_id: '45', href: '/foundation', childs: [] },
          ]
        },
        {
          name: 'Fragrance',
          category_id: '57',
          href: '/perfumes',
          children: [
            { name: 'Perfume', category_id: '76', href: '/perfume', childs: [] },
            { name: 'Colognes', category_id: '78', href: '/colognes', childs: [] },
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategorySlug = (categoryName: string, categoryId: string) => {
    // Map category IDs directly to ensure consistency with category page routing
    switch (categoryId) {
      case '20':
        return 'nail-care';
      case '18':
        return 'makeup';
      case '57':
        return 'perfumes';
      default:
        // Fallback to name-based mapping for unknown category IDs
        switch (categoryName.toLowerCase()) {
          case 'nail care':
            return 'nail-care';
          case 'makeup':
            return 'makeup';
          case 'fragrance':
          case 'perfume':
          case 'perfumes':
            return 'perfumes';
          default:
            return categoryName.toLowerCase().replace(/\s+/g, '-');
        }
    }
  };

  const handleCategoryPress = (category: MenuCategory) => {
    const slug = getCategorySlug(category.name, category.category_id);
    router.push(`/categories/${slug}`);
    onClose();
  };

  const handleSubCategoryPress = (parentCategory: MenuCategory, subCategory: MenuSubCategory) => {
    // For now, navigate to main category page as we don't have subcategory pages implemented
    const slug = getCategorySlug(parentCategory.name, parentCategory.category_id);
    router.push(`/categories/${slug}`);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { 
        flexDirection: getFlexDirection('row') 
      }]}>
        <View style={styles.drawer}>
          {/* Header */}
          <View style={[styles.header, { 
            flexDirection: getFlexDirection('row') 
          }]}>
            <Text style={[styles.headerTitle, { 
              textAlign: getTextAlign() 
            }]}>{t('drawer.browse')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {/* Categories List */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.black} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            ) : (
              categories.map((category) => (
                <View key={category.category_id} style={styles.categorySection}>
                  {/* Category Header */}
                  <TouchableOpacity
                    onPress={() => handleCategoryPress(category)}
                    style={styles.categoryHeader}
                  >
                    <Text style={[styles.categoryTitle, { 
                      textAlign: getTextAlign() 
                    }]}>{category.name}</Text>
                  </TouchableOpacity>

                  {/* Subcategories */}
                  {category.children && category.children.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.category_id}
                      onPress={() => handleSubCategoryPress(category, subCategory)}
                      style={styles.productItem}
                    >
                      <Text style={[styles.productName, { 
                        textAlign: getTextAlign() 
                      }]}>{subCategory.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Background overlay to close */}
        <TouchableOpacity 
          style={styles.backgroundOverlay} 
          onPress={onClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: getFlexDirection('row'),
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  drawer: {
    width: width * 0.85,
    backgroundColor: theme.colors.white,
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xxl + 20 : theme.spacing.lg,
  },
  header: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxxxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    letterSpacing: 2,
  },
  closeButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    borderBottomWidth:1,
    borderBottomColor: theme.colors.black,
    width: '96%',
    marginVertical: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.darkGray,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.black,
    marginBottom: 8,
  },
  productItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.lightGray,
  },
  productName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.darkGray,
    lineHeight: 20,
  },
}); 