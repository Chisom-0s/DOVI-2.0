import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { ProductSummary } from '@/types';
import {
  listMerchandisingSections,
    createCustomSection,
  deleteCustomSection,
  assignProductToSection,
  removeProductFromSection,
  reorderProductsInSection,
  updateSectionLimit,
  toggleSectionActive,
  reorderSections,
  syncHomepagePlacementsFromServer,
  type MerchandisingSection,
} from '@/services/homepagePlacementService';

export default function ProductMerchandisingTab() {
  const [sections, setSections] = useState<MerchandisingSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // New section form
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newSectionLimit, setNewSectionLimit] = useState(6);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await syncHomepagePlacementsFromServer().catch(() => {});
      const loadedSections = listMerchandisingSections();
      setSections(loadedSections);
      if (!selectedSectionId && loadedSections.length > 0) {
        setSelectedSectionId(loadedSections[0].id);
      }

      const prodRes = await adminApi.listProducts();
      const prods = Array.isArray(prodRes) ? prodRes : prodRes?.results || [];
      setAllProducts(prods);
    } catch (err: any) {
      toast.error('Failed to load merchandising data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      setSections(listMerchandisingSections());
    };
    window.addEventListener('dovi-merchandising-updated', handleUpdate);
    return () => window.removeEventListener('dovi-merchandising-updated', handleUpdate);
  }, []);

  const currentSection = useMemo(() => {
    return sections.find((s) => s.id === selectedSectionId) || sections[0] || null;
  }, [sections, selectedSectionId]);

  // Product map for quick lookup
  const productMap = useMemo(() => {
    const map = new Map<string, ProductSummary>();
    allProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [allProducts]);

  // Assigned products in order
  const assignedProducts = useMemo(() => {
    if (!currentSection) return [];
    const list: ProductSummary[] = [];
    currentSection.product_ids.forEach((id) => {
      const p = productMap.get(id);
      if (p) list.push(p);
      else {
        // Fallback placeholder if not in memory
        list.push({
          id,
          name: `Product (${id.slice(0, 8)})`,
          price: '0',
          base_price: '0',
          stock_quantity: 1,
          status: 'PUBLISHED' as any,
          category: { id: '', name: 'Catalog', slug: 'catalog', icon_url: null },
        } as any);
      }
    });
    return list;
  }, [currentSection, productMap]);

  // Filtered products for Add Product modal
  const filteredProductsToAdd = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const catName = typeof p.category === 'object' ? p.category?.name : (p as any).category_name || '';
      const matchesCategory = !categoryFilter || catName.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchQuery, categoryFilter]);

  // Categories list for filter
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach((p) => {
      const c = typeof p.category === 'object' ? p.category?.name : (p as any).category_name;
      if (c) cats.add(c);
    });
    return Array.from(cats);
  }, [allProducts]);

  // Actions
  const handleToggleActive = async (s: MerchandisingSection) => {
    const next = !s.is_active;
    await toggleSectionActive(s.id, next);
    setSections(listMerchandisingSections());
    toast.success(`${s.title} is now ${next ? 'Active' : 'Inactive'}.`);
  };

  const handleLimitChange = async (s: MerchandisingSection, limit: number) => {
    await updateSectionLimit(s.id, limit);
    setSections(listMerchandisingSections());
    toast.success(`Display limit updated to ${limit}.`);
  };

  const handleMoveProduct = async (index: number, direction: 'up' | 'down') => {
    if (!currentSection) return;
    const nextIdx = direction === 'up' ? index - 1 : index + 1;
    if (nextIdx < 0 || nextIdx >= currentSection.product_ids.length) return;

    const ids = [...currentSection.product_ids];
    const temp = ids[index];
    ids[index] = ids[nextIdx];
    ids[nextIdx] = temp;

    await reorderProductsInSection(currentSection.id, ids);
    setSections(listMerchandisingSections());
    toast.success('Product order updated.');
  };

  const handleRemoveProduct = async (productId: string, productName: string) => {
    if (!currentSection) return;
    const ok = window.confirm(`Remove "${productName}" from ${currentSection.title}?`);
    if (!ok) return;

    await removeProductFromSection(currentSection.id, productId);
    setSections(listMerchandisingSections());
    toast.success(`Removed from ${currentSection.title}.`);
  };

  const handleAddProduct = async (product: ProductSummary) => {
    if (!currentSection) return;
    if (currentSection.product_ids.includes(product.id)) {
      toast.error('Product is already assigned to this section.');
      return;
    }

    await assignProductToSection(currentSection.id, product.id);
    setSections(listMerchandisingSections());
    toast.success(`Added "${product.name}" to ${currentSection.title}.`);
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const nextIdx = direction === 'up' ? index - 1 : index + 1;
    if (nextIdx < 0 || nextIdx >= sections.length) return;

    const ids = sections.map((s) => s.id);
    const temp = ids[index];
    ids[index] = ids[nextIdx];
    ids[nextIdx] = temp;

    await reorderSections(ids);
    setSections(listMerchandisingSections());
    toast.success('Section display order updated.');
  };

  const handleCreateCustomSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      toast.error('Please enter a section name.');
      return;
    }

    try {
      const created = await createCustomSection({
        name: newSectionName.trim(),
        title: newSectionTitle.trim() || newSectionName.trim(),
        subtitle: newSectionSubtitle.trim(),
        display_limit: newSectionLimit,
      });

      setSections(listMerchandisingSections());
      setSelectedSectionId(created.id);
      setShowCreateSectionModal(false);
      setNewSectionName('');
      setNewSectionTitle('');
      setNewSectionSubtitle('');
      toast.success(`Custom section "${created.title}" created successfully.`);
    } catch {
      toast.error('Failed to create custom section.');
    }
  };

  const handleDeleteCustomSection = async (s: MerchandisingSection) => {
    if (!s.is_custom) return;
    const ok = window.confirm(`Are you sure you want to delete custom section "${s.title}"?`);
    if (!ok) return;

    await deleteCustomSection(s.id);
    const updated = listMerchandisingSections();
    setSections(updated);
    if (selectedSectionId === s.id && updated.length > 0) {
      setSelectedSectionId(updated[0].id);
    }
    toast.success(`Section "${s.title}" deleted.`);
  };

  if (isLoading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading merchandising sections...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Homepage Sections &amp; Product Merchandising
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Curate which products appear in Best Sellers, Trending Now, New Arrivals, Hot Sales, Flash Sales, Discounts, Featured Products, and Custom Sections.
          </p>
        </div>
        <button
          onClick={() => setShowCreateSectionModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ff7a00',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span>＋</span>
          <span>Create Custom Section</span>
        </button>
      </div>

      {/* Sections Horizontal Pill Bar */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '8px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {sections.map((sec) => {
          const isSelected = sec.id === currentSection?.id;
          const count = sec.product_ids?.length || 0;
          return (
            <button
              key={sec.id}
              onClick={() => setSelectedSectionId(sec.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: isSelected ? '2px solid #ff7a00' : '1px solid #cbd5e1',
                backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                color: isSelected ? '#c2410c' : '#334155',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{sec.title}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? '#ffedd5' : '#f1f5f9',
                  color: isSelected ? '#9a3412' : '#64748b',
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
              {!sec.is_active && (
                <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>• Inactive</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Section Detail Pane */}
      {currentSection && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Section Header Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              paddingBottom: '20px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {currentSection.title}
                </h3>
                {currentSection.is_custom && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#ede9fe',
                      color: '#6d28d9',
                    }}
                  >
                    Custom Section
                  </span>
                )}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: currentSection.is_active ? '#ecfdf5' : '#fef2f2',
                    color: currentSection.is_active ? '#065f46' : '#991b1b',
                  }}
                >
                  {currentSection.is_active ? 'Active on Homepage' : 'Hidden / Inactive'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                {currentSection.subtitle || 'No subtitle configured.'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Active Toggle */}
              <button
                onClick={() => handleToggleActive(currentSection)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: currentSection.is_active ? '#fef2f2' : '#ecfdf5',
                  color: currentSection.is_active ? '#b91c1c' : '#047857',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {currentSection.is_active ? 'Deactivate Section' : 'Activate Section'}
              </button>

              {/* Display Limit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>Display Limit:</label>
                <select
                  value={currentSection.display_limit}
                  onChange={(e) => handleLimitChange(currentSection, Number(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value={4}>4 products</option>
                  <option value={6}>6 products</option>
                  <option value={8}>8 products</option>
                  <option value={12}>12 products</option>
                  <option value={16}>16 products</option>
                </select>
              </div>

              {/* Order Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  Order #{currentSection.sort_order}
                </span>
                <button
                  title="Move section earlier"
                  onClick={() => handleMoveSection(sections.findIndex((s) => s.id === currentSection.id), 'up')}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                >
                  ↑
                </button>
                <button
                  title="Move section later"
                  onClick={() => handleMoveSection(sections.findIndex((s) => s.id === currentSection.id), 'down')}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                >
                  ↓
                </button>
              </div>

              {/* Delete Custom Section */}
              {currentSection.is_custom && (
                <button
                  onClick={() => handleDeleteCustomSection(currentSection)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fff1f2',
                    color: '#e11d48',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Delete Section
                </button>
              )}
            </div>
          </div>

          {/* Assigned Products Area */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                  Assigned Products ({assignedProducts.length})
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Products appear on the homepage in the exact order shown below (up to the display limit of {currentSection.display_limit}).
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>＋</span>
                <span>Add Products to Section</span>
              </button>
            </div>

            {assignedProducts.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                }}
              >
                <p style={{ fontSize: '14px', color: '#475569', fontWeight: 600, margin: '0 0 6px 0' }}>
                  No products currently assigned to {currentSection.title}.
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                  When empty, this section will automatically remain hidden on the live homepage.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#ff7a00',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Assign Products Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assignedProducts.map((p, index) => {
                  const catName = typeof p.category === 'object' ? p.category?.name : (p as any).category_name || 'Marketplace';
                  const img = p.primary_image_url || p.image_url || '/images/default-product.png';
                  const isVisibleOnHome = index < currentSection.display_limit;

                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: isVisibleOnHome ? '#ffffff' : '#f8fafc',
                        border: isVisibleOnHome ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        gap: '12px',
                      }}
                    >
                      {/* Left: Position & Thumbnail & Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: isVisibleOnHome ? '#0f172a' : '#94a3b8',
                            width: '24px',
                            textAlign: 'center',
                          }}
                        >
                          #{index + 1}
                        </span>
                        <img
                          src={img}
                          alt={p.name}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#f1f5f9' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '10px', marginTop: '2px' }}>
                            <span>📁 {catName}</span>
                            <span>💰 ₦{Number(p.price || (p as any).base_price || 0).toLocaleString()}</span>
                            {!isVisibleOnHome && (
                              <span style={{ color: '#d97706', fontWeight: 600 }}>• Exceeds display limit ({currentSection.display_limit})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Reorder & Remove Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveProduct(index, 'up')}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: index === 0 ? '#f1f5f9' : '#ffffff',
                            color: index === 0 ? '#cbd5e1' : '#334155',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                          }}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          disabled={index === assignedProducts.length - 1}
                          onClick={() => handleMoveProduct(index, 'down')}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: index === assignedProducts.length - 1 ? '#f1f5f9' : '#ffffff',
                            color: index === assignedProducts.length - 1 ? '#cbd5e1' : '#334155',
                            cursor: index === assignedProducts.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                          }}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveProduct(p.id, p.name)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #fecaca',
                            backgroundColor: '#fff1f2',
                            color: '#e11d48',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginLeft: '6px',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT TO SECTION */}
      {showAddModal && currentSection && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Add Products to {currentSection.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                  Search the catalog and assign products to appear in this section.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Filters */}
            <div style={{ display: 'flex', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <input
                type="text"
                placeholder="Search products by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              >
                <option value="">All Categories</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Modal Product List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredProductsToAdd.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No matching products found.
                </div>
              ) : (
                filteredProductsToAdd.map((p) => {
                  const isAssigned = currentSection.product_ids.includes(p.id);
                  const img = p.primary_image_url || p.image_url || '/images/default-product.png';
                  const catName = typeof p.category === 'object' ? p.category?.name : (p as any).category_name || 'Marketplace';

                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: isAssigned ? '#f8fafc' : '#ffffff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <img
                          src={img}
                          alt={p.name}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            <span>📁 {catName}</span> • <span>₦{Number(p.price || (p as any).base_price || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isAssigned ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#059669',
                              backgroundColor: '#ecfdf5',
                              padding: '4px 10px',
                              borderRadius: '4px',
                            }}
                          >
                            ✓ Assigned
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddProduct(p)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: '#ff7a00',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            ＋ Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM SECTION */}
      {showCreateSectionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleCreateCustomSection}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                Create Custom Homepage Section
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Configure a new promotional product section that will appear on the DOVI homepage.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Internal Section Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Campus Essentials, Back to School"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Public Title (Shown to Customers)
              </label>
              <input
                type="text"
                placeholder="e.g. Must-Have Campus Essentials"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Subtitle / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Budget-friendly gadgets and gear for smart students"
                value={newSectionSubtitle}
                onChange={(e) => setNewSectionSubtitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Display Limit
              </label>
              <select
                value={newSectionLimit}
                onChange={(e) => setNewSectionLimit(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value={4}>4 products</option>
                <option value={6}>6 products</option>
                <option value={8}>8 products</option>
                <option value={12}>12 products</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowCreateSectionModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ff7a00',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create Section
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
