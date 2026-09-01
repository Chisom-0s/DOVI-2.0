import type { Product } from '@/types';

interface ProductSpecsProps {
  product: Product;
}

export default function ProductSpecs({ product }: ProductSpecsProps) {
  if (!product) return null;

  const avgRating = typeof product.average_rating === 'number'
    ? product.average_rating
    : (parseFloat(String(product.average_rating || 0)) || 0);

  const stockQty = typeof product.stock_quantity === 'number'
    ? product.stock_quantity
    : (parseInt(String(product.stock_quantity || (product as { stock?: number }).stock || 0), 10) || 0);

  const vendorName = (typeof product.vendor === 'object' && product.vendor !== null)
    ? (product.vendor as { name?: string }).name
    : ((product as { vendor_name?: string }).vendor_name || 'Dovi Partner');

  const categoryName = (typeof product.category === 'object' && product.category !== null)
    ? (product.category as { name?: string }).name
    : ((product as { category_name?: string }).category_name || 'General');

  // 1. Extract Custom Specifications
  const customSpecs: { label: string; value: string }[] = [];

  if (product.specifications) {
    if (Array.isArray(product.specifications)) {
      product.specifications.forEach(item => {
        if (item?.key && item?.value) {
          customSpecs.push({ label: item.key, value: item.value });
        }
      });
    } else if (typeof product.specifications === 'object') {
      Object.entries(product.specifications).forEach(([k, v]) => {
        if (k && v) {
          customSpecs.push({ label: k, value: String(v) });
        }
      });
    }
  }

  // Fallback: Parse embedded DOVI_SPECS metadata from description if present
  if (customSpecs.length === 0 && product.description) {
    const metaMatch = product.description.match(/<!-- DOVI_SPECS: ([\s\S]*?) -->/);
    if (metaMatch && metaMatch[1]) {
      try {
        const parsed = JSON.parse(metaMatch[1]);
        if (typeof parsed === 'object' && parsed !== null) {
          Object.entries(parsed).forEach(([k, v]) => {
            if (k && v) customSpecs.push({ label: k, value: String(v) });
          });
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  // 2. Extract Available Colors & Variants
  const colorsList: string[] = [];
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(v => {
      const vStock = v.stock ?? v.stock_quantity;
      const stockPart = vStock !== undefined && vStock !== null ? ` (${vStock} units)` : '';
      if (v.name && v.name.toLowerCase() !== 'standard') {
        colorsList.push(`${v.name}${stockPart}`);
      }
    });
  }

  // 3. Assemble complete specifications list
  const baseSpecs = [
    ...(colorsList.length > 0 ? [{ label: 'Available Colors', value: colorsList.join(', ') }] : []),
    { label: 'Stock Units', value: stockQty > 0 ? `${stockQty} units available` : 'Out of Stock' },
    ...customSpecs,
    { label: 'Category', value: categoryName || 'General' },
    { label: 'Vendor Partner', value: vendorName || 'Dovi Partner' },
    { label: 'Item SKU Reference', value: product.sku || product.reference_code || 'N/A' },
    { label: 'Aggregate Rating', value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0 Stars` : 'No ratings yet' },
    { label: 'Listing ID', value: product.id },
  ];

  return (
    <div style={specsWrapperStyles}>
      <h3 style={titleStyles}>Technical Specifications</h3>
      <table style={tableStyles}>
        <tbody>
          {baseSpecs.map((spec, index) => (
            <tr
              key={`${spec.label}-${index}`}
              style={{
                ...rowStyles,
                backgroundColor: index % 2 === 0 ? 'var(--color-bg-subtle)' : '#ffffff',
              }}
            >
              <td style={labelCellStyles}>{spec.label}</td>
              <td style={valueCellStyles}>{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const specsWrapperStyles: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-4)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  marginBottom: 'var(--space-2)',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  fontSize: 'var(--text-sm)',
};

const rowStyles: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
  transition: 'background-color var(--transition-fast)',
};

const labelCellStyles: React.CSSProperties = {
  padding: '12px var(--space-4)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
  width: '35%',
  borderRight: '1px solid var(--color-border)',
};

const valueCellStyles: React.CSSProperties = {
  padding: '12px var(--space-4)',
  color: 'var(--color-text-muted)',
};
