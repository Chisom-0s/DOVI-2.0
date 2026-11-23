import { useState, useEffect } from 'react';
import type { HomepageBanner, ProductSummary } from '@/types';
import { adminApi } from '@/api/admin';

interface BannerFormPageProps {
  banner: HomepageBanner | null; // null for Create
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

interface CampaignPreset {
  id: string;
  campaign_key: string;
  name: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
}

const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: 'launch',
    campaign_key: 'launch',
    name: '1. DOVI Launch Campaign',
    title: 'DOVI Launch Campaign',
    subtitle: 'Discover More, Shop Smart',
    ctaText: 'Shop Now',
    ctaUrl: '/promotions/launch',
    imageUrl: '/images/hero/hero_launch_campaign.jpg',
  },
  {
    id: 'black-friday',
    campaign_key: 'black-friday',
    name: '2. Black Friday Mega Deals',
    title: 'Black Friday Mega Deals',
    subtitle: 'Up to 70% OFF on Selected Products',
    ctaText: 'Shop the Deals',
    ctaUrl: '/promotions/black-friday',
    imageUrl: '/images/hero/hero_black_friday.jpg',
  },
  {
    id: 'price-drops',
    campaign_key: 'price-drops',
    name: '3. Price Drops',
    title: 'Price Drops',
    subtitle: 'More Value, Less Spending on Selected Products',
    ctaText: 'Shop Price Drops',
    ctaUrl: '/promotions/price-drops',
    imageUrl: '/images/hero/hero_price_drops.jpg',
  },
  {
    id: 'free-gifts',
    campaign_key: 'rewards',
    name: '4. Free Gifts & Shopping Rewards',
    title: 'Free Gifts & Shopping Rewards',
    subtitle: 'Shop qualifying products and unlock exciting rewards!',
    ctaText: 'Claim Your Free Gift',
    ctaUrl: '/promotions/giveaway',
    imageUrl: '/images/hero/hero_free_gifts.jpg',
  },
  {
    id: 'limited-deals',
    campaign_key: 'limited-deals',
    name: '5. Limited-Time Deals',
    title: 'Limited-Time Deals',
    subtitle: "Don't Miss Out on Special Offers - Up to 50% OFF",
    ctaText: 'Shop Limited Deals',
    ctaUrl: '/promotions/limited-deals',
    imageUrl: '/images/hero/hero_limited_deals.jpg',
  },
  {
    id: 'christmas',
    campaign_key: 'christmas',
    name: '6. Christmas Deals',
    title: 'Christmas Deals',
    subtitle: 'Up to 60% OFF - Festive Gifts & Luxury Items',
    ctaText: 'Shop Now',
    ctaUrl: '/promotions/christmas',
    imageUrl: '/images/hero/hero_christmas_deals.jpg',
  },
];

