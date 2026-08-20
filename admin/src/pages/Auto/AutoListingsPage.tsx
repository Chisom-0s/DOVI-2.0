import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/api/admin';
import type { AutoListingSummary, AutoListing } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import toast from 'react-hot-toast';

export default function AutoListingsPage() {
  const [listings, setListings] = useState<AutoListingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit modal state
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCondition, setEditCondition] = useState<'NEW' | 'USED'>('USED');
  const [editTransmission, setEditTransmission] = useState<'AUTOMATIC' | 'MANUAL' | 'CVT'>('AUTOMATIC');
  const [editFuelType, setEditFuelType] = useState<'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'OTHER'>('PETROL');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirm state
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.listAutoListings({
        page: currentPage,
        q: search || undefined,
      });
      setListings(data.results);
      setTotalPages(Math.ceil(data.count / 10) || 1); // Assuming 10 items per page
      setError(null);
    } catch (err) {
      console.error('Failed to load admin auto listings:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Edit listing init
  const handleEditClick = (car: AutoListingSummary) => {
    setEditingCarId(car.id);
    setEditPrice(car.price);
    setEditLocation(car.location);
    setEditCondition(car.condition);
    setEditTransmission(car.transmission);
    setEditFuelType(car.fuel_type);
  };

  // Submit edit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCarId) return;

    try {
      setIsUpdating(true);
      const payload: Partial<AutoListing> = {
        price: editPrice,
        location: editLocation,
        condition: editCondition,
        transmission: editTransmission,
        fuel_type: editFuelType,
      };

      await adminApi.updateAutoListing(editingCarId, payload);
      toast.success('Listing updated successfully');
      setEditingCarId(null);
      fetchListings();
    } catch (err) {
      console.error('Failed to update auto listing:', err);
      toast.error('Unable to update listing details');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete listing submit
  const handleDeleteConfirm = async () => {
    if (!deletingCarId) return;

    try {
      setIsDeleting(true);
      await adminApi.deleteAutoListing(deletingCarId);
      toast.success('Listing removed successfully');
      setDeletingCarId(null);
      fetchListings();
    } catch (err) {
      console.error('Failed to delete auto listing:', err);
      toast.error('Unable to delete listing');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={containerStyles}>
      <div style={headerRowStyles}>
        <div>
          <h1 style={titleStyles}>Auto Listings Management</h1>
          <p style={subtitleStyles}>Monitor and moderate vehicle listings posted on Dovi Auto</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div style={searchBarStyles}>
        <input
          type="text"
          placeholder="Search listing by make, model..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          style={searchInputStyles}
        />
      </div>

      {/* Listings Table Display */}
      {isLoading ? (
        <div style={tableSkeletonWrapperStyles}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={tableRowSkeletonStyles}>
              <Skeleton width="20%" height="1.25rem" />
              <Skeleton width="15%" height="1.25rem" />
              <Skeleton width="15%" height="1.25rem" />
              <Skeleton width="15%" height="1.25rem" />
              <Skeleton width="15%" height="1.25rem" />
              <Skeleton width="10%" height="1.25rem" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={errorWrapperStyles}>
          <ApiErrorMessage error={error} />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No Auto Listings Found"
          subtitle={search ? "Try tweaking your search term." : "No auto listings have been created yet."}
        />
      ) : (
        <>
          <div style={tableContainerStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={thStyles}>Vehicle</th>
                  <th style={thStyles}>Price</th>
                  <th style={thStyles}>Specs</th>
                  <th style={thStyles}>Location</th>
                  <th style={thStyles}>Seller</th>
                  <th style={thStyles}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((car) => (
                  <tr key={car.id} style={tableRowStyles}>
                    <td style={tdVehicleStyles}>
                      {car.primary_image_url ? (
                        <img src={car.primary_image_url} alt={car.make} style={vehicleImgStyles} />
                      ) : (
                        <div style={vehicleImgPlaceholderStyles}>🚗</div>
                      )}
                      <div>
                        <div style={vehicleTitleStyles}>
                          {car.make} {car.model}
                        </div>
                        <div style={vehicleYearStyles}>{car.year}</div>
                      </div>
                    </td>
                    <td style={tdStyles}>
                      <strong style={priceStyles}>₦{parseFloat(car.price).toLocaleString()}</strong>
                    </td>
                    <td style={tdSpecsStyles}>
                      <span style={badgeStyles}>{car.condition}</span>
                      <span style={badgeStyles}>{car.transmission}</span>
                      <span style={badgeStyles}>{car.fuel_type}</span>
                    </td>
                    <td style={tdStyles}>{car.location}</td>
                    <td style={tdStyles}>{car.seller?.name || 'Private'}</td>
                    <td style={tdActionsStyles}>
                      <button style={actionEditBtnStyles} onClick={() => handleEditClick(car)}>
                        Edit Specs
                      </button>
                      <button style={actionDeleteBtnStyles} onClick={() => setDeletingCarId(car.id)}>
                        Remove
                      </button>
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
                style={{
                  ...pageBtnStyles,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                &larr; Prev
              </button>
              <span style={pageIndicatorStyles}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                style={{
                  ...pageBtnStyles,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Listing Dialog Modal */}
      {editingCarId && (
        <div style={modalOverlayStyles}>
          <div style={modalCardStyles}>
            <h3 style={modalTitleStyles}>Edit Listing Specs</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div style={formGroupStyles}>
                <label style={formLabelStyles}>Price (₦)</label>
                <input
                  type="number"
                  required
                  style={formInputStyles}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>

              <div style={formGroupStyles}>
                <label style={formLabelStyles}>Location</label>
                <input
                  type="text"
                  required
                  style={formInputStyles}
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </div>

              <div style={formGroupStyles}>
                <label style={formLabelStyles}>Condition</label>
                <select
                  style={formSelectStyles}
                  value={editCondition}
                  onChange={(e) => setEditCondition(e.target.value as 'NEW' | 'USED')}
                >
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                </select>
              </div>

              <div style={formGroupStyles}>
                <label style={formLabelStyles}>Transmission</label>
                <select
                  style={formSelectStyles}
                  value={editTransmission}
                  onChange={(e) => setEditTransmission(e.target.value as 'AUTOMATIC' | 'MANUAL' | 'CVT')}
                >
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>

              <div style={formGroupStyles}>
                <label style={formLabelStyles}>Fuel Type</label>
                <select
                  style={formSelectStyles}
                  value={editFuelType}
                  onChange={(e) => setEditFuelType(e.target.value as 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'OTHER')}
                >
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ELECTRIC">Electric</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div style={modalActionsStyles}>
                <button
                  type="button"
                  style={modalCancelBtnStyles}
                  onClick={() => setEditingCarId(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button type="submit" style={modalSubmitBtnStyles} disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Listing Confirmation Modal */}
      {deletingCarId && (
        <div style={modalOverlayStyles}>
          <div style={modalCardStyles}>
            <h3 style={modalTitleStyles}>Remove Listing</h3>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to remove this vehicle listing? This action is permanent and cannot be undone.
            </p>
            <div style={modalActionsStyles}>
              <button
                type="button"
                style={modalCancelBtnStyles}
                onClick={() => setDeletingCarId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ ...modalSubmitBtnStyles, backgroundColor: 'var(--color-danger, #ef4444)' }}
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Removing...' : 'Delete Listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens (Matching Admin Portal Theme)
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.5px',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '4px',
};

const searchBarStyles: React.CSSProperties = {
  marginBottom: '20px',
};

const searchInputStyles: React.CSSProperties = {
  width: '320px',
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const tableContainerStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  overflowX: 'auto',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const thStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
  transition: 'background-color 150ms ease',
};

const tdStyles: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '14px',
  color: '#111827',
};

const tdVehicleStyles: React.CSSProperties = {
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const vehicleImgStyles: React.CSSProperties = {
  width: '44px',
  height: '33px',
  borderRadius: '4px',
  objectFit: 'cover',
  backgroundColor: '#f3f4f6',
};

const vehicleImgPlaceholderStyles: React.CSSProperties = {
  width: '44px',
  height: '33px',
  borderRadius: '4px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
};

const vehicleTitleStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#111827',
};

const vehicleYearStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
};

const priceStyles: React.CSSProperties = {
  color: '#111827',
  fontWeight: 700,
};

const tdSpecsStyles: React.CSSProperties = {
  padding: '14px 16px',
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
};

const badgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  padding: '2px 6px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const tdActionsStyles: React.CSSProperties = {
  padding: '14px 16px',
};

const actionEditBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--color-primary, #ff7a00)',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  marginRight: '16px',
};

const actionDeleteBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--color-danger, #ef4444)',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
};

const tableSkeletonWrapperStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
};

const tableRowSkeletonStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '14px 0',
  borderBottom: '1px solid #f3f4f6',
};

const errorWrapperStyles: React.CSSProperties = {
  padding: '32px',
  textAlign: 'center',
};

const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px',
  marginTop: '24px',
};

const pageBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  fontSize: '13px',
  fontWeight: 600,
  color: '#4b5563',
};

const pageIndicatorStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
};

// Modal Box styling
const modalOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px',
  width: '100%',
  maxWidth: '440px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#111827',
  marginBottom: '20px',
};

const formGroupStyles: React.CSSProperties = {
  marginBottom: '16px',
};

const formLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: '#4b5563',
  marginBottom: '6px',
};

const formInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
};

const formSelectStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  marginTop: '24px',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#4b5563',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
};

const modalSubmitBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#ffffff',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  cursor: 'pointer',
};
