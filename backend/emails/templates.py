"""
Dovi Email Design System & Transactional Email Templates
Brand: Dovi — Shop Smart. Feel Good.
Palette:
  - Primary Brand Orange: #ff7a00
  - Primary Dark / Hover: #e06c00
  - Success Green: #27ae60
  - Warning Gold: #f59e0b
  - Danger Red: #ef4444
  - Text Primary: #1f2937
  - Text Secondary / Muted: #6b7280
  - Surface Background: #ffffff
  - Container / Body BG: #f8f9fa
  - Border: #e5e7eb
"""

from typing import Dict, Any, Tuple
from decimal import Decimal
import html


def format_currency(amount: Any) -> str:
    """Format any numeric or string monetary value to Nigerian Naira (NGN) format."""
    if amount is None or amount == "":
        return "₦0.00"
    try:
        val = Decimal(str(amount))
        return f"₦{val:,.2f}"
    except Exception:
        return f"₦{amount}"


def escape(text: Any) -> str:
    if text is None:
        return ""
    return html.escape(str(text))


# ============================================================================
# Core HTML Shell & Reusable Component Builders
# ============================================================================

def build_email_shell(
    title: str,
    preheader: str,
    heading: str,
    intro_html: str,
    body_content_html: str,
    cta_text: str = "",
    cta_url: str = "",
    secondary_action_text: str = "",
    secondary_action_url: str = "",
    security_notice: str = "",
    support_note: str = "",
    app_url: str = "https://dovishops.com",
) -> str:
    """
    Renders a fully responsive, email-client compatible HTML document.
    Tested for Outlook, Gmail, Apple Mail, and mobile clients.
    """
    safe_title = escape(title)
    safe_preheader = escape(preheader)
    safe_heading = heading

    cta_button_html = ""
    if cta_text and cta_url:
        cta_button_html = f"""
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 20px 0;">
          <tr>
            <td align="center" style="border-radius: 8px; background-color: #ff7a00;">
              <a href="{escape(cta_url)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.2px; background-color: #ff7a00; border: 1px solid #ff7a00;">
                {escape(cta_text)}
              </a>
            </td>
          </tr>
        </table>
        """

    secondary_action_html = ""
    if secondary_action_text and secondary_action_url:
        secondary_action_html = f"""
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #6b7280; text-align: center;">
          <a href="{escape(secondary_action_url)}" target="_blank" style="color: #ff7a00; text-decoration: underline; font-weight: 500;">
            {escape(secondary_action_text)}
          </a>
        </p>
        """

    security_box_html = ""
    if security_notice:
        security_box_html = f"""
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px;">
          <tr>
            <td style="padding: 14px 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #92400e;">
              <strong>Security Notice:</strong> {security_notice}
            </td>
          </tr>
        </table>
        """

    support_html = ""
    if support_note:
        support_html = f"""
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 13px; line-height: 1.5; color: #6b7280;">
          {support_note}
        </div>
        """
    else:
        support_html = f"""
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 13px; line-height: 1.5; color: #6b7280;">
          Questions? Reply directly to this email or contact our campus support desk at <a href="mailto:support@dovishops.com" style="color: #ff7a00; text-decoration: none; font-weight: 500;">support@dovishops.com</a>.
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>{safe_title}</title>
  <!--[if mso]>
  <style>
    * {{ font-family: 'Segoe UI', sans-serif !important; }}
  </style>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {{
      .email-container {{ width: 100% !important; margin: auto !important; }}
      .fluid {{ max-width: 100% !important; height: auto !important; }}
      .stack-column {{ display: block !important; width: 100% !important; direction: ltr !important; }}
      .mobile-padding {{ padding-left: 20px !important; padding-right: 20px !important; }}
    }}
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f8f9fa;">
  <!-- Hidden Preheader Preview Text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    {safe_preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 32px 12px 48px 12px;">

        <!-- Outer 600px Card Container -->
        <table role="presentation" class="email-container" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">

          <!-- Brand Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background-color: #ffffff; border-bottom: 2px solid #ff7a00;" class="mobile-padding">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <a href="{escape(app_url)}" target="_blank" style="text-decoration: none;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <span style="display: inline-block; width: 34px; height: 34px; line-height: 34px; background-color: #ff7a00; color: #ffffff; font-weight: 800; font-size: 20px; text-align: center; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">D</span>
                          </td>
                          <td style="vertical-align: middle; padding-left: 10px;">
                            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #1f2937; letter-spacing: -0.5px;">DOVI</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 500; color: #6b7280; letter-spacing: 0.2px;">Shop Smart. Feel Good.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;" class="mobile-padding">

              <!-- Heading -->
              <h1 style="margin: 0 0 16px 0; font-size: 22px; line-height: 1.35; font-weight: 700; color: #111827;">
                {safe_heading}
              </h1>

              <!-- Intro / Greeting -->
              <div style="font-size: 15px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
                {intro_html}
              </div>

              <!-- Dynamic Body Section -->
              <div style="font-size: 14px; line-height: 1.6; color: #374151;">
                {body_content_html}
              </div>

              <!-- Primary Call To Action Button -->
              {cta_button_html}
              {secondary_action_html}

              <!-- Security Notice Callout (if present) -->
              {security_box_html}

              <!-- Support Note -->
              {support_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;" class="mobile-padding">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #1f2937;">
                Dovi Marketplace &bull; Shop Smart. Feel Good.
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; line-height: 1.5; color: #6b7280;">
                Empowering smart campus commerce with instant delivery and secure escrow protection.
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; 2026 Dovi Direct Commerce Limited. All rights reserved.<br>
                This transactional email was sent to notify you regarding your Dovi account or order activity.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Outer Card -->

      </td>
    </tr>
  </table>
</body>
</html>"""


# ============================================================================
# Reusable HTML Fragment Helpers
# ============================================================================

