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
  'Condition',
  'Warranty',
  'RAM / Storage',
  'Dimensions',
  'Weight',
  'Battery Capacity',
  'Screen Size',
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
  const [showColorSection, setShowColorSection] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');
  const [newColorUnits, setNewColorUnits] = useState('10');

  // Product Specifications State
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([
    { id: 'spec-1', key: 'Brand', value: '' },
    { id: 'spec-2', key: 'Condition', value: 'Brand New' },
    { id: 'spec-3', key: 'Warranty', value: '1 Year Warranty' },
  ]);
  const [showSpecsSection, setShowSpecsSection] = useState(false);

  // Image Upload State
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
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
    setExistingImages([]);
  };

  const handleOpenAdd = () => {
    cleanupImagePreviews();
    setEditingProduct(null);
    setForm({
      name: '',
      category: categories[0]?.id || '',
      base_price: '',
      description: '',
      status: 'PUBLISHED',
    });
    setBaseUnits('10');
    setColors([]);
    setShowColorSection(false);
    setNewColorName('');
    setNewColorHex('#2563EB');
    setNewColorUnits('10');
    setSpecifications([
      { id: 'spec-1', key: 'Brand', value: '' },
      { id: 'spec-2', key: 'Condition', value: 'Brand New' },
      { id: 'spec-3', key: 'Warranty', value: '1 Year Warranty' },
    ]);
    setShowSpecsSection(false);
    setUploadStatusText('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    cleanupImagePreviews();
    setEditingProduct(p);

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

    // Populate existing images
    if (p.images && p.images.length > 0) {
      setExistingImages(p.images);
    } else {
      setExistingImages([]);
    }

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
      setShowColorSection(mappedColors.length > 0);
      const totalStock = p.variants.reduce((sum, v) => sum + (v.stock ?? v.stock_quantity ?? 0), 0);
      setBaseUnits(String(totalStock || p.stock_quantity || 10));
    } else {
      setColors([]);
      setShowColorSection(false);
      setBaseUnits(String(p.stock_quantity || 10));
    }

    if (parsedSpecs.length > 0) {
      setSpecifications(parsedSpecs);
      setShowSpecsSection(true);
    } else {
      setSpecifications([
        { id: 'spec-1', key: 'Brand', value: '' },
        { id: 'spec-2', key: 'Condition', value: 'Brand New' },
      ]);
      setShowSpecsSection(false);
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

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!editingProduct) return;
    if (!confirm('Delete this product photo?')) return;
    try {
      await productsApi.deleteImage(editingProduct.id, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Photo removed');
      fetchProducts();
    } catch {
      toast.error('Failed to delete photo');
    }
  };

  // Color Variant Handlers
  const handleAddPresetColor = (preset: { name: string; hex: string }) => {
    if (colors.some(c => c.name.toLowerCase() === preset.name.toLowerCase())) {
      // Toggle off if clicked again
      setColors(prev => prev.filter(c => c.name.toLowerCase() !== preset.name.toLowerCase()));
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
  };

  const handleAddCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) {
      toast.error('Please enter a color name (e.g., Titanium Gray)');
      return;
    }
    if (colors.some(c => c.name.toLowerCase() === newColorName.trim().toLowerCase())) {
      toast.error('A color with this name is already added');
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
    const existingCount = selectedImages.length + existingImages.length;

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
        const hasPrimary = combined.some(img => img.isPrimary) || existingImages.some(img => img.is_primary);
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

  const handleRemoveSelectedImage = (id: string) => {
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

  const handleSetPrimarySelected = (id: string) => {
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
      toast.error('Please fill in product name, category, and price.');
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
        setUploadStatusText('Saving product updates...');
        await apiClient.patch(`/api/v1/products/${editingProduct.id}/`, {
          name: form.name,
          category: form.category,
          base_price: parseFloat(form.base_price),
          description: formattedDescription,
          status: form.status,
        });

        // Upload any newly selected images
        if (selectedImages.length > 0) {
          const hasPrimary = selectedImages.some(img => img.isPrimary);
          for (let i = 0; i < selectedImages.length; i++) {
            const img = selectedImages[i];
            const isPrimary = img.isPrimary || (!hasPrimary && i === 0);
            setUploadStatusText(`Uploading photo ${i + 1} of ${selectedImages.length}...`);
            try {
              await productsApi.uploadImage(editingProduct.id, img.file, isPrimary);
            } catch (imgErr: any) {
              console.error(`Image upload failed:`, imgErr);
            }
          }
        }

        toast.success('Product updated successfully!');
        handleCloseModal();
        await fetchProducts();
      } else {
        // Create Mode: Step 1 -> Create Product with Variants & Initial Inventory
        setUploadStatusText('Creating product listing...');
        const { data: createdProduct } = await apiClient.post('/api/v1/products/', {
          name: form.name,
          category: form.category,
          base_price: parseFloat(form.base_price),
          description: formattedDescription,
          status: form.status,
          variants: variantsPayload,
        });

        const targetProductId =
          createdProduct?.id ||
          createdProduct?.uuid ||
          createdProduct?.data?.id ||
          createdProduct?.data?.uuid ||
          createdProduct?.product?.id;

        // Step 2 -> Upload Images (if any selected)
        if (selectedImages.length > 0 && targetProductId) {
          let uploadErrors = 0;
          let lastErrorMessage = '';
          const hasPrimary = selectedImages.some(img => img.isPrimary);

          for (let i = 0; i < selectedImages.length; i++) {
            const img = selectedImages[i];
            const isPrimary = img.isPrimary || (!hasPrimary && i === 0);
            setUploadStatusText(`Uploading photo ${i + 1} of ${selectedImages.length}...`);
            try {
              await productsApi.uploadImage(targetProductId, img.file, isPrimary);
            } catch (imgErr: any) {
              console.error(`Image upload failed for photo ${i + 1}:`, imgErr);
              lastErrorMessage =
                imgErr?.message ||
                imgErr?.details?.image?.[0] ||
                imgErr?.detail ||
                'File upload error';
              uploadErrors++;
            }
          }

          if (uploadErrors === 0) {
            toast.success('Product uploaded successfully with photos!');
          } else {
            toast.error(
              `Product created, but ${uploadErrors} photo(s) failed to upload: ${lastErrorMessage}`
            );
          }
        } else {
          toast.success('Product listing created successfully!');
        }

        handleCloseModal();
        await fetchProducts();
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
            Manage your store inventory, upload product photos, and configure prices.
          </p>
        </div>
        <button onClick={handleOpenAdd} style={addBtnStyles} id="vendor-add-product-btn">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '6px' }}
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
          <div style={loadingStyles}>Retrieving products...</div>
        ) : filtered.length === 0 ? (
          <div style={emptyStyles}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>No products in your catalog yet.</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Click "Add New Product" above to list your first item.
            </div>
          </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={thumbUrl}
                          alt={p.name}
                          style={tableThumbStyles}
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</div>
                          {variantCount > 1 && (
                            <span style={variantSubtextStyles}>
                              {variantCount} colors available
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

      {/* Single-Page Product Creation / Edit Modal */}
      {modalOpen && (
        <div style={modalBackdropStyles}>
          <div style={modalCardStyles}>
            {/* Modal Header */}
            <div style={modalHeaderStyles}>
              <div>
                <h3 style={{ ...titleStyles, fontSize: '1.25rem', margin: 0 }}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p style={modalSubtitleStyles}>
                  Upload product photos, choose a category, and specify your price and inventory.
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

            <form onSubmit={handleSubmit} style={formStyles}>
              {/* SECTION 1: PRODUCT PHOTOS UPLOAD (TOP & PROMINENT) */}
              <div style={formSectionCardStyles}>
                <div style={sectionTitleRowStyles}>
                  <span style={sectionNumberBadgeStyles}>1</span>
                  <div>
                    <h4 style={sectionHeadingStyles}>Product Photos</h4>
                    <p style={sectionSubtextStyles}>Upload clear photos of your product. The first photo will be used as the main cover.</p>
                  </div>
                </div>

                {/* Dropzone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => handleFilesSelected(e.target.files)}
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  disabled={isSubmitting}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                  style={{
                    ...dropzoneStyles,
                    borderColor: isDraggingOver ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: isDraggingOver ? 'rgba(255, 122, 0, 0.04)' : '#f9fafb',
                  }}
                >
                  <div style={dropzoneIconWrapperStyles}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                    Click to browse photos or drag and drop here
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Supports JPG, PNG, or WEBP (up to 5MB each) • Select multiple photos at once
                  </div>
                </div>

                {/* Image Previews Grid */}
                {(existingImages.length > 0 || selectedImages.length > 0) && (
                  <div style={imageGalleryGridStyles}>
                    {/* Existing Images (Edit mode) */}
                    {existingImages.map(img => {
                      const url = img.thumbnail_url || img.image_url || img.url || '/logo.jpg?v=2';
                      return (
                        <div key={img.id} style={imagePreviewCardStyles}>
                          <img src={url} alt="Product photo" style={imagePreviewImgStyles} />
                          <div style={imagePreviewBadgeStyles}>Active Photo</div>
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(img.id)}
                            style={imageDeleteBtnStyles}
                            title="Delete photo"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}

                    {/* Newly Selected Images */}
                    {selectedImages.map(img => (
                      <div key={img.id} style={imagePreviewCardStyles}>
                        <img src={img.previewUrl} alt="Selected photo" style={imagePreviewImgStyles} />
                        {img.isPrimary ? (
                          <div style={{ ...imagePreviewBadgeStyles, background: 'var(--color-primary)', color: '#fff' }}>
                            ⭐ Main Cover
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimarySelected(img.id)}
                            style={setPrimaryBtnStyles}
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedImage(img.id)}
                          style={imageDeleteBtnStyles}
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Quick Add More Tile */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={addMoreImageTileStyles}
                    >
                      <span style={{ fontSize: '1.25rem' }}>+</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Add More</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: BASIC PRODUCT INFORMATION */}
              <div style={formSectionCardStyles}>
                <div style={sectionTitleRowStyles}>
                  <span style={sectionNumberBadgeStyles}>2</span>
                  <div>
                    <h4 style={sectionHeadingStyles}>Basic Information</h4>
                    <p style={sectionSubtextStyles}>Enter the title, category, price, and units for your product.</p>
                  </div>
                </div>

                <div style={inputGroupStyles}>
                  <label style={labelStyles}>PRODUCT NAME *</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 15 Pro Max 256GB, Nike Air Jordan, Samsung Galaxy S24"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    style={inputStyles}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div style={twoColGridStyles}>
                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>CATEGORY *</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                      style={selectStyles}
                      disabled={isSubmitting}
                      required
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>PRICE (₦) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 150000"
                      value={form.base_price}
                      onChange={e => setForm(prev => ({ ...prev, base_price: e.target.value }))}
                      style={inputStyles}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div style={twoColGridStyles}>
                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>TOTAL UNITS IN STOCK *</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 15"
                      value={baseUnits}
                      onChange={e => setBaseUnits(e.target.value)}
                      style={inputStyles}
                      disabled={isSubmitting || colors.length > 0}
                      required
                    />
                    {colors.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                        Automatically calculated from color variants below ({calculatedTotalUnits} units)
                      </span>
                    )}
                  </div>

                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>LISTING STATUS</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                      style={selectStyles}
                      disabled={isSubmitting}
                    >
                      <option value="PUBLISHED">Published (Visible in Store)</option>
                      <option value="DRAFT">Draft (Save privately)</option>
                      <option value="PAUSED">Paused (Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: AVAILABLE COLOURS (OPTIONAL & COLLAPSIBLE) */}
              <div style={formSectionCardStyles}>
                <div
                  onClick={() => setShowColorSection(prev => !prev)}
                  style={{ ...sectionTitleRowStyles, cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={sectionNumberBadgeStyles}>3</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={sectionHeadingStyles}>
                        Available Colours {colors.length > 0 && `(${colors.length} selected)`}
                      </h4>
                      <span style={toggleExpandTextStyles}>
                        {showColorSection ? '− Collapse' : '+ Click to add colours'}
                      </span>
                    </div>
                    <p style={sectionSubtextStyles}>
                      Select the colors you have in stock, or skip if your product does not have color choices.
                    </p>
                  </div>
                </div>

                {showColorSection && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                    {/* Preset Color Badges */}
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
                              borderColor: isAdded ? 'var(--color-primary)' : '#e2e8f0',
                              backgroundColor: isAdded ? 'rgba(255, 122, 0, 0.08)' : '#ffffff',
                              fontWeight: isAdded ? 600 : 500,
                            }}
                          >
                            <span
                              style={{
                                ...presetColorCircleStyles,
                                backgroundColor: preset.hex,
                                border: preset.hex === '#FFFFFF' ? '1px solid #d1d5db' : 'none',
                              }}
                            />
                            <span>{preset.name}</span>
                            {isAdded ? (
                              <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>+</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Colors List */}
                    {colors.length > 0 && (
                      <div style={selectedColorsListStyles}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                          SET UNITS FOR EACH COLOUR:
                        </div>
                        {colors.map(c => (
                          <div key={c.id} style={colorRowCardStyles}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ ...presetColorCircleStyles, backgroundColor: c.hex }} />
                              <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{c.name}</strong>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Units in stock:</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={c.units}
                                  onChange={e => handleUpdateColorUnits(c.id, parseInt(e.target.value, 10) || 0)}
                                  style={colorUnitInputStyles}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(c.id)}
                                style={colorRemoveBtnStyles}
                                title="Remove color"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Custom Color Input Form */}
                    <div style={customColorRowStyles}>
                      <input
                        type="text"
                        placeholder="Custom colour name (e.g. Matte Titanium)"
                        value={newColorName}
                        onChange={e => setNewColorName(e.target.value)}
                        style={{ ...inputStyles, flex: 1 }}
                      />
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={e => setNewColorHex(e.target.value)}
                        style={colorPickerBoxStyles}
                        title="Pick color"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Units"
                        value={newColorUnits}
                        onChange={e => setNewColorUnits(e.target.value)}
                        style={{ ...inputStyles, width: '80px' }}
                      />
                      <button type="button" onClick={handleAddCustomColor} style={addCustomColorBtnStyles}>
                        + Add Colour
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: PRODUCT SPECIFICATIONS (OPTIONAL & COLLAPSIBLE) */}
              <div style={formSectionCardStyles}>
                <div
                  onClick={() => setShowSpecsSection(prev => !prev)}
                  style={{ ...sectionTitleRowStyles, cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={sectionNumberBadgeStyles}>4</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={sectionHeadingStyles}>
                        Technical Specifications (Optional)
                      </h4>
                      <span style={toggleExpandTextStyles}>
                        {showSpecsSection ? '− Collapse' : '+ Click to add specs'}
                      </span>
                    </div>
                    <p style={sectionSubtextStyles}>
                      Add details like Brand, Condition, Warranty, or Dimensions to help buyers find your item.
                    </p>
                  </div>
                </div>

                {showSpecsSection && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                    {/* 1-Click Attribute Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {PRESET_SPEC_KEYS.map(keyName => {
                        const isAdded = specifications.some(s => s.key.toLowerCase() === keyName.toLowerCase());
                        if (isAdded) return null;
                        return (
                          <button
                            key={keyName}
                            type="button"
                            onClick={() => handleAddPresetSpec(keyName)}
                            style={specPresetChipStyles}
                          >
                            + {keyName}
                          </button>
                        );
                      })}
                    </div>

                    {/* Key-Value Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {specifications.map(s => (
                        <div key={s.id} style={specRowStyles}>
                          <input
                            type="text"
                            placeholder="Specification (e.g. Brand)"
                            value={s.key}
                            onChange={e => handleUpdateSpec(s.id, 'key', e.target.value)}
                            style={{ ...inputStyles, width: '38%' }}
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. Apple, Brand New)"
                            value={s.value}
                            onChange={e => handleUpdateSpec(s.id, 'value', e.target.value)}
                            style={{ ...inputStyles, flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(s.id)}
                            style={specDeleteBtnStyles}
                            title="Delete specification"
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
                      + Add Another Specification Row
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 5: DESCRIPTION */}
              <div style={formSectionCardStyles}>
                <div style={sectionTitleRowStyles}>
                  <span style={sectionNumberBadgeStyles}>5</span>
                  <div>
                    <h4 style={sectionHeadingStyles}>Product Description</h4>
                    <p style={sectionSubtextStyles}>Detailed overview of product features, warranty, and delivery notes.</p>
                  </div>
                </div>

                <div style={inputGroupStyles}>
                  <textarea
                    rows={4}
                    placeholder="Describe your product highlights, box contents, and guarantee details..."
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ ...inputStyles, resize: 'vertical' }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div style={modalFooterStyles}>
                {uploadStatusText && (
                  <div style={statusBannerStyles}>
                    <span style={spinnerDotStyles}></span>
                    <span>{uploadStatusText}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    style={modalCancelBtnStyles}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      ...modalSubmitBtnStyles,
                      opacity: isSubmitting ? 0.75 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span style={btnSpinnerStyles}></span>
                        <span>Saving Product...</span>
                      </>
                    ) : (
                      <span>{editingProduct ? 'Save Changes' : '🚀 Upload Product'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes vendorSpin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens (DOVI Standard UI Design System)
// ----------------------------------------------------------
const wrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  padding: '1.5rem',
  maxWidth: '1280px',
  margin: '0 auto',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '800',
  color: 'var(--color-text)',
  letterSpacing: '-0.5px',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  marginTop: '4px',
};

const addBtnStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: 'var(--radius-full)',
  fontWeight: '700',
  fontSize: '0.875rem',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  boxShadow: '0 2px 4px rgba(255, 122, 0, 0.2)',
  transition: 'all 0.2s ease',
};

const searchRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const searchInputStyles: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: '#ffffff',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  outline: 'none',
};

const tableWrapperStyles: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  background: '#f8fafc',
  borderBottom: '1px solid var(--color-border)',
};

const thStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#64748b',
  letterSpacing: '0.5px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
  transition: 'background-color 0.15s',
};

const tdStyles: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
};

const tdRefStyles: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '0.75rem',
  fontWeight: '700',
  fontFamily: 'monospace',
  color: '#64748b',
};

const tdNameStyles: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  maxWidth: '300px',
};

const tableThumbStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '8px',
  objectFit: 'cover',
  backgroundColor: '#f1f5f9',
  flexShrink: 0,
  border: '1px solid #e2e8f0',
};

const tdPriceStyles: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '0.875rem',
  fontWeight: '700',
  color: 'var(--color-primary)',
};

const tdActionsStyles: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'right',
  whiteSpace: 'nowrap',
};

const actionBtnEditStyles: React.CSSProperties = {
  background: '#f1f5f9',
  color: '#334155',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer',
  marginRight: '6px',
};

const actionBtnDeleteStyles: React.CSSProperties = {
  background: '#fee2e2',
  color: '#ef4444',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const statusBadgeStyles: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.7rem',
  fontWeight: '700',
};

const variantSubtextStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#64748b',
  display: 'block',
  marginTop: '2px',
};

const colorPillListStyles: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--color-primary)',
  fontWeight: '600',
};

const loadingStyles: React.CSSProperties = {
  padding: '3rem',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
};

const emptyStyles: React.CSSProperties = {
  padding: '3.5rem 1rem',
  textAlign: 'center',
};

// Modal Styles
const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '820px',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '1.25rem 1.75rem',
  borderBottom: '1px solid #e2e8f0',
  position: 'sticky',
  top: 0,
  backgroundColor: '#ffffff',
  zIndex: 10,
};

const modalSubtitleStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#64748b',
  margin: '4px 0 0 0',
};

const closeBtnStyles: React.CSSProperties = {
  background: '#f1f5f9',
  border: 'none',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#475569',
  fontSize: '0.85rem',
  fontWeight: 'bold',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  padding: '1.5rem 1.75rem',
};

const formSectionCardStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const sectionTitleRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
};

const sectionNumberBadgeStyles: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 122, 0, 0.12)',
  color: 'var(--color-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: '800',
  flexShrink: 0,
  marginTop: '2px',
};

