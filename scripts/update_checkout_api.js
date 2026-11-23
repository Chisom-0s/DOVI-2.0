const fs = require('fs');
const path = require('path');

const filePath = path.resolve('frontend/src/api/checkout.ts');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const target = `  initializeSession: async (payload: {
    delivery_address_id?: string;
    delivery_method_id?: string;
    delivery_method?: string;
    vendor_delivery_selections?: VendorDeliverySelection[];
    delivery_address?: Address | null;
    cart_snapshot?: Cart | null;
    delivery_calculation?: DeliveryCalculationResult;
    destination_state?: string;
    destination_city?: string;
    destination_address?: string;
    recipient_name?: string;
    recipient_phone?: string;
  }): Promise<CheckoutSession> => {
    await syncDeliveryStoreFromServer();`;

const replacement = `  initializeSession: async (payload: {
    delivery_address_id?: string;
    delivery_method_id?: string;
    delivery_method?: string;
    vendor_delivery_selections?: VendorDeliverySelection[];
    delivery_address?: Address | null;
    cart_snapshot?: Cart | null;
    delivery_calculation?: DeliveryCalculationResult;
    destination_state?: string;
    destination_city?: string;
    destination_address?: string;
    recipient_name?: string;
    recipient_phone?: string;
  }): Promise<CheckoutSession> => {
    await syncDeliveryStoreFromServer();

    // Strict validation: Validate mandatory delivery information before creating session
    const recipName = (payload.recipient_name || payload.delivery_address?.full_name || '').trim();
    if (!recipName || recipName.toLowerCase() === 'customer') {
      throw new Error('Please enter your full name.');
    }

    const recipPhone = (payload.recipient_phone || payload.delivery_address?.phone || '').trim();
    const phoneDigits = recipPhone.replace(/[^0-9]/g, '');
    if (!recipPhone || phoneDigits.length < 10) {
      throw new Error('Please enter an active phone number (at least 10 digits).');
    }

    const destState = (payload.destination_state || payload.delivery_address?.state || '').trim();
    if (!destState) {
      throw new Error('Please select your state.');
    }

    const destCity = (payload.destination_city || payload.delivery_address?.city || '').trim();
    if (!destCity) {
      throw new Error('Please select your town.');
    }

    const destAddr = (payload.destination_address || payload.delivery_address?.address_line_1 || '').trim();
    if (!destAddr || destAddr.length < 5) {
      throw new Error('Please enter your complete delivery address.');
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated frontend/src/api/checkout.ts');
} else {
  console.error('Target not found in checkout.ts');
}
