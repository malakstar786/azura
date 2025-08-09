import { useTranslation } from '@/i18n/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '@store/address-store';
import { theme } from '@theme';
import { getFlexDirection } from '@utils/rtlStyles';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddressSelectionModalProps {
  visible: boolean;
  addresses: Address[];
  onSelect: (address: Address) => void;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function AddressSelectionModal({
  visible,
  addresses,
  onSelect,
  onClose,
}: AddressSelectionModalProps) {
  const { t } = useTranslation();
  const getAddressText = (address: Address) => {
    return `${t('address.block')} ${address.block}, ${t('address.street')} ${address.street}, ${t('address.building')} ${address.houseNumber}${
      address.apartmentNumber ? `, ${t('address.apartment')} ${address.apartmentNumber}` : ''
    }`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('addresses.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.black} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.addressList}>
            {addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={styles.addressOption}
                onPress={() => onSelect(address)}
              >
                <Text style={styles.addressText}>{getAddressText(address)}</Text>
                {address.isDefault && <Text style={styles.defaultBadge}>{t('address.default')}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.addNewAddressButton} onPress={onClose}>
            <Text style={styles.addNewAddressText}>+ {t('addresses.addNew')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  addressList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  addressOption: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  addressText: {
    color: theme.colors.textPrimary,
  },
  defaultBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.buttonPrimary,
    color: theme.colors.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.typography.sizes.sm,
  },
  addNewAddressButton: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
    alignItems: 'center',
  },
  addNewAddressText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonPrimary,
  },
}); 