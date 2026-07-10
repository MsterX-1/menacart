import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAddAddress, useUpdateAddress } from '../hooks/useAddresses';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { useToast } from '../../../components/Toast';
import type { Address } from '../../../types/address';
import './AddressFormModal.css';

const addressSchema = z.object({
  addressType: z.enum(['Shipping', 'Billing']),
  street: z.string().min(1, 'Street address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional().or(z.literal('')),
  country: z.string().min(1, 'Country is required').max(100),
  zipCode: z.string().max(20).optional().or(z.literal('')),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: Address | null;
  onSuccess: () => void;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  address,
  onSuccess,
}) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const addMutation = useAddAddress();
  const updateMutation = useUpdateAddress();
  const isEditMode = !!address;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressType: 'Shipping',
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      isDefault: false,
    },
  });

  useEffect(() => {
    if (address) {
      reset({
        addressType: address.addressType,
        street: address.street,
        city: address.city,
        state: address.state || '',
        country: address.country,
        zipCode: address.zipCode || '',
        isDefault: address.isDefault,
      });
    } else {
      reset({
        addressType: 'Shipping',
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        isDefault: false,
      });
    }
  }, [address, reset, isOpen]);

  const onSubmit = async (data: AddressFormValues) => {
    try {
      const payload = {
        addressType: data.addressType,
        street: data.street,
        city: data.city,
        state: data.state || undefined,
        country: data.country,
        zipCode: data.zipCode || undefined,
        isDefault: data.isDefault,
      };

      if (isEditMode && address) {
        await updateMutation.mutateAsync({ id: address.addressId, data: payload });
        toastSuccess('Address updated successfully');
      } else {
        await addMutation.mutateAsync(payload);
        toastSuccess('Address added successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="address-modal-overlay">
      <div className="address-modal">
        <h3 className="address-modal-title">
          {isEditMode ? 'Edit Address' : 'Add New Address'}
        </h3>
        <p className="address-modal-subtitle">
          {isEditMode ? 'Modify your address details.' : 'Provide details to expand your address book.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="address-form">
          <div className="input-group">
            <label className="input-label">Address Type</label>
            <select
              className={`input-field select-field ${errors.addressType ? 'has-error' : ''}`}
              {...register('addressType')}
            >
              <option value="Shipping">Shipping Address</option>
              <option value="Billing">Billing Address</option>
            </select>
            {errors.addressType && <span className="input-error">{errors.addressType.message}</span>}
          </div>

          <Input
            label="Street Address"
            type="text"
            placeholder="123 Fashion Ave, Suite 4"
            error={errors.street?.message}
            {...register('street')}
          />

          <div className="form-row-grid">
            <Input
              label="City"
              type="text"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="State / Province"
              type="text"
              error={errors.state?.message}
              {...register('state')}
            />
          </div>

          <div className="form-row-grid">
            <Input
              label="Country"
              type="text"
              error={errors.country?.message}
              {...register('country')}
            />
            <Input
              label="Zip / Postal Code"
              type="text"
              error={errors.zipCode?.message}
              {...register('zipCode')}
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="isDefault"
              className="checkbox-input"
              {...register('isDefault')}
            />
            <label htmlFor="isDefault" className="checkbox-label">
              Set as default address for this type
            </label>
          </div>

          <div className="address-modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addMutation.isPending || updateMutation.isPending}>
              {isEditMode ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
