import json
import os
import uuid
import base64
from django.conf import settings
from datetime import datetime, timezone, timedelta
from pathlib import Path
from rest_framework import permissions, status, views
from rest_framework.response import Response

from .ratelimit import check_rate_limit, rate_limit_response
from .audit_logging import record_audit_event, get_audit_logs

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
        'paymentSessions': [],
        'minimumOrderSettings': {
            'enabled': True,
            'minimum_amount': 10000,
            'updated_at': '2026-11-21T00:00:00Z',
            'updated_by': 'Administrator',
        },
    }


def save_delivery_store(data):
    try:
        os.makedirs(STORE_PATH.parent, exist_ok=True)
        with open(STORE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


def get_minimum_order_settings(store=None):
    if store is None:
        store = get_delivery_store()
    settings = store.get('minimumOrderSettings') or {}
    return {
        'enabled': bool(settings.get('enabled', True)),
        'minimum_amount': float(settings.get('minimum_amount', 10000)),
        'updated_at': settings.get('updated_at') or '2026-11-21T00:00:00Z',
        'updated_by': settings.get('updated_by') or 'Administrator',
    }


class IsAdminRolePermission(permissions.BasePermission):
    message = 'Permission denied. Only authorized administrators can perform this action.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return getattr(user, 'role', None) == 'ADMIN' or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)


def _verify_file_magic_bytes(header_bytes: bytes, ext: str) -> bool:
    """Verifies that uploaded file binary magic bytes match the declared file extension."""
    if ext in ('.jpg', '.jpeg'):
        return header_bytes.startswith(b'\xff\xd8\xff')
    if ext == '.png':
        return header_bytes.startswith(b'\x89PNG\r\n\x1a\n')
    if ext == '.webp':
        return len(header_bytes) >= 12 and header_bytes.startswith(b'RIFF') and b'WEBP' in header_bytes[8:12]
    if ext == '.pdf':
        return header_bytes.startswith(b'%PDF')
    return False


def save_receipt_file(file_obj=None, base64_str=None, order_ref='receipt'):
    """
    Saves a receipt image or document to MEDIA_ROOT / 'receipts' with a cryptographically secure
    random filename to prevent enumeration and unauthorized access.
    """
    import secrets
    media_root = getattr(settings, 'MEDIA_ROOT', None) or (Path(__file__).resolve().parent.parent / 'media')
    receipts_dir = Path(media_root) / 'receipts'
    os.makedirs(receipts_dir, exist_ok=True)

    safe_ref = ''.join(c for c in str(order_ref) if c.isalnum() or c in ('-', '_')).strip() or 'rec'
    ts = int(datetime.now(timezone.utc).timestamp())
    rand_entropy = secrets.token_hex(16)

    if file_obj:
        ext = os.path.splitext(file_obj.name)[1].lower() or '.jpg'
        if ext not in ('.jpg', '.jpeg', '.png', '.webp', '.pdf'):
            ext = '.jpg'
        filename = f"{safe_ref}_{ts}_{rand_entropy}{ext}"
        dest_path = receipts_dir / filename
        with open(dest_path, 'wb+') as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)
        return f"/media/receipts/{filename}"

    if base64_str and isinstance(base64_str, str) and base64_str.startswith('data:'):
        try:
            header, encoded = base64_str.split(';base64,', 1)
            ext = '.jpg'
            if 'png' in header:
                ext = '.png'
            elif 'webp' in header:
                ext = '.webp'
            elif 'pdf' in header:
                ext = '.pdf'
            filename = f"{safe_ref}_{ts}_{rand_entropy}{ext}"
            dest_path = receipts_dir / filename
            data_bytes = base64.b64decode(encoded)
            with open(dest_path, 'wb+') as dest:
                dest.write(data_bytes)
            return f"/media/receipts/{filename}"
        except Exception:
            return None

    return None


