import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/api/admin';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import toast from 'react-hot-toast';

export default function AutoListingsPage() {
  type TabType = 'VEHICLES' | 'PARTS' | 'RENTALS';
  const [activeTab, setActiveTab] = useState<TabType>('VEHICLES');

  // Listings data
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit modal states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCondition, setEditCondition] = useState<'NEW' | 'USED'>('USED');
  const [editTransmission, setEditTransmission] = useState<'AUTOMATIC' | 'MANUAL' | 'CVT'>('AUTOMATIC');
  const [editFuelType, setEditFuelType] = useState<'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'OTHER'>('PETROL');
  
  // Parts-specific edit states
  const [editStockQuantity, setEditStockQuantity] = useState<number>(0);
  const [editPartType, setEditPartType] = useState<'OEM' | 'AFTERMARKET'>('OEM');
  
  // Rentals-specific edit states
  const [editDailyRate, setEditDailyRate] = useState('');
  const [editSecurityDeposit, setEditSecurityDeposit] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch listings based on active tab
  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Query parameters mapping
      const params: Record<string, any> = {
        page: currentPage,
        q: search || undefined,
        type: activeTab.toLowerCase(), // pass type filter to admin API
      };

      const data = await adminApi.listAutoListings(params);
      setListings(data.results);
      setTotalPages(Math.ceil(data.count / 10) || 1);
    } catch (err) {
      console.error(`Failed to load admin auto listings for tab: ${activeTab}`, err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, activeTab]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearch('');
    setCurrentPage(1);
    setListings([]);
  };

  // Open edit modal
  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setEditPrice(item.price || item.daily_rate || '');
    setEditLocation(item.location || item.pickup_location || '');
    setEditCondition(item.condition || 'USED');
    setEditTransmission(item.transmission || 'AUTOMATIC');
    setEditFuelType(item.fuel_type || 'PETROL');
    setEditStockQuantity(item.stock_quantity || 0);
    setEditPartType(item.part_type || 'OEM');
    setEditDailyRate(item.daily_rate || '');
    setEditSecurityDeposit(item.security_deposit || '');
  };

  // Submit edits
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      setIsUpdating(true);
      let payload: Record<string, any> = {};

      if (activeTab === 'VEHICLES') {
        payload = {
          price: editPrice,
          location: editLocation,
          condition: editCondition,
          transmission: editTransmission,
          fuel_type: editFuelType,
        };
      } else if (activeTab === 'PARTS') {
        payload = {
          price: editPrice,
          stock_quantity: editStockQuantity,
          condition: editCondition,
          part_type: editPartType,
        };
      } else if (activeTab === 'RENTALS') {
        payload = {
          daily_rate: editDailyRate,
          security_deposit: editSecurityDeposit,
          pickup_location: editLocation,
        };
      }

      await adminApi.updateAutoListing(editingId, payload);
      toast.success('Auto listing updated successfully');
      setEditingId(null);
      fetchListings();
    } catch (err) {
      console.error('Failed to update listing:', err);
      toast.error('Unable to update listing details');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete listing
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      await adminApi.deleteAutoListing(deletingId);
      toast.success('Listing removed successfully');
      setDeletingId(null);
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
      {/* Header Panel */}
      <div style={headerRowStyles}>
        <div>
          <h1 style={titleStyles}>Auto Listings CMS</h1>
          <p style={subtitleStyles}>Monitor and manage vehicles, spare parts, and rental listings</p>
        </div>
      </div>

      {/* Tabs list */}
      <div style={tabsWrapperStyles}>
        <button
          style={{
            ...tabBtnStyles,
            borderBottom: activeTab === 'VEHICLES' ? '3px solid var(--color-primary, #ff7a00)' : '3px solid transparent',
            color: activeTab === 'VEHICLES' ? 'var(--color-primary, #ff7a00)' : '#4b5563',
            fontWeight: activeTab === 'VEHICLES' ? 700 : 500,
          }}
          onClick={() => handleTabChange('VEHICLES')}
        >
          🚗 Vehicles
        </button>
        <button
          style={{
            ...tabBtnStyles,
            borderBottom: activeTab === 'PARTS' ? '3px solid var(--color-primary, #ff7a00)' : '3px solid transparent',
            color: activeTab === 'PARTS' ? 'var(--color-primary, #ff7a00)' : '#4b5563',
            fontWeight: activeTab === 'PARTS' ? 700 : 500,
          }}
          onClick={() => handleTabChange('PARTS')}
        >
          ⚙️ Parts & Accessories
        </button>
        <button
          style={{
            ...tabBtnStyles,
            borderBottom: activeTab === 'RENTALS' ? '3px solid var(--color-primary, #ff7a00)' : '3px solid transparent',
            color: activeTab === 'RENTALS' ? 'var(--color-primary, #ff7a00)' : '#4b5563',
            fontWeight: activeTab === 'RENTALS' ? 700 : 500,
          }}
          onClick={() => handleTabChange('RENTALS')}
        >
          📅 Rentals & Bookings
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={searchBarStyles}>
        <input
          type="text"
          placeholder={`Search ${activeTab.toLowerCase()} by name, make...`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          style={searchInputStyles}
        />
      </div>

      {/* Table Grid Data */}
      {isLoading ? (
        <div style={tableSkeletonWrapperStyles}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={tableRowSkeletonStyles}>
              <Skeleton width="25%" height="1.2rem" />
              <Skeleton width="15%" height="1.2rem" />
              <Skeleton width="15%" height="1.2rem" />
              <Skeleton width="15%" height="1.2rem" />
              <Skeleton width="15%" height="1.2rem" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={errorWrapperStyles}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '48px 32px',
              maxWidth: '560px',
              margin: '24px auto',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚧</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              Auto CMS Not Yet Available
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, marginBottom: '24px' }}>
              The Dovi Auto backend API (<code>/api/v1/admin/auto/*</code>) is currently under active development.
              Listing management and moderation tools will become operational once the microservice is deployed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => fetchListings()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--color-primary, #ff7a00)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title={`No ${activeTab.toLowerCase()} Found`}
          subtitle={search ? "Try clearing search queries." : "No listings created yet in this category."}
        />
      ) : (
        <>
          <div style={tableContainerStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={thStyles}>Item / Details</th>
                  <th style={thStyles}>Price / Rate</th>
                  <th style={thStyles}>Status & Specs</th>
                  <th style={thStyles}>Location</th>
                  <th style={thStyles}>Vendor</th>
                  <th style={thStyles}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id} style={tableRowStyles}>
                    {/* Column 1: Details */}
                    <td style={tdDetailsColStyles}>
                      {item.primary_image_url ? (
                        <img src={item.primary_image_url} alt={item.name} style={thumbnailStyles} />
                      ) : (
                        <div style={thumbnailPlaceholderStyles}>🚗</div>
                      )}
                      <div>
                        <div style={itemTitleStyles}>
                          {item.name || `${item.make} ${item.model}`}
                        </div>
                        {item.part_number && (
                          <div style={itemSubtitleStyles}>Part #: {item.part_number}</div>
                        )}
                        {item.year && !item.part_number && (
                          <div style={itemSubtitleStyles}>Year: {item.year}</div>
                        )}
                      </div>
                    </td>

                    {/* Column 2: Price */}
                    <td style={tdStyles}>
                      {activeTab === 'RENTALS' ? (
                        <div>
                          <strong>₦{parseFloat(item.daily_rate).toLocaleString()}</strong> / day
                        </div>
                      ) : (
                        <strong>₦{parseFloat(item.price).toLocaleString()}</strong>
                      )}
                    </td>

                    {/* Column 3: Specs/Status */}
                    <td style={tdSpecsStyles}>
                      {activeTab === 'VEHICLES' && (
                        <>
                          <span style={badgeStyles}>{item.condition}</span>
                          <span style={badgeStyles}>{item.transmission}</span>
                          <span style={badgeStyles}>{item.fuel_type}</span>
                        </>
                      )}
                      {activeTab === 'PARTS' && (
                        <>
                          <span style={badgeStyles}>{item.part_type}</span>
                          <span style={badgeStyles}>{item.condition}</span>
                          <span style={item.stock_quantity > 0 ? stockQtyGreenStyles : stockQtyRedStyles}>
                            Stock: {item.stock_quantity}
                          </span>
                        </>
                      )}
                      {activeTab === 'RENTALS' && (
                        <>
                          <span style={badgeStyles}>Deposit: ₦{parseFloat(item.security_deposit || '0').toLocaleString()}</span>
                          <span style={stockQtyGreenStyles}>Available</span>
                        </>
                      )}
                    </td>

                    {/* Column 4: Location */}
                    <td style={tdStyles}>{item.location || item.pickup_location}</td>

                    {/* Column 5: Vendor */}
                    <td style={tdStyles}>{item.seller?.name || item.vendor?.name || 'Private'}</td>

                    {/* Column 6: Actions */}
                    <td style={tdActionsStyles}>
                      <button style={actionEditBtnStyles} onClick={() => handleEditClick(item)}>
                        Edit Specs
                      </button>
                      <button style={actionDeleteBtnStyles} onClick={() => setDeletingId(item.id)}>
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

      {/* Edit Listing Specs Modal */}
      {editingId && (
        <div style={modalOverlayStyles}>
          <div style={modalCardStyles}>
            <h3 style={modalTitleStyles}>Edit Listing Specs</h3>
            <form onSubmit={handleUpdateSubmit}>
              
              {/* VEHICLE FORM FIELDS */}
              {activeTab === 'VEHICLES' && (
                <>
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
                </>
              )}

              {/* PARTS FORM FIELDS */}
              {activeTab === 'PARTS' && (
                <>
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
                    <label style={formLabelStyles}>Stock Quantity</label>
                    <input
                      type="number"
                      required
                      style={formInputStyles}
                      value={editStockQuantity}
                      onChange={(e) => setEditStockQuantity(parseInt(e.target.value) || 0)}
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
                    <label style={formLabelStyles}>Part Category</label>
                    <select
                      style={formSelectStyles}
                      value={editPartType}
                      onChange={(e) => setEditPartType(e.target.value as 'OEM' | 'AFTERMARKET')}
                    >
                      <option value="OEM">OEM (Original)</option>
                      <option value="AFTERMARKET">Aftermarket</option>
                    </select>
                  </div>
                </>
              )}

              {/* RENTALS FORM FIELDS */}
              {activeTab === 'RENTALS' && (
                <>
                  <div style={formGroupStyles}>
                    <label style={formLabelStyles}>Daily Rate (₦)</label>
                    <input
                      type="number"
                      required
                      style={formInputStyles}
                      value={editDailyRate}
                      onChange={(e) => setEditDailyRate(e.target.value)}
                    />
                  </div>
                  <div style={formGroupStyles}>
                    <label style={formLabelStyles}>Security Deposit (₦)</label>
                    <input
                      type="number"
                      required
                      style={formInputStyles}
                      value={editSecurityDeposit}
                      onChange={(e) => setEditSecurityDeposit(e.target.value)}
                    />
                  </div>
                  <div style={formGroupStyles}>
                    <label style={formLabelStyles}>Pickup Location</label>
                    <input
                      type="text"
                      required
                      style={formInputStyles}
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div style={modalActionsStyles}>
                <button
                  type="button"
                  style={modalCancelBtnStyles}
                  onClick={() => setEditingId(null)}
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

      {/* Delete Listing Confirmation */}
      {deletingId && (
        <div style={modalOverlayStyles}>
          <div style={modalCardStyles}>
            <h3 style={modalTitleStyles}>Remove Listing</h3>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to remove this item listing? This action is permanent and cannot be undone.
            </p>
            <div style={modalActionsStyles}>
              <button
                type="button"
                style={modalCancelBtnStyles}
                onClick={() => setDeletingId(null)}
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
// Styling Tokens
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

const tabsWrapperStyles: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '24px',
};

const tabBtnStyles: React.CSSProperties = {
  padding: '12px 4px',
  border: 'none',
  background: 'none',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 150ms ease',
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

const tdDetailsColStyles: React.CSSProperties = {
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const thumbnailStyles: React.CSSProperties = {
  width: '44px',
  height: '33px',
  borderRadius: '4px',
  objectFit: 'cover',
  backgroundColor: '#f3f4f6',
};

const thumbnailPlaceholderStyles: React.CSSProperties = {
  width: '44px',
  height: '33px',
  borderRadius: '4px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
};

const itemTitleStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#111827',
};

const itemSubtitleStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  marginTop: '2px',
};

const tdSpecsStyles: React.CSSProperties = {
  padding: '14px 16px',
  display: 'flex',
  gap: '6px',
  alignItems: 'center',
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

const stockQtyGreenStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: '#edfdf6',
  color: 'var(--color-success, #27ae60)',
  padding: '2px 6px',
  borderRadius: '4px',
};

const stockQtyRedStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: '#fdf2f2',
  color: 'var(--color-danger, #ef4444)',
  padding: '2px 6px',
  borderRadius: '4px',
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

// Modal dialog box styling
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
