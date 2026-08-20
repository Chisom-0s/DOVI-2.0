import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Category, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Form states (Create / Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parent, setParent] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.listCategories();
      setCategories(data || []);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      // Auto-generate slug
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleResetForm = () => {
    setName('');
    setSlug('');
    setParent(null);
    setIconUrl('');
    setIsEditing(false);
    setSelectedCategoryId(null);
  };

  const handleEditClick = (cat: Category) => {
    setIsEditing(true);
    setSelectedCategoryId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setParent(cat.parent);
    setIconUrl(cat.icon_url || '');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        slug,
        parent: parent || null,
        icon_url: iconUrl || undefined,
      };

      if (isEditing && selectedCategoryId) {
        await adminApi.updateCategory(selectedCategoryId, payload);
        toast.success(`Category "${name}" updated successfully.`);
      } else {
        await adminApi.createCategory(payload);
        toast.success(`Category "${name}" created successfully.`);
      }
      handleResetForm();
      await fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.product_count > 0) {
      toast.error(`Cannot delete category "${cat.name}" because it contains active products.`);
      return;
    }
    if (cat.children && cat.children.length > 0) {
      toast.error(`Cannot delete category "${cat.name}" because it has child subcategories.`);
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete category "${cat.name}"?`);
    if (!confirmDelete) return;

    try {
      await adminApi.deleteCategory(cat.id);
      toast.success(`Category "${cat.name}" deleted.`);
      await fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category.');
    }
  };

  // Flatten tree for flat lists (e.g. parent options dropdown)
  const getFlatCategoriesList = (cats: Category[], depth = 0): Array<{ id: string; name: string; depth: number }> => {
    const list: Array<{ id: string; name: string; depth: number }> = [];
    cats.forEach((c) => {
      list.push({ id: c.id, name: c.name, depth });
      if (c.children && c.children.length > 0) {
        list.push(...getFlatCategoriesList(c.children, depth + 1));
      }
    });
    return list;
  };

  const flatOptions = getFlatCategoriesList(categories);

  const renderCategoryNode = (cat: Category, depth = 0) => {
    return (
      <div key={cat.id} style={{ ...nodeWrapperStyles, paddingLeft: `${depth * 20}px` }}>
        <div style={nodeRowStyles}>
          <span style={nodeIconStyles}>📁</span>
          <div style={{ flex: 1 }}>
            <span style={nodeNameStyles}>{cat.name}</span>
            <span style={nodeSlugStyles}>({cat.slug})</span>
          </div>
          <span style={productCountStyles}>{cat.product_count} products</span>
          <div style={nodeActionsStyles}>
            <button
              type="button"
              onClick={() => handleEditClick(cat)}
              style={editBtnStyles}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(cat)}
              style={deleteBtnStyles}
            >
              Delete
            </button>
          </div>
        </div>
        {cat.children && cat.children.map((child) => renderCategoryNode(child, depth + 1))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Category Settings</h2>
        <Skeleton width="100%" height="300px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Category Settings</h2>

      <ApiErrorMessage error={error} />

      <div style={splitLayoutStyles}>
        {/* Left Column: Category Hierarchy Tree */}
        <div style={cardStyles}>
          <h3 style={cardTitleStyles}>Categories Hierarchy Tree</h3>
          {categories.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No Categories Defined"
              subtitle="Use the configuration form on the right to define your first product category."
            />
          ) : (
            <div style={treeContainerStyles}>
              {categories.map((c) => renderCategoryNode(c))}
            </div>
          )}
        </div>

        {/* Right Column: Category Configuration Form */}
        <div style={cardStyles}>
          <h3 style={cardTitleStyles}>
            {isEditing ? 'Edit Category Settings' : 'Create New Category'}
          </h3>
          <form onSubmit={handleFormSubmit} style={formStyles}>
            <div style={inputGroupStyles}>
              <label style={labelStyles}>Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Phone &amp; Accessories"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Url Slug</label>
              <input
                type="text"
                required
                placeholder="e.g. phone-accessories"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Parent Category (Hierarchy)</label>
              <select
                value={parent || ''}
                onChange={(e) => setParent(e.target.value || null)}
                style={selectStyles}
              >
                <option value="">None (Top-Level Category)</option>
                {flatOptions
                  .filter(o => o.id !== selectedCategoryId) // Avoid selecting self as parent
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {'-'.repeat(o.depth)} {o.name}
                    </option>
                  ))}
              </select>
            </div>

            <div style={inputGroupStyles}>
              <label style={labelStyles}>Icon Url Reference (Optional)</label>
              <input
                type="text"
                placeholder="https://example.com/icon.svg"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                style={inputStyles}
              />
            </div>

            <div style={formActionsStyles}>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  style={cancelFormBtnStyles}
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...submitBtnStyles,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting
                  ? 'Saving Category...'
                  : isEditing
                  ? 'Save Category'
                  : 'Create Category'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
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

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const splitLayoutStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.8fr',
  gap: '24px',
  alignItems: 'start',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#374151',
  margin: 0,
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '10px',
};

const treeContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const nodeWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const nodeRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: '8px',
  borderBottom: '1px solid #f3f4f6',
  gap: '12px',
  transition: 'background-color 150ms ease',
};

const nodeIconStyles: React.CSSProperties = {
  fontSize: '16px',
};

const nodeNameStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#1f2937',
};

const nodeSlugStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  marginLeft: '4px',
};

const productCountStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
};

const nodeActionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const editBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#ff7a00',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontWeight: 700,
};

const deleteBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#ef4444',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontWeight: 700,
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const inputGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '12px',
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

const selectStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const formActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '8px',
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
  padding: '8px 16px',
  borderRadius: '9999px',
  backgroundColor: '#ff7a00',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
};
