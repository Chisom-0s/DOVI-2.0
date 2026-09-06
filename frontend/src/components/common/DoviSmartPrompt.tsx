import { useState, useEffect, useRef, ReactNode } from 'react';
import { X, Minus } from 'lucide-react';

interface DoviSmartPromptProps {
  id: string; // Used for saving position
  icon?: ReactNode;
  collapsedText: ReactNode; // e.g. "◉ Install DOVI"
  title: string;
  subtitle: ReactNode;
  ctaText: string;
  onCtaClick: () => void;
  secondaryCtaText?: string;
  onSecondaryCtaClick?: () => void;
  onDismiss: () => void; // Permanent dismiss (triggers cooldown)
  autoCollapseMs?: number; // Default 8000
}

export default function DoviSmartPrompt({
  id,
  icon,
  collapsedText,
  title,
  subtitle,
  ctaText,
  onCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick,
  onDismiss,
  autoCollapseMs = 8000
}: DoviSmartPromptProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  // Load saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dovi_prompt_pos_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Simple sanity check to ensure it's not way off screen
        if (parsed.x >= 0 && parsed.y >= 0 && parsed.x <= window.innerWidth && parsed.y <= window.innerHeight) {
          setPosition(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [id]);

  // Save position
  const savePosition = (x: number, y: number) => {
    setPosition({ x, y });
    try {
      localStorage.setItem(`dovi_prompt_pos_${id}`, JSON.stringify({ x, y }));
    } catch (e) {
      // ignore
    }
  };

  // Auto collapse
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, autoCollapseMs);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, autoCollapseMs]);

  // Drag logic
  const handlePointerDown = (e: any) => {
    if (e.button !== 0 && e.type !== 'touchstart') return; // Only left click or touch
    
    // Don't drag if clicking buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsDragging(true);
    startPos.current = {
      x: e.clientX - (position?.x || 0),
      y: e.clientY - (position?.y || 0)
    };
    
    if (dragRef.current) {
      dragRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    
    let newX = e.clientX - startPos.current.x;
    let newY = e.clientY - startPos.current.y;
    
    // Constrain to viewport safe area
    const safeMargin = 16;
    const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0) - safeMargin;
    const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0) - safeMargin;
    
    newX = Math.max(safeMargin, Math.min(newX, maxX));
    newY = Math.max(safeMargin, Math.min(newY, maxY));
    
    currentOffset.current = { x: newX, y: newY };
    
    if (dragRef.current) {
      dragRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  };

  const handlePointerUp = (e: any) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragRef.current) {
      dragRef.current.releasePointerCapture(e.pointerId);
    }
    
    // Snap logic could be added here, for now just save the constrained position
    savePosition(currentOffset.current.x, currentOffset.current.y);
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  const handleExpand = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // Determine styles based on state
  const baseStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    touchAction: 'none',
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    willChange: 'transform, width, height, opacity',
    // Default position if no saved position (bottom right)
    ...(position ? {} : {
      bottom: 'calc(24px + env(safe-area-inset-bottom))',
      right: '24px',
    })
  };

  if (position) {
    baseStyles.top = 0;
    baseStyles.left = 0;
    baseStyles.transform = `translate(${position.x}px, ${position.y}px)`;
  }

  const containerStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius-lg, 12px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid rgba(0,0,0,0.05)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  if (!isExpanded) {
    // Collapsed State
    return (
      <div 
        ref={dragRef}
        style={baseStyles}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <button 
          onClick={handleExpand}
          style={{
            ...containerStyles,
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full, 9999px)',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            backgroundColor: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          aria-label="Expand prompt"
        >
          {icon}
          {collapsedText}
        </button>
      </div>
    );
  }

  // Expanded State
  return (
    <div 
      ref={dragRef}
      style={{
        ...baseStyles,
        width: '320px',
        maxWidth: 'calc(100vw - 32px)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div style={containerStyles}>
        {/* Header/Drag Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary, #ff7a00)', fontWeight: 700, fontSize: '0.9rem' }}>
            {icon}
            {title}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={handleMinimize}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
              aria-label="Minimize"
            >
              <Minus size={18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
              aria-label="Dismiss permanently"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', margin: '0 0 16px', lineHeight: 1.5 }}>
            {subtitle}
          </p>
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); onCtaClick(); }}
              style={{
                backgroundColor: 'var(--color-primary, #ff7a00)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                fontSize: '0.9rem'
              }}
            >
              {ctaText}
            </button>
            
            {secondaryCtaText && onSecondaryCtaClick && (
              <button 
                onClick={(e) => { e.stopPropagation(); onSecondaryCtaClick(); }}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '8px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '0.85rem'
                }}
              >
                {secondaryCtaText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
