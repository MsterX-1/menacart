import React, { useState } from 'react';
import { 
  useAdminCoupons, 
  useCreateCoupon, 
  useUpdateCoupon, 
  useDeleteCoupon 
} from './hooks/useAdminCoupons';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import type { Coupon } from '../../types/coupon';
import './AdminCouponsPage.css';

export const AdminCouponsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: coupons, isLoading, error } = useAdminCoupons();
  
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>('');
  const [sellerId, setSellerId] = useState<number | ''>('');
  const [formError, setFormError] = useState('');

  const handleOpenCreate = () => {
    setSelectedCoupon(null);
    setCode('');
    setDiscountType('Percentage');
    setDiscountValue(0);
    setExpiryDate('');
    setUsageLimit('');
    setMinOrderAmount('');
    setSellerId('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType as 'Percentage' | 'Fixed');
    setDiscountValue(coupon.discountValue);
    // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
    const rawDate = new Date(coupon.expiryDate);
    const tzOffset = rawDate.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(rawDate.getTime() - tzOffset)).toISOString().slice(0, 16);
    setExpiryDate(localISOTime);
    setUsageLimit(coupon.usageLimit !== null ? coupon.usageLimit : '');
    setMinOrderAmount(coupon.minOrderAmount !== null ? coupon.minOrderAmount : '');
    setSellerId(coupon.sellerId !== null && coupon.sellerId !== undefined ? coupon.sellerId : '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, couponCode: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toastSuccess(`Coupon "${couponCode}" deleted successfully.`);
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to delete coupon.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (discountValue <= 0) {
      setFormError('Discount value must be greater than 0.');
      return;
    }
    if (discountType === 'Percentage' && discountValue > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }
    if (!expiryDate) {
      setFormError('Expiry date is required.');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      expiryDate: new Date(expiryDate).toISOString(),
      usageLimit: usageLimit === '' ? null : Number(usageLimit),
      minOrderAmount: minOrderAmount === '' ? null : Number(minOrderAmount),
      sellerId: sellerId === '' ? null : Number(sellerId),
    };

    try {
      if (selectedCoupon) {
        await updateMutation.mutateAsync({
          id: selectedCoupon.couponId,
          data: payload,
        });
        toastSuccess(`Coupon "${payload.code}" updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        toastSuccess(`Coupon "${payload.code}" created successfully.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save coupon.');
    }
  };

  if (isLoading) {
    return (
      <div className="admin-coupons-container loading">
        <LoadingSkeleton variant="text" width="200px" height={32} />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton variant="rect" height="300px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-coupons-container error ">
        <p className="error-message">Error loading coupons: {(error as any).message}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="admin-coupons-container">
      <div className="admin-coupons-header">
        <div>
          <h1 className="admin-coupons-title">Coupons & Promo Codes</h1>
          <p className="admin-coupons-subtitle">Manage customer checkout discount codes and usage policies.</p>
        </div>
        <Button onClick={handleOpenCreate}>+ Create Coupon</Button>
      </div>

      {coupons && coupons.length === 0 ? (
        <div className="coupons-empty ">
          <h2>No Coupons Found</h2>
          <p>Create discount campaigns to engage shoppers.</p>
          <Button onClick={handleOpenCreate}>Create First Coupon</Button>
        </div>
      ) : (
        <div className="coupons-table-wrapper ">
          <table className="coupons-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Expiry Date</th>
                <th>Usage Limit</th>
                <th>Min Order</th>
                <th>Seller ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons?.map((coupon) => {
                const isExpired = new Date(coupon.expiryDate) < new Date();
                const formattedDate = new Date(coupon.expiryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={coupon.couponId} className={isExpired ? 'coupon-row-expired' : ''}>
                    <td>
                      <span className="coupon-code-badge">{coupon.code}</span>
                      {isExpired && <span className="expired-label">Expired</span>}
                    </td>
                    <td>
                      <strong>
                        {coupon.discountType === 'Percentage' 
                          ? `${coupon.discountValue}% Off` 
                          : `${coupon.discountValue.toFixed(2)} EGP Off`}
                      </strong>
                    </td>
                    <td>{formattedDate}</td>
                    <td>
                      {coupon.usageLimit !== null 
                        ? `${coupon.usedCount} / ${coupon.usageLimit} used` 
                        : `${coupon.usedCount} used (Unlimited)`}
                    </td>
                    <td>
                      {coupon.minOrderAmount !== null 
                        ? `${coupon.minOrderAmount.toFixed(2)} EGP` 
                        : 'None'}
                    </td>
                    <td>
                      {coupon.sellerId !== null && coupon.sellerId !== undefined
                        ? `#${coupon.sellerId}` 
                        : <span className="platform-badge" style={{fontSize: '0.75rem', backgroundColor: 'var(--color-bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)'}}>Platform</span>}
                    </td>
                    <td>
                      <div className="coupon-table-actions">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(coupon)}>
                          Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDelete(coupon.couponId, coupon.code)}
                          isLoading={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {formError && (
                <div className="password-error-alert" role="alert">
                  {formError}
                </div>
              )}

              <Input
                label="Coupon Code"
                type="text"
                placeholder="e.g. SUMMER50"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={!!selectedCoupon}
                helperText="Promo codes are capitalized automatically."
              />

              <div className="input-container">
                <label className="input-label">Discount Type</label>
                <div className="discount-type-selector-row">
                  <button
                    type="button"
                    className={`selector-btn ${discountType === 'Percentage' ? 'active' : ''}`}
                    onClick={() => setDiscountType('Percentage')}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    className={`selector-btn ${discountType === 'Fixed' ? 'active' : ''}`}
                    onClick={() => setDiscountType('Fixed')}
                  >
                    Fixed Amount (EGP)
                  </button>
                </div>
              </div>

              <Input
                label={discountType === 'Percentage' ? 'Percentage Off (%)' : 'Fixed Amount Off (EGP)'}
                type="number"
                step="0.01"
                min="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                required
              />

              <Input
                label="Expiration Date & Time"
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />

              <div className="profile-grid">
                <Input
                  label="Usage Limit (Optional)"
                  type="number"
                  placeholder="Unlimited"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  helperText="Total redemption cap."
                />

                <Input
                  label="Min Order Amount (Optional)"
                  type="number"
                  placeholder="None"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  helperText="EGP threshold to apply."
                />
              </div>

              <Input
                label="Seller ID (Optional)"
                type="number"
                placeholder="Leave blank for Platform-wide"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value === '' ? '' : Number(e.target.value))}
                helperText="Assign to a Seller (Seller absorbs cost). Blank = Admin absorbs cost."
              />

              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {selectedCoupon ? 'Save Changes' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
