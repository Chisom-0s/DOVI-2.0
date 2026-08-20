import { useState } from 'react';
import type { HomepageSection } from '@/types';

interface SectionBuilderModalProps {
  section: HomepageSection | null; // Null means creating new
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

const SECTION_TYPES = [
  'HERO_BANNER', 'POPULAR_CATEGORIES', 'CATEGORY_GRID', 'CATEGORY_CAROUSEL',
  'FLASH_DEALS', 'TRENDING_NOW', 'BEST_SELLERS', 'NEW_ARRIVALS',
  'RECOMMENDED_FOR_YOU', 'TOP_RATED', 'DEALS_OF_THE_DAY', 'LIMITED_TIME_OFFERS',
  'FEATURED_PRODUCTS', 'FEATURED_VENDORS', 'POPULAR_VENDORS', 'PROMOTED_PRODUCTS',
  'SPONSORED_PRODUCTS', 'PRICE_DROP', 'RECENTLY_VIEWED', 'BUY_AGAIN',
  'SAVE2OWN_PRODUCTS', 'SAVE2OWN_FEATURED', 'DOVI_AUTO', 'AUTO_PARTS',
  'AUTO_ACCESSORIES', 'BOOKS', 'ELECTRONICS', 'FASHION', 'PHONES',
  'LAPTOPS', 'HOME_AND_LIVING', 'CAMPUS_DEALS', 'LOCATION_BASED_PRODUCTS',
  'SEASONAL_COLLECTION', 'STAFF_PICKS', 'ADMIN_CURATED', 'BRAND_COLLECTION',
  'VENDOR_COLLECTION', 'BUNDLE_DEALS', 'CLEARANCE_SALE'
];

const LAYOUT_OPTIONS = [
  { value: 'PRODUCT_GRID', label: 'Product Grid Layout' },
  { value: 'HORIZONTAL_CAROUSEL', label: 'Horizontal Scroll Carousel' },
  { value: 'COMPACT_LIST', label: 'Compact List Rows' },
  { value: 'LARGE_PRODUCT_CARDS', label: 'Large Block Featured Cards' },
  { value: 'CATEGORY_GRID', label: 'Category Grid' },
  { value: 'CATEGORY_CIRCLES', label: 'Category Circles' },
  { value: 'CATEGORY_PILLS', label: 'Category Pills Strip' },
  { value: 'BANNER', label: 'Promo Banner Block' },
  { value: 'BRAND_GRID', label: 'Brand Logo Grid' },
  { value: 'VENDOR_GRID', label: 'Vendor Rating Grid' },
  { value: 'AUTO_LISTING_GRID', label: 'Vehicle Listing Cards' }
];

const DISPLAY_LIMITS = [4, 6, 8, 10, 12, 20];

const SOURCE_STRATEGIES = [
  { value: 'AUTOMATIC', label: 'Automatic (Backend Queries)' },
  { value: 'MANUAL', label: 'Manual Curation (Select Products)' },
  { value: 'CATEGORY', label: 'Category Restriction' },
  { value: 'VENDOR', label: 'Vendor Restriction' },
  { value: 'QUERY', label: 'Custom Filtering Rules' }
];

const MOCK_MEMBER_PRODUCTS = [
  { id: 'prod-iphone-15', name: 'iPhone 15 Pro Max' },
  { id: 'prod-macbook', name: 'MacBook Pro 14" M3' },
  { id: 'prod-airpods', name: 'Apple AirPods Pro 2' },
  { id: 'prod-ps5', name: 'Sony PlayStation 5' },
  { id: 'prod-engine-oil', name: 'Mobil 1 Motor Oil 5W-30' },
  { id: 'prod-brake-pads', name: 'Brembo Brake Pads' },
  { id: 'prod-dashcam', name: '70mai Dash Cam Pro' }
];

export default function SectionBuilderModal({ section, onClose, onSave }: SectionBuilderModalProps) {
  const isEdit = !!section;

  // State initialization mapping config parameters
  const [name, setName] = useState(section?.name || '');
  const [title, setTitle] = useState(section?.title || '');
  const [subtitle, setSubtitle] = useState(section?.subtitle || '');
  const [icon, setIcon] = useState(section?.icon || '');
  const [key, setKey] = useState(section?.key || 'FLASH_DEALS');
  const [displayLimit, setDisplayLimit] = useState(section?.display_limit || 6);
  const [isActive, setIsActive] = useState(section?.is_active ?? true);
  const [startsAt, setStartsAt] = useState(section?.starts_at ? section.starts_at.substring(0, 10) : '');
  const [endsAt, setEndsAt] = useState(section?.ends_at ? section.ends_at.substring(0, 10) : '');

  // Configuration inner states
  const [layout, setLayout] = useState<HomepageSection['configuration']['layout']>(
    (section?.configuration?.layout as any) || 'PRODUCT_GRID'
  );
  const [source, setSource] = useState<HomepageSection['configuration']['source']>(
    (section?.configuration?.source as any) || 'AUTOMATIC'
  );
  const [sourceId, setSourceId] = useState(section?.configuration?.source_id || '');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    section?.configuration?.manual_product_ids || []
  );

