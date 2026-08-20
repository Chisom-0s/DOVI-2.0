import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { HomepageBanner, HomepageSection, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import BannerFormPage from './BannerFormPage';
import SectionConfigEditor from './SectionConfigEditor';

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
  
  const [showSectionEditor, setShowSectionEditor] = useState(false);
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
      // Sort lists by display_order to ensure visual alignment
      setBanners((loadedBanners || []).sort((a, b) => a.display_order - b.display_order));
      setSections((loadedSections || []).sort((a, b) => a.display_order - b.display_order));
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
        // Edit existing
        await adminApi.updateHomepageBanner(selectedBanner.id, payload);
        toast.success(`Banner "${payload.title}" updated successfully.`);
      } else {
        // Create new
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

    // Swap elements in memory
    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    
    // Optimistic UI state
    setBanners(updated);

    try {
      const ids = updated.map((b) => b.id);
      await adminApi.reorderHomepageBanners(ids);
      toast.success('Banner order synchronized.');
    } catch {
      toast.error('Failed to update banner order.');
      await fetchData(); // Rollback
    }
  };

  // --- Section Actions ---
  const handleSectionSave = async (config: Record<string, any>) => {
    if (!selectedSection) return;
    try {
      await adminApi.updateHomepageSection(selectedSection.id, {
        title: selectedSection.title,
        config,
      });
      toast.success(`Section configuration saved.`);
      setShowSectionEditor(false);
      setSelectedSection(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save section config.');
      throw err;
    }
  };

  const handleSectionToggleVisible = async (section: HomepageSection) => {
    // Optimistic update
    const updated = sections.map((s) =>
      s.id === section.id ? { ...s, visible: !s.visible } : s
    );
    setSections(updated);

    try {
      await adminApi.updateHomepageSection(section.id, {
        visible: !section.visible,
      });
      toast.success(`Section visibility updated.`);
    } catch {
      toast.error('Failed to toggle section visibility.');
      await fetchData(); // Rollback
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    // Swap elements in memory
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    
    // Optimistic UI state
    setSections(updated);

    try {
      const ids = updated.map((s) => s.id);
      await adminApi.reorderHomepageSections(ids);
      toast.success('Section ordering synchronized.');
    } catch {
      toast.error('Failed to update section layout order.');
      await fetchData(); // Rollback
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
        // Banners View
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
        // Sections View
        <div style={cardStyles}>
          <div style={infoAlertStyles}>
            🧱 <strong>Homepage Sections:</strong> Drag sections into priority order. Sections marked as invisible will be completely hidden from the buyer frontend without requiring deployments.
          </div>

          {sections.length === 0 ? (
            <EmptyState
              icon="🧱"
              title="No Layout Sections Found"
              subtitle="The API returned zero sections settings."
            />
          ) : (
            <div style={listContainerStyles}>
              {sections.map((s, idx) => (
                <div key={s.id} style={listItemStyles}>
                  {/* Sorting handles */}
                  <div style={sortingWrapperStyles}>
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

                  {/* Info details */}
                  <div style={{ flex: 1 }}>
                    <strong style={bannerTitleStyles}>{s.title}</strong>
                    <span style={bannerSubStyles}>System key: {s.key}</span>
                  </div>

                  {/* Operations */}
                  <div style={actionsGroupStyles}>
                    <button
                      type="button"
                      onClick={() => handleSectionToggleVisible(s)}
                      style={{
                        ...toggleBtnStyles,
                        backgroundColor: s.visible ? '#d1fae5' : '#fee2e2',
                        color: s.visible ? '#065f46' : '#991b1b',
                      }}
                    >
                      {s.visible ? 'Visible' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSection(s);
                        setShowSectionEditor(true);
                      }}
                      style={editBtnStyles}
                    >
                      Configure Layout Config
                    </button>
                  </div>
                </div>
              ))}
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

      {/* JSON Section Config Editor Modal */}
      {showSectionEditor && selectedSection && (
        <SectionConfigEditor
          section={selectedSection}
          onClose={() => {
            setShowSectionEditor(false);
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
  gap: '16px',
  flexWrap: 'wrap',
};

const infoAlertStyles: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#4b5563',
  lineHeight: 1.5,
  flex: 1,
};

const actionBtnStyles: React.CSSProperties = {
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '9999px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
  boxShadow: '0 2px 8px rgba(255,122,0,0.3)',
};

const listContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const listItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  padding: '16px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
  transition: 'all 150ms ease',
};

const sortingWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
};

const sortBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#4b5563',
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const orderLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#9ca3af',
};

const bannerThumbnailStyles: React.CSSProperties = {
  width: '100px',
  height: '56px',
  objectFit: 'cover',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const bannerTitleStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
  color: '#1f2937',
};

const bannerSubStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '2px',
};

const metaRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '8px',
  flexWrap: 'wrap',
};

const badgeStyles: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  padding: '2px 8px',
  borderRadius: '4px',
};

const scheduleBadgeStyles: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  backgroundColor: 'rgba(255,122,0,0.08)',
  color: '#ff7a00',
  padding: '2px 8px',
  borderRadius: '4px',
};

const actionsGroupStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const toggleBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  padding: '6px 12px',
  borderRadius: '9999px',
  border: 'none',
  cursor: 'pointer',
};

const editBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#ff7a00',
  border: '1px solid rgba(255,122,0,0.2)',
  padding: '6px 12px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
};

const deleteBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#ef4444',
  border: '1px solid rgba(239,68,68,0.2)',
  padding: '6px 12px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
};
