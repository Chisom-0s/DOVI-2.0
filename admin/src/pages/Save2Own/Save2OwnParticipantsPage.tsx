import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type {
  AdminSave2OwnParticipant,
  Save2OwnUnlockConfig,
  Save2OwnIdentityAuditLog,
  Save2OwnUnlockCode,
  APIError,
} from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function Save2OwnParticipantsPage() {
  const [participants, setParticipants] = useState<AdminSave2OwnParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lockFilter, setLockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal / Drawer State
  const [selectedParticipant, setSelectedParticipant] = useState<AdminSave2OwnParticipant | null>(null);
  const [participantHistory, setParticipantHistory] = useState<{
    audit_logs: Save2OwnIdentityAuditLog[];
    unlock_codes: Save2OwnUnlockCode[];
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'history' | 'codes'>('details');

  // Generate Unlock Code Modal
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false);
  const [generateTargetParticipant, setGenerateTargetParticipant] = useState<AdminSave2OwnParticipant | null>(null);
  const [codeFeeAmount, setCodeFeeAmount] = useState('5000');
  const [codeExpiresHours, setCodeExpiresHours] = useState(24);
  const [generatedCodeResult, setGeneratedCodeResult] = useState<{
    code: string;
    fee_amount: string;
    expires_at: string;
  } | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Unlock Fee Config Modal
  const [showFeeConfigModal, setShowFeeConfigModal] = useState(false);
  const [unlockConfig, setUnlockConfig] = useState<Save2OwnUnlockConfig | null>(null);
  const [newFeeAmount, setNewFeeAmount] = useState('');
  const [feeChangeReason, setFeeChangeReason] = useState('');
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const fetchParticipants = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listSave2OwnParticipants({
        page,
        q: searchTerm || undefined,
        status: statusFilter || undefined,
        identity_locked: lockFilter || undefined,
      });
      setParticipants(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load Save2Own participants.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [page, statusFilter, lockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchParticipants(true);
  };

  const handleOpenParticipantDetails = async (p: AdminSave2OwnParticipant) => {
    setSelectedParticipant(p);
    setActiveDetailTab('details');
    setIsLoadingHistory(true);
    try {
      const hist = await adminApi.getSave2OwnParticipantHistory(p.id);
      setParticipantHistory({
        audit_logs: hist.audit_logs || [],
        unlock_codes: hist.unlock_codes || [],
      });
    } catch {
      toast.error('Could not load participant audit logs.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLockParticipant = async (p: AdminSave2OwnParticipant) => {
    setIsActionPending(true);
    try {
      const updated = await adminApi.lockSave2OwnParticipant(p.id);
      toast.success(`Identity locked for ${p.full_name}.`);
      setParticipants((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
      if (selectedParticipant?.id === p.id) {
        setSelectedParticipant(updated);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to lock participant identity.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleUnlockParticipant = async (p: AdminSave2OwnParticipant) => {
    const hours = window.prompt('Direct unlock: How many hours should editing remain open?', '24');
    if (!hours) return;

    setIsActionPending(true);
    try {
      const updated = await adminApi.unlockSave2OwnParticipant(p.id, parseInt(hours, 10) || 24);
      toast.success(`Identity directly unlocked for ${p.full_name} for ${hours}h.`);
      setParticipants((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
      if (selectedParticipant?.id === p.id) {
        setSelectedParticipant(updated);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to unlock participant identity.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleOpenGenerateCode = (p: AdminSave2OwnParticipant) => {
    setGenerateTargetParticipant(p);
    setGeneratedCodeResult(null);
    setCodeFeeAmount(unlockConfig?.fee_amount || '5000');
    setCodeExpiresHours(24);
    setShowGenerateCodeModal(true);
  };

  const handleGenerateCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateTargetParticipant) return;

    setIsGeneratingCode(true);
    try {
      const res = await adminApi.generateSave2OwnUnlockCode(generateTargetParticipant.id, {
        fee_amount: codeFeeAmount,
        expires_hours: codeExpiresHours,
      });
      setGeneratedCodeResult({
        code: res.code,
        fee_amount: res.fee_amount,
        expires_at: res.expires_at,
      });
      toast.success(`Unlock code ${res.code} generated successfully!`);
      // Refresh history if drawer is open
      if (selectedParticipant?.id === generateTargetParticipant.id) {
        const hist = await adminApi.getSave2OwnParticipantHistory(generateTargetParticipant.id);
        setParticipantHistory({
          audit_logs: hist.audit_logs || [],
          unlock_codes: hist.unlock_codes || [],
        });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate unlock code.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleOpenFeeConfig = async () => {
    setShowFeeConfigModal(true);
    try {
      const cfg = await adminApi.getSave2OwnUnlockFee();
      setUnlockConfig(cfg);
      setNewFeeAmount(cfg.fee_amount);
      setFeeChangeReason('');
    } catch {
      toast.error('Failed to load unlock fee configuration.');
    }
  };

  const handleUpdateFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeAmount || parseFloat(newFeeAmount) < 0) {
      toast.error('Please enter a valid non-negative fee amount.');
      return;
    }

    setIsUpdatingFee(true);
    try {
      const res = await adminApi.updateSave2OwnUnlockFee({
        fee_amount: newFeeAmount,
        reason: feeChangeReason.trim(),
      });
      toast.success(res.message || 'Unlock fee configuration updated.');
      const updatedCfg = await adminApi.getSave2OwnUnlockFee();
      setUnlockConfig(updatedCfg);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update unlock fee.');
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const formatCurrency = (val: any) => {
    const num = parseFloat(String(val || '0'));
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(isNaN(num) ? 0 : num);
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Save2Own Participants &amp; Identity Ledger</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="320px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ ...titleStyles, margin: '0 0 4px 0' }}>Save2Own Participants &amp; Identity Control</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            Permanent customer identity ledger, anti-fraud selfie records, and administrative unlock authorizations.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleOpenFeeConfig}
            style={btnSecondaryStyles}
          >
            ⚙️ Configure Unlock Fee
          </button>
          <a
            href={adminApi.exportSave2OwnParticipantsCsvUrl({
              q: searchTerm || undefined,
              status: statusFilter || undefined,
              identity_locked: lockFilter || undefined,
            })}
            target="_blank"
            rel="noreferrer"
            style={btnSecondaryStyles}
          >
            📥 Export CSV
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <Link
          to="/save2own/dashboard"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          📊 Dashboard
        </Link>
        <Link
          to="/save2own"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          🎯 All Goals
        </Link>
        <Link
          to="/save2own/contributions"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          🏦 Contributions Verification
        </Link>
        <span style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, backgroundColor: '#ff7a00', color: '#ffffff' }}>
          👥 Participants &amp; Identity Ledger
        </span>
        <Link
          to="/save2own/refunds"
          style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', textDecoration: 'none' }}
        >
          💸 Refunds
        </Link>
      </div>

      <ApiErrorMessage error={error} />

      {/* Search & Filter Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by customer name, email, phone, goal ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Search</button>
        </form>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={filterWrapperStyles}>
            <label style={filterLabelStyles}>Goal Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={selectStyles}
            >
              <option value="">All States</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PAYMENT_REVIEW">Payment Review</option>
              <option value="PRICE_CHANGED">Price Shifted</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div style={filterWrapperStyles}>
            <label style={filterLabelStyles}>Identity Lock:</label>
            <select
              value={lockFilter}
              onChange={(e) => {
                setLockFilter(e.target.value);
                setPage(1);
              }}
              style={selectStyles}
            >
              <option value="">All</option>
              <option value="true">🔒 Locked Only</option>
              <option value="false">🔓 Unlocked / Editing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      {participants.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Participants Found"
          subtitle="No registered Save2Own customer identity records match your current filters."
        />
      ) : (
        <div style={tableContainerStyles}>
          <table style={tableStyles}>
            <thead>
              <tr style={tableHeaderRowStyles}>
                <th style={thStyles}>Participant</th>
                <th style={thStyles}>Contact</th>
                <th style={thStyles}>Location</th>
                <th style={thStyles}>Product / Goal Ref</th>
                <th style={thStyles}>Financial Progress</th>
                <th style={thStyles}>Identity Lock</th>
                <th style={thStyles}>Registered Date</th>
                <th style={{ ...thStyles, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} style={tableRowStyles}>
                  {/* Participant Name & Selfie Avatar */}
                  <td style={tdStyles}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {p.selfie_url ? (
                        <img
                          src={p.selfie_url}
                          alt={p.full_name}
                          style={selfieAvatarStyles}
                          onClick={() => handleOpenParticipantDetails(p)}
                        />
                      ) : (
                        <div style={selfiePlaceholderStyles}>
                          {p.full_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '13px' }}>
                          {p.full_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {p.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={tdStyles}>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{p.phone}</div>
                    <div style={{ fontSize: '11px', color: '#059669' }}>WA: {p.whatsapp_number}</div>
                  </td>

                  {/* Location */}
                  <td style={tdStyles}>
                    <div style={{ fontSize: '12px' }}>{p.city}, {p.state}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{p.country}</div>
                  </td>

                  {/* Product & Goal Reference */}
                  <td style={tdStyles}>
                    <Link
                      to={`/save2own/${p.goal_id}`}
                      style={{ fontSize: '12px', fontWeight: 700, color: '#ff7a00', textDecoration: 'none' }}
                    >
                      {p.product_name}
                    </Link>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                      Ref: {p.goal_reference}
                    </div>
                  </td>

                  {/* Financial Progress */}
                  <td style={tdStyles}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                      <span>{formatCurrency(p.saved_amount)}</span>
                      <strong style={{ color: '#ff7a00' }}>{p.progress_percent}%</strong>
                    </div>
                    <div style={progressBarTrackStyles}>
                      <div style={{ ...progressBarFillStyles, width: `${Math.min(100, p.progress_percent)}%` }} />
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                      Target: {formatCurrency(p.target_amount)}
                    </div>
                  </td>

                  {/* Identity Lock Status */}
                  <td style={tdStyles}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: p.identity_locked ? '#f1f5f9' : '#dcfce7',
                        color: p.identity_locked ? '#475569' : '#15803d',
                      }}
                    >
                      {p.identity_locked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
                    </span>
                  </td>

                  {/* Created At */}
                  <td style={tdStyles}>
                    <div style={{ fontSize: '11px', color: '#4b5563' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ ...tdStyles, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenParticipantDetails(p)}
                        style={actionSmallBtnStyles}
                        title="View Full Profile & Audit History"
                      >
                        👁️ Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenGenerateCode(p)}
                        style={{ ...actionSmallBtnStyles, backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }}
                        title="Generate One-Time Unlock Code"
                      >
                        🔑 Code
                      </button>
                      {p.identity_locked ? (
                        <button
                          type="button"
                          onClick={() => handleUnlockParticipant(p)}
                          style={{ ...actionSmallBtnStyles, backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                          title="Direct Unlock for 24h"
                        >
                          🔓 Unlock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLockParticipant(p)}
                          style={{ ...actionSmallBtnStyles, backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
                          title="Immediately Lock Identity"
                        >
                          🔒 Lock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationWrapperStyles}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={pageBtnStyles}
          >
            Previous
          </button>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={pageBtnStyles}
          >
            Next
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: Participant Full Details & Audit History Drawer
          ---------------------------------------------------------- */}
      {selectedParticipant && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Save2Own Participant Audit Record</h3>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Participant ID: {selectedParticipant.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {/* Top Participant Summary Card */}
            <div style={{ display: 'flex', gap: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px', flexWrap: 'wrap' }}>
              {/* Selfie Image */}
              <div style={{ flexShrink: 0 }}>
                {selectedParticipant.selfie_url ? (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={selectedParticipant.selfie_url}
                      alt={selectedParticipant.full_name}
                      style={{ width: '110px', height: '110px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #cbd5e1' }}
                    />
                    <a
                      href={selectedParticipant.selfie_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'block', fontSize: '11px', color: '#ff7a00', marginTop: '4px', textDecoration: 'none' }}
                    >
                      View Original ↗
                    </a>
                  </div>
                ) : (
                  <div style={{ width: '110px', height: '110px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    No Photo
                  </div>
                )}
              </div>

              {/* Identity Details */}
              <div style={{ flex: 1, minWidth: '240px', fontSize: '12px', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedParticipant.full_name}
                  </h4>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: selectedParticipant.identity_locked ? '#f1f5f9' : '#dcfce7',
                      color: selectedParticipant.identity_locked ? '#475569' : '#15803d',
                    }}
                  >
                    {selectedParticipant.identity_locked ? '🔒 LOCKED' : '🔓 EDIT WINDOW OPEN'}
                  </span>
                </div>

                <div style={{ color: '#475569' }}><strong>Email:</strong> {selectedParticipant.email}</div>
                <div style={{ color: '#475569' }}><strong>Phone / WA:</strong> {selectedParticipant.phone} / {selectedParticipant.whatsapp_number}</div>
                <div style={{ color: '#475569' }}><strong>Address:</strong> {selectedParticipant.address}, {selectedParticipant.city}, {selectedParticipant.state}, {selectedParticipant.country}</div>
                <div style={{ color: '#475569' }}>
                  <strong>Goal:</strong> {selectedParticipant.product_name} (Ref: {selectedParticipant.goal_reference})
                </div>
              </div>

              {/* Lock Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleOpenGenerateCode(selectedParticipant)}
                  style={{ ...actionSmallBtnStyles, padding: '8px 14px', backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa', fontWeight: 700 }}
                >
                  🔑 Generate Unlock Code
                </button>
                {selectedParticipant.identity_locked ? (
                  <button
                    type="button"
                    onClick={() => handleUnlockParticipant(selectedParticipant)}
                    disabled={isActionPending}
                    style={{ ...actionSmallBtnStyles, padding: '8px 14px', backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0', fontWeight: 700 }}
                  >
                    🔓 Direct Unlock
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLockParticipant(selectedParticipant)}
                    disabled={isActionPending}
                    style={{ ...actionSmallBtnStyles, padding: '8px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca', fontWeight: 700 }}
                  >
                    🔒 Re-Lock Immediately
                  </button>
                )}
              </div>
            </div>

            {/* Sub-tabs for Audit vs Unlock Codes */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setActiveDetailTab('details')}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: activeDetailTab === 'details' ? '2px solid #ff7a00' : 'none',
                  color: activeDetailTab === 'details' ? '#ff7a00' : '#6b7280',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                📜 Identity Change Audit Logs ({participantHistory?.audit_logs?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('codes')}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: activeDetailTab === 'codes' ? '2px solid #ff7a00' : 'none',
                  color: activeDetailTab === 'codes' ? '#ff7a00' : '#6b7280',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                🔑 Generated Unlock Codes ({participantHistory?.unlock_codes?.length || 0})
              </button>
            </div>

            {/* Tab: Identity Change History */}
            {activeDetailTab === 'details' && (
              <div>
                {isLoadingHistory ? (
                  <Skeleton width="100%" height="120px" borderRadius="8px" />
                ) : !participantHistory?.audit_logs || participantHistory.audit_logs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                    No identity modifications have occurred. Original registered identity remains unmodified.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {participantHistory.audit_logs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>
                            Authorized Modification by: {log.authorized_by_email || 'System Admin'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        {log.reason && (
                          <div style={{ fontStyle: 'italic', color: '#475569', marginBottom: '8px', fontSize: '11px' }}>
                            Reason: &ldquo;{log.reason}&rdquo;
                          </div>
                        )}

                        {/* Field Diffs */}
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                          {Object.entries(log.changed_fields || {}).map(([fKey, diff]) => (
                            <div key={fKey} style={{ display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '4px' }}>
                              <strong style={{ minWidth: '100px', textTransform: 'capitalize' }}>{fKey}:</strong>
                              <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{diff.previous || 'None'}</span>
                              <span>&rarr;</span>
                              <span style={{ color: '#10b981', fontWeight: 600 }}>{diff.new || 'None'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Generated Unlock Codes */}
            {activeDetailTab === 'codes' && (
              <div>
                {isLoadingHistory ? (
                  <Skeleton width="100%" height="120px" borderRadius="8px" />
                ) : !participantHistory?.unlock_codes || participantHistory.unlock_codes.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                    No unlock codes have been generated for this participant.
                  </div>
                ) : (
                  <table style={tableStyles}>
                    <thead>
                      <tr style={tableHeaderRowStyles}>
                        <th style={thStyles}>Code</th>
                        <th style={thStyles}>Fee</th>
                        <th style={thStyles}>Status</th>
                        <th style={thStyles}>Expires At</th>
                        <th style={thStyles}>Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantHistory.unlock_codes.map((c) => (
                        <tr key={c.id} style={tableRowStyles}>
                          <td style={{ ...tdStyles, fontFamily: 'monospace', fontWeight: 800, fontSize: '13px' }}>
                            {c.code}
                          </td>
                          <td style={tdStyles}>{formatCurrency(c.fee_amount)}</td>
                          <td style={tdStyles}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: c.is_used ? '#f1f5f9' : '#dcfce7',
                                color: c.is_used ? '#64748b' : '#15803d',
                              }}
                            >
                              {c.is_used ? 'USED' : 'ACTIVE / UNUSED'}
                            </span>
                          </td>
                          <td style={{ ...tdStyles, fontSize: '11px' }}>
                            {new Date(c.expires_at).toLocaleString()}
                          </td>
                          <td style={{ ...tdStyles, fontSize: '11px', color: '#64748b' }}>
                            {c.created_by_email || 'Admin'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: Generate One-Time Unlock Code
          ---------------------------------------------------------- */}
      {showGenerateCodeModal && generateTargetParticipant && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔑</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Generate Unlock Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateCodeModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
              Generating a one-time code for <strong>{generateTargetParticipant.full_name}</strong> ({generateTargetParticipant.email}).
              Once verified by the customer, a temporary 30-minute edit window will open.
            </p>

            {generatedCodeResult ? (
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: 700, textTransform: 'uppercase' }}>
                  Generated One-Time Unlock Code
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '3px', color: '#ea580c', margin: '8px 0' }}>
                  {generatedCodeResult.code}
                </div>
                <div style={{ fontSize: '11px', color: '#9a3412', marginBottom: '12px' }}>
                  Fee: <strong>{formatCurrency(generatedCodeResult.fee_amount)}</strong> | Expires: {new Date(generatedCodeResult.expires_at).toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCodeResult.code);
                    toast.success('Unlock code copied to clipboard!');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  📋 Copy Code to Clipboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: '#374151' }}>
                    Identity Edit Fee (NGN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={codeFeeAmount}
                    onChange={(e) => setCodeFeeAmount(e.target.value)}
                    style={modalInputStyles}
                  />
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                    Default standard fee is ₦{parseFloat(unlockConfig?.fee_amount || '5000').toLocaleString()}. Can be set to 0 if waived.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: '#374151' }}>
                    Code Expiration Window (Hours)
                  </label>
                  <select
                    value={codeExpiresHours}
                    onChange={(e) => setCodeExpiresHours(parseInt(e.target.value, 10))}
                    style={modalInputStyles}
                  >
                    <option value={6}>6 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (Standard)</option>
                    <option value={48}>48 Hours</option>
                    <option value={72}>72 Hours</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowGenerateCodeModal(false)}
                    style={modalCancelBtnStyles}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingCode}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#ff7a00',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isGeneratingCode ? 'Generating...' : 'Generate Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------
          MODAL: Configure Global Unlock Fee
          ---------------------------------------------------------- */}
      {showFeeConfigModal && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚙️</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Save2Own Identity Unlock Fee</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFeeConfigModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <div>Current Standard Unlock Fee: <strong style={{ color: '#ff7a00', fontSize: '15px' }}>{formatCurrency(unlockConfig?.fee_amount || '5000')}</strong></div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Last updated: {unlockConfig?.updated_at ? new Date(unlockConfig.updated_at).toLocaleString() : 'N/A'} by {unlockConfig?.updated_by || 'Admin'}
              </div>
            </div>

            <form onSubmit={handleUpdateFeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: '#374151' }}>
                  New Fee Amount (NGN) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={newFeeAmount}
                  onChange={(e) => setNewFeeAmount(e.target.value)}
                  style={modalInputStyles}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: '#374151' }}>
                  Administrative Justification / Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Revised administrative cost for manual KYC review and identity re-locking"
                  value={feeChangeReason}
                  onChange={(e) => setFeeChangeReason(e.target.value)}
                  style={{ ...modalInputStyles, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowFeeConfigModal(false)}
                  style={modalCancelBtnStyles}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingFee}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#ff7a00',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isUpdatingFee ? 'Saving...' : 'Update Unlock Fee'}
                </button>
              </div>
            </form>

            {/* Fee Audit History */}
            {unlockConfig?.history && unlockConfig.history.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Fee Change Audit History
                </h5>
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {unlockConfig.history.map((h) => (
                    <div key={h.id} style={{ fontSize: '11px', padding: '6px 8px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>₦{parseFloat(h.previous_fee).toLocaleString()} &rarr; <strong>₦{parseFloat(h.new_fee).toLocaleString()}</strong></span>
                        <span style={{ color: '#9ca3af' }}>{new Date(h.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: '#6b7280', marginTop: '2px' }}>
                        Reason: {h.reason || 'N/A'} (by {h.changed_by_email || 'Admin'})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
  padding: '24px 32px',
  maxWidth: '1440px',
  margin: '0 auto',
};

const titleStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#111827',
};

const btnSecondaryStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  backgroundColor: '#ffffff',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  marginBottom: '20px',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: '1 1 300px',
  maxWidth: '450px',
};

const searchInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '13px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  outline: 'none',
};

const searchBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 600,
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
};

const filterWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const filterLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
};

const selectStyles: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: '12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  outline: 'none',
};

const tableContainerStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  overflowX: 'auto',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};

const thStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
};

const tdStyles: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};

const selfieAvatarStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  objectFit: 'cover',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
};

const selfiePlaceholderStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  backgroundColor: '#e2e8f0',
  color: '#475569',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '14px',
};

const progressBarTrackStyles: React.CSSProperties = {
  width: '100px',
  height: '5px',
  backgroundColor: '#e5e7eb',
  borderRadius: '9999px',
  overflow: 'hidden',
};

const progressBarFillStyles: React.CSSProperties = {
  height: '100%',
  backgroundColor: '#ff7a00',
  borderRadius: '9999px',
};

const actionSmallBtnStyles: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '4px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#374151',
  cursor: 'pointer',
};

const paginationWrapperStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  marginTop: '20px',
};

const pageBtnStyles: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
};

const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  width: '100%',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const modalInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '13px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  outline: 'none',
  boxSizing: 'border-box',
};

const modalCancelBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
};
