const fs = require('fs');
const filePath = 'backend/delivery/payment_views.py';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. In AdminPaymentVerifyAPIView, before save_delivery_store(store)
const verifyTarget = `        store['payments'] = payments
        store['orders'] = orders
        store['paymentSessions'] = sessions
        save_delivery_store(store)`;

const verifyAddition = `        # Confirm promotional giveaway reservation if present
        launch_giveaway = store.get('launchGiveaway')
        if launch_giveaway and isinstance(launch_giveaway, dict):
            claims = launch_giveaway.get('claims', [])
            matched_claim = next((c for c in claims if (
                str(c.get('order_reference', '')).lower().strip() == norm_order_ref and
                c.get('status') == 'RESERVED'
            )), None)
            if matched_claim:
                matched_claim['status'] = 'CONFIRMED'
                matched_claim['confirmed_at'] = now_iso
                launch_giveaway['reserved_stock'] = max(0, int(launch_giveaway.get('reserved_stock', 0)) - 1)
                launch_giveaway['confirmed_stock'] = int(launch_giveaway.get('confirmed_stock', 0)) + 1
                store['launchGiveaway'] = launch_giveaway

        store['payments'] = payments
        store['orders'] = orders
        store['paymentSessions'] = sessions
        save_delivery_store(store)`;

if (content.includes(verifyTarget)) {
  content = content.replace(verifyTarget, verifyAddition);
  console.log('Added giveaway confirmation to AdminPaymentVerifyAPIView');
} else {
  console.error('Failed to match AdminPaymentVerifyAPIView target');
}

// 2. In AdminPaymentRejectAPIView, before save_delivery_store(store)
const rejectTarget = `        store['payments'] = payments
        store['orders'] = orders
        store['paymentSessions'] = sessions
        save_delivery_store(store)`; // Note: second occurrence in file!

// Let's use a unique needle for reject
const rejectNeedle = `        # Update associated payment session
        sessions = store.get('paymentSessions', [])
        for s in sessions:
            if (
                str(s.get('order_reference', '')).lower().strip() == norm_order_ref or
                str(s.get('id', '')).lower().strip() == str(target.get('payment_session_id', '')).lower().strip()
            ):
                s['payment_verification_status'] = 'REJECTED'

        store['payments'] = payments
        store['orders'] = orders
        store['paymentSessions'] = sessions
        save_delivery_store(store)`;

const rejectReplacement = `        # Update associated payment session
        sessions = store.get('paymentSessions', [])
        for s in sessions:
            if (
                str(s.get('order_reference', '')).lower().strip() == norm_order_ref or
                str(s.get('id', '')).lower().strip() == str(target.get('payment_session_id', '')).lower().strip()
            ):
                s['payment_verification_status'] = 'REJECTED'

        # Release promotional giveaway reservation if present
        launch_giveaway = store.get('launchGiveaway')
        if launch_giveaway and isinstance(launch_giveaway, dict):
            claims = launch_giveaway.get('claims', [])
            matched_claim = next((c for c in claims if (
                str(c.get('order_reference', '')).lower().strip() == norm_order_ref and
                c.get('status') == 'RESERVED'
            )), None)
            if matched_claim:
                matched_claim['status'] = 'RELEASED'
                matched_claim['released_at'] = now_iso
                matched_claim['release_reason'] = f"Payment rejected: {reason}"
                launch_giveaway['reserved_stock'] = max(0, int(launch_giveaway.get('reserved_stock', 0)) - 1)
                total_s = int(launch_giveaway.get('total_stock', 20))
                conf_s = int(launch_giveaway.get('confirmed_stock', 0))
                avail_s = int(launch_giveaway.get('available_stock', 0))
                launch_giveaway['available_stock'] = min(total_s - conf_s, avail_s + 1)
                launch_giveaway['released_reservations_count'] = int(launch_giveaway.get('released_reservations_count', 0)) + 1
                store['launchGiveaway'] = launch_giveaway

        store['payments'] = payments
        store['orders'] = orders
        store['paymentSessions'] = sessions
        save_delivery_store(store)`;

