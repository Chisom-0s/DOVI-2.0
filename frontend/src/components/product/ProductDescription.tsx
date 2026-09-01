interface ProductDescriptionProps {
  description: string;
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  if (!description) {
    return <div style={emptyDescStyles}>No description available for this product.</div>;
  }

  // Strip internal metadata comments if present
  const cleanDescription = description.replace(/<!-- DOVI_SPECS: [\s\S]*? -->/g, '').trim();

  if (!cleanDescription) {
    return <div style={emptyDescStyles}>No description available for this product.</div>;
  }

  // Parse newlines to paragraph tags safely to prevent basic layout breaks
  const paragraphs = cleanDescription.split('\n\n').filter(p => p.trim());

  return (
    <div style={descWrapperStyles}>
      {paragraphs.length > 0 ? (
        paragraphs.map((para, idx) => (
          <p key={idx} style={paraStyles}>
            {para.split('\n').map((line, lIdx) => (
              <span key={lIdx}>
                {line}
                {lIdx < para.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        ))
      ) : (
        <p style={paraStyles}>{description}</p>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const descWrapperStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  lineHeight: 'var(--leading-relaxed)',
  color: 'var(--color-text)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-4)',
};

const paraStyles: React.CSSProperties = {
  margin: 0,
};

const emptyDescStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontStyle: 'italic',
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-4)',
};
