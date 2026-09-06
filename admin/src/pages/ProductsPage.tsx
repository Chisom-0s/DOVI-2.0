import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { ProductSummary, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Archive Confirm Modal / State
  const [productToArchive, setProductToArchive] = useState<ProductSummary | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listProducts({
        page,
        q: searchTerm || undefined,
      });
      setProducts(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load products list.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(true);
  };

  const handleArchiveConfirm = async () => {
    if (!productToArchive) return;
    setIsActionPending(true);
    try {
      await adminApi.archiveProduct(productToArchive.id);
      toast.success(`Product "${productToArchive.name}" archived successfully.`);
      setProducts(prev =>
        prev.map(p => (p.id === productToArchive.id ? { ...p, status: 'ARCHIVED' as const } : p))
      );
      setProductToArchive(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive product.');
    } finally {
      setIsActionPending(false);
    }
  };

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val || '0'));
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Product Directory</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Product Directory</h2>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Search</button>
        </form>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No Products Found"
          subtitle="Try adjusting your search query."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Product Details</th>
                  <th style={tableHeaderCellStyles}>Vendor</th>
                  <th style={tableHeaderCellStyles}>Base Price</th>
                  <th style={tableHeaderCellStyles}>Stock Qty</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={tableRowStyles}>
                    <td style={tableCellStyles}>
                      <div style={productInfoRowStyles}>
                        <img
                          src={getProductImageUrl(p)}
                          alt={p.name}
                          style={productImgStyles}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getProductFallbackImage(p);
                          }}
                        />
                        <div>
                          <strong style={productNameStyles}>{p.name}</strong>
                          <span style={productIdStyles}>ID: {p.id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={tableCellStyles}>{p.vendor.name}</td>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>{formatCurrency(p.price)}</td>
                    <td style={tableCellStyles}>{p.stock_quantity} available</td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(p.status)}>{p.status}</span>
                    </td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      {p.status !== 'ARCHIVED' ? (
                        <button
                          type="button"
                          onClick={() => setProductToArchive(p)}
                          style={archiveBtnStyles}
                        >
                          Archive
                        </button>
                      ) : (
                        <span style={archivedLabelStyles}>Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={pageBtnStyles}
              >
                Previous
              </button>
              <span style={pageLabelStyles}>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={pageBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      {productToArchive && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Archive Product</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to archive <strong>{productToArchive.name}</strong>? This will remove the listing from active marketplace pages.
            </p>
            <div style={modalActionsStyles}>
              <button type="button" onClick={() => setProductToArchive(null)} style={modalCancelBtnStyles}>
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleArchiveConfirm}
                style={modalDangerSubmitBtnStyles}
              >
                {isActionPending ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge status helper
const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#d1fae5';
  let color = '#065f46';

  if (status === 'PAUSED') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (status === 'ARCHIVED') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  }

  return {
    backgroundColor,
    color,
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
  };
};

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: 1,
  maxWidth: '440px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const searchBtnStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
};

const tableCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '2px solid #f3f4f6',
  backgroundColor: '#fafafa',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '12px var(--space-4)',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
};

const tableCellStyles: React.CSSProperties = {
  padding: '16px var(--space-4)',
  color: '#374151',
};

const productInfoRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const productImgStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  objectFit: 'cover',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const productNameStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
};

const productIdStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#9ca3af',
};

const archiveBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ef4444',
  border: '1px solid rgba(239,68,68,0.2)',
  padding: '4px 10px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
};

const archivedLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  fontWeight: 600,
};

const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  gap: '16px',
  borderTop: '1px solid #f3f4f6',
};

const pageBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const pageLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#4b5563',
};

const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '440px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1f2937',
  margin: '0 0 12px 0',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '8px',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '24px',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4b5563',
  cursor: 'pointer',
};

const modalDangerSubmitBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  backgroundColor: '#ef4444',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
};
