import { useEffect, useState, Fragment } from 'react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import type {
  EscrowPayoutOrder,
  VendorSettlementSummary,
  PayoutBatch,
  EscrowPayoutStatus,
  VendorPayoutAccount,
} from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';

// Initial Mock Seed Data for Delivered & Confirmed Escrow Orders
const INITIAL_ESCROW_ORDERS: EscrowPayoutOrder[] = [
  {
    id: 'ord-escrow-101',
    order_reference: 'ORD-89241',
    flw_transaction_ref: 'FLW-TXN-902148',
    vendor_id: 'vendor-001',
    vendor_name: 'Apex Digital Store',
    order_status: 'DELIVERED',
    gross_amount: '150000',
    commission_fee: '7500', // 5%
    net_payout_amount: '142500',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    delivered_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    payout_status: 'READY_FOR_PAYOUT',
  },
  {
    id: 'ord-escrow-102',
    order_reference: 'ORD-89245',
    flw_transaction_ref: 'FLW-TXN-902152',
    vendor_id: 'vendor-001',
    vendor_name: 'Apex Digital Store',
    order_status: 'RECEIVED',
    gross_amount: '85000',
    commission_fee: '4250',
    net_payout_amount: '80750',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    delivered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    payout_status: 'READY_FOR_PAYOUT',
  },
  {
    id: 'ord-escrow-103',
    order_reference: 'ORD-89280',
    flw_transaction_ref: 'FLW-TXN-902210',
    vendor_id: 'vendor-002',
    vendor_name: 'TechHaven Solutions',
    order_status: 'COMPLETED',
    gross_amount: '320000',
    commission_fee: '16000',
    net_payout_amount: '304000',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    delivered_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    payout_status: 'READY_FOR_PAYOUT',
  },
  {
    id: 'ord-escrow-104',
    order_reference: 'ORD-89310',
    flw_transaction_ref: 'FLW-TXN-902300',
    vendor_id: 'vendor-003',
    vendor_name: 'Urban Wear & Kicks',
    order_status: 'DELIVERED',
    gross_amount: '45000',
    commission_fee: '2250',
    net_payout_amount: '42750',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    delivered_at: new Date(Date.now() - 43200000).toISOString(),
    payout_status: 'READY_FOR_PAYOUT',
  },
];

// Fallback Default Vendor Bank Details
const DEFAULT_VENDOR_BANKS: Record<string, VendorPayoutAccount> = {
  'vendor-001': {
    account_name: 'Apex Digital Enterprises',
    account_number: '0123456789',
    bank_name: 'Guaranty Trust Bank (GTBank)',
    bank_code: '058',
    is_primary: true,
  },
  'vendor-002': {
    account_name: 'TechHaven Global Ltd',
    account_number: '9876543210',
    bank_name: 'Zenith Bank',
    bank_code: '057',
    is_primary: true,
  },
  'vendor-003': {
    account_name: 'Urban Apparel Ltd',
    account_number: '2039481726',
    bank_name: 'Access Bank',
    bank_code: '044',
    is_primary: true,
  },
};