export default function BannerFormPage({ banner, onClose, onSave }: BannerFormPageProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(banner?.campaign_key || '');
  const [campaignKey, setCampaignKey] = useState(banner?.campaign_key || '');
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [ctaText, setCtaText] = useState(banner?.cta_text || '');
  const [ctaUrl, setCtaUrl] = useState(banner?.cta_url || '');
  const [desktopImageUrl, setDesktopImageUrl] = useState(banner?.desktop_image_url || '');
  const [mobileImageUrl, setMobileImageUrl] = useState(banner?.mobile_image_url || '');
  const [slideIntervalMs, setSlideIntervalMs] = useState(banner?.slide_interval_ms || 5000);

  // Schedule
  const [startDate, setStartDate] = useState(banner?.start_date ? banner.start_date.substring(0, 16) : '');
  const [endDate, setEndDate] = useState(banner?.end_date ? banner.end_date.substring(0, 16) : '');

  // Product Assignment (Especially for Christmas Deals)
  const [assignedProductIds, setAssignedProductIds] = useState<string[]>(banner?.product_ids || []);
  const [availableProducts, setAvailableProducts] = useState<ProductSummary[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Load catalog products for assignment
  useEffect(() => {
    let isMounted = true;
    setIsLoadingProducts(true);
    adminApi.listProducts({ page: 1 })
      .then((res: any) => {
        if (!isMounted) return;
        const items = res?.items || [];
        setAvailableProducts(items);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const p = CAMPAIGN_PRESETS.find((preset) => preset.campaign_key === presetKey || preset.id === presetKey);
    if (p) {
      setCampaignKey(p.campaign_key);
      setTitle(p.title);
      setSubtitle(p.subtitle);
      setCtaText(p.ctaText);
      setCtaUrl(p.ctaUrl);
      setDesktopImageUrl(p.imageUrl);
      setMobileImageUrl(p.imageUrl);
    }
  };

  const toggleProductAssignment = (productId: string) => {
    setAssignedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const filteredProducts = availableProducts.filter((p) => {
    if (!productSearch) return true;
    const term = productSearch.toLowerCase();
    const productName = (p.name || (p as any).title || '').toLowerCase();
    return productName.includes(term) || (p as any).category_name?.toLowerCase().includes(term);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desktopImageUrl || !mobileImageUrl) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        title,
        subtitle: subtitle || null,
        cta_text: ctaText || null,
        cta_url: ctaUrl || null,
        campaign_key: campaignKey || null,
        desktop_image_url: desktopImageUrl,
        mobile_image_url: mobileImageUrl,
        image_url: desktopImageUrl,
        slide_interval_ms: slideIntervalMs,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        product_ids: assignedProductIds,
      };

      await onSave(payload);

      // If campaign key exists, also sync backend campaign products
      if (campaignKey) {
        try {
          await adminApi.assignCampaignProducts(campaignKey, assignedProductIds);
        } catch {}
      }
    } catch {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={backdropStyles}>
      <div style={modalContentStyles}>
        {/* Modal Header */}
        <div style={headerStyles}>
          <div>
            <h3 style={titleStyles}>
              {banner ? 'Modify Hero Promotional Campaign Banner' : 'Create New Promotional Campaign Banner'}
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Configure homepage hero carousel slides, campaign destinations, and product assignments.
            </span>
          </div>
          <button type="button" onClick={onClose} style={closeBtnStyles}>&times;</button>
        </div>

        {/* Modal Body: Split Form + Live Preview */}
        <div style={splitBodyStyles}>
          {/* Form */}
          <form onSubmit={handleSubmit} style={formStyles}>
            {/* Quick Campaign Preset Picker */}
            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 12px' }}>
              <label style={{ ...labelStyles, color: '#c2410c', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
                ⭐ Promotional Campaign Preset (Instant Fill)
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handleApplyPreset(e.target.value)}
                style={{ ...inputStyles, width: '100%', borderColor: '#f97316', fontWeight: 600 }}
              >
                <option value="">-- Choose or keep custom campaign --</option>
                {CAMPAIGN_PRESETS.map((p) => (
                  <option key={p.id} value={p.campaign_key}>
                    {p.name} ({p.ctaUrl})
                  </option>
                ))}
              </select>
            </div>

            <div style={inputGroupRowStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Christmas Deals"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyles}
                />
              </div>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Campaign Key</label>
                <input
                  type="text"
                  placeholder="e.g. christmas, launch, price-drops"
                  value={campaignKey}
                  onChange={(e) => setCampaignKey(e.target.value)}
                  style={inputStyles}
                />
              </div>
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Subtitle Description</label>
              <input
                type="text"
                placeholder="e.g. Up to 60% OFF - Festive Gifts & Luxury Items"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={inputGroupRowStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>CTA Button Text</label>
                <input
                  type="text"
                  placeholder="e.g. Shop Now"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  style={inputStyles}
                />
              </div>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>CTA Redirection URL *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /promotions/christmas"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  style={inputStyles}
                />
              </div>
            </div>

            {/* Quick Image Picker Buttons */}
            <div>
              <label style={{ ...labelStyles, marginBottom: '6px', display: 'block' }}>
                Quick Asset Selector (High-Res 1024x512 Campaign Images):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {CAMPAIGN_PRESETS.map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => {
                      setDesktopImageUrl(cp.imageUrl);
                      setMobileImageUrl(cp.imageUrl);
                    }}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: desktopImageUrl === cp.imageUrl ? '1.5px solid #ff7a00' : '1px solid #d1d5db',
                      backgroundColor: desktopImageUrl === cp.imageUrl ? '#fff7ed' : '#ffffff',
                      color: desktopImageUrl === cp.imageUrl ? '#c2410c' : '#374151',
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {cp.title.replace(' Deals', '').replace(' Campaign', '')}
                  </button>
                ))}
              </div>
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Desktop Image URL *</label>
              <input
                type="text"
                required
                placeholder="/images/hero/hero_launch_campaign.jpg"
                value={desktopImageUrl}
                onChange={(e) => setDesktopImageUrl(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Mobile Image URL *</label>
              <input
                type="text"
                required
                placeholder="/images/hero/hero_launch_campaign.jpg"
                value={mobileImageUrl}
                onChange={(e) => setMobileImageUrl(e.target.value)}
                style={inputStyles}
              />
            </div>

            {/* Campaign Product Assignment Section (Especially for Christmas Deals) */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    🎁 Assigned Campaign Products ({assignedProductIds.length} selected)
                  </span>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                    Select products to show on this campaign's collection page (e.g. Christmas Deals).
                  </p>
                </div>
                {assignedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAssignedProductIds([])}
                    style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Search products by title or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ ...inputStyles, width: '100%', marginBottom: '8px', fontSize: '12px' }}
              />

              <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', padding: '4px' }}>
                {isLoadingProducts ? (
                  <div style={{ padding: '8px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>Loading catalog products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ padding: '8px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>No products match query.</div>
                ) : (
                  filteredProducts.map((p) => {
                    const isChecked = assignedProductIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          backgroundColor: isChecked ? '#fff7ed' : 'transparent',
                          borderRadius: '4px',
                          marginBottom: '2px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProductAssignment(p.id)}
                        />
                        <span style={{ flex: 1, fontWeight: isChecked ? 700 : 500, color: isChecked ? '#c2410c' : '#1e293b' }}>
                          {p.name || (p as any).title}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '10px' }}>
                          ₦{Number(p.price || (p as any).base_price || 0).toLocaleString()}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div style={inputGroupRowStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Start Date / Scheduled Active</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyles}
                />
              </div>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>End Date / Expire Schedule</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={inputStyles}
                />
              </div>
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Slide Interval Rotation (ms)</label>
              <input
                type="number"
                min={1000}
                max={60000}
                value={slideIntervalMs}
                onChange={(e) => setSlideIntervalMs(parseInt(e.target.value) || 5000)}
                style={inputStyles}
              />
            </div>

            <div style={modalActionsStyles}>
              <button type="button" onClick={onClose} style={cancelFormBtnStyles}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...submitBtnStyles,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Saving...' : banner ? 'Save Changes' : 'Create Banner'}
              </button>
            </div>
          </form>

          {/* Live Storefront Preview Panel */}
          <div style={previewColumnStyles}>
            <div style={previewHeaderStyles}>
              <div>
                <span style={previewTitleStyles}>Storefront Direct Graphic Preview</span>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                  Displayed edge-to-edge as seen by storefront visitors (2:1 aspect ratio).
                </p>
              </div>
              <div style={tabGroupStyles}>
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  style={{
                    ...previewTabBtnStyles,
                    backgroundColor: previewMode === 'desktop' ? '#1f2937' : '#ffffff',
                    color: previewMode === 'desktop' ? '#ffffff' : '#4b5563',
                  }}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  style={{
                    ...previewTabBtnStyles,
                    backgroundColor: previewMode === 'mobile' ? '#1f2937' : '#ffffff',
                    color: previewMode === 'mobile' ? '#ffffff' : '#4b5563',
                  }}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Preview Viewport Canvas */}
            <div style={viewportContainerStyles}>
              {previewMode === 'desktop' ? (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '2 / 1',
                    maxHeight: '220px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <img
                    src={desktopImageUrl || '/images/hero/hero_launch_campaign.jpg'}
                    alt={title || 'Preview'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '260px',
                    aspectRatio: '2 / 1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <img
                    src={mobileImageUrl || '/images/hero/hero_launch_campaign.jpg'}
                    alt={title || 'Preview'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '12px', fontSize: '11px', color: '#4b5563' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Destination URL:</span>
                <span style={{ color: '#ff7a00', fontWeight: 700 }}>{ctaUrl || 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Display Order:</span>
                <span>{banner?.display_order || 'Auto (End)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Assigned Products:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>{assignedProductIds.length} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const backdropStyles: React.CSSProperties = {
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
  padding: '20px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  padding: '24px',
  maxWidth: '1040px',
  width: '100%',
  maxHeight: '92vh',
  overflowY: 'auto',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 4px 0',
};

const closeBtnStyles: React.CSSProperties = {
  fontSize: '24px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: '#9ca3af',
  lineHeight: 1,
};

const splitBodyStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.8fr',
  gap: '24px',
  alignItems: 'start',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const inputGroupRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1,
};

const labelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#4b5563',
};

const inputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '16px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
};

const cancelFormBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4b5563',
  cursor: 'pointer',
};

const submitBtnStyles: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: '9999px',
  backgroundColor: '#ff7a00',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
};

const previewColumnStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  padding: '16px',
};

const previewHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
};

const previewTitleStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#1e293b',
};

const tabGroupStyles: React.CSSProperties = {
  display: 'flex',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  overflow: 'hidden',
};

const previewTabBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  padding: '4px 10px',
  border: 'none',
  cursor: 'pointer',
  outline: 'none',
};

const viewportContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '220px',
  backgroundColor: '#f3f4f6',
  borderRadius: '10px',
  padding: '16px',
  border: '1px dotted #d1d5db',
};
