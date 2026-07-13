import React, { useState } from 'react';
import { LuArrowLeftRight } from 'react-icons/lu';
import { useSellerReturns } from './hooks/useSellerReturns';
import { SellerReturnReviewModal } from './components/SellerReturnReviewModal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import type { ReturnResponse } from '../../types/return';
import './SellerReturnListPage.css';

export const SellerReturnListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: returns, isLoading, error, refetch } = useSellerReturns(page, pageSize);

  // Modal State
  const [selectedReturn, setSelectedReturn] = useState<ReturnResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenReview = (ret: ReturnResponse) => {
    setSelectedReturn(ret);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="seller-returns-page">
        <header className="seller-returns-header">
          <LoadingSkeleton variant="text" width="200px" height={32} />
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: '24px' }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <LoadingSkeleton key={idx} variant="rect" height="80px" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !returns) {
    return (
      <div className="seller-returns-error">
        <h2>Failed to load return requests</h2>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="seller-returns-page">
      <header className="seller-returns-header">
        <div>
          <h1 className="seller-returns-title">Returns & Exchanges</h1>
          <p className="seller-returns-subtitle">
            Manage buyer returns, refunds and exchange requests for your store items.
          </p>
        </div>
      </header>

      {returns.length === 0 ? (
        <div className="seller-returns-empty">
          <div className="empty-box-icon"><LuArrowLeftRight size={48} /></div>
          <h3>No return requests found</h3>
          <p>When buyers request a return or exchange for your store products, they will show up here.</p>
        </div>
      ) : (
        <div className="seller-returns-container">
          <div className="returns-table-wrapper shadow-card">
            <table className="returns-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Product Details</th>
                  <th>Type</th>
                  <th>Refund Amount</th>
                  <th>Status</th>
                  <th>Date Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => (
                  <tr key={ret.returnId}>
                    <td className="font-highlight">#{ret.returnId}</td>
                    <td>
                      <div className="product-info-cell">
                        <span className="product-name">{ret.productName}</span>
                        <div className="product-specs">
                          {ret.color && <span>Col: {ret.color}</span>}
                          {ret.size && <span>Size: {ret.size}</span>}
                          <span>Qty: {ret.quantity}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge-text type-${ret.type.toLowerCase()}`}>
                        {ret.type}
                      </span>
                    </td>
                    <td>
                      {ret.refundAmount !== null ? (
                        <span className="refund-amount">{ret.refundAmount.toFixed(2)} EGP</span>
                      ) : (
                        <span className="refund-none">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge-text status-${ret.status.toLowerCase()}`}>
                        {ret.status}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(ret.createdAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </td>
                    <td>
                      {['Requested', 'Approved'].includes(ret.status) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenReview(ret)}
                        >
                          Review Request
                        </Button>
                      ) : (
                        <span className="action-completed-text">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Controls */}
          {returns.length === pageSize && (
            <div className="pagination-row">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous Page
              </Button>
              <span className="page-number">Page {page}</span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
              >
                Next Page
              </Button>
            </div>
          )}
        </div>
      )}

      <SellerReturnReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ret={selectedReturn}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};
