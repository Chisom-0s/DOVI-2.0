import { useState, useRef } from 'react';
import type { HomepageBanner } from '@/types';

interface BannerFormPageProps {
  banner: HomepageBanner | null; // null for Create
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

const CAMPAIGN_PRESETS = [
  {
    label: '🎄 Christmas Deals',
    title: 'Christmas Deals',
    subtitle: 'Up to 60% OFF holiday gifts, sneakers, luxury bags, perfumes & festive essentials.',
    ctaText: 'Shop Now',
    ctaUrl: '/products?campaign=christmas',
    image: '/images/promotions/christmas_deals.jpg',
  },
  {
    label: '⚡ Limited-Time Deals',
    title: 'Limited-Time Deals',
    subtitle: 'Up to 50% OFF flash discounts on iPhones, smartwatches, blenders & AirPods.',
    ctaText: 'Shop Limited Deals',
    ctaUrl: '/products?campaign=limited-deals',
    image: '/images/promotions/limited_time_deals.jpg',
  },
  {
    label: '🎁 Free Gifts & Rewards',
    title: 'Free Gifts & Shopping Rewards',
    subtitle: 'Shop qualifying products and unlock exciting complimentary gifts & perks.',
    ctaText: 'Claim Your Free Gift',
    ctaUrl: '/products?campaign=rewards',
    image: '/images/promotions/free_gifts_rewards.jpg',
  },
  {
    label: '🚀 Launch Campaign',
    title: 'DOVI Launch Campaign',
    subtitle: 'Discover More, Shop Smart — Fast delivery, secure payment & premier savings.',
    ctaText: 'Shop Now',
    ctaUrl: '/products?campaign=launch',
    image: '/images/promotions/launch_campaign.jpg',
  },
  {
    label: '🔥 Black Friday Mega Deals',
    title: 'Black Friday Mega Deals',
    subtitle: 'Up to 70% OFF mega savings on laptops, smartphones, headphones & appliances.',
    ctaText: 'Shop the Deals',
    ctaUrl: '/products?campaign=black-friday',
    image: '/images/promotions/black_friday_deals.jpg',
  },
  {
    label: '💡 Save2Own Promo',
    title: 'Save2Own Savings Campaign',
    subtitle: 'Contribute in flexible micro-installments towards electronics & vehicles with 0% interest.',
    ctaText: 'Explore Save2Own',
    ctaUrl: '/save2own',
    image: '/images/promotions/save2own_campaign.jpg',
  },
];

export default function BannerFormPage({ banner, onClose, onSave }: BannerFormPageProps) {
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [ctaText, setCtaText] = useState(banner?.cta_text || '');
  const [ctaUrl, setCtaUrl] = useState(banner?.cta_url || '');
  const [desktopImageUrl, setDesktopImageUrl] = useState(banner?.desktop_image_url || '');
  const [mobileImageUrl, setMobileImageUrl] = useState(banner?.mobile_image_url || '');
  const [slideIntervalMs, setSlideIntervalMs] = useState(banner?.slide_interval_ms || 5000);
  const [isActive, setIsActive] = useState<boolean>(banner ? banner.is_active : true);
  
  // Schedule
  const [startDate, setStartDate] = useState(banner?.start_date ? banner.start_date.substring(0, 16) : '');
  const [endDate, setEndDate] = useState(banner?.end_date ? banner.end_date.substring(0, 16) : '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setDesktopImageUrl(dataUrl);
        setMobileImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset selector
  const handleSelectPreset = (preset: typeof CAMPAIGN_PRESETS[0]) => {
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setCtaText(preset.ctaText);
    setCtaUrl(preset.ctaUrl);
    setDesktopImageUrl(preset.image);
    setMobileImageUrl(preset.image);
  };

  // Calculate schedule status badge
  const now = new Date();
  let scheduleStatus = 'Always Active';
  let scheduleBadgeColor = '#059669';

  if (!isActive) {
    scheduleStatus = 'Deactivated / Hidden';
    scheduleBadgeColor = '#dc2626';
  } else if (endDate && new Date(endDate) < now) {
    scheduleStatus = 'Expired (Not Advertised)';
    scheduleBadgeColor = '#991b1b';
  } else if (startDate && new Date(startDate) > now) {
    scheduleStatus = `Scheduled to start on ${new Date(startDate).toLocaleDateString()}`;
    scheduleBadgeColor = '#d97706';
  } else if (startDate || endDate) {
    scheduleStatus = 'Running Live (Scheduled)';
    scheduleBadgeColor = '#059669';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desktopImageUrl) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        subtitle: subtitle || null,
        cta_text: ctaText || null,
        cta_url: ctaUrl || null,
        desktop_image_url: desktopImageUrl,
        mobile_image_url: mobileImageUrl || desktopImageUrl,
        slide_interval_ms: slideIntervalMs,
        is_active: isActive,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
      };
      await onSave(payload);
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
              {banner ? 'Modify Hero Banner Settings' : 'Create New Hero Banner'}
            </h3>
            <span style={{ fontSize: '12px', color: scheduleBadgeColor, fontWeight: 700, display: 'inline-block', marginTop: '4px' }}>
              ● {scheduleStatus}
            </span>
          </div>
          <button type="button" onClick={onClose} style={closeBtnStyles}>&times;</button>
        </div>

        {/* Modal Body: Split Form + Live Preview */}
        <div style={splitBodyStyles}>
          {/* Form */}
          <form onSubmit={handleSubmit} style={formStyles}>
            {/* Quick Presets Picker */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyles}>Quick Campaign Presets (1-Click Fill):</label>
              <div style={presetBarStyles}>
                {CAMPAIGN_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    style={presetBtnStyles}
                    title={p.subtitle}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
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
                <label style={labelStyles}>Subtitle Description</label>
                <input
                  type="text"
                  placeholder="e.g. Up to 60% OFF holiday gifts & essentials"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  style={inputStyles}
                />
              </div>
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
                  placeholder="e.g. /products?campaign=christmas"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  style={inputStyles}
                />
              </div>
            </div>

            {/* Image File Upload & Replace */}
            <div style={{ ...inputGroupStyles, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <label style={{ ...labelStyles, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Banner Artwork Image *</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={uploadBtnStyles}
                >
                  📁 Upload / Replace File
                </button>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <input
                type="text"
                required
                placeholder="/images/promotions/christmas_deals.jpg or https://..."
                value={desktopImageUrl}
                onChange={(e) => {
                  setDesktopImageUrl(e.target.value);
                  if (!mobileImageUrl) setMobileImageUrl(e.target.value);
                }}
                style={{ ...inputStyles, marginTop: '6px' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Upload an image directly from your computer or select a pre-designed campaign graphic above.
              </span>
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

            <div style={inputGroupRowStyles}>
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
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Campaign Status</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  style={inputStyles}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
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

          {/* Live Preview Panel */}
          <div style={previewColumnStyles}>
            <div style={previewHeaderStyles}>
              <span style={previewTitleStyles}>Live Responsive Preview</span>
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
              <div
                style={{
                  ...(previewMode === 'desktop' ? desktopPreviewCanvasStyles : mobilePreviewCanvasStyles),
                  backgroundImage: `url(${desktopImageUrl || '/logo.jpg?v=2'})`,
                }}
              >
                {/* Clean edge-to-edge artwork preview */}
              </div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                Redirects to: <strong style={{ color: '#ff7a00' }}>{ctaUrl || '/products'}</strong>
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
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '24px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '960px',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '20px 24px',
  borderBottom: '1px solid #e5e7eb',
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 700,
  color: '#111827',
};

const closeBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  color: '#9ca3af',
  cursor: 'pointer',
  padding: '0 4px',
};

const splitBodyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '24px',
  padding: '24px',
};

const formStyles: React.CSSProperties = {
  flex: 1.2,
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1,
};

const inputGroupRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
};

const inputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const presetBarStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '6px',
};

const presetBtnStyles: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#334155',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const uploadBtnStyles: React.CSSProperties = {
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  marginTop: '12px',
};

const cancelFormBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#374151',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const submitBtnStyles: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(255, 122, 0, 0.3)',
};

const previewColumnStyles: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const previewHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const previewTitleStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#111827',
};

const tabGroupStyles: React.CSSProperties = {
  display: 'flex',
  borderRadius: '6px',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
};

const previewTabBtnStyles: React.CSSProperties = {
  border: 'none',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
};

const viewportContainerStyles: React.CSSProperties = {
  backgroundColor: '#0f172a',
  borderRadius: '12px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '260px',
};

const desktopPreviewCanvasStyles: React.CSSProperties = {
  width: '100%',
  aspectRatio: '2.15 / 1',
  borderRadius: '8px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
};

const mobilePreviewCanvasStyles: React.CSSProperties = {
  width: '260px',
  aspectRatio: '2 / 1',
  borderRadius: '8px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
};