def render_meta_table(rows: list) -> str:
    """Renders a 2-column key/value metadata table."""
    tr_items = ""
    for label, val in rows:
        tr_items += f"""
        <tr>
          <td style="padding: 9px 12px; font-size: 13px; font-weight: 500; color: #6b7280; border-bottom: 1px solid #f3f4f6; width: 40%; vertical-align: top;">
            {escape(label)}
          </td>
          <td style="padding: 9px 12px; font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6; width: 60%; vertical-align: top;">
            {escape(val)}
          </td>
        </tr>
        """
    return f"""
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 18px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate; border-spacing: 0; overflow: hidden;">
      {tr_items}
    </table>
    """


def render_order_items_table(items: list, subtotal: Any, delivery_fee: Any, total: Any) -> str:
    """Renders an itemized order summary table."""
    item_rows = ""
    for item in items:
        name = escape(item.get("name", "Product Item"))
        qty = escape(str(item.get("quantity", 1)))
        price = format_currency(item.get("price", 0))
        item_rows += f"""
        <tr>
          <td style="padding: 10px 12px; font-size: 13px; color: #1f2937; border-bottom: 1px solid #f3f4f6;">
            <strong>{name}</strong> &times; {qty}
          </td>
          <td align="right" style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6;">
            {price}
          </td>
        </tr>
        """

    subtotal_fmt = format_currency(subtotal)
    delivery_fmt = format_currency(delivery_fee)
    total_fmt = format_currency(total)

    return f"""
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate; border-spacing: 0; overflow: hidden;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th align="left" style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
          <th align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
        </tr>
      </thead>
      <tbody>
        {item_rows}
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #6b7280;">Subtotal</td>
          <td align="right" style="padding: 8px 12px; font-size: 13px; color: #1f2937; font-weight: 500;">{subtotal_fmt}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #6b7280;">Delivery Fee</td>
          <td align="right" style="padding: 8px 12px; font-size: 13px; color: #1f2937; font-weight: 500;">{delivery_fmt}</td>
        </tr>
        <tr style="background-color: #fff7ed;">
          <td style="padding: 12px 12px; font-size: 14px; font-weight: 700; color: #111827; border-top: 1px solid #fed7aa;">Total Paid</td>
          <td align="right" style="padding: 12px 12px; font-size: 15px; font-weight: 800; color: #ff7a00; border-top: 1px solid #fed7aa;">{total_fmt}</td>
        </tr>
      </tbody>
    </table>
    """


# ============================================================================
# Individual Email Template Generators
# Returns: Tuple[str, str, str] -> (subject, html_body, plain_text)
# ============================================================================

