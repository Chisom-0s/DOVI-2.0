const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'backend', 'delivery_store.json');
const ADMIN_STORE_PATH = path.join(__dirname, '..', 'admin', 'public', 'delivery_store.json');
const FRONTEND_STORE_PATH = path.join(__dirname, '..', 'frontend', 'public', 'delivery_store.json');

const raw = fs.readFileSync(STORE_PATH, 'utf8');
const store = JSON.parse(raw);

console.log('Existing products:', store.products ? store.products.length : 0);

const users = [
  {
    id: 'usr_admin_1',
    email: 'admin@dovi.com',
    first_name: 'DOVI',
    last_name: 'Administrator',
    role: 'ADMIN',
    phone: '+2347067402413',
    status: 'ACTIVE',
    is_active: true,
    is_staff: true,
    is_email_verified: true,
    date_joined: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    orders_count: 0
  },
  {
    id: 'usr_buyer_1',
    email: 'chinedu.okafor@gmail.com',
    first_name: 'Chinedu',
    last_name: 'Okafor',
    role: 'BUYER',
    phone: '+2348031234567',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-10T10:15:00Z',
    created_at: '2026-02-10T10:15:00Z',
    profile: {
      phone_number: '+2348031234567',
      address_line_1: '14 Allen Avenue',
      city: 'Ikeja',
      state: 'Lagos',
      country: 'Nigeria'
    },
    orders_count: 3
  },
  {
    id: 'usr_buyer_2',
    email: 'aisha.bello@yahoo.com',
    first_name: 'Aisha',
    last_name: 'Bello',
    role: 'BUYER',
    phone: '+2348123456789',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-14T14:30:00Z',
    created_at: '2026-02-14T14:30:00Z',
    profile: {
      phone_number: '+2348123456789',
      address_line_1: 'Plot 402 Aminu Kano Crescent',
      city: 'Wuse 2',
      state: 'Abuja (FCT)',
      country: 'Nigeria'
    },
    orders_count: 2
  },
  {
    id: 'usr_buyer_3',
    email: 'emeka.nwosu@gmail.com',
    first_name: 'Emeka',
    last_name: 'Nwosu',
    role: 'BUYER',
    phone: '+2348098765432',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-18T09:20:00Z',
    created_at: '2026-02-18T09:20:00Z',
    profile: {
      phone_number: '+2348098765432',
      address_line_1: '8 Aba Road',
      city: 'Port Harcourt',
      state: 'Rivers',
      country: 'Nigeria'
    },
    orders_count: 1
  },
  {
    id: 'usr_buyer_4',
    email: 'olumide.adebayo@gmail.com',
    first_name: 'Olumide',
    last_name: 'Adebayo',
    role: 'BUYER',
    phone: '+2348023456781',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-20T11:45:00Z',
    created_at: '2026-02-20T11:45:00Z',
    profile: {
      phone_number: '+2348023456781',
      address_line_1: '25 Admiralty Way',
      city: 'Lekki Phase 1',
      state: 'Lagos',
      country: 'Nigeria'
    },
    orders_count: 2
  },
  {
    id: 'usr_buyer_5',
    email: 'fatima.m@outlook.com',
    first_name: 'Fatima',
    last_name: 'Mohammed',
    role: 'BUYER',
    phone: '+2348145678901',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-21T16:00:00Z',
    created_at: '2026-02-21T16:00:00Z',
    profile: {
      phone_number: '+2348145678901',
      address_line_1: '12 Garki Area 2',
      city: 'Garki',
      state: 'Abuja (FCT)',
      country: 'Nigeria'
    },
    orders_count: 1
  },
  {
    id: 'usr_buyer_6',
    email: 'ngozi.eze@gmail.com',
    first_name: 'Ngozi',
    last_name: 'Eze',
    role: 'BUYER',
    phone: '+2348056789123',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-22T13:10:00Z',
    created_at: '2026-02-22T13:10:00Z',
    profile: {
      phone_number: '+2348056789123',
      address_line_1: '5 Ogui Road',
      city: 'Enugu',
      state: 'Enugu',
      country: 'Nigeria'
    },
    orders_count: 0
  },
  {
    id: 'usr_buyer_7',
    email: 'babatunde.alabi@gmail.com',
    first_name: 'Babatunde',
    last_name: 'Alabi',
    role: 'BUYER',
    phone: '+2348187654321',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-23T08:50:00Z',
    created_at: '2026-02-23T08:50:00Z',
    profile: {
      phone_number: '+2348187654321',
      address_line_1: '19 Adeniran Ogunsanya',
      city: 'Surulere',
      state: 'Lagos',
      country: 'Nigeria'
    },
    orders_count: 1
  },
  {
    id: 'usr_buyer_8',
    email: 'halima.ibrahim@yahoo.com',
    first_name: 'Halima',
    last_name: 'Ibrahim',
    role: 'BUYER',
    phone: '+2348076543210',
    status: 'SUSPENDED',
    is_active: false,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-24T12:00:00Z',
    created_at: '2026-02-24T12:00:00Z',
    profile: {
      phone_number: '+2348076543210',
      address_line_1: '32 Independence Way',
      city: 'Kaduna',
      state: 'Kaduna',
      country: 'Nigeria'
    },
    orders_count: 0
  },
  {
    id: 'usr_vendor_1',
    email: 'store@dovi.com',
    first_name: 'DOVI Official',
    last_name: 'Store',
    role: 'VENDOR',
    phone: '+2347067402413',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-01-05T00:00:00Z',
    created_at: '2026-01-05T00:00:00Z',
    vendor_status: 'APPROVED',
    profile: {
      phone_number: '+2347067402413',
      vendor_status: 'APPROVED',
      business_name: 'DOVI Official Store',
      city: 'Ikeja',
      state: 'Lagos'
    },
    orders_count: 15
  },
  {
    id: 'usr_vendor_2',
    email: 'techzone@gmail.com',
    first_name: 'TechZone',
    last_name: 'Gadgets Ltd',
    role: 'VENDOR',
    phone: '+2348091122334',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-01T10:00:00Z',
    created_at: '2026-02-01T10:00:00Z',
    vendor_status: 'APPROVED',
    profile: {
      phone_number: '+2348091122334',
      vendor_status: 'APPROVED',
      business_name: 'TechZone Gadgets Ltd',
      city: 'Computer Village, Ikeja',
      state: 'Lagos'
    },
    orders_count: 8
  },
  {
    id: 'usr_vendor_3',
    email: 'apexappliances@gmail.com',
    first_name: 'Apex',
    last_name: 'Appliances',
    role: 'VENDOR',
    phone: '+2348035544332',
    status: 'ACTIVE',
    is_active: true,
    is_staff: false,
    is_email_verified: true,
    date_joined: '2026-02-24T15:30:00Z',
    created_at: '2026-02-24T15:30:00Z',
    vendor_status: 'PENDING',
    profile: {
      phone_number: '+2348035544332',
      vendor_status: 'PENDING',
      business_name: 'Apex Appliances Nigeria',
      city: 'Alaba International Market',
      state: 'Lagos'
    },
    orders_count: 0
  }
];

