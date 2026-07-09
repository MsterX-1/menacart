import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['sellers', 'public', { search, page: currentPage }],
    queryFn: () => getPublicSellers(search, currentPage, 20),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  return (
    <div className="sellers-list-page">
      <header className="sellers-header">
        <h1 className="sellers-title">Verified Sellers</h1>
        <p className="sellers-subtitle">Discover our trusted fashion merchants.</p>
      </header>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Search sellers by name…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button type="submit" size="sm">Search</Button>
      </form>

      {isLoading && (
        <div className="sellers-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 280, borderRadius: 16, overflow: 'hidden' }}>
              <LoadingSkeleton variant="rect" height={280} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="sellers-empty">
          <p>Failed to load sellers.</p>
        </div>
      )}

      {!isLoading && !error && data?.items.length === 0 && (
        <div className="sellers-empty">
          <h2>No sellers found</h2>
          <p>Try adjusting your search criteria.</p>
        </div>
      )}

      {!isLoading && !error && data && data.items.length > 0 && (
        <>
          <div className="sellers-grid">
            {data.items.map((seller) => (
              <Link to={`/seller/${seller.sellerId}`} key={seller.sellerId} className="seller-card" style={{ width: '100%' }}>
                {seller.storeBannerUrl ? (
                  <img src={getOptimizedImageUrl(seller.storeBannerUrl)} alt="Banner" className="seller-banner" loading="lazy" />
                ) : (
                  <div className="seller-banner-placeholder" />
                )}
                {seller.storeLogoUrl ? (
                  <img src={getOptimizedImageUrl(seller.storeLogoUrl)} alt={seller.storeName} className="seller-logo" loading="lazy" />
                ) : (
                  <div className="seller-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: '#ccc' }}>
                    {seller.storeName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="seller-info">
                  <h3 className="seller-name">{seller.storeName}</h3>
                  <div className="seller-rating">
                    <span className="seller-rating-star">★</span> {seller.rating.toFixed(1)}
                    {seller.isVerified && <span style={{ color: 'var(--primary-color)', marginLeft: '4px' }}>✓</span>}
                  </div>
                  <p className="seller-desc">{seller.storeDescription || 'A great fashion store.'}</p>
                  <div className="seller-visit-btn">Visit Store</div>
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
