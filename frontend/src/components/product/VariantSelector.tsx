import { useEffect, useState } from 'react';
import type { ProductVariant } from '@/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant | null) => void;
}

export default function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Parse all unique attribute keys and values from variants
  useEffect(() => {
    if (!variants || variants.length === 0) return;

    const parsed: Record<string, Set<string>> = {};
    variants.forEach(v => {
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([key, val]) => {
          if (!parsed[key]) parsed[key] = new Set();
          parsed[key].add(val);
        });
      }
    });

    const optionsMap: Record<string, string[]> = {};
    Object.entries(parsed).forEach(([key, valSet]) => {
      optionsMap[key] = Array.from(valSet);
    });

    setOptions(optionsMap);

    // Set initial selection from selectedVariant or first variant
    if (selectedVariant) {
      setSelections(selectedVariant.attributes);
    } else if (variants[0]) {
      setSelections(variants[0].attributes);
      onVariantChange(variants[0]);
    }
  }, [variants]);

  // Handle choice selection
  const handleSelect = (key: string, value: string) => {
    const nextSelections = { ...selections, [key]: value };
    setSelections(nextSelections);

    // Find if a variant matches this combination
    const matched = variants.find(v => {
      return Object.entries(nextSelections).every(([k, val]) => v.attributes[k] === val);
    });

    onVariantChange(matched || null);
  };

  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div style={selectorContainerStyles}>
      {Object.entries(options).map(([optionKey, optionValues]) => (
        <div key={optionKey} style={optionGroupStyles}>
          <div style={optionHeaderStyles}>
            <span style={optionLabelStyles}>{optionKey}</span>
            <span style={selectedValStyles}>{selections[optionKey] || 'Select...'}</span>
          </div>

          <div style={valuesListStyles}>
            {optionValues.map(val => {
              const isSelected = selections[optionKey] === val;
              const optionBtnStyles = getOptionButtonStyles(isSelected);

              return (
                <button
                  key={val}
                  onClick={() => handleSelect(optionKey, val)}
                  style={optionBtnStyles}
                  aria-label={`Select ${optionKey} ${val}`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Helpers & Tokens
// ----------------------------------------------------------
const selectorContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  width: '100%',
  borderTop: '1px solid var(--color-border)',
  borderBottom: '1px solid var(--color-border)',
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-4)',
};

const optionGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const optionHeaderStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  alignItems: 'baseline',
};

const optionLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
  textTransform: 'capitalize',
};

const selectedValStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const valuesListStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
};

const getOptionButtonStyles = (isSelected: boolean): React.CSSProperties => ({
  padding: '6px 16px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
  border: '2px solid',
  borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
  backgroundColor: isSelected ? '#ffffff' : 'var(--color-bg-subtle)',
  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  boxShadow: isSelected ? '0 2px 8px rgba(255, 122, 0, 0.1)' : 'none',
});