const sectionHeadingStyles: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: '700',
  color: '#0f172a',
  margin: 0,
};

const sectionSubtextStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#64748b',
  margin: '2px 0 0 0',
};

const toggleExpandTextStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '700',
  color: 'var(--color-primary)',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#475569',
  letterSpacing: '0.4px',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.875rem',
  color: '#0f172a',
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyles: React.CSSProperties = {
  ...inputStyles,
  appearance: 'auto',
  cursor: 'pointer',
};

const twoColGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
};

// Dropzone & Image Gallery
const dropzoneStyles: React.CSSProperties = {
  border: '2px dashed #cbd5e1',
  borderRadius: '12px',
  padding: '24px 16px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const dropzoneIconWrapperStyles: React.CSSProperties = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 122, 0, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '10px',
};

const imageGalleryGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  gap: '12px',
  marginTop: '10px',
};

const imagePreviewCardStyles: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1',
  borderRadius: '10px',
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};

const imagePreviewImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const imagePreviewBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '6px',
  left: '6px',
  fontSize: '0.65rem',
  fontWeight: '700',
  padding: '2px 6px',
  borderRadius: '4px',
  backgroundColor: 'rgba(15, 23, 42, 0.75)',
  color: '#ffffff',
};

const setPrimaryBtnStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '6px',
  left: '6px',
  fontSize: '0.65rem',
  fontWeight: '600',
  padding: '2px 6px',
  borderRadius: '4px',
  backgroundColor: '#ffffff',
  color: '#334155',
  border: '1px solid #cbd5e1',
  cursor: 'pointer',
};

