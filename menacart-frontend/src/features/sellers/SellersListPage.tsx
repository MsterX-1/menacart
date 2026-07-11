import React, { useState, useEffect } from 'react';
import { Search, X, Star } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { getPublicSellers } from '../seller-onboarding/api/sellerOnboardingApi';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import './SellersListPage.css';
import '../home/HomePage.css'; // For seller-card styles

export const SellersListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || undefined;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['sellers', 'public', { search, page: currentPage }],
    queryFn: () => getPublicSellers(search, currentPage, 20),
    placeholderData: keepPreviousData,
  });

  // Debounced search on character change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (searchInput.trim()) {
          params.set('search', searchInput.trim());
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        return params;
      }, { replace: true });
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="sellers-list-page">
      <header className="sellers-header">
        <h1 className="sellers-title">Verified Sellers</h1>
        <p className="sellers-subtitle">Discover our trusted fashion merchants.</p>
      </header>

      <div className="sellers-toolbar-container">
        <div className="sellers-toolbar-unified">
          <div className="unified-search-wrapper">
            <Search className="search-icon-prefix" />
            <input
              type="text"
              className="search-input"
              placeholder="Search sellers by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="search-clear-btn" onClick={() => setSearchInput('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading && !data && (
        <div className="sellers-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="editorial-seller-card" style={{ height: '320px' }}>
              <div className="editorial-seller-banner">
                <LoadingSkeleton variant="rect" height={120} />
              </div>
              <div className="editorial-seller-body">
                <div className="editorial-seller-avatar">
                  <LoadingSkeleton variant="circle" width={64} height={64} />
                </div>
                <div style={{ marginTop: '16px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <LoadingSkeleton variant="text" width={140} height={24} />
                  <LoadingSkeleton variant="text" width={100} height={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="sellers-empty">
          <h2>Error</h2>
          <p>Failed to load sellers.</p>
        </div>
      )}

      {data?.items.length === 0 && !isLoading && (
        <div className="sellers-empty">
          <h2>No sellers found</h2>
          <p>Try adjusting your search criteria.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className={`sellers-grid ${isFetching ? 'sellers-fetching' : ''}`}>
            {data.items.map((seller) => (
              <Link to={`/seller/${seller.sellerId}`} key={seller.sellerId} className="editorial-seller-card">
                <div className="editorial-seller-banner">
                  {seller.storeBannerUrl ? (
                    <img src={getOptimizedImageUrl(seller.storeBannerUrl)} alt="Banner" loading="lazy" />
                  ) : (
                    <div className="editorial-seller-banner-placeholder" />
                  )}
                </div>
                
                <div className="editorial-seller-body">
                  <div className="editorial-seller-avatar">
                    {seller.storeLogoUrl ? (
                      <img src={getOptimizedImageUrl(seller.storeLogoUrl)} alt={seller.storeName} loading="lazy" />
                    ) : (
                      <span>{seller.storeName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <h3 className="editorial-seller-name">{seller.storeName}</h3>
                  
                  <div className="editorial-seller-meta">
                    <div className="seller-rating">
                      <Star size={12} className="star-icon" fill="currentColor" />
                      {seller.rating.toFixed(1)}
                    </div>
                    {seller.isVerified && <span style={{ color: 'var(--color-primary)', fontSize: '14px' }}>✓ Verified</span>}
                  </div>
                  
                  <p className="seller-desc" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {seller.storeDescription || 'A curated selection of premium fashion.'}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="catalog-pagination">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="page-indicator">Page {currentPage} of {data.totalPages}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= data.totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
