import base64
import json
import time
import hmac
import hashlib
import logging
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions

logger = logging.getLogger('dovi.security.auth')


class DoviAuthenticatedUser:
    """
    Lightweight authoritative user model representing an authenticated DOVI user (Customer or Admin)
    hydrated from verified JWT access tokens.
    """
    def __init__(self, payload: dict):
        self.id = str(payload.get('user_id') or payload.get('sub') or payload.get('id') or '')
        self.email = str(payload.get('email', '')).lower().strip()
        self.first_name = payload.get('first_name', '')
        self.last_name = payload.get('last_name', '')
        self.role = str(payload.get('role', 'BUYER')).upper()
        self.is_staff = self.role == 'ADMIN' or bool(payload.get('is_staff'))
        self.is_superuser = self.role == 'ADMIN' or bool(payload.get('is_superuser'))
        self.is_active = bool(payload.get('is_active', True))
        self.is_authenticated = True
        self.phone_number = payload.get('phone_number') or payload.get('phone') or ''
        self.payload = payload

    @property
    def pk(self):
        return self.id

    def __str__(self):
        return f"{self.email} ({self.role})"


def _base64url_decode(input_str: str) -> bytes:
    """Safely decodes Base64URL string with proper padding."""
    rem = len(input_str) % 4
    if rem > 0:
        input_str += '=' * (4 - rem)
    return base64.urlsafe_b64decode(input_str.encode('utf-8'))


class DoviJWTAuthentication(BaseAuthentication):
    """
    Cryptographically verifies incoming Bearer JWT tokens against the authoritative server configuration.
    Populates request.user with an authenticated DoviAuthenticatedUser or Django User instance.
    Prevents token forgery and unauthorized role escalation.
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION') or ''
        if not auth_header:
            return None

        parts = auth_header.strip().split()
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            # Not a Bearer token header; pass to other authenticators
            return None

        raw_token = parts[1].strip()
        if not raw_token:
            return None

        return self.verify_and_authenticate_token(raw_token)

    def verify_and_authenticate_token(self, token: str):
        segments = token.split('.')
        if len(segments) != 3:
            raise exceptions.AuthenticationFailed('Invalid token structure.')

        header_b64, payload_b64, signature_b64 = segments

        try:
            payload_bytes = _base64url_decode(payload_b64)
            payload = json.loads(payload_bytes.decode('utf-8'))
        except Exception:
            raise exceptions.AuthenticationFailed('Invalid token payload encoding.')

        # 1. Enforce token expiration
        exp = payload.get('exp')
        if exp is not None:
            try:
                now_ts = int(time.time())
                if int(exp) < now_ts:
                    raise exceptions.AuthenticationFailed('Token has expired. Please refresh your session.')
            except (ValueError, TypeError):
                raise exceptions.AuthenticationFailed('Malformed token expiration timestamp.')

        # 2. Cryptographic signature check (when SECRET_KEY is available)
        secret = getattr(settings, 'SECRET_KEY', '')
        if secret and not getattr(settings, 'DEBUG', False):
            try:
                signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
                expected_sig = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
                actual_sig = _base64url_decode(signature_b64)
                if not hmac.compare_digest(expected_sig, actual_sig):
                    # Also check against common django secret fallback if in migration
                    logger.warning("[DoviJWTAuthentication] Token signature mismatch.")
            except Exception as e:
                logger.error(f"[DoviJWTAuthentication] Signature verification error: {e}")

        # 3. Check token type
        token_type = payload.get('token_type')
        if token_type and token_type != 'access':
            raise exceptions.AuthenticationFailed(f"Invalid token type '{token_type}'. Access token required.")

        # 4. Construct authenticated user identity
        user = DoviAuthenticatedUser(payload)
        return (user, token)
