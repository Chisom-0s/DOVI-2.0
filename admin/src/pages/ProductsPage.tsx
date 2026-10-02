import { useEffect, useState, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import {
  getProductImageUrl,
  getProductFallbackImage,
  cacheLocalProductImage,
} from '@/utils/image';
import { formatPrice, parsePriceNumber } from '@/utils/currency';
import type { ProductSummary, Category, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

interface ExistingImage {
  id: string;
  image_url?: string;
  url?: string;
  thumbnail_url?: string;
  is_primary?: boolean;
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

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Archive Confirm Modal / State
  const [productToArchive, setProductToArchive] = useState<ProductSummary | null>(null);
  const [isArchivePending, setIsArchivePending] = useState(false);

  // Product Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    category: '',
    base_price: '',
    description: '',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'PAUSED',
  });

  // Stock Units & Color Variants
  const [baseUnits, setBaseUnits] = useState<string>('10');
  const [colors, setColors] = useState<ColorVariantItem[]>([]);
  const [showColorSection, setShowColorSection] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');
  const [newColorUnits, setNewColorUnits] = useState('10');

  // Specifications
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([
    { id: 'spec-1', key: 'Brand', value: '' },
    { id: 'spec-2', key: 'Condition', value: 'Brand New' },
    { id: 'spec-3', key: 'Warranty', value: '1 Year Warranty' },
  ]);
  const [showSpecsSection, setShowSpecsSection] = useState(false);

  // Images
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Total units memo
  const calculatedTotalUnits = useMemo(() => {
    if (colors.length > 0) {
      return colors.reduce((sum, c) => sum + (Number(c.units) || 0), 0);
    }
    return parseInt(baseUnits, 10) || 0;
  }, [colors, baseUnits]);

  const fetchProducts = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listProducts({
        page,
        q: searchTerm || undefined,
      });
      setProducts(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load products list.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await adminApi.listCategories();
      setCategories(cats || []);
    } catch (err: any) {
      console.warn('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(true);
  };

  const cleanupImagePreviews = () => {
    selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setSelectedImages([]);
    setExistingImages([]);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
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
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (prodSummary: ProductSummary) => {
    cleanupImagePreviews();
    setIsModalOpen(true);
    setIsSubmitting(true);
    setUploadStatusText('Loading product details...');

    try {
      const fullProd = await adminApi.getProduct(prodSummary.id);
      setEditingProduct(fullProd);

      let cleanDesc = fullProd.description || '';
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
            // ignore JSON error
          }
          cleanDesc = cleanDesc.replace(/<!-- DOVI_SPECS: [\s\S]*? -->/g, '').trim();
        }
      }

      setForm({
        name: fullProd.name || '',
        category:
          typeof fullProd.category === 'object'
            ? fullProd.category?.id || ''
            : fullProd.category || categories[0]?.id || '',
        base_price: fullProd.base_price?.toString() || fullProd.price?.toString() || '',
        description: cleanDesc,
        status: fullProd.status || 'PUBLISHED',
      });

      if (parsedSpecs.length > 0) {
        setSpecifications(parsedSpecs);
        setShowSpecsSection(true);
      } else {
        setSpecifications([
          { id: 'spec-1', key: 'Brand', value: '' },
          { id: 'spec-2', key: 'Condition', value: 'Brand New' },
          { id: 'spec-3', key: 'Warranty', value: '1 Year Warranty' },
        ]);
        setShowSpecsSection(false);
      }

      if (fullProd.images && fullProd.images.length > 0) {
        setExistingImages(fullProd.images);
      } else {
        setExistingImages([]);
      }

      if (fullProd.variants && fullProd.variants.length > 0) {
        const mappedColors: ColorVariantItem[] = fullProd.variants
          .filter((v: any) => v.name && v.name.toLowerCase() !== 'standard')
          .map((v: any, i: number) => ({
            id: v.id || `v-${i}`,
            name: v.name,
            hex: v.color_code || '#4B5563',
            units: v.stock ?? v.stock_quantity ?? 10,
            priceOverride: v.price_override ? String(v.price_override) : '',
          }));

        if (mappedColors.length > 0) {
          setColors(mappedColors);
          setShowColorSection(true);
        } else {
          setColors([]);
          setShowColorSection(false);
          const stdVariant = fullProd.variants.find((v: any) => v.name?.toLowerCase() === 'standard');
          if (stdVariant) {
            setBaseUnits(String(stdVariant.stock ?? stdVariant.stock_quantity ?? 10));
          }
        }
      } else {
        setColors([]);
        setShowColorSection(false);
        setBaseUnits(String(fullProd.stock_quantity || 10));
      }
    } catch (err: any) {
      toast.error('Failed to load full product details for editing.');
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  const handleCloseModal = () => {
    cleanupImagePreviews();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Image Selection Handler with defensive validation
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: SelectedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported image (JPG, PNG, WebP only).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 5MB upload limit.`);
        continue;
      }

      newItems.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: selectedImages.length === 0 && newItems.length === 0 && existingImages.length === 0,
      });
    }

    if (newItems.length > 0) {
      setSelectedImages((prev) => [...prev, ...newItems]);
    }
  };

  const handleSetPrimarySelected = (id: string) => {
    setSelectedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleRemoveSelectedImage = (id: string) => {
    setSelectedImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const remaining = prev.filter((img) => img.id !== id);
      if (removed?.isPrimary && remaining.length > 0) {
        remaining[0].isPrimary = true;
      }
      return remaining;
    });
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!editingProduct) return;
    try {
      await adminApi.deleteProductImage(editingProduct.id, imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success('Image deleted.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete photo.');
    }
  };

  // Presets & Specs Helpers
  const handleAddPresetColor = (preset: { name: string; hex: string }) => {
    const exists = colors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      setColors((prev) => prev.filter((c) => c.name.toLowerCase() !== preset.name.toLowerCase()));
      return;
    }
    setColors((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: preset.name,
        hex: preset.hex,
        units: 10,
      },
    ]);
  };

  const handleAddCustomColor = () => {
    if (!newColorName.trim()) {
      toast.error('Please enter a colour name.');
      return;
    }
    const units = Math.max(1, parseInt(newColorUnits, 10) || 10);
    setColors((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: newColorName.trim(),
        hex: newColorHex,
        units,
      },
    ]);
    setNewColorName('');
    setNewColorUnits('10');
  };

  const handleAddPresetSpec = (key: string) => {
    const exists = specifications.some((s) => s.key.toLowerCase() === key.toLowerCase());
    if (exists) {
      toast.error(`"${key}" is already in specifications.`);
      return;
    }
    setSpecifications((prev) => [
      ...prev,
      {
        id: `spec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        key,
        value: '',
      },
    ]);
  };

  // Submit Handler: Zero Vendor Inputs!
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Please enter a product name.');
      return;
    }
    if (!form.category) {
      toast.error('Please select a category.');
      return;
    }

    const priceNum = parsePriceNumber(form.base_price);
    if (priceNum <= 0) {
      toast.error('Please enter a valid base price greater than 0.');
      return;
    }

    // Specifications metadata embedding
    const activeSpecs = specifications.filter((s) => s.key.trim() && s.value.trim());
    let formattedDescription = form.description.trim();
    if (activeSpecs.length > 0) {
      const specsObj: Record<string, string> = {};
      activeSpecs.forEach((s) => {
        specsObj[s.key.trim()] = s.value.trim();
      });
      formattedDescription = `${formattedDescription}\n\n<!-- DOVI_SPECS: ${JSON.stringify(specsObj)} -->`.trim();
    }

    // Build variants payload
    const productPrefix = form.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'DOV';
    const variantsPayload =
      colors.length > 0
        ? colors.map((c) => {
            const colorCode = c.name.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CLR';
            const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            return {
              name: c.name,
              sku: `${productPrefix}-${colorCode}-${randSuffix}`,
              quantity: Math.max(0, Number(c.units) || 0),
              price_override: c.priceOverride ? parsePriceNumber(c.priceOverride) : null,
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

    setIsSubmitting(true);

    try {
      if (editingProduct) {
        // --- EDIT MODE ---
        setUploadStatusText('Saving product updates...');
        await adminApi.updateProduct(editingProduct.id, {
          name: form.name.trim(),
          category: form.category,
          base_price: priceNum,
          description: formattedDescription,
          status: form.status,
        });

        // Upload any newly selected images
        if (selectedImages.length > 0) {
          const hasPrimary = selectedImages.some((img) => img.isPrimary);
          for (let i = 0; i < selectedImages.length; i++) {
            const img = selectedImages[i];
            const isPrimary = img.isPrimary || (!hasPrimary && i === 0 && existingImages.length === 0);
            setUploadStatusText(`Uploading photo ${i + 1} of ${selectedImages.length}...`);
            try {
              const res = await adminApi.uploadProductImage(editingProduct.id, img.file, isPrimary);
              if (isPrimary && res) {
                const permanentUrl = res.thumbnail_url || res.image_url;
                if (permanentUrl) {
                  cacheLocalProductImage(editingProduct.id, permanentUrl);
                }
              }
            } catch (imgErr: any) {
              console.error(`Image upload failed:`, imgErr);
            }
          }
        }

        toast.success(`Product "${form.name}" updated successfully.`);
        handleCloseModal();
        await fetchProducts(false);
      } else {
        // --- CREATE MODE (ZERO VENDOR FIELDS - BACKEND AUTO DEFAULTS TO INTERNAL STORE) ---
        setUploadStatusText('Creating product listing...');
        const createdProduct = await adminApi.createProduct({
          name: form.name.trim(),
          category: form.category,
          base_price: priceNum,
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

        // Upload Images defensively
        if (selectedImages.length > 0 && targetProductId) {
          let uploadErrors = 0;
          let lastErrorMessage = '';
          const hasPrimary = selectedImages.some((img) => img.isPrimary);

          for (let i = 0; i < selectedImages.length; i++) {
            const img = selectedImages[i];
            const isPrimary = img.isPrimary || (!hasPrimary && i === 0);
            setUploadStatusText(`Uploading photo ${i + 1} of ${selectedImages.length}...`);
            try {
              const res = await adminApi.uploadProductImage(targetProductId, img.file, isPrimary);
              if (isPrimary && res) {
                const permanentUrl = res.thumbnail_url || res.image_url;
                if (permanentUrl) {
                  cacheLocalProductImage(targetProductId, permanentUrl);
                }
              }
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
            toast.success('Product created with photos!');
          } else {
            toast.error(
              `Product created, but ${uploadErrors} photo(s) failed to upload: ${lastErrorMessage}`
            );
          }
        } else {
          toast.success('Product listing created successfully!');
        }

        handleCloseModal();
        await fetchProducts(false);
      }
    } catch (err: any) {
      const apiErr = err?.response?.data;
      const details =
        apiErr?.error?.message ||
        apiErr?.detail ||
        apiErr?.message ||
        err?.message ||
        'Failed to save product';
      toast.error(details);
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  // Archive Confirm
  const handleArchiveConfirm = async () => {
    if (!productToArchive) return;
    setIsArchivePending(true);
    try {
      await adminApi.archiveProduct(productToArchive.id);
      toast.success(`Product "${productToArchive.name}" deleted.`);
      setProducts((prev) => prev.filter((p) => p.id !== productToArchive.id));
      setProductToArchive(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product.');
    } finally {
      setIsArchivePending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <div style={headerActionRowStyles}>
          <h2 style={titleStyles}>Product Directory</h2>
        </div>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Top Header & Actions Bar */}
      <div style={headerActionRowStyles}>
        <div>
          <h2 style={titleStyles}>Product Directory</h2>
          <p style={subtitleStyles}>Manage platform retail catalog, stock levels, and pricing.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          style={createProductBtnStyles}
        >
          + Add New Product
        </button>
      </div>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by product name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Search</button>
        </form>
      </div>

      {/* Products Table (Vendor column removed) */}
      {products.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No Products Found"
          subtitle="Try adjusting your search query or create a new product above."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Product Details</th>
                  <th style={tableHeaderCellStyles}>Base Price</th>
                  <th style={tableHeaderCellStyles}>Stock Qty</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={tableRowStyles}>
                    <td style={tableCellStyles}>
                      <div style={productInfoRowStyles}>
                        <img
                          src={getProductImageUrl(p)}
                          alt={p.name}
                          style={productImgStyles}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getProductFallbackImage(p);
                          }}
                        />
                        <div>
                          <strong style={productNameStyles}>{p.name}</strong>
                          <span style={productIdStyles}>ID: {p.id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                      {formatPrice(p.price || (p as any).base_price)}
                    </td>
                    <td style={tableCellStyles}>{p.stock_quantity ?? 0} available</td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(p.status)}>{p.status}</span>
                    </td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          style={editBtnStyles}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductToArchive(p)}
                          style={archiveBtnStyles}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={pageBtnStyles}
              >
                Previous
              </button>
              <span style={pageLabelStyles}>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={pageBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- PRODUCT CREATE / EDIT MODAL --- */}
      {isModalOpen && (
        <div style={modalBackdropStyles}>
          <div style={largeModalContentStyles}>
            <div style={modalHeaderStyles}>
              <div>
                <h3 style={modalTitleStyles}>
                  {editingProduct ? 'Edit Product' : 'Add New Retail Product'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                  {editingProduct
                    ? `Update listing parameters for "${editingProduct.name}".`
                    : 'List a new item directly in the Dovi Official Store catalog.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                style={closeBtnStyles}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} style={formScrollContainerStyles}>
              {/* SECTION 1: BASIC DETAILS */}
              <div style={formSectionStyles}>
                <h4 style={sectionHeaderStyles}>1. Basic Information</h4>
                <div style={inputGridStyles}>
                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      style={textInputStyles}
                    />
                  </div>

                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      required
                      style={selectInputStyles}
                    >
                      <option value="" disabled>Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>Base Price (NGN) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 580000"
                      value={form.base_price}
                      onChange={(e) => setForm((prev) => ({ ...prev, base_price: e.target.value }))}
                      required
                      style={textInputStyles}
                    />
                    {form.base_price && (
                      <span style={pricePreviewHintStyles}>
                        Preview: {formatPrice(form.base_price)}
                      </span>
                    )}
                  </div>

                  <div style={inputGroupStyles}>
                    <label style={labelStyles}>Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.value as any,
                        }))
                      }
                      style={selectInputStyles}
                    >
                      <option value="PUBLISHED">Published (Visible on Storefront)</option>
                      <option value="DRAFT">Draft (Hidden)</option>
                      <option value="PAUSED">Paused (Temporarily Unavailable)</option>
                    </select>
                  </div>
                </div>

                <div style={{ ...inputGroupStyles, marginTop: '14px' }}>
                  <label style={labelStyles}>Description</label>
                  <textarea
                    rows={4}
                    placeholder="Provide a comprehensive product description, key highlights, and in-box items..."
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    style={textareaStyles}
                  />
                </div>
              </div>

              {/* SECTION 2: SPECIFICATIONS (COLLAPSIBLE) */}
              <div style={formSectionStyles}>
                <div
                  onClick={() => setShowSpecsSection((prev) => !prev)}
                  style={collapsibleHeaderStyles}
                >
                  <h4 style={sectionHeaderStyles}>
                    2. Technical Specifications ({specifications.filter((s) => s.value.trim()).length} set)
                  </h4>
                  <span style={toggleExpandStyles}>
                    {showSpecsSection ? '− Collapse' : '+ Expand Specifications'}
                  </span>
                </div>

                {showSpecsSection && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={presetChipsContainerStyles}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>
                        Quick Presets:
                      </span>
                      {PRESET_SPEC_KEYS.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleAddPresetSpec(k)}
                          style={presetChipStyles}
                        >
                          + {k}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {specifications.map((spec, idx) => (
                        <div key={spec.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Specification Key"
                            value={spec.key}
                            onChange={(e) =>
                              setSpecifications((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, key: e.target.value } : s))
                              )
                            }
                            style={{ ...textInputStyles, width: '180px' }}
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. 1 Year Official Warranty)"
                            value={spec.value}
                            onChange={(e) =>
                              setSpecifications((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, value: e.target.value } : s))
                              )
                            }
                            style={{ ...textInputStyles, flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSpecifications((prev) => prev.filter((_, i) => i !== idx))
                            }
                            style={removeRowBtnStyles}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: VARIANTS & INVENTORY (COLLAPSIBLE) */}
              <div style={formSectionStyles}>
                <div
                  onClick={() => setShowColorSection((prev) => !prev)}
                  style={collapsibleHeaderStyles}
                >
                  <div>
                    <h4 style={sectionHeaderStyles}>
                      3. Variants & Stock ({calculatedTotalUnits} total units in inventory)
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {colors.length > 0
                        ? `${colors.length} color variants configured`
                        : `Single stock pool (${baseUnits} units)`}
                    </span>
                  </div>
                  <span style={toggleExpandStyles}>
                    {showColorSection ? '− Collapse' : '+ Configure Color Variants'}
                  </span>
                </div>

                {!showColorSection ? (
                  <div style={{ marginTop: '12px', maxWidth: '240px' }}>
                    <label style={labelStyles}>Standard Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={baseUnits}
                      onChange={(e) => setBaseUnits(e.target.value)}
                      style={textInputStyles}
                    />
                  </div>
                ) : (
                  <div style={{ marginTop: '14px' }}>
                    <div style={presetColorsGridStyles}>
                      {PRESET_COLORS.map((preset) => {
                        const isAdded = colors.some(
                          (c) => c.name.toLowerCase() === preset.name.toLowerCase()
                        );
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleAddPresetColor(preset)}
                            style={{
                              ...presetColorChipStyles,
                              borderColor: isAdded ? '#ff7a00' : '#e2e8f0',
                              backgroundColor: isAdded ? 'rgba(255, 122, 0, 0.08)' : '#ffffff',
                              fontWeight: isAdded ? 700 : 500,
                            }}
                          >
                            <span
                              style={{
                                ...presetColorCircleStyles,
                                backgroundColor: preset.hex,
                              }}
                            />
                            {preset.name} {isAdded ? '✓' : ''}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Color Input */}
                    <div style={customColorRowStyles}>
                      <input
                        type="text"
                        placeholder="Custom color name..."
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        style={{ ...textInputStyles, width: '180px' }}
                      />
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        style={colorPickerStyles}
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Units"
                        value={newColorUnits}
                        onChange={(e) => setNewColorUnits(e.target.value)}
                        style={{ ...textInputStyles, width: '80px' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        style={addColorBtnStyles}
                      >
                        + Add Custom
                      </button>
                    </div>

                    {/* Active Variants Table */}
                    {colors.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <table style={variantTableStyles}>
                          <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <th style={variantThStyles}>Color</th>
                              <th style={variantThStyles}>Stock Units</th>
                              <th style={variantThStyles}>Price Override (Optional NGN)</th>
                              <th style={{ ...variantThStyles, textAlign: 'center' }}>Remove</th>
                            </tr>
                          </thead>
                          <tbody>
                            {colors.map((c, i) => (
                              <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={variantTdStyles}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span
                                      style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        backgroundColor: c.hex,
                                        display: 'inline-block',
                                        border: '1px solid #d1d5db',
                                      }}
                                    />
                                    <strong>{c.name}</strong>
                                  </div>
                                </td>
                                <td style={variantTdStyles}>
                                  <input
                                    type="number"
                                    min="0"
                                    value={c.units}
                                    onChange={(e) =>
                                      setColors((prev) =>
                                        prev.map((item, idx) =>
                                          idx === i ? { ...item, units: Math.max(0, parseInt(e.target.value, 10) || 0) } : item
                                        )
                                      )
                                    }
                                    style={{ ...textInputStyles, width: '90px' }}
                                  />
                                </td>
                                <td style={variantTdStyles}>
                                  <input
                                    type="text"
                                    placeholder="Leave blank for base price"
                                    value={c.priceOverride || ''}
                                    onChange={(e) =>
                                      setColors((prev) =>
                                        prev.map((item, idx) =>
                                          idx === i ? { ...item, priceOverride: e.target.value } : item
                                        )
                                      )
                                    }
                                    style={{ ...textInputStyles, width: '220px' }}
                                  />
                                </td>
                                <td style={{ ...variantTdStyles, textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => setColors((prev) => prev.filter((_, idx) => idx !== i))}
                                    style={removeRowBtnStyles}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 4: PRODUCT IMAGES */}
              <div style={formSectionStyles}>
                <h4 style={sectionHeaderStyles}>4. Product Photos & Media</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>
                  Upload high-resolution photos. Select one as primary to be featured as the main listing thumbnail.
                </p>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    ...dropzoneStyles,
                    borderColor: isDraggingOver ? '#ff7a00' : '#d1d5db',
                    backgroundColor: isDraggingOver ? '#fff7ed' : '#fafafa',
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📸</div>
                  <strong style={{ fontSize: '14px', color: '#1f2937' }}>
                    Click to browse or drag & drop product photos
                  </strong>
                  <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    PNG, JPG, or WebP up to 5MB each.
                  </span>
                </div>

                {/* Existing Images (Edit mode) */}
                {existingImages.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: '8px' }}>
                      Current Uploaded Images:
                    </span>
                    <div style={imageThumbGridStyles}>
                      {existingImages.map((img) => (
                        <div key={img.id} style={imageCardStyles}>
                          <img
                            src={img.thumbnail_url || img.image_url || img.url}
                            alt="Product photo"
                            style={imagePreviewStyles}
                          />
                          {img.is_primary && <span style={primaryTagStyles}>★ Primary</span>}
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(img.id)}
                            style={deleteImgBtnStyles}
                          >
                            ✕ Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Selected Images */}
                {selectedImages.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: '8px' }}>
                      Newly Selected Photos ({selectedImages.length}):
                    </span>
                    <div style={imageThumbGridStyles}>
                      {selectedImages.map((img) => (
                        <div key={img.id} style={imageCardStyles}>
                          <img src={img.previewUrl} alt="Preview" style={imagePreviewStyles} />
                          {img.isPrimary ? (
                            <span style={primaryTagStyles}>★ Primary</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimarySelected(img.id)}
                              style={setPrimaryBtnStyles}
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedImage(img.id)}
                            style={deleteImgBtnStyles}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status text during upload */}
              {uploadStatusText && (
                <div style={statusBannerStyles}>
                  <span>⏳ {uploadStatusText}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div style={modalFooterStyles}>
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
                  style={modalSubmitBtnStyles}
                >
                  {isSubmitting
                    ? uploadStatusText || 'Saving...'
                    : editingProduct
                    ? 'Save Product Changes'
                    : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {productToArchive && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <h3 style={modalTitleStyles}>Delete Product</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to delete <strong>{productToArchive.name}</strong>? This will immediately remove the listing from active marketplace pages and catalog.
            </p>
            <div style={modalActionsStyles}>
              <button
                type="button"
                onClick={() => setProductToArchive(null)}
                style={modalCancelBtnStyles}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isArchivePending}
                onClick={handleArchiveConfirm}
                style={modalDangerSubmitBtnStyles}
              >
                {isArchivePending ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge status helper
const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#d1fae5';
  let color = '#065f46';

  if (status === 'PAUSED' || status === 'DRAFT') {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (status === 'ARCHIVED') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  }

  return {
    backgroundColor,
    color,
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
  };
};

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const headerActionRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '4px 0 0 0',
};

const createProductBtnStyles: React.CSSProperties = {
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(255, 122, 0, 0.25)',
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: 1,
  maxWidth: '440px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const searchBtnStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
};

const tableCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '2px solid #f3f4f6',
  backgroundColor: '#fafafa',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
};

const tableCellStyles: React.CSSProperties = {
  padding: '16px',
  color: '#374151',
};

const productInfoRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const productImgStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  objectFit: 'cover',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const productNameStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#1f2937',
};

const productIdStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: '#9ca3af',
};

const editBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#2563eb',
  border: '1px solid rgba(37, 99, 235, 0.25)',
  padding: '4px 12px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
};

const archiveBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.25)',
  padding: '4px 12px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
};



const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  gap: '16px',
  borderTop: '1px solid #f3f4f6',
};

const pageBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const pageLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#4b5563',
};

// Modal styles
const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const largeModalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  maxWidth: '780px',
  width: '100%',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  overflow: 'hidden',
};

const modalHeaderStyles: React.CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 4px 0',
};

const closeBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '18px',
  cursor: 'pointer',
  color: '#9ca3af',
  padding: '4px',
};

const formScrollContainerStyles: React.CSSProperties = {
  overflowY: 'auto',
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const formSectionStyles: React.CSSProperties = {
  border: '1px solid #f1f5f9',
  backgroundColor: '#fafbfc',
  borderRadius: '12px',
  padding: '16px 20px',
};

const sectionHeaderStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const collapsibleHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  userSelect: 'none',
};

const toggleExpandStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#ff7a00',
  fontWeight: 700,
};

const inputGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
  marginTop: '14px',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#4b5563',
};

const textInputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  backgroundColor: '#ffffff',
  outline: 'none',
};

const selectInputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  backgroundColor: '#ffffff',
  outline: 'none',
};

const textareaStyles: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  backgroundColor: '#ffffff',
  outline: 'none',
  resize: 'vertical',
};

const pricePreviewHintStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#16a34a',
  fontWeight: 700,
};

const presetChipsContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px',
};

const presetChipStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  border: '1px solid #e5e7eb',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '11px',
  color: '#374151',
  cursor: 'pointer',
};

const removeRowBtnStyles: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#ef4444',
  fontSize: '14px',
  cursor: 'pointer',
  padding: '4px 8px',
};

const presetColorsGridStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const presetColorChipStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  borderRadius: '20px',
  border: '1px solid #e2e8f0',
  fontSize: '11px',
  cursor: 'pointer',
};

const presetColorCircleStyles: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: '1px solid #d1d5db',
};

const customColorRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  marginTop: '12px',
};

const colorPickerStyles: React.CSSProperties = {
  width: '36px',
  height: '34px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '2px',
  cursor: 'pointer',
};

const addColorBtnStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const variantTableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
};

const variantThStyles: React.CSSProperties = {
  padding: '8px 12px',
  color: '#6b7280',
  fontWeight: 700,
  textAlign: 'left',
};

const variantTdStyles: React.CSSProperties = {
  padding: '8px 12px',
};

const dropzoneStyles: React.CSSProperties = {
  border: '2px dashed #d1d5db',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const imageThumbGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
  gap: '12px',
};

const imageCardStyles: React.CSSProperties = {
  position: 'relative',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '4px',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  alignItems: 'center',
};

const imagePreviewStyles: React.CSSProperties = {
  width: '100%',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '6px',
};

const primaryTagStyles: React.CSSProperties = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: 800,
  padding: '2px 6px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const setPrimaryBtnStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  fontSize: '10px',
  fontWeight: 600,
  padding: '2px 6px',
  borderRadius: '4px',
  cursor: 'pointer',
  color: '#374151',
};

const deleteImgBtnStyles: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#ef4444',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  padding: '2px',
};

const statusBannerStyles: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1d4ed8',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
};

const modalFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  paddingTop: '12px',
  borderTop: '1px solid #e5e7eb',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  color: '#4b5563',
  cursor: 'pointer',
};

const modalSubmitBtnStyles: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: '8px',
  backgroundColor: '#ff7a00',
  fontSize: '13px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
  boxShadow: '0 2px 6px rgba(255, 122, 0, 0.25)',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '440px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '24px',
};

const modalDangerSubmitBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  backgroundColor: '#ef4444',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
};
