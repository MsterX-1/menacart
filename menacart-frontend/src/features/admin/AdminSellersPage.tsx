import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string | null>(searchParams.get('status'));
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data: sellersData, isLoading, error, refetch } = useAdminSellers(statusFilter, page, pageSize);

  // Moderate Account Modal State
  const [selectedSeller, setSelectedSeller] = useState<SellerResponse | null>(null);
  const [isModerateModalOpen, setIsModerateModalOpen] = useState(false);
  const [updateStatusVal, setUpdateStatusVal] = useState<'Active' | 'Suspended' | 'Rejected'>('Active');
  const [statusReason, setStatusReason] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [banReason, setBanReason] = useState('');
  const [commissionRate, setCommissionRate] = useState('');

  // KYC Review Modal State
  const [kycSeller, setKycSeller] = useState<SellerResponse | null>(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  const updateStatusMutation = useAdminUpdateSellerStatus();
  const banMutation = useAdminBanSeller();
  const warnMutation = useAdminWarnSeller();
  const commissionMutation = useAdminUpdateSellerCommission();

  const handleOpenModerate = (seller: SellerResponse) => {
    setSelectedSeller(seller);
    setUpdateStatusVal(seller.status === 'Active' ? 'Suspended' : 'Active');
    setStatusReason('');
    setWarningMsg('');
    setBanReason('');
    setCommissionRate(seller.commissionRate ? seller.commissionRate.toString() : '');
    setIsModerateModalOpen(true);
  };

  const handleOpenKyc = (seller: SellerResponse) => {
    setKycSeller(seller);
    setIsKycModalOpen(true);
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) return;

    try {
      await updateStatusMutation.mutateAsync({
        sellerId: selectedSeller.sellerId,
        data: {
          status: updateStatusVal,
          reason: statusReason.trim() || null,
        },
      });
      toastSuccess(`Seller account status changed to ${updateStatusVal}.`);
      setIsModerateModalOpen(false);
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to update seller status.');
    }
  };

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller || !warningMsg.trim()) return;

    try {
      await warnMutation.mutateAsync({
        sellerId: selectedSeller.sellerId,
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
    if (!selectedSeller) return;

    try {
      await commissionMutation.mutateAsync({
        sellerId: selectedSeller.sellerId,
        commissionRate: commissionRate.trim() ? parseFloat(commissionRate) : null,
      });
      toastSuccess('Commission rate updated successfully.');
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to update commission.');
    }
  };

  const handleBanSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller || !banReason.trim()) return;

    if (!window.confirm(`Are you absolutely sure you want to permanently BAN the seller "${selectedSeller.storeName}" and lock their email? This cannot be undone.`)) {
      return;
    }

    try {
      await banMutation.mutateAsync({
        sellerId: selectedSeller.sellerId,
        reason: banReason.trim(),
      });
      toastSuccess(`Seller "${selectedSeller.storeName}" has been banned permanently.`);
      setIsModerateModalOpen(false);
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to ban seller.');
    }
  };

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
      <div className="admin-sellers-container error glass-card">
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
          <h1 className="admin-sellers-title">Seller Verification & Moderation</h1>
          <p className="admin-sellers-subtitle">Inspect onboarding applications, verify KYC file uploads, and manage seller permissions.</p>
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
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sellers.length === 0 ? (
        <div className="sellers-empty glass-card">
          <h2>No Sellers Found</h2>
          <p>No merchant accounts fit your current filter option.</p>
        </div>
      ) : (
        <div className="sellers-table-wrapper glass-card">
          <table className="sellers-table">
            <thead>
              <tr>
                <th>Store Details</th>
                <th>Seller Email</th>
                <th>Registered Date</th>
                <th>KYC Verification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => {
                const formattedDate = new Date(seller.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <tr key={seller.sellerId}>
                    <td>
                      <strong className="seller-table-store-name">{seller.storeName}</strong>
                      <span className="seller-table-id">Seller ID: #{seller.sellerId}</span>
                    </td>
                    <td>{seller.email}</td>
                    <td>{formattedDate}</td>
                    <td>
                      <span className={`verification-badge ${seller.isVerified ? 'verified' : 'unverified'}`}>
                        {seller.isVerified ? '✓ Verified' : '✗ Unverified'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge doc-${seller.status.toLowerCase()}`}>
                        {seller.status}
                      </span>
                    </td>
                    <td>
                      <div className="sellers-table-actions">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleOpenKyc(seller)}
                        >
                          Verify Documents
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleOpenModerate(seller)}
                        >
                          Moderate
                        </Button>
                      </div>
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
                &larr; Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
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
      )}

      {/* KYC Documents inspection Modal */}
      {isKycModalOpen && kycSeller && (
        <KYCDocumentsReviewModal
          seller={kycSeller}
          onClose={() => setIsKycModalOpen(false)}
        />
      )}

      {/* Moderation Controls Modal */}
      {isModerateModalOpen && selectedSeller && (
        <div className="modal-backdrop fade-in" onClick={() => setIsModerateModalOpen(false)}>
          <div className="modal-content glass-card slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Moderate Account: {selectedSeller.storeName}</h3>
              <button className="modal-close-btn" onClick={() => setIsModerateModalOpen(false)}>
                &times;
              </button>
            </div>

            <div className="moderation-modal-layout">
              {/* Account Status Form */}
              <form onSubmit={handleUpdateStatusSubmit} className="moderation-section-form">
                <h4>Update Status</h4>
                <div className="input-container">
                  <label className="input-label" htmlFor="moderate-status-select">Account Status</label>
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
                  label="Reason / Remarks (Optional)"
                  type="text"
                  placeholder="e.g. Identity check failed..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />

                <Button type="submit" isLoading={updateStatusMutation.isPending}>
                  Apply Status Update
                </Button>
              </form>

              <hr className="modal-divider-row" />

              {/* Commission Form */}
              <form onSubmit={handleUpdateCommission} className="moderation-section-form">
                <h4>Update Commission Rate</h4>
                <Input
                  label="Commission Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 10 (Leave empty for default)"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
                <Button type="submit" isLoading={commissionMutation.isPending}>
                  Apply Commission Update
                </Button>
              </form>

              <hr className="modal-divider-row" />

              {/* Warning Form */}
              <form onSubmit={handleSendWarning} className="moderation-section-form">
                <h4>Send Warning Warning</h4>
                <Input
                  label="Warning Message"
                  type="text"
                  placeholder="Reason for warning..."
                  value={warningMsg}
                  onChange={(e) => setWarningMsg(e.target.value)}
                  required
                />
                <Button type="submit" variant="secondary" isLoading={warnMutation.isPending}>
                  Send Warning Notice
                </Button>
              </form>

              <hr className="modal-divider-row" />

              {/* Ban Form */}
              <form onSubmit={handleBanSeller} className="moderation-section-form">
                <h4 style={{ color: 'var(--color-error)' }}>Account Exclusion</h4>
                <Input
                  label="Reason for Permaban"
                  type="text"
                  placeholder="Exclusion reason..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  required
                />
                <Button type="submit" variant="danger" isLoading={banMutation.isPending}>
                  Ban Seller Account Permanently
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Subcomponent: KYC Documents Review Modal ---
interface KYCDocumentsReviewModalProps {
  seller: SellerResponse;
  onClose: () => void;
}

const KYCDocumentsReviewModal: React.FC<KYCDocumentsReviewModalProps> = ({ seller, onClose }) => {
  const { data: documents, isLoading, error } = useAdminSellerDocuments(seller.sellerId);
  const { data: profile } = useAdminSellerProfile(seller.sellerId);
  
  const reviewDocMutation = useAdminReviewSellerDocument();
  const { success: toastSuccess, error: toastError } = useToast();

  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});

  const handleReview = async (documentId: number, status: 'Approved' | 'Rejected') => {
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
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to review document.');
    }
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="modal-content glass-card slide-up kyc-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Inspect Seller KYC: {seller.storeName}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Profile Meta */}
        {profile && (
          <div className="kyc-review-seller-profile-summary" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {profile.storeBannerUrl && (
              <div>
                <strong>Store Banner:</strong>
                <img src={profile.storeBannerUrl} alt="Banner" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginTop: '5px' }} />
              </div>
            )}
            {profile.storeLogoUrl && (
              <div>
                <strong>Store Logo:</strong>
                <img src={profile.storeLogoUrl} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', marginTop: '5px', display: 'block' }} />
              </div>
            )}
            <div>
              <strong>Store Description:</strong> {profile.storeDescription || 'Not Provided'}
            </div>
            <div>
              <strong>Shop Address:</strong> {profile.storeAddress || 'Not Provided'}
            </div>
            <div>
              <strong>Phone Number:</strong> {profile.phone}
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p>Fetching uploaded KYC files...</p>
          </div>
        ) : error ? (
          <p className="error-text">Failed to fetch documents.</p>
        ) : documents && documents.length === 0 ? (
          <div className="kyc-modal-empty">
            <p>This seller has not uploaded any documents yet.</p>
          </div>
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
                        <span>📄 PDF Document</span>
                        <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-preview-link">
                          Open PDF in New Tab &rarr;
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
                      <div className="rejection-input-group">
                        <Input
                          label="Rejection Reason (Required if rejecting)"
                          type="text"
                          placeholder="e.g. Image blurry..."
                          value={rejectionReasons[doc.sellerDocumentId] || ''}
                          onChange={(e) => 
                            setRejectionReasons(prev => ({ ...prev, [doc.sellerDocumentId]: e.target.value }))
                          }
                        />
                      </div>
                      <div className="actions-button-group">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReview(doc.sellerDocumentId, 'Approved')}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleReview(doc.sellerDocumentId, 'Rejected')}
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
  );
};
export default AdminSellersPage;
