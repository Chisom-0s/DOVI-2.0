import { useEffect, useState, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/client';
import { productsApi } from '@/api/products';
import { getProductImageUrl } from '@/utils/image';
import type { ProductVariant } from '@/types';

interface ProductImageItem {
  id: string;
  image_url?: string;
  url?: string;
  thumbnail_url?: string;
  is_primary?: boolean;
}

interface Product {
  id: string;
  name: string;
  category_name: string;
  category: string;
  base_price: number | string;
  reference_code: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED';
  description?: string;
  images?: ProductImageItem[];
  primary_image_url?: string;
  variants?: ProductVariant[];
  stock_quantity?: number;
}

interface Category {
  id: string;
  name: string;
}

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

interface ColorVariantItem {
  id: string;
  name: string;
  hex: string;
  units: number;
  priceOverride?: string;
}

interface SpecificationItem {
  id: string;
  key: string;
  value: string;
}

// Preset color options for quick 1-click addition
const PRESET_COLORS = [
  { name: 'Midnight Black', hex: '#111827' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Space Gray', hex: '#4B5563' },
  { name: 'Platinum Silver', hex: '#E5E7EB' },
  { name: 'Ocean Blue', hex: '#2563EB' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Champagne Gold', hex: '#D97706' },
  { name: 'Rose Gold', hex: '#DB2777' },
  { name: 'Deep Purple', hex: '#7C3AED' },
  { name: 'Sunset Orange', hex: '#EA580C' },
];

// Preset specification attributes for quick addition
const PRESET_SPEC_KEYS = [
  'Brand',
  'Model / Series',
  'Material',
  'Dimensions',
  'Weight',
  'Condition',
  'Warranty',
  'Battery Capacity',
  'Screen Size',
  'RAM / Storage',
  'Connectivity',
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function VendorProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'inventory' | 'specs' | 'media'>('basic');

  // Core Form Fields
  const [form, setForm] = useState({
    name: '',
    category: '',
    base_price: '',
    description: '',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'PAUSED',
  });

  // Stock Units & Color Variants State
  const [baseUnits, setBaseUnits] = useState<string>('10');
  const [colors, setColors] = useState<ColorVariantItem[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');
  const [newColorUnits, setNewColorUnits] = useState('10');

  // Product Specifications State
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([
    { id: 'spec-1', key: 'Brand', value: '' },
    { id: 'spec-2', key: 'Condition', value: 'Brand New' },
    { id: 'spec-3', key: 'Warranty', value: '1 Year Official Warranty' },
  ]);

  // Image Upload State (Create Flow)
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute total inventory stock units
  const calculatedTotalUnits = useMemo(() => {
    if (colors.length > 0) {
      return colors.reduce((sum, c) => sum + (Number(c.units) || 0), 0);
    }
    return parseInt(baseUnits, 10) || 0;
  }, [colors, baseUnits]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/products/my-products/');
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await apiClient.get('/api/v1/categories/');
      setCategories(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const cleanupImagePreviews = () => {
    selectedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setSelectedImages([]);
  };

  const handleOpenAdd = () => {
    cleanupImagePreviews();
    setEditingProduct(null);
    setActiveFormTab('basic');
    setForm({
      name: '',
      category: categories[0]?.id || '',
      base_price: '',
      description: '',
      status: 'PUBLISHED',
    });
    setBaseUnits('10');
    setColors([]);
    setNewColorName('');
    setNewColorHex('#2563EB');
    setNewColorUnits('10');
    setSpecifications([
      { id: 'spec-1', key: 'Brand', value: '' },
      { id: 'spec-2', key: 'Condition', value: 'Brand New' },
      { id: 'spec-3', key: 'Warranty', value: '1 Year Official Warranty' },
    ]);
    setUploadStatusText('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    cleanupImagePreviews();
    setEditingProduct(p);
    setActiveFormTab('basic');

    // Extract raw description and embedded DOVI_SPECS metadata
    let cleanDesc = p.description || '';
    const parsedSpecs: SpecificationItem[] = [];

    if (cleanDesc) {
      const metaMatch = cleanDesc.match(/<!-- DOVI_SPECS: ([\s\S]*?) -->/);
      if (metaMatch && metaMatch[1]) {
        try {
          const parsed = JSON.parse(metaMatch[1]);
          if (typeof parsed === 'object' && parsed !== null) {
            Object.entries(parsed).forEach(([k, v], idx) => {
              parsedSpecs.push({
                id: `edit-spec-${idx}`,
                key: k,
                value: String(v),
              });
            });
          }
        } catch {
          // ignore parsing error
        }
        cleanDesc = cleanDesc.replace(/<!-- DOVI_SPECS: [\s\S]*? -->/g, '').trim();
      }
    }

    setForm({
      name: p.name,
      category: p.category,
      base_price: p.base_price.toString(),
      description: cleanDesc,
      status: p.status,
    });

    // Populate existing variants/colors if available
    if (p.variants && p.variants.length > 0) {
      const mappedColors: ColorVariantItem[] = p.variants
        .filter(v => v.name && v.name.toLowerCase() !== 'standard')
        .map((v, i) => ({
          id: v.id || `v-${i}`,
          name: v.name,
          hex: v.color_code || '#4B5563',
          units: v.stock ?? v.stock_quantity ?? 10,
          priceOverride: v.price_override ? String(v.price_override) : '',
        }));

      setColors(mappedColors);
      const totalStock = p.variants.reduce((sum, v) => sum + (v.stock ?? v.stock_quantity ?? 0), 0);
      setBaseUnits(String(totalStock || p.stock_quantity || 10));
    } else {
      setColors([]);
      setBaseUnits(String(p.stock_quantity || 10));
    }

    if (parsedSpecs.length > 0) {
      setSpecifications(parsedSpecs);
    } else {
      setSpecifications([
        { id: 'spec-1', key: 'Brand', value: '' },
        { id: 'spec-2', key: 'Condition', value: 'Brand New' },
      ]);
    }

    setUploadStatusText('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    cleanupImagePreviews();
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/api/v1/products/${id}/`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  // Color Variant Handlers
  const handleAddPresetColor = (preset: { name: string; hex: string }) => {
    if (colors.some(c => c.name.toLowerCase() === preset.name.toLowerCase())) {
      toast('Color already added to variant list', { icon: 'ℹ️' });
      return;
    }
    const defaultUnits = parseInt(baseUnits, 10) > 0 ? Math.max(1, Math.floor(parseInt(baseUnits, 10) / (colors.length + 1))) : 10;
    setColors(prev => [
      ...prev,
      {
        id: `color-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: preset.name,
        hex: preset.hex,
        units: defaultUnits,
      },
    ]);
    toast.success(`Added ${preset.name}`);
  };

  const handleAddCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) {
      toast.error('Please enter a color name (e.g., Titanium Gray)');
      return;
    }
    if (colors.some(c => c.name.toLowerCase() === newColorName.trim().toLowerCase())) {
      toast.error('A color with this name is already in the list');
      return;
    }
    const units = Math.max(1, parseInt(newColorUnits, 10) || 1);
    setColors(prev => [
      ...prev,
      {
        id: `color-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: newColorName.trim(),
        hex: newColorHex,
        units,
      },
    ]);
    setNewColorName('');
    setNewColorUnits('10');
    toast.success(`Added color variant "${newColorName.trim()}"`);
  };

  const handleRemoveColor = (id: string) => {
    setColors(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateColorUnits = (id: string, units: number) => {
    setColors(prev =>
      prev.map(c => (c.id === id ? { ...c, units: Math.max(0, units) } : c))
    );
  };

  // Specification Handlers
  const handleAddPresetSpec = (keyName: string) => {
    if (specifications.some(s => s.key.toLowerCase() === keyName.toLowerCase())) {
      toast(`"${keyName}" specification field already exists`, { icon: 'ℹ️' });
      return;
    }
    setSpecifications(prev => [
      ...prev,
      {
        id: `spec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        key: keyName,
        value: '',
      },
    ]);
  };

  const handleAddCustomSpecRow = () => {
    setSpecifications(prev => [
      ...prev,
      {
        id: `spec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        key: '',
        value: '',
      },
    ]);
  };

  const handleUpdateSpec = (id: string, field: 'key' | 'value', text: string) => {
    setSpecifications(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: text } : s))
    );
  };

  const handleRemoveSpec = (id: string) => {
    setSpecifications(prev => prev.filter(s => s.id !== id));
  };

  // Image Selection Handlers
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: SelectedImage[] = [];
    const existingCount = selectedImages.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not supported. Please use JPG, PNG, or WEBP.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 5MB limit.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const isPrimary = existingCount === 0 && newImages.length === 0;

      newImages.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        isPrimary,
      });
    }

    if (newImages.length > 0) {
      setSelectedImages(prev => {
        const combined = [...prev, ...newImages];
        const hasPrimary = combined.some(img => img.isPrimary);
        if (!hasPrimary && combined.length > 0) {
          combined[0].isPrimary = true;
        }
        return combined;
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const remaining = prev.filter(img => img.id !== id);
      if (target?.isPrimary && remaining.length > 0) {
        remaining[0].isPrimary = true;
      }
      return remaining;
    });
  };

  const handleSetPrimary = (id: string) => {
    setSelectedImages(prev =>
      prev.map(img => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.base_price) {
      toast.error('Please fill in product name, category, and base price.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Build structured specifications mapping
      const specsMap: Record<string, string> = {};
      specifications.forEach(s => {
        if (s.key.trim() && s.value.trim()) {
          specsMap[s.key.trim()] = s.value.trim();
        }
      });

      // 2. Format description with structured specs metadata block
      let formattedDescription = form.description.trim();
      if (Object.keys(specsMap).length > 0) {
        formattedDescription = `${formattedDescription}\n\n<!-- DOVI_SPECS: ${JSON.stringify(specsMap)} -->`.trim();
      }

      // 3. Build product variants from colors or standard stock
      const productPrefix = form.name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRD';
      const variantsPayload =
        colors.length > 0
          ? colors.map(c => {
              const colorCode = c.name.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CLR';
              const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
              return {
                name: c.name,
                sku: `${productPrefix}-${colorCode}-${randSuffix}`,
                quantity: Math.max(0, Number(c.units) || 0),
                price_override: c.priceOverride ? parseFloat(c.priceOverride) : null,
              };
            })
          : [
              {
                name: 'Standard',
                sku: `${productPrefix}-STD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                quantity: Math.max(0, parseInt(baseUnits, 10) || 0),
                price_override: null,
              },
            ];

      if (editingProduct) {
        // Edit Mode: Update product details
        setUploadStatusText('Updating product details & specifications...');
        await apiClient.patch(`/api/v1/products/${editingProduct.id}/`, {
          name: form.name,
          category: form.category,
          base_price: parseFloat(form.base_price),
          description: formattedDescription,
          status: form.status,
        });

        toast.success('Product updated successfully');
        handleCloseModal();
        fetchProducts();
      } else {
        // Create Mode: Step 1 -> Create Product with Variants & Initial Inventory
        setUploadStatusText('Creating catalog listing with color variants & stock...');
        const { data: createdProduct } = await apiClient.post('/api/v1/products/', {
          name: form.name,
          category: form.category,
          base_price: parseFloat(form.base_price),
          description: formattedDescription,
          status: form.status,
          variants: variantsPayload,
        });

        // Step 2 -> Upload Images (if any selected)
        if (selectedImages.length > 0 && createdProduct?.id) {
          let uploadErrors = 0;
          for (let i = 0; i < selectedImages.length; i++) {
            const img = selectedImages[i];
            setUploadStatusText(`Uploading image ${i + 1} of ${selectedImages.length}...`);
            try {
              await productsApi.uploadImage(createdProduct.id, img.file, img.isPrimary);
            } catch (imgErr: any) {
              console.error(`Image upload failed for image ${i + 1}:`, imgErr);
              uploadErrors++;
            }
          }

          if (uploadErrors === 0) {
            toast.success('Product created with units, colors, and media!');
          } else {
            toast.error(
              `Product was created, but ${uploadErrors} image(s) failed to upload.`
            );
          }
        } else {
          toast.success('Product listing created successfully');
        }

        handleCloseModal();
        fetchProducts();
      }
    } catch (err: any) {
      const apiErr = err?.response?.data;
      const details =
        apiErr?.error?.message ||
        apiErr?.detail ||
        apiErr?.message ||
        (err?.response?.status === 403
          ? 'Permission denied: Your vendor store profile must be approved by an administrator before listing products.'
          : err?.message || 'Failed to save product');
      toast.error(details);
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  const filtered = products.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={wrapperStyles}>
      <div style={headerRowStyles}>
        <div>
          <h2 style={titleStyles}>Catalog Inventory & Products</h2>
          <p style={subtitleStyles}>
            Manage product listings, inventory stock units, color variants, and technical specifications.
          </p>
        </div>
        <button onClick={handleOpenAdd} style={addBtnStyles} id="vendor-add-product-btn">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div style={searchRowStyles}>
        <input
          type="text"
          placeholder="Search by product name or reference code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchInputStyles}
        />
      </div>

      {/* Product Table */}
      <div style={tableWrapperStyles}>
        {isLoading ? (
          <div style={loadingStyles}>Retrieving database records...</div>
        ) : filtered.length === 0 ? (
          <div style={emptyStyles}>No products found in your catalog.</div>
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr style={tableHeaderRowStyles}>
                <th style={thStyles}>REF CODE</th>
                <th style={thStyles}>PRODUCT</th>
                <th style={thStyles}>CATEGORY</th>
                <th style={thStyles}>PRICE (₦)</th>
                <th style={thStyles}>STOCK & COLORS</th>
                <th style={thStyles}>STATUS</th>
                <th style={{ ...thStyles, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const thumbUrl = getProductImageUrl(p);

                // Compute stock & variants count
                const variantCount = p.variants?.length || 0;
                const totalStock =
                  p.variants && p.variants.length > 0
                    ? p.variants.reduce((sum, v) => sum + (v.stock ?? v.stock_quantity ?? 0), 0)
                    : p.stock_quantity ?? 0;

                const isLowStock = totalStock > 0 && totalStock <= 5;
                const isOutOfStock = totalStock <= 0;

                return (
                  <tr key={p.id} style={tableRowStyles}>
                    <td style={tdRefStyles}>{p.reference_code || 'N/A'}</td>
                    <td style={tdNameStyles}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={thumbUrl}
                          alt={p.name}
                          style={tableThumbStyles}
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                          }}
                        />
                        <div>
                          <div>{p.name}</div>
                          {variantCount > 1 && (
                            <span style={variantSubtextStyles}>
                              {variantCount} color variants available
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyles}>{p.category_name}</td>
                    <td style={tdPriceStyles}>
                      ₦{parseFloat(p.base_price.toString()).toLocaleString()}
                    </td>
                    <td style={tdStyles}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span
                          style={{
                            fontWeight: '700',
                            color: isOutOfStock
                              ? 'var(--color-danger)'
                              : isLowStock
                              ? 'var(--color-warning)'
                              : 'var(--color-text)',
                          }}
                        >
                          {totalStock} {totalStock === 1 ? 'unit' : 'units'}
                        </span>
                        {variantCount > 0 && (
                          <span style={colorPillListStyles}>
                            {variantCount} {variantCount === 1 ? 'color' : 'colors'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyles}>
                      <span
                        style={{
                          ...statusBadgeStyles,
                          color:
                            p.status === 'PUBLISHED'
                              ? 'var(--color-success)'
                              : p.status === 'PAUSED'
                              ? 'var(--color-warning)'
                              : 'var(--color-text-muted)',
                          backgroundColor:
                            p.status === 'PUBLISHED'
                              ? 'rgba(39, 174, 96, 0.08)'
                              : p.status === 'PAUSED'
                              ? 'rgba(255, 159, 67, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={tdActionsStyles}>
                      <button onClick={() => handleOpenEdit(p)} style={actionBtnEditStyles}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={actionBtnDeleteStyles}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pop-up Modal */}
      {modalOpen && (
        <div style={modalBackdropStyles}>
          <div style={modalCardStyles}>
            {/* Modal Header */}
            <div style={modalHeaderStyles}>
              <div>
                <h3 style={{ ...titleStyles, margin: 0 }}>
                  {editingProduct ? 'Edit Catalog Listing' : 'Create Product Listing'}
                </h3>
                <p style={modalSubtitleStyles}>
                  Specify units in stock, available colours, technical specifications, and media.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                style={closeBtnStyles}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={tabNavWrapperStyles}>
              <button
                type="button"
                onClick={() => setActiveFormTab('basic')}
                style={{
                  ...tabNavBtnStyles,
                  borderBottomColor: activeFormTab === 'basic' ? 'var(--color-primary)' : 'transparent',
                  color: activeFormTab === 'basic' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('inventory')}
                style={{
                  ...tabNavBtnStyles,
                  borderBottomColor: activeFormTab === 'inventory' ? 'var(--color-primary)' : 'transparent',
                  color: activeFormTab === 'inventory' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                2. Units & Colours {colors.length > 0 && `(${calculatedTotalUnits})`}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('specs')}
                style={{
                  ...tabNavBtnStyles,
                  borderBottomColor: activeFormTab === 'specs' ? 'var(--color-primary)' : 'transparent',
                  color: activeFormTab === 'specs' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                3. Specifications ({specifications.filter(s => s.key && s.value).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('media')}
                style={{
                  ...tabNavBtnStyles,
                  borderBottomColor: activeFormTab === 'media' ? 'var(--color-primary)' : 'transparent',
                  color: activeFormTab === 'media' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                4. Media & Description
              </button>
            </div>

            <form onSubmit={handleSubmit} style={formStyles}>
              {/* TAB 1: BASIC INFO */}
              {activeFormTab === 'basic' && (
                <div style={tabSectionStyles}>
                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>PRODUCT NAME *</label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 15 Pro Max, MacBook Air M3, Nike Air Jordan"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      style={inputStyles}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div style={doubleColGridStyles}>
                    <div style={inputGroupStyles}>
                      <label style={labelStyles}>CATEGORY *</label>
                      <select
                        value={form.category}
                        onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                        style={selectStyles}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={inputGroupStyles}>
                      <label style={labelStyles}>BASE PRICE (₦) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.base_price}
                        onChange={e => setForm(prev => ({ ...prev, base_price: e.target.value }))}
                        style={inputStyles}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>LISTING STATUS</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                      style={selectStyles}
                      disabled={isSubmitting}
                    >
                      <option value="PUBLISHED">Published (Visible on Marketplace)</option>
                      <option value="DRAFT">Draft (Save for later)</option>
                      <option value="PAUSED">Paused (Hidden temporarily)</option>
                    </select>
                  </div>

                  <div style={tabPromptBannerStyles}>
                    <span>Next: Set how many units you have and the available product colours.</span>
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('inventory')}
                      style={nextTabBtnStyles}
                    >
                      Continue to Units & Colours →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: UNITS & AVAILABLE COLOURS */}
              {activeFormTab === 'inventory' && (
                <div style={tabSectionStyles}>
                  {/* Total Units Header Card */}
                  <div style={inventorySummaryCardStyles}>
                    <div>
                      <div style={inventorySummaryLabelStyles}>TOTAL UNITS AVAILABLE</div>
                      <div style={inventorySummaryValueStyles}>
                        {calculatedTotalUnits} {calculatedTotalUnits === 1 ? 'Unit' : 'Units'}
                      </div>
                    </div>
                    <div style={inventorySummarySubtextStyles}>
                      {colors.length > 0
                        ? `Allocated across ${colors.length} color ${colors.length === 1 ? 'variant' : 'variants'}`
                        : 'Standard single-variant product stock'}
                    </div>
                  </div>

                  {/* Stock Units Input (If no color variants are set) */}
                  {colors.length === 0 && (
                    <div style={inputGroupStyles}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label style={labelStyles}>HOW MANY UNITS DO YOU HAVE IN STOCK? *</label>
                        <span style={helperTextStyles}>Total inventory count</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 25"
                        value={baseUnits}
                        onChange={e => setBaseUnits(e.target.value)}
                        style={inputStyles}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  )}

                  {/* Available Colours Section */}
                  <div style={colorsSectionWrapperStyles}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={labelStyles}>PRODUCT COLOURS & VARIANT UNITS</label>
                      <span style={helperTextStyles}>Click presets or add custom colours</span>
                    </div>

                    {/* Quick Preset Colours */}
                    <div style={presetColorsGridStyles}>
                      {PRESET_COLORS.map(preset => {
                        const isAdded = colors.some(
                          c => c.name.toLowerCase() === preset.name.toLowerCase()
                        );
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleAddPresetColor(preset)}
                            style={{
                              ...presetColorChipStyles,
                              borderColor: isAdded ? 'var(--color-primary)' : 'var(--color-border)',
                              backgroundColor: isAdded ? 'rgba(255, 122, 0, 0.08)' : '#ffffff',
                            }}
                            title={`Add ${preset.name}`}
                          >
                            <span
                              style={{
                                ...presetColorCircleStyles,
                                backgroundColor: preset.hex,
                                border: preset.hex === '#FFFFFF' ? '1px solid #d1d5db' : 'none',
                              }}
                            />
                            <span>{preset.name}</span>
                            {isAdded && <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Color Input Form */}
                    <div style={customColorFormStyles}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="color"
                          value={newColorHex}
                          onChange={e => setNewColorHex(e.target.value)}
                          style={colorPickerInputStyles}
                          title="Choose custom color hex"
                        />
                        <input
                          type="text"
                          placeholder="Custom color name (e.g. Alpine Green)"
                          value={newColorName}
                          onChange={e => setNewColorName(e.target.value)}
                          style={{ ...inputStyles, flex: '2', minWidth: '160px' }}
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Units"
                          value={newColorUnits}
                          onChange={e => setNewColorUnits(e.target.value)}
                          style={{ ...inputStyles, width: '90px' }}
                          title="Units for this colour"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomColor}
                          style={addColorBtnStyles}
                        >
                          + Add Colour
                        </button>
                      </div>
                    </div>

                    {/* Selected Colours List with Per-Colour Stock Allocation */}
                    {colors.length > 0 && (
                      <div style={selectedColorsListStyles}>
                        <div style={selectedColorsHeaderStyles}>
                          <span>COLOUR VARIANT</span>
                          <span>UNITS IN STOCK</span>
                          <span>ACTION</span>
                        </div>
                        {colors.map(c => (
                          <div key={c.id} style={colorRowItemStyles}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  ...presetColorCircleStyles,
                                  backgroundColor: c.hex,
                                  width: '16px',
                                  height: '16px',
                                  border: c.hex === '#FFFFFF' ? '1px solid #d1d5db' : 'none',
                                }}
                              />
                              <span style={{ fontWeight: '600', fontSize: '0.825rem' }}>{c.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                min="0"
                                value={c.units}
                                onChange={e =>
                                  handleUpdateColorUnits(c.id, parseInt(e.target.value, 10) || 0)
                                }
                                style={unitQtyInputStyles}
                              />
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>units</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(c.id)}
                              style={removeColorBtnStyles}
                              title="Remove color"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={tabPromptBannerStyles}>
                    <span>Next: Add technical specifications, dimensions, and warranty details.</span>
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('specs')}
                      style={nextTabBtnStyles}
                    >
                      Continue to Specifications →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PRODUCT SPECIFICATIONS */}
              {activeFormTab === 'specs' && (
                <div style={tabSectionStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyles}>PRODUCT SPECIFICATIONS</label>
                    <span style={helperTextStyles}>Key technical details & features</span>
                  </div>

                  {/* Quick-add preset specification pills */}
                  <div style={presetSpecsWrapperStyles}>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Quick Add Common Attributes:
                    </div>
                    <div style={presetSpecsGridStyles}>
                      {PRESET_SPEC_KEYS.map(keyName => {
                        const exists = specifications.some(
                          s => s.key.toLowerCase() === keyName.toLowerCase()
                        );
                        return (
                          <button
                            key={keyName}
                            type="button"
                            onClick={() => handleAddPresetSpec(keyName)}
                            style={{
                              ...presetSpecPillStyles,
                              opacity: exists ? 0.5 : 1,
                              cursor: exists ? 'default' : 'pointer',
                            }}
                            disabled={exists}
                          >
                            + {keyName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Specifications Table */}
                  <div style={specsTableContainerStyles}>
                    <div style={specsTableHeaderRowStyles}>
                      <span style={{ flex: '1' }}>ATTRIBUTE / FEATURE</span>
                      <span style={{ flex: '2' }}>SPECIFICATION VALUE</span>
                      <span style={{ width: '32px', textAlign: 'center' }}></span>
                    </div>

                    {specifications.map(spec => (
                      <div key={spec.id} style={specRowStyles}>
                        <input
                          type="text"
                          placeholder="e.g. Brand, Weight, RAM"
                          value={spec.key}
                          onChange={e => handleUpdateSpec(spec.id, 'key', e.target.value)}
                          style={{ ...inputStyles, flex: '1', fontSize: '0.8rem' }}
                        />
                        <input
                          type="text"
                          placeholder="e.g. Apple, 221g, 8GB / 256GB"
                          value={spec.value}
                          onChange={e => handleUpdateSpec(spec.id, 'value', e.target.value)}
                          style={{ ...inputStyles, flex: '2', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(spec.id)}
                          style={removeSpecBtnStyles}
                          title="Remove specification"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomSpecRow}
                    style={addSpecRowBtnStyles}
                  >
                    + Add Custom Specification Field
                  </button>

                  <div style={tabPromptBannerStyles}>
                    <span>Next: Add description text and high-resolution product photos.</span>
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('media')}
                      style={nextTabBtnStyles}
                    >
                      Continue to Media & Photos →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA & DESCRIPTION */}
              {activeFormTab === 'media' && (
                <div style={tabSectionStyles}>
                  {/* Product Images Section (Create Flow) */}
                  {!editingProduct && (
                    <div style={inputGroupStyles}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={labelStyles}>PRODUCT IMAGES (R2 CLOUD STORAGE)</label>
                        <span style={imageHelpTextStyles}>Max 5MB each · JPG, PNG, WEBP</span>
                      </div>

                      {/* Drag & Drop / Click Upload Box */}
                      <div
                        onClick={() => !isSubmitting && fileInputRef.current?.click()}
                        style={uploadDropzoneStyles}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={e => handleFilesSelected(e.target.files)}
                          style={{ display: 'none' }}
                          disabled={isSubmitting}
                        />
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ marginBottom: '6px' }}
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <div style={dropzoneMainTextStyles}>
                          <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
                            Click to upload
                          </span>{' '}
                          or drag and drop images
                        </div>
                        <div style={dropzoneSubTextStyles}>
                          Supports high-resolution product photography
                        </div>
                      </div>

                      {/* Image Preview Grid */}
                      {selectedImages.length > 0 && (
                        <div style={previewGridStyles}>
                          {selectedImages.map((img, idx) => (
                            <div
                              key={img.id}
                              style={{
                                ...previewCardStyles,
                                borderColor: img.isPrimary ? 'var(--color-primary)' : 'var(--color-border)',
                                boxShadow: img.isPrimary ? '0 0 0 2px rgba(255, 122, 0, 0.2)' : 'none',
                              }}
                            >
                              <img src={img.previewUrl} alt={`Preview ${idx + 1}`} style={previewImgStyles} />

                              {/* Primary Badge / Button */}
                              {img.isPrimary ? (
                                <div style={primaryBadgeStyles}>★ Primary</div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleSetPrimary(img.id);
                                  }}
                                  style={setPrimaryBtnStyles}
                                  title="Make this the primary catalog image"
                                >
                                  Make Primary
                                </button>
                              )}

                              {/* Delete / Remove Thumbnail Button */}
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleRemoveImage(img.id);
                                }}
                                style={removeImageBtnStyles}
                                disabled={isSubmitting}
                                title="Remove image"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit Mode Notice */}
                  {editingProduct && (
                    <div style={editNoticeStyles}>
                      <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                      <span>
                        Updating general listing parameters, stock quantities, and specifications. Media uploads are handled via the dedicated image manager.
                      </span>
                    </div>
                  )}

                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>PRODUCT DESCRIPTION</label>
                    <textarea
                      rows={4}
                      placeholder="Provide detailed product highlights, features, warranty, and package contents..."
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      style={textareaStyles}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* Upload Progress Status Indicator */}
              {isSubmitting && (
                <div style={progressBannerStyles}>
                  <div style={spinnerStyles}></div>
                  <span style={progressTextStyles}>{uploadStatusText || 'Processing request...'}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div style={modalFooterStyles}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeFormTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'media') setActiveFormTab('specs');
                        else if (activeFormTab === 'specs') setActiveFormTab('inventory');
                        else if (activeFormTab === 'inventory') setActiveFormTab('basic');
                      }}
                      style={prevTabBtnStyles}
                    >
                      ← Back
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    style={cancelBtnStyles}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      ...saveBtnStyles,
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={miniSpinnerStyles}></span>
                        <span>Saving Listing...</span>
                      </span>
                    ) : editingProduct ? (
                      'Update Listing'
                    ) : (
                      `Save & Publish (${calculatedTotalUnits} Units)`
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const wrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  paddingTop: '1rem',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '0.775rem',
  color: 'var(--color-text-muted)',
  margin: '4px 0 0 0',
};

const addBtnStyles: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '10px 16px',
  fontWeight: '700',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  display: 'flex',
  alignItems: 'center',
};

const searchRowStyles: React.CSSProperties = {
  width: '100%',
};

const searchInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
};

const tableWrapperStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflowX: 'auto',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-bg-subtle)',
};

const thStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
};

const tdStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.85rem',
  color: 'var(--color-text)',
};

const tdRefStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-primary)',
  fontWeight: '700',
};

const tdNameStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.875rem',
  fontWeight: '700',
  color: 'var(--color-text)',
};

const variantSubtextStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: '500',
  color: 'var(--color-text-muted)',
  marginTop: '2px',
};

const colorPillListStyles: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--color-primary)',
  fontWeight: '600',
};

const tableThumbStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-sm)',
  objectFit: 'cover',
  border: '1px solid var(--color-border)',
  backgroundColor: '#f8fafc',
  flexShrink: 0,
};

const tdPriceStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  fontSize: '0.85rem',
  fontWeight: '700',
  color: 'var(--color-text)',
};

const statusBadgeStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  fontWeight: '700',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
};

const tdActionsStyles: React.CSSProperties = {
  padding: '14px var(--space-4)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
};

const actionBtnEditStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const actionBtnDeleteStyles: React.CSSProperties = {
  background: 'rgba(239, 68, 68, 0.05)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  color: 'var(--color-danger)',
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const loadingStyles: React.CSSProperties = {
  padding: '3rem',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
};

const emptyStyles: React.CSSProperties = {
  padding: '3rem',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
};

// Modal
const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
  padding: '1rem',
};

const modalCardStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  width: '100%',
  maxWidth: '680px',
  maxHeight: '92vh',
  overflowY: 'auto',
  padding: '1.75rem',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
};

const modalSubtitleStyles: React.CSSProperties = {
  fontSize: '0.775rem',
  color: 'var(--color-text-muted)',
  margin: '3px 0 0 0',
};

const closeBtnStyles: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-muted)',
  fontSize: '1.25rem',
  cursor: 'pointer',
  padding: '2px 6px',
};

const tabNavWrapperStyles: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid var(--color-border)',
  gap: '1rem',
  marginBottom: '1.25rem',
  overflowX: 'auto',
};

const tabNavBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  padding: '8px 4px',
  fontSize: '0.825rem',
  fontWeight: '700',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease-in-out',
};

const tabSectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.1rem',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.1rem',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const labelStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const helperTextStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  color: 'var(--color-text-muted)',
};

const imageHelpTextStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  color: 'var(--color-text-muted)',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyles: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const textareaStyles: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
  resize: 'vertical',
  boxSizing: 'border-box',
};

const doubleColGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
};

// Inventory & Colors Styles
const inventorySummaryCardStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: 'rgba(255, 122, 0, 0.06)',
  border: '1px solid rgba(255, 122, 0, 0.25)',
  borderRadius: 'var(--radius-md)',
};

const inventorySummaryLabelStyles: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: '700',
  color: 'var(--color-primary)',
  letterSpacing: '0.5px',
};

const inventorySummaryValueStyles: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: '800',
  color: 'var(--color-text)',
};

const inventorySummarySubtextStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  textAlign: 'right',
  maxWidth: '220px',
};

const colorsSectionWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const presetColorsGridStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
};

const presetColorChipStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const presetColorCircleStyles: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  display: 'inline-block',
};

const customColorFormStyles: React.CSSProperties = {
  padding: '10px',
  backgroundColor: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
};

const colorPickerInputStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  padding: 0,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  backgroundColor: 'transparent',
};

