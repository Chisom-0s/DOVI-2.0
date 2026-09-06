import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePromptEngine } from '@/contexts/PromptEngineContext';
import { getVendorVerificationStatus } from '@/api/verification';
import type { VendorVerification } from '@/types/verification';
import DoviSmartPrompt from './DoviSmartPrompt';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function VendorVerificationPrompt() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { activePrompt, registerEligibility, dismissPrompt } = usePromptEngine();
  const [verification, setVerification] = useState<VendorVerification | null>(null);

  const vendorId = user?.vendor_store?.id || user?.id || '';
  const isVendorRoute = location.pathname.startsWith('/vendor');
  const isVendorUser = !!user && (user.role === 'VENDOR' || user.profile?.vendor_status === 'APPROVED');

  // Sync verification status
  useEffect(() => {
    if (!user || !isVendorUser || !isVendorRoute || !vendorId) {
      registerEligibility('vendorVerification', false);
      return;
    }

    let isMounted = true;
    getVendorVerificationStatus(vendorId, user.email, user.phone || user.profile?.phone_number || '')
      .then((data) => {
        if (!isMounted) return;
        setVerification(data);
        const isEligible = data.verification_status !== 'fully_verified';
        registerEligibility('vendorVerification', isEligible);
      })
      .catch(() => {
        if (!isMounted) return;
        registerEligibility('vendorVerification', false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, isVendorUser, isVendorRoute, vendorId, registerEligibility]);

  // Strict route & auth guard: Never display on non-vendor routes or for non-vendor accounts
  if (!isVendorUser || !isVendorRoute || !verification || verification.verification_status === 'fully_verified') {
    return null;
  }

  const isVisible = activePrompt === 'vendorVerification';
  if (!isVisible) return null;

  const emailVerified = verification.email_verified;
  const phoneVerified = verification.phone_verified;

  let titleText = 'Get Verified';
  let ctaText = 'Verify Now';
  if (emailVerified && !phoneVerified) {
    titleText = 'Almost Verified';
    ctaText = 'Verify Phone';
  } else if (!emailVerified && phoneVerified) {
    titleText = 'Almost Verified';
    ctaText = 'Verify Email';
  }

  const subtitleNode = (
    <div>
      <p style={{ margin: '0 0 10px 0', fontSize: '0.875rem' }}>
        Complete your email and phone verification to build customer trust and unlock verified vendor status.
      </p>

      <div style={{
        display: 'flex',
        gap: '12px',
        fontSize: '0.8rem',
        fontWeight: 600,
        padding: '6px 10px',
        backgroundColor: 'var(--color-bg-subtle)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}>
        <span style={{ color: emailVerified ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          Email {emailVerified ? '✓' : '○'}
        </span>
        <span style={{ color: phoneVerified ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          Phone {phoneVerified ? '✓' : '○'}
        </span>
      </div>
    </div>
  );

  const handleCtaClick = () => {
    navigate('/vendor/dashboard/verification');
  };

  return (
    <DoviSmartPrompt
      id="vendor_verification"
      icon={emailVerified || phoneVerified ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
      collapsedText="Get Verified"
      title={titleText}
      subtitle={subtitleNode}
      ctaText={ctaText}
      onCtaClick={handleCtaClick}
      secondaryCtaText="Remind Later"
      onSecondaryCtaClick={() => dismissPrompt('vendorVerification')}
      onDismiss={() => dismissPrompt('vendorVerification')}
      autoCollapseMs={10000}
    />
  );
}