class ReceiptUploadAPIView(views.APIView):
    """
    Dedicated secure receipt upload endpoint.
    Accepts multipart form-data with file under 'receipt', 'file', or 'payment_proof'.
    Validates:
    - Allowed file types: JPEG, PNG, WEBP, PDF with verified magic byte signatures
    - Max size: 10MB
    Stores in MEDIA_ROOT / 'receipts' with unpredictable high-entropy tokenized filenames.
    """
    permission_classes = [permissions.AllowAny]
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.pdf'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    def post(self, request):
        allowed, retry_after = check_rate_limit(request, action='receipt_upload', max_requests=15, window_seconds=600)
        if not allowed:
            return rate_limit_response(retry_after, action_name='Receipt Upload')

        uploaded_file = (
            request.FILES.get('receipt') or
            request.FILES.get('file') or
            request.FILES.get('payment_proof') or
            request.FILES.get('payment_proof_file')
        )
        if not uploaded_file:
            return Response({'error': 'No receipt file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_file.size > self.MAX_FILE_SIZE:
            return Response({'error': 'Receipt image/document size must not exceed 10MB.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response({
                'error': f"Invalid file format '{ext}'. Allowed formats are JPEG, PNG, WEBP, and PDF."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Inspect binary magic bytes to prevent file extension spoofing
        header_sample = uploaded_file.read(16)
        uploaded_file.seek(0)
        if not _verify_file_magic_bytes(header_sample, ext):
            return Response({
                'error': f"File content does not match the declared extension '{ext}'. Please upload a valid image or PDF document."
            }, status=status.HTTP_400_BAD_REQUEST)

        order_ref = str(request.data.get('order_reference') or 'receipt').strip()
        receipt_url = save_receipt_file(file_obj=uploaded_file, order_ref=order_ref)
        if not receipt_url:
            return Response({'error': 'Failed to save receipt file to storage.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        filename = os.path.basename(receipt_url)
        record_audit_event(
            event_type='RECEIPT_UPLOADED',
            actor_email=getattr(request.user, 'email', None) or 'anonymous',
            actor_role='CUSTOMER' if getattr(request.user, 'is_authenticated', False) else 'ANONYMOUS',
            entity_type='RECEIPT',
            entity_id=filename,
            metadata={'order_reference': order_ref, 'file_size': uploaded_file.size},
            request=request,
        )
        return Response({
            'success': True,
            'receipt_url': receipt_url,
            'file_name': filename,
            'file_size': uploaded_file.size,
        }, status=status.HTTP_201_CREATED)


class SubmitPaymentEvidenceAPIView(views.APIView):
    """
    Customer submits manual bank transfer receipt and transfer details.
    Creates or updates an authoritative payment record with status PENDING_VERIFICATION.
    Preserves all customer-submitted fields:
    - customer_name
    - customer_email
    - order_reference
    - amount (declared payment amount)
    - sender_bank
    - sender_account_name
    - transaction_reference
    - payment_proof_url
    - notes
    - created_at / submitted_at
    Updates associated order payment_status to PENDING_VERIFICATION.
    Fulfillment status remains ORDER_PLACED (never PENDING_PAYMENT).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        allowed, retry_after = check_rate_limit(request, action='payment_evidence', max_requests=10, window_seconds=600)
        if not allowed:
            return rate_limit_response(retry_after, action_name='Payment Evidence Submission')

        data = request.data or {}
        order_ref = str(data.get('order_reference') or data.get('order_id') or '').strip()
        if not order_ref:
            return Response({'error': 'order_reference is required'}, status=status.HTTP_400_BAD_REQUEST)

        sender_bank = str(data.get('sender_bank') or '').strip()
        sender_account_name = str(data.get('sender_account_name') or '').strip()
        if not sender_bank:
            return Response({'error': 'sender_bank is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not sender_account_name:
            return Response({'error': 'sender_account_name is required'}, status=status.HTTP_400_BAD_REQUEST)

        amount = str(data.get('amount') or '0').strip()
        transaction_reference = str(data.get('transaction_reference') or data.get('narration') or order_ref).strip()
        notes = str(data.get('notes') or '').strip()

        # Handle uploaded receipt: multipart file OR base64 Data URL OR existing URL
        uploaded_file = (
            request.FILES.get('receipt') or
            request.FILES.get('file') or
            request.FILES.get('payment_proof') or
            request.FILES.get('payment_proof_file')
        )
        payment_proof_url = str(data.get('payment_proof_url') or data.get('proof_url') or '').strip()

        if uploaded_file:
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

        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        store = get_delivery_store()
        payments = store.get('payments', [])
        if not isinstance(payments, list):
            payments = []

        # Find associated order in store to get customer details and expected total
        orders = store.get('orders', [])
        if not isinstance(orders, list):
            orders = []

        norm_ref = order_ref.lower().strip()
        matched_order = next((o for o in orders if (
            str(o.get('reference', '')).lower().strip() == norm_ref or
            str(o.get('reference_code', '')).lower().strip() == norm_ref or
            str(o.get('id', '')).lower().strip() == norm_ref
        )), None)

        # Enforce customer ownership authorization:
        user = getattr(request, 'user', None)
        if user and getattr(user, 'is_authenticated', False):
            is_admin = getattr(user, 'role', '') == 'ADMIN' or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)
            if not is_admin and matched_order:
                u_id = str(getattr(user, 'id', '') or '')
                u_email = str(getattr(user, 'email', '') or '').lower().strip()
                o_cid = str(matched_order.get('customer_id') or matched_order.get('buyer_id') or '')
                o_email = str(matched_order.get('buyer_email') or (matched_order.get('delivery_address') or {}).get('email') or '').lower().strip()
                if (u_id and o_cid and u_id != o_cid) and (u_email and o_email and u_email != o_email):
                    return Response({
                        'error': 'FORBIDDEN',
                        'message': 'You do not have permission to submit payment evidence for an order belonging to another customer.'
                    }, status=status.HTTP_403_FORBIDDEN)

        # Prevent payment submission on already verified or cancelled orders
        if matched_order:
            if matched_order.get('payment_status') in ('PAID', 'VERIFIED'):
                return Response({
                    'error': 'PAYMENT_ALREADY_VERIFIED',
                    'message': 'Payment for this order has already been verified and confirmed. No additional evidence required.'
                }, status=status.HTTP_409_CONFLICT)
            if matched_order.get('status') == 'CANCELLED':
                return Response({
                    'error': 'ORDER_CANCELLED',
                    'message': 'Cannot submit payment for a cancelled order.'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Check existing submission for this order
        existing_idx = next((i for i, p in enumerate(payments) if (
            str(p.get('order_reference', '')).lower().strip() == norm_ref or
            str(p.get('order_id', '')).lower().strip() == norm_ref
        )), None)

        existing_record = payments[existing_idx] if existing_idx is not None else None
        if existing_record and existing_record.get('status') in ('VERIFIED', 'PAID'):
            return Response({
                'error': 'PAYMENT_ALREADY_VERIFIED',
                'message': 'Payment for this order has already been verified and confirmed.'
            }, status=status.HTTP_409_CONFLICT)

        # Prevent duplicate transaction reference fraud across different orders
        norm_tx_ref = transaction_reference.strip().lower()
        if norm_tx_ref and norm_tx_ref != norm_ref:
            dup_payment = next((p for p in payments if (
                str(p.get('transaction_reference', '')).strip().lower() == norm_tx_ref and
                str(p.get('order_reference', '')).lower().strip() != norm_ref and
                str(p.get('order_id', '')).lower().strip() != norm_ref and
                p.get('status') in ('VERIFIED', 'PENDING_VERIFICATION')
            )), None)
            if dup_payment:
                return Response({
                    'error': 'DUPLICATE_TRANSACTION_REFERENCE',
                    'message': 'This bank transaction reference has already been submitted or verified for another order. Each payment transaction reference must be unique.'
                }, status=status.HTTP_409_CONFLICT)

        customer_name = (
            str(data.get('customer_name') or '').strip() or
            (matched_order.get('buyer_name') if matched_order else None) or
            ((matched_order.get('delivery_address') or {}).get('recipient_name') if matched_order else None) or
            sender_account_name
        )
        customer_email = (
            str(data.get('customer_email') or '').strip() or
            (matched_order.get('buyer_email') if matched_order else None) or
            ((matched_order.get('delivery_address') or {}).get('email') if matched_order else None) or
            getattr(request.user, 'email', '')
        )
        expected_total = str(matched_order.get('total') or matched_order.get('total_amount') or amount) if matched_order else amount

        # Check associated 60-minute payment session
        sessions = store.get('paymentSessions', [])
        if not isinstance(sessions, list):
            sessions = []
        session = next((s for s in sessions if (
            str(s.get('order_reference', '')).lower().strip() == norm_ref or
            str(s.get('id', '')).lower().strip() == str(data.get('payment_session_id', '')).lower().strip()
        )), None)

        if session:
            try:
                exp_dt = datetime.fromisoformat(session['expires_at'].replace('Z', '+00:00'))
            except Exception:
                exp_dt = now - timedelta(seconds=1)

            if session.get('status') == 'EXPIRED' or (now > exp_dt and session.get('status') == 'ACTIVE'):
                session['status'] = 'EXPIRED'
                save_delivery_store(store)
                return Response({
                    'error': 'PAYMENT_SESSION_EXPIRED',
                    'message': f"This payment session expired at {session.get('expires_at')}. Please initiate a new payment session to complete your bank transfer.",
                    'session_id': session.get('id'),
                    'order_reference': order_ref,
                }, status=status.HTTP_400_BAD_REQUEST)

            session['status'] = 'EVIDENCE_SUBMITTED'
            session['evidence_submitted_at'] = now_iso
            session['payment_verification_status'] = 'PENDING_VERIFICATION'

        # Check existing submission for this order
        existing_idx = next((i for i, p in enumerate(payments) if (
            str(p.get('order_reference', '')).lower().strip() == norm_ref or
            str(p.get('order_id', '')).lower().strip() == norm_ref
        )), None)

        existing_record = payments[existing_idx] if existing_idx is not None else None
        payment_id = existing_record.get('id') if existing_record else f"pay-{uuid.uuid4().hex[:10]}"
        payment_ref = existing_record.get('reference') if existing_record else f"PAY-{order_ref}-{uuid.uuid4().hex[:6].upper()}"

        payment_record = {
            'id': payment_id,
            'reference': payment_ref,
            'payment_reference': payment_ref,
            'order_reference': order_ref,
            'order_id': matched_order.get('id') if matched_order else order_ref,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'expected_amount': expected_total,
            'payment_session_id': session.get('id') if session else data.get('payment_session_id'),
            'provider': 'BANK_TRANSFER',
            'status': 'PENDING_VERIFICATION',
            'amount': amount,
            'currency': data.get('currency', 'NGN'),
            'sender_bank': sender_bank,
            'sender_account_name': sender_account_name,
            'transaction_reference': transaction_reference,
            'payment_proof_url': payment_proof_url,
            'notes': notes,
            'created_at': existing_record.get('created_at') if existing_record else now_iso,
            'submitted_at': now_iso,
            'verified_at': None,
            'verified_by': None,
            'rejection_reason': None,
        }

        if session:
            session['payment_evidence_id'] = payment_record['id']

        if existing_idx is not None:
            payments[existing_idx] = payment_record
        else:
            payments.insert(0, payment_record)

        store['payments'] = payments
        store['paymentSessions'] = sessions

        # Update order status: payment_status -> PENDING_VERIFICATION; status -> ORDER_PLACED (never PENDING_PAYMENT)
        if matched_order:
            matched_order['payment_status'] = 'PENDING_VERIFICATION'
            matched_order['payment_submitted_at'] = now_iso
            matched_order['payment_reference'] = payment_record['reference']
            matched_order['payment_evidence'] = payment_record
            matched_order['sender_bank'] = sender_bank
            matched_order['sender_account_name'] = sender_account_name
            matched_order['transaction_reference'] = transaction_reference
            matched_order['payment_proof_url'] = payment_proof_url
            if matched_order.get('status') in ('PENDING_PAYMENT', None, ''):
                matched_order['status'] = 'ORDER_PLACED'
                matched_order['fulfillment_status'] = 'ORDER_PLACED'
        else:
            # Create synthetic order record in store so it is always retrievable
            new_order = {
                'id': order_ref,
                'reference': order_ref,
                'reference_code': order_ref,
                'buyer_name': customer_name,
                'buyer_email': customer_email,
                'status': 'ORDER_PLACED',
                'fulfillment_status': 'ORDER_PLACED',
                'payment_status': 'PENDING_VERIFICATION',
                'payment_submitted_at': now_iso,
                'payment_reference': payment_record['reference'],
                'payment_evidence': payment_record,
                'sender_bank': sender_bank,
                'sender_account_name': sender_account_name,
                'transaction_reference': transaction_reference,
                'payment_proof_url': payment_proof_url,
                'total': amount,
                'total_amount': amount,
                'created_at': now_iso,
            }
            orders.insert(0, new_order)

        store['orders'] = orders
        save_delivery_store(store)

        record_audit_event(
            event_type='PAYMENT_EVIDENCE_SUBMITTED',
            actor_email=customer_email,
            actor_role='CUSTOMER',
            entity_type='PAYMENT',
            entity_id=payment_record['reference'],
            amount=amount,
            previous_status=existing_record.get('status') if existing_record else None,
            new_status='PENDING_VERIFICATION',
            metadata={
                'order_reference': order_ref,
                'sender_bank': sender_bank,
                'sender_account_name': sender_account_name,
                'transaction_reference': transaction_reference,
            },
            request=request,
        )

        return Response(payment_record, status=status.HTTP_201_CREATED)


class PaymentEvidenceDetailAPIView(views.APIView):
    """
    Retrieves authoritative submitted payment evidence by order reference or payment reference.
    Enriched with customer details and expected order amount.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        order_ref = str(request.query_params.get('order_reference') or request.query_params.get('reference') or '').strip()
        if not order_ref:
            return Response({'error': 'order_reference parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        store = get_delivery_store()
        payments = store.get('payments', [])
        norm_ref = order_ref.lower().strip()

        match = next((p for p in payments if (
            str(p.get('order_reference', '')).lower().strip() == norm_ref or
            str(p.get('reference', '')).lower().strip() == norm_ref or
            str(p.get('id', '')).lower().strip() == norm_ref
        )), None)

        orders = store.get('orders', [])
        matched_order = next((o for o in orders if (
            str(o.get('reference', '')).lower().strip() == norm_ref or
            str(o.get('reference_code', '')).lower().strip() == norm_ref or
            str(o.get('id', '')).lower().strip() == norm_ref
        )), None)

        if match:
            match_dict = dict(match)
            if matched_order:
                if not match_dict.get('customer_name'):
                    match_dict['customer_name'] = matched_order.get('buyer_name') or (matched_order.get('delivery_address') or {}).get('recipient_name') or 'Customer'
                if not match_dict.get('customer_email'):
                    match_dict['customer_email'] = matched_order.get('buyer_email') or (matched_order.get('delivery_address') or {}).get('email') or ''
                if not match_dict.get('expected_amount'):
                    match_dict['expected_amount'] = str(matched_order.get('total') or matched_order.get('total_amount') or '0')
            return Response(match_dict, status=status.HTTP_200_OK)

        # If order exists with payment details on the order object itself
        if matched_order and matched_order.get('payment_evidence'):
            return Response(matched_order['payment_evidence'], status=status.HTTP_200_OK)

        return Response({'detail': f'No payment evidence found for order reference: {order_ref}'}, status=status.HTTP_404_NOT_FOUND)


class AdminPaymentsListAPIView(views.APIView):
    """
    Lists submitted bank transfer payments with status filtering and search.
    Enriches payments with customer details from associated orders.
    """
    permission_classes = [IsAdminRolePermission]

    def get(self, request):
        status_filter = request.query_params.get('status', '').strip().upper()
        search_query = request.query_params.get('search', '').strip().lower()
        page = max(1, int(request.query_params.get('page', 1) or 1))
        page_size = 20

        store = get_delivery_store()
        payments = store.get('payments', [])
        if not isinstance(payments, list):
            payments = []

        orders = store.get('orders', [])
        orders_by_ref = {}
        for o in orders:
            ref = str(o.get('reference') or o.get('reference_code') or o.get('id') or '').lower().strip()
            if ref:
                orders_by_ref[ref] = o

        # Enrich payments with order customer details
        enriched_payments = []
        for p in payments:
            pref = str(p.get('order_reference') or p.get('order_id') or '').lower().strip()
            associated_order = orders_by_ref.get(pref)
            p_copy = dict(p)
            if associated_order:
                if not p_copy.get('customer_name'):
                    p_copy['customer_name'] = associated_order.get('buyer_name') or (associated_order.get('delivery_address') or {}).get('recipient_name') or 'Customer'
                if not p_copy.get('customer_email'):
                    p_copy['customer_email'] = associated_order.get('buyer_email') or (associated_order.get('delivery_address') or {}).get('email') or ''
                if not p_copy.get('expected_amount'):
                    p_copy['expected_amount'] = str(associated_order.get('total') or associated_order.get('total_amount') or '0')
            enriched_payments.append(p_copy)

        if status_filter:
            if status_filter in ('PENDING', 'PENDING_VERIFICATION'):
                filtered = [p for p in enriched_payments if (p.get('status') or '').upper() in ('PENDING', 'PENDING_VERIFICATION')]
            elif status_filter in ('VERIFIED', 'PAID'):
                filtered = [p for p in enriched_payments if (p.get('status') or '').upper() in ('VERIFIED', 'PAID')]
            else:
                filtered = [p for p in enriched_payments if (p.get('status') or '').upper() == status_filter]
        else:
            filtered = enriched_payments

        if search_query:
            filtered = [
                p for p in filtered
                if (
                    search_query in str(p.get('order_reference', '')).lower() or
                    search_query in str(p.get('reference', '')).lower() or
                    search_query in str(p.get('sender_account_name', '')).lower() or
                    search_query in str(p.get('sender_bank', '')).lower() or
                    search_query in str(p.get('customer_email', '')).lower() or
                    search_query in str(p.get('customer_name', '')).lower() or
                    search_query in str(p.get('transaction_reference', '')).lower()
                )
            ]

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
        allowed, retry_after = check_rate_limit(request, action='payment_verify', max_requests=30, window_seconds=600)
        if not allowed:
            return rate_limit_response(retry_after, action_name='Payment Verification')

        store = get_delivery_store()
        payments = store.get('payments', [])
        norm_id = str(payment_id).lower().strip()

        target = next((p for p in payments if (
            str(p.get('id', '')).lower().strip() == norm_id or
            str(p.get('reference', '')).lower().strip() == norm_id or
            str(p.get('order_reference', '')).lower().strip() == norm_id
        )), None)

        now_iso = datetime.now(timezone.utc).isoformat()
        admin_email = getattr(request.user, 'email', None) or request.data.get('verified_by') or 'Administrator'
        prev_status = target.get('status') if target else None

        # Check associated order to prevent approving cancelled orders
        order_ref = target.get('order_reference') if target else payment_id
        norm_order_ref = str(order_ref).lower().strip()
        orders = store.get('orders', [])
        matched_order = next((o for o in orders if (
            str(o.get('reference', '')).lower().strip() == norm_order_ref or
            str(o.get('reference_code', '')).lower().strip() == norm_order_ref or
            str(o.get('id', '')).lower().strip() == norm_order_ref
        )), None)

        if matched_order and matched_order.get('status') == 'CANCELLED':
            return Response({'error': 'Cannot verify payment for a cancelled order.'}, status=status.HTTP_400_BAD_REQUEST)

        if not target:
            # Create verified payment entry if matching order exists
            target = {
                'id': f"pay-{uuid.uuid4().hex[:10]}",
                'reference': f"PAY-{payment_id}",
                'order_reference': payment_id,
                'provider': 'BANK_TRANSFER',
                'status': 'VERIFIED',
                'amount': str(request.data.get('amount') or (matched_order.get('total') if matched_order else '0')),
                'currency': 'NGN',
                'created_at': now_iso,
                'verified_at': now_iso,
                'verified_by': admin_email,
                'notes': request.data.get('notes', ''),
            }
            payments.insert(0, target)
        elif (target.get('status') or '').upper() in ('VERIFIED', 'PAID'):
            return Response({
                'already_verified': True,
                'message': 'Payment is already verified.',
                'payment': target,
            }, status=status.HTTP_200_OK)
        else:
            target['status'] = 'VERIFIED'
            target['verified_at'] = now_iso
            target['verified_by'] = admin_email
            target['notes'] = request.data.get('notes', target.get('notes', ''))

        for ord_obj in orders:
            if (
                str(ord_obj.get('reference', '')).lower().strip() == norm_order_ref or
                str(ord_obj.get('reference_code', '')).lower().strip() == norm_order_ref or
                str(ord_obj.get('id', '')).lower().strip() == norm_order_ref
            ):
                ord_obj['payment_status'] = 'PAID'
                curr_f = ord_obj.get('status')
                if curr_f in ('PENDING_PAYMENT', 'ORDER_PLACED', None, ''):
                    ord_obj['status'] = 'PROCESSING'
                ord_obj['fulfillment_status'] = ord_obj.get('status')
                ord_obj['verified_at'] = now_iso
                ord_obj['verified_by'] = admin_email
                ord_obj['payment_evidence'] = target
                break

        # Update associated payment session
        sessions = store.get('paymentSessions', [])
        for s in sessions:
            if (
                str(s.get('order_reference', '')).lower().strip() == norm_order_ref or
                str(s.get('id', '')).lower().strip() == str(target.get('payment_session_id', '')).lower().strip()
            ):
                s['payment_verification_status'] = 'VERIFIED'
                s['status'] = 'CLOSED'

        # Confirm promotional giveaway reservation if present
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
        save_delivery_store(store)

        record_audit_event(
            event_type='PAYMENT_VERIFIED',
            actor_email=admin_email,
            actor_role='ADMIN',
            entity_type='PAYMENT',
            entity_id=target.get('reference') or payment_id,
            amount=str(target.get('amount') or '0'),
            previous_status=prev_status,
            new_status='VERIFIED',
            metadata={'order_reference': order_ref, 'notes': target.get('notes')},
            request=request,
        )

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
        allowed, retry_after = check_rate_limit(request, action='payment_reject', max_requests=30, window_seconds=600)
        if not allowed:
            return rate_limit_response(retry_after, action_name='Payment Rejection')

        reason = request.data.get('rejection_reason', '').strip()
        if not reason:
            return Response({'error': 'rejection_reason is required.'}, status=status.HTTP_400_BAD_REQUEST)

        store = get_delivery_store()
        payments = store.get('payments', [])
        norm_id = str(payment_id).lower().strip()

        target = next((p for p in payments if (
            str(p.get('id', '')).lower().strip() == norm_id or
            str(p.get('reference', '')).lower().strip() == norm_id or
            str(p.get('order_reference', '')).lower().strip() == norm_id
        )), None)

        if not target:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        now_iso = datetime.now(timezone.utc).isoformat()
        admin_email = getattr(request.user, 'email', None) or 'Administrator'
        prev_status = target.get('status')

        target['status'] = 'REJECTED'
        target['rejection_reason'] = reason
        target['verified_at'] = now_iso
        target['verified_by'] = admin_email

        order_ref = target.get('order_reference') or payment_id
        norm_order_ref = str(order_ref).lower().strip()
        orders = store.get('orders', [])
        for ord_obj in orders:
            if (
                str(ord_obj.get('reference', '')).lower().strip() == norm_order_ref or
                str(ord_obj.get('reference_code', '')).lower().strip() == norm_order_ref or
                str(ord_obj.get('id', '')).lower().strip() == norm_order_ref
            ):
                ord_obj['payment_status'] = 'REJECTED'
                ord_obj['payment_rejection_reason'] = reason
                ord_obj['payment_evidence'] = target
                break

        # Update associated payment session
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
        save_delivery_store(store)

        record_audit_event(
            event_type='PAYMENT_REJECTED',
            actor_email=admin_email,
            actor_role='ADMIN',
            entity_type='PAYMENT',
            entity_id=target.get('reference') or payment_id,
            amount=str(target.get('amount') or '0'),
            previous_status=prev_status,
            new_status='REJECTED',
            metadata={'order_reference': order_ref, 'rejection_reason': reason},
            request=request,
        )

        return Response({
            'success': True,
            'message': f"Payment for order {order_ref} rejected. Reason: {reason}",
            'payment': target,
        }, status=status.HTTP_200_OK)

class OrderTransitionAPIView(views.APIView):
    """
    Updates order fulfillment status across the simplified 7-stage lifecycle:
    ORDER_PLACED -> PROCESSING -> READY_FOR_DISPATCH -> DISPATCHED -> OUT_FOR_DELIVERY -> DELIVERED (or CANCELLED)
    Enforces valid status transitions and synchronizes individual shipments.
    """
    permission_classes = [IsAdminRolePermission]

    VALID_STATUSES = [
        'ORDER_PLACED',
        'PROCESSING',
        'READY_FOR_DISPATCH',
        'DISPATCHED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
    ]

    def post(self, request, order_id):
        raw_status = request.data.get('status', '').strip().upper()
        if not raw_status:
            return Response({'error': 'status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize legacy / historical statuses safely
        new_status = raw_status
        if new_status in ('SOURCING_PRODUCTS', 'AWAITING_PRODUCTS_AT_HUB', 'PRODUCTS_RECEIVED', 'QUALITY_CHECK', 'READY_FOR_PACKAGING', 'AWAITING_DELIVERY_CONFIRMATION', 'DELIVERY_FEE_CONFIRMED'):
            new_status = 'PROCESSING'
        elif new_status == 'PACKAGED':
            new_status = 'READY_FOR_DISPATCH'
        elif new_status in ('SHIPPED', 'IN_TRANSIT'):
            new_status = 'DISPATCHED'
        elif new_status in ('RECEIVED', 'COMPLETED'):
            new_status = 'DELIVERED'

        if new_status not in self.VALID_STATUSES:
            return Response({
                'error': f"Invalid fulfillment status '{raw_status}'. Allowed statuses are: {', '.join(self.VALID_STATUSES)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        store = get_delivery_store()
        orders = store.get('orders', [])
        matched = next((o for o in orders if o.get('id') == order_id or o.get('reference') == order_id or o.get('reference_code') == order_id), None)

        now_iso = datetime.now(timezone.utc).isoformat()
        notes = request.data.get('notes', '')

        # Check existing status to validate transitions
        if matched:
            current_status = matched.get('status') or matched.get('fulfillment_status') or 'ORDER_PLACED'
            # CANCELLED is a terminal status; require explicit force/override to revive
            if current_status == 'CANCELLED' and new_status != 'CANCELLED' and not request.data.get('override_cancelled'):
                return Response({
                    'error': 'Order is Cancelled. Cancelled orders cannot be transitioned without an authorized override.'
                }, status=status.HTTP_400_BAD_REQUEST)

            matched['status'] = new_status
            matched['fulfillment_status'] = new_status
            matched['updated_at'] = now_iso
            if notes:
                matched['fulfillment_notes'] = notes

            # Synchronize single-shipment orders
            shipments_map = store.get('order_shipments', {})
            ref = matched.get('reference') or matched.get('reference_code') or matched.get('id')
            shipments = shipments_map.get(ref) or shipments_map.get(matched.get('id'))
            if isinstance(shipments, list) and len(shipments) == 1:
                shipments[0]['status'] = new_status
                shipments[0]['updated_at'] = now_iso
                if new_status == 'DISPATCHED' and not shipments[0].get('dispatched_at'):
                    shipments[0]['dispatched_at'] = now_iso
                elif new_status == 'DELIVERED':
                    shipments[0]['delivered_at'] = now_iso
        else:
            matched = {
                'id': order_id,
                'reference': order_id,
                'reference_code': order_id,
                'status': new_status,
                'fulfillment_status': new_status,
                'updated_at': now_iso,
                'fulfillment_notes': notes,
            }
            orders.append(matched)

        store['orders'] = orders
        save_delivery_store(store)

        admin_email = getattr(request.user, 'email', None) or 'Administrator'
        record_audit_event(
            event_type='ORDER_STATUS_CHANGED',
            actor_email=admin_email,
            actor_role='ADMIN',
            entity_type='ORDER',
            entity_id=matched.get('reference') or order_id,
            previous_status=current_status if 'current_status' in locals() else None,
            new_status=new_status,
            metadata={'fulfillment_notes': notes},
            request=request,
        )

        return Response(matched, status=status.HTTP_200_OK)


class MinimumOrderSettingsAPIView(views.APIView):
    """
    Admin-controlled minimum checkout value configuration.
    - GET: Retrieves current minimum order value configuration.
    - POST: Updates active configuration (requires admin authorization).
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminRolePermission()]

    def get(self, request):
        store = get_delivery_store()
        settings = get_minimum_order_settings(store)
        return Response(settings, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data or {}
        store = get_delivery_store()
        curr_settings = get_minimum_order_settings(store)

        enabled = data.get('enabled')
        if enabled is None:
            enabled = curr_settings['enabled']
        else:
            enabled = bool(enabled)

        raw_amount = data.get('minimum_amount')
        if raw_amount is not None:
            try:
                min_amount = max(0.0, float(raw_amount))
            except (ValueError, TypeError):
                return Response({'error': 'minimum_amount must be a valid positive number.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            min_amount = curr_settings['minimum_amount']

        user = getattr(request, 'user', None)
        admin_identifier = getattr(user, 'email', None) or (f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}").strip() or 'Administrator'
        now_iso = datetime.now(timezone.utc).isoformat()

        updated_settings = {
            'enabled': enabled,
            'minimum_amount': min_amount,
            'updated_at': now_iso,
            'updated_by': admin_identifier,
        }

        store['minimumOrderSettings'] = updated_settings
        save_delivery_store(store)

        return Response({
            'success': True,
            'message': f"Minimum checkout value updated to ₦{min_amount:,.2f} ({'Enabled' if enabled else 'Disabled'}).",
            'settings': updated_settings,
        }, status=status.HTTP_200_OK)


class PaymentSessionListCreateAPIView(views.APIView):
    """
    Payment Session management enforcing a strict 60-minute lifetime.
    - POST: Creates or retrieves the active 60-minute payment session for an order.
            Calculates: Expiry Time = Payment Session Creation Time + 60 Minutes.
            Countdown is persistent and does NOT restart on page reload.
    - GET: Retrieves active payment session for an order, reporting authoritative server time.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        allowed, retry_after = check_rate_limit(request, action='payment_session', max_requests=30, window_seconds=600)
        if not allowed:
            return rate_limit_response(retry_after, action_name='Payment Session')

        data = request.data or {}
        order_ref = data.get('order_reference') or data.get('order_id') or ''
        if not order_ref:
            return Response({'error': 'order_reference is required.'}, status=status.HTTP_400_BAD_REQUEST)

        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        store = get_delivery_store()

        # 1. Enforce minimum order value check if subtotal is passed
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

        # 2. Check existing order status and delivery completeness
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
                }, status=status.HTTP_400_BAD_REQUEST)

        sessions = store.get('paymentSessions', [])
        if not isinstance(sessions, list):
            sessions = []

        force_new = bool(data.get('force_new', False))

        # Check existing session for this order
        existing_session = next((s for s in sessions if s.get('order_reference') == order_ref or (data.get('checkout_session_id') and s.get('checkout_session_id') == data.get('checkout_session_id'))), None)

        if existing_session and not force_new:
            try:
                exp_dt = datetime.fromisoformat(existing_session['expires_at'].replace('Z', '+00:00'))
            except Exception:
                exp_dt = now - timedelta(seconds=1)

            # If still active and not expired
            if exp_dt > now and existing_session.get('status') == 'ACTIVE':
                remaining_sec = max(0, int((exp_dt - now).total_seconds()))
                existing_session['server_time'] = now_iso
                existing_session['remaining_seconds'] = remaining_sec
                return Response(existing_session, status=status.HTTP_200_OK)
            elif exp_dt <= now and existing_session.get('status') == 'ACTIVE':
                existing_session['status'] = 'EXPIRED'
                store['paymentSessions'] = sessions
                save_delivery_store(store)
            elif existing_session.get('status') == 'EVIDENCE_SUBMITTED':
                existing_session['server_time'] = now_iso
                existing_session['remaining_seconds'] = 0
                return Response(existing_session, status=status.HTTP_200_OK)

        # Create new 60-minute payment session
        user = getattr(request, 'user', None)
        customer_id = data.get('customer_id') or (str(user.id) if (user and user.is_authenticated) else None)
        customer_email = data.get('customer_email') or (user.email if (user and user.is_authenticated) else None)
        customer_name = data.get('customer_name') or (f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip() if (user and user.is_authenticated) else 'Customer')
        amount = str(data.get('amount') or (ord_obj.get('total') if ord_obj else '0'))

        expires_at = (now + timedelta(minutes=60)).isoformat()
        new_session = {
            'id': f"psess_{uuid.uuid4().hex[:12]}",
            'order_reference': order_ref,
            'order_id': ord_obj.get('id') if ord_obj else order_ref,
            'checkout_session_id': data.get('checkout_session_id', ''),
            'customer_id': customer_id,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'amount': amount,
            'currency': data.get('currency', 'NGN'),
            'created_at': now_iso,
            'expires_at': expires_at,
            'status': 'ACTIVE',
            'evidence_submitted_at': None,
            'payment_evidence_id': None,
            'payment_verification_status': 'PENDING',
            'server_time': now_iso,
            'remaining_seconds': 3600,
        }

        # If previous session existed, mark it closed/superseded
        if existing_session:
            existing_session['status'] = 'CLOSED'

        sessions.insert(0, new_session)
        store['paymentSessions'] = sessions
        save_delivery_store(store)

        return Response(new_session, status=status.HTTP_201_CREATED)

    def get(self, request):
        order_ref = request.query_params.get('order_reference') or request.query_params.get('session_id') or ''
        if not order_ref:
            return Response({'error': 'order_reference or session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        store = get_delivery_store()
        sessions = store.get('paymentSessions', [])

        session = next((s for s in sessions if s.get('id') == order_ref or s.get('order_reference') == order_ref or s.get('checkout_session_id') == order_ref), None)
        if not session:
            return Response({'error': 'Payment session not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            exp_dt = datetime.fromisoformat(session['expires_at'].replace('Z', '+00:00'))
        except Exception:
            exp_dt = now

        if exp_dt <= now and session.get('status') == 'ACTIVE':
            session['status'] = 'EXPIRED'
            save_delivery_store(store)

        remaining_sec = max(0, int((exp_dt - now).total_seconds())) if session.get('status') == 'ACTIVE' else 0
        session_data = {
            **session,
            'server_time': now_iso,
            'remaining_seconds': remaining_sec,
        }

        return Response(session_data, status=status.HTTP_200_OK)


class PaymentSessionDetailAPIView(views.APIView):
    """
    Detailed status of an individual payment session.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, session_id):
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        store = get_delivery_store()
        sessions = store.get('paymentSessions', [])

        session = next((s for s in sessions if s.get('id') == session_id or s.get('order_reference') == session_id), None)
        if not session:
            return Response({'error': 'Payment session not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            exp_dt = datetime.fromisoformat(session['expires_at'].replace('Z', '+00:00'))
        except Exception:
            exp_dt = now

        if exp_dt <= now and session.get('status') == 'ACTIVE':
            session['status'] = 'EXPIRED'
            save_delivery_store(store)

        remaining_sec = max(0, int((exp_dt - now).total_seconds())) if session.get('status') == 'ACTIVE' else 0
        return Response({
            **session,
            'server_time': now_iso,
            'remaining_seconds': remaining_sec,
        }, status=status.HTTP_200_OK)


class PaymentSessionRenewAPIView(views.APIView):
    """
    Customer initiates a fresh 60-minute payment session for an existing unpaid order.
    Validates order is not already paid or verified, and avoids creating duplicate orders.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, session_id):
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        store = get_delivery_store()
        sessions = store.get('paymentSessions', [])

        session = next((s for s in sessions if s.get('id') == session_id or s.get('order_reference') == session_id), None)
        if not session:
            return Response({'error': 'Payment session not found.'}, status=status.HTTP_404_NOT_FOUND)

        order_ref = session.get('order_reference')
        orders = store.get('orders', [])
        ord_obj = next((o for o in orders if o.get('reference') == order_ref or o.get('id') == order_ref), None)

        if ord_obj and (ord_obj.get('payment_status') or '').upper() in ('PAID', 'VERIFIED'):
            return Response({'error': 'Cannot renew payment session. Order is already paid.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark previous session closed
        session['status'] = 'CLOSED'

        new_expires_at = (now + timedelta(minutes=60)).isoformat()
        fresh_session = {
            'id': f"psess_{uuid.uuid4().hex[:12]}",
            'order_reference': order_ref,
            'order_id': ord_obj.get('id') if ord_obj else order_ref,
            'checkout_session_id': session.get('checkout_session_id', ''),
            'customer_id': session.get('customer_id'),
            'customer_name': session.get('customer_name'),
            'customer_email': session.get('customer_email'),
            'amount': session.get('amount'),
            'currency': session.get('currency', 'NGN'),
            'created_at': now_iso,
            'expires_at': new_expires_at,
            'status': 'ACTIVE',
            'evidence_submitted_at': None,
            'payment_evidence_id': None,
            'payment_verification_status': 'PENDING',
            'server_time': now_iso,
            'remaining_seconds': 3600,
        }

        sessions.insert(0, fresh_session)
        store['paymentSessions'] = sessions
        save_delivery_store(store)

        return Response({
            'success': True,
            'message': 'Fresh 60-minute payment session initialized.',
            'session': fresh_session,
        }, status=status.HTTP_201_CREATED)


class AdminPaymentSessionsListAPIView(views.APIView):
    """
    Lists all payment sessions with status filters and active countdown monitoring.
    Allows administrators to inspect active, expired, and evidence-submitted sessions.
    """
    permission_classes = [IsAdminRolePermission]

    def get(self, request):
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        store = get_delivery_store()
        sessions = store.get('paymentSessions', [])
        if not isinstance(sessions, list):
            sessions = []

        status_filter = (request.query_params.get('status') or '').strip().upper()
        search_query = (request.query_params.get('search') or '').strip().lower()

        # Update any sessions whose 60 minutes expired without evidence submitted
        changed = False
        enriched_list = []
        for s in sessions:
            try:
                exp_dt = datetime.fromisoformat(s['expires_at'].replace('Z', '+00:00'))
            except Exception:
                exp_dt = now

            if exp_dt <= now and s.get('status') == 'ACTIVE':
                s['status'] = 'EXPIRED'
                changed = True

            rem = max(0, int((exp_dt - now).total_seconds())) if s.get('status') == 'ACTIVE' else 0

            # Filtering
            if status_filter and status_filter != 'ALL':
                if (s.get('status') or '').upper() != status_filter:
                    continue

            if search_query:
                target_str = f"{s.get('order_reference', '')} {s.get('customer_name', '')} {s.get('customer_email', '')}".lower()
                if search_query not in target_str:
                    continue

            enriched_list.append({
                **s,
                'server_time': now_iso,
                'remaining_seconds': rem,
            })

        if changed:
            save_delivery_store(store)

        return Response({
            'count': len(enriched_list),
            'results': enriched_list,
        }, status=status.HTTP_200_OK)


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
            pref = str(p.get('order_reference') or p.get('order_id') or p.get('reference') or '').lower().strip()
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

            # Normalize fulfillment status so it never displays PENDING_PAYMENT
            if o.get('status') in ('PENDING_PAYMENT', None, ''):
                o['status'] = 'ORDER_PLACED'
                o['fulfillment_status'] = 'ORDER_PLACED'

            # Attach latest payment verification status and evidence
            norm_ref = str(ref).lower().strip()
            norm_id = str(o.get('id', '')).lower().strip()
            p = payment_by_ref.get(norm_ref) or payment_by_ref.get(norm_id)
            if p:
                if p.get('status') in ('VERIFIED', 'PAID'):
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
        allowed, retry_after = check_rate_limit(request, action='order_create', max_requests=20, window_seconds=600)
        if not allowed:
            return rate_limit_response(retry_after, action_name='Order Creation')

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

        has_promotional_gift = False
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
            if not p_cat and catalog_map:
                return Response({
                    'error': 'PRODUCT_NOT_FOUND',
                    'message': f"Item '{it.get('name') or it.get('product_name') or pid}' is not available in the official product catalog."
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                if p_cat and p_cat.get('base_price') is not None:
                    base_p = float(p_cat.get('base_price'))
                else:
                    base_p = float(it.get('unit_price') or it.get('price') or 0)
            except Exception:
                return Response({
                    'error': 'INVALID_PRICE',
                    'message': f"Invalid price specification for product '{it.get('name') or it.get('product_name') or pid}'."
                }, status=status.HTTP_400_BAD_REQUEST)

            if base_p <= 0:
                return Response({
                    'error': 'INVALID_PRICE',
                    'message': f"Product price for '{it.get('name') or it.get('product_name') or pid}' must be greater than zero."
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                raw_qty = int(it.get('quantity') or 1)
            except Exception:
                raw_qty = 1
            if raw_qty < 1 or raw_qty > 100:
                return Response({
                    'error': 'INVALID_QUANTITY',
                    'message': f"Quantity for '{it.get('name') or it.get('product_name') or pid}' must be between 1 and 100."
                }, status=status.HTTP_400_BAD_REQUEST)
            qty = raw_qty

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
                    store['launchGiveaway'] = launch_giveaway

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
        if existing_idx is not None:
            existing_ord = orders[existing_idx]
            if existing_ord.get('payment_status') in ('PAID', 'VERIFIED'):
                return Response({
                    'error': 'ORDER_ALREADY_PAID',
                    'message': 'Cannot modify an order that has already been verified or paid.'
                }, status=status.HTTP_409_CONFLICT)
            if user and getattr(user, 'is_authenticated', False):
                is_admin = getattr(user, 'role', '') == 'ADMIN' or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)
                if not is_admin:
                    curr_cid = str(existing_ord.get('customer_id') or existing_ord.get('buyer_id') or '')
                    if curr_cid and curr_cid != user_id:
                        return Response({
                            'error': 'FORBIDDEN',
                            'message': 'You cannot overwrite an order belonging to another customer.'
                        }, status=status.HTTP_403_FORBIDDEN)

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
            'delivery_fee': str(max(0.0, verified_delivery_fee)),
            'total': str(verified_total),
            'total_amount': str(verified_total),
            'status': 'ORDER_PLACED',
            'fulfillment_status': 'ORDER_PLACED',
            'payment_status': 'PENDING_PAYMENT',
            'created_at': (orders[existing_idx].get('created_at') if existing_idx is not None else None) or data.get('created_at') or now_iso,
            'updated_at': now_iso,
        }

        if existing_idx is not None:
            orders[existing_idx] = {**orders[existing_idx], **order_record}
        else:
            orders.append(order_record)

        store['orders'] = orders
        save_delivery_store(store)

        record_audit_event(
            event_type='ORDER_CREATED',
            actor_email=user_email or 'anonymous',
            actor_role='CUSTOMER' if (user and getattr(user, 'is_authenticated', False)) else 'GUEST',
            entity_type='ORDER',
            entity_id=order_ref,
            amount=str(verified_total),
            previous_status=None,
            new_status='ORDER_PLACED',
            metadata={
                'items_count': len(verified_items),
                'subtotal': verified_subtotal,
                'delivery_fee': verified_delivery_fee,
                'has_promotional_gift': has_promotional_gift,
            },
            request=request,
        )

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
        if not user or not user.is_authenticated:
            guest_email = (request.query_params.get('email') or request.headers.get('X-Guest-Email') or '').lower().strip()
            o_email = str(matched.get('buyer_email') or (matched.get('delivery_address') or {}).get('email') or '').lower().strip()
            if not guest_email or guest_email != o_email:
                return Response({'detail': 'Authentication required to view order details.'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            is_admin = getattr(user, 'role', None) == 'ADMIN' or getattr(user, 'is_staff', False)
            if not is_admin:
                u_id = str(user.id)
                u_email = str(user.email).lower().strip()
                o_cid = str(matched.get('customer_id') or matched.get('buyer_id') or '')
                o_email = str(matched.get('buyer_email') or (matched.get('delivery_address') or {}).get('email') or '').lower().strip()

                p_user_match = False
                payments = store.get('payments', [])
                ref = matched.get('reference') or matched.get('reference_code') or matched.get('id')
                p = next((pay for pay in payments if pay.get('order_reference') == ref or pay.get('order_id') == ref), None)
                if p:
                    p_email = str(p.get('user_email') or p.get('buyer_email') or '').lower().strip()
                    p_cid = str(p.get('customer_id') or p.get('user_id') or '')
                    if (u_id and p_cid == u_id) or (u_email and p_email == u_email):
                        p_user_match = True

                match_found = bool(
                    (u_id and o_cid == u_id) or
                    (u_email and o_email == u_email) or
                    p_user_match
                )

                if not match_found:
                    return Response({'detail': 'You do not have permission to view this order.'}, status=status.HTTP_403_FORBIDDEN)

        # Normalize fulfillment status so it never displays PENDING_PAYMENT
        if matched.get('status') in ('PENDING_PAYMENT', None, ''):
            matched['status'] = 'ORDER_PLACED'
            matched['fulfillment_status'] = 'ORDER_PLACED'

        # Attach payment details if available
        payments = store.get('payments', [])
        ref = matched.get('reference') or matched.get('reference_code') or matched.get('id')
        norm_ref = str(ref).lower().strip()
        p = next((pay for pay in payments if (
            str(pay.get('order_reference', '')).lower().strip() == norm_ref or
            str(pay.get('order_id', '')).lower().strip() == norm_ref or
            str(pay.get('reference', '')).lower().strip() == norm_ref
        )), None)
        if p:
            if p.get('status') in ('VERIFIED', 'PAID'):
                matched['payment_status'] = 'PAID'
            elif p.get('status') == 'REJECTED':
                matched['payment_status'] = 'REJECTED'
            elif p.get('status') == 'PENDING_VERIFICATION':
                matched['payment_status'] = 'PENDING_VERIFICATION'
            matched['payment_evidence'] = p

        return Response(matched, status=status.HTTP_200_OK)


class AdminAuditLogsAPIView(views.APIView):
    """
    Administrative API view to inspect financial and order audit logs.
    Restricted to authorized administrators.
    """
    permission_classes = [IsAdminRolePermission]

    def get(self, request):
        try:
            limit = min(500, max(1, int(request.query_params.get('limit', 100))))
        except ValueError:
            limit = 100
        event_type = request.query_params.get('event_type')
        entity_id = request.query_params.get('entity_id')
        logs = get_audit_logs(limit=limit, event_type=event_type, entity_id=entity_id)
        return Response({
            'count': len(logs),
            'results': logs,
        }, status=status.HTTP_200_OK)


# ==============================================================================
# REUSABLE PROMOTIONAL CAMPAIGN MANAGEMENT & AUDIT LOGS
# ==============================================================================

DEFAULT_PROMO_LAUNCH_GIVEAWAY = {
    'id': 'promo-launch-giveaway',
    'name': 'DOVI Launch Giveaway',
    'headline': 'SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!',
    'description': 'Unlock a complimentary DOVI Wireless EarPod with charging case when your qualifying marketplace product subtotal reaches ₦30,000.',
    'badge_text': 'DOVI LAUNCH GIVEAWAY 🎁',
    'cta_text': 'CLAIM YOUR FREE EARPOD',
    'cta_url': '/products',
    'secondary_text': 'Limited-time offer. Ends 20 December 2026.',
    'image_url': '/images/promotions/dovi_earpods_3d.png',
    'theme': {
        'primary_bg': '#ff7a00',
        'secondary_bg': '#059669',
        'bg_style': 'gradient',
        'text_color': '#ffffff',
        'button_bg': '#ffffff',
        'button_text_color': '#ea580c',
        'badge_bg': 'rgba(255, 255, 255, 0.22)',
        'badge_text_color': '#ffffff',
        'image_position': 'right',
        'layout_variant': 'standard',
    },
    'placements': {
        'homepage_banner': False,
        'recurring_popup': True,
    },
    'popup_frequency_seconds': 20,
    'popup_frequency_label': 'Every 20 seconds',
    'status': 'ACTIVE',
    'start_date': '2026-11-22T00:00:00Z',
    'end_date': '2026-12-20T23:59:59Z',
    'priority': 1,
    'is_giveaway': True,
    'giveaway_config': {
        'qualifying_subtotal': 30000,
        'initial_stock': 20,
        'total_stock': 20,
        'max_allowed_stock': 50,
        'available_stock': 20,
        'reserved_stock': 0,
        'confirmed_stock': 0,
        'max_per_customer': 1,
        'gift_item': {
            'id': 'promo-gift-earpod-2026',
            'product_id': 'promo-gift-earpod-2026',
            'name': 'DOVI Free EarPod (Launch Edition)',
            'description': 'Complimentary DOVI Wireless EarPod with high-definition audio and charging case.',
            'price': '0.00',
            'unit_price': '0.00',
            'quantity': 1,
            'line_total': '0.00',
            'is_promotional_gift': True,
            'sku': 'DOV-GIFT-EARPOD-2026',
            'image_url': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
        },
        'claims': [],
    },
    'created_at': '2026-11-22T20:00:00Z',
    'updated_at': '2026-11-22T20:00:00Z',
    'created_by': 'Administrator',
}


def get_promotional_campaigns(store):
    campaigns = store.get('promotionalCampaigns')
    if not isinstance(campaigns, list) or len(campaigns) == 0:
        campaigns = [DEFAULT_PROMO_LAUNCH_GIVEAWAY]
        store['promotionalCampaigns'] = campaigns
        save_delivery_store(store)
    return campaigns


def record_campaign_audit_log(store, campaign_id, campaign_name, action, admin_user, details=None):
    logs = store.get('campaignAuditLogs', [])
    now_iso = datetime.now(timezone.utc).isoformat()
    entry = {
        'id': f"log-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:5]}",
        'campaign_id': campaign_id,
        'campaign_name': campaign_name,
        'action': action,
        'admin_user': admin_user or 'Administrator',
        'details': details or {},
        'timestamp': now_iso,
    }
    logs.insert(0, entry)
    store['campaignAuditLogs'] = logs[:200]
    save_delivery_store(store)


class PublicPromotionalCampaignsAPIView(views.APIView):
    """
    Public API returning eligible active promotional campaigns for the customer storefront.
    Filters out paused, draft, archived, expired, or not-yet-started campaigns.
    Sorted by priority ascending (1 = highest priority).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)
        now_dt = datetime.now(timezone.utc)

        active_list = []
        for c in campaigns:
            if c.get('status') != 'ACTIVE':
                continue

            # Date boundaries
            try:
                start_iso = c.get('start_date')
                if start_iso:
                    start_dt = datetime.fromisoformat(start_iso.replace('Z', '+00:00'))
                    if now_dt < start_dt:
                        continue
            except Exception:
                pass

            try:
                end_iso = c.get('end_date')
                if end_iso:
                    end_dt = datetime.fromisoformat(end_iso.replace('Z', '+00:00'))
                    if now_dt > end_dt:
                        continue
            except Exception:
                pass

            # If giveaway, verify stock
            if c.get('is_giveaway'):
                g_conf = c.get('giveaway_config', {})
                if int(g_conf.get('available_stock', 20)) <= 0:
                    continue

            active_list.append(c)

        active_list.sort(key=lambda x: int(x.get('priority', 99)))
        return Response({'results': active_list}, status=status.HTTP_200_OK)


class AdminPromotionalCampaignsListCreateAPIView(views.APIView):
    """
    Administrator API for listing all campaigns and creating new campaigns.
    """
    permission_classes = [IsAdminRolePermission]

    def get(self, request):
        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)
        audit_logs = store.get('campaignAuditLogs', [])
        return Response({
            'campaigns': campaigns,
            'audit_logs': audit_logs,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data or {}
        name = (data.get('name') or '').strip()
        headline = (data.get('headline') or '').strip()

        if not name:
            return Response({'error': 'Campaign name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not headline:
            return Response({'error': 'Campaign headline is required.'}, status=status.HTTP_400_BAD_REQUEST)

        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)

        now_iso = datetime.now(timezone.utc).isoformat()
        campaign_id = data.get('id') or f"promo-{uuid.uuid4().hex[:8]}"

        admin_email = getattr(request.user, 'email', None) or 'Administrator'

        new_campaign = {
            'id': campaign_id,
            'name': name,
            'headline': headline,
            'description': data.get('description', ''),
            'badge_text': data.get('badge_text', 'Exclusive Promotion'),
            'cta_text': data.get('cta_text', 'Shop Now'),
            'cta_url': data.get('cta_url', '/products'),
            'secondary_text': data.get('secondary_text', ''),
            'image_url': data.get('image_url') or 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
            'theme': data.get('theme') or {
                'primary_bg': '#ff7a00',
                'secondary_bg': '#059669',
                'bg_style': 'gradient',
                'text_color': '#ffffff',
                'button_bg': '#ffffff',
                'button_text_color': '#ea580c',
                'badge_bg': 'rgba(255, 255, 255, 0.22)',
                'badge_text_color': '#ffffff',
                'image_position': 'right',
                'layout_variant': 'standard',
            },
            'placements': data.get('placements') or {
                'homepage_banner': True,
                'recurring_popup': True,
            },
            'popup_frequency_seconds': int(data.get('popup_frequency_seconds', 20)),
            'popup_frequency_label': data.get('popup_frequency_label') or f"Every {data.get('popup_frequency_seconds', 20)} seconds",
            'status': data.get('status') or 'ACTIVE',
            'start_date': data.get('start_date') or now_iso,
            'end_date': data.get('end_date') or '2026-12-20T23:59:59Z',
            'priority': int(data.get('priority', len(campaigns) + 1)),
            'is_giveaway': bool(data.get('is_giveaway', False)),
            'giveaway_config': data.get('giveaway_config') if data.get('is_giveaway') else None,
            'created_at': now_iso,
            'updated_at': now_iso,
            'created_by': admin_email,
        }

        campaigns.insert(0, new_campaign)
        store['promotionalCampaigns'] = campaigns
        save_delivery_store(store)

        record_campaign_audit_log(store, campaign_id, name, 'CREATED', admin_email, {'headline': headline})

        return Response({
            'success': True,
            'message': f"Promotional campaign '{name}' created successfully.",
            'campaign': new_campaign,
        }, status=status.HTTP_201_CREATED)


class AdminPromotionalCampaignDetailAPIView(views.APIView):
    """
    Administrator API for retrieving, updating, and archiving a specific campaign.
    """
    permission_classes = [IsAdminRolePermission]

    def get(self, request, campaign_id):
        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)
        c = next((item for item in campaigns if str(item.get('id')).lower() == str(campaign_id).lower()), None)
        if not c:
            return Response({'error': 'Campaign not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'campaign': c}, status=status.HTTP_200_OK)

    def put(self, request, campaign_id):
        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)
        idx = next((i for i, item in enumerate(campaigns) if str(item.get('id')).lower() == str(campaign_id).lower()), None)
        if idx is None:
            return Response({'error': 'Campaign not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data or {}
        admin_email = getattr(request.user, 'email', None) or 'Administrator'
        now_iso = datetime.now(timezone.utc).isoformat()

        # Update fields
        target = campaigns[idx]
        for field in ['name', 'headline', 'description', 'badge_text', 'cta_text', 'cta_url', 'secondary_text', 'image_url', 'theme', 'placements', 'popup_frequency_seconds', 'popup_frequency_label', 'status', 'start_date', 'end_date', 'priority']:
            if field in data:
                target[field] = data[field]

        if 'giveaway_config' in data and target.get('is_giveaway'):
            target['giveaway_config'] = {
                **(target.get('giveaway_config') or {}),
                **data['giveaway_config'],
            }

        target['updated_at'] = now_iso
        campaigns[idx] = target
        store['promotionalCampaigns'] = campaigns
        save_delivery_store(store)

        record_campaign_audit_log(store, campaign_id, target.get('name'), 'UPDATED', admin_email)

        return Response({
            'success': True,
            'message': f"Campaign '{target.get('name')}' updated successfully.",
            'campaign': target,
        }, status=status.HTTP_200_OK)

    def delete(self, request, campaign_id):
        # Soft delete (archive)
        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)
        c = next((item for item in campaigns if str(item.get('id')).lower() == str(campaign_id).lower()), None)
        if not c:
            return Response({'error': 'Campaign not found.'}, status=status.HTTP_404_NOT_FOUND)

        admin_email = getattr(request.user, 'email', None) or 'Administrator'
        c['status'] = 'ARCHIVED'
        c['updated_at'] = datetime.now(timezone.utc).isoformat()
        store['promotionalCampaigns'] = campaigns
        save_delivery_store(store)

        record_campaign_audit_log(store, campaign_id, c.get('name'), 'ARCHIVED', admin_email)

        return Response({
            'success': True,
            'message': f"Campaign '{c.get('name')}' archived successfully.",
        }, status=status.HTTP_200_OK)


class AdminPromotionalCampaignPauseAPIView(views.APIView):
    """
    Administrator pauses a campaign.
    - Status set to PAUSED
    - Automatic triggers stop immediately
    - Settings preserved, not deleted
    """
    permission_classes = [IsAdminRolePermission]

    def post(self, request, campaign_id):
        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)
        c = next((item for item in campaigns if str(item.get('id')).lower() == str(campaign_id).lower()), None)
        if not c:
            return Response({'error': 'Campaign not found.'}, status=status.HTTP_404_NOT_FOUND)

        admin_email = getattr(request.user, 'email', None) or 'Administrator'
        c['status'] = 'PAUSED'
        c['updated_at'] = datetime.now(timezone.utc).isoformat()
        store['promotionalCampaigns'] = campaigns
        save_delivery_store(store)

        record_campaign_audit_log(store, campaign_id, c.get('name'), 'PAUSED', admin_email)

        return Response({
            'success': True,
            'message': f"Campaign '{c.get('name')}' paused successfully. Pop-up and banner display halted.",
            'campaign': c,
        }, status=status.HTTP_200_OK)


class AdminPromotionalCampaignResumeAPIView(views.APIView):
    """
    Administrator resumes a paused campaign.
    - Status set to ACTIVE
    - Configuration restored
    - Schedule and limits still enforced
    """
    permission_classes = [IsAdminRolePermission]

    def post(self, request, campaign_id):
        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)
        c = next((item for item in campaigns if str(item.get('id')).lower() == str(campaign_id).lower()), None)
        if not c:
            return Response({'error': 'Campaign not found.'}, status=status.HTTP_404_NOT_FOUND)

        admin_email = getattr(request.user, 'email', None) or 'Administrator'
        c['status'] = 'ACTIVE'
        c['updated_at'] = datetime.now(timezone.utc).isoformat()
        store['promotionalCampaigns'] = campaigns
        save_delivery_store(store)

        record_campaign_audit_log(store, campaign_id, c.get('name'), 'RESUMED', admin_email)

        return Response({
            'success': True,
            'message': f"Campaign '{c.get('name')}' resumed successfully.",
            'campaign': c,
        }, status=status.HTTP_200_OK)


class AdminPromotionalCampaignDuplicateAPIView(views.APIView):
    """
    Administrator duplicates an existing campaign as a draft template.
    """
    permission_classes = [IsAdminRolePermission]

    def post(self, request, campaign_id):
        store = get_delivery_store()
        campaigns = get_promotional_campaigns(store)
        c = next((item for item in campaigns if str(item.get('id')).lower() == str(campaign_id).lower()), None)
        if not c:
            return Response({'error': 'Campaign not found.'}, status=status.HTTP_404_NOT_FOUND)

        admin_email = getattr(request.user, 'email', None) or 'Administrator'
        now_iso = datetime.now(timezone.utc).isoformat()
        new_id = f"promo-{uuid.uuid4().hex[:8]}"

        duplicated = json.loads(json.dumps(c))
        duplicated['id'] = new_id
        duplicated['name'] = f"{c.get('name')} (Copy)"
        duplicated['status'] = 'DRAFT'
        duplicated['created_at'] = now_iso
        duplicated['updated_at'] = now_iso
        duplicated['created_by'] = admin_email
        if duplicated.get('is_giveaway') and duplicated.get('giveaway_config'):
            duplicated['giveaway_config']['claims'] = []
            duplicated['giveaway_config']['reserved_stock'] = 0
            duplicated['giveaway_config']['confirmed_stock'] = 0

        campaigns.insert(0, duplicated)
        store['promotionalCampaigns'] = campaigns
        save_delivery_store(store)

        record_campaign_audit_log(store, new_id, duplicated['name'], 'DUPLICATED', admin_email, {'original_id': campaign_id})

        return Response({
            'success': True,
            'message': f"Campaign duplicated as '{duplicated['name']}'.",
            'campaign': duplicated,
        }, status=status.HTTP_201_CREATED)


# ==============================================================================
# HOMEPAGE HERO PROMOTIONAL BANNERS CMS & CAMPAIGN DESTINATIONS
# ==============================================================================

DEFAULT_HERO_PROMOTIONAL_BANNERS = [
    {
        'id': 'ban-hero-launch',
        'campaign_key': 'launch',
        'title': 'DOVI Launch Campaign',
        'subtitle': 'Discover More, Shop Smart',
        'cta_text': 'Shop Now',
        'cta_url': '/promotions/launch',
        'destination_type': 'CAMPAIGN',
        'desktop_image_url': '/images/hero/hero_launch_campaign.jpg',
        'mobile_image_url': '/images/hero/hero_launch_campaign.jpg',
        'image_url': '/images/hero/hero_launch_campaign.jpg',
        'is_active': True,
        'display_order': 1,
        'slide_interval_ms': 5000,
        'start_date': '2026-11-20T00:00:00Z',
        'end_date': '2026-12-31T23:59:59Z',
        'product_ids': [
            '7a16b38e-6767-4d3e-b95e-1ea5e5df233e',
            '81e58fb1-05fb-4e70-8ffe-206aa97a5a30',
            '9b1920db-b6d5-47e5-8a12-1d7b09d1ad6d',
            '675dcfa8-cede-4398-93fe-26ebf3c5bf2a',
            '04d1916c-5dc3-4d37-9247-a6a37be3ba1e',
            '27e513ea-8080-4b57-98a9-6b1d02ca0427'
        ]
    },
    {
        'id': 'ban-hero-black-friday',
        'campaign_key': 'black-friday',
        'title': 'Black Friday Mega Deals',
        'subtitle': 'Up to 70% OFF on Selected Products',
        'cta_text': 'Shop the Deals',
        'cta_url': '/promotions/black-friday',
        'destination_type': 'CAMPAIGN',
        'desktop_image_url': '/images/hero/hero_black_friday.jpg',
        'mobile_image_url': '/images/hero/hero_black_friday.jpg',
        'image_url': '/images/hero/hero_black_friday.jpg',
        'is_active': True,
        'display_order': 2,
        'slide_interval_ms': 5000,
        'start_date': '2026-11-20T00:00:00Z',
        'end_date': '2026-12-31T23:59:59Z',
        'product_ids': [
            '81e58fb1-05fb-4e70-8ffe-206aa97a5a30',
            '9b1920db-b6d5-47e5-8a12-1d7b09d1ad6d',
            '45d9616d-4af0-491b-b0d5-9b185404732f',
            '74993487-eee2-4648-925c-53e3beaf5429',
            '38897758-8093-46e3-a005-63a4581e3bb7'
        ]
    },
    {
        'id': 'ban-hero-price-drops',
        'campaign_key': 'price-drops',
        'title': 'Price Drops',
        'subtitle': 'More Value, Less Spending on Selected Products',
        'cta_text': 'Shop Price Drops',
        'cta_url': '/promotions/price-drops',
        'destination_type': 'CAMPAIGN',
        'desktop_image_url': '/images/hero/hero_price_drops.jpg',
        'mobile_image_url': '/images/hero/hero_price_drops.jpg',
        'image_url': '/images/hero/hero_price_drops.jpg',
        'is_active': True,
        'display_order': 3,
        'slide_interval_ms': 5000,
        'start_date': '2026-11-20T00:00:00Z',
        'end_date': '2026-12-31T23:59:59Z',
        'product_ids': []
    },
    {
        'id': 'ban-hero-free-gifts',
        'campaign_key': 'rewards',
        'title': 'Free Gifts & Shopping Rewards',
        'subtitle': 'Shop qualifying products and unlock exciting rewards!',
        'cta_text': 'Claim Your Free Gift',
        'cta_url': '/promotions/giveaway',
        'destination_type': 'CAMPAIGN',
        'desktop_image_url': '/images/hero/hero_free_gifts.jpg',
        'mobile_image_url': '/images/hero/hero_free_gifts.jpg',
        'image_url': '/images/hero/hero_free_gifts.jpg',
        'is_active': True,
        'display_order': 4,
        'slide_interval_ms': 5000,
        'start_date': '2026-11-20T00:00:00Z',
        'end_date': '2026-12-31T23:59:59Z',
        'product_ids': []
    },
    {
        'id': 'ban-hero-limited-deals',
        'campaign_key': 'limited-deals',
        'title': 'Limited-Time Deals',
        'subtitle': "Don't Miss Out on Special Offers - Up to 50% OFF",
        'cta_text': 'Shop Limited Deals',
        'cta_url': '/promotions/limited-deals',
        'destination_type': 'CAMPAIGN',
        'desktop_image_url': '/images/hero/hero_limited_deals.jpg',
        'mobile_image_url': '/images/hero/hero_limited_deals.jpg',
        'image_url': '/images/hero/hero_limited_deals.jpg',
        'is_active': True,
        'display_order': 5,
        'slide_interval_ms': 5000,
        'start_date': '2026-11-20T00:00:00Z',
        'end_date': '2026-12-31T23:59:59Z',
        'product_ids': []
    },
    {
        'id': 'ban-hero-christmas-deals',
        'campaign_key': 'christmas',
        'title': 'Christmas Deals',
        'subtitle': 'Up to 60% OFF - Festive Gifts & Luxury Items',
        'cta_text': 'Shop Now',
        'cta_url': '/promotions/christmas',
        'destination_type': 'CAMPAIGN',
        'desktop_image_url': '/images/hero/hero_christmas_deals.jpg',
        'mobile_image_url': '/images/hero/hero_christmas_deals.jpg',
        'image_url': '/images/hero/hero_christmas_deals.jpg',
        'is_active': True,
        'display_order': 6,
        'slide_interval_ms': 5000,
        'start_date': '2026-11-20T00:00:00Z',
        'end_date': '2026-12-31T23:59:59Z',
        'product_ids': [
            '81e58fb1-05fb-4e70-8ffe-206aa97a5a30',
            '9b1920db-b6d5-47e5-8a12-1d7b09d1ad6d',
            '45d9616d-4af0-491b-b0d5-9b185404732f',
            '4afb3918-78db-4ab3-ab3a-960ecba22ef0',
            '27e513ea-8080-4b57-98a9-6b1d02ca0427',
            '675dcfa8-cede-4398-93fe-26ebf3c5bf2a',
            '04d1916c-5dc3-4d37-9247-a6a37be3ba1e',
            '74993487-eee2-4648-925c-53e3beaf5429',
            '38897758-8093-46e3-a005-63a4581e3bb7',
            '97487f6d-f8fa-4ed0-b74f-b9c86b9fc8fa'
        ]
    }
]


def get_homepage_banners(store):
    banners = store.get('homepageBanners')
    if not banners or not isinstance(banners, list) or len(banners) == 0:
        banners = list(DEFAULT_HERO_PROMOTIONAL_BANNERS)
        store['homepageBanners'] = banners
        save_delivery_store(store)
    return banners


class PublicHomepageBannersAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        now_ts = datetime.now(timezone.utc).timestamp()

        active_banners = []
        for b in banners:
            if not b.get('is_active', True):
                continue
            start_str = b.get('start_date')
            end_str = b.get('end_date')
            if start_str:
                try:
                    st = datetime.fromisoformat(start_str.replace('Z', '+00:00')).timestamp()
                    if now_ts < st:
                        continue
                except:
                    pass
            if end_str:
                try:
                    et = datetime.fromisoformat(end_str.replace('Z', '+00:00')).timestamp()
                    if now_ts > et:
                        continue
                except:
                    pass
            active_banners.append(b)

        active_banners.sort(key=lambda x: x.get('display_order', 99))
        return Response(active_banners, status=status.HTTP_200_OK)


class AdminHomepageBannersAPIView(APIView):
    permission_classes = [IsAdminRolePermission]

    def get(self, request):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        sorted_banners = sorted(banners, key=lambda x: x.get('display_order', 99))
        return Response(sorted_banners, status=status.HTTP_200_OK)

    def post(self, request):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        data = request.data or {}

        title = (data.get('title') or '').strip()
        desktop_img = data.get('desktop_image_url') or data.get('image_url') or ''
        mobile_img = data.get('mobile_image_url') or desktop_img

        if not title or not desktop_img:
            return Response({'error': 'Title and banner image are required.'}, status=status.HTTP_400_BAD_REQUEST)

        new_id = f"ban-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:4]}"
        max_order = max([b.get('display_order', 0) for b in banners] or [0])

        new_banner = {
            'id': new_id,
            'campaign_key': data.get('campaign_key') or f"campaign-{uuid.uuid4().hex[:6]}",
            'title': title,
            'subtitle': data.get('subtitle') or '',
            'cta_text': data.get('cta_text') or 'Shop Now',
            'cta_url': data.get('cta_url') or '/products',
            'destination_type': data.get('destination_type') or 'CAMPAIGN',
            'desktop_image_url': desktop_img,
            'mobile_image_url': mobile_img,
            'image_url': desktop_img,
            'is_active': data.get('is_active', True),
            'display_order': data.get('display_order') or (max_order + 1),
            'slide_interval_ms': int(data.get('slide_interval_ms') or 5000),
            'start_date': data.get('start_date') or None,
            'end_date': data.get('end_date') or None,
            'product_ids': data.get('product_ids') or [],
        }

        banners.append(new_banner)
        store['homepageBanners'] = banners
        save_delivery_store(store)

        return Response(new_banner, status=status.HTTP_201_CREATED)


class AdminHomepageBannerDetailAPIView(APIView):
    permission_classes = [IsAdminRolePermission]

    def get(self, request, banner_id):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        b = next((x for x in banners if str(x.get('id')).lower() == str(banner_id).lower()), None)
        if not b:
            return Response({'error': 'Banner not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(b, status=status.HTTP_200_OK)

    def patch(self, request, banner_id):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        b = next((x for x in banners if str(x.get('id')).lower() == str(banner_id).lower()), None)
        if not b:
            return Response({'error': 'Banner not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data or {}
        for k in ['title', 'subtitle', 'cta_text', 'cta_url', 'destination_type',
                  'desktop_image_url', 'mobile_image_url', 'image_url',
                  'is_active', 'display_order', 'slide_interval_ms', 'start_date',
                  'end_date', 'product_ids', 'campaign_key']:
            if k in data:
                b[k] = data[k]

        if 'desktop_image_url' in data and 'image_url' not in data:
            b['image_url'] = data['desktop_image_url']
        if 'image_url' in data and 'desktop_image_url' not in data:
            b['desktop_image_url'] = data['image_url']
            b['mobile_image_url'] = data['image_url']

        save_delivery_store(store)
        return Response(b, status=status.HTTP_200_OK)

    def put(self, request, banner_id):
        return self.patch(request, banner_id)

    def delete(self, request, banner_id):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        idx = next((i for i, x in enumerate(banners) if str(x.get('id')).lower() == str(banner_id).lower()), None)
        if idx is None:
            return Response({'error': 'Banner not found.'}, status=status.HTTP_404_NOT_FOUND)

        removed = banners.pop(idx)
        store['homepageBanners'] = banners
        save_delivery_store(store)
        return Response({'success': True, 'message': f"Banner '{removed.get('title')}' deleted."}, status=status.HTTP_200_OK)


class AdminHomepageBannerToggleAPIView(APIView):
    permission_classes = [IsAdminRolePermission]

    def post(self, request, banner_id, action):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        b = next((x for x in banners if str(x.get('id')).lower() == str(banner_id).lower()), None)
        if not b:
            return Response({'error': 'Banner not found.'}, status=status.HTTP_404_NOT_FOUND)

        b['is_active'] = (action == 'activate')
        save_delivery_store(store)
        return Response({'success': True, 'is_active': b['is_active']}, status=status.HTTP_200_OK)


class AdminHomepageBannersReorderAPIView(APIView):
    permission_classes = [IsAdminRolePermission]

    def post(self, request):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        ids = request.data.get('ids', [])

        id_map = {b['id']: b for b in banners}
        new_list = []
        for index, b_id in enumerate(ids):
            if b_id in id_map:
                item = id_map.pop(b_id)
                item['display_order'] = index + 1
                new_list.append(item)

        # Append any remaining
        for item in id_map.values():
            item['display_order'] = len(new_list) + 1
            new_list.append(item)

        store['homepageBanners'] = new_list
        save_delivery_store(store)
        return Response({'success': True, 'banners': new_list}, status=status.HTTP_200_OK)


class CampaignProductsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, campaign_key):
        store = get_delivery_store()
        banners = get_homepage_banners(store)
        banner = next((b for b in banners if b.get('campaign_key') == campaign_key or b.get('id') == campaign_key), None)

        all_products = store.get('products', [])
        target_ids = (banner.get('product_ids') if banner else []) or []

        if target_ids:
            matching_products = [p for p in all_products if p.get('id') in target_ids]
        else:
            # Fallback based on campaign semantics
            key_lower = campaign_key.lower()
            if 'price-drop' in key_lower:
                matching_products = [
                    p for p in all_products
                    if 'DOVI_HOMEPAGE' in p.get('description', '') and ('"is_flash_deal":true' in p.get('description', '') or '"is_discount":true' in p.get('description', ''))
                ]
            elif 'limited' in key_lower:
                matching_products = [
                    p for p in all_products
                    if 'DOVI_HOMEPAGE' in p.get('description', '') and '"is_flash_deal":true' in p.get('description', '')
                ]
            elif 'reward' in key_lower or 'giveaway' in key_lower:
                matching_products = [
                    p for p in all_products
                    if float(p.get('base_price', 0)) >= 30000 or p.get('category_name') in ['Phones & Electronics', 'Electronics']
                ]
            else:
                matching_products = all_products[:12]

        return Response({
            'campaign_key': campaign_key,
            'banner': banner,
            'total_products': len(matching_products),
            'products': matching_products
        }, status=status.HTTP_200_OK)

    def post(self, request, campaign_key):
        # Admin assignment of products to a campaign (e.g. Christmas Deals)
        if not request.user or not getattr(request.user, 'is_staff', False):
            # Also allow IsAdminRolePermission check
            pass

        store = get_delivery_store()
        banners = get_homepage_banners(store)
        banner = next((b for b in banners if b.get('campaign_key') == campaign_key or b.get('id') == campaign_key), None)
        if not banner:
            return Response({'error': f"Campaign '{campaign_key}' not found."}, status=status.HTTP_404_NOT_FOUND)

        product_ids = request.data.get('product_ids', [])
        banner['product_ids'] = product_ids
        save_delivery_store(store)

        return Response({
            'success': True,
            'campaign_key': campaign_key,
            'assigned_count': len(product_ids),
            'product_ids': product_ids
        }, status=status.HTTP_200_OK)
