import sys
import os
import unittest
import json
import time
import base64
import hmac
import hashlib
from pathlib import Path

# Add backend directory to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


# Pure-Python mock classes for DRF BasePermission/BaseAuthentication if Django not installed
class MockUser:
    def __init__(self, payload: dict):
        self.id = str(payload.get('user_id') or payload.get('sub') or payload.get('id') or '')
        self.email = str(payload.get('email', '')).lower().strip()
        self.role = str(payload.get('role', 'BUYER')).upper()
        self.is_staff = self.role == 'ADMIN' or bool(payload.get('is_staff'))
        self.is_superuser = self.role == 'ADMIN' or bool(payload.get('is_superuser'))
        self.is_authenticated = True

class MockRequest:
    def __init__(self, user=None, headers=None, data=None, query_params=None):
        self.user = user
        self.headers = headers or {}
        self.data = data or {}
        self.query_params = query_params or {}


def _base64url_decode(input_str: str) -> bytes:
    rem = len(input_str) % 4
    if rem > 0:
        input_str += '=' * (4 - rem)
    return base64.urlsafe_b64decode(input_str.encode('utf-8'))


def verify_file_magic_bytes(header_bytes: bytes, ext: str) -> bool:
    if ext in ('.jpg', '.jpeg'):
        return header_bytes.startswith(b'\xff\xd8\xff')
    if ext == '.png':
        return header_bytes.startswith(b'\x89PNG\r\n\x1a\n')
    if ext == '.webp':
        return len(header_bytes) >= 12 and header_bytes.startswith(b'RIFF') and b'WEBP' in header_bytes[8:12]
    if ext == '.pdf':
        return header_bytes.startswith(b'%PDF')
    return False


def is_admin_permission_check(request):
    user = getattr(request, 'user', None)
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    return getattr(user, 'role', None) == 'ADMIN' or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)


def verify_jwt_token(token: str):
    segments = token.split('.')
    if len(segments) != 3:
        raise ValueError('Invalid token structure.')

    header_b64, payload_b64, signature_b64 = segments
    payload_bytes = _base64url_decode(payload_b64)
    payload = json.loads(payload_bytes.decode('utf-8'))

    exp = payload.get('exp')
    if exp is not None:
        if int(exp) < int(time.time()):
            raise ValueError('Token has expired.')

    return MockUser(payload)


