import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateReturn } from '../hooks/useReturns';
import { useBrowseProducts } from '../../products/hooks/useProducts';
import { Button } from '../../../components/Button';
import { useToast } from '../../../components/Toast';
import type { OrderItem } from '../../../types/order';
import './ReturnRequestModal.css';

const returnSchema = z.object({
  type: z.enum(['Return', 'Exchange']),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500, 'Reason cannot exceed 500 characters'),
  exchangeVariantId: z.string().optional().nullable(),
});

type ReturnFormValues = z.infer<typeof returnSchema>;

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrderItem | null;
  onSuccess: () => void;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const createMutation = useCreateReturn();
  const [returnType, setReturnType] = useState<'Return' | 'Exchange'>('Return');

  // Search for the product by name to load its variants for exchange
  const { data: products } = useBrowseProducts({
    search: item?.productName || '',
    pageSize: 10,
  });

  const parentProduct = products?.find((p) =>
    p.variants.some((v) => v.variantId === item?.variantId)
  );

  const availableVariants = parentProduct?.variants.filter(
    (v) => v.variantId !== item?.variantId && v.stockQuantity > 0
  ) || [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      type: 'Return',
      reason: '',
      exchangeVariantId: '',
    },
  });

  if (!isOpen || !item) return null;

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'Return' | 'Exchange';
    setReturnType(type);
    setValue('type', type);
    if (type === 'Return') {
      setValue('exchangeVariantId', '');
    }
  };

  const onSubmitForm = async (values: ReturnFormValues) => {
    if (values.type === 'Exchange' && !values.exchangeVariantId) {
      toastError('Please select a variant for the exchange.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        orderItemId: item.orderItemId,
        type: values.type,
        exchangeVariantId: values.exchangeVariantId
          ? parseInt(values.exchangeVariantId, 10)
          : undefined,
        reason: values.reason,
      });

      toastSuccess(
        values.type === 'Return'
          ? 'Return request submitted successfully.'
          : 'Exchange request submitted successfully.'
      );
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(
        err.response?.data?.message || 'Failed to submit return/exchange request.'
      );
    }
  };

  return (
    <div className="return-modal-overlay" onClick={onClose}>
      <div className="return-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="return-modal-header">
          <h3 className="return-modal-title">Return / Exchange Item</h3>
          <button className="return-modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmitForm)} className="return-modal-form">
          <div className="item-preview-badge">
            <span className="item-preview-name">{item.productName}</span>
            <div className="item-preview-specs">
              {item.color && <span>Color: {item.color}</span>}
              {item.size && <span>Size: {item.size}</span>}
              <span>Qty: {item.quantity}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="type" className="form-label">
              Request Type
            </label>
            <select
              id="type"
              className="form-select-control"
              value={returnType}
              onChange={handleTypeChange}
            >
              <option value="Return">Return & Refund</option>
              <option value="Exchange">Exchange for another size/color</option>
            </select>
          </div>

          {returnType === 'Exchange' && (
            <div className="form-group">
              <label htmlFor="exchangeVariantId" className="form-label">
                Select Exchange Variant
              </label>
              {availableVariants.length > 0 ? (
                <select
                  id="exchangeVariantId"
                  className="form-select-control"
                  {...register('exchangeVariantId')}
                >
                  <option value="">-- Choose size/color --</option>
                  {availableVariants.map((v) => (
                    <option key={v.variantId} value={v.variantId}>
                      {[
                        v.size ? `Size: ${v.size}` : '',
                        v.color ? `Color: ${v.color}` : '',
                        `(${v.price.toFixed(2)} EGP)`,
                      ]
                        .filter(Boolean)
                        .join(' - ')}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="no-variants-notice">
                  No other variants with available stock were found for this product.
                </p>
              )}
              {errors.exchangeVariantId && (
                <span className="form-error-msg">{errors.exchangeVariantId.message}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reason" className="form-label">
              Reason for Return / Exchange
            </label>
            <textarea
              id="reason"
              className="form-textarea-control"
              placeholder="Please describe why you wish to return or exchange this item..."
              rows={4}
              {...register('reason')}
            />
            {errors.reason && (
              <span className="form-error-msg">{errors.reason.message}</span>
            )}
          </div>

          <div className="return-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="modal-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={returnType === 'Exchange' && availableVariants.length === 0}
              className="modal-submit-btn"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
