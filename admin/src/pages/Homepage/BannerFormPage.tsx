import { useState } from 'react';
import type { HomepageBanner } from '@/types';

interface BannerFormPageProps {
  banner: HomepageBanner | null; // null for Create
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

export default function BannerFormPage({ banner, onClose, onSave }: BannerFormPageProps) {
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desktopImageUrl || !mobileImageUrl) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        subtitle: subtitle || null,
        cta_text: ctaText || null,
        cta_url: ctaUrl || null,
        desktop_image_url: desktopImageUrl,
        mobile_image_url: mobileImageUrl,
        slide_interval_ms: slideIntervalMs,
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
          <h3 style={titleStyles}>
            {banner ? 'Modify Hero Banner Settings' : 'Create New Hero Banner'}
          </h3>
          <button type="button" onClick={onClose} style={closeBtnStyles}>&times;</button>
        </div>

        {/* Modal Body: Split Form + Live Preview */}
        <div style={splitBodyStyles}>
          {/* Form */}
          <form onSubmit={handleSubmit} style={formStyles}>
            <div style={inputGroupRowStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Save 10% on Auto Parts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyles}
                />
              </div>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Subtitle Description</label>
                <input
                  type="text"
                  placeholder="e.g. Limited time discount on OEM filters"
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
                <label style={labelStyles}>CTA Redirection URL</label>
                <input
                  type="text"
                  placeholder="e.g. /products/filters"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  style={inputStyles}
                />
              </div>
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Desktop Image URL *</label>
              <input
                type="text"
                required
                placeholder="https://example.com/images/desktop-banner.jpg"
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
                placeholder="https://example.com/images/mobile-banner.jpg"
                value={mobileImageUrl}
                onChange={(e) => setMobileImageUrl(e.target.value)}
                style={inputStyles}
              />
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
                  Desktop Preview
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
                  Mobile Preview
                </button>
              </div>
            </div>

            {/* Preview Viewport Canvas */}
            <div style={viewportContainerStyles}>
              {previewMode === 'desktop' ? (
                // Desktop preview box
                <div
                  style={{
                    ...desktopPreviewCanvasStyles,
                    backgroundImage: `url(${desktopImageUrl || '/logo.jpg?v=2'})`,
                  }}
                >
                  <div style={bannerOverlayStyles}>
                    <h4 style={previewBannerTitleStyles}>{title || 'Main Headline Title'}</h4>
                    <p style={previewBannerSubStyles}>{subtitle || 'Supporting banner descriptor text'}</p>
                    {ctaText && <span style={previewCtaBtnStyles}>{ctaText}</span>}
                  </div>
                </div>
              ) : (
                // Mobile preview box
                <div
                  style={{
                    ...mobilePreviewCanvasStyles,
                    backgroundImage: `url(${mobileImageUrl || '/logo.jpg?v=2'})`,
                  }}
                >
                  <div style={bannerOverlayStyles}>
                    <h4 style={{ ...previewBannerTitleStyles, fontSize: '15px' }}>{title || 'Main Headline Title'}</h4>
                    <p style={{ ...previewBannerSubStyles, fontSize: '11px' }}>{subtitle || 'Supporting description'}</p>
                    {ctaText && <span style={{ ...previewCtaBtnStyles, padding: '4px 10px', fontSize: '10px' }}>{ctaText}</span>}
                  </div>
                </div>
              )}
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
  padding: '24px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '960px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
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
  gridTemplateColumns: '1.1fr 0.9fr',
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
  borderRadius: '8px',
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
  color: '#4b5563',
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
  minHeight: '260px',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px',
  border: '1px dotted #d1d5db',
};

const desktopPreviewCanvasStyles: React.CSSProperties = {
  width: '100%',
  height: '180px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '8px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'flex-end',
};

const mobilePreviewCanvasStyles: React.CSSProperties = {
  width: '160px',
  height: '240px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '8px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'flex-end',
};

const bannerOverlayStyles: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.4)', // Dark gradient simulation
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '16px',
  color: '#ffffff',
  gap: '4px',
};

const previewBannerTitleStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  margin: 0,
  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
};

const previewBannerSubStyles: React.CSSProperties = {
  fontSize: '12px',
  margin: 0,
  opacity: 0.9,
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
};

const previewCtaBtnStyles: React.CSSProperties = {
  alignSelf: 'flex-start',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  padding: '6px 12px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 700,
  marginTop: '8px',
  textTransform: 'uppercase',
  boxShadow: '0 2px 4px rgba(255,122,0,0.3)',
};
