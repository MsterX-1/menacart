import React from 'react';
import { useLoyalty } from '../../orders/hooks/useOrders';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export const LoyaltyTab: React.FC = () => {
  const { data: loyalty, isLoading, error } = useLoyalty();

  if (isLoading) {
    return (
      <div className="loyalty-tab-loading">
        <LoadingSkeleton variant="text" width="200px" height={32} />
        <LoadingSkeleton variant="rect" height="150px" />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton variant="rect" height="80px" />
          <div style={{ marginTop: '10px' }}>
            <LoadingSkeleton variant="rect" height="80px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !loyalty) {
    return (
      <div className="loyalty-tab-error glass-card">
        <p className="error-text">Failed to load loyalty details. Please try again later.</p>
      </div>
    );
  }

  // Conversion rate (e.g. 10 Points = 1 EGP discount, let's keep it clean or make it dynamic if we know it.
  // In checkout we saw: '1 Point = 1.00 EGP' or 'userPoints / pointsToCurrencyRate'.
  // Actually, the default configuration for PointsToCurrencyRate in the backend appsettings is 10.
  // So 10 points = 1 EGP. Let's make it state "10 points = 1.00 EGP discount value".
  const pointValueEgp = (loyalty.balance / 10).toFixed(2);

  return (
    <div className="loyalty-details-section">
      <h2 className="tab-title">MenaCart Loyalty Club</h2>
      <p className="tab-subtitle">Earn points with every purchase and redeem them for exclusive discounts.</p>

      {/* Points Card */}
      <div className="loyalty-balance-card glass-card">
        <div className="loyalty-points-circle">
          <span className="points-amount">{loyalty.balance}</span>
          <span className="points-label">Total Points</span>
        </div>

        <div className="loyalty-value-info">
          <div className="value-label">Estimated Cash Value</div>
          <div className="value-amount">{pointValueEgp} EGP</div>
          <p className="value-help">Points are redeemable at checkout. Rate: 10 Points = 1.00 EGP.</p>
        </div>
      </div>

      {/* Ledger History */}
      <div className="loyalty-history-section">
        <h3 className="history-title">Transaction History</h3>
        
        {loyalty.ledger.length === 0 ? (
          <div className="empty-history-card glass-card">
            <p className="empty-text">No points transactions recorded yet. Place an order to earn points!</p>
          </div>
        ) : (
          <div className="loyalty-ledger-timeline">
            {loyalty.ledger.map((entry) => {
              const isPositive = entry.points > 0;
              const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={entry.pointsId} className="timeline-item glass-card">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content-row">
                    <div className="ledger-details">
                      <span className="ledger-reason">{entry.reason}</span>
                      <span className="ledger-date">{formattedDate}</span>
                    </div>
                    <div className={`ledger-points ${isPositive ? 'points-earn' : 'points-redeem'}`}>
                      {isPositive ? '+' : ''}{entry.points} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
