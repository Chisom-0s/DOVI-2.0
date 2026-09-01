import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/client';
import { productsApi } from '@/api/products';

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
  const [form, setForm] = useState({
    name: '',
    category: '',
    base_price: '',
    description: '',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'PAUSED',
  });

  // Image Upload State (Create Flow)
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setForm({
      name: '',
      category: categories[0]?.id || '',
      base_price: '',
      description: '',
      status: 'PUBLISHED',
    });
    setUploadStatusText('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    cleanupImagePreviews();
    setEditingProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      base_price: p.base_price.toString(),
      description: p.description || '',
      status: p.status,
    });
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

  // Image Selection Handlers
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: SelectedImage[] = [];
    const existingCount = selectedImages.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Format validation
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format. Please use JPG, PNG, or WEBP.`);
        continue;
      }

      // Size validation
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 5MB size limit.`);
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
        // Ensure at least one primary exists
        const hasPrimary = combined.some(img => img.isPrimary);
        if (!hasPrimary && combined.length > 0) {
          combined[0].isPrimary = true;
        }
        return combined;
      });
    }

    // Reset file input so same file can be re-selected if removed
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
      // If we removed the primary image, make the first remaining image primary
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
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingProduct) {
        // Edit Mode: Update product fields
        setUploadStatusText('Updating product details...');
        await apiClient.patch(`/api/v1/products/${editingProduct.id}/`, {
          name: form.name,
          category: form.category,
          base_price: parseFloat(form.base_price),
          description: form.description,
          status: form.status,
        });
        toast.success('Product updated successfully');
        handleCloseModal();
        fetchProducts();
      } else {
        // Create Mode: Step 1 -> Create Product
        setUploadStatusText('Creating product listing...');
        const { data: createdProduct } = await apiClient.post('/api/v1/products/', {
          name: form.name,
          category: form.category,
          base_price: parseFloat(form.base_price),
          description: form.description,
          status: form.status,
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
            toast.success('Product created and images uploaded successfully!');
          } else {
            toast.error(
              `Product was created, but ${uploadErrors} of ${selectedImages.length} image(s) failed to upload.`
            );
          }
        } else {
          toast.success('Product created successfully');
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
          <h2 style={titleStyles}>Catalog Inventory</h2>
          <p style={subtitleStyles}>Monitor stock, upload product media, and manage catalog items.</p>
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
                <th style={thStyles}>STATUS</th>
                <th style={{ ...thStyles, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const thumbUrl =
                  p.primary_image_url ||
                  p.images?.[0]?.thumbnail_url ||
                  p.images?.[0]?.image_url ||
                  p.images?.[0]?.url;

                return (
                  <tr key={p.id} style={tableRowStyles}>
                    <td style={tdRefStyles}>{p.reference_code || 'N/A'}</td>
                    <td style={tdNameStyles}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={p.name}
                            style={tableThumbStyles}
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={tableNoThumbStyles}>📦</div>
                        )}
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td style={tdStyles}>{p.category_name}</td>
                    <td style={tdPriceStyles}>
                      ₦{parseFloat(p.base_price.toString()).toLocaleString()}
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
            <div style={modalHeaderStyles}>
              <h3 style={{ ...titleStyles, margin: 0 }}>
                {editingProduct ? 'Edit Catalog Listing' : 'Create Catalog Listing'}
              </h3>
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
              <div style={inputGroupStyles}>
                <label style={labelStyles}>PRODUCT NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 15 Pro Max, MacBook Air M3"
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
                  <option value="PUBLISHED">Published (Visible on Market)</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

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

                          <div style={imageSizeBadgeStyles}>
                            {(img.file.size / (1024 * 1024)).toFixed(1)}MB
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode Notice regarding Image Management Gap */}
              {editingProduct && (
                <div style={editNoticeStyles}>
                  <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                  <span>
                    Editing general listing parameters (title, category, price, status). Image gallery management on existing products is handled through the dedicated media endpoint.
                  </span>
                </div>
              )}

              <div style={inputGroupStyles}>
                <label style={labelStyles}>PRODUCT DESCRIPTION</label>
                <textarea
                  rows={3}
                  placeholder="Provide detailed product specifications, highlights, warranty, and key features..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  style={textareaStyles}
                  disabled={isSubmitting}
                />
              </div>

              {/* Upload Progress Status Indicator */}
              {isSubmitting && (
                <div style={progressBannerStyles}>
                  <div style={spinnerStyles}></div>
                  <span style={progressTextStyles}>{uploadStatusText || 'Processing request...'}</span>
                </div>
              )}

              <div style={modalFooterStyles}>
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
                      <span>Saving...</span>
                    </span>
                  ) : editingProduct ? (
                    'Update Listing'
                  ) : (
                    'Save & Publish Listing'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens (Responsive & Polished)
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

const tableThumbStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-sm)',
  objectFit: 'cover',
  border: '1px solid var(--color-border)',
  backgroundColor: '#f8fafc',
  flexShrink: 0,
};

const tableNoThumbStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
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
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(3px)',
  padding: '1rem',
};

const modalCardStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
  maxWidth: '560px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '1.75rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.25rem',
};

const closeBtnStyles: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-muted)',
  fontSize: '1.1rem',
  cursor: 'pointer',
  padding: '4px 8px',
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

const imageSizeBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '4px',
  left: '4px',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: '#ffffff',
  fontSize: '8px',
  padding: '1px 3px',
  borderRadius: '2px',
  display: 'none', // Subtle
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
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '0.5rem',
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
