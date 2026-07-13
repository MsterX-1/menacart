import React, { useState } from 'react';
import { LuCreditCard, LuLandmark, LuCoins } from 'react-icons/lu';
import { useAvailableBalance, useMyPayouts, useRequestPayout } from './hooks/usePayouts';
import { useMySellerProfile, useUpdateSellerProfile } from '../seller-onboarding/hooks/useSellerOnboarding';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import './SellerPayoutsPage.css';

export const SellerPayoutsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: balanceData, isLoading: balanceLoading } = useAvailableBalance();
  const { data: payouts, isLoading: payoutsLoading } = useMyPayouts();
  const { data: profile, isLoading: profileLoading } = useMySellerProfile();
  
  const requestPayoutMutation = useRequestPayout();
  const updateProfileMutation = useUpdateSellerProfile();

  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'Bank Transfer'>('Stripe');
  const [stripeAccountId, setStripeAccountId] = useState(profile?.stripeAccountId || '');
  const [isEditingStripe, setIsEditingStripe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Link Stripe Account
  const handleLinkStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeAccountId.trim()) {
      toastError('Please enter a valid Stripe Account ID');
      return;
    }

    if (!profile) return;

    try {
      await updateProfileMutation.mutateAsync({
        storeName: profile.storeName || 'My Store',
        storeDescription: profile.storeDescription || '',
        storeAddress: profile.storeAddress || '',
        phone: profile.phone || '0000000000',
        storeLogoUrl: profile.storeLogoUrl || '',
        storeBannerUrl: profile.storeBannerUrl || '',
        stripeAccountId: stripeAccountId.trim(),
        baseShippingCost: profile.baseShippingCost ?? undefined,
        freeShippingThreshold: profile.freeShippingThreshold ?? undefined,
        returnPolicyDays: profile.returnPolicyDays,
      });
      toastSuccess('Stripe Account linked successfully!');
      setIsEditingStripe(false);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0] as string[];
        toastError(firstError[0] || 'Validation failed.');
      } else {
        toastError(data?.message || 'Failed to update Stripe Account ID.');
      }
    }
  };

  // Handle Payout Request Submission
  const handleRequestPayout = async () => {
    setErrorMsg('');
    if (paymentMethod === 'Stripe' && !profile?.stripeAccountId) {
      setErrorMsg('You must link a Stripe Account before requesting a Stripe payout.');
      return;
    }

    try {
      await requestPayoutMutation.mutateAsync({ paymentMethod });
      toastSuccess('Payout request submitted successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Payout request failed.';
      setErrorMsg(msg);
      toastError(msg);
    }
  };

  const isLoading = balanceLoading || payoutsLoading || profileLoading;
  const availableBalance = balanceData?.availableBalance ?? 0;
  const hasBalance = availableBalance > 0;

  if (isLoading) {
    return (
      <div className="seller-payouts-container loading">
        <LoadingSkeleton variant="text" width="250px" height={36} />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton variant="rect" height="150px" />
          <div style={{ marginTop: '20px' }}>
            <LoadingSkeleton variant="rect" height="300px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-payouts-container fade-in">
      <header className="payouts-header">
        <h1 className="payouts-title">Earnings & Payouts</h1>
        <p className="payouts-subtitle">
          Manage your settled vendor commissions and request transfers to your Stripe account or bank account.
        </p>
      </header>

      <div className="payouts-grid">
        {/* Balance & Action Section */}
        <section className="balance-panel">
          <div className="balance-display-container" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="balance-display">
              <span className="balance-label">Available Balance</span>
              <span className="balance-amount">{availableBalance.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</span>
            </div>
            
            <div className="balance-display pending-display">
              <span className="balance-label">Pending Balance (Held for Return Policy)</span>
              <span className="balance-amount" style={{ color: 'var(--color-warning)' }}>
                {(balanceData?.pendingBalance ?? 0).toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}
              </span>
            </div>
          </div>

          <div className="payout-method-selector">
            <label className="section-label">Select Payout Method</label>
            <div className="method-options">
              <button
                type="button"
                className={`method-btn ${paymentMethod === 'Stripe' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Stripe')}
              >
                <span className="method-icon"><LuCreditCard size={20} /></span>
                <span className="method-text">Stripe Connect</span>
              </button>
              <button
                type="button"
                className={`method-btn ${paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Bank Transfer')}
              >
                <span className="method-icon"><LuLandmark size={20} /></span>
                <span className="method-text">Bank Transfer</span>
              </button>
            </div>
          </div>

          {/* Stripe Configuration Check */}
          {paymentMethod === 'Stripe' && (
            <div className="stripe-config-box">
              {profile?.stripeAccountId && !isEditingStripe ? (
                <div className="stripe-linked-view">
                  <div className="linked-indicator">
                    <span className="dot active"></span>
                    <span className="linked-txt">Linked Stripe Account:</span>
                    <code className="stripe-acct-code">{profile.stripeAccountId}</code>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setStripeAccountId(profile.stripeAccountId || ''); setIsEditingStripe(true); }}>
                    Change
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleLinkStripe} className="stripe-link-form">
                  <p className="info-text">
                    Enter your Stripe Connected Account ID (e.g. <code>acct_1Tq...</code>) to enable automated payouts.
                  </p>
                  <div className="form-row">
                    <Input
                      label="Stripe Connected Account ID"
                      type="text"
                      placeholder="acct_1TqsooJuQtgsCqzT"
                      value={stripeAccountId}
                      onChange={(e) => setStripeAccountId(e.target.value)}
                      required
                    />
                    <div className="action-buttons">
                      <Button type="submit" isLoading={updateProfileMutation.isPending}>
                        Link Account
                      </Button>
                      {profile?.stripeAccountId && (
                        <Button variant="ghost" onClick={() => setIsEditingStripe(false)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {paymentMethod === 'Bank Transfer' && (
            <div className="bank-info-box">
              <p className="info-text">
                Payouts requested via Bank Transfer are processed manually by administrators to your registered bank account on file.
              </p>
            </div>
          )}

          {errorMsg && <div className="payout-error-alert">{errorMsg}</div>}

          <div className="payout-submit-action">
            <Button
              onClick={handleRequestPayout}
              disabled={!hasBalance || requestPayoutMutation.isPending || (paymentMethod === 'Stripe' && !profile?.stripeAccountId)}
              isLoading={requestPayoutMutation.isPending}
              variant="primary"
              className="payout-btn"
            >
              Request Payout of {availableBalance.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}
            </Button>
            {!hasBalance && (
              <p className="payout-note">You do not have any settled commissions available for payout.</p>
            )}
          </div>
        </section>

        {/* History Table */}
        <section className="history-panel">
          <h2 className="panel-title">Payout Request History</h2>
          
          {!payouts || payouts.length === 0 ? (
            <div className="empty-history-state">
              <span className="empty-icon"><LuCoins size={40} /></span>
              <p className="empty-text">No payout requests submitted yet.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="payouts-table">
                <thead>
                  <tr>
                    <th>Requested Date</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => {
                    let statusClass = 'status-badge-pending';
                    if (p.status === 'Paid') statusClass = 'status-badge-paid';
                    if (p.status === 'Failed') statusClass = 'status-badge-failed';
                    if (p.status === 'Processing') statusClass = 'status-badge-processing';

                    return (
                      <tr key={p.payoutId}>
                        <td>{new Date(p.createdAt).toLocaleDateString('en-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td>{p.paymentMethod}</td>
                        <td className="amount-col">{p.amount.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>{p.status}</span>
                        </td>
                        <td>
                          {p.transactionRef ? (
                            <code className="ref-code" title={p.transactionRef}>{p.transactionRef.substring(0, 12)}...</code>
                          ) : (
                            <span className="no-ref-text">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SellerPayoutsPage;
