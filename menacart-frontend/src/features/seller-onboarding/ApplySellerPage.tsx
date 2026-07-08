import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMySellerProfile, useApplyAsSeller, useUpdateSellerProfile } from './hooks/useSellerOnboarding';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import './ApplySellerPage.css';

export const ApplySellerPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess } = useToast();
  
  const { data: profile, isLoading } = useMySellerProfile();
  const applyMutation = useApplyAsSeller();
  const updateMutation = useUpdateSellerProfile();

  // Form State
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [storeBannerUrl, setStoreBannerUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Prepopulate form if profile exists (e.g. for updates or resubmissions)
  useEffect(() => {
    if (profile) {
      setStoreName(profile.storeName || '');
      setStoreDescription(profile.storeDescription || '');
      setStoreAddress(profile.storeAddress || '');
      setPhone(profile.phone || '');
      setStoreLogoUrl(profile.storeLogoUrl || '');
      setStoreBannerUrl(profile.storeBannerUrl || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!storeName.trim()) {
      setFormError('Store Name is required.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Contact Phone is required.');
      return;
    }

    const payload = {
      storeName: storeName.trim(),
      storeDescription: storeDescription.trim(),
      storeAddress: storeAddress.trim(),
      phone: phone.trim(),
      storeLogoUrl: storeLogoUrl.trim(),
      storeBannerUrl: storeBannerUrl.trim(),
    };

    try {
      if (profile) {
        await updateMutation.mutateAsync(payload);
        toastSuccess('Seller application updated successfully!');
      } else {
        await applyMutation.mutateAsync(payload);
        toastSuccess('Seller application submitted successfully! Please submit your KYC documents.');
        navigate('/seller/documents');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to submit application.');
    }
  };

  if (isLoading) {
    return (
      <div className="apply-seller-container loading">
        <LoadingSkeleton variant="text" width="200px" height={32} />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton variant="rect" height="400px" />
        </div>
      </div>
    );
  }

  // Handle existing application states
  if (profile) {
    if (profile.status === 'Active') {
      return (
        <div className="apply-seller-status-page glass-card fade-in">
          <div className="status-badge success-badge">Active Merchant</div>
          <h2>Welcome Back, {profile.storeName}!</h2>
          <p>Your seller account is fully verified. You can manage products, track sales, and fulfill shipments via the seller dashboard.</p>
          <Button onClick={() => navigate('/seller/dashboard')}>Go to Seller Dashboard</Button>
        </div>
      );
    }

    if (profile.status === 'Pending') {
      return (
        <div className="apply-seller-status-page glass-card fade-in">
          <div className="status-badge pending-badge">Application Pending</div>
          <h2>Verification in Progress</h2>
          <p>We have received your application for <strong>{profile.storeName}</strong>. Our staff is currently reviewing your merchant credentials.</p>
          <p className="status-tip"><strong>Next Step:</strong> You must upload your KYC Documents (e.g. National ID, Tax Card) to proceed.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => navigate('/seller/documents')}>Upload KYC Documents</Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>Refresh Status</Button>
          </div>
        </div>
      );
    }

    if (profile.status === 'Suspended') {
      return (
        <div className="apply-seller-status-page glass-card fade-in">
          <div className="status-badge error-badge">Account Suspended</div>
          <h2>Access Revoked</h2>
          <p>Your vendor account for <strong>{profile.storeName}</strong> has been suspended due to platform policy violations.</p>
          {profile.rejectionReason && (
            <div className="rejection-box">
              <strong>Suspension Notice:</strong> {profile.rejectionReason}
            </div>
          )}
          <Button variant="secondary" onClick={() => navigate('/contact')}>Contact Support</Button>
        </div>
      );
    }
  }

  // Show signup form if no profile exists or if profile is Rejected (allowing updates)
  const isRejected = profile?.status === 'Rejected';

  return (
    <div className="apply-seller-container">
      <header className="apply-seller-header">
        <h1 className="apply-title">Sell on MenaCart</h1>
        <p className="apply-subtitle">Join Egypt's premier fashion marketplace. Set up your store and reach millions of buyers.</p>
      </header>

      {isRejected && (
        <div className="rejection-banner alert-danger">
          <strong>Application Rejected:</strong> {profile.rejectionReason || 'Please review your details and try again.'}
        </div>
      )}

      <div className="apply-layout-grid">
        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="apply-form-card glass-card">
          {formError && (
            <div className="password-error-alert" role="alert">
              {formError}
            </div>
          )}

          <h3 className="form-card-title">Store Registration</h3>
          
          <Input
            label="Store Name"
            type="text"
            placeholder="e.g. Cairo Chic Boutique"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            helperText="This is the display name buyers will see."
          />

          <div className="input-container">
            <label htmlFor="store-desc-field" className="input-label">
              Store Description
            </label>
            <div className="input-wrapper">
              <textarea
                id="store-desc-field"
                className="input-field textarea-field"
                placeholder="Tell us about the style of fashion you sell, sizing variations, materials..."
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          <Input
            label="Store Address"
            type="text"
            placeholder="e.g. 15 El-Gomhouria St, Heliopolis, Cairo"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
          />

          <div className="profile-grid">
            <Input
              label="Contact Phone"
              type="tel"
              placeholder="e.g. +20 123 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              label="Logo Image URL (Optional)"
              type="url"
              placeholder="https://..."
              value={storeLogoUrl}
              onChange={(e) => setStoreLogoUrl(e.target.value)}
            />
          </div>

          <Input
            label="Store Banner URL (Optional)"
            type="url"
            placeholder="https://..."
            value={storeBannerUrl}
            onChange={(e) => setStoreBannerUrl(e.target.value)}
            helperText="Banner dimensions should be roughly 1200x300 for optimal viewing."
          />

          <div style={{ marginTop: '12px' }}>
            <Button
              type="submit"
              isLoading={applyMutation.isPending || updateMutation.isPending}
            >
              {isRejected ? 'Resubmit Application' : 'Submit Application'}
            </Button>
          </div>
        </form>

        {/* Benefits Sidebar */}
        <aside className="apply-benefits-sidebar glass-card">
          <h3 className="benefits-title">Why Sell on MenaCart?</h3>
          <ul className="benefits-list">
            <li>
              <span className="benefit-icon">📈</span>
              <div>
                <strong>Wide Audience Reach</strong>
                <p>Present your designs directly to targeted fashion shoppers across Egypt.</p>
              </div>
            </li>
            <li>
              <span className="benefit-icon">🛠️</span>
              <div>
                <strong>Vendor Control Panel</strong>
                <p>Easy product listings, stock level updates, and sub-order shipment tracking tools.</p>
              </div>
            </li>
            <li>
              <span className="benefit-icon">🔒</span>
              <div>
                <strong>Secure Payment Hub</strong>
                <p>Payments split automatically via Stripe, protecting seller commissions securely.</p>
              </div>
            </li>
            <li>
              <span className="benefit-icon">📋</span>
              <div>
                <strong>Automatic Returns Review</strong>
                <p>Returns requests are tracked automatically and validated within Egypt's consumer laws.</p>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default ApplySellerPage;
