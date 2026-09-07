import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '@/api/products';
import { formatPrice } from '@/utils/currency';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { ProductSummary } from '@/types';

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSummary[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete suggestion fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.search(query, { page_size: 5 });
        setSuggestions(response.results);
      } catch (err) {
        console.error('Autocomplete fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (productId: string) => {
    setShowDropdown(false);
    setQuery('');
    navigate(`/products/${productId}`);
  };

  return (
    <div ref={containerRef} style={searchWrapperStyles}>
      <form onSubmit={handleSubmit} style={formStyles}>
        <div style={iconContainerStyles}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search products, books, gadgets..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          style={inputStyles}
        />
      </form>

      {/* Autocomplete Dropdown */}
      {showDropdown && (query.trim().length >= 2 || isLoading) && (
        <div style={dropdownStyles}>
          {isLoading ? (
            <div style={statusTextStyles}>Searching...</div>
          ) : suggestions.length > 0 ? (
            <ul style={listStyles}>
              {suggestions.map(product => (
                <li
                  key={product.id}
                  onClick={() => handleSuggestionClick(product.id)}
                  style={itemStyles}
                >
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    style={thumbStyles}
                    onError={e => {
                      (e.target as HTMLImageElement).src = getProductFallbackImage(product);
                    }}
                  />
                  <div style={infoStyles}>
                    <span style={nameStyles}>{product.name}</span>
                    <span style={priceStyles}>
                      {formatPrice(product)}
                    </span>
                  </div>
                </li>
              ))}
              <li
                onClick={handleSubmit}
                style={{ ...itemStyles, borderTop: '1px solid var(--color-border)', justifyContent: 'center', color: 'var(--color-primary)' }}
              >
                See all results for &quot;{query}&quot;
              </li>
            </ul>
          ) : (
            <div style={statusTextStyles}>No products found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const searchWrapperStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  width: '100%',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px 10px 42px',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  backgroundColor: '#f2f2f2',
  color: 'var(--color-text)',
  transition: 'background-color var(--transition-fast)',
};

const iconContainerStyles: React.CSSProperties = {
  position: 'absolute',
  left: '14px',
  color: 'var(--color-text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  zIndex: 2,
};

const dropdownStyles: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  zIndex: 200,
  overflow: 'hidden',
};

const statusTextStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  textAlign: 'center',
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const itemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
};

const thumbStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-sm)',
  objectFit: 'cover',
  backgroundColor: 'var(--color-bg-subtle)',
};

const infoStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const nameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text)',
};

const priceStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-primary)',
};
