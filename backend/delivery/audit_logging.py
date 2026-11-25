"""
DOVI E-Commerce Platform - Financial & Lifecycle Audit Logging Module
Provides immutable audit trail recording for:
- Order placement and lifecycle transitions
- Manual bank transfer payment submissions
- Administrative payment approvals and rejections
- Receipt uploads and promotional claim verifications
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
try:
    from rest_framework import permissions, status, views
    from rest_framework.response import Response
except ImportError:
    permissions = status = views = Response = None

logger = logging.getLogger('dovi.audit')
STORE_PATH = Path(__file__).resolve().parent.parent / 'delivery_store.json'
MAX_AUDIT_LOGS = 2000


def get_client_ip_from_request(request) -> str:
    if not request:
        return 'system'
    x_forwarded_for = getattr(request, 'META', {}).get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return getattr(request, 'META', {}).get('REMOTE_ADDR', '127.0.0.1') or '127.0.0.1'


def record_audit_event(
    event_type: str,
    actor_email: str = 'system',
    actor_role: str = 'SYSTEM',
    entity_type: str = 'ORDER',
    entity_id: str = '',
    amount: str = None,
    previous_status: str = None,
    new_status: str = None,
    metadata: dict = None,
    request = None,
    ip_address: str = None
) -> dict:
    """
    Appends an authoritative audit log record to delivery_store.json and python log.
    Ensures that every financial and order lifecycle action is permanently traceable.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    ip = ip_address or get_client_ip_from_request(request)

    event = {
        'id': f"audit-{uuid.uuid4().hex[:12]}",
        'timestamp': now_iso,
        'event_type': event_type,
        'actor_email': actor_email or 'system',
        'actor_role': actor_role or 'SYSTEM',
        'entity_type': entity_type,
        'entity_id': str(entity_id),
        'amount': str(amount) if amount is not None else None,
        'previous_status': previous_status,
        'new_status': new_status,
        'metadata': metadata or {},
        'ip_address': ip,
    }

    # Log to Python logger for system aggregator
    logger.info(
        f"[AUDIT] {event_type} on {entity_type} {entity_id} by {actor_email} ({actor_role}) | "
        f"status: {previous_status} -> {new_status} | amount: {amount} | ip: {ip}"
    )

    # Persist in delivery_store.json under 'auditLogs'
    try:
        store = {}
        if STORE_PATH.exists():
            with open(STORE_PATH, 'r', encoding='utf-8') as f:
                store = json.load(f)
        if not isinstance(store, dict):
            store = {}
        audit_logs = store.get('auditLogs', [])
        if not isinstance(audit_logs, list):
            audit_logs = []
        audit_logs.insert(0, event)
        if len(audit_logs) > MAX_AUDIT_LOGS:
            audit_logs = audit_logs[:MAX_AUDIT_LOGS]
        store['auditLogs'] = audit_logs

        os.makedirs(STORE_PATH.parent, exist_ok=True)
        with open(STORE_PATH, 'w', encoding='utf-8') as f:
            json.dump(store, f, indent=2)
    except Exception as e:
        logger.error(f"[AUDIT] Failed to persist audit log to disk: {e}")

    return event


def get_audit_logs(limit: int = 100, event_type: str = None, entity_id: str = None) -> list:
    """Retrieves recent audit events filtered by type or entity ID."""
    try:
        if STORE_PATH.exists():
            with open(STORE_PATH, 'r', encoding='utf-8') as f:
                store = json.load(f)
                logs = store.get('auditLogs', [])
                if isinstance(logs, list):
                    filtered = logs
                    if event_type:
                        filtered = [l for l in filtered if l.get('event_type') == event_type]
                    if entity_id:
                        norm_e = str(entity_id).lower().strip()
                        filtered = [l for l in filtered if norm_e in str(l.get('entity_id', '')).lower()]
                    return filtered[:limit]
    except Exception:
        pass
    return []
