const fs = require('fs');
const path = require('path');

const pvPath = path.resolve('backend/delivery/payment_views.py');
let content = fs.readFileSync(pvPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Slice duplicate if still present
const needle = 'class MinimumOrderSettingsAPIView(views.APIView):';
const firstIdx = content.indexOf(needle);
const secondIdx = content.indexOf(needle, firstIdx + 1);
if (secondIdx !== -1) {
  content = content.slice(0, secondIdx).trimEnd() + '\n';
  console.log('1. Sliced off duplicate classes starting at second index:', secondIdx);
} else {
  console.log('1. Duplicate already sliced');
}

// 2. Strict receipt check in SubmitPaymentEvidenceAPIView
const evidenceTarget = `        if uploaded_file:
            saved_url = save_receipt_file(file_obj=uploaded_file, order_ref=order_ref)
            if saved_url:
                payment_proof_url = saved_url
        elif payment_proof_url.startswith('data:'):
            saved_url = save_receipt_file(base64_str=payment_proof_url, order_ref=order_ref)
            if saved_url:
                payment_proof_url = saved_url

        now = datetime.now(timezone.utc)`;

const evidenceReplacement = `        if uploaded_file:
            saved_url = save_receipt_file(file_obj=uploaded_file, order_ref=order_ref)
            if saved_url:
                payment_proof_url = saved_url
        elif payment_proof_url.startswith('data:'):
            saved_url = save_receipt_file(base64_str=payment_proof_url, order_ref=order_ref)
            if saved_url:
                payment_proof_url = saved_url

        if not payment_proof_url or not payment_proof_url.strip():
            return Response({
                'error': 'RECEIPT_REQUIRED',
                'message': 'Payment receipt upload is required. Please upload your transfer receipt before submitting payment evidence.'
            }, status=status.HTTP_400_BAD_REQUEST)

        now = datetime.now(timezone.utc)`;

if (content.includes(evidenceTarget)) {
  content = content.replace(evidenceTarget, evidenceReplacement);
  console.log('2. Added strict receipt check in SubmitPaymentEvidenceAPIView');
} else {
  console.error('evidenceTarget not found');
}

// 3. Delivery validation in PaymentSessionListCreateAPIView
const sessionCheckTarget = `        # 2. Check existing order status
        orders = store.get('orders', [])
        ord_obj = next((o for o in orders if o.get('reference') == order_ref or o.get('id') == order_ref), None)
        if ord_obj and (ord_obj.get('payment_status') or '').upper() == 'PAID':
            return Response({'error': 'Order is already paid.'}, status=status.HTTP_400_BAD_REQUEST)`;

const sessionCheckReplacement = `        # 2. Check existing order status and delivery completeness
        orders = store.get('orders', [])
        ord_obj = next((o for o in orders if o.get('reference') == order_ref or o.get('id') == order_ref), None)
        if ord_obj:
            if (ord_obj.get('payment_status') or '').upper() == 'PAID':
                return Response({'error': 'Order is already paid.'}, status=status.HTTP_400_BAD_REQUEST)

            addr = ord_obj.get('delivery_address') or {}
            recip_name = str(ord_obj.get('buyer_name') or addr.get('full_name') or addr.get('recipient_name') or '').strip()
            recip_phone = str(ord_obj.get('buyer_phone') or addr.get('phone') or addr.get('recipient_phone') or '').strip()
            dest_state = str(ord_obj.get('destination_state') or addr.get('state') or '').strip()
            dest_city = str(ord_obj.get('destination_city') or addr.get('city') or '').strip()
            dest_address = str(ord_obj.get('destination_address') or addr.get('address_line_1') or '').strip()
            clean_digits = ''.join(c for c in recip_phone if c.isdigit())

            if not recip_name or recip_name.lower() == 'customer':
                return Response({
                    'error': 'INCOMPLETE_DELIVERY_DETAILS',
                    'field': 'full_name',
                    'message': 'Please enter your full name before accessing payment.',
                }, status=status.HTTP_400_BAD_REQUEST)

            if not recip_phone or len(clean_digits) < 10:
                return Response({
                    'error': 'INCOMPLETE_DELIVERY_DETAILS',
                    'field': 'phone',
                    'message': 'Please enter an active phone number before accessing payment.',
                }, status=status.HTTP_400_BAD_REQUEST)

            if not dest_state:
                return Response({
                    'error': 'INCOMPLETE_DELIVERY_DETAILS',
                    'field': 'state',
                    'message': 'Please select your state before accessing payment.',
                }, status=status.HTTP_400_BAD_REQUEST)

            if not dest_city:
                return Response({
                    'error': 'INCOMPLETE_DELIVERY_DETAILS',
                    'field': 'city',
                    'message': 'Please select your town before accessing payment.',
                }, status=status.HTTP_400_BAD_REQUEST)

            if not dest_address or len(dest_address) < 5:
                return Response({
                    'error': 'INCOMPLETE_DELIVERY_DETAILS',
                    'field': 'address',
                    'message': 'Please enter your complete delivery address before accessing payment.',
                }, status=status.HTTP_400_BAD_REQUEST)`;

if (content.includes(sessionCheckTarget)) {
  content = content.replace(sessionCheckTarget, sessionCheckReplacement);
  console.log('3. Added delivery info validation in PaymentSessionListCreateAPIView');
} else {
  console.error('sessionCheckTarget not found');
}

// 4. Update OrderListCreateAPIView.post with delivery validation & authoritative pricing recalculation
const orderPostTarget = `    def post(self, request):
        data = request.data or {}
        order_ref = data.get('reference') or data.get('reference_code') or data.get('order_reference') or data.get('id')
        if not order_ref:
            order_ref = f"DOVI-{uuid.uuid4().hex[:6].upper()}"

        user = getattr(request, 'user', None)
        user_id = str(user.id) if (user and user.is_authenticated) else data.get('customer_id') or data.get('buyer_id')
        user_email = user.email if (user and user.is_authenticated) else data.get('buyer_email') or (data.get('delivery_address') or {}).get('email')
        user_name = f"{user.first_name} {user.last_name}".strip() if (user and user.is_authenticated) else data.get('buyer_name')

        now_iso = datetime.now(timezone.utc).isoformat()
        store = get_delivery_store()

        # Enforce server-side minimum checkout value validation
        min_settings = get_minimum_order_settings(store)
        if min_settings.get('enabled'):
            min_val = float(min_settings.get('minimum_amount', 10000))
            subtotal = float(data.get('subtotal', 0) or 0)
            if subtotal > 0 and subtotal < min_val:
                return Response({
                    'error': 'MINIMUM_ORDER_VALUE_NOT_MET',
                    'message': f"Minimum product subtotal of ₦{min_val:,.2f} required to checkout. Current subtotal is ₦{subtotal:,.2f}.",
                    'minimum_required': min_val,
                    'current_subtotal': subtotal,
                    'amount_remaining': min_val - subtotal,
                }, status=status.HTTP_400_BAD_REQUEST)

        orders = store.get('orders', [])
        if not isinstance(orders, list):
            orders = []

        existing_idx = next((i for i, o in enumerate(orders) if o.get('reference') == order_ref or o.get('id') == order_ref), None)
        order_record = {
            **data,
            'id': data.get('id') or order_ref,
            'reference': order_ref,
            'reference_code': order_ref,
            'customer_id': user_id,
            'buyer_id': user_id,
            'buyer_email': user_email,
            'buyer_name': user_name,
            'status': data.get('status') or 'PENDING_PAYMENT',
            'payment_status': data.get('payment_status') or 'PENDING_PAYMENT',
            'created_at': data.get('created_at') or now_iso,
            'updated_at': now_iso,
        }

        if existing_idx is not None:
            orders[existing_idx] = {**orders[existing_idx], **order_record}
        else:
            orders.append(order_record)

        store['orders'] = orders
        save_delivery_store(store)

        return Response({
            'success': True,
            'order_reference': order_ref,
            'order': order_record,
        }, status=status.HTTP_201_CREATED)`;

const orderPostReplacement = `    def post(self, request):
        data = request.data or {}
        order_ref = data.get('reference') or data.get('reference_code') or data.get('order_reference') or data.get('id')
        if not order_ref:
            order_ref = f"DOVI-{uuid.uuid4().hex[:6].upper()}"

        user = getattr(request, 'user', None)
        user_id = str(user.id) if (user and user.is_authenticated) else data.get('customer_id') or data.get('buyer_id')
        user_email = user.email if (user and user.is_authenticated) else data.get('buyer_email') or (data.get('delivery_address') or {}).get('email')

        # 1. Delivery & recipient details validation (backend enforcement)
        deliv_addr = data.get('delivery_address') or {}
        buyer_name = (
            data.get('buyer_name') or
            deliv_addr.get('full_name') or
            deliv_addr.get('recipient_name') or
            (f"{user.first_name} {user.last_name}".strip() if (user and user.is_authenticated and f"{user.first_name} {user.last_name}".strip()) else '')
        ).strip()
        if not buyer_name or buyer_name.lower() == 'customer':
            return Response({
                'error': 'VALIDATION_FAILED',
                'field': 'full_name',
                'message': 'Please enter your full name.'
            }, status=status.HTTP_400_BAD_REQUEST)

        buyer_phone = (
            data.get('buyer_phone') or
            deliv_addr.get('phone') or
            deliv_addr.get('recipient_phone') or
            getattr(user, 'phone_number', '') or
            ''
        ).strip()
        phone_digits = ''.join(c for c in buyer_phone if c.isdigit())
        if not buyer_phone or len(phone_digits) < 10:
            return Response({
                'error': 'VALIDATION_FAILED',
                'field': 'phone',
                'message': 'Please enter an active phone number (at least 10 digits).'
            }, status=status.HTTP_400_BAD_REQUEST)

        dest_state = (
            data.get('destination_state') or
            deliv_addr.get('state') or
            ''
        ).strip()
        if not dest_state:
            return Response({
                'error': 'VALIDATION_FAILED',
                'field': 'state',
                'message': 'Please select your state.'
            }, status=status.HTTP_400_BAD_REQUEST)

        dest_city = (
            data.get('destination_city') or
            deliv_addr.get('city') or
            ''
        ).strip()
        if not dest_city:
            return Response({
                'error': 'VALIDATION_FAILED',
                'field': 'city',
                'message': 'Please select your town.'
            }, status=status.HTTP_400_BAD_REQUEST)

        dest_address = (
            data.get('destination_address') or
            deliv_addr.get('address_line_1') or
            ''
        ).strip()
        if not dest_address or len(dest_address) < 5:
            return Response({
                'error': 'VALIDATION_FAILED',
                'field': 'address',
                'message': 'Please enter your complete delivery address.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Validate cart items
        raw_items = data.get('items') or (data.get('cart_snapshot') or {}).get('items') or []
        if not raw_items or not isinstance(raw_items, list) or len(raw_items) == 0:
            return Response({
                'error': 'VALIDATION_FAILED',
                'field': 'items',
                'message': 'Your shopping cart is empty. Please add items before checking out.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 3. Authoritative server-side price verification from catalog
        catalog_path = Path(__file__).resolve().parent.parent / 'products_catalog.json'
        catalog_map = {}
        if catalog_path.exists():
            try:
                with open(catalog_path, 'r', encoding='utf-8') as f:
                    cat_list = json.load(f)
                    if isinstance(cat_list, list):
                        for p in cat_list:
                            catalog_map[str(p.get('id'))] = p
                            if p.get('slug'):
                                catalog_map[str(p.get('slug'))] = p
            except Exception:
                pass

        verified_subtotal = 0.0
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
            })

        store = get_delivery_store()

        # 4. Enforce server-side minimum checkout value validation
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

        # 5. Recalculate authoritative delivery fee
        routes = store.get('routes', [])
        verified_delivery_fee = 0.0
        norm_st = dest_state.lower().strip()
        norm_ct = dest_city.lower().strip()
        matched_route = next((r for r in routes if (
            r.get('is_active', True) and
            r.get('destination_state', '').lower().strip() == norm_st and
            r.get('destination_city', '').lower().strip() in (norm_ct, '', 'all cities', 'statewide')
        )), None)

        if matched_route:
            verified_delivery_fee = float(matched_route.get('small_parcel_rate') or matched_route.get('heavy_parcel_rate') or 0.0)
        else:
            try:
                verified_delivery_fee = float(data.get('delivery_fee') or 0.0)
            except Exception:
                verified_delivery_fee = 0.0

        verified_total = round(verified_subtotal + verified_delivery_fee, 2)
        now_iso = datetime.now(timezone.utc).isoformat()

        orders = store.get('orders', [])
        if not isinstance(orders, list):
            orders = []

        existing_idx = next((i for i, o in enumerate(orders) if o.get('reference') == order_ref or o.get('id') == order_ref), None)
        order_record = {
            **data,
            'id': data.get('id') or order_ref,
            'reference': order_ref,
            'reference_code': order_ref,
            'customer_id': user_id,
            'buyer_id': user_id,
            'buyer_email': user_email,
            'buyer_name': buyer_name,
            'buyer_phone': buyer_phone,
            'destination_state': dest_state,
            'destination_city': dest_city,
            'destination_address': dest_address,
            'delivery_address': {
                **deliv_addr,
                'full_name': buyer_name,
                'recipient_name': buyer_name,
                'phone': buyer_phone,
                'recipient_phone': buyer_phone,
                'state': dest_state,
                'city': dest_city,
                'address_line_1': dest_address,
            },
            'items': verified_items,
            'subtotal': str(verified_subtotal),
            'delivery_fee': str(verified_delivery_fee),
            'total': str(verified_total),
            'total_amount': str(verified_total),
            'status': data.get('status') or 'ORDER_PLACED',
            'fulfillment_status': data.get('fulfillment_status') or 'ORDER_PLACED',
            'payment_status': data.get('payment_status') or 'PENDING_PAYMENT',
            'created_at': data.get('created_at') or now_iso,
            'updated_at': now_iso,
        }

        if existing_idx is not None:
            orders[existing_idx] = {**orders[existing_idx], **order_record}
        else:
            orders.append(order_record)

        store['orders'] = orders
        save_delivery_store(store)

        return Response({
            'success': True,
            'order_reference': order_ref,
            'order': order_record,
        }, status=status.HTTP_201_CREATED)`;

if (content.includes(orderPostTarget)) {
  content = content.replace(orderPostTarget, orderPostReplacement);
  console.log('4. Updated OrderListCreateAPIView.post with delivery validation & authoritative pricing recalculation');
} else {
  console.error('orderPostTarget not found');
}

fs.writeFileSync(pvPath, content, 'utf8');
console.log('Done writing updated payment_views.py!');
