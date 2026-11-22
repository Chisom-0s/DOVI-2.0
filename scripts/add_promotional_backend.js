const fs = require('fs');

// 1. Append Promotional Views to backend/delivery/payment_views.py
const pvPath = 'backend/delivery/payment_views.py';
let pvContent = fs.readFileSync(pvPath, 'utf8').replace(/\r\n/g, '\n');

const promotionalViewsCode = `

# ==============================================================================
# REUSABLE PROMOTIONAL CAMPAIGN MANAGEMENT & AUDIT LOGS
# ==============================================================================

DEFAULT_PROMO_LAUNCH_GIVEAWAY = {
    'id': 'promo-launch-giveaway',
    'name': 'DOVI Launch Giveaway',
    'headline': 'SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!',
    'description': 'Unlock a complimentary high-definition DOVI Wireless EarPod with charging case on qualifying marketplace orders of ₦30,000 or more.',
    'badge_text': 'Launch Giveaway',
    'cta_text': 'Shop & Claim Gift',
    'cta_url': '/products',
    'secondary_text': 'Limited gifts available · Offer ends 20 Dec 2026',
    'image_url': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
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
        'homepage_banner': True,
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
`;

if (!pvContent.includes('REUSABLE PROMOTIONAL CAMPAIGN MANAGEMENT')) {
  pvContent = pvContent + promotionalViewsCode;
  fs.writeFileSync(pvPath, pvContent, 'utf8');
  console.log('Appended promotional views to payment_views.py');
} else {
  console.log('payment_views.py already contains promotional views');
}

// 2. Update backend/delivery/urls.py
const urlsPath = 'backend/delivery/urls.py';
let urlsContent = fs.readFileSync(urlsPath, 'utf8').replace(/\r\n/g, '\n');

const urlImportsTarget = `from .payment_views import (
    ReceiptUploadAPIView,`;

const urlImportsReplacement = `from .payment_views import (
    PublicPromotionalCampaignsAPIView,
    AdminPromotionalCampaignsListCreateAPIView,
    AdminPromotionalCampaignDetailAPIView,
    AdminPromotionalCampaignPauseAPIView,
    AdminPromotionalCampaignResumeAPIView,
    AdminPromotionalCampaignDuplicateAPIView,
    ReceiptUploadAPIView,`;

if (urlsContent.includes(urlImportsTarget) && !urlsContent.includes('PublicPromotionalCampaignsAPIView')) {
  urlsContent = urlsContent.replace(urlImportsTarget, urlImportsReplacement);
}

const urlPatternsTarget = `    # Orders & Lifecycle Transitions
    path('orders/', OrderListCreateAPIView.as_view(), name='orders-list-create'),`;

const urlPatternsAddition = `    # Reusable Promotional Campaigns & Banners
    path('promotions/campaigns/', PublicPromotionalCampaignsAPIView.as_view(), name='public-promotions-campaigns'),
    path('admin/promotions/campaigns/', AdminPromotionalCampaignsListCreateAPIView.as_view(), name='admin-promotions-campaigns'),
    path('admin/promotions/campaigns/<str:campaign_id>/', AdminPromotionalCampaignDetailAPIView.as_view(), name='admin-promotions-campaign-detail'),
    path('admin/promotions/campaigns/<str:campaign_id>/pause/', AdminPromotionalCampaignPauseAPIView.as_view(), name='admin-promotions-campaign-pause'),
    path('admin/promotions/campaigns/<str:campaign_id>/resume/', AdminPromotionalCampaignResumeAPIView.as_view(), name='admin-promotions-campaign-resume'),
    path('admin/promotions/campaigns/<str:campaign_id>/duplicate/', AdminPromotionalCampaignDuplicateAPIView.as_view(), name='admin-promotions-campaign-duplicate'),

    # Orders & Lifecycle Transitions
    path('orders/', OrderListCreateAPIView.as_view(), name='orders-list-create'),`;

if (urlsContent.includes(urlPatternsTarget) && !urlsContent.includes('public-promotions-campaigns')) {
  urlsContent = urlsContent.replace(urlPatternsTarget, urlPatternsAddition);
  fs.writeFileSync(urlsPath, urlsContent, 'utf8');
  console.log('Updated backend/delivery/urls.py with promotional campaign routes');
} else {
  console.log('urls.py already updated or target not found');
}
