import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { VendorPayoutAccount } from '@/types';

export const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Access Bank (Diamond)', code: '063' },
  { name: 'Carbon Microfinance Bank', code: '565' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'FairMoney Microfinance Bank', code: '51318' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank (FCMB)', code: '214' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Microfinance Bank', code: '50211' },
  { name: 'Moniepoint Microfinance Bank', code: '50515' },
  { name: 'OPay Digital Services', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Rubies Bank', code: '125' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'SunTrust Bank', code: '100' },
  { name: 'Taj Bank', code: '302' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'VFD Microfinance Bank', code: '566' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

export default function VendorPayoutSettings() {
  const { user } = useAuth();
  const [payoutAccount, setPayoutAccount] = useState<VendorPayoutAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Initial load from local profile or user object
  useEffect(() => {
    const storageKey = `dovi_vendor_payout_${user?.id || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPayoutAccount(parsed);
      } catch (e) {
        console.error('Failed to parse saved payout settings:', e);
      }
    } else if (user?.vendor_store && (user as any).payout_account) {
      setPayoutAccount((user as any).payout_account);
    }
  }, [user]);

  // Handle Bank Selection
  const handleSelectBank = (bankName: string) => {
    setSelectedBankName(bankName);
    const bank = NIGERIAN_BANKS.find((b) => b.name === bankName);
    if (bank) {
      setBankCode(bank.code);
    } else {
      setBankCode('');
    }
    setIsVerified(false);
  };

  // NUBAN Account Verification simulation (Flutterwave account resolution simulation)
  const handleVerifyAccount = () => {
    if (!/^\d{10}$/.test(accountNumber)) {
      toast.error('Account number must be exactly 10 digits.');
      return;
    }
    if (!selectedBankName) {
      toast.error('Please select your bank name.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      toast.success('Bank NUBAN account record verified successfully!');
    }, 700);
  };

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBankName) {
      toast.error('Please select a valid Nigerian Bank.');
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      toast.error('Account number must be a 10-digit numeric NUBAN number.');
      return;
    }

    if (!accountName.trim()) {
      toast.error('Account name is required.');
      return;
    }

    setIsSubmitting(true);

    const updatedAccount: VendorPayoutAccount = {
      account_name: accountName.trim(),
      account_number: accountNumber.trim(),
      bank_name: selectedBankName,
      bank_code: bankCode,
      is_primary: true,
      updated_at: new Date().toISOString(),
    };

    // Save to state & local storage for cross-session / admin inspection sync
    const storageKey = `dovi_vendor_payout_${user?.id || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedAccount));

    // Also mirror to global store registry if present
    const globalKey = `dovi_all_vendor_payouts`;
    const allPayouts = JSON.parse(localStorage.getItem(globalKey) || '{}');
    if (user?.id) {
      allPayouts[user.id] = updatedAccount;
    }
    if (user?.vendor_store?.id) {
      allPayouts[user.vendor_store.id] = updatedAccount;
    }
    localStorage.setItem(globalKey, JSON.stringify(allPayouts));

    setTimeout(() => {
      setPayoutAccount(updatedAccount);
      setIsSubmitting(false);
      setIsEditing(false);
      toast.success('Payout bank details saved successfully!');
    }, 500);
  };

  const maskAccountNumber = (num: string) => {
    if (!num || num.length < 4) return '**********';
    return '******' + num.slice(-4);
  };

  const filteredBanks = NIGERIAN_BANKS.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div style={containerStyles}>
      <div style={headerSectionStyles}>
        <div>
          <h1 style={titleStyles}>Payout & Bank Settings</h1>
          <p style={subtitleStyles}>
            Manage your registered settlement bank account for receiving automated escrow payouts.
          </p>
        </div>
      </div>

      {/* Escrow Informational Notice */}
      <div style={infoBannerStyles}>
        <div style={{ fontSize: '20px', flexShrink: 0 }}>🛡️</div>
        <div>
          <strong style={{ color: '#0f766e', fontSize: '13px' }}>Escrow Payout Notice:</strong>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#115e59', lineHeight: 1.5 }}>
            These bank details will be used for transferring escrow funds directly into your account after successful product delivery and buyer confirmation.
          </p>
        </div>
      </div>

      {/* Currently Saved Bank Account Card */}
      {payoutAccount && !isEditing ? (
        <div style={cardStyles}>
          <div style={cardHeaderStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🏦</span>
              <div>
                <h3 style={bankNameTitleStyles}>{payoutAccount.bank_name}</h3>
                <span style={cbnCodePillStyles}>CBN Code: {payoutAccount.bank_code}</span>
              </div>
            </div>
            {payoutAccount.is_primary && (
              <span style={primaryBadgeStyles}>Primary Payout Account</span>
            )}
          </div>

          <div style={cardBodyStyles}>
            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Account Name:</span>
              <strong style={detailValStyles}>{payoutAccount.account_name}</strong>
            </div>

            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Account Number:</span>
              <span style={maskedNumberStyles}>
                {maskAccountNumber(payoutAccount.account_number)}
                <span style={lockIconStyles} title="Masked for security">🔒</span>
              </span>
            </div>

            {payoutAccount.updated_at && (
              <div style={detailRowStyles}>
                <span style={detailLabelStyles}>Last Updated:</span>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  {new Date(payoutAccount.updated_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div style={cardFooterStyles}>
            <button
              type="button"
              onClick={() => {
                setSelectedBankName(payoutAccount.bank_name);
                setBankCode(payoutAccount.bank_code);
                setAccountNumber(payoutAccount.account_number);
                setAccountName(payoutAccount.account_name);
                setIsEditing(true);
              }}
              style={editBtnStyles}
            >
              ✏️ Update Payout Bank Account
            </button>
          </div>
        </div>
      ) : (
        /* Form for Adding / Editing Bank Account */
        <form onSubmit={handleSavePayout} style={cardStyles}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1f2937', margin: 0, paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            {payoutAccount ? 'Edit Settlement Bank Details' : 'Add Primary Settlement Bank Account'}
          </h3>

          <div style={formGroupStyles}>
            <label style={labelStyles}>Select Bank Name</label>
            <input
              type="text"
              placeholder="Search bank name (e.g. GTBank, Zenith, Access, OPay)..."
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              style={inputStyles}
            />

            <select
              required
              value={selectedBankName}
              onChange={(e) => handleSelectBank(e.target.value)}
              style={{ ...inputStyles, marginTop: '6px', cursor: 'pointer' }}
            >
              <option value="">-- Choose Nigerian Bank --</option>
              {filteredBanks.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} (CBN Code: {b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-filled Bank Code Display */}
          {bankCode && (
            <div style={bankCodeNoticeStyles}>
              <span>Auto-filled Central Bank Code:</span>
              <strong style={{ color: '#ff7a00', fontSize: '13px' }}>{bankCode}</strong>
            </div>
          )}

          <div style={formGroupStyles}>
            <label style={labelStyles}>Account Number (10-Digit NUBAN)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAccountNumber(val);
                  setIsVerified(false);
                }}
                style={{ ...inputStyles, flex: 1 }}
              />
              <button
                type="button"
                onClick={handleVerifyAccount}
                disabled={isVerifying || accountNumber.length !== 10}
                style={{
                  ...verifyBtnStyles,
                  opacity: accountNumber.length !== 10 || isVerifying ? 0.6 : 1,
                }}
              >
                {isVerifying ? 'Checking...' : isVerified ? '✓ Verified' : 'Verify NUBAN'}
              </button>
            </div>
          </div>

          <div style={formGroupStyles}>
            <label style={labelStyles}>Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe / Business Enterprises"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              style={inputStyles}
            />
            <span style={fieldHelpStyles}>
              ⚠️ Account name must match your official bank registration records exactly.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            {payoutAccount && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={cancelBtnStyles}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...saveBtnStyles,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Saving Bank Details...' : 'Save Bank Details'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  maxWidth: '720px',
};

const headerSectionStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const titleStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '4px 0 0 0',
};

const infoBannerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '16px',
  backgroundColor: '#ccfbf1',
  border: '1px solid #99f6e4',
  borderRadius: '12px',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const cardHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '16px',
};

const bankNameTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const cbnCodePillStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  padding: '2px 8px',
  borderRadius: '4px',
  display: 'inline-block',
  marginTop: '2px',
};

const primaryBadgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: '#ff7a00',
  padding: '4px 10px',
  borderRadius: '9999px',
  border: '1px solid rgba(255, 122, 0, 0.25)',
  textTransform: 'uppercase',
};

const cardBodyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const detailRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
};

const detailLabelStyles: React.CSSProperties = {
  color: '#6b7280',
  fontWeight: 500,
};

const detailValStyles: React.CSSProperties = {
  color: '#1f2937',
  fontWeight: 700,
};

const maskedNumberStyles: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '15px',
  fontWeight: 700,
  color: '#1f2937',
  letterSpacing: '1px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const lockIconStyles: React.CSSProperties = {
  fontSize: '12px',
};

const cardFooterStyles: React.CSSProperties = {
  borderTop: '1px solid #f3f4f6',
  paddingTop: '16px',
  display: 'flex',
  justifyContent: 'flex-end',
};

const editBtnStyles: React.CSSProperties = {
  padding: '10px 18px',
  backgroundColor: '#1f2937',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
};

const formGroupStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyles: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#f9fafb',
};

const bankCodeNoticeStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  fontSize: '12px',
  color: '#4b5563',
  backgroundColor: '#f3f4f6',
  padding: '8px 12px',
  borderRadius: '6px',
};

const verifyBtnStyles: React.CSSProperties = {
  padding: '0 16px',
  backgroundColor: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const fieldHelpStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
};

const cancelBtnStyles: React.CSSProperties = {
  padding: '10px 18px',
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  color: '#374151',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
};

const saveBtnStyles: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(255, 122, 0, 0.25)',
};
