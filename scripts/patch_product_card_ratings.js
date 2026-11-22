const fs = require('fs');
const path = require('path');

const cardPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'product', 'ProductCard.tsx');
let content = fs.readFileSync(cardPath, 'utf8');

// Remove ratings section from JSX
content = content.replace(
  `        {/* Ratings */}
        <div style={ratingStyles}>
          <span style={starsStyles}>★ {product.average_rating?.toFixed(1) ?? '0.0'}</span>
          <span style={countStyles}>({product.review_count ?? 0})</span>
        </div>`,
  ''
);

// Update detailsStyles for balanced spacing
content = content.replace(
  `const detailsStyles: React.CSSProperties = {
  padding: 'var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1,
};`,
  `const detailsStyles: React.CSSProperties = {
  padding: 'var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  flex: 1,
};`
);

// Update titleStyles to keep comfortable line height and 2-line clamp
content = content.replace(
  `const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  lineHeight: 1.38,
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  minHeight: '2.76em',
};`,
  `const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  lineHeight: 1.38,
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  minHeight: '2.76em',
  marginBottom: '2px',
};`
);

fs.writeFileSync(cardPath, content, 'utf8');
console.log('ProductCard.tsx patched successfully.');