const addColorBtnStyles: React.CSSProperties = {
  background: 'var(--color-text)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '9px 14px',
  fontSize: '0.775rem',
  fontWeight: '700',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const selectedColorsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '8px',
  backgroundColor: '#ffffff',
};

const selectedColorsHeaderStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 120px 40px',
  padding: '4px 8px',
  fontSize: '0.65rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
  borderBottom: '1px solid var(--color-border)',
};

const colorRowItemStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 120px 40px',
  alignItems: 'center',
  padding: '6px 8px',
  backgroundColor: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-sm)',
};

const unitQtyInputStyles: React.CSSProperties = {
  width: '60px',
  padding: '4px 6px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.8rem',
  fontWeight: '700',
  textAlign: 'center',
};

const removeColorBtnStyles: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-danger)',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: '0.875rem',
  textAlign: 'center',
};

// Specifications Styles
const presetSpecsWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const presetSpecsGridStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
};

const presetSpecPillStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 8px',
  fontSize: '0.725rem',
  fontWeight: '600',
  color: 'var(--color-text)',
  transition: 'all 0.15s ease',
};

const specsTableContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '8px',
  backgroundColor: '#ffffff',
};

const specsTableHeaderRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  padding: '4px 6px',
  fontSize: '0.65rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
  borderBottom: '1px solid var(--color-border)',
};

const specRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const removeSpecBtnStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(239, 68, 68, 0.08)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-danger)',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '700',
  flexShrink: 0,
};

const addSpecRowBtnStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '8px',
  color: 'var(--color-primary)',
  fontWeight: '700',
  fontSize: '0.775rem',
  cursor: 'pointer',
  textAlign: 'center',
};

const tabPromptBannerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  backgroundColor: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  marginTop: '0.5rem',
  border: '1px solid var(--color-border)',
};

const nextTabBtnStyles: React.CSSProperties = {
  background: 'var(--color-text)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 12px',
  fontSize: '0.75rem',
  fontWeight: '700',
  cursor: 'pointer',
};

const prevTabBtnStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '9px 14px',
  fontSize: '0.825rem',
  fontWeight: '600',
  color: 'var(--color-text)',
  cursor: 'pointer',
};

// Upload Dropzone & Previews
const uploadDropzoneStyles: React.CSSProperties = {
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '1.25rem',
  textAlign: 'center',
  backgroundColor: 'var(--color-bg-subtle)',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background-color 0.2s',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const dropzoneMainTextStyles: React.CSSProperties = {
  fontSize: '0.825rem',
  color: 'var(--color-text)',
  marginBottom: '2px',
};

const dropzoneSubTextStyles: React.CSSProperties = {
  fontSize: '0.725rem',
  color: 'var(--color-text-muted)',
};

const previewGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
  gap: '10px',
  marginTop: '8px',
};

const previewCardStyles: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1',
  borderRadius: 'var(--radius-md)',
  border: '2px solid var(--color-border)',
  overflow: 'hidden',
  backgroundColor: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const previewImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const primaryBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '4px',
  left: '4px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: '800',
  padding: '2px 5px',
  borderRadius: '3px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
};

const setPrimaryBtnStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '4px',
  left: '4px',
  right: '4px',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '3px',
  fontSize: '9px',
  fontWeight: '600',
  padding: '2px 0',
  cursor: 'pointer',
  textAlign: 'center',
};

const removeImageBtnStyles: React.CSSProperties = {
  position: 'absolute',
  top: '4px',
  right: '4px',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  backgroundColor: 'rgba(239, 68, 68, 0.9)',
  color: '#ffffff',
  border: 'none',
  fontSize: '10px',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  lineHeight: 1,
};

const editNoticeStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  padding: '10px 12px',
  backgroundColor: 'rgba(59, 130, 246, 0.08)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  borderRadius: 'var(--radius-md)',
  color: '#1e40af',
  fontSize: '0.75rem',
  lineHeight: 1.4,
};

const progressBannerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  backgroundColor: 'rgba(255, 122, 0, 0.08)',
  border: '1px solid rgba(255, 122, 0, 0.25)',
  borderRadius: 'var(--radius-md)',
};

const progressTextStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: 'var(--color-primary)',
};

const spinnerStyles: React.CSSProperties = {
  width: '14px',
  height: '14px',
  border: '2px solid rgba(255, 122, 0, 0.3)',
  borderTopColor: 'var(--color-primary)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const miniSpinnerStyles: React.CSSProperties = {
  width: '12px',
  height: '12px',
  border: '2px solid rgba(255, 255, 255, 0.4)',
  borderTopColor: '#ffffff',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  display: 'inline-block',
};

const modalFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  marginTop: '0.75rem',
  borderTop: '1px solid var(--color-border)',
  paddingTop: '1rem',
};

const cancelBtnStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  borderRadius: 'var(--radius-md)',
  padding: '9px 16px',
  fontWeight: '600',
  fontSize: '0.825rem',
  cursor: 'pointer',
};

const saveBtnStyles: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '9px 18px',
  fontWeight: '700',
  fontSize: '0.825rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};
