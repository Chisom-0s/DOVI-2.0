import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { PaymentAccount, PaymentAccountType, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';

const COMMON_BANKS = [
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'OPay Digital Services',
  'PalmPay',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'United Bank for Africa (UBA)',
  'Wema Bank',
  'Zenith Bank',
  'Other / Custom Bank',
];

export default function PaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [selectedType, setSelectedType] = useState<PaymentAccountType>('save2own');

  // Form fields
  const [bankName, setBankName] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.listPaymentAccounts();
      setAccounts(data);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load payment accounts.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateModal = (type: PaymentAccountType) => {
    setEditingAccount(null);
    setSelectedType(type);
    setBankName(type === 'save2own' ? 'Kuda Microfinance Bank' : 'Zenith Bank');
    setCustomBankName('');
    setAccountName(type === 'save2own' ? 'Dovi Save2Own Savings Trust' : 'Dovi Commerce Limited');
    setAccountNumber('');
    setCurrency('NGN');
    setInstructions(
      type === 'save2own'
        ? 'Transfer your contribution amount to this dedicated Save2Own account. In the narration/description, include your Save2Own Reference code.'
        : 'For direct marketplace checkout bank transfers, transfer to this account and use your Order Reference Code (e.g. ORD-XXXX) as narration.'
    );
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (acc: PaymentAccount) => {
    setEditingAccount(acc);
    setSelectedType(acc.account_type);
    if (COMMON_BANKS.includes(acc.bank_name)) {
      setBankName(acc.bank_name);
      setCustomBankName('');
    } else {
      setBankName('Other / Custom Bank');
      setCustomBankName(acc.bank_name);
    }
    setAccountName(acc.account_name);
    setAccountNumber(acc.account_number);
    setCurrency(acc.currency || 'NGN');
    setInstructions(acc.instructions || '');
    setIsActive(acc.is_active);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBank = bankName === 'Other / Custom Bank' ? customBankName.trim() : bankName;
    if (!finalBank) {
      toast.error('Please specify a bank name.');
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 8) {
      toast.error('Please enter a valid account number.');
      return;
    }
    if (!accountName.trim()) {
      toast.error('Please enter an account name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAccount) {
        await adminApi.updatePaymentAccount(editingAccount.id, {
          account_type: selectedType,
          bank_name: finalBank,
          account_name: accountName.trim(),
          account_number: accountNumber.trim(),
          currency,
          instructions: instructions.trim(),
          is_active: isActive,
        });
        toast.success(`Updated ${selectedType === 'save2own' ? 'Save2Own' : 'Marketplace'} account successfully.`);
      } else {
        await adminApi.createPaymentAccount({
          account_type: selectedType,
          bank_name: finalBank,
          account_name: accountName.trim(),
          account_number: accountNumber.trim(),
          currency,
          instructions: instructions.trim(),
          is_active: isActive,
        });
        toast.success(`Created new ${selectedType === 'save2own' ? 'Save2Own' : 'Marketplace'} account.`);
      }
      setShowModal(false);
      await fetchAccounts(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivate = async (acc: PaymentAccount) => {
    try {
      if (acc.is_active) {
        await adminApi.deactivatePaymentAccount(acc.id);
        toast.success(`Deactivated ${acc.bank_name} account.`);
      } else {
        await adminApi.activatePaymentAccount(acc.id);
        toast.success(`Activated ${acc.bank_name} as active ${acc.account_type === 'save2own' ? 'Save2Own' : 'Marketplace'} account.`);
      }
      await fetchAccounts(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account status.');
    }
  };

  const handleDelete = async (acc: PaymentAccount) => {
    if (!window.confirm(`Are you sure you want to remove ${acc.bank_name} (${acc.account_number})?`)) return;
    try {
      await adminApi.deletePaymentAccount(acc.id);
      toast.success('Account removed.');
      await fetchAccounts(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const save2ownAccounts = accounts.filter((a) => a.account_type === 'save2own');
  const marketplaceAccounts = accounts.filter((a) => a.account_type === 'marketplace');

  const activeSave2Own = save2ownAccounts.find((a) => a.is_active) || save2ownAccounts[0];
  const activeMarketplace = marketplaceAccounts.find((a) => a.is_active) || marketplaceAccounts[0];

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <div style={titleHeaderStyles}>
          <h2 style={titleStyles}>Payment Accounts Management</h2>
          <span style={portalBadgeStyles}>Configuration</span>
        </div>
        <Skeleton width="100%" height="240px" borderRadius="12px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="240px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={titleHeaderStyles}>
        <div>
          <h2 style={titleStyles}>Payment Accounts Management</h2>
          <p style={subtitleStyles}>
            Configure and manage segregated business bank accounts for <strong>Save2Own Savings</strong> and <strong>Normal Marketplace Checkout</strong>.
          </p>
        </div>
        <span style={portalBadgeStyles}>Financial Accounts</span>
      </div>

      <ApiErrorMessage error={error} />

      {/* Security Architecture Notice */}
      <div style={complianceNoticeStyles}>
        🔒 <strong>Separation Policy:</strong> Save2Own contributions use a dedicated savings bank account. Normal marketplace purchases use the separate marketplace account. Modifications to one account type never impact the other.
      </div>

      <div style={sectionsGridStyles}>
        {/* ========================================================
            SECTION 1: SAVE2OWN DEDICATED ACCOUNT
            ======================================================== */}
        <div style={accountCardStyles}>
          <div style={cardHeaderRowStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎯</span>
              <div>
                <h3 style={cardTitleStyles}>SAVE2OWN ACCOUNT</h3>
                <span style={typeTagStyles}>Used Exclusively for Save2Own Contributions</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('save2own')}
              style={primaryActionBtnStyles}
            >
              + Add Save2Own Account
            </button>
          </div>

          {/* Active Highlight Spotlight */}
          {activeSave2Own ? (
            <div style={spotlightCardStyles(true)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={activeBadgeStyles(activeSave2Own.is_active)}>
                  {activeSave2Own.is_active ? '● LIVE ACTIVE ACCOUNT' : '○ INACTIVE'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => openEditModal(activeSave2Own)}
                    style={editBtnStyles}
                  >
                    ✏️ Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActivate(activeSave2Own)}
                    style={activeSave2Own.is_active ? deactivateBtnStyles : activateBtnStyles}
                  >
                    {activeSave2Own.is_active ? 'Deactivate' : 'Set as Active'}
                  </button>
                </div>
              </div>

              <div style={detailsGridStyles}>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Bank Name</span>
                  <strong style={detailValueStyles}>{activeSave2Own.bank_name}</strong>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Account Name</span>
                  <strong style={detailValueStyles}>{activeSave2Own.account_name}</strong>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Account Number</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ ...detailValueStyles, fontSize: '16px', letterSpacing: '1px' }}>
                      {activeSave2Own.account_number}
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeSave2Own.account_number, 'Save2Own Account Number')}
                      style={copyMiniBtnStyles}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Currency</span>
                  <strong style={detailValueStyles}>{activeSave2Own.currency || 'NGN'}</strong>
                </div>
              </div>

              {activeSave2Own.instructions && (
                <div style={instructionsBoxStyles}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff7a00', textTransform: 'uppercase' }}>
                    Transfer Instructions Shown to Buyers:
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563', lineHeight: 1.4 }}>
                    {activeSave2Own.instructions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '16px 0' }}>No Save2Own bank account configured yet.</p>
          )}

          {/* Account History / List */}
          {save2ownAccounts.length > 1 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={subHeaderStyles}>Configured Save2Own Accounts ({save2ownAccounts.length})</h4>
              <div style={tableWrapperStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={tableHeaderCellStyles}>Bank</th>
                      <th style={tableHeaderCellStyles}>Account Name</th>
                      <th style={tableHeaderCellStyles}>Number</th>
                      <th style={tableHeaderCellStyles}>Status</th>
                      <th style={{ ...tableHeaderCellStyles, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {save2ownAccounts.map((acc) => (
                      <tr key={acc.id} style={tableRowStyles}>
                        <td style={tableCellStyles}><strong>{acc.bank_name}</strong></td>
                        <td style={tableCellStyles}>{acc.account_name}</td>
                        <td style={tableCellStyles}>{acc.account_number}</td>
                        <td style={tableCellStyles}>
                          <span style={activeBadgeStyles(acc.is_active)}>
                            {acc.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyles, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => openEditModal(acc)} style={editBtnStyles}>
                              Edit
                            </button>
                            {!acc.is_active && (
                              <button type="button" onClick={() => handleToggleActivate(acc)} style={activateBtnStyles}>
                                Activate
                              </button>
                            )}
                            <button type="button" onClick={() => handleDelete(acc)} style={deleteBtnStyles}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            SECTION 2: NORMAL MARKETPLACE ACCOUNT
            ======================================================== */}
        <div style={accountCardStyles}>
          <div style={cardHeaderRowStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🛒</span>
              <div>
                <h3 style={cardTitleStyles}>NORMAL MARKETPLACE ACCOUNT</h3>
                <span style={typeTagStyles}>Used for Direct Orders &amp; Marketplace Checkout</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('marketplace')}
              style={primaryActionBtnStyles}
            >
              + Add Marketplace Account
            </button>
          </div>

          {/* Active Highlight Spotlight */}
          {activeMarketplace ? (
            <div style={spotlightCardStyles(false)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={activeBadgeStyles(activeMarketplace.is_active)}>
                  {activeMarketplace.is_active ? '● LIVE ACTIVE ACCOUNT' : '○ INACTIVE'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => openEditModal(activeMarketplace)}
                    style={editBtnStyles}
                  >
                    ✏️ Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActivate(activeMarketplace)}
                    style={activeMarketplace.is_active ? deactivateBtnStyles : activateBtnStyles}
                  >
                    {activeMarketplace.is_active ? 'Deactivate' : 'Set as Active'}
                  </button>
                </div>
              </div>

              <div style={detailsGridStyles}>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Bank Name</span>
                  <strong style={detailValueStyles}>{activeMarketplace.bank_name}</strong>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Account Name</span>
                  <strong style={detailValueStyles}>{activeMarketplace.account_name}</strong>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Account Number</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ ...detailValueStyles, fontSize: '16px', letterSpacing: '1px' }}>
                      {activeMarketplace.account_number}
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeMarketplace.account_number, 'Marketplace Account Number')}
                      style={copyMiniBtnStyles}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Currency</span>
                  <strong style={detailValueStyles}>{activeMarketplace.currency || 'NGN'}</strong>
                </div>
              </div>

              {activeMarketplace.instructions && (
                <div style={instructionsBoxStyles}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>
                    Transfer Instructions Shown to Buyers:
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563', lineHeight: 1.4 }}>
                    {activeMarketplace.instructions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '16px 0' }}>No marketplace bank account configured yet.</p>
          )}

          {/* Account History / List */}
          {marketplaceAccounts.length > 1 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={subHeaderStyles}>Configured Marketplace Accounts ({marketplaceAccounts.length})</h4>
              <div style={tableWrapperStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={tableHeaderCellStyles}>Bank</th>
                      <th style={tableHeaderCellStyles}>Account Name</th>
                      <th style={tableHeaderCellStyles}>Number</th>
                      <th style={tableHeaderCellStyles}>Status</th>
                      <th style={{ ...tableHeaderCellStyles, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketplaceAccounts.map((acc) => (
                      <tr key={acc.id} style={tableRowStyles}>
                        <td style={tableCellStyles}><strong>{acc.bank_name}</strong></td>
                        <td style={tableCellStyles}>{acc.account_name}</td>
                        <td style={tableCellStyles}>{acc.account_number}</td>
                        <td style={tableCellStyles}>
                          <span style={activeBadgeStyles(acc.is_active)}>
                            {acc.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyles, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => openEditModal(acc)} style={editBtnStyles}>
                              Edit
                            </button>
                            {!acc.is_active && (
                              <button type="button" onClick={() => handleToggleActivate(acc)} style={activateBtnStyles}>
                                Activate
                              </button>
                            )}
                            <button type="button" onClick={() => handleDelete(acc)} style={deleteBtnStyles}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL: Create / Edit Payment Account
          ======================================================== */}
      {showModal && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ ...modalTitleStyles, margin: 0, padding: 0, border: 'none' }}>
                {editingAccount ? 'Edit Payment Account' : 'Configure New Payment Account'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={formStyles}>
              <div>
                <label style={labelStyles}>Account Type *</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as PaymentAccountType)}
                  style={inputStyles}
                  disabled={Boolean(editingAccount)}
                >
                  <option value="save2own">Save2Own Dedicated Account</option>
                  <option value="marketplace">Normal Marketplace Account</option>
                </select>
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', display: 'block' }}>
                  {selectedType === 'save2own'
                    ? 'Targeted specifically for customer Save2Own savings contributions.'
                    : 'Targeted for ordinary direct marketplace checkouts and store orders.'}
                </span>
              </div>

              <div>
                <label style={labelStyles}>Bank Name *</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={inputStyles}
                >
                  {COMMON_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {bankName === 'Other / Custom Bank' && (
                <div>
                  <label style={labelStyles}>Custom Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full bank or fintech name"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    style={inputStyles}
                  />
                </div>
              )}

              <div>
                <label style={labelStyles}>Account Name / Beneficiary Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dovi Save2Own Savings Trust"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  style={inputStyles}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyles}>Account Number (NUBAN) *</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="10 digit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    style={inputStyles}
                  />
                </div>
                <div>
                  <label style={labelStyles}>Currency</label>
                  <input
                    type="text"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    style={inputStyles}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyles}>Transfer Instructions / Narration Note</label>
                <textarea
                  rows={3}
                  placeholder="Instructions displayed to customers on transfer screen..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  style={textareaStyles}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  id="acc_is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="acc_is_active" style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', cursor: 'pointer' }}>
                  Set as Active Account for {selectedType === 'save2own' ? 'Save2Own' : 'Marketplace'}
                </label>
              </div>

              <div style={modalActionsStyles}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  style={modalCancelBtnStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={modalSubmitBtnStyles}
                >
                  {isSubmitting ? 'Saving Account...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
  gap: '20px',
};

const titleHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '12px',
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

const portalBadgeStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: '#ff7a00',
  padding: '4px 10px',
  borderRadius: '9999px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const complianceNoticeStyles: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '13px',
  color: '#1e40af',
  lineHeight: 1.4,
};

const sectionsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
  gap: '24px',
};

const accountCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
};

const cardHeaderRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  flexWrap: 'wrap',
  gap: '12px',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#111827',
  margin: 0,
  letterSpacing: '-0.3px',
};

const typeTagStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
};

const spotlightCardStyles = (isSave2Own: boolean): React.CSSProperties => ({
  backgroundColor: isSave2Own ? 'rgba(255, 122, 0, 0.03)' : '#f8fafc',
  border: `2px solid ${isSave2Own ? 'rgba(255, 122, 0, 0.25)' : '#cbd5e1'}`,
  borderRadius: '10px',
  padding: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

const activeBadgeStyles = (isActive: boolean): React.CSSProperties => ({
  fontSize: '10px',
  fontWeight: 800,
  padding: '3px 8px',
  borderRadius: '4px',
  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : '#f3f4f6',
  color: isActive ? '#059669' : '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const detailsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px',
};

const detailItemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const detailLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  textTransform: 'uppercase',
  fontWeight: 600,
};

const detailValueStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#111827',
  fontWeight: 700,
};

const instructionsBoxStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '10px 12px',
  marginTop: '4px',
};

const subHeaderStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#4b5563',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const primaryActionBtnStyles: React.CSSProperties = {
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  padding: '8px 14px',
  borderRadius: '9999px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
};

const editBtnStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
};

const activateBtnStyles: React.CSSProperties = {
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  color: '#059669',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
};

const deactivateBtnStyles: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  color: '#dc2626',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
};

const deleteBtnStyles: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '11px',
  cursor: 'pointer',
};

const copyMiniBtnStyles: React.CSSProperties = {
  padding: '2px 6px',
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  cursor: 'pointer',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '12px',
};

const tableHeaderRowStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '8px 12px',
  fontWeight: 700,
  color: '#4b5563',
  fontSize: '11px',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
};

const tableCellStyles: React.CSSProperties = {
  padding: '8px 12px',
  color: '#1f2937',
};

const modalBackdropStyles: React.CSSProperties = {
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
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '480px',
  padding: '24px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#111827',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const textareaStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const modalActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '8px',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '9999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  cursor: 'pointer',
};

const modalSubmitBtnStyles: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: '9999px',
  border: 'none',
  backgroundColor: '#ff7a00',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffffff',
  cursor: 'pointer',
};