if (content.includes(rejectNeedle)) {
  content = content.replace(rejectNeedle, rejectReplacement);
  console.log('Added giveaway release to AdminPaymentRejectAPIView');
} else {
  console.error('Failed to match AdminPaymentRejectAPIView target');
}

// 3. In OrderListCreateAPIView, item subtotal & promotional gift check
const orderItemsTarget = `        verified_subtotal = 0.0
        verified_items = []
        for it in raw_items:
            pid = str(it.get('product_id') or (it.get('product', {}) if isinstance(it.get('product'), dict) else {}).get('id') or it.get('id') or '')
            p_cat = catalog_map.get(pid)
            try:
                base_p = float(p_cat.get('base_price')) if p_cat and p_cat.get('base_price') is not None else float(it.get('unit_price') or it.get('price') or 0)
            except Exception:
                base_p = float(it.get('unit_price') or it.get('price') or 0)

            qty = max(1, int(it.get('quantity') or 1))
            line_tot = round(base_p * qty, 2)
            verified_subtotal += line_tot
            verified_items.append({
                **it,
                'unit_price': str(base_p),
                'price': str(base_p),
                'quantity': qty,
                'line_total': str(line_tot),
            })`;

const orderItemsReplacement = `        has_promotional_gift = False
        verified_subtotal = 0.0
        verified_items = []
        for it in raw_items:
            is_gift = bool(
                it.get('is_promotional_gift') or
                str(it.get('sku') or '').upper() == 'DOV-GIFT-EARPOD-2026' or
                str(it.get('product_id') or '') == 'promo-gift-earpod-2026'
            )
            if is_gift:
                has_promotional_gift = True
                verified_items.append({
                    **it,
                    'is_promotional_gift': True,
                    'unit_price': '0.00',
                    'price': '0.00',
                    'quantity': 1,
                    'line_total': '0.00',
                })
                continue

            pid = str(it.get('product_id') or (it.get('product', {}) if isinstance(it.get('product'), dict) else {}).get('id') or it.get('id') or '')
            p_cat = catalog_map.get(pid)
            try:
                base_p = float(p_cat.get('base_price')) if p_cat and p_cat.get('base_price') is not None else float(it.get('unit_price') or it.get('price') or 0)
            except Exception:
                base_p = float(it.get('unit_price') or it.get('price') or 0)

            qty = max(1, int(it.get('quantity') or 1))
            line_tot = round(base_p * qty, 2)
            verified_subtotal += line_tot
            verified_items.append({
                **it,
                'unit_price': str(base_p),
                'price': str(base_p),
                'quantity': qty,
                'line_total': str(line_tot),
            })`;

if (content.includes(orderItemsTarget)) {
  content = content.replace(orderItemsTarget, orderItemsReplacement);
  console.log('Added promotional gift items handling to OrderListCreateAPIView');
} else {
  console.error('Failed to match orderItemsTarget');
}

// 4. In OrderListCreateAPIView, after min order value check, validate promotional gift
const minCheckTarget = `        # 4. Enforce server-side minimum checkout value validation
        min_settings = get_minimum_order_settings(store)
        if min_settings.get('enabled'):
            min_val = float(min_settings.get('minimum_amount', 10000))
            if verified_subtotal < min_val:
                return Response({
                    'error': 'MINIMUM_ORDER_VALUE_NOT_MET',
                    'message': f"Minimum product subtotal of ₦{min_val:,.2f} required to checkout. Current subtotal is ₦{verified_subtotal:,.2f}.",
                    'minimum_required': min_val,
                    'current_subtotal': verified_subtotal,
                    'amount_remaining': min_val - verified_subtotal,
                }, status=status.HTTP_400_BAD_REQUEST)`;

