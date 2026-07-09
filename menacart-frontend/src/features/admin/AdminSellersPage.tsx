import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  useAdminSellers, 
  useAdminUpdateSellerStatus,
  useAdminBanSeller,
  useAdminWarnSeller,
  useAdminSellerDocuments,
  useAdminReviewSellerDocument,
  useAdminSellerProfile,
  useAdminUpdateSellerCommission
} from './hooks/useAdminSellers';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import type { SellerResponse } from '../../types/seller';
import './AdminSellersPage.css';

export const AdminSellersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string | null>(searchParams.get('status'));
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data: sellersData, isLoading, error, refetch } = useAdminSellers(statusFilter, page, pageSize);

  const [selectedSeller, setSelectedSeller] = useState<SellerResponse | null>(null);

  useEffect(() => {
    setPage(1);
    setSelectedSeller(null);
  }, [statusFilter]);

  if (isLoading) {
    return (
      <div className="impeccable-admin-sellers loading-state">
        <LoadingSkeleton variant="text" width="300px" height={40} />
        <div style={{ marginTop: '24px' }}>
          <LoadingSkeleton variant="rect" height="400px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="impeccable-admin-sellers error-state">
        <p className="error-text">Failed to load seller applications: {(error as any).message}</p>
        <Button onClick={() => refetch()}>Retry Connection</Button>
      </div>
    );
  }

  const sellers = sellersData?.items || [];
  const totalPages = sellersData?.totalPages || 0;

  return (
    <div className="impeccable-admin-sellers">
      <header className="sellers-header">
        <div className="header-content">
          <h1 className="sellers-title">Merchant Verification</h1>
          <p className="sellers-subtitle">
            Inspect onboarding profiles, verify KYC documents, and manage permissions.
          </p>
        </div>
      </header>

      <div className="sellers-status-filters">
        {([
          { label: 'All Profiles', value: null },
          { label: 'Pending Verification', value: 'Pending' },
          { label: 'Active Sellers', value: 'Active' },
          { label: 'Suspended', value: 'Suspended' },
          { label: 'Rejected', value: 'Rejected' }
        ] as const).map((tab) => (
          <button
            key={tab.label}
            className={`filter-pill ${statusFilter === tab.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sellers-master-detail">
        {/* Left Pane: List */}
        <div className={`sellers-list-pane ${selectedSeller ? 'contracted' : 'expanded'}`}>
          {sellers.length === 0 ? (
            <div className="sellers-empty-state">
              <h2>No Merchants Found</h2>
              <p>Try adjusting your filter criteria to see more results.</p>
            </div>
          ) : (
            <div className="sellers-list">
              {sellers.map((seller) => {
                const isSelected = selectedSeller?.sellerId === seller.sellerId;
                return (
                  <div 
                    key={seller.sellerId}
                    className={`seller-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSeller(seller)}
                  >
                    <div className="seller-list-avatar">
                      {seller.storeName ? seller.storeName[0].toUpperCase() : 'M'}
                    </div>
                    <div className="seller-list-details">
                      <div className="seller-list-top">
                        <strong className="seller-list-name">{seller.storeName}</strong>
                        <span className={`seller-status-indicator status-${seller.status.toLowerCase()}`}>
                          {seller.status}
                        </span>
                      </div>
                      <div className="seller-list-bottom">
                        <span className="seller-list-id">#{seller.sellerId}</span>
                        <span className="seller-list-email">{seller.email}</span>
                        {seller.isVerified && <span className="seller-list-verified">Verified</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="sellers-pagination">
              <button
                className="pagination-btn"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                &larr; Prev
              </button>
              <span className="pagination-text">
                {page} / {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Right Pane: Detail View */}
        {selectedSeller && (
          <div className="seller-detail-pane">
            <SellerDetailView 
              seller={selectedSeller} 
              onClose={() => setSelectedSeller(null)}
              onRefresh={() => refetch()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface SellerDetailViewProps {
  seller: SellerResponse;
  onClose: () => void;
  onRefresh: () => void;
}

const SellerDetailView: React.FC<SellerDetailViewProps> = ({ seller, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'moderation'>('profile');
  
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useAdminSellerProfile(seller.sellerId);
  const { data: documents, isLoading: isDocsLoading, refetch: refetchDocs } = useAdminSellerDocuments(seller.sellerId);
  
  const updateStatusMutation = useAdminUpdateSellerStatus();
  const banMutation = useAdminBanSeller();
  const warnMutation = useAdminWarnSeller();
  const commissionMutation = useAdminUpdateSellerCommission();
  const reviewDocMutation = useAdminReviewSellerDocument();
  
  const { success: toastSuccess, error: toastError } = useToast();

  const [updateStatusVal, setUpdateStatusVal] = useState<'Active' | 'Suspended' | 'Rejected'>('Active');
  const [statusReason, setStatusReason] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [banReason, setBanReason] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});

  useEffect(() => {
    setUpdateStatusVal(seller.status === 'Active' ? 'Active' : seller.status === 'Suspended' ? 'Suspended' : 'Rejected');
    setStatusReason('');
    setWarningMsg('');
    setBanReason('');
    setCommissionRate(seller.commissionRate ? seller.commissionRate.toString() : '');
    setActiveTab('profile');
  }, [seller]);

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStatusMutation.mutateAsync({
        sellerId: seller.sellerId,
        data: {
          status: updateStatusVal,
          reason: statusReason.trim() || null,
        },
      });
      toastSuccess(`Seller account status changed to ${updateStatusVal}.`);
      onRefresh();
      refetchProfile();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to update seller status.');
    }
  };

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningMsg.trim()) return;
    try {
      await warnMutation.mutateAsync({
        sellerId: seller.sellerId,
        warningMessage: warningMsg.trim(),
      });
      toastSuccess('Warning message dispatched to seller.');
      setWarningMsg('');
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to send warning.');
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await commissionMutation.mutateAsync({
        sellerId: seller.sellerId,
        commissionRate: commissionRate.trim() ? parseFloat(commissionRate) : null,
      });
      toastSuccess('Commission rate updated successfully.');
      onRefresh();
      refetchProfile();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to update commission.');
    }
  };

  const handleBanSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banReason.trim()) return;

    if (!window.confirm(`Are you absolutely sure you want to permanently BAN the seller "${seller.storeName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await banMutation.mutateAsync({
        sellerId: seller.sellerId,
        reason: banReason.trim(),
      });
      toastSuccess(`Seller "${seller.storeName}" has been permanently banned.`);
      onClose();
      onRefresh();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to ban seller.');
    }
  };

  const handleReviewDoc = async (documentId: number, status: 'Approved' | 'Rejected') => {
    const reason = rejectionReasons[documentId] || '';
    if (status === 'Rejected' && !reason.trim()) {
      toastError('Rejection reason is required.');
      return;
    }

    try {
      await reviewDocMutation.mutateAsync({
        documentId,
        sellerId: seller.sellerId,
        data: {
          status,
          rejectionReason: status === 'Rejected' ? reason.trim() : null,
        },
      });
      toastSuccess(`Document verification status set to ${status}.`);
      refetchDocs();
      refetchProfile();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to review document.');
    }
  };

  return (
    <div className="detail-view-container">
      <div className="detail-header">
        <div className="detail-header-info">
          <h3 className="detail-store-name">{seller.storeName}</h3>
          <p className="detail-store-id">ID: {seller.sellerId} • {seller.email}</p>
        </div>
        <div className="detail-header-actions">
          <Link 
            to={`/seller/${seller.sellerId}`} 
            target="_blank" 
            className="detail-preview-link"
          >
            Public Storefront ↗
          </Link>
          <button className="detail-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
      </div>

      <div className="detail-tabs">
        <button 
          className={`detail-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile & KYC
        </button>
        <button 
          className={`detail-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          Moderation & Settings
        </button>
      </div>

      <div className="detail-content">
        {activeTab === 'profile' ? (
          <div className="profile-kyc-content">
            {isProfileLoading ? (
              <LoadingSkeleton variant="rect" height="150px" />
            ) : profile ? (
              <div className="profile-summary">
                {profile.storeBannerUrl && (
                  <div className="profile-banner">
                    <img src={profile.storeBannerUrl} alt="Store Banner" />
                  </div>
                )}
                <div className="profile-meta">
                  {profile.storeLogoUrl && (
                    <img src={profile.storeLogoUrl} alt="Logo" className="profile-logo" />
                  )}
                  <div className="profile-meta-text">
                    <p><strong>Phone:</strong> {profile.phone || 'Not Provided'}</p>
                    <p><strong>Address:</strong> {profile.storeAddress || 'Not Provided'}</p>
                    <p><strong>Commission:</strong> {profile.commissionRate != null ? `${profile.commissionRate}%` : 'Default'}</p>
                  </div>
                </div>
                {profile.storeDescription && (
                  <div className="profile-description">
                    <p>{profile.storeDescription}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="error-text">Failed to load detailed profile.</p>
            )}

            <div className="kyc-section">
              <h4 className="section-heading">KYC Documents</h4>
              {isDocsLoading ? (
                <LoadingSkeleton variant="rect" height="100px" />
              ) : documents && documents.length === 0 ? (
                <p className="empty-state-text">No KYC documents uploaded.</p>
              ) : (
                <div className="kyc-documents-list">
                  {documents?.map((doc) => {
                    const isPdf = doc.documentUrl.toLowerCase().endsWith('.pdf');
                    return (
                      <div key={doc.sellerDocumentId} className={`kyc-document-item status-${doc.status.toLowerCase()}`}>
                        <div className="kyc-item-header">
                          <span className="kyc-item-type">{doc.documentType}</span>
                          <span className={`kyc-item-status status-${doc.status.toLowerCase()}`}>{doc.status}</span>
                        </div>
                        <div className="kyc-item-preview">
                          {isPdf ? (
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="kyc-preview-link">
                              View PDF Document &rarr;
                            </a>
                          ) : (
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                              <img src={doc.documentUrl} alt={doc.documentType} className="kyc-thumbnail" />
                            </a>
                          )}
                        </div>
                        {doc.status === 'Pending' && (
                          <div className="kyc-item-actions">
                            <Input
                              label="Rejection Reason"
                              type="text"
                              placeholder="Required for rejection..."
                              value={rejectionReasons[doc.sellerDocumentId] || ''}
                              onChange={(e) => setRejectionReasons(prev => ({ ...prev, [doc.sellerDocumentId]: e.target.value }))}
                            />
                            <div className="kyc-action-buttons">
                              <Button variant="secondary" size="sm" onClick={() => handleReviewDoc(doc.sellerDocumentId, 'Approved')}>Approve</Button>
                              <Button variant="danger" size="sm" onClick={() => handleReviewDoc(doc.sellerDocumentId, 'Rejected')}>Reject</Button>
                            </div>
                          </div>
                        )}
                        {doc.status === 'Rejected' && doc.rejectionReason && (
                          <div className="kyc-rejection-note">
                            <strong>Reason:</strong> {doc.rejectionReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="moderation-content">
            <section className="moderation-section">
              <h4 className="section-heading">Verification Decision</h4>
              <form onSubmit={handleUpdateStatusSubmit} className="moderation-form">
                <div className="status-toggle-group">
                  {['Active', 'Suspended', 'Rejected'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`status-toggle-btn ${updateStatusVal === status ? 'active' : ''}`}
                      onClick={() => setUpdateStatusVal(status as any)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <Input
                  label="Remarks (Optional)"
                  type="text"
                  placeholder="e.g. Identity check failed..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
                <Button type="submit" isLoading={updateStatusMutation.isPending}>Apply Decision</Button>
              </form>
            </section>

            <section className="moderation-section">
              <h4 className="section-heading">Platform Commission Override</h4>
              <form onSubmit={handleUpdateCommission} className="moderation-form">
                <Input
                  label="Rate (%)"
                  type="number"
                  step="0.01"
                  placeholder="Leave blank for platform default"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
                <Button type="submit" isLoading={commissionMutation.isPending} variant="secondary">Save Override</Button>
              </form>
            </section>

            <section className="moderation-section">
              <h4 className="section-heading">Dispatch Notice</h4>
              <form onSubmit={handleSendWarning} className="moderation-form">
                <Input
                  label="Warning Message"
                  type="text"
                  placeholder="Describe violation rules..."
                  value={warningMsg}
                  onChange={(e) => setWarningMsg(e.target.value)}
                  required
                />
                <Button type="submit" variant="secondary" isLoading={warnMutation.isPending}>Send Warning</Button>
              </form>
            </section>

            <section className="moderation-section danger-zone">
              <h4 className="section-heading danger">Permanent Exclusion</h4>
              <form onSubmit={handleBanSeller} className="moderation-form">
                <Input
                  label="Exclusion Reason"
                  type="text"
                  placeholder="Describe bannable offense..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  required
                />
                <Button type="submit" variant="danger" isLoading={banMutation.isPending}>Ban Merchant</Button>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSellersPage;
