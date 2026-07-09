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

  // Selected merchant for the split-pane view
  const [selectedSeller, setSelectedSeller] = useState<SellerResponse | null>(null);

  // If filter changes, reset page and clear selection
  useEffect(() => {
    setPage(1);
    setSelectedSeller(null);
  }, [statusFilter]);

  if (isLoading) {
    return (
      <div className="admin-sellers-container loading">
        <LoadingSkeleton variant="text" width="200px" height={32} />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton variant="rect" height="400px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-sellers-container error ">
        <p className="error-text">Failed to load seller applications: {(error as any).message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const sellers = sellersData?.items || [];
  const totalPages = sellersData?.totalPages || 0;

  return (
    <div className="admin-sellers-container">
      <div className="admin-sellers-header">
        <div>
          <h1 className="admin-sellers-title">Merchant Verification & Moderation</h1>
          <p className="admin-sellers-subtitle">
            Inspect onboarding profiles, verify KYC file uploads, and manage seller permissions dynamically.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="seller-status-tabs">
        {([
          { label: 'All Profiles', value: null },
          { label: 'Pending Verification', value: 'Pending' },
          { label: 'Active Sellers', value: 'Active' },
          { label: 'Suspended Accounts', value: 'Suspended' },
          { label: 'Rejected Applicants', value: 'Rejected' }
        ] as const).map((tab) => (
          <button
            key={tab.label}
            className={`status-tab-btn ${statusFilter === tab.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-sellers-split-layout">
        {/* Left Pane: Table */}
        <div className={`sellers-table-pane ${selectedSeller ? 'split' : 'full-width'}`}>
          {sellers.length === 0 ? (
            <div className="sellers-empty">
              <h2>No Sellers Found</h2>
              <p>No merchant accounts fit your current filter option.</p>
            </div>
          ) : (
            <>
              <table className="sellers-table">
                <thead>
                  <tr>
                    <th>Store Details</th>
                    <th>Email</th>
                    <th>KYC</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => {
                    const isCurrent = selectedSeller?.sellerId === seller.sellerId;
                    return (
                      <tr 
                        key={seller.sellerId}
                        className={`seller-row-item ${isCurrent ? 'selected-row' : ''}`}
                        onClick={() => setSelectedSeller(seller)}
                      >
                        <td>
                          <div className="store-cell-info">
                            <div className="store-avatar">
                              {seller.storeName ? seller.storeName[0]?.toUpperCase() : 'M'}
                            </div>
                            <div className="store-text-meta">
                              <strong className="seller-table-store-name">{seller.storeName}</strong>
                              <span className="seller-table-id">ID: #{seller.sellerId}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="seller-table-email">{seller.email}</span>
                        </td>
                        <td>
                          <span className={`verification-badge ${seller.isVerified ? 'verified' : 'unverified'}`}>
                            {seller.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge doc-${seller.status.toLowerCase()}`}>
                            {seller.status}
                          </span>
                        </td>
                        <td>
                          <Button 
                            variant={isCurrent ? 'primary' : 'secondary'} 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSeller(seller);
                            }}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="reviews-pagination">
                  <button
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    &larr; Prev
                  </button>
                  <span className="pagination-info">
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
            </>
          )}
        </div>

        {/* Right Pane: Unified Management & Control Panel */}
        {selectedSeller && (
          <div className="seller-control-pane ">
            <SellerControlCenter 
              seller={selectedSeller} 
              onClose={() => setSelectedSeller(null)}
              onRefresh={() => {
                refetch();
                // Optionally refresh selection details if they change status
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Subcomponent: Unified Control Center ---
interface SellerControlCenterProps {
  seller: SellerResponse;
  onClose: () => void;
  onRefresh: () => void;
}

const SellerControlCenter: React.FC<SellerControlCenterProps> = ({ seller, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'moderation'>('profile');
  
  // Data Fetching
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useAdminSellerProfile(seller.sellerId);
  const { data: documents, isLoading: isDocsLoading, refetch: refetchDocs } = useAdminSellerDocuments(seller.sellerId);
  
  // Mutations
  const updateStatusMutation = useAdminUpdateSellerStatus();
  const banMutation = useAdminBanSeller();
  const warnMutation = useAdminWarnSeller();
  const commissionMutation = useAdminUpdateSellerCommission();
  const reviewDocMutation = useAdminReviewSellerDocument();
  
  const { success: toastSuccess, error: toastError } = useToast();

  // Local Form States
  const [updateStatusVal, setUpdateStatusVal] = useState<'Active' | 'Suspended' | 'Rejected'>('Active');
  const [statusReason, setStatusReason] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [banReason, setBanReason] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});

  // Synchronize form states on seller change
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

    if (!window.confirm(`Are you absolutely sure you want to permanently BAN the seller "${seller.storeName}" and lock their email? This cannot be undone.`)) {
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
      refetchProfile(); // Verification status changes when docs get approved
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to review document.');
    }
  };

  return (
    <div className="seller-control-center">
      {/* Panel Header */}
      <div className="control-center-header">
        <div className="header-meta">
          <h3 className="control-store-name">{seller.storeName}</h3>
          <div className="store-subheading">
            <span className="store-id-badge">ID: #{seller.sellerId}</span>
            <span className={`status-badge doc-${seller.status.toLowerCase()}`}>
              {seller.status}
            </span>
          </div>
        </div>
        <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
          &times;
        </button>
      </div>

      <div className="control-actions-preview">
        <Link 
          to={`/seller/${seller.sellerId}`} 
          target="_blank" 
          className="btn-preview-link public-preview-btn"
        >
          View Public Storefront ↗
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="control-tabs">
        <button 
          className={`control-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile & KYC Docs
        </button>
        <button 
          className={`control-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          Security & Moderation
        </button>
      </div>

      <div className="control-tab-content">
        {activeTab === 'profile' ? (
          <div className="profile-kyc-tab">
            {isProfileLoading ? (
              <div className="tab-loading">
                <LoadingSkeleton variant="rect" height="150px" />
              </div>
            ) : profile ? (
              <div className="seller-profile-card">
                {profile.storeBannerUrl && (
                  <div className="profile-banner-container">
                    <img src={profile.storeBannerUrl} alt="Store Banner" className="profile-banner" />
                  </div>
                )}
                <div className="profile-details-grid">
                  {profile.storeLogoUrl && (
                    <img src={profile.storeLogoUrl} alt="Logo" className="profile-logo" />
                  )}
                  <div className="profile-text-info">
                    <p><strong>Phone:</strong> {profile.phone || 'Not Provided'}</p>
                    <p><strong>Address:</strong> {profile.storeAddress || 'Not Provided'}</p>
                    <p><strong>Commission:</strong> {profile.commissionRate != null ? `${profile.commissionRate}%` : 'Default platform rate'}</p>
                    <p><strong>Shipping:</strong> {profile.baseShippingCost != null ? `${profile.baseShippingCost} EGP` : 'Default'} (Free threshold: {profile.freeShippingThreshold != null ? `${profile.freeShippingThreshold} EGP` : 'None'})</p>
                  </div>
                </div>
                {profile.storeDescription && (
                  <div className="profile-desc-block">
                    <strong>Description:</strong>
                    <p className="profile-desc-text">{profile.storeDescription}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="error-text">Failed to load detailed profile.</p>
            )}

            <hr className="modal-divider-row" />

            <div className="kyc-files-section">
              <h4>KYC Documents</h4>
              {isDocsLoading ? (
                <div style={{ textAlign: 'center', padding: '15px' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading files...</p>
                </div>
              ) : documents && documents.length === 0 ? (
                <p className="no-docs-text">This merchant has not uploaded KYC documents yet.</p>
              ) : (
                <div className="kyc-inspection-list">
                  {documents?.map((doc) => {
                    const isPdf = doc.documentUrl.toLowerCase().endsWith('.pdf');
                    return (
                      <div key={doc.sellerDocumentId} className={`inspection-doc-card doc-status-${doc.status.toLowerCase()}`}>
                        <div className="inspection-doc-header">
                          <span className="inspection-doc-badge">{doc.documentType}</span>
                          <span className={`status-badge doc-${doc.status.toLowerCase()}`}>{doc.status}</span>
                        </div>

                        <div className="inspection-doc-preview-area">
                          {isPdf ? (
                            <div className="pdf-preview-box">
                              <span>📄 PDF File</span>
                              <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-preview-link">
                                Open Document &rarr;
                              </a>
                            </div>
                          ) : (
                            <div className="image-preview-box">
                              <img src={doc.documentUrl} alt={doc.documentType} className="kyc-preview-img" />
                              <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-preview-link">
                                Open Full Image &rarr;
                              </a>
                            </div>
                          )}
                        </div>

                        {doc.status === 'Pending' && (
                          <div className="inspection-actions-row">
                            <Input
                              label="Rejection Reason"
                              type="text"
                              placeholder="Required if rejecting..."
                              value={rejectionReasons[doc.sellerDocumentId] || ''}
                              onChange={(e) => 
                                setRejectionReasons(prev => ({ ...prev, [doc.sellerDocumentId]: e.target.value }))
                              }
                            />
                            <div className="actions-button-group">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleReviewDoc(doc.sellerDocumentId, 'Approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => handleReviewDoc(doc.sellerDocumentId, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        {doc.status === 'Rejected' && doc.rejectionReason && (
                          <div className="doc-rejection-box">
                            <strong>Rejection Reason:</strong> {doc.rejectionReason}
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
          <div className="moderation-tab">
            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatusSubmit} className="moderation-section-form">
              <h4>Update Verification Status</h4>
              <div className="input-container">
                <label className="input-label" htmlFor="moderate-status-select">Status</label>
                <div className="input-wrapper">
                  <select
                    id="moderate-status-select"
                    className="input-field select-field"
                    value={updateStatusVal}
                    onChange={(e) => setUpdateStatusVal(e.target.value as any)}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <Input
                label="Remarks (Optional)"
                type="text"
                placeholder="e.g. Identity check failed..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />

              <Button type="submit" isLoading={updateStatusMutation.isPending}>
                Apply Status
              </Button>
            </form>

            <hr className="modal-divider-row" />

            {/* Commission Override */}
            <form onSubmit={handleUpdateCommission} className="moderation-section-form">
              <h4>Platform Commission Override</h4>
              <Input
                label="Commission Rate (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Leave blank for platform default"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
              <Button type="submit" isLoading={commissionMutation.isPending}>
                Save Commission Override
              </Button>
            </form>

            <hr className="modal-divider-row" />

            {/* Warning System */}
            <form onSubmit={handleSendWarning} className="moderation-section-form">
              <h4>Dispatch Warn Notice</h4>
              <Input
                label="Warning Reason / Content"
                type="text"
                placeholder="Describe violation rules..."
                value={warningMsg}
                onChange={(e) => setWarningMsg(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" isLoading={warnMutation.isPending}>
                Send Warning
              </Button>
            </form>

            <hr className="modal-divider-row" />

            {/* Permanent Exclusion */}
            <form onSubmit={handleBanSeller} className="moderation-section-form">
              <h4 style={{ color: 'var(--color-error)' }}>Account Permanent Exclusion</h4>
              <Input
                label="Exclusion Reason"
                type="text"
                placeholder="Describe bannable offense..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
              />
              <Button type="submit" variant="danger" isLoading={banMutation.isPending}>
                Exclude & Ban Merchant
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSellersPage;
