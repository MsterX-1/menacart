import React, { useState, useEffect } from 'react';
import { useMySellerProfile, useUpdateSellerProfile } from '../seller-onboarding/hooks/useSellerOnboarding';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ImageUpload } from '../../components/ImageUpload/ImageUpload';

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
  const [returnPolicyDays, setReturnPolicyDays] = useState('14');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');
  const [deliveryProviders, setDeliveryProviders] = useState('');

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
      setReturnPolicyDays(profile.returnPolicyDays != null ? profile.returnPolicyDays.toString() : '14');
      setBankName(profile.bankName || '');
      setAccountNumber(profile.accountNumber || '');
      setAccountHolder(profile.accountHolder || '');
      setIban(profile.iban || '');
      setDeliveryProviders((profile.deliveryProviders || []).join(', '));
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
        baseShippingCost: baseShippingCost.trim() ? parseFloat(baseShippingCost) : undefined,
        freeShippingThreshold: freeShippingThreshold.trim() ? parseFloat(freeShippingThreshold) : undefined,
        returnPolicyDays: returnPolicyDays.trim() ? parseInt(returnPolicyDays, 10) : 14,
        bankName,
        accountNumber,
        accountHolder,
        iban,
        deliveryProviders: deliveryProviders.split(',').map(p => p.trim()).filter(p => p.length > 0),
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
      
      <div className="" style={{ padding: '2rem' }}>
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
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', backgroundColor: 'var(--color-bg-panel)' }}
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
              <ImageUpload
                label="Store Logo Image (Optional)"
                value={storeLogoUrl}
                onChange={setStoreLogoUrl}
              />
            </div>

            <div>
              <ImageUpload
                label="Store Banner Image (Optional)"
                value={storeBannerUrl}
                onChange={setStoreBannerUrl}
              />
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', marginTop: '0.5rem' }}>
            <Input
              label="Return Policy (Days)"
              type="number"
              min="0"
              placeholder="e.g. 14"
              value={returnPolicyDays}
              onChange={(e) => setReturnPolicyDays(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', marginTop: '0.5rem' }}>
            <Input
              label="Delivery Providers (Comma Separated)"
              type="text"
              placeholder="e.g. Aramex, DHL, FedEx"
              value={deliveryProviders}
              onChange={(e) => setDeliveryProviders(e.target.value)}
            />
          </div>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Bank Information (For Payouts)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input
              label="Bank Name"
              type="text"
              placeholder="e.g. National Bank of Egypt"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <Input
              label="Account Holder Name"
              type="text"
              placeholder="e.g. John Doe"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
            <Input
              label="Account Number"
              type="text"
              placeholder="e.g. 1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
            <Input
              label="IBAN (Optional)"
              type="text"
              placeholder="e.g. EG1200..."
              value={iban}
              onChange={(e) => setIban(e.target.value)}
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
