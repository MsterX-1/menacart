import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyProducts, useDeleteProduct } from '../hooks/useProducts';
import { Button } from '../../../components/Button';
import { useToast } from '../../../components/Toast';
import './SellerProductListPage.css';

export const SellerProductListPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const { data: products, isLoading, error, refetch } = useMyProducts(page, pageSize);
  const deleteMutation = useDeleteProduct();

  const handleDelete = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteMutation.mutateAsync(productId);
      toastSuccess('Product deleted successfully');
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to delete product');
    }
  };

  if (isLoading) {
    return (
      <div className="seller-products-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seller-products-container error">
        <p className="error-message">Error loading products: {(error as any).message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="seller-products-container">
      <div className="seller-products-header">
        <div>
          <h1 className="seller-products-title">My Listings</h1>
          <p className="seller-products-subtitle">Manage your clothing items and variants</p>
        </div>
        <Button onClick={() => navigate('/seller/products/new')}>
          + Add New Product
        </Button>
      </div>

      {products && products.length === 0 ? (
        <div className="seller-products-empty">
          <h2>No products listed yet</h2>
          <p>Get started by listing your first clothing product and adding variants.</p>
          <Button variant="secondary" onClick={() => navigate('/seller/products/new')}>
            List a Product
          </Button>
        </div>
      ) : (
        <div className="seller-table-wrapper">
          <table className="seller-products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Variants Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => (
                <tr key={product.productId}>
                  <td>
                    <div className="table-product-cell">
                      {product.mainImageUrl ? (
                        <img
                          src={product.mainImageUrl}
                          alt={product.name}
                          className="table-product-image"
                        />
                      ) : (
                        <div className="table-product-image placeholder">👗</div>
                      )}
                      <div>
                        <div className="table-product-name">{product.name}</div>
                        {product.brand && <div className="table-product-brand">{product.brand}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{product.categoryName}</td>
                  <td>{product.basePrice.toFixed(2)} EGP</td>
                  <td>{product.variants?.length || 0} variants</td>
                  <td>
                    <span className={`status-badge ${product.approvalStatus.toLowerCase()}`}>
                      {product.approvalStatus}
                    </span>
                    {product.approvalStatus === 'Rejected' && product.rejectionReason && (
                      <div className="rejection-reason" title={product.rejectionReason}>
                        Reason: {product.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/seller/products/${product.productId}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="btn-danger"
                        onClick={() => handleDelete(product.productId)}
                        isLoading={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="seller-pagination">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <span className="pagination-info">Page {page}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={products && products.length < pageSize}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
