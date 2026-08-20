import { useState } from 'react';
import type { HomepageSection } from '@/types';

interface SectionConfigEditorProps {
  section: HomepageSection;
  onClose: () => void;
  onSave: (config: Record<string, any>) => Promise<void>;
}

export default function SectionConfigEditor({ section, onClose, onSave }: SectionConfigEditorProps) {
  const [title, setTitle] = useState(section.title);
  const [configString, setConfigString] = useState(
    JSON.stringify(section.config || {}, null, 2)
  );
  
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfigChange = (val: string) => {
    setConfigString(val);
    try {
      if (val.trim() === '') {
        setJsonError(null);
        return;
      }
      JSON.parse(val);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax.');
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(configString);
      setConfigString(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Cannot format: Invalid JSON syntax.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonError) return;

    let parsedConfig: Record<string, any> = {};
    try {
      if (configString.trim() !== '') {
        parsedConfig = JSON.parse(configString);
      }
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(parsedConfig);
    } catch {
      // Handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={backdropStyles}>
      <div style={modalContentStyles}>
        {/* Modal Header */}
        <div style={headerStyles}>
          <h3 style={titleStyles}>Configure Homepage Section — {section.key}</h3>
          <button type="button" onClick={onClose} style={closeBtnStyles}>&times;</button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={formStyles}>
          {/* Section Title */}
          <div style={inputGroupStyles}>
            <label style={labelStyles}>Section Display Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Featured Flash Deals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyles}
              disabled={isSaving}
            />
          </div>

          {/* JSON configuration block */}
          <div style={inputGroupStyles}>
            <div style={jsonHeaderStyles}>
              <label style={labelStyles}>Configuration Parameters (JSON Format)</label>
              <button
                type="button"
                onClick={handleFormatJson}
                style={formatBtnStyles}
              >
                Auto-Format JSON
              </button>
            </div>

            <textarea
              value={configString}
              onChange={(e) => handleConfigChange(e.target.value)}
              style={{
                ...textareaStyles,
                borderColor: jsonError ? '#ef4444' : '#d1d5db',
                boxShadow: jsonError ? '0 0 0 2px rgba(239, 68, 68, 0.15)' : 'none',
              }}
              rows={12}
              placeholder='{ "limit": 6, "category_slug": "parts", "show_price": true }'
              disabled={isSaving}
            />

            {jsonError && (
              <span style={jsonErrorLabelStyles}>
                ⚠️ Syntax Error: {jsonError}
              </span>
            )}
          </div>

          {/* Configuration helper descriptions */}
          <div style={infoBoxStyles}>
            <strong>Supported Parameters Guide:</strong>
            <ul style={guideListStyles}>
              <li><code>limit</code> (number): Maximum items to render in list card views (e.g. <code>4</code>, <code>6</code>).</li>
              <li><code>category_slug</code> (string): Restrict products display to a specific category slug.</li>
              <li><code>layout</code> (string): Design structure: <code>"grid"</code> or <code>"carousel"</code> or <code>"list"</code>.</li>
              <li><code>auto_rotate</code> (boolean): Enable auto scrolling for carousels.</li>
            </ul>
          </div>

          {/* Modal Actions */}
          <div style={modalActionsStyles}>
            <button type="button" onClick={onClose} style={cancelFormBtnStyles} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || jsonError !== null}
              style={{
                ...submitBtnStyles,
                opacity: isSaving || jsonError !== null ? 0.6 : 1,
                cursor: isSaving || jsonError !== null ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving ? 'Saving Configurations...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const backdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: '24px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '560px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const closeBtnStyles: React.CSSProperties = {
  fontSize: '24px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: '#9ca3af',
  lineHeight: 1,
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

const jsonHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const formatBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#ff7a00',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
};

const textareaStyles: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontFamily: 'monospace',
  fontSize: '12px',
  outline: 'none',
  resize: 'none',
  lineHeight: 1.5,
  backgroundColor: '#f9fafb',
};

const jsonErrorLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#ef4444',
  fontWeight: 600,
  marginTop: '4px',
};

const infoBoxStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '12px',
  color: '#4b5563',
  lineHeight: 1.5,
};

const guideListStyles: React.CSSProperties = {
  paddingLeft: '20px',
  marginTop: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
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
  padding: '8px 20px',
  borderRadius: '9999px',
  backgroundColor: '#ff7a00',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
  border: 'none',
};
