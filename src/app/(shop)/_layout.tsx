import { useTranslation } from '@/i18n/useTranslation';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@store/cart-store';
import { useLanguageStore } from '@store/language-store';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} {...props} style={{ color: props.color }} />;
}

const TabsLayout = () => {
  const cartItems = useCartStore(state => state.items);
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  
  // Calculate total items, properly handling string and number quantities
  const cartItemsCount = cartItems.reduce((sum, item) => {
    const itemQuantity = typeof item.quantity === 'string' 
      ? parseInt(item.quantity, 10) 
      : (typeof item.quantity === 'number' ? item.quantity : 0);
    
    return sum + itemQuantity;
  }, 0);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.black,
          tabBarInactiveTintColor: theme.colors.mediumGray,
          tabBarLabelStyle: { 
            fontSize: theme.typography.sizes.sm,
            marginBottom: theme.spacing.sm,
          },
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 0,
            height: 85,
            paddingTop: theme.spacing.sm,
            paddingBottom: 25,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.home'),
            tabBarIcon(props) {
              return <TabBarIcon {...props} name="home-outline" />;
            },
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('nav.search'),
            tabBarIcon(props) {
              return <TabBarIcon {...props} name="search-outline" />;
            },
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: t('nav.cart'),
            tabBarIcon(props) {
              return (
                <>
                  <TabBarIcon {...props} name="cart-outline" />
                  {cartItemsCount > 0 && (
                    <View style={[
                      styles.badge,
                      isRTL ? { left: -6, right: undefined } : { right: -6, left: undefined }
                    ]}>
                      <Text style={styles.badgeText}>{cartItemsCount}</Text>
                    </View>
                  )}
                </>
              );
            },
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: t('nav.account'),
            tabBarIcon(props) {
              return <TabBarIcon {...props} name="person-outline" />;
            },
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: theme.colors.black,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold as any,
  },
});