const orders = [
  {
    id: 'DOV-2026-8801',
    reference: 'DOV-2026-8801',
    customer: {
      id: 'usr_buyer_1',
      email: 'chinedu.okafor@gmail.com',
      first_name: 'Chinedu',
      last_name: 'Okafor',
      phone: '+2348031234567'
    },
    status: 'IN_FULFILMENT',
    payment_status: 'PAID',
    payment_method: 'BANK_TRANSFER',
    delivery_fee: '2500.00',
    total_amount: '22500.00',
    created_at: '2026-02-23T10:30:00Z',
    delivery_address: '14 Allen Avenue, Ikeja, Lagos',
    destination_city: 'Ikeja',
    destination_state: 'Lagos',
    items: [
      {
        id: 'item-8801-1',
        product: {
          id: '7a16b38e-6767-4d3e-b95e-1ea5e5df233e',
          name: 'Vintage clipper with timer',
          base_price: '20000.00',
          primary_image_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/7a16b38e-6767-4d3e-b95e-1ea5e5df233e/thumbnail/thumb_be42c237.jpg'
        },
        quantity: 1,
        unit_price: '20000.00',
        line_total: '20000.00'
      }
    ]
  },
  {
    id: 'DOV-2026-8802',
    reference: 'DOV-2026-8802',
    customer: {
      id: 'usr_buyer_2',
      email: 'aisha.bello@yahoo.com',
      first_name: 'Aisha',
      last_name: 'Bello',
      phone: '+2348123456789'
    },
    status: 'AWAITING_PAYMENT',
    payment_status: 'PENDING_VERIFICATION',
    payment_method: 'BANK_TRANSFER',
    delivery_fee: '2000.00',
    total_amount: '15500.00',
    created_at: '2026-02-24T14:15:00Z',
    delivery_address: 'Plot 402 Aminu Kano Crescent, Wuse 2, Abuja (FCT)',
    destination_city: 'Wuse 2',
    destination_state: 'Abuja (FCT)',
    items: [
      {
        id: 'item-8802-1',
        product: {
          id: '303d5c30-e0a3-40f9-9502-20fd5c7b0d63',
          name: 'Rechargeable fan',
          base_price: '13500.00',
          primary_image_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/303d5c30-e0a3-40f9-9502-20fd5c7b0d63/thumbnail/thumb_1e277a80.jpg'
        },
        quantity: 1,
        unit_price: '13500.00',
        line_total: '13500.00'
      }
    ]
  },
  {
    id: 'DOV-2026-8803',
    reference: 'DOV-2026-8803',
    customer: {
      id: 'usr_buyer_3',
      email: 'emeka.nwosu@gmail.com',
      first_name: 'Emeka',
      last_name: 'Nwosu',
      phone: '+2348098765432'
    },
    status: 'DELIVERED',
    payment_status: 'PAID',
    payment_method: 'BANK_TRANSFER',
    delivery_fee: '2500.00',
    total_amount: '32500.00',
    created_at: '2026-02-21T09:00:00Z',
    delivery_address: '8 Aba Road, Port Harcourt, Rivers',
    destination_city: 'Port Harcourt',
    destination_state: 'Rivers',
    items: [
      {
        id: 'item-8803-1',
        product: {
          id: '1c9f0f9d-4ede-4c28-b172-291c3666eabe',
          name: 'Underwear hanger',
          base_price: '30000.00',
          primary_image_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/1c9f0f9d-4ede-4c28-b172-291c3666eabe/thumbnail/thumb_66c3b49f.jpg'
        },
        quantity: 1,
        unit_price: '30000.00',
        line_total: '30000.00'
      }
    ]
  },
  {
    id: 'DOV-2026-8804',
    reference: 'DOV-2026-8804',
    customer: {
      id: 'usr_buyer_4',
      email: 'olumide.adebayo@gmail.com',
      first_name: 'Olumide',
      last_name: 'Adebayo',
      phone: '+2348023456781'
    },
    status: 'ORDER_PLACED',
    payment_status: 'PENDING_VERIFICATION',
    payment_method: 'BANK_TRANSFER',
    delivery_fee: '2000.00',
    total_amount: '8000.00',
    created_at: '2026-02-25T08:30:00Z',
    delivery_address: '25 Admiralty Way, Lekki Phase 1, Lagos',
    destination_city: 'Lekki Phase 1',
    destination_state: 'Lagos',
    items: [
      {
        id: 'item-8804-1',
        product: {
          id: '5377d1b8-681f-4287-81d9-9bf5166710b1',
          name: 'Selfie ring light',
          base_price: '6000.00',
          primary_image_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/5377d1b8-681f-4287-81d9-9bf5166710b1/thumbnail/thumb_b7ee8606.jpg'
        },
        quantity: 1,
        unit_price: '6000.00',
        line_total: '6000.00'
      }
    ]
  },
  {
    id: 'DOV-2026-8805',
    reference: 'DOV-2026-8805',
    customer: {
      id: 'usr_buyer_5',
      email: 'fatima.m@outlook.com',
      first_name: 'Fatima',
      last_name: 'Mohammed',
      phone: '+2348145678901'
    },
    status: 'CONFIRMED',
    payment_status: 'PAID',
    payment_method: 'BANK_TRANSFER',
    delivery_fee: '2000.00',
    total_amount: '13800.00',
    created_at: '2026-02-22T14:40:00Z',
    delivery_address: '12 Garki Area 2, Garki, Abuja (FCT)',
    destination_city: 'Garki',
    destination_state: 'Abuja (FCT)',
    items: [
      {
        id: 'item-8805-1',
        product: {
          id: '9416fc60-6406-4a31-8034-5eae9fdbbbc2',
          name: 'Waist trainer',
          base_price: '11800.00',
          primary_image_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/9416fc60-6406-4a31-8034-5eae9fdbbbc2/thumbnail/thumb_990c22d9.jpg'
        },
        quantity: 1,
        unit_price: '11800.00',
        line_total: '11800.00'
      }
    ]
  }
];

