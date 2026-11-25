"""
DOVI E-Commerce Platform - Financial Rate Limiting Module
Provides in-memory sliding window rate limiting for critical transactional and financial endpoints:
- Manual bank transfer payment evidence submission
- Payment receipt file uploads
- Order creation & checkout
- Administrative verification & rejection operations
"""

import time
from collections import defaultdict
try:
    from rest_framework import status
    from rest_framework.response import Response
except ImportError:
    status = None
    Response = None

# Map of key -> list of float timestamps
_RATE_LIMIT_STORE = defaultdict(list)
_LAST_CLEANUP = time.time()


def get_client_ip(request) -> str:
    """Extracts client IP from X-Forwarded-For or REMOTE_ADDR safely."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
        if ip:
            return ip
    return request.META.get('REMOTE_ADDR', '127.0.0.1') or '127.0.0.1'


def get_rate_limit_key(request, action: str) -> str:
    """Generates composite rate limit key incorporating IP and user ID if authenticated."""
    ip = get_client_ip(request)
    user = getattr(request, 'user', None)
    if user and getattr(user, 'is_authenticated', False):
        user_id = str(getattr(user, 'id', ''))
        return f"{action}:user:{user_id}:{ip}"
    return f"{action}:ip:{ip}"


def cleanup_stale_entries(window_seconds: int = 3600):
    """Periodically purges entries older than window_seconds to prevent memory growth."""
    global _LAST_CLEANUP, _RATE_LIMIT_STORE
    now = time.time()
    if now - _LAST_CLEANUP < 300:  # Run at most once every 5 minutes
        return
    _LAST_CLEANUP = now
    cutoff = now - window_seconds
    keys_to_delete = []
    for key, timestamps in list(_RATE_LIMIT_STORE.items()):
        _RATE_LIMIT_STORE[key] = [t for t in timestamps if t > cutoff]
        if not _RATE_LIMIT_STORE[key]:
            keys_to_delete.append(key)
    for k in keys_to_delete:
        _RATE_LIMIT_STORE.pop(k, None)


def check_rate_limit(
    request,
    action: str,
    max_requests: int = 20,
    window_seconds: int = 600
) -> tuple[bool, int]:
    """
    Checks whether the current request is within the sliding window limit.
    Returns:
        (is_allowed: bool, retry_after_seconds: int)
    """
    cleanup_stale_entries()
    key = get_rate_limit_key(request, action)
    now = time.time()
    cutoff = now - window_seconds

    # Filter timestamps within current sliding window
    timestamps = [t for t in _RATE_LIMIT_STORE[key] if t > cutoff]

    if len(timestamps) >= max_requests:
        oldest = timestamps[0]
        retry_after = max(1, int(window_seconds - (now - oldest)))
        _RATE_LIMIT_STORE[key] = timestamps
        return False, retry_after

    timestamps.append(now)
    _RATE_LIMIT_STORE[key] = timestamps
    return True, 0


def rate_limit_response(retry_after: int, action_name: str = 'Action') -> Response:
    """Builds standard 429 Too Many Requests response with Retry-After header."""
    resp = Response({
        'error': 'RATE_LIMIT_EXCEEDED',
        'message': f"Too many requests for {action_name}. Please try again in {retry_after} seconds.",
        'retry_after': retry_after,
    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    resp['Retry-After'] = str(retry_after)
    return resp
