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

  // Generate dynamic specifications list from product properties
  const specsList = [
    { label: 'Stock Status', value: stockQty > 0 ? `In Stock (${stockQty} units)` : 'Out of Stock' },
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
          {specsList.map((spec, index) => (
            <tr
              key={spec.label}
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
