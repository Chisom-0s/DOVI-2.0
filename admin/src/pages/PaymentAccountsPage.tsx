import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { PaymentAccount, PaymentAccountType, PaymentAccountAuditLog, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';

export default function PaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Edit / Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);

  // Form State
  const [accountType, setAccountType] = useState<PaymentAccountType>('marketplace');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [changeReason, setChangeReason] = useState('');

  // Audit Log State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<PaymentAccountAuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditFilterType, setAuditFilterType] = useState<'all' | 'marketplace' | 'save2own'>('all');

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

  const fetchAuditLogs = async (filter = auditFilterType) => {
    setIsLoadingAuditLogs(true);
    try {
      const res = await adminApi.listPaymentAccountAuditLogs({
        account_type: filter !== 'all' ? filter : undefined,
      });
      // Handle array or paginated response
      const results = Array.isArray(res) ? res : (res as any)?.results || [];
      setAuditLogs(results);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load audit logs.');
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const marketplaceAccounts = accounts.filter((a) => a.account_type === 'marketplace');
  const save2ownAccounts = accounts.filter((a) => a.account_type === 'save2own');

  const activeMarketplace = marketplaceAccounts.find((a) => a.is_active);
  const activeSave2Own = save2ownAccounts.find((a) => a.is_active);

  const openCreateModal = (type: PaymentAccountType) => {
    setModalMode('create');
    setSelectedAccount(null);
    setAccountType(type);
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setCurrency('NGN');
    setInstructions('');
    setChangeReason('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (acc: PaymentAccount) => {
    setModalMode('edit');
    setSelectedAccount(acc);
    setAccountType(acc.account_type);
    setBankName(acc.bank_name);
    setAccountName(acc.account_name);
    setAccountNumber(acc.account_number);
    setCurrency(acc.currency || 'NGN');
    setInstructions(acc.instructions || '');
    setChangeReason('');
    setIsActive(acc.is_active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      toast.error('Please fill in bank name, account name, and account number.');
      return;
    }

    setIsActionPending(true);
    try {
      const payload: any = {
        account_type: accountType,
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        currency: currency.trim() || 'NGN',
        instructions: instructions.trim(),
        is_active: isActive,
      };
      if (changeReason.trim()) {
        payload.reason = changeReason.trim();
      }

      if (modalMode === 'create') {
        await adminApi.createPaymentAccount(payload);
        toast.success(`${accountType === 'save2own' ? 'Save2Own' : 'Marketplace'} payment account created successfully!`);
      } else if (selectedAccount) {
        await adminApi.updatePaymentAccount(selectedAccount.id, payload);
        toast.success('Payment account updated successfully! Historical snapshot preserved.');
      }

      setShowModal(false);
      await fetchAccounts(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment account.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleToggleActive = async (acc: PaymentAccount) => {
    setIsActionPending(true);
    try {
      if (acc.is_active) {
        await adminApi.deactivatePaymentAccount(acc.id);
        toast.success(`${acc.bank_name} deactivated.`);
      } else {
        await adminApi.activatePaymentAccount(acc.id);
        toast.success(`${acc.bank_name} activated as current ${acc.account_type === 'save2own' ? 'Save2Own' : 'Marketplace'} account!`);
      }
      await fetchAccounts(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account status.');
    } finally {
      setIsActionPending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={pageContainerStyles}>
        <Skeleton width="220px" height="32px" />
        <Skeleton width="380px" height="18px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
          <Skeleton height="320px" borderRadius="12px" />
          <Skeleton height="320px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={pageTitleStyles}>Payment Accounts Configuration</h1>
          <p style={pageSubtitleStyles}>
            Manage dedicated business bank accounts. Save2Own contributions and Marketplace orders use strictly separated bank accounts.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              setShowAuditModal(true);
              fetchAuditLogs(auditFilterType);
            }}
            style={btnAuditStyles}
          >
            📜 Audit Trail History
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* Two Columns / Cards for Account Types */}
      <div style={gridContainerStyles}>
        {/* CARD 1: Normal Marketplace Account */}
        <div style={cardWrapperStyles}>
          <div style={cardHeaderStyles}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🛒</span>
                <h2 style={cardTitleStyles}>Normal Marketplace Account</h2>
              </div>
              <span style={cardSubtitleStyles}>Used for standard direct marketplace purchases &amp; checkout</span>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('marketplace')}
              style={actionBtnSecondaryStyles}
            >
              + Add Account
            </button>
          </div>

          {activeMarketplace ? (
            <div style={activeBoxStyles}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={badgeActiveStyles}>● Active Business Account</span>
                  <div style={{ marginTop: '8px' }}>
                    <div style={detailRowStyles}>
                      <span style={detailLabelStyles}>Bank Name:</span>
                      <strong style={detailValueStyles}>{activeMarketplace.bank_name}</strong>
                    </div>
                    <div style={detailRowStyles}>
                      <span style={detailLabelStyles}>Account Name:</span>
                      <strong style={detailValueStyles}>{activeMarketplace.account_name}</strong>
                    </div>
                    <div style={detailRowStyles}>
                      <span style={detailLabelStyles}>Account Number:</span>
                      <strong style={{ ...detailValueStyles, fontSize: '18px', color: '#ff7a00', fontFamily: 'monospace' }}>
                        {activeMarketplace.account_number}
                      </strong>
                    </div>
                    <div style={detailRowStyles}>
                      <span style={detailLabelStyles}>Currency:</span>
                      <span style={detailValueStyles}>{activeMarketplace.currency}</span>
                    </div>
                    {activeMarketplace.instructions && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '12px', color: '#4b5563' }}>
                        📌 <strong>Instructions:</strong> {activeMarketplace.instructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={accountActionsRowStyles}>
                <button
                  type="button"
                  onClick={() => openEditModal(activeMarketplace)}
                  style={btnEditStyles}
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => handleToggleActive(activeMarketplace)}
                  style={btnDeactivateStyles}
                >
                  Deactivate
                </button>
              </div>
            </div>
          ) : (
            <div style={noActiveBoxStyles}>
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }}>⚠️ No active Marketplace bank account configured.</p>
              <button
                type="button"
                onClick={() => openCreateModal('marketplace')}
                style={{ ...actionBtnSecondaryStyles, marginTop: '12px' }}
              >
                Configure Active Account
              </button>
            </div>
          )}

          {/* Previous / Inactive Marketplace Accounts */}
          {marketplaceAccounts.filter((a) => !a.is_active).length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <span style={sectionSubheaderStyles}>Other / Previous Accounts</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {marketplaceAccounts
                  .filter((a) => !a.is_active)
                  .map((acc) => (
                    <div key={acc.id} style={historyRowStyles}>
                      <div>
                        <strong>{acc.bank_name}</strong> — {acc.account_number}
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{acc.account_name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(acc)}
                          disabled={isActionPending}
                          style={btnActivateStyles}
                        >
                          Set Active
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(acc)}
                          style={btnSmallEditStyles}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: Save2Own Account */}
        <div style={cardWrapperStyles}>
          <div style={cardHeaderStyles}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <h2 style={cardTitleStyles}>Dedicated Save2Own Account</h2>
              </div>
              <span style={cardSubtitleStyles}>Strictly reserved for Save2Own customer deposits &amp; installments</span>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('save2own')}
              style={actionBtnSecondaryStyles}
            >
              + Add Account
            </button>
          </div>

          {activeSave2Own ? (
            <div style={{ ...activeBoxStyles, borderColor: 'rgba(255, 122, 0, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ ...badgeActiveStyles, backgroundColor: 'rgba(255, 122, 0, 0.12)', color: '#ff7a00' }}>
                    ● Active Save2Own Account
                  </span>
                  <div style={{ marginTop: '8px' }}>
                    <div style={detailRowStyles}>
                      <span style={detailLabelStyles}>Bank Name:</span>
                      <strong style={detailValueStyles}>{activeSave2Own.bank_name}</strong>
                    </div>
                    <div style={detailRowStyles}>
                      <span style={detailLabelStyles}>Account Name:</span>
                      <strong style={detailValueStyles}>{activeSave2Own.account_name}</strong>
                    </div>
                    <div style={detailRowStyles}>
                      <span style={detailLabelStyles}>Account Number:</span>
                      <strong style={{ ...detailValueStyles, fontSize: '18px', color: '#ff7a00', fontFamily: 'monospace' }}>
                        {activeSave2Own.account_number}
                      </strong>
                    </div>
                    <div style={detailRowStyles}>
                      <span style={detailLabelStyles}>Currency:</span>
                      <span style={detailValueStyles}>{activeSave2Own.currency}</span>
                    </div>
                    {activeSave2Own.instructions && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fff7ed', borderRadius: '6px', fontSize: '12px', color: '#9a3412' }}>
                        📌 <strong>Instructions:</strong> {activeSave2Own.instructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={accountActionsRowStyles}>
                <button
                  type="button"
                  onClick={() => openEditModal(activeSave2Own)}
                  style={btnEditStyles}
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => handleToggleActive(activeSave2Own)}
                  style={btnDeactivateStyles}
                >
                  Deactivate
                </button>
              </div>
            </div>
          ) : (
            <div style={noActiveBoxStyles}>
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }}>⚠️ No active Save2Own bank account configured.</p>
              <button
                type="button"
                onClick={() => openCreateModal('save2own')}
                style={{ ...actionBtnSecondaryStyles, marginTop: '12px' }}
              >
                Configure Active Account
              </button>
            </div>
          )}

          {/* Previous / Inactive Save2Own Accounts */}
          {save2ownAccounts.filter((a) => !a.is_active).length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <span style={sectionSubheaderStyles}>Other / Previous Save2Own Accounts</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {save2ownAccounts
                  .filter((a) => !a.is_active)
                  .map((acc) => (
                    <div key={acc.id} style={historyRowStyles}>
                      <div>
                        <strong>{acc.bank_name}</strong> — {acc.account_number}
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{acc.account_name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(acc)}
                          disabled={isActionPending}
                          style={btnActivateStyles}
                        >
                          Set Active
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(acc)}
                          style={btnSmallEditStyles}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                {modalMode === 'create' ? 'Create Payment Account' : 'Edit Payment Account'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={formLabelStyles}>Account Purpose / Type *</label>
                <select
                  disabled={modalMode === 'edit'}
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as PaymentAccountType)}
                  style={formInputStyles}
                >
                  <option value="marketplace">Marketplace Account (Direct Sales / Orders)</option>
                  <option value="save2own">Save2Own Account (Goal Contributions Only)</option>
                </select>
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', display: 'block' }}>
                  {accountType === 'save2own'
                    ? '⚠️ This account will be shown exclusively on customer Save2Own contribution screens.'
                    : 'This account will be shown for normal direct commerce order checkouts.'}
                </span>
              </div>

              <div>
                <label style={formLabelStyles}>Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Bank, Access Bank, GTBank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={formInputStyles}
                />
              </div>

              <div>
                <label style={formLabelStyles}>Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DOVI COMMERCE LTD / DOVI SAVE2OWN"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  style={formInputStyles}
                />
              </div>

              <div>
                <label style={formLabelStyles}>Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1012345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={formInputStyles}
                />
              </div>

              <div>
                <label style={formLabelStyles}>Currency</label>
                <input
                  type="text"
                  placeholder="NGN"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={formInputStyles}
                />
              </div>

              <div>
                <label style={formLabelStyles}>Transfer Instructions</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please use your goal reference code in the narration to enable instant verification."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  style={{ ...formInputStyles, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={formLabelStyles}>Change Reason (Recorded in Audit Ledger)</label>
                <input
                  type="text"
                  placeholder="e.g. Switched to new primary collection account"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  style={formInputStyles}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActiveCheck" style={{ fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                  Set as currently active account for {accountType === 'save2own' ? 'Save2Own' : 'Marketplace'}
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={btnSecondaryStyles}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionPending}
                  style={btnPrimaryStyles}
                >
                  {isActionPending ? 'Saving...' : modalMode === 'create' ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT LOG MODAL */}
      {showAuditModal && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                  📜 Payment Accounts Audit Trail
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  Immutable log of all payment account creations, edits, activations, and deactivations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['all', 'marketplace', 'save2own'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setAuditFilterType(filter);
                    fetchAuditLogs(filter);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid #d1d5db',
                    backgroundColor: auditFilterType === filter ? '#111827' : '#ffffff',
                    color: auditFilterType === filter ? '#ffffff' : '#374151',
                  }}
                >
                  {filter === 'all' ? 'All Accounts' : filter === 'marketplace' ? 'Marketplace' : 'Save2Own'}
                </button>
              ))}
            </div>

            {/* Content Table / List */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {isLoadingAuditLogs ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton height="50px" borderRadius="8px" />
                  <Skeleton height="50px" borderRadius="8px" />
                  <Skeleton height="50px" borderRadius="8px" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: '#6b7280', fontSize: '13px' }}>
                  No audit logs recorded for this category.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor:
                                log.action.includes('CREATED') ? '#dcfce7'
                                : log.action.includes('SAVE2OWN') ? '#ffedd5'
                                : log.action.includes('ACTIVATED') ? '#d1fae5'
                                : log.action.includes('DEACTIVATED') ? '#fee2e2'
                                : '#e0e7ff',
                              color:
                                log.action.includes('CREATED') ? '#15803d'
                                : log.action.includes('SAVE2OWN') ? '#c2410c'
                                : log.action.includes('ACTIVATED') ? '#047857'
                                : log.action.includes('DEACTIVATED') ? '#b91c1c'
                                : '#4338ca',
                            }}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: log.account_type === 'save2own' ? '#ff7a00' : '#2563eb',
                            }}
                          >
                            {log.account_type === 'save2own' ? '🎯 Save2Own' : '🛒 Marketplace'}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', marginBottom: '4px' }}>
                        <span>
                          Admin: <strong>{log.admin_email || 'System / Superadmin'}</strong>
                        </span>
                        {log.ip_address && (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>IP: {log.ip_address}</span>
                        )}
                      </div>

                      {log.reason && (
                        <div style={{ marginTop: '4px', color: '#1f2937' }}>
                          <em>Reason: "{log.reason}"</em>
                        </div>
                      )}

                      {/* Snapshots diff */}
                      {(log.previous_data || log.new_data) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '11px' }}>
                          {log.previous_data && (
                            <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: '2px' }}>Previous State:</div>
                              <div>Bank: {log.previous_data.bank_name || 'N/A'}</div>
                              <div>Acc No: {log.previous_data.account_number || 'N/A'}</div>
                              <div>Acc Name: {log.previous_data.account_name || 'N/A'}</div>
                            </div>
                          )}
                          {log.new_data && (
                            <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontWeight: 600, color: '#16a34a', marginBottom: '2px' }}>New State:</div>
                              <div>Bank: {log.new_data.bank_name || 'N/A'}</div>
                              <div>Acc No: {log.new_data.account_number || 'N/A'}</div>
                              <div>Acc Name: {log.new_data.account_name || 'N/A'}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                style={btnSecondaryStyles}
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styles
// ----------------------------------------------------------
const pageContainerStyles: React.CSSProperties = {
  padding: '24px',
  maxWidth: '1280px',
  margin: '0 auto',
};

const pageTitleStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 6px 0',
};

const pageSubtitleStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  margin: 0,
};

const gridContainerStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
  gap: '24px',
};

const cardWrapperStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
};

const cardHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '1px solid #f3f4f6',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 700,
  color: '#111827',
  margin: 0,
};

const cardSubtitleStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '2px',
  display: 'block',
};

const actionBtnSecondaryStyles: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
};

const activeBoxStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: '10px',
  border: '1.5px solid #d1d5db',
  padding: '18px',
};

const noActiveBoxStyles: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  borderRadius: '10px',
  border: '1px dashed #ef4444',
  padding: '24px',
  textAlign: 'center',
};

const badgeActiveStyles: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(16, 185, 129, 0.12)',
  color: '#059669',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
};

const detailRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  borderBottom: '1px solid #f3f4f6',
};

const detailLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
};

const detailValueStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#111827',
};

const accountActionsRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '16px',
  paddingTop: '12px',
  borderTop: '1px solid #e5e7eb',
};

const btnEditStyles: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
};

const btnDeactivateStyles: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  color: '#dc2626',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  cursor: 'pointer',
};

const sectionSubheaderStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const historyRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: '6px',
  backgroundColor: '#f9fafb',
  border: '1px solid #f3f4f6',
  fontSize: '13px',
};

const btnActivateStyles: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '4px',
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const btnSmallEditStyles: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '11px',
  fontWeight: 500,
  borderRadius: '4px',
  backgroundColor: '#ffffff',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
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
  zIndex: 1000,
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '480px',
  padding: '24px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const formLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
};

const formInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  boxSizing: 'border-box',
};

const btnPrimaryStyles: React.CSSProperties = {
  padding: '8px 18px',
  fontSize: '13px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const btnSecondaryStyles: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '13px',
  fontWeight: 500,
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
};

const btnAuditStyles: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: '#111827',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};