const payments = [
  {
    id: 'pay-dov-8801',
    reference: 'PAY-DOV-2026-8801-7A',
    order_id: 'DOV-2026-8801',
    order_reference: 'DOV-2026-8801',
    provider: 'BANK_TRANSFER',
    status: 'PAID',
    amount: '22500.00',
    currency: 'NGN',
    sender_bank: 'Guaranty Trust Bank',
    sender_account_name: 'Chinedu Okafor',
    transaction_reference: 'GTB-TRX-99281726',
    payment_proof_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/7a16b38e-6767-4d3e-b95e-1ea5e5df233e/thumbnail/thumb_be42c237.jpg',
    created_at: '2026-02-23T10:35:00Z',
    verified_at: '2026-02-23T11:00:00Z',
    verified_by: 'DOVI Administrator',
    notes: 'Transfer for Vintage clipper order'
  },
  {
    id: 'pay-dov-8802',
    reference: 'PAY-DOV-2026-8802-9B',
    order_id: 'DOV-2026-8802',
    order_reference: 'DOV-2026-8802',
    provider: 'BANK_TRANSFER',
    status: 'PENDING_VERIFICATION',
    amount: '15500.00',
    currency: 'NGN',
    sender_bank: 'Access Bank',
    sender_account_name: 'Aisha Bello',
    transaction_reference: 'ACC-TRX-44810291',
    payment_proof_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/303d5c30-e0a3-40f9-9502-20fd5c7b0d63/thumbnail/thumb_1e277a80.jpg',
    created_at: '2026-02-24T14:20:00Z',
    verified_at: null,
    verified_by: null,
    notes: 'Paid via GTB mobile app to DOVI Moniepoint account'
  },
  {
    id: 'pay-dov-8803',
    reference: 'PAY-DOV-2026-8803-3C',
    order_id: 'DOV-2026-8803',
    order_reference: 'DOV-2026-8803',
    provider: 'BANK_TRANSFER',
    status: 'PAID',
    amount: '32500.00',
    currency: 'NGN',
    sender_bank: 'Zenith Bank',
    sender_account_name: 'Emeka Nwosu',
    transaction_reference: 'ZEN-TRX-10294857',
    payment_proof_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/1c9f0f9d-4ede-4c28-b172-291c3666eabe/thumbnail/thumb_66c3b49f.jpg',
    created_at: '2026-02-21T09:15:00Z',
    verified_at: '2026-02-21T09:40:00Z',
    verified_by: 'DOVI Administrator',
    notes: 'Payment confirmed for hanger order'
  },
  {
    id: 'pay-dov-8804',
    reference: 'PAY-DOV-2026-8804-1D',
    order_id: 'DOV-2026-8804',
    order_reference: 'DOV-2026-8804',
    provider: 'BANK_TRANSFER',
    status: 'PENDING_VERIFICATION',
    amount: '8000.00',
    currency: 'NGN',
    sender_bank: 'Zenith Bank',
    sender_account_name: 'Olumide Adebayo',
    transaction_reference: 'ZEN-TRX-88291044',
    payment_proof_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/5377d1b8-681f-4287-81d9-9bf5166710b1/thumbnail/thumb_b7ee8606.jpg',
    created_at: '2026-02-25T08:35:00Z',
    verified_at: null,
    verified_by: null,
    notes: 'Transfer submitted for selfie light order'
  },
  {
    id: 'pay-dov-8805',
    reference: 'PAY-DOV-2026-8805-5E',
    order_id: 'DOV-2026-8805',
    order_reference: 'DOV-2026-8805',
    provider: 'BANK_TRANSFER',
    status: 'PAID',
    amount: '13800.00',
    currency: 'NGN',
    sender_bank: 'First Bank of Nigeria',
    sender_account_name: 'Fatima Mohammed',
    transaction_reference: 'FBN-TRX-77382910',
    payment_proof_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/9416fc60-6406-4a31-8034-5eae9fdbbbc2/thumbnail/thumb_990c22d9.jpg',
    created_at: '2026-02-22T14:45:00Z',
    verified_at: '2026-02-22T15:10:00Z',
    verified_by: 'DOVI Administrator',
    notes: 'Transfer verified for waist trainer'
  }
];

