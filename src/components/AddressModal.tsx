import type { Address } from '@store/address-store';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import AddEditAddress from './add-edit-address';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  isNewAddress: boolean;
  address?: Address;
}

export default function AddressModal({ visible, onClose, isNewAddress, address }: AddressModalProps) {
  // Convert Address to FormData format
  const formData = address ? {
    firstname: address.firstName,
    lastname: address.lastName,
    phone: address.phone || '', // Use actual phone from address data
    company: '',
    address_1: `Block ${address.block}, Street ${address.street}, House ${address.houseNumber}${address.apartmentNumber ? `, Apt ${address.apartmentNumber}` : ''}`,
    address_2: address.additionalDetails,
    city: address.city,
    postcode: '',
    country_id: '114', // Kuwait
    zone_id: '1785', // Al Asimah (Kuwait City)
    custom_field: {
      '30': address.block,
      '31': address.street,
      '32': address.houseNumber,
      '33': address.apartmentNumber,
      '35': address.avenue
    },
    default: address.isDefault,
    address_id: address.id
  } : undefined;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <AddEditAddress
          context="account"
          onClose={onClose}
          address={formData}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
}); 