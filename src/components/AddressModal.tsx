import type { Address } from '@store/address-store';
import { getActiveCountryId } from '@utils/api-config';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import AddEditAddress from './add-edit-address';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  isNewAddress: boolean;
  address?: Address;
}

export default function AddressModal({ visible, onClose, isNewAddress, address }: AddressModalProps) {
  const [activeCountryId, setActiveCountryIdState] = useState<string>('');

  useEffect(() => {
    (async () => {
      // Prefer the incoming address country if present; otherwise use active stored country
      if (address?.country_id) {
        setActiveCountryIdState(address.country_id);
      } else {
        const id = await getActiveCountryId();
        setActiveCountryIdState(id);
      }
    })();
  }, [address?.country_id]);

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
    country_id: address.country_id || activeCountryId,
    zone_id: '',
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