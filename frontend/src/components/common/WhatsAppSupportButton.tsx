import React, { useState } from 'react';

interface WhatsAppSupportButtonProps {
  phoneNumber?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  className?: string;
  style?: React.CSSProperties;
}

export function WhatsAppSupportButton({
  phoneNumber = '2347014109517',
  message = 'Hello Dovi Support, I need assistance with my account.',
  position = 'bottom-right',
  className = '',
  style,
}: WhatsAppSupportButtonProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

  if (position === 'inline') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#25D366',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '13px',
          borderRadius: '8px',
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
          ...style,
        }}
      >
        <WhatsAppIcon width={18} height={18} />
        <span>WhatsApp Support</span>
      </a>
    );
  }

  return (
    <div
      className={`whatsapp-support-floating-wrapper ${className}`}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        ...style,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media (max-width: 768px) {
            .whatsapp-support-floating-wrapper {
              bottom: 80px !important;
              right: 16px !important;
            }
          }
        `,
        }}
      />

      {isMinimized ? (
        // Minimized 48px Circular Floating Icon Pill
        <button
          onClick={() => setIsMinimized(false)}
          title="Expand WhatsApp Support"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#25D366',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 16px rgba(37, 211, 102, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <WhatsAppIcon width={24} height={24} />
        </button>
      ) : (
        // Expanded WhatsApp Pill with Minimize Action
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#25D366',
            borderRadius: '9999px',
            boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4), 0 2px 6px rgba(0, 0, 0, 0.12)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            overflow: 'hidden',
          }}
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Dovi Support on WhatsApp (07014109517)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <WhatsAppIcon width={20} height={20} />
            <span>Support (07014109517)</span>
          </a>

          {/* Minimize toggle button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMinimized(true);
            }}
            title="Minimize WhatsApp button"
            aria-label="Minimize WhatsApp button"
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
              border: 'none',
              color: '#ffffff',
              padding: '10px 10px 10px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              lineHeight: 1,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.15)')}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon({ width = 20, height = 20 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default WhatsAppSupportButton;
