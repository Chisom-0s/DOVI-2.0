import { useState } from 'react';

interface ShareButtonsProps {
  productName: string;
}

export default function ShareButtons({ productName }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;
  const shareText = `Check out this amazing product on DOVI: ${productName}`;

  // Native share sheets for mobile devices
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.warn('Native share failed or dismissed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Pre-configured social URLs
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;

  return (
    <div style={containerStyles}>
      <span style={labelStyles}>Share Item:</span>

      <div style={buttonGroupStyles}>
        {/* Mobile Native Share Trigger */}
        {typeof navigator.share === 'function' ? (
          <button onClick={handleNativeShare} style={iconBtnStyles} title="Share product">
            📤 Share
          </button>
        ) : (
          <>
            {/* Copy Link Button */}
            <div style={{ position: 'relative' }}>
              <button onClick={handleCopyLink} style={copyBtnStyles}>
                🔗 Copy Link
              </button>
              {copied && (
                <div style={copiedToastStyles}>
                  Copied!
                </div>
              )}
            </div>

            {/* Social Share Buttons */}
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={socialBtnStyles} title="Share on Twitter">
              🐦 Tweet
            </a>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={socialBtnStyles} title="Share on Facebook">
              👥 Post
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={socialBtnStyles} title="Share on WhatsApp">
              💬 Send
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  marginVertical: 'var(--space-4)',
  width: '100%',
};

const labelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const buttonGroupStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
};

const copyBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const socialBtnStyles: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  backgroundColor: '#ffffff',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const iconBtnStyles: React.CSSProperties = {
  ...copyBtnStyles,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
};

const copiedToastStyles: React.CSSProperties = {
  position: 'absolute',
  top: '-36px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'var(--color-success)',
  color: '#ffffff',
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  boxShadow: '0 2px 8px rgba(39, 174, 96, 0.25)',
  animation: 'fadeIn 0.2s ease-out',
  zIndex: 10,
};
