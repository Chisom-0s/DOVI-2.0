"""
DOVI E-Commerce Platform - Production Sanitized Exception Handler
Ensures that API responses never leak internal stack traces, database schema,
absolute server file paths, or cryptographic keys to callers.
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('dovi.security')


def sanitized_exception_handler(exc, context):
    """
    Standard DRF exception handler wrapper that sanitizes 500 error outputs
    and protects client-facing error payloads.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize 400 validation error responses
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            if isinstance(response.data, dict) and 'error' not in response.data:
                # If DRF serializer errors like {'email': ['This field is required.']}
                first_key = next(iter(response.data))
                first_val = response.data[first_key]
                first_msg = first_val[0] if isinstance(first_val, list) and first_val else str(first_val)
                response.data = {
                    'error': 'VALIDATION_FAILED',
                    'field': first_key,
                    'message': first_msg,
                    'details': response.data,
                }
        return response

    # Unhandled 500 error: log internally with stack trace, return safe generic response
    view_name = context.get('view').__class__.__name__ if context and context.get('view') else 'UnknownView'
    logger.error(f"[SECURITY 500] Unhandled exception in {view_name}: {exc}", exc_info=True)

    return Response({
        'error': 'INTERNAL_SERVER_ERROR',
        'message': 'An unexpected server error occurred. Our technical team has been notified.',
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
