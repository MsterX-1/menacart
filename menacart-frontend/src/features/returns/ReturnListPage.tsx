import React, { useState } from 'react';
import { useMyReturns } from './hooks/useReturns';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import './ReturnListPage.css';

export const ReturnListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: returns, isLoading, error } = useMyReturns(page, pageSize);

  if (isLoading) {
    return (
      <div className="returns-list-page">
        <header className="returns-header">
          <LoadingSkeleton variant="text" width="180px" height={32} />
        </header>
        <div className="returns-skeleton-list">
          {Array.from({ length: 3 }).map((_, idx) => (
            <LoadingSkeleton key={idx} variant="rect" height="140px" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !returns) {
    return (
      <div className="returns-error-container">
        <h2>Failed to load your returns</h2>
        <p>There was a problem loading your return history. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const isEmpty = returns.length === 0;

  return (
    <div className="returns-list-page">
      <header className="returns-header">
        <h1 className="returns-title">Your Return & Exchange Requests</h1>
        <p className="returns-subtitle">Monitor and review the status of your requests.</p>
      </header>

      {isEmpty ? (
        <div className="returns-empty-state">
          <div className="empty-returns-icon">&#10226;</div>
          <h2>No return requests yet</h2>
          <p>If you have any eligible items, you can request returns or exchanges directly from your Order Details.</p>
        </div>
      ) : (
        <div className="returns-layout-container">
          <div className="returns-list">
            {returns.map((ret) => (
              <div key={ret.returnId} className="return-list-card shadow-card">
                <div className="return-card-header">
                  <div className="return-header-meta">
                    <div className="meta-col">
                      <span className="meta-title">Date Requested</span>
                      <span className="meta-data">
                        {new Date(ret.createdAt).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </div>
                    <div className="meta-col">
                      <span className="meta-title">Type</span>
                      <span className="meta-data type-badge">{ret.type}</span>
                    </div>
                    <div className="meta-col">
                      <span className="meta-title">Return ID</span>
                      <span className="meta-data">#{ret.returnId}</span>
                    </div>
                  </div>
                  <div className="return-header-status">
                    <span className={`status-badge-text status-${ret.status.toLowerCase()}`}>
                      {ret.status}
                    </span>
                  </div>
                </div>

                <div className="return-card-body">
                  <div className="return-product-details">
                    <h3 className="return-product-name">{ret.productName}</h3>
                    <div className="return-specs-row">
                      {ret.color && <span className="spec-badge">Color: {ret.color}</span>}
                      {ret.size && <span className="spec-badge">Size: {ret.size}</span>}
                      <span className="spec-badge">Qty: {ret.quantity}</span>
                    </div>
                  </div>

                  <div className="return-reason-box">
                    <span className="reason-label">Reason:</span>
                    <p className="reason-text">{ret.reason}</p>
                  </div>

                  {ret.type === 'Exchange' && ret.exchangeVariantSku && (
                    <div className="exchange-info-box">
                      <span className="info-label">Exchanging for variant SKU:</span>
                      <span className="sku-badge">{ret.exchangeVariantSku}</span>
                    </div>
                  )}

                  {ret.refundAmount !== null && ret.refundAmount !== undefined && (
                    <div className="refund-amount-row">
                      <span className="refund-label">Refund Amount:</span>
                      <span className="refund-value">{ret.refundAmount.toFixed(2)} EGP</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
};
