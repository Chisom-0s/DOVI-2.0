import type { Product } from '@/types';

interface ProductSpecsProps {
  product: Product;
}

export default function ProductSpecs({ product }: ProductSpecsProps) {
  if (!product) return null;

  // Generate dynamic specifications list from product properties
  const specsList = [
    { label: 'Stock Status', value: product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} units)` : 'Out of Stock' },
    { label: 'Category', value: product.category?.name || 'General' },
    { label: 'Vendor Partner', value: product.vendor?.name || 'Dovi Partner' },
    { label: 'Item SKU Reference', value: product.sku || 'N/A' },
    { label: 'Aggregate Rating', value: product.average_rating > 0 ? `${product.average_rating.toFixed(1)} / 5.0 Stars` : 'No ratings yet' },
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