  // Filters inner states
  const [minDiscount, setMinDiscount] = useState(section?.configuration?.filters?.min_discount || 0);
  const [minRating, setMinRating] = useState(section?.configuration?.filters?.min_rating || 0);
  const [inStockOnly, setInStockOnly] = useState(section?.configuration?.filters?.in_stock_only ?? true);
  const [priceMin, setPriceMin] = useState(section?.configuration?.filters?.price_min || '');
  const [priceMax, setPriceMax] = useState(section?.configuration?.filters?.price_max || '');
  const [sortBy, setSortBy] = useState(section?.configuration?.sort_by || 'newest');

  // Styling inner states
  const [ctaText, setCtaText] = useState(section?.configuration?.cta_text || '');
  const [ctaUrl, setCtaUrl] = useState(section?.configuration?.cta_url || '');
  const [backgroundColor, setBackgroundColor] = useState(section?.configuration?.background_color || '');

  const [isSaving, setIsSaving] = useState(false);

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      name,
      title,
      subtitle: subtitle || null,
      icon: icon || null,
      key,
      is_active: isActive,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      display_limit: Number(displayLimit),
      configuration: {
        layout,
        source,
        source_id: sourceId || undefined,
        manual_product_ids: source === 'MANUAL' ? selectedProductIds : undefined,
        filters: {
          min_discount: Number(minDiscount) || undefined,
          min_rating: Number(minRating) || undefined,
          in_stock_only: inStockOnly,
          price_min: priceMin ? Number(priceMin) : undefined,
          price_max: priceMax ? Number(priceMax) : undefined,
        },
        sort_by: sortBy,
        cta_text: ctaText || undefined,
        cta_url: ctaUrl || undefined,
        background_color: backgroundColor || undefined,
      }
    };

    try {
      await onSave(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={backdropStyles}>
      <div style={modalContentStyles}>
        {/* Modal Header */}
        <div style={headerStyles}>
          <h3 style={modalTitleStyles}>{isEdit ? 'Configure Homepage Section' : 'Create Homepage Section'}</h3>
          <button type="button" onClick={onClose} style={closeBtnStyles}>&times;</button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={formStyles}>
          {/* Group 1: Core Fields */}
          <div style={sectionCardStyles}>
            <div style={cardHeadingStyles}>Core Parameters</div>
            <div style={rowGridStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Section Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Deals Banner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>

              <div style={inputGroupStyles}>
                <label style={labelStyles}>Section Type</label>
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  style={selectStyles}
                  disabled={isSaving}
                >
                  {SECTION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={rowGridStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Display Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Deals"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>

              <div style={inputGroupStyles}>
                <label style={labelStyles}>Section Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Limited offers on motor oil"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div style={rowGridStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Icon Emoji</label>
                <input
                  type="text"
                  placeholder="e.g. ⚡ or 🚗"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>

              <div style={inputGroupStyles}>
                <label style={labelStyles}>Layout Template</label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as any)}
                  style={selectStyles}
                  disabled={isSaving}
                >
                  {LAYOUT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 2: Content Source Strategy */}
          <div style={sectionCardStyles}>
            <div style={cardHeadingStyles}>Content Sourcing Strategy</div>
            <div style={rowGridStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Product Source Type</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  style={selectStyles}
                  disabled={isSaving}
                >
                  {SOURCE_STRATEGIES.map(src => (
                    <option key={src.value} value={src.value}>{src.label}</option>
                  ))}
                </select>
              </div>

              <div style={inputGroupStyles}>
                <label style={labelStyles}>Display Max Limit</label>
                <select
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(Number(e.target.value))}
                  style={selectStyles}
                  disabled={isSaving}
                >
                  {DISPLAY_LIMITS.map(limitOption => (
                    <option key={limitOption} value={limitOption}>{limitOption} items</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Source ID Input (Vendor or Category name) */}
            {(source === 'CATEGORY' || source === 'VENDOR') && (
              <div style={inputGroupStyles}>
                <label style={labelStyles}>
                  {source === 'CATEGORY' ? 'Category Slug Restrict' : 'Vendor Slug/ID Restrict'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={source === 'CATEGORY' ? 'e.g. auto-parts' : 'e.g. slot'}
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>
            )}

            {/* Manual Product Selection checklist */}
            {source === 'MANUAL' && (
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Select Curated Products Checklist</label>
                <div style={checkboxGridStyles}>
                  {MOCK_MEMBER_PRODUCTS.map(p => (
                    <label key={p.id} style={checkboxLabelStyles}>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => handleProductToggle(p.id)}
                        disabled={isSaving}
                        style={{ marginRight: '6px' }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Group 3: Queries Filters & Sorting */}
          {source !== 'MANUAL' && (
            <div style={sectionCardStyles}>
              <div style={cardHeadingStyles}>Query Filtering & Sorting</div>
              <div style={rowGridStyles}>
                <div style={inputGroupStyles}>
                  <label style={labelStyles}>Min Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(Number(e.target.value))}
                    style={inputStyles}
                    disabled={isSaving}
                  />
                </div>

                <div style={inputGroupStyles}>
                  <label style={labelStyles}>Min Rating</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    style={inputStyles}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div style={rowGridStyles}>
                <div style={inputGroupStyles}>
                  <label style={labelStyles}>Min Price (₦)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    style={inputStyles}
                    disabled={isSaving}
                  />
                </div>

                <div style={inputGroupStyles}>
                  <label style={labelStyles}>Max Price (₦)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    style={inputStyles}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div style={rowGridStyles}>
                <div style={inputGroupStyles}>
                  <label style={labelStyles}>Sorting Rule</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={selectStyles}
                    disabled={isSaving}
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="highest_discount">Highest Discounts</option>
                    <option value="trending_score">Trending Event signals</option>
                  </select>
                </div>

                <label style={{ ...checkboxLabelStyles, alignSelf: 'center', marginTop: '20px' }}>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    disabled={isSaving}
                    style={{ marginRight: '6px' }}
                  />
                  Require In-Stock Only
                </label>
              </div>
            </div>
          )}

          {/* Group 4: Scheduling & Visual Styling */}
          <div style={sectionCardStyles}>
            <div style={cardHeadingStyles}>Scheduling & Promotions</div>
            <div style={rowGridStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Start Campaign Date</label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>

              <div style={inputGroupStyles}>
                <label style={labelStyles}>End Campaign Date</label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div style={rowGridStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>CTA Button Slogan</label>
                <input
                  type="text"
                  placeholder="e.g. See All"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>

              <div style={inputGroupStyles}>
                <label style={labelStyles}>CTA Slogan URL</label>
                <input
                  type="text"
                  placeholder="e.g. /products?cat=parts"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div style={rowGridStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>Banner Background Color</label>
                <input
                  type="text"
                  placeholder="e.g. #f9fafb or rgba(0,0,0,0.05)"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={inputStyles}
                  disabled={isSaving}
                />
              </div>

              <label style={{ ...checkboxLabelStyles, alignSelf: 'center', marginTop: '20px' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSaving}
                  style={{ marginRight: '6px' }}
                />
                Active Section Status
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={modalActionsStyles}>
            <button type="button" onClick={onClose} style={cancelBtnStyles} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" style={submitBtnStyles} disabled={isSaving}>
              {isSaving ? 'Saving Section...' : isEdit ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </form>
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
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '24px',
  boxSizing: 'border-box',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '720px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  boxSizing: 'border-box',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const closeBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '28px',
  cursor: 'pointer',
  color: '#9ca3af',
  lineHeight: 1,
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const sectionCardStyles: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  backgroundColor: '#f9fafb',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const cardHeadingStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-primary, #ff7a00)',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '6px',
  marginBottom: '4px',
};

const rowGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#4b5563',
};

const inputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
};

const selectStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  backgroundColor: '#ffffff',
  outline: 'none',
};

const checkboxGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
  maxHeight: '120px',
  overflowY: 'auto',
  padding: '8px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
};

const checkboxLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  color: '#374151',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
};

const cancelBtnStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  padding: '10px 20px',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
};

const submitBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
};
