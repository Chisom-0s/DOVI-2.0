const fs = require('fs');
const path = require('path');

const filePath = path.resolve('frontend/src/api/payments.ts');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const target = `  submitPaymentEvidence: async (payload: {
    order_reference: string;
    sender_bank: string;
    sender_account_name: string;
    transaction_reference?: string;
    amount: string;
    currency?: string;
    payment_proof_url?: string;
    payment_session_id?: string;
    notes?: string;
  }): Promise<Payment> => {
    // Check local session expiry before submitting`;

const replacement = `  submitPaymentEvidence: async (payload: {
    order_reference: string;
    sender_bank: string;
    sender_account_name: string;
    transaction_reference?: string;
    amount: string;
    currency?: string;
    payment_proof_url?: string;
    payment_session_id?: string;
    notes?: string;
  }): Promise<Payment> => {
    // Strict requirement: Transfer receipt upload is mandatory
    if (!payload.payment_proof_url || !payload.payment_proof_url.trim()) {
      throw new Error('Payment receipt upload is required. Please upload your transfer receipt before submitting payment evidence.');
    }

    // Check local session expiry before submitting`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated frontend/src/api/payments.ts');
} else {
  console.error('Target not found in payments.ts');
}
