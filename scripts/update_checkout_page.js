const fs = require('fs');
const path = require('path');

const filePath = path.resolve('frontend/src/pages/Checkout/CheckoutPage.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add refs and validation error state
const refsTarget = `  const [customCityMode, setCustomCityMode] = useState(false);
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryCalculationResult | null>(null);`;

const refsReplacement = `  const [customCityMode, setCustomCityMode] = useState(false);
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryCalculationResult | null>(null);

  // Field validation and focus refs for auto-directing
  const stateSelectRef = useRef<HTMLSelectElement>(null);
  const citySelectRef = useRef<HTMLSelectElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const addressSectionRef = useRef<HTMLElement>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };`;

if (!content.includes(refsTarget)) {
  console.error('refsTarget not found');
} else {
  content = content.replace(refsTarget, refsReplacement);
  console.log('1. Added refs and validationErrors state');
}

// 2. Replace handleProceedToPayment with comprehensive field-by-field validation and focus
const proceedTarget = `  // Handle Proceed to Payment Session (when delivery fee is confirmed)
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast('Please sign in or create an account to finalize your order.', { icon: '🔐' });
      navigate('/login', {
        state: { from: '/checkout' },
      });
      return;
    }

    if (!destinationState.trim() || !destinationCity.trim()) {
      toast.error('Please select your delivery destination state and city.');
      return;
    }

    const minSettings = await paymentsApi.getMinimumOrderSettings();
    const subtotalVal = deliveryCalculation ? deliveryCalculation.product_subtotal : Number(cart?.subtotal || 0);
    if (minSettings.enabled && subtotalVal > 0 && subtotalVal < minSettings.minimum_amount) {
      const remaining = minSettings.minimum_amount - subtotalVal;
      toast.error(\`Minimum order subtotal is ₦\${minSettings.minimum_amount.toLocaleString()}. Please add ₦\${remaining.toLocaleString()} more to proceed.\`);
      navigate('/cart');
      return;
    }

    if (!deliveryCalculation || deliveryCalculation.total_delivery_fee === null || deliveryCalculation.requires_manual_quote) {
      toast.error('Delivery fee has not yet been confirmed for this destination. Please arrange delivery via WhatsApp.');
      return;
    }

    const formattedAddress = selectedAddress
      ? \`\${selectedAddress.address_line_1}\${selectedAddress.address_line_2 ? \`, \${selectedAddress.address_line_2}\` : ''}, \${destinationCity}, \${destinationState}\`
      : addrForm.address_line_1
      ? \`\${addrForm.address_line_1}, \${destinationCity}, \${destinationState}\`
      : \`\${destinationCity}, \${destinationState}\`;

    setIsSubmitting(true);
    try {
      const session = await checkoutApi.initializeSession({
        delivery_address_id: selectedAddressId || 'addr_custom',
        delivery_method_id: 'dovi_direct_delivery',
        delivery_method: 'DOVI Direct Delivery',
        destination_state: destinationState,
        destination_city: destinationCity,
        destination_address: formattedAddress,
        recipient_name:
          selectedAddress?.full_name ||
          addrForm.full_name ||
          \`\${user?.first_name || ''} \${user?.last_name || ''}\`.trim() ||
          user?.email ||
          'Customer',
        recipient_phone: selectedAddress?.phone || addrForm.phone || user?.phone_number || '',
        delivery_calculation: deliveryCalculation || undefined,
        cart_snapshot: selectedCartSnapshot,
        delivery_address: selectedAddress || undefined,
      });
      navigate(\`/checkout/\${session.id}\`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initialize checkout session.');
    } finally {
      setIsSubmitting(false);
    }
  };`;

const proceedReplacement = `  // Handle Proceed to Payment Session with strict mandatory field validation
  const handleProceedToPayment = async () => {
    // 1. Authenticated customer identity check
    if (!isAuthenticated) {
      toast('Please sign in or create an account to finalize your order.', { icon: '🔐' });
      navigate('/login', {
        state: { from: '/checkout' },
      });
      return;
    }

    // 2. Cart items check
    if (!effectiveItems || effectiveItems.length === 0) {
      toast.error('Your shopping cart is empty. Please add items before checking out.');
      navigate('/cart');
      return;
    }

    // Clear previous validation errors
    setValidationErrors({});

    // 3. Resolve active delivery recipient details
    let activeAddress = addresses.find((a) => a.id === selectedAddressId);
    let effectiveFullName = (activeAddress?.full_name || addrForm.full_name || \`\${user?.first_name || ''} \${user?.last_name || ''}\`).trim();
    let effectivePhone = (activeAddress?.phone || addrForm.phone || user?.phone_number || '').trim();
    let effectiveState = (destinationState || activeAddress?.state || addrForm.state || '').trim();
    let effectiveCity = (destinationCity || activeAddress?.city || addrForm.city || '').trim();
    let effectiveStreet = (activeAddress?.address_line_1 || addrForm.address_line_1 || '').trim();

    // 4. Validate Full Name
    if (!effectiveFullName || effectiveFullName.toLowerCase() === 'customer') {
      setValidationErrors((p) => ({ ...p, full_name: 'Please enter your full name.' }));
      toast.error('Please enter your full name.');
      if (!showAddForm && addresses.length === 0) setShowAddForm(true);
      setTimeout(() => {
        fullNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fullNameInputRef.current?.focus();
      }, 50);
      return;
    }

    const nameParts = effectiveFullName.split(/\\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      setValidationErrors((p) => ({ ...p, full_name: 'Please enter both your first and last name.' }));
      toast.error('Please enter your first and last name.');
      if (!showAddForm && addresses.length === 0) setShowAddForm(true);
      setTimeout(() => {
        fullNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fullNameInputRef.current?.focus();
      }, 50);
      return;
    }

    // 5. Validate Active Phone Number
    const phoneDigits = effectivePhone.replace(/[^0-9]/g, '');
    if (!effectivePhone) {
      setValidationErrors((p) => ({ ...p, phone: 'Please enter your phone number.' }));
      toast.error('Please enter your phone number.');
      if (!showAddForm && addresses.length === 0) setShowAddForm(true);
      setTimeout(() => {
        phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneInputRef.current?.focus();
      }, 50);
      return;
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setValidationErrors((p) => ({ ...p, phone: 'Please enter a valid active phone number (at least 10 digits).' }));
      toast.error('Please enter a valid active phone number (at least 10 digits).');
      if (!showAddForm && addresses.length === 0) setShowAddForm(true);
      setTimeout(() => {
        phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneInputRef.current?.focus();
      }, 50);
      return;
    }

    // 6. Validate Destination State
    if (!effectiveState) {
      setValidationErrors((p) => ({ ...p, state: 'Please select your state.' }));
      toast.error('Please select your state.');
      setTimeout(() => {
        stateSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        stateSelectRef.current?.focus();
      }, 50);
      return;
    }

    // 7. Validate Destination Town or City
    if (!effectiveCity) {
      setValidationErrors((p) => ({ ...p, city: 'Please select or enter your town or city.' }));
      toast.error('Please select your town.');
      setTimeout(() => {
        if (customCityMode || configuredCitiesForState.length === 0) {
          cityInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cityInputRef.current?.focus();
        } else {
          citySelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          citySelectRef.current?.focus();
        }
      }, 50);
      return;
    }

    // 8. Validate Complete Delivery Address
    if (!effectiveStreet || effectiveStreet.length < 5) {
      setValidationErrors((p) => ({ ...p, address: 'Please enter your complete delivery address.' }));
      toast.error('Please enter your complete delivery address.');
      setShowAddForm(true);
      setTimeout(() => {
        addressInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        addressInputRef.current?.focus();
      }, 50);
      return;
    }

    // 9. Enforce Minimum Checkout Order Value
    const minSettings = await paymentsApi.getMinimumOrderSettings();
    const subtotalVal = deliveryCalculation ? deliveryCalculation.product_subtotal : Number(cart?.subtotal || 0);
    if (minSettings.enabled && subtotalVal > 0 && subtotalVal < minSettings.minimum_amount) {
      const remaining = minSettings.minimum_amount - subtotalVal;
      toast.error(\`Minimum order subtotal is ₦\${minSettings.minimum_amount.toLocaleString()}. Please add ₦\${remaining.toLocaleString()} more to proceed.\`);
      navigate('/cart');
      return;
    }

    // 10. Verify Delivery Fee Calculation
    if (!deliveryCalculation || deliveryCalculation.total_delivery_fee === null || deliveryCalculation.requires_manual_quote) {
      toast.error('Delivery fee has not yet been confirmed for this destination. Please arrange delivery via WhatsApp.');
      return;
    }

    // If customer entered address details in addrForm and hasn't explicitly saved them, auto-persist to preserve data
    if (!activeAddress && effectiveStreet) {
      const autoAddr: Address = {
        id: \`addr_\${Date.now()}\`,
        label: addrForm.label || 'Delivery Address',
        full_name: effectiveFullName,
        phone: effectivePhone,
        address_line_1: effectiveStreet,
        address_line_2: addrForm.address_line_2 || null,
        city: effectiveCity,
        state: effectiveState,
        country: 'Nigeria',
        postal_code: addrForm.postal_code || null,
        is_default: addresses.length === 0,
      };
      setAddresses((prev) => [...prev, autoAddr]);
      setSelectedAddressId(autoAddr.id);
      activeAddress = autoAddr;
    }

    const formattedAddress = activeAddress
      ? \`\${activeAddress.address_line_1}\${activeAddress.address_line_2 ? \`, \${activeAddress.address_line_2}\` : ''}, \${effectiveCity}, \${effectiveState}\`
      : \`\${effectiveStreet}, \${effectiveCity}, \${effectiveState}\`;

    setIsSubmitting(true);
    try {
      const session = await checkoutApi.initializeSession({
        delivery_address_id: selectedAddressId || activeAddress?.id || 'addr_custom',
        delivery_method_id: 'dovi_direct_delivery',
        delivery_method: 'DOVI Direct Delivery',
        destination_state: effectiveState,
        destination_city: effectiveCity,
        destination_address: formattedAddress,
        recipient_name: effectiveFullName,
        recipient_phone: effectivePhone,
        delivery_calculation: deliveryCalculation || undefined,
        cart_snapshot: selectedCartSnapshot,
        delivery_address: activeAddress || undefined,
      });
      navigate(\`/checkout/\${session.id}\`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initialize checkout session.');
    } finally {
      setIsSubmitting(false);
    }
  };`;

if (!content.includes(proceedTarget)) {
  console.error('proceedTarget not found');
} else {
  content = content.replace(proceedTarget, proceedReplacement);
  console.log('2. Replaced handleProceedToPayment with full validation');
}

// 3. Attach refs and validation error display to Destination State and City selectors
const stateInputTarget = `                  <select
                    value={destinationState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    style={{ ...inputStyles, width: '100%' }}
                  >`;

const stateInputReplacement = `                  <select
                    ref={stateSelectRef}
                    value={destinationState}
                    onChange={(e) => {
                      clearFieldError('state');
                      handleStateChange(e.target.value);
                    }}
                    style={{
                      ...inputStyles,
                      width: '100%',
                      borderColor: validationErrors.state ? '#ef4444' : (inputStyles.borderColor || '#d1d5db'),
                      backgroundColor: validationErrors.state ? '#fef2f2' : undefined,
                    }}
                  >
                  {validationErrors.state && (
                    <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {validationErrors.state}
                    </div>
                  )}`;

// Let's attach properly outside select tag
const stateOuterTarget = `                <div>
                  <label style={fieldLabelStyles}>Destination State *</label>
                  <select
                    value={destinationState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    style={{ ...inputStyles, width: '100%' }}
                  >
                    <option value="">Select state...</option>
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>`;

const stateOuterReplacement = `                <div>
                  <label style={fieldLabelStyles}>Destination State *</label>
                  <select
                    ref={stateSelectRef}
                    value={destinationState}
                    onChange={(e) => {
                      clearFieldError('state');
                      handleStateChange(e.target.value);
                    }}
                    style={{
                      ...inputStyles,
                      width: '100%',
                      borderColor: validationErrors.state ? '#ef4444' : undefined,
                      backgroundColor: validationErrors.state ? '#fef2f2' : undefined,
                    }}
                  >
                    <option value="">Select state...</option>
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {validationErrors.state && (
                    <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {validationErrors.state}
                    </div>
                  )}
                </div>`;

if (content.includes(stateOuterTarget)) {
  content = content.replace(stateOuterTarget, stateOuterReplacement);
  console.log('3. Attached ref & error style to Destination State selector');
} else {
  console.error('stateOuterTarget not found');
}

// 4. Attach city ref & error display
const citySelectTarget = `                      <select
                        key={destinationState}
                        value={selectedCityOptionValue}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '__custom__') {
                            userChoseDestinationRef.current = true;
                            setCustomCityMode(true);
                            setDestinationCity('');
                          } else {
                            setCustomCityMode(false);
                            handleCityChange(v);
                          }
                        }}
                        style={{ ...inputStyles, flex: 1 }}
                      >`;

const citySelectReplacement = `                      <select
                        ref={citySelectRef}
                        key={destinationState}
                        value={selectedCityOptionValue}
                        onChange={(e) => {
                          clearFieldError('city');
                          const v = e.target.value;
                          if (v === '__custom__') {
                            userChoseDestinationRef.current = true;
                            setCustomCityMode(true);
                            setDestinationCity('');
                          } else {
                            setCustomCityMode(false);
                            handleCityChange(v);
                          }
                        }}
                        style={{
                          ...inputStyles,
                          flex: 1,
                          borderColor: validationErrors.city ? '#ef4444' : undefined,
                          backgroundColor: validationErrors.city ? '#fef2f2' : undefined,
                        }}
                      >`;

if (content.includes(citySelectTarget)) {
  content = content.replace(citySelectTarget, citySelectReplacement);
  console.log('4. Attached citySelectRef to city dropdown');
} else {
  console.error('citySelectTarget not found');
}

// 5. Attach city custom input ref
const cityInputTarget = `                      {selectedCityOptionValue === '__custom__' && (
                        <input
                          type="text"
                          placeholder="Enter town / city name"
                          value={destinationCity}
                          onChange={(e) => handleCityChange(e.target.value)}
                          style={{ ...inputStyles, flex: 1 }}
                        />
                      )}`;

const cityInputReplacement = `                      {selectedCityOptionValue === '__custom__' && (
                        <input
                          ref={cityInputRef}
                          type="text"
                          placeholder="Enter town / city name"
                          value={destinationCity}
                          onChange={(e) => {
                            clearFieldError('city');
                            handleCityChange(e.target.value);
                          }}
                          style={{
                            ...inputStyles,
                            flex: 1,
                            borderColor: validationErrors.city ? '#ef4444' : undefined,
                            backgroundColor: validationErrors.city ? '#fef2f2' : undefined,
                          }}
                        />
                      )}`;

if (content.includes(cityInputTarget)) {
  content = content.replace(cityInputTarget, cityInputReplacement);
  console.log('5. Attached cityInputRef to custom city input');
} else {
  console.error('cityInputTarget not found');
}

// 6. Attach refs & error styles in the Address Form
const addrFormTarget = `                  <input
                    placeholder="Recipient Full Name"
                    value={addrForm.full_name}
                    onChange={(e) => setAddrForm((p) => ({ ...p, full_name: e.target.value }))}
                    style={inputStyles}
                    required
                  />
                  <input
                    placeholder="Recipient Phone Number"
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm((p) => ({ ...p, phone: e.target.value }))}
                    style={inputStyles}
                    required
                  />
                  <input
                    placeholder="Street Address Line 1"
                    value={addrForm.address_line_1}
                    onChange={(e) => setAddrForm((p) => ({ ...p, address_line_1: e.target.value }))}
                    style={inputStyles}
                    required
                  />`;

const addrFormReplacement = `                  <div>
                    <input
                      ref={fullNameInputRef}
                      placeholder="Recipient Full Name *"
                      value={addrForm.full_name}
                      onChange={(e) => {
                        clearFieldError('full_name');
                        setAddrForm((p) => ({ ...p, full_name: e.target.value }));
                      }}
                      style={{
                        ...inputStyles,
                        width: '100%',
                        borderColor: validationErrors.full_name ? '#ef4444' : undefined,
                        backgroundColor: validationErrors.full_name ? '#fef2f2' : undefined,
                      }}
                      required
                    />
                    {validationErrors.full_name && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', fontWeight: 600 }}>
                        ⚠️ {validationErrors.full_name}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      ref={phoneInputRef}
                      placeholder="Recipient Phone Number (Active) *"
                      value={addrForm.phone}
                      onChange={(e) => {
                        clearFieldError('phone');
                        setAddrForm((p) => ({ ...p, phone: e.target.value }));
                      }}
                      style={{
                        ...inputStyles,
                        width: '100%',
                        borderColor: validationErrors.phone ? '#ef4444' : undefined,
                        backgroundColor: validationErrors.phone ? '#fef2f2' : undefined,
                      }}
                      required
                    />
                    {validationErrors.phone && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', fontWeight: 600 }}>
                        ⚠️ {validationErrors.phone}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      ref={addressInputRef}
                      placeholder="Complete Street Address Line 1 *"
                      value={addrForm.address_line_1}
                      onChange={(e) => {
                        clearFieldError('address');
                        setAddrForm((p) => ({ ...p, address_line_1: e.target.value }));
                      }}
                      style={{
                        ...inputStyles,
                        width: '100%',
                        borderColor: validationErrors.address ? '#ef4444' : undefined,
                        backgroundColor: validationErrors.address ? '#fef2f2' : undefined,
                      }}
                      required
                    />
                    {validationErrors.address && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', fontWeight: 600 }}>
                        ⚠️ {validationErrors.address}
                      </div>
                    )}
                  </div>`;

if (content.includes(addrFormTarget)) {
  content = content.replace(addrFormTarget, addrFormReplacement);
  console.log('6. Attached refs and validation error alerts in Address Form');
} else {
  console.error('addrFormTarget not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated CheckoutPage.tsx successfully!');