const imageDeleteBtnStyles: React.CSSProperties = {
  position: 'absolute',
  top: '6px',
  right: '6px',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  backgroundColor: 'rgba(239, 68, 68, 0.9)',
  color: '#ffffff',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.65rem',
  cursor: 'pointer',
};

const addMoreImageTileStyles: React.CSSProperties = {
  aspectRatio: '1',
  borderRadius: '10px',
  border: '2px dashed #cbd5e1',
  backgroundColor: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  color: '#64748b',
  cursor: 'pointer',
};

// Colors section styles
const presetColorsGridStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const presetColorChipStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '9999px',
  border: '1px solid #e2e8f0',
  fontSize: '0.8rem',
  color: '#1e293b',
  cursor: 'pointer',
  background: '#ffffff',
};

const presetColorCircleStyles: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  flexShrink: 0,
};

const selectedColorsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '12px',
  backgroundColor: '#f8fafc',
  padding: '12px',
  borderRadius: '8px',
};

const colorRowCardStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  background: '#ffffff',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
};

const colorUnitInputStyles: React.CSSProperties = {
  width: '70px',
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem',
  fontWeight: '600',
  textAlign: 'center',
};

const colorRemoveBtnStyles: React.CSSProperties = {
  background: '#fee2e2',
  color: '#ef4444',
  border: 'none',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.7rem',
};

const customColorRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '12px',
};

const colorPickerBoxStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  padding: 0,
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  cursor: 'pointer',
};

const addCustomColorBtnStyles: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  color: '#334155',
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

// Specifications styles
const specPresetChipStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '600',
  color: '#475569',
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '4px 8px',
  cursor: 'pointer',
};

const specRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const specDeleteBtnStyles: React.CSSProperties = {
  background: '#fee2e2',
  color: '#ef4444',
  border: 'none',
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '0.8rem',
  flexShrink: 0,
};

const addSpecRowBtnStyles: React.CSSProperties = {
  background: 'none',
  border: '1px dashed #cbd5e1',
  color: 'var(--color-primary)',
  padding: '8px',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
  width: '100%',
  marginTop: '8px',
};

// Modal Footer
const modalFooterStyles: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  backgroundColor: '#ffffff',
  borderTop: '1px solid #e2e8f0',
  padding: '1rem 1.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  zIndex: 10,
  boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const statusBannerStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--color-primary)',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const spinnerDotStyles: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  animation: 'vendorSpin 1s linear infinite',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#475569',
  fontSize: '0.875rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const modalSubmitBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontSize: '0.875rem',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  boxShadow: '0 2px 4px rgba(255, 122, 0, 0.25)',
};

const btnSpinnerStyles: React.CSSProperties = {
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTopColor: '#ffffff',
  animation: 'vendorSpin 0.8s linear infinite',
};