const minCheckReplacement = `        # 4. Enforce server-side minimum checkout value validation
        min_settings = get_minimum_order_settings(store)
        if min_settings.get('enabled'):
            min_val = float(min_settings.get('minimum_amount', 10000))
            if verified_subtotal < min_val:
                return Response({
                    'error': 'MINIMUM_ORDER_VALUE_NOT_MET',
                    'message': f"Minimum product subtotal of ₦{min_val:,.2f} required to checkout. Current subtotal is ₦{verified_subtotal:,.2f}.",
                    'minimum_required': min_val,
                    'current_subtotal': verified_subtotal,
                    'amount_remaining': min_val - verified_subtotal,
                }, status=status.HTTP_400_BAD_REQUEST)

        # 4b. Enforce DOVI Launch Giveaway promotional rules (₦30,000 product subtotal & 1 per customer)
        if has_promotional_gift:
            if verified_subtotal < 30000.0:
                return Response({
                    'error': 'GIVEAWAY_NOT_ELIGIBLE',
                    'message': f"Promotional EarPod requires a minimum product subtotal of ₦30,000.00 (excluding delivery). Current subtotal is ₦{verified_subtotal:,.2f}.",
                }, status=status.HTTP_400_BAD_REQUEST)

            launch_giveaway = store.get('launchGiveaway')
            if launch_giveaway and isinstance(launch_giveaway, dict):
                claims = launch_giveaway.get('claims', [])
                clean_phone = ''.join(c for c in buyer_phone if c.isdigit())
                for cl in claims:
                    if cl.get('status') == 'RELEASED':
                        continue
                    match_cid = bool(user_id and cl.get('customer_id') and cl.get('customer_id') == user_id)
                    cl_phone = ''.join(c for c in (cl.get('customer_phone') or '') if c.isdigit())
                    match_phone = bool(len(clean_phone) >= 10 and cl_phone and cl_phone == clean_phone)
                    if (match_cid or match_phone) and str(cl.get('order_reference', '')).upper() != str(order_ref).upper():
                        return Response({
                            'error': 'GIVEAWAY_LIMIT_EXCEEDED',
                            'message': 'You have already claimed your complimentary Launch Giveaway EarPod (Limit 1 per customer).',
                        }, status=status.HTTP_400_BAD_REQUEST)

                existing_claim = next((c for c in claims if str(c.get('order_reference', '')).upper() == str(order_ref).upper()), None)
                if not existing_claim:
                    if int(launch_giveaway.get('available_stock', 20)) <= 0:
                        return Response({
                            'error': 'GIVEAWAY_OUT_OF_STOCK',
                            'message': 'Promotional Launch Giveaway EarPod stock is exhausted.',
                        }, status=status.HTTP_400_BAD_REQUEST)
                    launch_giveaway['available_stock'] = max(0, int(launch_giveaway.get('available_stock', 20)) - 1)
                    launch_giveaway['reserved_stock'] = int(launch_giveaway.get('reserved_stock', 0)) + 1
                    claims.insert(0, {
                        'id': f"claim-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:5]}",
                        'customer_id': user_id,
                        'customer_name': buyer_name,
                        'customer_email': user_email,
                        'customer_phone': buyer_phone,
                        'order_reference': str(order_ref).upper(),
                        'status': 'RESERVED',
                        'reserved_at': datetime.now(timezone.utc).isoformat(),
                        'confirmed_at': None,
                        'released_at': None,
                        'release_reason': None,
                        'is_test': False,
                    })
                    launch_giveaway['claims'] = claims
                    store['launchGiveaway'] = launch_giveaway`;

if (content.includes(minCheckTarget)) {
  content = content.replace(minCheckTarget, minCheckReplacement);
  console.log('Added promotional gift verification rules to OrderListCreateAPIView');
} else {
  console.error('Failed to match minCheckTarget');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated backend/delivery/payment_views.py');
