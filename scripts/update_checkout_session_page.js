const fs = require('fs');
const path = require('path');

const filePath = path.resolve('frontend/src/pages/Checkout/CheckoutSessionPage.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add delivery completeness check in fetchSession
const fetchTarget = `      // Check if delivery rates changed since session was created
      const reverify = await checkoutApi.reverifySessionDeliveryPricing(sess);
      const effectiveSess = reverify.changed ? reverify.updatedSession : sess;
      if (reverify.changed) {
        setSession(reverify.updatedSession);
        setRateChangeAlert({
          previousFee: reverify.previousFee,
          newFee: reverify.newFee,
          newTotal: reverify.updatedSession.total,
          acknowledged: false,
        });
      } else {
        setSession(sess);
      }

      setBankAccount(account);`;

const fetchReplacement = `      // Check if delivery rates changed since session was created
      const reverify = await checkoutApi.reverifySessionDeliveryPricing(sess);
      const effectiveSess = reverify.changed ? reverify.updatedSession : sess;

      // Access Control: Validate that required delivery information exists before allowing payment page access
      const recipName = (effectiveSess.delivery_address?.full_name || (effectiveSess as any).recipient_name || '').trim();
      const recipPhone = (effectiveSess.delivery_address?.phone || (effectiveSess as any).recipient_phone || '').trim();
      const cleanPhone = recipPhone.replace(/[^0-9]/g, '');
      const dState = (effectiveSess.delivery_address?.state || (effectiveSess as any).destination_state || effectiveSess.delivery_calculation?.destination_state || '').trim();
      const dCity = (effectiveSess.delivery_address?.city || (effectiveSess as any).destination_city || effectiveSess.delivery_calculation?.destination_city || '').trim();
      const dAddr = (effectiveSess.delivery_address?.address_line_1 || (effectiveSess as any).destination_address || '').trim();

      if (!recipName || recipName.toLowerCase() === 'customer' || !recipPhone || cleanPhone.length < 10 || !dState || !dCity || dAddr.length < 5) {
        toast.error('Please complete all mandatory delivery information before accessing the payment page.');
        navigate('/checkout', { replace: true });
        return;
      }

      if (reverify.changed) {
        setSession(reverify.updatedSession);
        setRateChangeAlert({
          previousFee: reverify.previousFee,
          newFee: reverify.newFee,
          newTotal: reverify.updatedSession.total,
          acknowledged: false,
        });
      } else {
        setSession(sess);
      }

      setBankAccount(account);`;

if (content.includes(fetchTarget)) {
  content = content.replace(fetchTarget, fetchReplacement);
  console.log('1. Added delivery completeness access control in CheckoutSessionPage.tsx');
} else {
  console.error('fetchTarget not found');
}

// 2. Require receipt upload in handleSubmitEvidence
const submitTarget = `    if (!receiptPreview) {
      toast.error('Please upload a screenshot or photo of your transfer receipt.');
      return;
    }`;

const submitReplacement = `    if (!receiptPreview && !receiptFile) {
      toast.error('Payment receipt upload is required. Please upload your transfer receipt before submitting.');
      return;
    }`;

if (content.includes(submitTarget)) {
  content = content.replace(submitTarget, submitReplacement);
  console.log('2. Updated receipt error message in handleSubmitEvidence');
} else {
  console.error('submitTarget not found');
}

// 3. Ensure uploadedProofUrl check before calling submitPaymentEvidence
const uploadCheckTarget = `      // Submit payment evidence (linking to payment_session_id)
      await paymentsApi.submitPaymentEvidence({`;

const uploadCheckReplacement = `      if (!uploadedProofUrl || !uploadedProofUrl.trim()) {
        toast.error('Payment receipt upload is required. Please upload your transfer receipt before submitting.');
        setIsSubmitting(false);
        return;
      }

      // Submit payment evidence (linking to payment_session_id)
      await paymentsApi.submitPaymentEvidence({`;

if (content.includes(uploadCheckTarget)) {
  content = content.replace(uploadCheckTarget, uploadCheckReplacement);
  console.log('3. Added uploadedProofUrl enforcement before submitting payment evidence');
} else {
  console.error('uploadCheckTarget not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated CheckoutSessionPage.tsx successfully!');