const save2ownGoals = [
  {
    id: 's2o-goal-01',
    reference: 'S2O-GOAL-2026-01',
    user_id: 'usr_buyer_1',
    customer_name: 'Chinedu Okafor',
    customer_email: 'chinedu.okafor@gmail.com',
    customer_phone: '+2348031234567',
    product: {
      id: '7a16b38e-6767-4d3e-b95e-1ea5e5df233e',
      name: 'Vintage clipper with timer',
      base_price: '20000.00',
      primary_image_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/7a16b38e-6767-4d3e-b95e-1ea5e5df233e/thumbnail/thumb_be42c237.jpg'
    },
    product_name: 'Vintage clipper with timer',
    quantity: 1,
    status: 'ACTIVE',
    target_amount: '20000.00',
    saved_amount: '15000.00',
    total_contributions: 3,
    start_date: '2026-02-01T00:00:00Z',
    target_date: '2026-03-15T00:00:00Z',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-20T12:00:00Z'
  },
  {
    id: 's2o-goal-02',
    reference: 'S2O-GOAL-2026-02',
    user_id: 'usr_buyer_2',
    customer_name: 'Aisha Bello',
    customer_email: 'aisha.bello@yahoo.com',
    customer_phone: '+2348123456789',
    product: {
      id: '303d5c30-e0a3-40f9-9502-20fd5c7b0d63',
      name: 'Rechargeable fan',
      base_price: '13500.00',
      primary_image_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/303d5c30-e0a3-40f9-9502-20fd5c7b0d63/thumbnail/thumb_1e277a80.jpg'
    },
    product_name: 'Rechargeable fan',
    quantity: 1,
    status: 'COMPLETED',
    target_amount: '13500.00',
    saved_amount: '13500.00',
    total_contributions: 3,
    start_date: '2026-02-05T00:00:00Z',
    target_date: '2026-02-22T00:00:00Z',
    created_at: '2026-02-05T09:00:00Z',
    updated_at: '2026-02-22T17:00:00Z'
  },
  {
    id: 's2o-goal-03',
    reference: 'S2O-GOAL-2026-03',
    user_id: 'usr_buyer_4',
    customer_name: 'Olumide Adebayo',
    customer_email: 'olumide.adebayo@gmail.com',
    customer_phone: '+2348023456781',
    product: {
      id: '1c9f0f9d-4ede-4c28-b172-291c3666eabe',
      name: 'Underwear hanger',
      base_price: '30000.00',
      primary_image_url: 'https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev/product-images/ca901bff-43ad-40c7-a59e-7a8b6fbd7934/1c9f0f9d-4ede-4c28-b172-291c3666eabe/thumbnail/thumb_66c3b49f.jpg'
    },
    product_name: 'Underwear hanger',
    quantity: 1,
    status: 'ACTIVE',
    target_amount: '30000.00',
    saved_amount: '10000.00',
    total_contributions: 2,
    start_date: '2026-02-12T00:00:00Z',
    target_date: '2026-03-30T00:00:00Z',
    created_at: '2026-02-12T11:00:00Z',
    updated_at: '2026-02-24T10:00:00Z'
  }
];

