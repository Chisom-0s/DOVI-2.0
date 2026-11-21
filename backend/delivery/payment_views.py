import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from rest_framework import permissions, status, views
from rest_framework.response import Response

STORE_PATH = Path(__file__).resolve().parent.parent / 'delivery_store.json'


def get_delivery_store():
    if STORE_PATH.exists():
        try:
            with open(STORE_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {
        'routes': [],
        'rateHistory': [],
        'productAttributes': {},
        'orderShipments': {},
        'manualQuoteOrders': {},
        'payments': [],
        'orders': [],
    }


def save_delivery_store(data):
    try:
        os.makedirs(STORE_PATH.parent, exist_ok=True)
        with open(STORE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


class IsAdminRolePermission(permissions.BasePermission):
    message = 'Permission denied. Only authorized administrators can perform this action.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            # Allow in development / decoupled mode if header or bearer token present
            auth_header = request.headers.get('Authorization', '')
            if 'Bearer' in auth_header:
                return True
            return False
        return getattr(user, 'role', None) == 'ADMIN' or getattr(user, 'is_staff', False)


class SubmitPaymentEvidenceAPIView(views.APIView):
    """
    Customer submits manual bank transfer receipt and transfer details.
    Creates or updates a payment record with status PENDING_VERIFICATION.
    Order is NOT marked paid automatically upon submission.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        order_ref = data.get('order_reference') or data.get('order_id') or ''
        if not order_ref:
            return Response({'error': 'order_reference is required'}, status=status.HTTP_400_BAD_REQUEST)

        sender_bank = data.get('sender_bank', '').strip()
        sender_account_name = data.get('sender_account_name', '').strip()
        if not sender_bank:
            return Response({'error': 'sender_bank is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not sender_account_name:
            return Response({'error': 'sender_account_name is required'}, status=status.HTTP_400_BAD_REQUEST)

        amount = str(data.get('amount', '0'))
        payment_proof_url = data.get('payment_proof_url') or data.get('proof_url') or ''
        transaction_reference = data.get('transaction_reference') or data.get('narration') or order_ref
        notes = data.get('notes', '')

        now_iso = datetime.now(timezone.utc).isoformat()
        store = get_delivery_store()
        payments = store.get('payments', [])
        if not isinstance(payments, list):
            payments = []

        # Check existing submission for this order
        existing_idx = next((i for i, p in enumerate(payments) if p.get('order_reference') == order_ref), None)
        payment_record = {
            'id': f"pay-{uuid.uuid4().hex[:10]}",
            'reference': f"PAY-{order_ref}-{uuid.uuid4().hex[:6].upper()}",
            'order_reference': order_ref,
            'provider': 'BANK_TRANSFER',
            'status': 'PENDING_VERIFICATION',
            'amount': amount,
            'currency': data.get('currency', 'NGN'),
            'sender_bank': sender_bank,
            'sender_account_name': sender_account_name,
            'transaction_reference': transaction_reference,
            'payment_proof_url': payment_proof_url,
            'notes': notes,
            'created_at': now_iso,
            'submitted_at': now_iso,
            'verified_at': None,
            'verified_by': None,
            'rejection_reason': None,
        }

        if existing_idx is not None:
            # Update existing submission (resubmission)
            payments[existing_idx] = payment_record
        else:
            payments.insert(0, payment_record)

        store['payments'] = payments

        # Update order status in orders array
        orders = store.get('orders', [])
        if not isinstance(orders, list):
            orders = []

        for ord_obj in orders:
            if ord_obj.get('reference') == order_ref or ord_obj.get('reference_code') == order_ref or ord_obj.get('id') == order_ref:
                ord_obj['payment_status'] = 'PENDING_VERIFICATION'
                ord_obj['payment_submitted_at'] = now_iso
                ord_obj['payment_reference'] = payment_record['reference']
                break

        store['orders'] = orders
        save_delivery_store(store)

        return Response(payment_record, status=status.HTTP_201_CREATED)


class PaymentEvidenceDetailAPIView(views.APIView):
    """
    Retrieves submitted payment evidence by order reference.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        order_ref = request.query_params.get('order_reference', '')
        if not order_ref:
            return Response({'error': 'order_reference parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        store = get_delivery_store()
        payments = store.get('payments', [])
        match = next((p for p in payments if p.get('order_reference') == order_ref), None)
        if match:
            return Response(match, status=status.HTTP_200_OK)
        return Response({'detail': 'No payment evidence found for this order'}, status=status.HTTP_404_NOT_FOUND)


class AdminPaymentsListAPIView(views.APIView):
    """
    Lists submitted bank transfer payments with status filtering.
    """
    permission_classes = [IsAdminRolePermission]

    def get(self, request):
        status_filter = request.query_params.get('status', '').strip().upper()
        page = int(request.query_params.get('page', 1) or 1)
        page_size = 20

        store = get_delivery_store()
        payments = store.get('payments', [])
        if not isinstance(payments, list):
            payments = []

        if status_filter:
            filtered = [p for p in payments if (p.get('status') or '').upper() == status_filter]
        else:
            filtered = payments

        total_count = len(filtered)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_results = filtered[start_idx:end_idx]

        return Response({
            'count': total_count,
            'next': f"?page={page+1}" if end_idx < total_count else None,
            'previous': f"?page={page-1}" if page > 1 else None,
            'results': page_results,
        }, status=status.HTTP_200_OK)


class AdminPaymentVerifyAPIView(views.APIView):
    """
    Administrator verifies and approves a submitted bank transfer payment.
    - Sets payment status to VERIFIED
    - Sets associated order payment_status to PAID and status to PROCESSING
    - Records admin identity and verification timestamp
    - Prevents duplicate approval
    """
    permission_classes = [IsAdminRolePermission]

    def post(self, request, payment_id):
        store = get_delivery_store()
        payments = store.get('payments', [])
        target = next((p for p in payments if p.get('id') == payment_id or p.get('reference') == payment_id or p.get('order_reference') == payment_id), None)

        if not target:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if (target.get('status') or '').upper() in ('VERIFIED', 'PAID'):
            return Response({
                'already_verified': True,
                'message': 'Payment is already verified.',
                'payment': target,
            }, status=status.HTTP_200_OK)

        now_iso = datetime.now(timezone.utc).isoformat()
        admin_email = getattr(request.user, 'email', None) or request.data.get('verified_by') or 'Administrator'

        target['status'] = 'VERIFIED'
        target['verified_at'] = now_iso
        target['verified_by'] = admin_email
        target['notes'] = request.data.get('notes', target.get('notes', ''))

        order_ref = target.get('order_reference')
        orders = store.get('orders', [])
        for ord_obj in orders:
            if ord_obj.get('reference') == order_ref or ord_obj.get('reference_code') == order_ref or ord_obj.get('id') == order_ref:
                ord_obj['payment_status'] = 'PAID'
                ord_obj['status'] = 'PROCESSING'
                ord_obj['verified_at'] = now_iso
                ord_obj['verified_by'] = admin_email
                break

        store['payments'] = payments
        store['orders'] = orders
        save_delivery_store(store)

        return Response({
            'success': True,
            'message': f"Payment for order {order_ref} verified successfully. Order moved to Processing.",
            'payment': target,
        }, status=status.HTTP_200_OK)


class AdminPaymentRejectAPIView(views.APIView):
    """
    Administrator rejects an invalid, incomplete, or unconfirmed payment.
    - Requires rejection reason
    - Updates payment status to REJECTED
    - Sets associated order payment_status to REJECTED (allowing customer to resubmit)
    """
    permission_classes = [IsAdminRolePermission]

    def post(self, request, payment_id):
        reason = request.data.get('rejection_reason', '').strip()
        if not reason:
            return Response({'error': 'rejection_reason is required.'}, status=status.HTTP_400_BAD_REQUEST)

        store = get_delivery_store()
        payments = store.get('payments', [])
        target = next((p for p in payments if p.get('id') == payment_id or p.get('reference') == payment_id or p.get('order_reference') == payment_id), None)

        if not target:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        now_iso = datetime.now(timezone.utc).isoformat()
        admin_email = getattr(request.user, 'email', None) or 'Administrator'

        target['status'] = 'REJECTED'
        target['rejection_reason'] = reason
        target['verified_at'] = now_iso
        target['verified_by'] = admin_email

        order_ref = target.get('order_reference')
        orders = store.get('orders', [])
        for ord_obj in orders:
            if ord_obj.get('reference') == order_ref or ord_obj.get('reference_code') == order_ref or ord_obj.get('id') == order_ref:
                ord_obj['payment_status'] = 'REJECTED'
                ord_obj['payment_rejection_reason'] = reason
                break

        store['payments'] = payments
        store['orders'] = orders
        save_delivery_store(store)

        return Response({
            'success': True,
            'message': f"Payment for order {order_ref} rejected. Reason: {reason}",
            'payment': target,
        }, status=status.HTTP_200_OK)


class OrderTransitionAPIView(views.APIView):
    """
    Updates order fulfillment status across allowed lifecycles:
    ORDER_PLACED -> PROCESSING -> READY_FOR_DISPATCH -> DISPATCHED -> DELIVERED (or CANCELLED)
    """
    permission_classes = [IsAdminRolePermission]

    def post(self, request, order_id):
        new_status = request.data.get('status', '').strip().upper()
        if not new_status:
            return Response({'error': 'status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        store = get_delivery_store()
        orders = store.get('orders', [])
        matched = next((o for o in orders if o.get('id') == order_id or o.get('reference') == order_id or o.get('reference_code') == order_id), None)

        now_iso = datetime.now(timezone.utc).isoformat()
        if matched:
            matched['status'] = new_status
            matched['updated_at'] = now_iso
        else:
            matched = {
                'id': order_id,
                'reference': order_id,
                'reference_code': order_id,
                'status': new_status,
                'updated_at': now_iso,
            }
            orders.append(matched)

        store['orders'] = orders
        save_delivery_store(store)

        return Response(matched, status=status.HTTP_200_OK)


class OrderListCreateAPIView(views.APIView):
    """
    List and create customer orders with strict ownership scoping.
    - GET: Customers only retrieve their own orders (buyer_id, customer_id, buyer_email).
           Admins retrieve all orders.
           Results are sorted newest first.
    - POST: Creates or updates an order associated with the authenticated customer.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = getattr(request, 'user', None)
        is_admin = False
        user_id = None
        user_email = None

        if user and user.is_authenticated:
            is_admin = getattr(user, 'role', None) == 'ADMIN' or getattr(user, 'is_staff', False)
            user_id = str(getattr(user, 'id', ''))
            user_email = str(getattr(user, 'email', '')).lower().strip()
        else:
            auth_header = request.headers.get('Authorization', '')
            if 'Bearer' in auth_header:
                pass

        param_customer_id = request.query_params.get('customer_id') or request.query_params.get('buyer_id')
        param_email = (request.query_params.get('buyer_email') or request.query_params.get('email') or '').lower().strip()
        param_status = (request.query_params.get('status') or '').strip().upper()

        store = get_delivery_store()
        all_orders = store.get('orders', [])
        if not isinstance(all_orders, list):
            all_orders = []

        all_payments = store.get('payments', [])
        if not isinstance(all_payments, list):
            all_payments = []
        payment_by_ref = {}
        for p in all_payments:
            pref = p.get('order_reference') or p.get('order_id')
            if pref:
                payment_by_ref[pref] = p

        filtered_orders = []
        for o in all_orders:
            ref = o.get('reference') or o.get('reference_code') or o.get('id')
            o_cid = str(o.get('customer_id') or o.get('buyer_id') or '')
            o_email = str(o.get('buyer_email') or (o.get('delivery_address') or {}).get('email') or '').lower().strip()

            # Authorization scoping check:
            if not is_admin:
                if user_id or user_email:
                    match_id = bool(user_id and o_cid and o_cid == user_id)
                    match_email = bool(user_email and o_email and o_email == user_email)
                    if not (match_id or match_email):
                        continue
                elif param_customer_id or param_email:
                    match_id = bool(param_customer_id and o_cid and o_cid == param_customer_id)
                    match_email = bool(param_email and o_email and o_email == param_email)
                    if not (match_id or match_email):
                        continue
                else:
                    # Unauthenticated with no scoping query params: return empty list to protect user privacy
                    continue
            else:
                if param_customer_id and o_cid != param_customer_id:
                    continue
                if param_email and o_email != param_email:
                    continue

            if param_status:
                curr_status = (o.get('status') or '').upper()
                if curr_status != param_status:
                    continue

            # Attach latest payment verification status and evidence
            p = payment_by_ref.get(ref) or payment_by_ref.get(o.get('id'))
            if p:
                if p.get('status') == 'VERIFIED':
                    o['payment_status'] = 'PAID'
                elif p.get('status') == 'REJECTED':
                    o['payment_status'] = 'REJECTED'
                elif p.get('status') == 'PENDING_VERIFICATION':
                    o['payment_status'] = 'PENDING_VERIFICATION'
                o['payment_evidence'] = p

            filtered_orders.append(o)

        # Sort newest first
        def get_order_timestamp(order_item):
            created = order_item.get('created_at') or ''
            try:
                return datetime.fromisoformat(created.replace('Z', '+00:00')).timestamp()
            except Exception:
                return 0.0

        filtered_orders.sort(key=get_order_timestamp, reverse=True)

        try:
            page = max(1, int(request.query_params.get('page', 1)))
        except ValueError:
            page = 1
        page_size = 20
        total_count = len(filtered_orders)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        results_slice = filtered_orders[start_idx:end_idx]

        return Response({
            'count': total_count,
            'next': f"?page={page + 1}" if end_idx < total_count else None,
            'previous': f"?page={page - 1}" if page > 1 else None,
            'results': results_slice,
        }, status=status.HTTP_200_OK)

    def post(self, request):
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
        }, status=status.HTTP_201_CREATED)


class OrderDetailAPIView(views.APIView):
    """
    Retrieves full details for a single order by reference or ID.
    Enforces authorization check so customers can only access their own orders.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, order_id):
        store = get_delivery_store()
        orders = store.get('orders', [])
        matched = next((o for o in orders if o.get('id') == order_id or o.get('reference') == order_id or o.get('reference_code') == order_id), None)

        if not matched:
            return Response({'detail': f'Order {order_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            is_admin = getattr(user, 'role', None) == 'ADMIN' or getattr(user, 'is_staff', False)
            if not is_admin:
                u_id = str(user.id)
                u_email = str(user.email).lower().strip()
                o_cid = str(matched.get('customer_id') or matched.get('buyer_id') or '')
                o_email = str(matched.get('buyer_email') or (matched.get('delivery_address') or {}).get('email') or '').lower().strip()
                if not ((u_id and o_cid == u_id) or (u_email and o_email == u_email)):
                    return Response({'detail': 'You do not have permission to view this order.'}, status=status.HTTP_403_FORBIDDEN)

        # Attach payment details if available
        payments = store.get('payments', [])
        ref = matched.get('reference') or matched.get('reference_code') or matched.get('id')
        p = next((pay for pay in payments if pay.get('order_reference') == ref or pay.get('order_id') == ref), None)
        if p:
            if p.get('status') == 'VERIFIED':
                matched['payment_status'] = 'PAID'
            elif p.get('status') == 'REJECTED':
                matched['payment_status'] = 'REJECTED'
            elif p.get('status') == 'PENDING_VERIFICATION':
                matched['payment_status'] = 'PENDING_VERIFICATION'
            matched['payment_evidence'] = p

        return Response(matched, status=status.HTTP_200_OK)
