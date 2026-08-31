import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/api/client';

interface Product {
  id: string;
  name: string;
  category_name: string;
  category: string;
  base_price: number | string;
  reference_code: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED';
  description?: string;
}

interface Category {
  id: string;
  name: string;
}

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

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/products/my-products/');
      setProducts(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await apiClient.get('/api/v1/categories/');
      setCategories(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: categories[0]?.id || '',
      base_price: '',
      description: '',
      status: 'PUBLISHED',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      base_price: p.base_price.toString(),
      description: p.description || '',
      status: p.status,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/api/v1/products/${id}/`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.base_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingProduct) {
        await apiClient.patch(`/api/v1/products/${editingProduct.id}/`, {
          name: form.name,
          category: form.category,
          base_price: parseFloat(form.base_price),
          description: form.description,
          status: form.status,
        });
        toast.success('Product updated successfully');
      } else {
        await apiClient.post('/api/v1/products/', {
          name: form.name,
          category: form.category,
          base_price: parseFloat(form.base_price),
          description: form.description,
          status: form.status,
        });
        toast.success('Product created successfully');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      const details = err?.response?.data?.detail || 'Failed to save product';
      toast.error(details);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={wrapperStyles}>
      <div style={headerRowStyles}>
        <div>
          <h2 style={titleStyles}>Catalog Inventory</h2>
          <p style={subtitleStyles}>Monitor stock, set pricing models, and update catalog items.</p>
        </div>
        <button onClick={handleOpenAdd} style={addBtnStyles}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
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
                <th style={thStyles}>PRODUCT NAME</th>
                <th style={thStyles}>CATEGORY</th>
                <th style={thStyles}>PRICE (₦)</th>
                <th style={thStyles}>STATUS</th>
                <th style={{ ...thStyles, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={tableRowStyles}>
                  <td style={tdRefStyles}>{p.reference_code || 'N/A'}</td>
                  <td style={tdNameStyles}>{p.name}</td>
                  <td style={tdStyles}>{p.category_name}</td>
                  <td style={tdPriceStyles}>₦{parseFloat(p.base_price.toString()).toLocaleString()}</td>
                  <td style={tdStyles}>
                    <span
                      style={{
                        ...statusBadgeStyles,
                        color: p.status === 'PUBLISHED' ? 'var(--color-success)' : p.status === 'PAUSED' ? 'var(--color-warning)' : 'var(--color-text-muted)',
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
              ))}
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
              <button onClick={() => setModalOpen(false)} style={closeBtnStyles}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={formStyles}>
              <div style={inputGroupStyles}>
                <label style={labelStyles}>PRODUCT NAME *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  style={inputStyles}
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
                    value={form.base_price}
                    onChange={e => setForm(prev => ({ ...prev, base_price: e.target.value }))}
                    style={inputStyles}
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
                >
                  <option value="PUBLISHED">Published (Visible on Market)</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

              <div style={inputGroupStyles}>
                <label style={labelStyles}>PRODUCT DESCRIPTION</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  style={textareaStyles}
                />
              </div>

              <div style={modalFooterStyles}>
                <button type="button" onClick={() => setModalOpen(false)} style={cancelBtnStyles}>
                  Cancel
                </button>
                <button type="submit" style={saveBtnStyles}>
                  Save Listing
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
// Styling (Light Theme)
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
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(2px)',
};

const modalCardStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
  maxWidth: '500px',
  padding: '2rem',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const closeBtnStyles: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-muted)',
  fontSize: '1rem',
  cursor: 'pointer',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const labelStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
};

const selectStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
};

const textareaStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
  resize: 'none',
};

const doubleColGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
};

const modalFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '1.5rem',
  borderTop: '1px solid var(--color-border)',
  paddingTop: '1rem',
};

const cancelBtnStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 16px',
  fontWeight: '600',
  fontSize: '0.825rem',
  cursor: 'pointer',
};

const saveBtnStyles: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '8px 16px',
  fontWeight: '700',
  fontSize: '0.825rem',
  cursor: 'pointer',
};
