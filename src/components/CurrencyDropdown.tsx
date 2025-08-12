import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, makeApiCall, setActiveCountryId, setActiveCurrencyCode } from '@utils/api-config';
import { LocationService } from '@utils/location-service';
import { getFlexDirection, getTextAlign } from '@utils/rtlStyles';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Currency {
  title: string;
  code: string;
  symbol_left: string;
  symbol_right: string;
  image: string;
}

interface CurrencyDropdownProps {
  onCurrencyChange?: (currency: Currency) => void;
}

export default function CurrencyDropdown({ onCurrencyChange }: CurrencyDropdownProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setIsLoading(true);
      const response = await makeApiCall(API_ENDPOINTS.currencies, {
        method: 'GET'
      });

      if (response.success === 1 && response.data) {
        setCurrencies(response.data.currencies || []);
        
        // Set the selected currency from the response
        if (response.data.selected_currency_code) {
          const selected = response.data.currencies.find(
            (currency: Currency) => currency.code === response.data.selected_currency_code
          );
          if (selected) {
            setSelectedCurrency(selected);
            // Persist selected currency code
            await setActiveCurrencyCode(selected.code);
            // Resolve country id via countries endpoint instead of hardcoding
            const title = (selected.title || '').toUpperCase();
            const titleToCountryName: Record<string, string> = {
              BRN: 'Bahrain',
              JOR: 'Jordan',
              KSA: 'Saudi Arabia',
              KWT: 'Kuwait',
              OMN: 'Oman',
              QTR: 'Qatar',
              UAE: 'United Arab Emirates'
            };
            const countries = await LocationService.getCountries();
            const desiredName = titleToCountryName[title];
            const match = countries.find((c) => c.name === desiredName);
            // Safe fallback mapping (provided): BRN->17, JOR->108, KSA->184, KWT->114, OMN->161, QTR->173, UAE->221
            const fallbackIdByTitle: Record<string, string> = {
              BRN: '17',
              JOR: '108',
              KSA: '184',
              KWT: '114',
              OMN: '161',
              QTR: '173',
              UAE: '221',
            };
            await setActiveCountryId(match?.country_id || fallbackIdByTitle[title] || '114');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencySelect = async (currency: Currency) => {
    try {
      // changeCurrency endpoint requires application/x-www-form-urlencoded and is absolute
      const body = new URLSearchParams();
      body.append('code', currency.code);

      await makeApiCall(API_ENDPOINTS.changeCurrency, {
        method: 'POST',
        data: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setSelectedCurrency(currency);
      await setActiveCurrencyCode(currency.code);
      // Update active country id using countries endpoint
      const title = (currency.title || '').toUpperCase();
      const titleToCountryName: Record<string, string> = {
        BRN: 'Bahrain',
        JOR: 'Jordan',
        KSA: 'Saudi Arabia',
        KWT: 'Kuwait',
        OMN: 'Oman',
        QTR: 'Qatar',
        UAE: 'United Arab Emirates'
      };
      const countries = await LocationService.getCountries();
      const desiredName = titleToCountryName[title];
      const match = countries.find((c) => c.name === desiredName);
      const fallbackIdByTitle: Record<string, string> = {
        BRN: '17',
        JOR: '108',
        KSA: '184',
        KWT: '114',
        OMN: '161',
        QTR: '173',
        UAE: '221',
      };
      await setActiveCountryId(match?.country_id || fallbackIdByTitle[title] || '114');
      setIsDropdownOpen(false);
      onCurrencyChange?.(currency);
    } catch (error) {
      console.error('Error changing currency:', error);
    }
  };

  const renderCurrencyItem = ({ item }: { item: Currency }) => (
    <TouchableOpacity
      style={styles.currencyItem}
      onPress={() => handleCurrencySelect(item)}
    >
      <Image source={{ uri: item.image }} style={styles.flagImage} />
      <Text style={styles.currencyTitle}>{item.title}</Text>
      {selectedCurrency?.code === item.code && (
        <Ionicons name="checkmark" size={20} color={theme.colors.black} />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.black} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsDropdownOpen(true)}
      >
        {selectedCurrency ? (
          <View style={styles.selectedCurrency}>
            <Image source={{ uri: selectedCurrency.image }} style={styles.flagImage} />
            <Text style={styles.selectedText}>{selectedCurrency.title}</Text>
          </View>
        ) : (
          <Text style={styles.selectedText}>KWD</Text>
        )}
        <Ionicons name="chevron-down" size={16} color={theme.colors.black} />
      </TouchableOpacity>

      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={currencies}
              renderItem={renderCurrencyItem}
              keyExtractor={(item) => item.code}
              style={styles.currencyList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loadingContainer: {
    padding: theme.spacing.sm,
  },
  dropdownButton: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    minWidth: 85,
  },
  selectedCurrency: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  selectedText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.black,
    textAlign: getTextAlign(),
  },
  flagImage: {
    width: 16,
    height: 12,
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    maxHeight: 300,
    width: 200,
    shadowColor: theme.shadows.md.shadowColor,
    shadowOffset: theme.shadows.md.shadowOffset,
    shadowOpacity: theme.shadows.md.shadowOpacity,
    shadowRadius: theme.shadows.md.shadowRadius,
    elevation: theme.shadows.md.elevation,
  },
  currencyList: {
    maxHeight: 280,
  },
  currencyItem: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
    gap: theme.spacing.sm,
  },
  currencyTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.black,
    textAlign: getTextAlign(),
  },
}); 