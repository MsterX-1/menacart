import React, { useState, useEffect } from 'react';
import { useMySellerProfile, useUpdateSellerProfile } from '../seller-onboarding/hooks/useSellerOnboarding';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const SellerSettingsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: profile, isLoading } = useMySellerProfile();
  const updateMutation = useUpdateSellerProfile();

  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [storeBannerUrl, setStoreBannerUrl] = useState('');
  const [baseShippingCost, setBaseShippingCost] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');

  useEffect(() => {
    if (profile) {
      setStoreName(profile.storeName || '');
      setStoreDescription(profile.storeDescription || '');
      setStoreAddress(profile.storeAddress || '');
      setPhone(profile.phone || '');
      setStoreLogoUrl(profile.storeLogoUrl || '');
      setStoreBannerUrl(profile.storeBannerUrl || '');
      setBaseShippingCost(profile.baseShippingCost != null ? profile.baseShippingCost.toString() : '');
      setFreeShippingThreshold(profile.freeShippingThreshold != null ? profile.freeShippingThreshold.toString() : '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        storeName,
        storeDescription,
        storeAddress,
        phone,
        storeLogoUrl,
        storeBannerUrl,
        baseShippingCost: baseShippingCost.trim() ? parseFloat(baseShippingCost) : null,
        freeShippingThreshold: freeShippingThreshold.trim() ? parseFloat(freeShippingThreshold) : null,
      });
      toastSuccess('Profile updated successfully!');
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to update profile.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSkeleton variant="rect" height="400px" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No seller profile found. Please apply to become a seller first.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 700 }}>Store Settings</h1>
      
      <div className="glass-card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Input
            label="Store Name"
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />

          <div className="input-container">
            <label className="input-label">Store Description</label>
            <div className="input-wrapper">
              <textarea
                className="input-field textarea-field"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                maxLength={500}
                rows={4}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}
              />
            </div>
          </div>

          <Input
            label="Store Address"
            type="text"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            required
          />

          <Input
            label="Contact Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <Input
                label="Store Logo URL"
                type="url"
                value={storeLogoUrl}
                onChange={(e) => setStoreLogoUrl(e.target.value)}
              />
              {storeLogoUrl && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={storeLogoUrl} alt="Logo Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                </div>
              )}
            </div>

            <div>
              <Input
                label="Store Banner URL"
                type="url"
                value={storeBannerUrl}
                onChange={(e) => setStoreBannerUrl(e.target.value)}
              />
              {storeBannerUrl && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={storeBannerUrl} alt="Banner Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
            <Input
              label="Base Shipping Cost (EGP)"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 50 (Leave empty for default)"
              value={baseShippingCost}
              onChange={(e) => setBaseShippingCost(e.target.value)}
            />
            <Input
              label="Free Shipping Threshold (EGP)"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 500 (Leave empty for no free shipping)"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
