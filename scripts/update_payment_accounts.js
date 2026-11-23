const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'backend', 'delivery_store.json'),
  path.join(__dirname, '..', 'admin', 'public', 'delivery_store.json'),
  path.join(__dirname, '..', 'frontend', 'public', 'delivery_store.json')
];

const accounts = [
  {
    id: 'acc-s2o-default',
    account_type: 'save2own',
    bank_name: 'Kuda Microfinance Bank',
    account_name: 'Dovi Save2Own Savings Trust',
    account_number: '5601660874',
    currency: 'NGN',
    is_active: true,
    instructions: 'Transfer the exact savings amount to this dedicated Save2Own account. In your bank transfer narration/description, enter your Save2Own Reference Code. Once the transfer is completed, click "I\'ve Made the Transfer" and submit your details for verification.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-11-22T15:50:00Z'
  },
  {
    id: 'acc-mkt-default',
    account_type: 'marketplace',
    bank_name: 'Zenith Bank',
    account_name: 'Dovi Direct Commerce Limited',
    account_number: '5601660874',
    currency: 'NGN',
    is_active: true,
    instructions: 'Transfer the exact order total to this dedicated DOVI Product Purchase account. In your bank transfer narration or remarks, enter your Order Reference Code. Once transferred, upload your payment receipt below to submit for verification.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-11-22T15:50:00Z'
  }
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    data.paymentAccounts = accounts;
    fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf8');
    console.log('Successfully updated paymentAccounts in:', f);
  }
});