const save2ownContributions = [
  {
    id: 's2o-contrib-01',
    goal_id: 's2o-goal-01',
    amount: '5000.00',
    currency: 'NGN',
    status: 'CONFIRMED',
    payment_method: 'BANK_TRANSFER',
    created_at: '2026-02-01T10:30:00Z'
  },
  {
    id: 's2o-contrib-02',
    goal_id: 's2o-goal-01',
    amount: '5000.00',
    currency: 'NGN',
    status: 'CONFIRMED',
    payment_method: 'BANK_TRANSFER',
    created_at: '2026-02-10T14:00:00Z'
  },
  {
    id: 's2o-contrib-03',
    goal_id: 's2o-goal-01',
    amount: '5000.00',
    currency: 'NGN',
    status: 'CONFIRMED',
    payment_method: 'BANK_TRANSFER',
    created_at: '2026-02-20T12:00:00Z'
  },
  {
    id: 's2o-contrib-04',
    goal_id: 's2o-goal-02',
    amount: '4500.00',
    currency: 'NGN',
    status: 'CONFIRMED',
    payment_method: 'BANK_TRANSFER',
    created_at: '2026-02-05T09:30:00Z'
  },
  {
    id: 's2o-contrib-05',
    goal_id: 's2o-goal-02',
    amount: '4500.00',
    currency: 'NGN',
    status: 'CONFIRMED',
    payment_method: 'BANK_TRANSFER',
    created_at: '2026-02-12T16:00:00Z'
  },
  {
    id: 's2o-contrib-06',
    goal_id: 's2o-goal-02',
    amount: '4500.00',
    currency: 'NGN',
    status: 'CONFIRMED',
    payment_method: 'BANK_TRANSFER',
    created_at: '2026-02-22T17:00:00Z'
  },
  {
    id: 's2o-contrib-07',
    goal_id: 's2o-goal-03',
    amount: '5000.00',
    currency: 'NGN',
    status: 'CONFIRMED',
    payment_method: 'BANK_TRANSFER',
    created_at: '2026-02-12T11:30:00Z'
  },
  {
    id: 's2o-contrib-08',
    goal_id: 's2o-goal-03',
    amount: '5000.00',
    currency: 'NGN',
    status: 'CONFIRMED',
    payment_method: 'BANK_TRANSFER',
    created_at: '2026-02-24T10:00:00Z'
  }
];