class EmailTemplateEngine:
    """
    Renders HTML and Plain-Text alternatives for all 33 required Dovi transactional emails.
    """

    @classmethod
    def render(cls, email_type: str, context: Dict[str, Any]) -> Tuple[str, str, str]:
        method_name = f"render_{email_type.lower()}"
        renderer = getattr(cls, method_name, None)
        if not renderer:
            # Fallback renderer for custom or unspecified event
            return cls.render_generic_notification(email_type, context)
        return renderer(context)

    # ------------------------------------------------------------------------
    # A. Account Emails
    # ------------------------------------------------------------------------

    @staticmethod
    def render_welcome(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or ctx.get("first_name") or "there"
        app_url = ctx.get("app_url", "https://dovishops.com")
        explore_url = ctx.get("action_url") or f"{app_url}/products"

        subject = "Welcome to Dovi! Shop Smart. Feel Good."
        preheader = "Your Dovi account is ready. Discover smart student commerce."
        heading = f"Welcome aboard, {name}!"
        intro = "We are thrilled to welcome you to <strong>Dovi</strong>. Whether you are finding student essentials, setting savings targets with Save2Own, or purchasing verified campus goods, Dovi is designed to keep your commerce smart, effortless, and secure."
        body = """
        <p>Here is what you can do next:</p>
        <ul style="margin: 0 0 16px 20px; padding: 0; color: #4b5563;">
          <li style="margin-bottom: 8px;"><strong>Marketplace:</strong> Explore thousands of verified electronics, textbooks, fashion, and dorm essentials.</li>
          <li style="margin-bottom: 8px;"><strong>Save2Own:</strong> Save toward your dream items in flexible installments with zero stress.</li>
          <li style="margin-bottom: 8px;"><strong>Buyer Protection:</strong> Every purchase is backed by our secure escrow guarantee.</li>
        </ul>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Start Exploring",
            cta_url=explore_url,
            app_url=app_url,
        )

        plain_text = f"""Welcome to Dovi, {name}!

Your account has been successfully created.

Discover smart student commerce, escrow-protected marketplace deals, and flexible Save2Own savings goals.

Explore the marketplace: {explore_url}

Dovi — Shop Smart. Feel Good.
https://dovishops.com
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_email_verification(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "there"
        app_url = ctx.get("app_url", "https://dovishops.com")
        verification_url = ctx.get("action_url") or f"{app_url}/verify-email?token={ctx.get('token', '')}"
        expires_in = ctx.get("expires_in", "24 hours")

        subject = "Verify your Dovi email address"
        preheader = "Please confirm your email address to secure your account."
        heading = "Confirm your email"
        intro = f"Hi {name}, thank you for registering with Dovi. Please verify your email address to ensure your account security and enable order notifications."
        body = f"""
        <p>Click the button below to verify your email address. This verification link will expire in <strong>{escape(expires_in)}</strong>.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Verify Email Address",
            cta_url=verification_url,
            security_notice="If you did not create an account on Dovi, you can safely disregard this email.",
            app_url=app_url,
        )

        plain_text = f"""Hi {name},

Please verify your Dovi email address by visiting the link below:

{verification_url}

This link will expire in {expires_in}.
If you did not request this, please disregard this email.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_password_reset(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "there"
        app_url = ctx.get("app_url", "https://dovishops.com")
        reset_url = ctx.get("action_url") or f"{app_url}/reset-password?uid={ctx.get('uid', '')}&token={ctx.get('token', '')}"
        expires_in = ctx.get("expires_in", "1 hour")

        subject = "Reset your Dovi password"
        preheader = "We received a request to reset your Dovi account password."
        heading = "Password Reset Request"
        intro = f"Hello {name}, we received a request to reset the password associated with your Dovi account."
        body = f"""
        <p>To choose a new password, click the button below. For security purposes, this password reset link will expire in <strong>{escape(expires_in)}</strong>.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Reset My Password",
            cta_url=reset_url,
            security_notice="If you did not request a password reset, your account is still secure — no changes have been made. Please change your password immediately if you suspect unauthorized activity.",
            app_url=app_url,
        )

        plain_text = f"""Hello {name},

We received a request to reset the password for your Dovi account.

Reset your password here:
{reset_url}

This link expires in {expires_in}.
If you did not make this request, you can ignore this email.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_password_changed(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "there"
        app_url = ctx.get("app_url", "https://dovishops.com")
        date_str = ctx.get("date_time", "Just now")

        subject = "Security Alert: Your Dovi password has been changed"
        preheader = "Your password was recently updated. Contact support if this was not you."
        heading = "Password Updated Successfully"
        intro = f"Hello {name}, this email confirms that your Dovi account password was successfully updated on <strong>{escape(date_str)}</strong>."
        body = """
        <p>You can now use your new password to sign in across all your devices.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Go to Login",
            cta_url=f"{app_url}/login",
            security_notice="If you did NOT make this change, please contact Dovi Security immediately at security@dovishops.com or reset your password immediately.",
            app_url=app_url,
        )

        plain_text = f"""Hello {name},

Your Dovi account password was successfully updated on {date_str}.

If you did not make this change, please contact us immediately at security@dovishops.com.

Sign in: {app_url}/login

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_security_login_alert(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "there"
        app_url = ctx.get("app_url", "https://dovishops.com")
        meta = [
            ("Date & Time", ctx.get("date_time", "Just now")),
            ("Device / Browser", ctx.get("device", "Unknown Browser / OS")),
            ("Approximate Location", ctx.get("location", "Nigeria")),
            ("IP Address", ctx.get("ip_address", "Protected")),
        ]

        subject = "Security Alert: New login to your Dovi account"
        preheader = "A new login was detected on your account."
        heading = "New Login Detected"
        intro = f"Hello {name}, we detected a new sign-in to your Dovi account."
        body = f"""
        <p>Here are the details of the login session:</p>
        {render_meta_table(meta)}
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Review Account Activity",
            cta_url=f"{app_url}/dashboard/settings",
            security_notice="If this was you, you can safely ignore this message. If you do not recognize this activity, please change your password right away to secure your account.",
            app_url=app_url,
        )

        plain_text = f"""Hello {name},

A new login was detected on your Dovi account:
Date: {ctx.get('date_time', 'Just now')}
Device: {ctx.get('device', 'Unknown')}
Location: {ctx.get('location', 'Nigeria')}
IP: {ctx.get('ip_address', 'Protected')}

If this was not you, change your password immediately at {app_url}/forgot-password.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    # ------------------------------------------------------------------------
    # B. Buyer Emails
    # ------------------------------------------------------------------------

    @staticmethod
    def render_order_confirmation(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Valued Customer"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")
        order_url = ctx.get("action_url") or f"{app_url}/orders/{order_ref}"

        items = ctx.get("items", [])
        subtotal = ctx.get("subtotal", 0)
        delivery_fee = ctx.get("delivery_fee", 0)
        total = ctx.get("total_amount", 0)

        meta = [
            ("Order Reference", order_ref),
            ("Date Placed", ctx.get("date_time", "Today")),
            ("Delivery Method", ctx.get("delivery_method", "Dovi Delivery")),
            ("Delivery Destination", ctx.get("delivery_address", "Campus Pickup / Delivery Address")),
        ]

        subject = f"Order Confirmed: {order_ref}"
        preheader = f"Your order {order_ref} has been confirmed and is being prepared."
        heading = "Order Confirmed!"
        intro = f"Thank you for shopping with Dovi, {name}! We have received your order <strong>#{order_ref}</strong>. Your funds are secured in Dovi Escrow and will only be released once your items are delivered."
        body = f"""
        {render_meta_table(meta)}
        <h3 style="font-size: 15px; margin: 24px 0 10px 0; color: #111827;">Order Summary</h3>
        {render_order_items_table(items, subtotal, delivery_fee, total)}
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Track Order",
            cta_url=order_url,
            app_url=app_url,
        )

        plain_text = f"""Order Confirmed: {order_ref}

Thank you for shopping with Dovi, {name}!
Order Reference: {order_ref}
Total Paid: {format_currency(total)}
Delivery: {ctx.get('delivery_method', 'Dovi Delivery')}

Track your order: {order_url}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_payment_successful(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        tx_ref = ctx.get("transaction_reference", "TX-REF")
        order_ref = ctx.get("order_reference", "")
        amount = ctx.get("total_amount", 0)
        app_url = ctx.get("app_url", "https://dovishops.com")

        meta = [
            ("Transaction Reference", tx_ref),
            ("Order Reference", order_ref or "N/A"),
            ("Amount Paid", format_currency(amount)),
            ("Payment Channel", ctx.get("payment_provider", "Card / Bank Transfer")),
            ("Status", "Successful (Verified)"),
            ("Date & Time", ctx.get("date_time", "Today")),
        ]

        subject = f"Payment Successful: {format_currency(amount)} ({tx_ref})"
        preheader = f"Your payment of {format_currency(amount)} was received successfully."
        heading = "Payment Successful"
        intro = f"Hi {name}, your payment of <strong>{format_currency(amount)}</strong> has been verified and processed successfully."
        body = f"""
        {render_meta_table(meta)}
        <p style="color: #6b7280; font-size: 13px;">This payment is held securely in Dovi Buyer Protection escrow.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Receipt",
            cta_url=f"{app_url}/orders/{order_ref}" if order_ref else f"{app_url}/dashboard/orders",
            app_url=app_url,
        )

        plain_text = f"""Payment Successful

Amount: {format_currency(amount)}
Transaction Ref: {tx_ref}
Order Ref: {order_ref}
Date: {ctx.get('date_time', 'Today')}

View order: {app_url}/orders/{order_ref}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_payment_failed(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        order_ref = ctx.get("order_reference", "")
        amount = ctx.get("total_amount", 0)
        app_url = ctx.get("app_url", "https://dovishops.com")
        retry_url = ctx.get("action_url") or f"{app_url}/checkout"

        meta = [
            ("Order Reference", order_ref or "Pending"),
            ("Attempted Amount", format_currency(amount)),
            ("Reason", ctx.get("failure_reason", "Transaction declined by issuing bank or payment timed out.")),
            ("Date & Time", ctx.get("date_time", "Today")),
        ]

        subject = f"Payment Attempt Failed for Order {order_ref}"
        preheader = "Your payment could not be processed. Please retry with a valid payment method."
        heading = "Payment Failed"
        intro = f"Hi {name}, we were unable to process your payment of <strong>{format_currency(amount)}</strong>."
        body = f"""
        {render_meta_table(meta)}
        <p>No funds were deducted from your account. Your cart items are temporarily saved so you can complete your checkout without starting over.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Retry Payment",
            cta_url=retry_url,
            app_url=app_url,
        )

        plain_text = f"""Payment Failed for Order {order_ref}

Amount: {format_currency(amount)}
Reason: {ctx.get('failure_reason', 'Transaction declined by bank.')}

Please retry payment here: {retry_url}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_order_processing(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Order #{order_ref} is being processed"
        preheader = f"Great news! Your order #{order_ref} is now in processing."
        heading = "Order in Processing"
        intro = f"Hi {name}, your order <strong>#{order_ref}</strong> is now being picked and packaged for fulfillment."
        body = f"""
        <p>Our team is preparing your items with care. You will receive another notification with tracking details as soon as your package is dispatched.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Order Status",
            cta_url=f"{app_url}/orders/{order_ref}",
            app_url=app_url,
        )

        plain_text = f"""Hi {name},

Your order #{order_ref} is now being processed.

Track status: {app_url}/orders/{order_ref}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_order_dispatched(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")
        tracking_ref = ctx.get("tracking_reference", "DOV-EXP")

        meta = [
            ("Order Reference", order_ref),
            ("Tracking Number", tracking_ref),
            ("Fulfillment Method", ctx.get("delivery_method", "Dovi Campus Dispatch")),
            ("Estimated Delivery", ctx.get("estimated_delivery", "Within 24 Hours")),
        ]

        subject = f"Dispatched: Order #{order_ref} is on its way!"
        preheader = f"Your package has been dispatched. Tracking #{tracking_ref}."
        heading = "Your Order Has Shipped!"
        intro = f"Exciting news, {name}! Your order <strong>#{order_ref}</strong> has been handed over to our dispatch courier and is on its way to you."
        body = f"""
        {render_meta_table(meta)}
        <p>Please keep your phone available for delivery contact from our rider.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Track Live Delivery",
            cta_url=f"{app_url}/orders/{order_ref}",
            app_url=app_url,
        )

        plain_text = f"""Dispatched: Order #{order_ref} is on its way!

Tracking Number: {tracking_ref}
Estimated Delivery: {ctx.get('estimated_delivery', 'Within 24 Hours')}

Track your delivery here: {app_url}/orders/{order_ref}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_order_delivered(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Delivered: Order #{order_ref}"
        preheader = f"Your package for order #{order_ref} has been marked as delivered."
        heading = "Order Delivered!"
        intro = f"Hi {name}, our dispatch team has reported that order <strong>#{order_ref}</strong> was successfully delivered."
        body = f"""
        <p>Please inspect your items. If everything meets your expectations, please confirm receipt on Dovi to complete the transaction and leave a verified review.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Confirm Receipt & Review",
            cta_url=f"{app_url}/orders/{order_ref}",
            security_notice="If you have NOT received this package, please open a dispute or contact support immediately before escrow funds are released.",
            app_url=app_url,
        )

        plain_text = f"""Delivered: Order #{order_ref}

Hi {name},
Your order has been delivered! Please inspect your package and confirm receipt:
{app_url}/orders/{order_ref}

If you did not receive this order, please notify us immediately.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_order_cancelled(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")
        reason = ctx.get("cancellation_reason", "Customer request / Store inventory adjustment")

        meta = [
            ("Order Reference", order_ref),
            ("Cancellation Reason", reason),
            ("Refund Status", ctx.get("refund_status", "Refund initiated to original payment method")),
            ("Date", ctx.get("date_time", "Today")),
        ]

        subject = f"Order Cancelled: #{order_ref}"
        preheader = f"Your order #{order_ref} has been cancelled."
        heading = "Order Cancellation Notice"
        intro = f"Hi {name}, this email confirms that order <strong>#{order_ref}</strong> has been cancelled."
        body = f"""
        {render_meta_table(meta)}
        <p>Any funds debited for this purchase are being returned to your original payment account.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Order Details",
            cta_url=f"{app_url}/orders/{order_ref}",
            app_url=app_url,
        )

        plain_text = f"""Order Cancelled: #{order_ref}

Reason: {reason}
Status: {ctx.get('refund_status', 'Refund initiated')}

View details: {app_url}/orders/{order_ref}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_refund_initiated(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        refund_ref = ctx.get("refund_reference", "RFD-REF")
        order_ref = ctx.get("order_reference", "")
        amount = ctx.get("total_amount", 0)
        app_url = ctx.get("app_url", "https://dovishops.com")

        meta = [
            ("Refund Claim Ref", refund_ref),
            ("Order Reference", order_ref),
            ("Refund Amount", format_currency(amount)),
            ("Reason", ctx.get("refund_reason", "Return / Cancellation claim")),
            ("Estimated Timeline", "1-3 Business Days"),
        ]

        subject = f"Refund Claim Initiated: {refund_ref}"
        preheader = f"Your refund request for {format_currency(amount)} has been initiated."
        heading = "Refund Initiated"
        intro = f"Hi {name}, we have received and registered your refund request for order <strong>#{order_ref}</strong>."
        body = f"""
        {render_meta_table(meta)}
        <p>Our dispute and escrow resolution team is reviewing your claim. You will receive an update as soon as the review is complete.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Check Refund Status",
            cta_url=f"{app_url}/dashboard/orders",
            app_url=app_url,
        )

        plain_text = f"""Refund Initiated: {refund_ref}

Order: {order_ref}
Amount: {format_currency(amount)}
Timeline: 1-3 Business Days

Check status: {app_url}/dashboard/orders

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_refund_completed(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        refund_ref = ctx.get("refund_reference", "RFD-REF")
        order_ref = ctx.get("order_reference", "")
        amount = ctx.get("total_amount", 0)
        app_url = ctx.get("app_url", "https://dovishops.com")

        meta = [
            ("Refund Reference", refund_ref),
            ("Associated Order", order_ref),
            ("Total Refunded", format_currency(amount)),
            ("Payout Destination", ctx.get("payout_destination", "Original Card / Bank Account")),
            ("Completion Date", ctx.get("date_time", "Today")),
        ]

        subject = f"Refund Completed: {format_currency(amount)} credited"
        preheader = f"Your refund of {format_currency(amount)} has been successfully processed."
        heading = "Refund Completed"
        intro = f"Hi {name}, your refund of <strong>{format_currency(amount)}</strong> has been approved and successfully processed."
        body = f"""
        {render_meta_table(meta)}
        <p>Depending on your bank, the funds typically appear in your account statement within a few hours to 2 business days.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Marketplace",
            cta_url=f"{app_url}/products",
            app_url=app_url,
        )

        plain_text = f"""Refund Completed

Refund Reference: {refund_ref}
Order: {order_ref}
Amount: {format_currency(amount)}
Credited To: {ctx.get('payout_destination', 'Original payment method')}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    # ------------------------------------------------------------------------
    # C. Seller Emails
    # ------------------------------------------------------------------------

    @staticmethod
    def render_seller_new_order(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        seller_name = ctx.get("seller_name") or ctx.get("customer_name") or "Merchant"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")
        items = ctx.get("items", [])
        total = ctx.get("total_amount", 0)

        meta = [
            ("Order Reference", order_ref),
            ("Buyer", ctx.get("buyer_name", "Verified Buyer")),
            ("Fulfillment SLA", "Fulfill within 24 hours"),
            ("Payout Value", format_currency(total)),
        ]

        subject = f"Action Required: New Order #{order_ref} Received!"
        preheader = f"You received a new order #{order_ref}. Please prepare for fulfillment."
        heading = "You Have a New Order!"
        intro = f"Congratulations, {seller_name}! A new purchase has been completed for your store. The buyer's payment is secured in Dovi Escrow."
        body = f"""
        {render_meta_table(meta)}
        <h3 style="font-size: 15px; margin: 24px 0 10px 0; color: #111827;">Items to Pack</h3>
        {render_order_items_table(items, total, 0, total)}
        <p>Please prepare the package promptly to uphold high merchant ratings and avoid order cancellation.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Open Merchant Order",
            cta_url=f"{app_url}/vendor/dashboard",
            app_url=app_url,
        )

        plain_text = f"""New Order #{order_ref} Received!

Congratulations {seller_name},
You have a new order: #{order_ref}
Amount: {format_currency(total)}

Please open your merchant hub and prepare the package:
{app_url}/vendor/dashboard

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_seller_payment_confirmed(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        seller_name = ctx.get("seller_name") or "Merchant"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        amount = ctx.get("total_amount", 0)
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Escrow Secured: Payment confirmed for #{order_ref}"
        preheader = f"Payment of {format_currency(amount)} verified in escrow."
        heading = "Payment Secured in Escrow"
        intro = f"Hi {seller_name}, the payment of <strong>{format_currency(amount)}</strong> for order #{order_ref} has been verified and safely locked into escrow."
        body = f"""
        <p>You can proceed with full confidence to fulfill and dispatch this order. Funds will be released to your payout balance upon successful buyer delivery.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Merchant Orders",
            cta_url=f"{app_url}/vendor/dashboard",
            app_url=app_url,
        )

        plain_text = f"""Payment Confirmed for #{order_ref}

Amount: {format_currency(amount)} is locked in Dovi Escrow.
Fulfill order: {app_url}/vendor/dashboard

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_seller_order_cancelled(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        seller_name = ctx.get("seller_name") or "Merchant"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Order Cancelled: #{order_ref}"
        preheader = f"Order #{order_ref} has been cancelled. Do not dispatch."
        heading = "Order Cancelled"
        intro = f"Hi {seller_name}, order <strong>#{order_ref}</strong> has been cancelled."
        body = """
        <p>Please do not dispatch the package for this order. Your inventory has been updated accordingly.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Merchant Dashboard",
            cta_url=f"{app_url}/vendor/dashboard",
            app_url=app_url,
        )

        plain_text = f"""Order Cancelled: #{order_ref}

Hi {seller_name}, please do not dispatch order #{order_ref}. It has been cancelled.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_seller_fulfillment_reminder(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        seller_name = ctx.get("seller_name") or "Merchant"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")
        hours_left = ctx.get("hours_remaining", "12")

        subject = f"Urgent Reminder: Fulfill Order #{order_ref} ({hours_left}h remaining)"
        preheader = f"Fulfillment SLA reminder for #{order_ref}."
        heading = "Pending Fulfillment Reminder"
        intro = f"Hi {seller_name}, this is an automated reminder that order <strong>#{order_ref}</strong> is awaiting your fulfillment."
        body = f"""
        <p>You have approximately <strong>{hours_left} hours</strong> remaining before this order enters the delayed fulfillment escalation queue. Prompt dispatch maintains your priority merchant tier.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Fulfill Now",
            cta_url=f"{app_url}/vendor/dashboard",
            app_url=app_url,
        )

        plain_text = f"""Fulfillment Reminder for Order #{order_ref}

Please fulfill this order within {hours_left} hours:
{app_url}/vendor/dashboard

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_seller_payout_initiated(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        seller_name = ctx.get("seller_name") or "Merchant"
        amount = ctx.get("total_amount", 0)
        payout_ref = ctx.get("payout_reference", "PO-REF")
        app_url = ctx.get("app_url", "https://dovishops.com")

        meta = [
            ("Payout Reference", payout_ref),
            ("Amount", format_currency(amount)),
            ("Bank", ctx.get("bank_name", "Default Bank Account")),
            ("Account Number", ctx.get("account_number", "****")),
            ("Status", "Processing Bank Settlement"),
        ]

        subject = f"Payout Initiated: {format_currency(amount)} ({payout_ref})"
        preheader = f"Your payout of {format_currency(amount)} has been sent for settlement."
        heading = "Merchant Payout Initiated"
        intro = f"Hi {seller_name}, we have initiated a payout of <strong>{format_currency(amount)}</strong> for your completed orders."
        body = f"""
        {render_meta_table(meta)}
        <p>Transfers are processed through the interbank clearing system and typically reflect shortly.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Payout History",
            cta_url=f"{app_url}/vendor/dashboard",
            app_url=app_url,
        )

        plain_text = f"""Payout Initiated: {payout_ref}

Amount: {format_currency(amount)}
Bank: {ctx.get('bank_name', 'Default Bank')}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_seller_payout_successful(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        seller_name = ctx.get("seller_name") or "Merchant"
        amount = ctx.get("total_amount", 0)
        payout_ref = ctx.get("payout_reference", "PO-REF")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Payout Confirmed: {format_currency(amount)} delivered to your bank"
        preheader = f"Your payout #{payout_ref} has been completed successfully."
        heading = "Payout Settled Successfully"
        intro = f"Hi {seller_name}, your merchant payout of <strong>{format_currency(amount)}</strong> has been successfully credited to your bank account."
        body = f"""
        <p>Reference: <strong>{escape(payout_ref)}</strong>. Thank you for providing exceptional service to campus buyers on Dovi!</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Merchant Hub",
            cta_url=f"{app_url}/vendor/dashboard",
            app_url=app_url,
        )

        plain_text = f"""Payout Settled: {format_currency(amount)}

Payout Ref: {payout_ref}
Funds have been credited to your bank account.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_seller_payout_failed(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        seller_name = ctx.get("seller_name") or "Merchant"
        amount = ctx.get("total_amount", 0)
        app_url = ctx.get("app_url", "https://dovishops.com")
        reason = ctx.get("failure_reason", "Bank account name mismatch or invalid account number.")

        subject = "Action Required: Merchant Payout Attempt Failed"
        preheader = f"We could not deliver your payout of {format_currency(amount)}. Please update your bank details."
        heading = "Payout Transfer Failed"
        intro = f"Hi {seller_name}, an attempt to transfer your payout of <strong>{format_currency(amount)}</strong> was returned by the banking network."
        body = f"""
        <p><strong>Reason:</strong> {escape(reason)}</p>
        <p>Your earnings remain safely held in your Dovi merchant ledger. Please review and update your bank account information in the merchant portal so we can re-attempt the payout.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Update Bank Details",
            cta_url=f"{app_url}/vendor/dashboard",
            app_url=app_url,
        )

        plain_text = f"""Payout Attempt Failed: {format_currency(amount)}

Reason: {reason}
Please update your payout details: {app_url}/vendor/dashboard

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    # ------------------------------------------------------------------------
    # D. Escrow and Dispute Emails
    # ------------------------------------------------------------------------

    @staticmethod
    def render_escrow_payment_secured(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        amount = ctx.get("total_amount", 0)
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Escrow Secured: Order #{order_ref}"
        preheader = f"Your payment of {format_currency(amount)} is protected under Dovi Escrow."
        heading = "Payment Protected in Escrow"
        intro = f"Hi {name}, your payment of <strong>{format_currency(amount)}</strong> is safely locked in Dovi Escrow."
        body = """
        <p>How Dovi Escrow protects you:</p>
        <ul style="margin: 0 0 16px 20px; padding: 0; color: #4b5563;">
          <li style="margin-bottom: 6px;">The merchant is notified to prepare your items immediately.</li>
          <li style="margin-bottom: 6px;">Your money is <strong>never</strong> released to the seller until you receive your items and confirm satisfaction.</li>
          <li style="margin-bottom: 6px;">If an item is missing or misdescribed, you are entitled to a full refund under Dovi Buyer Protection.</li>
        </ul>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Escrow Status",
            cta_url=f"{app_url}/orders/{order_ref}",
            app_url=app_url,
        )

        plain_text = f"""Payment Secured in Escrow: #{order_ref}

Your payment of {format_currency(amount)} is safely locked in Dovi Escrow.
The seller will not receive payment until you confirm receipt.

View status: {app_url}/orders/{order_ref}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_escrow_awaiting_fulfillment(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Escrow Update: Order #{order_ref} awaiting merchant packaging"
        preheader = f"Order #{order_ref} is awaiting fulfillment under escrow."
        heading = "Awaiting Fulfillment"
        intro = f"Hi {name}, order <strong>#{order_ref}</strong> is in progress under escrow supervision."
        body = """
        <p>The seller has been notified of your secured payment and is packing your products. We will notify you the moment your package is ready for dispatch.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Track Order",
            cta_url=f"{app_url}/orders/{order_ref}",
            app_url=app_url,
        )

        plain_text = f"""Escrow Update: #{order_ref}

The merchant is preparing your package under Dovi Escrow.
Track order: {app_url}/orders/{order_ref}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_escrow_awaiting_confirmation(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Customer"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Action Needed: Confirm delivery for Order #{order_ref}"
        preheader = "Your order was delivered. Please confirm receipt to release escrow."
        heading = "Please Confirm Delivery"
        intro = f"Hi {name}, our system indicates that order <strong>#{order_ref}</strong> has been delivered."
        body = """
        <p>Please take a moment to confirm that everything arrived in good condition. Once you confirm, escrow funds will be released to the merchant.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Confirm Delivery",
            cta_url=f"{app_url}/orders/{order_ref}",
            app_url=app_url,
        )

        plain_text = f"""Confirm Delivery for #{order_ref}

Please confirm receipt of your order:
{app_url}/orders/{order_ref}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_escrow_released(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        seller_name = ctx.get("seller_name") or ctx.get("customer_name") or "Merchant"
        order_ref = ctx.get("order_reference", "DOV-ORD")
        amount = ctx.get("total_amount", 0)
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Escrow Released: {format_currency(amount)} for #{order_ref}"
        preheader = f"Escrow funds for #{order_ref} have been released."
        heading = "Escrow Funds Released"
        intro = f"Hi {seller_name}, the buyer has confirmed delivery for order <strong>#{order_ref}</strong>."
        body = f"""
        <p>Escrow funds of <strong>{format_currency(amount)}</strong> have been unlocked and added to your available merchant balance.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Merchant Balance",
            cta_url=f"{app_url}/vendor/dashboard",
            app_url=app_url,
        )

        plain_text = f"""Escrow Released: #{order_ref}

Amount: {format_currency(amount)} released to your merchant balance.
View: {app_url}/vendor/dashboard

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_dispute_opened(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "User"
        dispute_ref = ctx.get("dispute_reference", "DSP-REF")
        order_ref = ctx.get("order_reference", "")
        app_url = ctx.get("app_url", "https://dovishops.com")
        reason = ctx.get("dispute_reason", "Item not received / defective")

        meta = [
            ("Dispute Reference", dispute_ref),
            ("Order Reference", order_ref),
            ("Reason Filed", reason),
            ("Escrow Status", "FROZEN (Protected)"),
        ]

        subject = f"Dispute Opened: Case {dispute_ref} for #{order_ref}"
        preheader = f"Dispute case {dispute_ref} has been opened. Escrow is frozen."
        heading = "Dispute Case Opened"
        intro = f"Hello {name}, a dispute claim has been registered regarding order <strong>#{order_ref}</strong>."
        body = f"""
        {render_meta_table(meta)}
        <p>All escrow payouts for this transaction are <strong>frozen</strong> pending resolution by the Dovi dispute team. Both parties will be contacted for necessary evidence.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Dispute Case",
            cta_url=f"{app_url}/dashboard/orders",
            app_url=app_url,
        )

        plain_text = f"""Dispute Case Opened: {dispute_ref}

Order: {order_ref}
Reason: {reason}
Escrow is frozen until resolved.

View case: {app_url}/dashboard/orders

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_dispute_update(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "User"
        dispute_ref = ctx.get("dispute_reference", "DSP-REF")
        app_url = ctx.get("app_url", "https://dovishops.com")
        update_notes = ctx.get("update_notes", "A new note or evidence was submitted for your dispute case.")

        subject = f"Update on Dispute Case: {dispute_ref}"
        preheader = f"There is a new update on dispute #{dispute_ref}."
        heading = "Dispute Case Update"
        intro = f"Hello {name}, the Dovi dispute team has provided an update on case <strong>#{dispute_ref}</strong>."
        body = f"""
        <p style="padding: 12px 16px; background-color: #f9fafb; border-left: 3px solid #ff7a00; font-style: italic;">
          {escape(update_notes)}
        </p>
        <p>Please log in to your account if additional information or response is requested.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Review Dispute",
            cta_url=f"{app_url}/dashboard/orders",
            app_url=app_url,
        )

        plain_text = f"""Dispute Case Update: {dispute_ref}

Update: {update_notes}

Review case: {app_url}/dashboard/orders

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_dispute_resolved(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "User"
        dispute_ref = ctx.get("dispute_reference", "DSP-REF")
        order_ref = ctx.get("order_reference", "")
        resolution = ctx.get("resolution", "Refund approved and issued to buyer.")
        app_url = ctx.get("app_url", "https://dovishops.com")

        meta = [
            ("Dispute Reference", dispute_ref),
            ("Order Reference", order_ref),
            ("Resolution Ruling", resolution),
            ("Case Status", "CLOSED / RESOLVED"),
        ]

        subject = f"Dispute Resolved: Case #{dispute_ref}"
        preheader = f"Dispute case #{dispute_ref} has been resolved."
        heading = "Dispute Case Resolved"
        intro = f"Hello {name}, dispute case <strong>#{dispute_ref}</strong> has been officially concluded by the Dovi dispute panel."
        body = f"""
        {render_meta_table(meta)}
        <p>Thank you for your cooperation and patience throughout this review process.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View Resolution Summary",
            cta_url=f"{app_url}/dashboard/orders",
            app_url=app_url,
        )

        plain_text = f"""Dispute Case Resolved: #{dispute_ref}

Ruling: {resolution}
Status: CLOSED

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    # ------------------------------------------------------------------------
    # E. Platform and Support Emails
    # ------------------------------------------------------------------------

    @staticmethod
    def render_platform_announcement(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Dovi Member"
        title = ctx.get("announcement_title") or ctx.get("title") or "Important Announcement from Dovi"
        message_html = ctx.get("message_html") or ctx.get("message") or "We have an important platform update to share with our campus community."
        app_url = ctx.get("app_url", "https://dovishops.com")
        action_text = ctx.get("action_text", "Visit Dovi")
        action_url = ctx.get("action_url", app_url)

        subject = f"Dovi Announcement: {title}"
        preheader = f"{title} — Important update for the Dovi community."
        heading = escape(title)
        intro = f"Hi {name},"
        body = f"""
        <div style="font-size: 15px; line-height: 1.6; color: #374151;">
          {message_html}
        </div>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text=action_text,
            cta_url=action_url,
            app_url=app_url,
        )

        plain_text = f"""{title}

Hi {name},

{ctx.get('message', 'Platform update from Dovi.')}

Visit Dovi: {action_url}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_support_ticket_received(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "there"
        ticket_id = ctx.get("ticket_id", "TKT-001")
        app_url = ctx.get("app_url", "https://dovishops.com")
        subject_query = ctx.get("ticket_subject", "Customer Inquiry")

        meta = [
            ("Ticket Number", ticket_id),
            ("Subject", subject_query),
            ("Expected Response", "Within 4 Hours"),
            ("Status", "Open (Assigned to Support)"),
        ]

        subject = f"Support Request Received: #{ticket_id}"
        preheader = f"We have received your request #{ticket_id}."
        heading = "We're on it!"
        intro = f"Hi {name}, thank you for contacting Dovi Support. We have received your inquiry and our campus helpdesk team is already looking into it."
        body = f"""
        {render_meta_table(meta)}
        <p>You can reply directly to this email at any time to provide more details or follow up.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Visit Help Center",
            cta_url=f"{app_url}/help",
            app_url=app_url,
        )

        plain_text = f"""Support Request Received: #{ticket_id}

Hi {name},
We have received your ticket regarding "{subject_query}".
Expected response: within 4 hours.

Reply to this email with any additional info.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_support_response(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "there"
        ticket_id = ctx.get("ticket_id", "TKT-001")
        app_url = ctx.get("app_url", "https://dovishops.com")
        response_text = ctx.get("agent_response", "Thank you for contacting Dovi Support.")
        agent_name = ctx.get("agent_name", "Dovi Support Team")

        subject = f"Re: Support Ticket #{ticket_id}"
        preheader = f"New response to ticket #{ticket_id}."
        heading = f"Update on Ticket #{ticket_id}"
        intro = f"Hi {name}, {agent_name} from Dovi Support has responded to your ticket:"
        body = f"""
        <div style="padding: 16px; background-color: #f9fafb; border-left: 3px solid #ff7a00; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #1f2937;">
          {escape(response_text)}
        </div>
        <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">Need more help? Simply reply directly to this email to continue the conversation.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View in Help Center",
            cta_url=f"{app_url}/help",
            app_url=app_url,
        )

        plain_text = f"""Re: Support Ticket #{ticket_id}

Hi {name},
{agent_name} wrote:

{response_text}

Reply directly to this email if you need anything else.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_account_suspended(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "User"
        reason = ctx.get("suspension_reason", "Violation of Dovi Marketplace Community Guidelines or security safeguards.")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = "Important Notice: Your Dovi Account Has Been Suspended"
        preheader = "Your account access has been restricted."
        heading = "Account Status Notice"
        intro = f"Hello {name}, your Dovi account login access has been suspended in accordance with our marketplace safety and terms policies."
        body = f"""
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 16px 0; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;">
          <tr>
            <td style="padding: 14px 18px; font-size: 13px; color: #991b1b; line-height: 1.5;">
              <strong>Reason:</strong> {escape(reason)}
            </td>
          </tr>
        </table>
        <p>While suspended, you cannot place new orders, create Save2Own targets, or list products. If you believe this action was taken in error, you may file an appeal by replying to this email or contacting our trust desk.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Contact Trust & Safety",
            cta_url="mailto:support@dovishops.com?subject=Account%20Suspension%20Appeal",
            app_url=app_url,
        )

        plain_text = f"""Important Notice: Account Suspended

Hello {name},
Your Dovi account has been suspended.
Reason: {reason}

If you believe this was an error, please appeal to support@dovishops.com.

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_policy_update(ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "Valued Member"
        policy_name = ctx.get("policy_name", "Terms of Service & Escrow Rules")
        effective_date = ctx.get("effective_date", "Immediately")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = f"Notice: Update to Dovi {policy_name}"
        preheader = f"We have updated our {policy_name}. Effective {effective_date}."
        heading = f"Updated {policy_name}"
        intro = f"Hi {name}, we are writing to let you know that we have updated our <strong>{escape(policy_name)}</strong>, effective <strong>{escape(effective_date)}</strong>."
        body = """
        <p>These updates reflect our continued commitment to transparent campus commerce, enhanced fraud prevention, and faster escrow dispute turnaround times.</p>
        <p>No action is required from you to continue using Dovi, but we encourage you to review the revised terms.</p>
        """

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="Review Policies",
            cta_url=f"{app_url}/terms",
            app_url=app_url,
        )

        plain_text = f"""Notice: Update to Dovi {policy_name}

Effective: {effective_date}

Review the updated terms at: {app_url}/terms

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text

    @staticmethod
    def render_generic_notification(email_type: str, ctx: Dict[str, Any]) -> Tuple[str, str, str]:
        name = ctx.get("customer_name") or "there"
        title = ctx.get("title", f"Notification: {email_type.replace('_', ' ').title()}")
        message = ctx.get("message", "You have a new notification from Dovi.")
        app_url = ctx.get("app_url", "https://dovishops.com")

        subject = title
        preheader = message[:100]
        heading = title
        intro = f"Hi {name},"
        body = f"<p>{escape(message)}</p>"

        html_body = build_email_shell(
            title=subject,
            preheader=preheader,
            heading=heading,
            intro_html=intro,
            body_content_html=body,
            cta_text="View on Dovi",
            cta_url=app_url,
            app_url=app_url,
        )

        plain_text = f"""{title}

Hi {name},
{message}

Visit Dovi: {app_url}

Dovi — Shop Smart. Feel Good.
"""
        return subject, html_body, plain_text