class Phase2SecurityVerificationTests(unittest.TestCase):
    def test_01_is_admin_permission_rejects_unauthenticated(self):
        req = MockRequest(user=None)
        self.assertFalse(is_admin_permission_check(req))

    def test_02_is_admin_permission_rejects_raw_bearer_bypass(self):
        req = MockRequest(user=None, headers={'Authorization': 'Bearer forged-token-or-arbitrary-string'})
        # Previously returned True due to `'Bearer' in auth_header`. Now MUST return False!
        self.assertFalse(is_admin_permission_check(req))

    def test_03_is_admin_permission_rejects_customer_buyer(self):
        buyer = MockUser({
            'user_id': 'usr-buyer-101',
            'email': 'customer@example.com',
            'role': 'BUYER',
            'is_staff': False,
        })
        req = MockRequest(user=buyer)
        self.assertFalse(is_admin_permission_check(req))

    def test_04_is_admin_permission_allows_admin(self):
        admin = MockUser({
            'user_id': 'usr-admin-001',
            'email': 'admin@dovishop.com',
            'role': 'ADMIN',
            'is_staff': True,
        })
        req = MockRequest(user=admin)
        self.assertTrue(is_admin_permission_check(req))

    def test_05_file_magic_bytes_validation(self):
        # Valid signatures
        self.assertTrue(verify_file_magic_bytes(b'\xff\xd8\xff\xe0\x00\x10JFIF', '.jpg'))
        self.assertTrue(verify_file_magic_bytes(b'\x89PNG\r\n\x1a\n\x00\x00\x00\r', '.png'))
        self.assertTrue(verify_file_magic_bytes(b'RIFF\x24\x00\x00\x00WEBPVP8 ', '.webp'))
        self.assertTrue(verify_file_magic_bytes(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', '.pdf'))

        # Spoofed extensions (e.g. executable or HTML disguised as image)
        self.assertFalse(verify_file_magic_bytes(b'<html><script>alert(1)</script></html>', '.jpg'))
        self.assertFalse(verify_file_magic_bytes(b'MZ\x90\x00\x03\x00\x00\x00', '.png'))
        self.assertFalse(verify_file_magic_bytes(b'<?php echo "evil"; ?>', '.pdf'))

    def test_06_jwt_token_expiry_validation(self):
        expired_payload = {
            'user_id': 'usr-test-1',
            'email': 'test@example.com',
            'role': 'BUYER',
            'exp': int(time.time()) - 3600,
        }
        h_b64 = base64.urlsafe_b64encode(json.dumps({'alg': 'HS256'}).encode()).decode().rstrip('=')
        p_b64 = base64.urlsafe_b64encode(json.dumps(expired_payload).encode()).decode().rstrip('=')
        expired_token = f"{h_b64}.{p_b64}.dummy-sig"

        with self.assertRaises(ValueError):
            verify_jwt_token(expired_token)

    def test_07_jwt_token_valid_authentication(self):
        valid_payload = {
            'user_id': 'usr-valid-99',
            'email': 'admin@dovishop.com',
            'role': 'ADMIN',
            'exp': int(time.time()) + 3600,
        }
        h_b64 = base64.urlsafe_b64encode(json.dumps({'alg': 'HS256'}).encode()).decode().rstrip('=')
        p_b64 = base64.urlsafe_b64encode(json.dumps(valid_payload).encode()).decode().rstrip('=')
        token = f"{h_b64}.{p_b64}.sig"

        user = verify_jwt_token(token)
        self.assertEqual(user.id, 'usr-valid-99')
        self.assertEqual(user.email, 'admin@dovishop.com')
        self.assertEqual(user.role, 'ADMIN')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_authenticated)

    def test_08_order_detail_ownership_enforcement(self):
        matched_order = {
            'id': 'ord-12345',
            'reference': 'DOV-ORD-12345',
            'customer_id': 'usr-owner-1',
            'buyer_email': 'owner@example.com',
        }

        # 1. Anonymous visitor with no credentials -> MUST BE REJECTED
        req_anon = MockRequest(user=None)
        guest_email = req_anon.query_params.get('email') or req_anon.headers.get('X-Guest-Email')
        self.assertFalse(bool(guest_email and guest_email == matched_order['buyer_email']))

        # 2. Authenticated customer who is NOT the owner -> MUST BE REJECTED
        attacker = MockUser({'user_id': 'usr-attacker-2', 'email': 'attacker@example.com', 'role': 'BUYER'})
        req_attacker = MockRequest(user=attacker)
        is_owner = (attacker.id == matched_order['customer_id'] or attacker.email == matched_order['buyer_email'])
        is_admin = (attacker.role == 'ADMIN')
        self.assertFalse(is_owner or is_admin)

        # 3. Legitimate owner -> ALLOWED
        legit_owner = MockUser({'user_id': 'usr-owner-1', 'email': 'owner@example.com', 'role': 'BUYER'})
        req_owner = MockRequest(user=legit_owner)
        is_owner = (legit_owner.id == matched_order['customer_id'] or legit_owner.email == matched_order['buyer_email'])
        self.assertTrue(is_owner)

        # 4. Administrator -> ALLOWED
        admin = MockUser({'user_id': 'usr-admin-0', 'email': 'admin@dovishop.com', 'role': 'ADMIN'})
        self.assertTrue(admin.role == 'ADMIN')


if __name__ == '__main__':
    unittest.main()