export default function EscrowPayoutsPage() {
  const [activeTab, setActiveTab] = useState<'SETTLEMENTS' | 'HISTORY'>('SETTLEMENTS');
  const [orders, setOrders] = useState<EscrowPayoutOrder[]>([]);
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtering Controls
  const [vendorSearch, setVendorSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('READY_FOR_PAYOUT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(5); // 5% default

  // Expanded Vendor Rows state
  const [expandedVendorIds, setExpandedVendorIds] = useState<Set<string>>(new Set());

  // Selected Batch for Inspection Modal
  const [selectedBatch, setSelectedBatch] = useState<PayoutBatch | null>(null);

  // Load persistent orders & batches
  useEffect(() => {
    setIsLoading(true);
    const savedOrdersKey = 'dovi_escrow_orders_v1';
    const savedBatchesKey = 'dovi_escrow_batches_v1';

    const savedOrders = localStorage.getItem(savedOrdersKey);
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        setOrders(INITIAL_ESCROW_ORDERS);
      }
    } else {
      setOrders(INITIAL_ESCROW_ORDERS);
      localStorage.setItem(savedOrdersKey, JSON.stringify(INITIAL_ESCROW_ORDERS));
    }

    const savedBatches = localStorage.getItem(savedBatchesKey);
    if (savedBatches) {
      try {
        setBatches(JSON.parse(savedBatches));
      } catch (e) {
        setBatches([]);
      }
    }

    setIsLoading(false);
  }, []);

  // Save Orders updates to LocalStorage
  const updateOrdersState = (newOrders: EscrowPayoutOrder[]) => {
    setOrders(newOrders);
    localStorage.setItem('dovi_escrow_orders_v1', JSON.stringify(newOrders));
  };

  // Save Batches updates to LocalStorage
  const updateBatchesState = (newBatches: PayoutBatch[]) => {
    setBatches(newBatches);
    localStorage.setItem('dovi_escrow_batches_v1', JSON.stringify(newBatches));
  };

  // Fetch Vendor Bank Account Details from local registry or defaults
  const getVendorBankDetails = (vendorId: string): VendorPayoutAccount | null => {
    const globalKey = `dovi_all_vendor_payouts`;
    const allPayouts = JSON.parse(localStorage.getItem(globalKey) || '{}');
    if (allPayouts[vendorId]) return allPayouts[vendorId];
    const directKey = `dovi_vendor_payout_${vendorId}`;
    const saved = localStorage.getItem(directKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_VENDOR_BANKS[vendorId] || null;
  };

  // Toggle Vendor Row Drawer
  const toggleVendorExpand = (vendorId: string) => {
    const next = new Set(expandedVendorIds);
    if (next.has(vendorId)) {
      next.delete(vendorId);
    } else {
      next.add(vendorId);
    }
    setExpandedVendorIds(next);
  };

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    // Vendor search filter
    if (vendorSearch) {
      const q = vendorSearch.toLowerCase();
      const matchVendor = o.vendor_name.toLowerCase().includes(q);
      const matchOrder = o.order_reference.toLowerCase().includes(q);
      const matchFlw = o.flw_transaction_ref.toLowerCase().includes(q);
      if (!matchVendor && !matchOrder && !matchFlw) return false;
    }

    // Status filter
    if (statusFilter && statusFilter !== 'ALL') {
      if (o.payout_status !== statusFilter) return false;
    }

    // Date range filter
    if (startDate) {
      if (new Date(o.created_at) < new Date(startDate)) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(o.created_at) > end) return false;
    }

    return true;
  });

  // Group Filtered Orders by Vendor
  const vendorSummariesMap = new Map<string, VendorSettlementSummary>();

  filteredOrders.forEach((o) => {
    const gross = parseFloat(o.gross_amount || '0');
    const comm = gross * (commissionRate / 100);
    const net = gross - comm;

    if (!vendorSummariesMap.has(o.vendor_id)) {
      const bankDetails = getVendorBankDetails(o.vendor_id);
      vendorSummariesMap.set(o.vendor_id, {
        vendor_id: o.vendor_id,
        vendor_name: o.vendor_name,
        payout_account: bankDetails,
        order_count: 1,
        total_gross_amount: gross.toString(),
        total_commission_fee: comm.toString(),
        total_net_payout_amount: net.toString(),
        orders: [o],
        has_valid_payout_account: !!(bankDetails && bankDetails.account_number && bankDetails.bank_code),
      });
    } else {
      const existing = vendorSummariesMap.get(o.vendor_id)!;
      existing.order_count += 1;
      existing.total_gross_amount = (parseFloat(existing.total_gross_amount) + gross).toString();
      existing.total_commission_fee = (parseFloat(existing.total_commission_fee) + comm).toString();
      existing.total_net_payout_amount = (parseFloat(existing.total_net_payout_amount) + net).toString();
      existing.orders.push(o);
    }
  });

  const vendorSummaries = Array.from(vendorSummariesMap.values());

  // Aggregate Metrics
  const totalReadyVolume = vendorSummaries.reduce((sum, v) => sum + parseFloat(v.total_net_payout_amount), 0);
  const totalCommissionRev = vendorSummaries.reduce((sum, v) => sum + parseFloat(v.total_commission_fee), 0);
  const totalOrdersCount = vendorSummaries.reduce((sum, v) => sum + v.order_count, 0);

  // Generate Flutterwave Bulk Transfer CSV File
  const handleGenerateBulkPayoutFile = () => {
    const readyVendors = vendorSummaries.filter((v) =>
      v.orders.some((o) => o.payout_status === 'READY_FOR_PAYOUT')
    );

    if (readyVendors.length === 0) {
      toast.error('No vendors with "Ready for Payout" orders selected.');
      return;
    }

    // Check for missing bank details
    const invalidVendors = readyVendors.filter((v) => !v.has_valid_payout_account);
    if (invalidVendors.length > 0) {
      toast.error(
        `Cannot generate payout batch! Vendor (${invalidVendors[0].vendor_name}) is missing valid NUBAN bank details.`
      );
      return;
    }

    const batchTimestamp = new Date();
    const batchId = `BATCH-FLW-${batchTimestamp.getFullYear()}${String(batchTimestamp.getMonth() + 1).padStart(2, '0')}${String(batchTimestamp.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
    const filename = `flutterwave_bulk_payout_${batchId}.csv`;

    // Construct Flutterwave Bulk Transfer CSV Headers & Rows
    // Columns: Account Number, Bank Code, Amount, Currency, Narration, Reference, Account Name
    const csvHeaders = ['Account Number', 'Bank Code', 'Amount', 'Currency', 'Narration', 'Reference', 'Account Name'];
    const csvRows = readyVendors.map((v, idx) => {
      const acc = v.payout_account!;
      const netAmount = parseFloat(v.total_net_payout_amount).toFixed(2);
      const narration = `Vendor Settlement - ${v.vendor_name} - ${v.order_count} Orders`;
      const ref = `FLW-SETTLE-${batchId}-${idx + 1}`;

      return [
        `"${acc.account_number}"`,
        `"${acc.bank_code}"`,
        `"${netAmount}"`,
        '"NGN"',
        `"${narration}"`,
        `"${ref}"`,
        `"${acc.account_name}"`,
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);

    // Update Status of Included Orders to "PAYOUT_GENERATED"
    const readyOrderIds = new Set<string>();
    readyVendors.forEach((v) => {
      v.orders.forEach((o) => {
        if (o.payout_status === 'READY_FOR_PAYOUT') {
          readyOrderIds.add(o.id);
        }
      });
    });

    const updatedOrders = orders.map((o) =>
      readyOrderIds.has(o.id)
        ? { ...o, payout_status: 'PAYOUT_GENERATED' as EscrowPayoutStatus, payout_batch_id: batchId }
        : o
    );
    updateOrdersState(updatedOrders);

    // Record Batch Entry in History Log
    const newBatch: PayoutBatch = {
      id: batchId,
      batch_reference: batchId,
      filename: filename,
      created_at: batchTimestamp.toISOString(),
      vendor_count: readyVendors.length,
      order_count: readyOrderIds.size,
      total_amount: totalReadyVolume.toString(),
      status: 'GENERATED',
      vendor_summaries: readyVendors,
      order_references: Array.from(readyOrderIds),
    };

    updateBatchesState([newBatch, ...batches]);

    toast.success(`Flutterwave Bulk Payout CSV generated! (${readyVendors.length} Vendors, ${readyOrderIds.size} Orders)`);
  };

  // Re-download CSV for an existing batch
  const handleRedownloadBatchCsv = (batch: PayoutBatch) => {
    const csvHeaders = ['Account Number', 'Bank Code', 'Amount', 'Currency', 'Narration', 'Reference', 'Account Name'];
    const csvRows = batch.vendor_summaries.map((v, idx) => {
      const acc = v.payout_account || { account_number: 'N/A', bank_code: 'N/A', account_name: v.vendor_name };
      const netAmount = parseFloat(v.total_net_payout_amount).toFixed(2);
      const narration = `Vendor Settlement - ${v.vendor_name} - ${v.order_count} Orders`;
      const ref = `FLW-SETTLE-${batch.id}-${idx + 1}`;

      return [
        `"${acc.account_number}"`,
        `"${acc.bank_code}"`,
        `"${netAmount}"`,
        '"NGN"',
        `"${narration}"`,
        `"${ref}"`,
        `"${acc.account_name}"`,
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, batch.filename);
    toast.success(`Re-downloaded CSV file for batch ${batch.batch_reference}`);
  };

  // Mark Vendor Orders / Batch as Paid
  const handleMarkAsPaid = (vendorId?: string, batchId?: string) => {
    let updatedOrders = [...orders];

    if (vendorId) {
      updatedOrders = updatedOrders.map((o) =>
        o.vendor_id === vendorId ? { ...o, payout_status: 'PAID' as EscrowPayoutStatus } : o
      );
      toast.success('Vendor orders marked as PAID.');
    } else if (batchId) {
      updatedOrders = updatedOrders.map((o) =>
        o.payout_batch_id === batchId ? { ...o, payout_status: 'PAID' as EscrowPayoutStatus } : o
      );
      const updatedBatches = batches.map((b) => (b.id === batchId ? { ...b, status: 'PAID' as const } : b));
      updateBatchesState(updatedBatches);
      toast.success(`Batch ${batchId} marked as PAID.`);
    }

    updateOrdersState(updatedOrders);
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val || '0') : val;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(num);
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Escrow Payouts & Vendor Settlements</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Page Title & Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={titleStyles}>Escrow Payouts & Vendor Settlements</h2>
          <p style={subtitleStyles}>
            Reconcile completed escrow sales, calculate platform commissions, and export Flutterwave bulk transfer files.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleGenerateBulkPayoutFile}
          style={generateBtnStyles}
        >
          ⚡ Generate Flutterwave Bulk Payout File
        </button>
      </div>

      {/* Tabs */}
      <div style={tabBarStyles}>
        <button
          type="button"
          onClick={() => setActiveTab('SETTLEMENTS')}
          style={tabItemStyles(activeTab === 'SETTLEMENTS')}
        >
          🏦 Ready Settlements & Vendors ({vendorSummaries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          style={tabItemStyles(activeTab === 'HISTORY')}
        >
          📜 Payout Batch History Log ({batches.length})
        </button>
      </div>

      {activeTab === 'SETTLEMENTS' ? (
        <>
          {/* Summary Metric Cards */}
          <div style={metricsGridStyles}>
            <div style={metricCardStyles}>
              <span style={metricLabelStyles}>Total Ready Payout Volume</span>
              <span style={metricValStyles}>{formatCurrency(totalReadyVolume)}</span>
              <span style={metricSubtextStyles}>Net payable after platform fees</span>
            </div>
            <div style={metricCardStyles}>
              <span style={metricLabelStyles}>Vendors Owed Settlement</span>
              <span style={metricValStyles}>{vendorSummaries.length}</span>
              <span style={metricSubtextStyles}>Merchants with ready orders</span>
            </div>
            <div style={metricCardStyles}>
              <span style={metricLabelStyles}>Delivered Orders Count</span>
              <span style={metricValStyles}>{totalOrdersCount}</span>
              <span style={metricSubtextStyles}>Confirmed buyer receipts</span>
            </div>
            <div style={metricCardStyles}>
              <span style={metricLabelStyles}>Platform Commission Revenue</span>
              <span style={{ ...metricValStyles, color: '#10b981' }}>{formatCurrency(totalCommissionRev)}</span>
              <span style={metricSubtextStyles}>Dovi platform share ({commissionRate}%)</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={filterBarCardStyles}>
            <div style={filterGridStyles}>
              {/* Search Vendor / Order */}
              <div style={filterItemStyles}>
                <label style={filterLabelStyles}>Search Vendor / Ref</label>
                <input
                  type="text"
                  placeholder="Vendor name or Order Ref..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  style={filterInputStyles}
                />
              </div>

              {/* Status Filter */}
              <div style={filterItemStyles}>
                <label style={filterLabelStyles}>Payout Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={filterSelectStyles}
                >
                  <option value="READY_FOR_PAYOUT">Ready for Payout</option>
                  <option value="PAYOUT_GENERATED">Payout File Generated</option>
                  <option value="PAID">Fully Paid</option>
                  <option value="ALL">All Payout Statuses</option>
                </select>
              </div>

              {/* Date Range Start */}
              <div style={filterItemStyles}>
                <label style={filterLabelStyles}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={filterInputStyles}
                />
              </div>

              {/* Date Range End */}
              <div style={filterItemStyles}>
                <label style={filterLabelStyles}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={filterInputStyles}
                />
              </div>

              {/* Commission Rate */}
              <div style={{ ...filterItemStyles, maxWidth: '120px' }}>
                <label style={filterLabelStyles}>Fee Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  style={filterInputStyles}
                />
              </div>
            </div>
          </div>

          {/* Vendor Settlements Table */}
          {vendorSummaries.length === 0 ? (
            <EmptyState
              icon="💸"
              title="No Ready Vendor Settlements"
              subtitle="No delivered orders matching your search and filter criteria."
            />
          ) : (
            <div style={tableCardStyles}>
              <div style={tableWrapperStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={{ ...tableHeaderCellStyles, width: '30px' }} />
                      <th style={tableHeaderCellStyles}>Vendor Name</th>
                      <th style={tableHeaderCellStyles}>Bank Account Name</th>
                      <th style={tableHeaderCellStyles}>Bank Name & Code</th>
                      <th style={tableHeaderCellStyles}>NUBAN Number</th>
                      <th style={tableHeaderCellStyles}>Orders</th>
                      <th style={tableHeaderCellStyles}>Gross Sales</th>
                      <th style={tableHeaderCellStyles}>Commission ({commissionRate}%)</th>
                      <th style={tableHeaderCellStyles}>Net Payout</th>
                      <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorSummaries.map((v) => {
                      const isExpanded = expandedVendorIds.has(v.vendor_id);
                      const acc = v.payout_account;

                      return (
                        <Fragment key={v.vendor_id}>
                          <tr style={tableRowStyles}>
                            <td style={tableCellStyles}>
                              <button
                                type="button"
                                onClick={() => toggleVendorExpand(v.vendor_id)}
                                style={toggleExpandBtnStyles}
                              >
                                {isExpanded ? '▼' : '▶'}
                              </button>
                            </td>
                            <td style={{ ...tableCellStyles, fontWeight: 700 }}>{v.vendor_name}</td>
                            <td style={tableCellStyles}>{acc?.account_name || <span style={unconfiguredWarnStyles}>⚠️ Unconfigured</span>}</td>
                            <td style={tableCellStyles}>
                              {acc ? `${acc.bank_name} (${acc.bank_code})` : <span style={unconfiguredWarnStyles}>N/A</span>}
                            </td>
                            <td style={{ ...tableCellStyles, fontFamily: 'monospace', fontWeight: 700 }}>
                              {acc?.account_number || 'N/A'}
                            </td>
                            <td style={tableCellStyles}>
                              <span style={orderBadgeStyles}>{v.order_count} Orders</span>
                            </td>
                            <td style={tableCellStyles}>{formatCurrency(v.total_gross_amount)}</td>
                            <td style={{ ...tableCellStyles, color: '#ef4444' }}>-{formatCurrency(v.total_commission_fee)}</td>
                            <td style={{ ...tableCellStyles, fontWeight: 800, color: '#1f2937', fontSize: '14px' }}>
                              {formatCurrency(v.total_net_payout_amount)}
                            </td>
                            <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleMarkAsPaid(v.vendor_id)}
                                style={markPaidBtnStyles}
                              >
                                Mark Paid
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Included Orders Table Drawer */}
                          {isExpanded && (
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                              <td colSpan={10} style={{ padding: '16px 24px', borderBottom: '2px solid #e5e7eb' }}>
                                <h4 style={drawerTitleStyles}>
                                  📋 Included Delivered Orders for {v.vendor_name} ({v.orders.length} items)
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '12px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                      <th style={drawerThStyles}>Order Ref</th>
                                      <th style={drawerThStyles}>Flutterwave Txn Ref</th>
                                      <th style={drawerThStyles}>Order Date</th>
                                      <th style={drawerThStyles}>Delivery Status</th>
                                      <th style={drawerThStyles}>Gross Amount</th>
                                      <th style={drawerThStyles}>Net Payout</th>
                                      <th style={drawerThStyles}>Payout Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {v.orders.map((o) => (
                                      <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ ...drawerTdStyles, fontWeight: 700, color: '#ff7a00' }}>{o.order_reference}</td>
                                        <td style={{ ...drawerTdStyles, fontFamily: 'monospace' }}>{o.flw_transaction_ref}</td>
                                        <td style={drawerTdStyles}>{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td style={drawerTdStyles}>
                                          <span style={deliveryBadgeStyles}>{o.order_status}</span>
                                        </td>
                                        <td style={drawerTdStyles}>{formatCurrency(o.gross_amount)}</td>
                                        <td style={{ ...drawerTdStyles, fontWeight: 700 }}>{formatCurrency(o.net_payout_amount)}</td>
                                        <td style={drawerTdStyles}>
                                          <span style={payoutStatusBadgeStyles(o.payout_status)}>{o.payout_status}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* TAB 2: PAYOUT BATCH HISTORY LOG */
        <div>
          {batches.length === 0 ? (
            <EmptyState
              icon="📜"
              title="No Payout Batches Generated"
              subtitle="Generate your first Flutterwave bulk payout file to start tracking historical settlement batches."
            />
          ) : (
            <div style={tableCardStyles}>
              <div style={tableWrapperStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr style={tableHeaderRowStyles}>
                      <th style={tableHeaderCellStyles}>Batch Reference</th>
                      <th style={tableHeaderCellStyles}>Date Generated</th>
                      <th style={tableHeaderCellStyles}>Vendors Count</th>
                      <th style={tableHeaderCellStyles}>Orders Count</th>
                      <th style={tableHeaderCellStyles}>Total Batch Volume</th>
                      <th style={tableHeaderCellStyles}>Batch Status</th>
                      <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id} style={tableRowStyles}>
                        <td style={{ ...tableCellStyles, fontWeight: 700, fontFamily: 'monospace' }}>{b.batch_reference}</td>
                        <td style={tableCellStyles}>{new Date(b.created_at).toLocaleString()}</td>
                        <td style={tableCellStyles}>{b.vendor_count} Vendors</td>
                        <td style={tableCellStyles}>{b.order_count} Orders</td>
                        <td style={{ ...tableCellStyles, fontWeight: 800 }}>{formatCurrency(b.total_amount)}</td>
                        <td style={tableCellStyles}>
                          <span style={batchStatusBadgeStyles(b.status)}>{b.status}</span>
                        </td>
                        <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRedownloadBatchCsv(b)}
                              style={downloadBatchBtnStyles}
                            >
                              📥 Re-download CSV
                            </button>
                            {b.status !== 'PAID' && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsPaid(undefined, b.id)}
                                style={markPaidBtnStyles}
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedBatch(b)}
                              style={inspectBatchBtnStyles}
                            >
                              Inspect
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
      )}

      {/* Batch Inspection Modal */}
      {selectedBatch && (
        <div style={modalBackdropStyles}>
          <div style={modalContentStyles}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>Payout Batch Details ({selectedBatch.batch_reference})</h3>
              <button type="button" onClick={() => setSelectedBatch(null)} style={closeBtnStyles}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={modalDetailRowStyles}>
                <span>Generated Date:</span>
                <strong>{new Date(selectedBatch.created_at).toLocaleString()}</strong>
              </div>
              <div style={modalDetailRowStyles}>
                <span>Total Vendors Included:</span>
                <strong>{selectedBatch.vendor_count} Vendors</strong>
              </div>
              <div style={modalDetailRowStyles}>
                <span>Total Payout Volume:</span>
                <strong style={{ color: '#ff7a00', fontSize: '15px' }}>{formatCurrency(selectedBatch.total_amount)}</strong>
              </div>

              <h4 style={{ margin: '12px 0 4px 0', fontSize: '13px', fontWeight: 800 }}>Vendors Included in Batch:</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' }}>
                {selectedBatch.vendor_summaries.map((v) => (
                  <div key={v.vendor_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span>{v.vendor_name} ({v.payout_account?.bank_name})</span>
                    <strong>{formatCurrency(v.total_net_payout_amount)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => handleRedownloadBatchCsv(selectedBatch)} style={downloadBatchBtnStyles}>
                📥 Re-download CSV File
              </button>
              <button type="button" onClick={() => setSelectedBatch(null)} style={modalCloseBtnStyles}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens & Helpers
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
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

const generateBtnStyles: React.CSSProperties = {
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  border: 'none',
  padding: '10px 18px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
};

const tabBarStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  borderBottom: '2px solid #e5e7eb',
};

const tabItemStyles = (active: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 700,
  color: active ? '#ff7a00' : '#6b7280',
  borderBottom: active ? '3px solid #ff7a00' : '3px solid transparent',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
});

const metricsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
};

const metricCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const metricLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
};

const metricValStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
};

const metricSubtextStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const filterBarCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid #e5e7eb',
};

const filterGridStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  alignItems: 'center',
};

const filterItemStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1,
  minWidth: '160px',
};

const filterLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
};

const filterInputStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
};

const filterSelectStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const tableCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '2px solid #f3f4f6',
  backgroundColor: '#fafafa',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
};

const tableCellStyles: React.CSSProperties = {
  padding: '14px 16px',
  color: '#374151',
};

const toggleExpandBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '12px',
  cursor: 'pointer',
  color: '#6b7280',
};

const unconfiguredWarnStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#ef4444',
  fontWeight: 600,
};

const orderBadgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '2px 8px',
  borderRadius: '4px',
};

const markPaidBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const downloadBatchBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  backgroundColor: '#1f2937',
  color: '#ffffff',
  border: 'none',
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const inspectBatchBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  backgroundColor: 'transparent',
  border: '1px solid #d1d5db',
  color: '#374151',
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const drawerTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 700,
  color: '#1f2937',
};

const drawerThStyles: React.CSSProperties = {
  padding: '8px 12px',
  fontWeight: 700,
  color: '#4b5563',
};

const drawerTdStyles: React.CSSProperties = {
  padding: '8px 12px',
};

const deliveryBadgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: '#d1fae5',
  color: '#065f46',
  padding: '2px 6px',
  borderRadius: '4px',
};

const payoutStatusBadgeStyles = (status: string): React.CSSProperties => {
  let bg = '#fef3c7';
  let color = '#92400e';
  if (status === 'PAYOUT_GENERATED') {
    bg = '#e0f2fe';
    color = '#0369a1';
  } else if (status === 'PAID') {
    bg = '#d1fae5';
    color = '#065f46';
  }
  return {
    backgroundColor: bg,
    color,
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 700,
  };
};

const batchStatusBadgeStyles = (status: string): React.CSSProperties => {
  let bg = '#e0f2fe';
  let color = '#0369a1';
  if (status === 'PAID') {
    bg = '#d1fae5';
    color = '#065f46';
  }
  return {
    backgroundColor: bg,
    color,
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
  };
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
  padding: '24px',
  maxWidth: '520px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
  marginBottom: '16px',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const closeBtnStyles: React.CSSProperties = {
  fontSize: '24px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: '#9ca3af',
};

const modalDetailRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
};

const modalCloseBtnStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
};