const save2ownRefunds = [
  {
    id: 's2o-ref-01',
    goal_id: 's2o-goal-04',
    customer_id: 'usr_buyer_5',
    customer_name: 'Fatima Mohammed',
    customer_email: 'fatima.m@outlook.com',
    amount: '6000.00',
    reason: 'Customer cancelled goal before completion',
    status: 'COMPLETED',
    bank_name: 'First Bank of Nigeria',
    account_number: '3029182736',
    account_name: 'Fatima Mohammed',
    processed_at: '2026-02-21T18:00:00Z',
    created_at: '2026-02-20T14:00:00Z'
  },
  {
    id: 's2o-ref-02',
    goal_id: 's2o-goal-05',
    customer_id: 'usr_buyer_6',
    customer_name: 'Ngozi Eze',
    customer_email: 'ngozi.eze@gmail.com',
    amount: '5000.00',
    reason: 'Emergency withdrawal request',
    status: 'PENDING',
    bank_name: 'Zenith Bank',
    account_number: '2039485716',
    account_name: 'Ngozi Eze',
    processed_at: null,
    created_at: '2026-02-24T11:20:00Z'
  }
];

store.users = users;
store.orders = orders;
store.payments = payments;
store.save2ownGoals = save2ownGoals;
store.save2ownContributions = save2ownContributions;
store.save2ownRefunds = save2ownRefunds;

fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
if (fs.existsSync(ADMIN_STORE_PATH)) {
  fs.writeFileSync(ADMIN_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}
if (fs.existsSync(FRONTEND_STORE_PATH)) {
  fs.writeFileSync(FRONTEND_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

console.log('Successfully seeded authoritative store:');
console.log('Users:', users.length);
console.log('Orders:', orders.length);
console.log('Payments:', payments.length);
console.log('Save2Own Goals:', save2ownGoals.length);
console.log('Save2Own Contributions:', save2ownContributions.length);
console.log('Save2Own Refunds:', save2ownRefunds.length);
