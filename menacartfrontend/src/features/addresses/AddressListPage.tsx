import React, { useState } from 'react';
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from './hooks/useAddresses';
import { AddressFormModal } from './components/AddressFormModal';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import type { Address } from '../../types/address';
import './AddressListPage.css';

export const AddressListPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { data: addresses, isLoading, error, refetch } = useAddresses();

  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const handleOpenCreate = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (address: Address) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toastSuccess('Address deleted successfully');
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultMutation.mutateAsync(id);
      toastSuccess('Default address updated');
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to set default address');
    }
  };

  if (isLoading) {
    return (
      <div className="addresses-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your address book...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="addresses-container error">
        <p className="error-message">Error loading addresses: {(error as any).message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const shippingAddresses = addresses?.filter((a) => a.addressType === 'Shipping') || [];
  const billingAddresses = addresses?.filter((a) => a.addressType === 'Billing') || [];

  const renderAddressCard = (addr: Address) => (
    <div key={addr.addressId} className={`address-card ${addr.isDefault ? 'default-card' : ''}`}>
      <div className="address-card-header">
        <span className="address-type-label">{addr.addressType} Address</span>
        {addr.isDefault && <span className="default-badge">✓ Default</span>}
      </div>
      <div className="address-card-body">
        <p className="address-street">{addr.street}</p>
        <p className="address-details">
          {addr.city}
          {addr.state ? `, ${addr.state}` : ''}
          {addr.zipCode ? ` ${addr.zipCode}` : ''}
        </p>
        <p className="address-country">{addr.country}</p>
      </div>
      <div className="address-card-footer">
        <div className="card-actions">
          <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(addr)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="btn-delete"
            onClick={() => handleDelete(addr.addressId)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
        {!addr.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="btn-set-default"
            onClick={() => handleSetDefault(addr.addressId)}
            isLoading={setDefaultMutation.isPending}
          >
            Set Default
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="addresses-container">
      <div className="addresses-header">
        <div>
          <h1 className="addresses-title">My Address Book</h1>
          <p className="addresses-subtitle">Manage default shipping and billing configurations</p>
        </div>
        <Button onClick={handleOpenCreate}>+ Add New Address</Button>
      </div>

      {addresses && addresses.length === 0 ? (
        <div className="addresses-empty">
          <h2>Your Address Book is Empty</h2>
          <p>Add shipping and billing addresses to streamline checkout.</p>
          <Button onClick={handleOpenCreate}>Create Address</Button>
        </div>
      ) : (
        <div className="addresses-sections-grid">
          {/* Shipping Column */}
          <div className="addresses-column">
            <h2 className="column-title">Shipping Addresses</h2>
            {shippingAddresses.length === 0 ? (
              <p className="column-empty-text">No shipping addresses listed.</p>
            ) : (
              <div className="addresses-list-grid">
                {shippingAddresses.map(renderAddressCard)}
              </div>
            )}
          </div>

          {/* Billing Column */}
          <div className="addresses-column">
            <h2 className="column-title">Billing Addresses</h2>
            {billingAddresses.length === 0 ? (
              <p className="column-empty-text">No billing addresses listed.</p>
            ) : (
              <div className="addresses-list-grid">
                {billingAddresses.map(renderAddressCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Form Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={selectedAddress}
        onSuccess={refetch}
      />
    </div>
  );
};
