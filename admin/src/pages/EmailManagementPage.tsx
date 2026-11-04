import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type {
  EmailLog,
  EmailMetrics,
  EmailConfigData,
  EmailDeliveryStatus,
  APIError,
} from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function EmailManagementPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [config, setConfig] = useState<EmailConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Drawers
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<'details' | 'html' | 'text'>('details');

  // Test Email Form
  const [testForm, setTestForm] = useState({
    email_type: 'WELCOME',
    recipient: '',
    recipient_name: 'Campus Member',
  });
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Announcement Form
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    action_text: 'Open Marketplace',
    action_url: 'https://dovishops.com',
    target_recipients_raw: '',
  });
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

  // Retry state
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchEmailData = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const [logsRes, metricsRes, configRes] = await Promise.all([
        adminApi.listEmails({
          page,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          q: searchTerm.trim() || undefined,
        }),
        adminApi.getEmailMetrics(),
        adminApi.getEmailConfig(),
      ]);

      setLogs(logsRes.results || []);
      setTotalPages(Math.ceil((logsRes.count || 1) / 20));
      setTotalCount(logsRes.count || 0);
      setMetrics(metricsRes);
      setConfig(configRes);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load email delivery records.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailData();
  }, [page, statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmailData(true);
  };

  const handleRetry = async (log: EmailLog) => {
    setRetryingId(log.id);
    try {
      const updated = await adminApi.retryEmail(log.id);
      toast.success(`Retry queued for ${log.recipient}. New status: ${updated.status}`);
      setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      if (selectedEmail && selectedEmail.id === updated.id) {
        setSelectedEmail(updated);
      }
      fetchEmailData(false);
    } catch (err: any) {
      toast.error(err.message || 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.recipient.trim()) {
      toast.error('Please enter a destination email address.');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await adminApi.sendTestEmail({
        email_type: testForm.email_type,
        recipient: testForm.recipient.trim(),
        recipient_name: testForm.recipient_name.trim(),
      });
      toast.success(res.message || 'Test email dispatched successfully.');
      setShowTestModal(false);
      fetchEmailData(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch test email.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    setIsSendingAnnouncement(true);
    try {
      const rawRecipients = announcementForm.target_recipients_raw
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.includes('@'));

      const res = await adminApi.sendPlatformAnnouncement({
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        action_text: announcementForm.action_text.trim(),
        action_url: announcementForm.action_url.trim(),
        target_recipients: rawRecipients.length > 0 ? rawRecipients : undefined,
      });

      toast.success(res.message || 'Platform announcement broadcast successfully.');
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        title: '',
        message: '',
        action_text: 'Open Marketplace',
        action_url: 'https://dovishops.com',
        target_recipients_raw: '',
      });
      fetchEmailData(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to broadcast announcement.');
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  // Status Badge Colors
  const getStatusBadge = (status: EmailDeliveryStatus) => {
    let bg = '#f3f4f6';
    let color = '#4b5563';
    let border = '#e5e7eb';

    switch (status) {
      case 'DELIVERED':
        bg = '#ecfdf5';
        color = '#065f46';
        border = '#a7f3d0';
        break;
      case 'ACCEPTED':
        bg = '#eff6ff';
        color = '#1e40af';
        border = '#bfdbfe';
        break;
      case 'FAILED':
        bg = '#fef2f2';
        color = '#991b1b';
        border = '#fecaca';
        break;
      case 'BOUNCED':
      case 'COMPLAINED':
        bg = '#fffbeb';
        color = '#92400e';
        border = '#fde68a';
        break;
      case 'QUEUED':
        bg = '#f8fafc';
        color = '#475569';
        border = '#cbd5e1';
        break;
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: bg,
          color,
          border: `1px solid ${border}`,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
        {status}
      </span>
    );
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (isLoading && !metrics) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <div>
            <h1 style={titleStyles}>Email Deliveries & Infrastructure</h1>
            <p style={subtitleStyles}>Monitor transactional emails, Resend message IDs, and delivery telemetry.</p>
          </div>
        </div>
        <div style={kpiGridStyles}>
          <Skeleton width="100%" height="90px" borderRadius="10px" />
          <Skeleton width="100%" height="90px" borderRadius="10px" />
          <Skeleton width="100%" height="90px" borderRadius="10px" />
          <Skeleton width="100%" height="90px" borderRadius="10px" />
        </div>
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="340px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Header with Title and Action Buttons */}
      <div style={headerStyles}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={titleStyles}>Email Deliveries & Infrastructure</h1>
            <span style={badgeTagStyles}>Resend Official</span>
          </div>
          <p style={subtitleStyles}>
            Authoritative transactional email dispatch, provider delivery webhooks, and retry management.
          </p>
        </div>
        <div style={headerActionsStyles}>
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            style={secondaryBtnStyles}
            title="Inspect Email Configuration"
          >
            ⚙️ Configuration
          </button>
          <button
            type="button"
            onClick={() => setShowAnnouncementModal(true)}
            style={secondaryBtnStyles}
            title="Broadcast Announcement"
          >
            📢 Announcement
          </button>
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            style={primaryBtnStyles}
            title="Send Test Transactional Email"
          >
            ✉️ Send Test Email
          </button>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* KPI Metrics Cards */}
      <div style={kpiGridStyles}>
        <div style={kpiCardStyles}>
          <span style={kpiLabelStyles}>Total Emails</span>
          <span style={kpiValStyles}>{metrics?.total_emails.toLocaleString() ?? '0'}</span>
          <span style={kpiHintStyles}>Lifetime transactional dispatch</span>
        </div>
        <div style={kpiCardStyles}>
          <span style={kpiLabelStyles}>Delivered Successfully</span>
          <span style={{ ...kpiValStyles, color: '#059669' }}>
            {metrics?.delivered.toLocaleString() ?? '0'}
          </span>
          <span style={kpiHintStyles}>Confirmed at inbox</span>
        </div>
        <div style={kpiCardStyles}>
          <span style={kpiLabelStyles}>Delivery Rate</span>
          <span style={{ ...kpiValStyles, color: '#ff7a00' }}>
            {metrics?.delivery_rate_pct ?? 100}%
          </span>
          <span style={kpiHintStyles}>Inbox acceptance percentage</span>
        </div>
        <div style={kpiCardStyles}>
          <span style={kpiLabelStyles}>Bounced / Failed</span>
          <span style={{ ...kpiValStyles, color: (metrics?.failed || 0) > 0 ? '#dc2626' : '#6b7280' }}>
            {((metrics?.failed || 0) + (metrics?.bounced || 0)).toLocaleString()}
          </span>
          <span style={kpiHintStyles}>Eligible for retry</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={filterBarCardStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by recipient email, subject, or Resend ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>
            Search
          </button>
        </form>

        <div style={filterGroupStyles}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="ALL">All Statuses</option>
            <option value="DELIVERED">Delivered</option>
            <option value="ACCEPTED">Accepted by Provider</option>
            <option value="FAILED">Failed</option>
            <option value="BOUNCED">Bounced</option>
            <option value="QUEUED">Queued</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="ALL">All Categories</option>
            <option value="ACCOUNT">Account & Security</option>
            <option value="BUYER">Buyer & Orders</option>
            <option value="SELLER">Seller & Payouts</option>
            <option value="ESCROW">Escrow & Disputes</option>
            <option value="SUPPORT">Platform & Support</option>
          </select>
        </div>
      </div>

      {/* Main Email Logs Table */}
      <div style={tableWrapperStyles}>
        {logs.length === 0 ? (
          <EmptyState
            title="No Email Logs Found"
            subtitle="There are no transactional email records matching the selected search or filter criteria."
          />
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr style={tableHeadRowStyles}>
                <th style={thStyles}>Recipient</th>
                <th style={thStyles}>Template Type</th>
                <th style={thStyles}>Subject</th>
                <th style={thStyles}>Status</th>
                <th style={thStyles}>Resend Message ID</th>
                <th style={thStyles}>Attempts</th>
                <th style={thStyles}>Date Dispatched</th>
                <th style={{ ...thStyles, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={tableRowStyles}>
                  <td style={tdStyles}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>
                      {log.recipient_name || log.recipient}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{log.recipient}</div>
                  </td>
                  <td style={tdStyles}>
                    <span style={categoryPillStyles}>{log.category_display || log.category}</span>
                    <div style={{ fontSize: '11px', color: '#374151', fontWeight: 500, marginTop: '2px' }}>
                      {log.email_type_display || log.email_type}
                    </div>
                  </td>
                  <td style={{ ...tdStyles, maxWidth: '220px' }}>
                    <div
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: '#1f2937',
                      }}
                      title={log.subject}
                    >
                      {log.subject}
                    </div>
                  </td>
                  <td style={tdStyles}>{getStatusBadge(log.status)}</td>
                  <td style={tdStyles}>
                    {log.resend_message_id ? (
                      <span
                        style={resendIdPillStyles}
                        title={log.resend_message_id}
                        onClick={() => {
                          navigator.clipboard.writeText(log.resend_message_id || '');
                          toast.success('Resend message ID copied!');
                        }}
                      >
                        {log.resend_message_id.slice(0, 14)}...
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={tdStyles}>
                    <span style={{ fontWeight: 600, color: log.attempts_count > 1 ? '#d97706' : '#4b5563' }}>
                      {log.attempts_count}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>/{log.max_retries}</span>
                  </td>
                  <td style={tdStyles}>
                    <div style={{ fontSize: '12px', color: '#374151' }}>{formatDate(log.created_at)}</div>
                  </td>
                  <td style={{ ...tdStyles, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmail(log);
                          setPreviewTab('details');
                        }}
                        style={inspectBtnStyles}
                        title="View Detailed Delivery History & Payload"
                      >
                        Inspect
                      </button>
                      {(log.status === 'FAILED' || log.status === 'BOUNCED') && (
                        <button
                          type="button"
                          disabled={retryingId === log.id}
                          onClick={() => handleRetry(log)}
                          style={retryBtnStyles}
                          title="Retry Delivery Attempt"
                        >
                          {retryingId === log.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        <div style={paginationFooterStyles}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Showing <strong>{logs.length}</strong> of <strong>{totalCount}</strong> email records
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={paginationBtnStyles}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', padding: '6px 12px', color: '#374151', fontWeight: 600 }}>
              Page {page} of {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={paginationBtnStyles}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODAL 1: Email Inspection & Preview Drawer
          ============================================================ */}
      {selectedEmail && (
        <div style={modalOverlayStyles} onClick={() => setSelectedEmail(null)}>
          <div style={inspectModalStyles} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyles}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                  Email Delivery Inspection
                </h3>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>ID: {selectedEmail.id}</span>
              </div>
              <button type="button" onClick={() => setSelectedEmail(null)} style={closeBtnStyles}>
                &times;
              </button>
            </div>

            {/* Navigation Tabs inside modal */}
            <div style={modalNavTabsStyles}>
              <button
                type="button"
                style={previewTab === 'details' ? modalActiveTabStyles : modalTabStyles}
                onClick={() => setPreviewTab('details')}
              >
                Telemetry & Attempts
              </button>
              <button
                type="button"
                style={previewTab === 'html' ? modalActiveTabStyles : modalTabStyles}
                onClick={() => setPreviewTab('html')}
              >
                HTML Template Preview
              </button>
              <button
                type="button"
                style={previewTab === 'text' ? modalActiveTabStyles : modalTabStyles}
                onClick={() => setPreviewTab('text')}
              >
                Plain Text Version
              </button>
            </div>

            <div style={modalBodyScrollStyles}>
              {previewTab === 'details' && (
                <div>
                  {/* Status Banner */}
                  <div style={inspectHeaderCardStyles}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Current State</div>
                        <div>{getStatusBadge(selectedEmail.status)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Resend Message ID</div>
                        <strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#111827' }}>
                          {selectedEmail.resend_message_id || 'Not Assigned / Failed before provider'}
                        </strong>
                      </div>
                      <div>
                        {(selectedEmail.status === 'FAILED' || selectedEmail.status === 'BOUNCED') && (
                          <button
                            type="button"
                            disabled={retryingId === selectedEmail.id}
                            onClick={() => handleRetry(selectedEmail)}
                            style={retryPrimaryBtnStyles}
                          >
                            {retryingId === selectedEmail.id ? 'Retrying...' : 'Retry Delivery Now'}
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedEmail.last_error && (
                      <div style={errorCalloutStyles}>
                        <strong>Provider Diagnostic / Error:</strong>
                        <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '12px' }}>
                          {selectedEmail.last_error}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata Grid */}
                  <h4 style={sectionHeadingStyles}>Message Metadata</h4>
                  <div style={metaGridStyles}>
                    <div style={metaItemStyles}>
                      <span style={metaLabelStyles}>Recipient</span>
                      <span style={metaValueStyles}>
                        {selectedEmail.recipient_name ? `${selectedEmail.recipient_name} <${selectedEmail.recipient}>` : selectedEmail.recipient}
                      </span>
                    </div>
                    <div style={metaItemStyles}>
                      <span style={metaLabelStyles}>Sender Identity</span>
                      <span style={metaValueStyles}>{selectedEmail.sender}</span>
                    </div>
                    <div style={metaItemStyles}>
                      <span style={metaLabelStyles}>Template Event</span>
                      <span style={metaValueStyles}>{selectedEmail.email_type}</span>
                    </div>
                    <div style={metaItemStyles}>
                      <span style={metaLabelStyles}>Category</span>
                      <span style={metaValueStyles}>{selectedEmail.category}</span>
                    </div>
                    <div style={metaItemStyles}>
                      <span style={metaLabelStyles}>Subject Line</span>
                      <span style={metaValueStyles}>{selectedEmail.subject}</span>
                    </div>
                    <div style={metaItemStyles}>
                      <span style={metaLabelStyles}>Idempotency Key</span>
                      <span style={{ ...metaValueStyles, fontFamily: 'monospace' }}>
                        {selectedEmail.idempotency_key || 'None (Direct Dispatch)'}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Attempts Timeline */}
                  <h4 style={sectionHeadingStyles}>Delivery Attempts ({selectedEmail.attempts_count})</h4>
                  {(!selectedEmail.delivery_attempts || selectedEmail.delivery_attempts.length === 0) ? (
                    <div style={{ fontSize: '13px', color: '#6b7280', padding: '12px 0' }}>
                      No delivery attempt records stored for this dispatch.
                    </div>
                  ) : (
                    <div style={attemptsListStyles}>
                      {selectedEmail.delivery_attempts.map((att) => (
                        <div key={att.id} style={attemptItemStyles}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>
                              Attempt #{att.attempt_number}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              {formatDate(att.created_at)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px' }}>
                            <span>
                              Status:{' '}
                              <strong style={{ color: att.status === 'SUCCESS' ? '#059669' : '#dc2626' }}>
                                {att.status}
                              </strong>
                            </span>
                            {att.response_code && (
                              <span>
                                HTTP Code: <strong>{att.response_code}</strong>
                              </span>
                            )}
                            {att.latency_ms && (
                              <span>
                                Latency: <strong>{att.latency_ms} ms</strong>
                              </span>
                            )}
                          </div>
                          {att.error_message && (
                            <div style={{ marginTop: '6px', fontSize: '12px', color: '#b91c1c', fontFamily: 'monospace' }}>
                              {att.error_message}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {previewTab === 'html' && (
                <div>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Previewing responsive rendered email client HTML
                    </span>
                    <button
                      type="button"
                      style={smallCopyBtnStyles}
                      onClick={() => {
                        if (selectedEmail.html_body) {
                          navigator.clipboard.writeText(selectedEmail.html_body);
                          toast.success('Raw HTML copied!');
                        }
                      }}
                    >
                      Copy Raw HTML
                    </button>
                  </div>
                  <div style={iframeContainerStyles}>
                    {selectedEmail.html_body ? (
                      <iframe
                        srcDoc={selectedEmail.html_body}
                        title="Rendered Email Preview"
                        style={{ width: '100%', height: '550px', border: 'none', backgroundColor: '#f8f9fa' }}
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                        No cached HTML template body for this log.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {previewTab === 'text' && (
                <div>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Plain-text MIME alternative for non-HTML mail clients
                    </span>
                    <button
                      type="button"
                      style={smallCopyBtnStyles}
                      onClick={() => {
                        if (selectedEmail.text_body) {
                          navigator.clipboard.writeText(selectedEmail.text_body);
                          toast.success('Plain text copied!');
                        }
                      }}
                    >
                      Copy Plain Text
                    </button>
                  </div>
                  <pre style={plainTextPreStyles}>
                    {selectedEmail.text_body || 'No plain text representation recorded.'}
                  </pre>
                </div>
              )}
            </div>

            <div style={modalFooterStyles}>
              <button type="button" onClick={() => setSelectedEmail(null)} style={secondaryBtnStyles}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: Send Test Transactional Email
          ============================================================ */}
      {showTestModal && (
        <div style={modalOverlayStyles} onClick={() => setShowTestModal(false)}>
          <div style={dialogModalStyles} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyles}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827' }}>
                Send Real Test Email via Resend
              </h3>
              <button type="button" onClick={() => setShowTestModal(false)} style={closeBtnStyles}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSendTestEmail}>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
                  This will dispatch an authentic transactional email through your verified Resend domain to test
                  real delivery, spam filtering, and template rendering.
                </p>

                <div style={formFieldStyles}>
                  <label style={labelStyles}>Email Template Type</label>
                  <select
                    value={testForm.email_type}
                    onChange={(e) => setTestForm((prev) => ({ ...prev, email_type: e.target.value }))}
                    style={inputStyles}
                  >
                    <optgroup label="A. Account & Security">
                      <option value="WELCOME">Welcome Email</option>
                      <option value="EMAIL_VERIFICATION">Email Verification</option>
                      <option value="PASSWORD_RESET">Password Reset</option>
                      <option value="PASSWORD_CHANGED">Password Changed Alert</option>
                      <option value="SECURITY_LOGIN_ALERT">Security Login Alert</option>
                    </optgroup>
                    <optgroup label="B. Buyer & Orders">
                      <option value="ORDER_CONFIRMATION">Order Confirmation (DOV-ORD)</option>
                      <option value="PAYMENT_SUCCESSFUL">Payment Successful Receipt</option>
                      <option value="PAYMENT_FAILED">Payment Failed Notification</option>
                      <option value="ORDER_PROCESSING">Order Processing Update</option>
                      <option value="ORDER_DISPATCHED">Order Dispatched (Tracking)</option>
                      <option value="ORDER_DELIVERED">Order Delivered</option>
                      <option value="ORDER_CANCELLED">Order Cancelled</option>
                      <option value="REFUND_INITIATED">Refund Initiated Claim</option>
                      <option value="REFUND_COMPLETED">Refund Completed</option>
                    </optgroup>
                    <optgroup label="C. Seller & Payouts">
                      <option value="SELLER_NEW_ORDER">Seller New Order Notification</option>
                      <option value="SELLER_PAYMENT_CONFIRMED">Seller Payment Confirmed</option>
                      <option value="SELLER_ORDER_CANCELLED">Seller Order Cancelled</option>
                      <option value="SELLER_FULFILLMENT_REMINDER">Seller Fulfillment Reminder</option>
                      <option value="SELLER_PAYOUT_INITIATED">Seller Payout Initiated</option>
                      <option value="SELLER_PAYOUT_SUCCESSFUL">Seller Payout Successful</option>
                      <option value="SELLER_PAYOUT_FAILED">Seller Payout Failed</option>
                    </optgroup>
                    <optgroup label="D. Escrow & Disputes">
                      <option value="ESCROW_PAYMENT_SECURED">Escrow Payment Secured</option>
                      <option value="ESCROW_AWAITING_FULFILLMENT">Escrow Awaiting Fulfillment</option>
                      <option value="ESCROW_AWAITING_CONFIRMATION">Escrow Awaiting Confirmation</option>
                      <option value="ESCROW_RELEASED">Escrow Funds Released</option>
                      <option value="DISPUTE_OPENED">Dispute Opened</option>
                      <option value="DISPUTE_UPDATE">Dispute Update Note</option>
                      <option value="DISPUTE_RESOLVED">Dispute Resolved</option>
                    </optgroup>
                    <optgroup label="E. Platform & Support">
                      <option value="PLATFORM_ANNOUNCEMENT">Platform Announcement</option>
                      <option value="SUPPORT_TICKET_RECEIVED">Support Ticket Received</option>
                      <option value="SUPPORT_RESPONSE">Support Response</option>
                      <option value="ACCOUNT_SUSPENDED">Account Suspended Notice</option>
                      <option value="POLICY_UPDATE">Policy Update</option>
                    </optgroup>
                  </select>
                </div>

                <div style={formFieldStyles}>
                  <label style={labelStyles}>Recipient Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. your-email@gmail.com"
                    value={testForm.recipient}
                    onChange={(e) => setTestForm((prev) => ({ ...prev, recipient: e.target.value }))}
                    style={inputStyles}
                  />
                </div>

                <div style={formFieldStyles}>
                  <label style={labelStyles}>Recipient Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Victor Marshall"
                    value={testForm.recipient_name}
                    onChange={(e) => setTestForm((prev) => ({ ...prev, recipient_name: e.target.value }))}
                    style={inputStyles}
                  />
                </div>
              </div>

              <div style={modalFooterStyles}>
                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={() => setShowTestModal(false)}
                  style={secondaryBtnStyles}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSendingTest} style={primaryBtnStyles}>
                  {isSendingTest ? 'Dispatching via Resend...' : 'Send Live Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: Platform Announcement Broadcaster
          ============================================================ */}
      {showAnnouncementModal && (
        <div style={modalOverlayStyles} onClick={() => setShowAnnouncementModal(false)}>
          <div style={dialogModalStyles} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyles}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827' }}>
                Broadcast Platform Announcement
              </h3>
              <button type="button" onClick={() => setShowAnnouncementModal(false)} style={closeBtnStyles}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSendAnnouncement}>
              <div style={{ padding: '20px 24px' }}>
                <div style={formFieldStyles}>
                  <label style={labelStyles}>Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Save2Own Milestone Features Released!"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
                    style={inputStyles}
                  />
                </div>

                <div style={formFieldStyles}>
                  <label style={labelStyles}>Announcement Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write the message text for students and vendors..."
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))}
                    style={{ ...inputStyles, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={formFieldStyles}>
                    <label style={labelStyles}>Action Button Text</label>
                    <input
                      type="text"
                      value={announcementForm.action_text}
                      onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, action_text: e.target.value }))}
                      style={inputStyles}
                    />
                  </div>
                  <div style={formFieldStyles}>
                    <label style={labelStyles}>Action Button URL</label>
                    <input
                      type="url"
                      value={announcementForm.action_url}
                      onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, action_url: e.target.value }))}
                      style={inputStyles}
                    />
                  </div>
                </div>

                <div style={formFieldStyles}>
                  <label style={labelStyles}>Target Recipients (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Enter specific email addresses separated by comma or new lines. Leave blank to target all subscribers."
                    value={announcementForm.target_recipients_raw}
                    onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, target_recipients_raw: e.target.value }))}
                    style={{ ...inputStyles, fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={modalFooterStyles}>
                <button
                  type="button"
                  disabled={isSendingAnnouncement}
                  onClick={() => setShowAnnouncementModal(false)}
                  style={secondaryBtnStyles}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSendingAnnouncement} style={primaryBtnStyles}>
                  {isSendingAnnouncement ? 'Broadcasting...' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: Non-Secret Email Configuration Drawer
          ============================================================ */}
      {showConfigModal && (
        <div style={modalOverlayStyles} onClick={() => setShowConfigModal(false)}>
          <div style={dialogModalStyles} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyles}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827' }}>
                Resend Email Configuration
              </h3>
              <button type="button" onClick={() => setShowConfigModal(false)} style={closeBtnStyles}>
                &times;
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={configBoxStyles}>
                <div style={configRowStyles}>
                  <span style={configKeyStyles}>Status:</span>
                  <span style={{ color: config?.is_configured ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {config?.is_configured ? '● Active & Verified' : '○ Not Configured'}
                  </span>
                </div>
                <div style={configRowStyles}>
                  <span style={configKeyStyles}>Resend API Key:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{config?.masked_api_key}</span>
                </div>
                <div style={configRowStyles}>
                  <span style={configKeyStyles}>Primary Sender:</span>
                  <span>{config?.from_name} &lt;{config?.from_address}&gt;</span>
                </div>
                <div style={configRowStyles}>
                  <span style={configKeyStyles}>Reply-To Address:</span>
                  <span>{config?.reply_to}</span>
                </div>
                <div style={configRowStyles}>
                  <span style={configKeyStyles}>Marketplace App URL:</span>
                  <span style={{ color: '#ff7a00', fontWeight: 500 }}>{config?.app_url}</span>
                </div>
                <div style={configRowStyles}>
                  <span style={configKeyStyles}>Resend Webhook URL:</span>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{config?.webhook_endpoint}</span>
                </div>
                <div style={configRowStyles}>
                  <span style={configKeyStyles}>Webhook Signature:</span>
                  <span style={{ color: config?.webhook_configured ? '#059669' : '#d97706', fontWeight: 600 }}>
                    {config?.webhook_configured ? 'Svix Signature Verified' : 'Standard Webhook Mode'}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
                <strong>Security Policy:</strong> Full API secrets are never surfaced in the browser or administrative
                REST payloads. Configure secrets in server environment variables or <code>.env</code> on production hosts.
              </div>
            </div>

            <div style={modalFooterStyles}>
              <button type="button" onClick={() => setShowConfigModal(false)} style={primaryBtnStyles}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Styles (Dovi Admin Clean Design Tokens)
// ============================================================

const containerStyles: React.CSSProperties = {
  padding: '24px 32px 48px 32px',
  maxWidth: '1440px',
  margin: '0 auto',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '24px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#111827',
  margin: 0,
  letterSpacing: '-0.3px',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  marginTop: '4px',
  marginBottom: 0,
};

const badgeTagStyles: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  fontSize: '11px',
  fontWeight: 700,
  borderRadius: '4px',
  backgroundColor: '#ffede0',
  color: '#e06c00',
  border: '1px solid #ffd8bf',
};

const headerActionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
};

const primaryBtnStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  border: '1px solid #ff7a00',
  borderRadius: '8px',
  padding: '9px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const secondaryBtnStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '9px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const kpiGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
};

const kpiCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
};

const kpiLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const kpiValStyles: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  color: '#111827',
  marginTop: '4px',
  letterSpacing: '-0.5px',
};

const kpiHintStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  marginTop: '4px',
};

const filterBarCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '14px 18px',
  marginBottom: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: '1 1 320px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  outline: 'none',
};

const searchBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const filterGroupStyles: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const selectStyles: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  backgroundColor: '#ffffff',
  color: '#374151',
};

const tableWrapperStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeadRowStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};

const thStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  transition: 'background-color 0.15s ease',
};

const tdStyles: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '13px',
  verticalAlign: 'middle',
};

const categoryPillStyles: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: 700,
  color: '#6b7280',
  backgroundColor: '#f3f4f6',
  padding: '1px 6px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const resendIdPillStyles: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '11px',
  backgroundColor: '#f3f4f6',
  color: '#374151',
  padding: '3px 6px',
  borderRadius: '4px',
  cursor: 'pointer',
};

const inspectBtnStyles: React.CSSProperties = {
  padding: '5px 12px',
  backgroundColor: '#ffffff',
  color: '#ff7a00',
  border: '1px solid #ff7a00',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const retryBtnStyles: React.CSSProperties = {
  padding: '5px 12px',
  backgroundColor: '#fee2e2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const retryPrimaryBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const paginationFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 20px',
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #e5e7eb',
};

const paginationBtnStyles: React.CSSProperties = {
  padding: '6px 14px',
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

// Modal Styles
const modalOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '20px',
};

const inspectModalStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '850px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const dialogModalStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '540px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '18px 24px',
  borderBottom: '1px solid #e5e7eb',
};

const closeBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  lineHeight: 1,
  color: '#9ca3af',
  cursor: 'pointer',
};

const modalNavTabsStyles: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  padding: '0 24px',
};

const modalTabStyles: React.CSSProperties = {
  padding: '12px 18px',
  border: 'none',
  background: 'none',
  fontSize: '13px',
  fontWeight: 600,
  color: '#6b7280',
  cursor: 'pointer',
  borderBottom: '2px solid transparent',
};

const modalActiveTabStyles: React.CSSProperties = {
  ...modalTabStyles,
  color: '#ff7a00',
  borderBottom: '2px solid #ff7a00',
};

const modalBodyScrollStyles: React.CSSProperties = {
  padding: '20px 24px',
  overflowY: 'auto',
  flex: 1,
};

const modalFooterStyles: React.CSSProperties = {
  padding: '14px 24px',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  backgroundColor: '#f9fafb',
};

const inspectHeaderCardStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '20px',
};

const errorCalloutStyles: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px 14px',
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  borderRadius: '6px',
  color: '#991b1b',
  fontSize: '13px',
};

const sectionHeadingStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#111827',
  marginTop: '20px',
  marginBottom: '10px',
};

const metaGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '12px',
  marginBottom: '16px',
};

const metaItemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '10px 12px',
  backgroundColor: '#f9fafb',
  border: '1px solid #f3f4f6',
  borderRadius: '6px',
};

const metaLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  fontWeight: 600,
  textTransform: 'uppercase',
};

const metaValueStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#111827',
  fontWeight: 600,
  marginTop: '2px',
};

const attemptsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const attemptItemStyles: React.CSSProperties = {
  padding: '12px 14px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
};

const iframeContainerStyles: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  overflow: 'hidden',
};

const plainTextPreStyles: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '12px',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  color: '#1f2937',
  maxHeight: '500px',
  overflowY: 'auto',
};

const smallCopyBtnStyles: React.CSSProperties = {
  padding: '4px 10px',
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
};

const formFieldStyles: React.CSSProperties = {
  marginBottom: '14px',
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
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const configBoxStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const configRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '8px',
};

const configKeyStyles: React.CSSProperties = {
  color: '#6b7280',
  fontWeight: 500,
};
