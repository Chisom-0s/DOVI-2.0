import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { HomepageBanner, HomepageSection, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import BannerFormPage from './BannerFormPage';
import SectionBuilderModal from './SectionBuilderModal';

export default function HomepageManagerPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'sections'>('banners');
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Form overlays
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<HomepageBanner | null>(null);
  
  const [showSectionBuilder, setShowSectionBuilder] = useState(false);
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [loadedBanners, loadedSections] = await Promise.all([
        adminApi.listHomepageBanners(),
        adminApi.listHomepageSections(),
      ]);
      setBanners((loadedBanners || []).sort((a, b) => a.display_order - b.display_order));
      setSections((loadedSections || []).sort((a, b) => a.sort_order - b.sort_order));
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load homepage CMS settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Banner Actions ---
  const handleBannerSave = async (payload: any) => {
    try {
      if (selectedBanner) {
        await adminApi.updateHomepageBanner(selectedBanner.id, payload);
        toast.success(`Banner "${payload.title}" updated successfully.`);
      } else {
        await adminApi.createHomepageBanner(payload);
        toast.success(`Banner "${payload.title}" created successfully.`);
      }
      setShowBannerForm(false);
      setSelectedBanner(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save banner details.');
      throw err;
    }
  };

  const handleBannerDelete = async (banner: HomepageBanner) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete banner "${banner.title}"?`);
    if (!confirmDelete) return;

    try {
      await adminApi.deleteHomepageBanner(banner.id);
      toast.success(`Banner "${banner.title}" deleted.`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete banner.');
    }
  };

  const handleBannerToggleActive = async (banner: HomepageBanner) => {
    try {
      if (banner.is_active) {
        await adminApi.deactivateHomepageBanner(banner.id);
        toast.success(`Banner deactivated.`);
      } else {
        await adminApi.activateHomepageBanner(banner.id);
        toast.success(`Banner activated.`);
      }
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update banner status.');
    }
  };

  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    
    setBanners(updated);

    try {
      const ids = updated.map((b) => b.id);
      await adminApi.reorderHomepageBanners(ids);
      toast.success('Banner order synchronized.');
    } catch {
      toast.error('Failed to update banner order.');
      await fetchData();
    }
  };

  // --- Section Actions ---
  const handleSectionSave = async (payload: any) => {
    try {
      if (selectedSection) {
        await adminApi.updateHomepageSection(selectedSection.id, payload);
        toast.success(`Section layout configuration updated.`);
      } else {
        await adminApi.createHomepageSection(payload);
        toast.success(`Homepage section "${payload.name}" created.`);
      }
      setShowSectionBuilder(false);
      setSelectedSection(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save section parameters.');
      throw err;
    }
  };

  const handleSectionDuplicate = async (section: HomepageSection) => {
    try {
      await adminApi.duplicateHomepageSection(section.id);
      toast.success(`Section duplicated successfully.`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate section.');
    }
  };

  const handleSectionDelete = async (section: HomepageSection) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete section "${section.name}"?`);
    if (!confirmDelete) return;

    try {
      await adminApi.deleteHomepageSection(section.id);
      toast.success(`Section deleted.`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete section.');
    }
  };

  const handleSectionToggleActive = async (section: HomepageSection) => {
    const nextStatus = !section.is_active;
    try {
      await adminApi.updateHomepageSection(section.id, {
        is_active: nextStatus,
        visible: nextStatus,
      });
      toast.success(`Section status updated.`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update section status.');
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    
    setSections(updated);

    try {
      const ids = updated.map((s) => s.id);
      await adminApi.reorderHomepageSections(ids);
      toast.success('Section layout order synchronized.');
    } catch {
      toast.error('Failed to update section layout order.');
      await fetchData();
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Homepage Content Management</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Title & Tabs */}
      <div style={headerContainerStyles}>
        <h2 style={titleStyles}>Homepage Content Management</h2>
        <div style={tabGroupStyles}>
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            style={{
              ...tabBtnStyles,
              borderBottom: activeTab === 'banners' ? '3px solid #ff7a00' : '3px solid transparent',
              color: activeTab === 'banners' ? '#ff7a00' : '#4b5563',
              fontWeight: activeTab === 'banners' ? 700 : 500,
            }}
          >
            🎡 Hero Carousel Banners
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            style={{
              ...tabBtnStyles,
              borderBottom: activeTab === 'sections' ? '3px solid #ff7a00' : '3px solid transparent',
              color: activeTab === 'sections' ? '#ff7a00' : '#4b5563',
              fontWeight: activeTab === 'sections' ? 700 : 500,
            }}
          >
            🧱 Layout Sections
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* TABS VIEWPORT */}
      {activeTab === 'banners' ? (
        <div style={cardStyles}>
          <div style={cardHeaderRowStyles}>
            <div style={infoAlertStyles}>
              💡 <strong>Carousel Banners:</strong> Reordering changes the rotation sequence. Setting start/end dates will auto-schedule the banner activation window.
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedBanner(null);
                setShowBannerForm(true);
              }}
              style={actionBtnStyles}
            >
              + Create Banner
            </button>
          </div>

          {banners.length === 0 ? (
            <EmptyState
              icon="🎡"
              title="No Carousel Banners"
              subtitle="Get started by creating your first promotional hero banner."
              action={{
                label: "Create Banner",
                onClick: () => {
                  setSelectedBanner(null);
                  setShowBannerForm(true);
                }
              }}
            />
          ) : (
            <div style={listContainerStyles}>
              {banners.map((b, idx) => (
                <div key={b.id} style={listItemStyles}>
                  {/* Sorting handles */}
                  <div style={sortingWrapperStyles}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveBanner(idx, 'up')}
                      style={sortBtnStyles}
                    >
                      ▲
                    </button>
                    <span style={orderLabelStyles}>{idx + 1}</span>
                    <button
                      type="button"
                      disabled={idx === banners.length - 1}
                      onClick={() => handleMoveBanner(idx, 'down')}
                      style={sortBtnStyles}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={b.desktop_image_url || '/logo.jpg?v=2'}
                    alt={b.title}
                    style={bannerThumbnailStyles}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                    }}
                  />

                  {/* Info details */}
                  <div style={{ flex: 1 }}>
                    <strong style={bannerTitleStyles}>{b.title}</strong>
                    {b.subtitle && <span style={bannerSubStyles}>{b.subtitle}</span>}
                    <div style={metaRowStyles}>
                      {b.cta_text && (
                        <span style={badgeStyles}>
                          CTA: {b.cta_text} ➔ {b.cta_url}
                        </span>
                      )}
                      {b.start_date && (
                        <span style={scheduleBadgeStyles}>
                          📅 {new Date(b.start_date).toLocaleDateString()} - {b.end_date ? new Date(b.end_date).toLocaleDateString() : 'Forever'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Operations */}
                  <div style={actionsGroupStyles}>
                    <button
                      type="button"
                      onClick={() => handleBannerToggleActive(b)}
                      style={{
                        ...toggleBtnStyles,
                        backgroundColor: b.is_active ? '#d1fae5' : '#fee2e2',
                        color: b.is_active ? '#065f46' : '#991b1b',
                      }}
                    >
                      {b.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBanner(b);
                        setShowBannerForm(true);
                      }}
                      style={editBtnStyles}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBannerDelete(b)}
                      style={deleteBtnStyles}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={cardStyles}>
          <div style={cardHeaderRowStyles}>
            <div style={infoAlertStyles}>
              🧱 <strong>Homepage Layout Sections:</strong> Drag or sort layout priorities. Sections scheduled with start/end windows or toggled inactive are automatically synced.
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedSection(null);
                setShowSectionBuilder(true);
              }}
              style={actionBtnStyles}
            >
              + Create Section
            </button>
          </div>

          {sections.length === 0 ? (
            <EmptyState
              icon="🧱"
              title="No Layout Sections Found"
              subtitle="Get started by building your first dynamic homepage section block."
              action={{
                label: "Create Section",
                onClick: () => {
                  setSelectedSection(null);
                  setShowSectionBuilder(true);
                }
              }}
            />
          ) : (
            <div style={tableWrapperStyles}>
              <table style={tableStyles}>
                <thead>
                  <tr style={tableHeaderStyles}>
                    <th style={thStyles}>Order</th>
                    <th style={thStyles}>Name</th>
                    <th style={thStyles}>Type</th>
                    <th style={thStyles}>Layout</th>
                    <th style={thStyles}>Source</th>
                    <th style={thStyles}>Limit</th>
                    <th style={thStyles}>Schedule</th>
                    <th style={thStyles}>Status</th>
                    <th style={thStyles}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((s, idx) => (
                    <tr key={s.id} style={tableRowStyles}>
                      {/* Order column */}
                      <td style={tdStyles}>
                        <div style={sortingWrapperHorizontalStyles}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(idx, 'up')}
                            style={sortBtnStyles}
                          >
                            ▲
                          </button>
                          <span style={orderLabelStyles}>{idx + 1}</span>
                          <button
                            type="button"
                            disabled={idx === sections.length - 1}
                            onClick={() => handleMoveSection(idx, 'down')}
                            style={sortBtnStyles}
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      {/* Name / title */}
                      <td style={tdStyles}>
                        <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{s.name}</div>
                        {s.title && <div style={{ fontSize: '11px', color: '#6b7280' }}>"{s.title}"</div>}
                      </td>

                      {/* Type key */}
                      <td style={tdStyles}>
                        <span style={typeBadgeStyles}>{s.key}</span>
                      </td>

                      {/* Layout */}
                      <td style={tdStyles}>
                        <span style={layoutBadgeStyles}>{s.configuration?.layout || 'GRID'}</span>
                      </td>

                      {/* Sourcing */}
                      <td style={tdStyles}>
                        <span style={sourceBadgeStyles}>{s.configuration?.source || 'AUTOMATIC'}</span>
                      </td>

                      {/* Limit */}
                      <td style={tdStyles}>{s.display_limit} items</td>

                      {/* Schedule */}
                      <td style={tdStyles}>
                        {s.starts_at ? (
                          <div style={{ fontSize: '11px' }}>
                            <div>{new Date(s.starts_at).toLocaleDateString()}</div>
                            {s.ends_at && <div style={{ color: '#ef4444' }}>to {new Date(s.ends_at).toLocaleDateString()}</div>}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '11px' }}>Always</span>
                        )}
                      </td>

                      {/* Status toggle */}
                      <td style={tdStyles}>
                        <button
                          type="button"
                          onClick={() => handleSectionToggleActive(s)}
                          style={{
                            ...toggleBtnStyles,
                            backgroundColor: s.is_active ? '#d1fae5' : '#fee2e2',
                            color: s.is_active ? '#065f46' : '#991b1b',
                          }}
                        >
                          {s.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Operations */}
                      <td style={tdStyles}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSection(s);
                              setShowSectionBuilder(true);
                            }}
                            style={editBtnStyles}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSectionDuplicate(s)}
                            style={duplicateBtnStyles}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSectionDelete(s)}
                            style={deleteBtnStyles}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Banner Form modal */}
      {showBannerForm && (
        <BannerFormPage
          banner={selectedBanner}
          onClose={() => {
            setShowBannerForm(false);
            setSelectedBanner(null);
          }}
          onSave={handleBannerSave}
        />
      )}

      {/* Advanced Section Builder Modal */}
      {showSectionBuilder && (
        <SectionBuilderModal
          section={selectedSection}
          onClose={() => {
            setShowSectionBuilder(false);
            setSelectedSection(null);
          }}
          onSave={handleSectionSave}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const headerContainerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const tabGroupStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const tabBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '13px',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  outline: 'none',
  transition: 'all 150ms ease',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const cardHeaderRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '24px',
};

const infoAlertStyles: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  color: '#1e40af',
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '12px',
  lineHeight: '1.5',
  flex: 1,
};

const actionBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '6px',
  fontWeight: 700,
  fontSize: '13px',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const listContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const listItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
};

const sortingWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
};

const sortingWrapperHorizontalStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const sortBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '10px',
  color: '#9ca3af',
  cursor: 'pointer',
  padding: '2px 4px',
};

const orderLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
  minWidth: '16px',
  textAlign: 'center',
};

const bannerThumbnailStyles: React.CSSProperties = {
  width: '100px',
  height: '56px',
  objectFit: 'cover',
  borderRadius: '4px',
  backgroundColor: '#f3f4f6',
  border: '1px solid #e5e7eb',
};

const bannerTitleStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#1f2937',
};

const bannerSubStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  display: 'block',
  marginTop: '2px',
};

const metaRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '6px',
  flexWrap: 'wrap',
};

const badgeStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  fontSize: '9px',
  fontWeight: 600,
  padding: '2px 6px',
  borderRadius: '4px',
};

const scheduleBadgeStyles: React.CSSProperties = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontSize: '9px',
  fontWeight: 600,
  padding: '2px 6px',
  borderRadius: '4px',
};

const actionsGroupStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const toggleBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '9999px',
  fontSize: '11px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
};

const editBtnStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const duplicateBtnStyles: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  color: '#1e40af',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const deleteBtnStyles: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const tableWrapperStyles: React.CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '13px',
};

const tableHeaderStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};

const thStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontWeight: 600,
  color: '#4b5563',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
};

const tdStyles: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};

const typeBadgeStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#1f2937',
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: '4px',
};

const layoutBadgeStyles: React.CSSProperties = {
  backgroundColor: 'rgba(255,122,0,0.08)',
  color: '#ff7a00',
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: '4px',
};

const sourceBadgeStyles: React.CSSProperties = {
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: '4px',
};
