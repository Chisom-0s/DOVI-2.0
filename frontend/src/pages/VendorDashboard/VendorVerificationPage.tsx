import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getVendorVerificationStatus,
  sendEmailVerification,
  verifyEmailToken,
  sendPhoneOTP,
  verifyPhoneOTP,
} from '@/api/verification';
import type { VendorVerification, VerificationStatus } from '@/types/verification';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function VendorVerificationPage() {
  const { user } = useAuth();
  const [verification, setVerification] = useState<VendorVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Email State
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState<string | null>(null);
  const [emailTokenInput, setEmailTokenInput] = useState('');
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [showEmailTokenModal, setShowEmailTokenModal] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Phone State
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const vendorId = user?.vendor_store?.id || user?.id || 'default_vendor';
  const userEmail = user?.email || '';

  // Initial load
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getVendorVerificationStatus(vendorId, userEmail, user?.phone || user?.profile?.phone_number || '')
      .then((data) => {
        if (!isMounted) return;
        setVerification(data);
        if (data.phone_number) {
          setPhone(data.phone_number);
        } else if (user?.phone || user?.profile?.phone_number) {
          setPhone(user.phone || user.profile?.phone_number || '');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, vendorId]);

  // Resend OTP Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendEmail = async () => {
    setEmailSending(true);
    setEmailError(null);
    setEmailSentMessage(null);
    try {
      const res = await sendEmailVerification(vendorId, userEmail);
      setEmailSentMessage(res.message);
      setShowEmailTokenModal(true);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send verification email');
    } finally {
      setEmailSending(false);
    }
  };

  const handleConfirmEmailToken = async () => {
    if (!emailTokenInput.trim()) {
      setEmailError('Please enter verification token or code from your email');
      return;
    }

    setEmailVerifying(true);
    setEmailError(null);
    try {
      const res = await verifyEmailToken(vendorId, emailTokenInput.trim());
      // Refresh local verification state
      const updated = await getVendorVerificationStatus(vendorId, userEmail, phone);
      setVerification(updated);
      setShowEmailTokenModal(false);
      setEmailSentMessage(res.message);
    } catch (err: any) {
      setEmailError(err.message || 'Invalid or expired email verification token');
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone || phone.trim().length < 8) {
      setOtpError('Please enter a valid phone number including area code (e.g. +2348012345678)');
      return;
    }

    setOtpSending(true);
    setOtpError(null);
    setOtpSuccessMessage(null);
    try {
      const res = await sendPhoneOTP(vendorId, phone.trim());
      setOtpSent(true);
      setResendCooldown(res.cooldown_seconds || 60);
      setOtpSuccessMessage(res.message);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send verification OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Please enter the verification code sent to your phone');
      return;
    }

    if (attemptsLeft <= 0) {
      setOtpError('Maximum attempt limit reached. Please request a new OTP code.');
      return;
    }

    setOtpVerifying(true);
    setOtpError(null);
    try {
      const res = await verifyPhoneOTP(vendorId, phone.trim(), otpCode.trim());
      const updated = await getVendorVerificationStatus(vendorId, userEmail, phone);
      setVerification(updated);
      setOtpSuccessMessage(res.message);
      setOtpSent(false);
      setOtpCode('');
    } catch (err: any) {
      setAttemptsLeft((prev) => Math.max(0, prev - 1));
      setOtpError(err.message || `Incorrect OTP code. ${attemptsLeft - 1} attempt(s) remaining.`);
    } finally {
      setOtpVerifying(false);
    }
  };

  if (isLoading || !verification) {
    return <LoadingSpinner fullScreen />;
  }

  const emailVerified = verification.email_verified;
  const phoneVerified = verification.phone_verified;
  const status: VerificationStatus = emailVerified && phoneVerified
    ? 'fully_verified'
    : (emailVerified || phoneVerified ? 'partially_verified' : 'unverified');

  const completedCount = (emailVerified ? 1 : 0) + (phoneVerified ? 1 : 0);

  return (
    <div style={pageContainerStyles}>
      {/* 1. Header Banner & Status Summary */}
      <div style={bannerCardStyles}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={pillTagStyles}>VENDOR VERIFICATION CENTER</span>
              <span
                style={{
                  ...statusBadgeStyles,
                  backgroundColor:
                    status === 'fully_verified'
                      ? 'rgba(39, 174, 96, 0.1)'
                      : status === 'partially_verified'
                      ? 'rgba(255, 122, 0, 0.1)'
                      : 'var(--color-bg-subtle)',
                  color:
                    status === 'fully_verified'
                      ? 'var(--color-success)'
                      : status === 'partially_verified'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-muted)',
                  borderColor:
                    status === 'fully_verified'
                      ? 'rgba(39, 174, 96, 0.3)'
                      : status === 'partially_verified'
                      ? 'rgba(255, 122, 0, 0.3)'
                      : 'var(--color-border)',
                }}
              >
                {status === 'fully_verified' && '✓ Fully Verified'}
                {status === 'partially_verified' && '◐ Verification In Progress'}
                {status === 'unverified' && '○ Not Verified'}
              </span>
            </div>

            <h1 style={titleStyles}>
              {status === 'fully_verified' && '✓ Fully Verified'}
              {status === 'partially_verified' && 'Complete Your Verification'}
              {status === 'unverified' && 'Get Verified'}
            </h1>

            <p style={subtitleStyles}>
              {status === 'fully_verified' && 'Your vendor account has been successfully verified. You enjoy full verified-merchant trust and priority placement benefits.'}
              {status === 'partially_verified' && `You're almost there! Complete your remaining contact verification (${!emailVerified ? 'Email' : 'Phone'}) to become a fully verified vendor.`}
              {status === 'unverified' && 'Complete your verification to build trust with customers and unlock verified-vendor badges.'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div style={progressCardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
                VERIFICATION PROGRESS
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {completedCount} of 2 completed
              </span>
            </div>

            <div style={progressBarTrackStyles}>
              <div
                style={{
                  ...progressBarFillStyles,
                  width: `${(completedCount / 2) * 100}%`,
                  backgroundColor: status === 'fully_verified' ? 'var(--color-success)' : 'var(--color-primary)',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ color: emailVerified ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                Email {emailVerified ? '✓' : '○'}
              </span>
              <span style={{ color: phoneVerified ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                Phone {phoneVerified ? '✓' : '○'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Verification Cards */}
      <div style={gridTwoColStyles}>
        {/* Email Verification Card */}
        <div style={cardStyles}>
          <div style={cardHeaderStyles}>
            <div style={iconBadgeStyles}>✉️</div>
            <div>
              <h3 style={cardTitleStyles}>Email Verification</h3>
              <p style={cardDescStyles}>Verify the email address associated with your DOVI vendor account</p>
            </div>
          </div>

          <div style={cardBodyStyles}>
            <div style={infoRowStyles}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Account Email:</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)', wordBreak: 'break-all' }}>{userEmail}</strong>
            </div>

            <div style={{ margin: '16px 0' }}>
              {emailVerified ? (
                <div style={verifiedBadgeBoxStyles}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div>
                    <strong style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}>Email Verified</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Confirmed on {verification.email_verified_at ? new Date(verification.email_verified_at).toLocaleDateString() : 'Record'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={unverifiedBoxStyles}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>Status: <strong>Unverified</strong></span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 12px 0' }}>
                    Click below to send a verification confirmation link to your email.
                  </p>

                  {emailSentMessage && (
                    <div style={successAlertStyles}>
                      {emailSentMessage}
                    </div>
                  )}

                  {emailError && (
                    <div style={errorAlertStyles}>
                      {emailError}
                    </div>
                  )}

                  <button
                    onClick={handleSendEmail}
                    disabled={emailSending}
                    style={primaryBtnStyles}
                  >
                    {emailSending ? 'Sending Link...' : 'Send Verification Email'}
                  </button>

                  {showEmailTokenModal && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                      <label style={labelStyles}>Enter Verification Code/Token</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input
                          type="text"
                          value={emailTokenInput}
                          onChange={(e) => setEmailTokenInput(e.target.value)}
                          placeholder="Paste token or enter code"
                          style={inputStyles}
                        />
                        <button
                          onClick={handleConfirmEmailToken}
                          disabled={emailVerifying}
                          style={{ ...primaryBtnStyles, width: 'auto', whiteSpace: 'nowrap' }}
                        >
                          {emailVerifying ? 'Confirming...' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phone Verification (OTP) Card */}
        <div style={cardStyles}>
          <div style={cardHeaderStyles}>
            <div style={iconBadgeStyles}>📱</div>
            <div>
              <h3 style={cardTitleStyles}>Phone Verification (OTP)</h3>
              <p style={cardDescStyles}>Verify your phone number using a secure One-Time Password</p>
            </div>
          </div>

          <div style={cardBodyStyles}>
            {phoneVerified ? (
              <div style={verifiedBadgeBoxStyles}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <div>
                  <strong style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}>Phone Number Verified</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{verification.phone_number || phone}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Confirmed on {verification.phone_verified_at ? new Date(verification.phone_verified_at).toLocaleDateString() : 'Record'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {otpSuccessMessage && (
                  <div style={successAlertStyles}>
                    {otpSuccessMessage}
                  </div>
                )}

                {otpError && (
                  <div style={errorAlertStyles}>
                    {otpError}
                  </div>
                )}

                <div>
                  <label style={labelStyles}>Vendor Phone Number</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      disabled={otpSent}
                      style={inputStyles}
                    />
                    <button
                      onClick={handleSendOTP}
                      disabled={otpSending || (resendCooldown > 0 && otpSent)}
                      style={{
                        ...primaryBtnStyles,
                        width: 'auto',
                        whiteSpace: 'nowrap',
                        backgroundColor: resendCooldown > 0 && otpSent ? 'var(--color-bg-subtle)' : 'var(--color-primary)',
                        color: resendCooldown > 0 && otpSent ? 'var(--color-text-muted)' : '#ffffff',
                        border: resendCooldown > 0 && otpSent ? '1px solid var(--color-border)' : 'none',
                      }}
                    >
                      {otpSending
                        ? 'Sending...'
                        : otpSent
                        ? (resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP')
                        : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <label style={labelStyles}>Enter 6-Digit OTP Code</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        style={{ ...inputStyles, letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}
                      />
                      <button
                        onClick={handleVerifyOTP}
                        disabled={otpVerifying || attemptsLeft <= 0}
                        style={{ ...primaryBtnStyles, width: 'auto', whiteSpace: 'nowrap' }}
                      >
                        {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                      <span>OTP expires in 5 minutes</span>
                      <span>{attemptsLeft} attempt(s) remaining</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Extensible Future Layers Teaser (Clean Non-KYC Design) */}
      <div style={cardStyles}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ ...cardTitleStyles, fontSize: '1rem' }}>Extensible Trust Layers</h3>
            <p style={cardDescStyles}>Future verification modules planned for high-tier merchant levels</p>
          </div>
          <span style={pillTagStyles}>MODULAR ARCHITECTURE</span>
        </div>

        <div style={gridThreeColStyles}>
          <div style={futureBoxStyles}>
            <span style={futureStatusBadgeStyles}>CURRENT REQUIREMENT</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>Email + Phone Verification</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Standard verification active for all DOVI 2.0 marketplace merchants.
            </p>
          </div>

          <div style={{ ...futureBoxStyles, opacity: 0.7 }}>
            <span style={{ ...futureStatusBadgeStyles, background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }}>COMING SOON</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>Corporate ID / CAC Registration</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Optional tier for registered corporate entities seeking enterprise badges.
            </p>
          </div>

          <div style={{ ...futureBoxStyles, opacity: 0.7 }}>
            <span style={{ ...futureStatusBadgeStyles, background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)' }}>COMING SOON</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>Settlement Bank Verification</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Automated account name validation for instant escrow payouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const pageContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const bannerCardStyles: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem 1.75rem',
  boxShadow: 'var(--shadow-sm)',
};

const pillTagStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  fontWeight: '700',
  letterSpacing: '0.5px',
  color: 'var(--color-primary)',
  background: 'rgba(255, 122, 0, 0.08)',
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
};

const statusBadgeStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid transparent',
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: '800',
  color: 'var(--color-text)',
  margin: '0 0 0.25rem 0',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  margin: 0,
  maxWidth: '640px',
  lineHeight: '1.5',
};

const progressCardStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '1rem 1.25rem',
  minWidth: '260px',
};

const progressBarTrackStyles: React.CSSProperties = {
  height: '6px',
  backgroundColor: 'var(--color-border)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
};

const progressBarFillStyles: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.4s ease',
};

const gridTwoColStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.25rem',
};

const gridThreeColStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginTop: '12px',
};

const cardStyles: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)',
};

const cardHeaderStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  marginBottom: '1rem',
};

const iconBadgeStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'rgba(255, 122, 0, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  flexShrink: 0,
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  margin: '0 0 2px 0',
};

const cardDescStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const cardBodyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const infoRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  background: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
};

const verifiedBadgeBoxStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: 'rgba(39, 174, 96, 0.06)',
  border: '1px solid rgba(39, 174, 96, 0.2)',
  borderRadius: 'var(--radius-md)',
};

const unverifiedBoxStyles: React.CSSProperties = {
  padding: '12px 14px',
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
};

const labelStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: 'var(--color-text)',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '0.875rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-surface)',
  color: 'var(--color-text)',
  outline: 'none',
};

const primaryBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  fontSize: '0.875rem',
  fontWeight: '700',
  color: '#ffffff',
  backgroundColor: 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'opacity 0.2s ease',
};

const successAlertStyles: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '0.8rem',
  color: 'var(--color-success)',
  backgroundColor: 'rgba(39, 174, 96, 0.08)',
  border: '1px solid rgba(39, 174, 96, 0.2)',
  borderRadius: 'var(--radius-md)',
  marginBottom: '10px',
};

const errorAlertStyles: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '0.8rem',
  color: 'var(--color-danger)',
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: 'var(--radius-md)',
  marginBottom: '10px',
};

const futureBoxStyles: React.CSSProperties = {
  padding: '12px 14px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const futureStatusBadgeStyles: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.5px',
  color: 'var(--color-primary)',
  alignSelf: 'flex-start',
};
