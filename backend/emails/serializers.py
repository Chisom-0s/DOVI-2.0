from rest_framework import serializers
from .models import EmailLog, EmailDeliveryAttempt, EmailType, EmailCategory, EmailStatus


class EmailDeliveryAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailDeliveryAttempt
        fields = [
            'id',
            'attempt_number',
            'status',
            'response_code',
            'response_body',
            'error_message',
            'latency_ms',
            'created_at',
        ]


class EmailLogSerializer(serializers.ModelSerializer):
    email_type_display = serializers.CharField(source='get_email_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    delivery_attempts = EmailDeliveryAttemptSerializer(many=True, read_only=True)

    class Meta:
        model = EmailLog
        fields = [
            'id',
            'recipient',
            'recipient_name',
            'email_type',
            'email_type_display',
            'category',
            'category_display',
            'subject',
            'sender',
            'reply_to',
            'status',
            'status_display',
            'resend_message_id',
            'idempotency_key',
            'attempts_count',
            'max_retries',
            'last_error',
            'context_data',
            'html_body',
            'text_body',
            'created_at',
            'updated_at',
            'sent_at',
            'delivered_at',
            'delivery_attempts',
        ]


class SendTestEmailSerializer(serializers.Serializer):
    email_type = serializers.ChoiceField(choices=EmailType.choices, default=EmailType.WELCOME)
    recipient = serializers.EmailField()
    recipient_name = serializers.CharField(max_length=255, required=False, default="Test Recipient")
    custom_context = serializers.DictField(required=False, default=dict)


class PlatformAnnouncementSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    action_text = serializers.CharField(max_length=100, required=False, default="Visit Dovi")
    action_url = serializers.URLField(required=False, allow_blank=True)
    target_recipients = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        default=list,
        help_text="Optional list of target emails. Empty = all active users."
    )


class EmailConfigResponseSerializer(serializers.Serializer):
    is_configured = serializers.BooleanField()
    masked_api_key = serializers.CharField()
    from_address = serializers.CharField()
    from_name = serializers.CharField()
    reply_to = serializers.CharField()
    app_url = serializers.CharField()
    webhook_endpoint = serializers.CharField()
    webhook_configured = serializers.BooleanField()
