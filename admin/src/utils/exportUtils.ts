import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
} from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { User, Payment } from '@/types';

// ============================================================
// USER EXPORT FUNCTIONS
// ============================================================

/**
 * Export Users list to PDF document
 */
export const exportUsersToPdf = (users: User[], filename = 'dovi-users-report.pdf') => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();

  // Header Title & Branding
  doc.setFontSize(18);
  doc.setTextColor(255, 122, 0); // Dovi primary orange
  doc.text('DOVI 2.0 - ADMIN USER REPORT', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${timestamp}  |  Total Records: ${users.length}`, 14, 28);

  // Table Columns & Rows
  const tableHeaders = [['Full Name', 'Email Address', 'Phone', 'Role', 'Status', 'Joined Date']];
  const tableData = users.map((u) => [
    `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A',
    u.email || 'N/A',
    u.phone || 'N/A',
    u.role || 'BUYER',
    u.status || 'ACTIVE',
    u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A',
  ]);

  autoTable(doc, {
    startY: 34,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(filename);
};

/**
 * Export Users list to Word DOCX document
 */
export const exportUsersToDocx = async (users: User[], filename = 'dovi-users-report.docx') => {
  const timestamp = new Date().toLocaleString();

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: ['Full Name', 'Email Address', 'Phone', 'Role', 'Status', 'Joined Date'].map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
          shading: { fill: '1F2937' },
          width: { size: 16, type: WidthType.PERCENTAGE },
        })
    ),
  });

  const dataRows = users.map(
    (u, idx) =>
      new TableRow({
        children: [
          `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A',
          u.email || 'N/A',
          u.phone || 'N/A',
          u.role || 'BUYER',
          u.status || 'ACTIVE',
          u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A',
        ].map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text, size: 18 })],
                }),
              ],
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' },
              width: { size: 16, type: WidthType.PERCENTAGE },
            })
        ),
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'DOVI 2.0 - ADMIN USER REPORT',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Generated on: ${timestamp} | Total Records: ${users.length}`, color: '64748B' }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeaderRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};

// ============================================================
// TRANSACTION EXPORT FUNCTIONS
// ============================================================

/**
 * Export Transactions list to PDF document
 */
export const exportTransactionsToPdf = (payments: Payment[], filename = 'dovi-transactions-report.pdf') => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();

  const totalSum = payments.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);
  const formattedSum = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalSum);

  // Title & Header Information
  doc.setFontSize(18);
  doc.setTextColor(255, 122, 0); // Dovi primary orange
  doc.text('DOVI 2.0 - TRANSACTION RECORDS REPORT', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${timestamp}  |  Total Count: ${payments.length}  |  Volume: ${formattedSum}`, 14, 28);

  const tableHeaders = [['Payment Ref', 'Order Ref', 'Gateway', 'Amount', 'Date Initiated', 'Status']];
  const tableData = payments.map((p) => [
    p.reference || 'N/A',
    p.order_reference || 'N/A',
    p.provider ? p.provider.toUpperCase() : 'N/A',
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: p.currency || 'NGN' }).format(parseFloat(p.amount || '0')),
    p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A',
    p.status || 'PENDING',
  ]);

  autoTable(doc, {
    startY: 34,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(filename);
};

/**
 * Export Transactions list to Word DOCX document
 */
export const exportTransactionsToDocx = async (payments: Payment[], filename = 'dovi-transactions-report.docx') => {
  const timestamp = new Date().toLocaleString();
  const totalSum = payments.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);
  const formattedSum = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalSum);

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: ['Payment Ref', 'Order Ref', 'Gateway', 'Amount', 'Date Initiated', 'Status'].map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
          shading: { fill: '1F2937' },
          width: { size: 16, type: WidthType.PERCENTAGE },
        })
    ),
  });

  const dataRows = payments.map(
    (p, idx) =>
      new TableRow({
        children: [
          p.reference || 'N/A',
          p.order_reference || 'N/A',
          p.provider ? p.provider.toUpperCase() : 'N/A',
          new Intl.NumberFormat('en-NG', { style: 'currency', currency: p.currency || 'NGN' }).format(parseFloat(p.amount || '0')),
          p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A',
          p.status || 'PENDING',
        ].map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text, size: 18 })],
                }),
              ],
              shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' },
              width: { size: 16, type: WidthType.PERCENTAGE },
            })
        ),
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'DOVI 2.0 - TRANSACTION RECORDS REPORT',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${timestamp} | Count: ${payments.length} | Total Volume: ${formattedSum}`,
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeaderRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};
