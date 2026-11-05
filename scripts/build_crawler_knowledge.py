# -*- coding: utf-8 -*-
import json
import os

with open('frontend/src/api/seedProducts.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('[')
end = text.rfind(']') + 1
products = json.loads(text[start:end])

# Shared CSS for standalone HTML pages
BASE_PAGE_CSS = """
  :root {
    --color-primary: #ff7a00;
    --color-primary-dark: #e56e00;
    --color-bg: #f9fafb;
    --color-card: #ffffff;
    --color-text: #111827;
    --color-muted: #6b7280;
    --color-border: #e5e7eb;
    --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--font-family);
    background-color: var(--color-bg);
    color: var(--color-text);
    line-height: 1.6;
    padding: 0;
  }
  header {
    background: #ffffff;
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 1.5rem;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .header-inner {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--color-text);
    font-size: 1.4rem;
    font-weight: 800;
  }
  .brand img {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    object-fit: cover;
  }
  .nav-links {
    display: flex;
    gap: 1.2rem;
    list-style: none;
    font-size: 0.95rem;
  }
  .nav-links a {
    text-decoration: none;
    color: var(--color-muted);
    font-weight: 500;
    transition: color 0.15s;
  }
  .nav-links a:hover, .nav-links a.active {
    color: var(--color-primary);
  }
  .container {
    max-width: 900px;
    margin: 2.5rem auto;
    padding: 0 1.5rem;
  }
  .card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  h1 { font-size: 2rem; margin-bottom: 0.75rem; color: #111827; }
  h2 { font-size: 1.35rem; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #1f2937; }
  h3 { font-size: 1.1rem; margin-top: 1rem; margin-bottom: 0.35rem; color: #374151; }
  p { margin-bottom: 1rem; color: #4b5563; }
  ul, ol { margin-left: 1.5rem; margin-bottom: 1rem; color: #4b5563; }
  li { margin-bottom: 0.5rem; }
  .tagline {
    font-size: 1.1rem;
    color: var(--color-primary);
    font-weight: 600;
    margin-bottom: 1.5rem;
  }
  .badge {
    display: inline-block;
    background: rgba(255, 122, 0, 0.1);
    color: var(--color-primary);
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-transform: uppercase;
  }
  .faq-item {
    border-bottom: 1px solid var(--color-border);
    padding: 1.25rem 0;
  }
  .faq-item:last-child { border-bottom: none; }
  .faq-q { font-weight: 700; color: #111827; margin-bottom: 0.4rem; font-size: 1.05rem; }
  .faq-a { color: #4b5563; font-size: 0.95rem; }
  footer {
    background: #ffffff;
    border-top: 1px solid var(--color-border);
    padding: 2rem 1.5rem;
    margin-top: 4rem;
    text-align: center;
    color: var(--color-muted);
    font-size: 0.875rem;
  }
  .footer-links {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .footer-links a {
    color: var(--color-muted);
    text-decoration: none;
  }
  .footer-links a:hover { color: var(--color-primary); }
  @media (max-width: 640px) {
    .nav-links { display: none; }
    .card { padding: 1.25rem; }
  }
"""

def make_page(title, badge, main_content):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — Dovi | Shop Smart. Feel Good.</title>
  <meta name="description" content="{title} on Dovi — Nigeria's premier student-focused centralized marketplace." />
  <link rel="canonical" href="https://dovishop.com/{title.lower().replace(' ', '-')}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  <style>{BASE_PAGE_CSS}</style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a href="/" class="brand">
        <img src="/logo.jpg" alt="Dovi" width="36" height="36" />
        <span>DOVI</span>
      </a>
      <ul class="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/products">Products</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/faq">FAQ</a></li>
        <li><a href="/shipping">Shipping</a></li>
        <li><a href="/returns">Returns</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </div>
  </header>

  <main class="container">
    <div class="card">
      <span class="badge">{badge}</span>
      {main_content}
    </div>
  </main>

  <footer>
    <div class="footer-links">
      <a href="/">Home</a>
      <a href="/products">All Products</a>
      <a href="/about">About Dovi</a>
      <a href="/faq">FAQ</a>
      <a href="/shipping">Shipping & Delivery</a>
      <a href="/returns">Returns & Refunds</a>
      <a href="/terms">Terms of Service</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="/contact">Contact Us</a>
    </div>
    <p>&copy; 2026 Dovi Technologies. Dovi — Shop Smart. Feel Good. All rights reserved.</p>
  </footer>
</body>
</html>
"""

# 1. ABOUT PAGE
about_content = """
  <h1>About DoviShop</h1>
  <p class="tagline">Dovi — Shop Smart. Feel Good.</p>

  <p><strong>Dovi</strong> is Nigeria's premier student-focused centralized marketplace designed to make campus shopping secure, affordable, and seamless. We empower tertiary students, young professionals, and campus communities to access high-quality goods from verified vendors without fear of fraud or disappointment.</p>

  <h2>A Centralized Marketplace Model</h2>
  <p>Unlike unmoderated classifieds or peer-to-peer bulletin boards where buyers and sellers transact at their own risk, <strong>Dovi centrally manages and guarantees every single transaction</strong>:</p>
  <ul>
    <li><strong>100% Escrow Protection:</strong> Every payment made on Dovi is held in secure escrow. Funds are never disbursed to the vendor until the student receives, inspects, and approves their item.</li>
    <li><strong>Vendor Verification:</strong> Every vendor on Dovi undergoes strict identity and quality verification before listing products.</li>
    <li><strong>Centralized Customer Operations:</strong> If an issue arises with an order, Dovi's dedicated resolution team intervenes directly to provide refunds, replacements, or support.</li>
    <li><strong>Consolidated Logistics:</strong> Through our flagship <strong>Onitsha Fulfillment Hub</strong> and campus dispatch stations, orders from multiple vendors are consolidated into single parcels, saving students substantial delivery fees.</li>
  </ul>

  <h2>Our Core Values</h2>
  <ul>
    <li><strong>Student-First Pricing:</strong> Fair, transparent market pricing negotiated directly with manufacturers and verified wholesalers.</li>
    <li><strong>Save2Own Financial Inclusion:</strong> Innovative zero-interest micro-installment savings program that allows students to acquire essential laptops, electronics, and study tools without predatory loans.</li>
    <li><strong>Speed & Reliability:</strong> Direct campus deliveries and designated campus pick-up points across Nigerian universities and polytechnics within 24 to 72 hours.</li>
  </ul>

  <h2>Contact Information</h2>
  <p>Have questions or want to partner with Dovi? Reach out directly:</p>
  <p>Email: <a href="mailto:hello@dovishop.com">hello@dovishop.com</a> | <a href="mailto:support@dovishop.com">support@dovishop.com</a></p>
  <p>Support Hours: Monday to Saturday, 8:00 AM – 8:00 PM (West Africa Time / GMT+1)</p>
"""

with open('frontend/public/about.html', 'w', encoding='utf-8') as f:
    f.write(make_page('About DoviShop', 'Company Overview', about_content))
print('Generated frontend/public/about.html')

# 2. FAQ PAGE
faq_content = """
  <h1>Frequently Asked Questions (FAQ)</h1>
  <p class="tagline">Everything you need to know about shopping, payments, and delivery on Dovi.</p>

  <div class="faq-item">
    <div class="faq-q">1. What is Dovi and how does it work?</div>
    <div class="faq-a">Dovi is a centralized student-focused marketplace in Nigeria. You can browse verified electronics, fashion, home essentials, and auto supplies. When you place an order, your payment is held securely in escrow until you receive and confirm your purchase.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">2. Is my money safe when paying on Dovi?</div>
    <div class="faq-a">Yes, 100%. Dovi uses an escrow payment system. The vendor does not receive your payment when you checkout. Funds are only released to the vendor after your parcel is delivered and you have completed your 48-hour inspection period without dispute.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">3. What payment methods are accepted?</div>
    <div class="faq-a">Dovi accepts Nigerian debit cards (Mastercard, Visa, Verve), direct bank transfers, mobile bank USSD, and Dovi wallet balances. All payment processing is encrypted with bank-grade 256-bit SSL.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">4. How long does campus delivery take?</div>
    <div class="faq-a">Standard campus delivery typically takes 24 to 72 hours depending on your campus location. Deliveries routed through our Onitsha Fulfillment Hub are consolidated to reduce delivery costs and speed up transit.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">5. What is the Save2Own program?</div>
    <div class="faq-a">Save2Own allows students to save toward high-value items (such as laptops, smartphones, and home appliances) through interest-free micro-payments. Once your goal target is reached, the product is fulfilled and delivered to you immediately with 0% interest and zero hidden charges.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">6. Can I return a product if it's damaged or not as described?</div>
    <div class="faq-a">Yes. Dovi offers a 48-hour inspection window from the moment of delivery. If the item is defective, damaged, or does not match the vendor's listing, you can open a dispute or refund request directly from your dashboard for an immediate replacement or full escrow refund.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">7. How do I track my order?</div>
    <div class="faq-a">You will receive an automated email confirmation with your unique order tracking reference (e.g. DOVI-ORD-XXXX). You can view live dispatch updates from your Order History page or contact our support team.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">8. How can I sell on Dovi as a vendor?</div>
    <div class="faq-a">Verified vendors can apply to sell on Dovi by registering a vendor account and completing business and identity verification. Once approved, vendors can list catalog products and manage fulfillment through our centralized dispatch system.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">9. How do I contact customer support?</div>
    <div class="faq-a">You can reach Dovi customer support via live chat (Smartsupp widget on the bottom right of any page), by emailing support@dovishop.com or hello@dovishop.com, or during business hours (8:00 AM – 8:00 PM WAT).</div>
  </div>
"""

with open('frontend/public/faq.html', 'w', encoding='utf-8') as f:
    f.write(make_page('Frequently Asked Questions', 'Help Center', faq_content))
print('Generated frontend/public/faq.html')

# 3. CONTACT PAGE
contact_content = """
  <h1>Contact Dovi Support</h1>
  <p class="tagline">We're here to help you shop smart and feel good.</p>

  <h2>Get in Touch</h2>
  <p>Our centralized customer care and dispute mediation team is available to assist buyers, students, and vendors with any questions regarding orders, payments, escrow, or campus delivery.</p>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;">
    <div style="background: var(--color-bg); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--color-border);">
      <h3 style="color: var(--color-primary); margin-top: 0;">General Inquiries</h3>
      <p style="margin-bottom: 0.5rem;">For general questions, partnerships, and press:</p>
      <p><strong>Email:</strong> <a href="mailto:hello@dovishop.com">hello@dovishop.com</a></p>
    </div>

    <div style="background: var(--color-bg); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--color-border);">
      <h3 style="color: var(--color-primary); margin-top: 0;">Customer Support & Disputes</h3>
      <p style="margin-bottom: 0.5rem;">For order issues, returns, delivery status, and refunds:</p>
      <p><strong>Email:</strong> <a href="mailto:support@dovishop.com">support@dovishop.com</a></p>
    </div>
  </div>

  <h2>Live Chat</h2>
  <p>For immediate assistance, click the <strong>Smartsupp Live Chat</strong> widget located on the bottom right corner of your screen. Our human support agents and Mira AI assistant are active during operating hours.</p>

  <h2>Operating Hours</h2>
  <p>Monday – Saturday: 8:00 AM – 8:00 PM (West Africa Time / GMT+1)</p>
  <p>Sunday: Emergency ticket monitoring & scheduled dispatch support only.</p>

  <h2>Fulfillment Operations Center</h2>
  <p><strong>Dovi Central Logistics & Consolidation Hub:</strong><br />Onitsha Commercial Center, Anambra State, Nigeria.<br />Serving university campuses nationwide with direct terminal dispatch.</p>
"""

with open('frontend/public/contact.html', 'w', encoding='utf-8') as f:
    f.write(make_page('Contact Support', 'Customer Care', contact_content))
print('Generated frontend/public/contact.html')

# 4. SHIPPING & DELIVERY POLICY
shipping_content = """
  <h1>Shipping & Campus Delivery Policy</h1>
  <p class="tagline">Fast, reliable, and consolidated fulfillment for tertiary institutions.</p>

  <h2>1. Order Fulfillment & Consolidation</h2>
  <p>Dovi operates a centralized logistics fulfillment model. Orders placed from one or multiple vendors are routed to our <strong>Onitsha Fulfillment Hub</strong> where items are consolidated into single parcels. This eliminates duplicate delivery charges and ensures all items arrive safely.</p>

  <h2>2. Delivery Classifications</h2>
  <p>To keep shipping rates fair for students, items on Dovi are categorized into 4 delivery classes:</p>
  <ul>
    <li><strong>Small Parcel (under 2 kg):</strong> Gadgets, accessories, cosmetics, clothing, clippers, books. Fast express campus dispatch.</li>
    <li><strong>Medium Parcel (2 kg to 10 kg):</strong> Home appliances, electronics, audio gear, kitchen equipment.</li>
    <li><strong>Bulky Parcel (10 kg to 30 kg):</strong> Study tables, washing machines, compact refrigerators, TVs.</li>
    <li><strong>Heavy Freight:</strong> Furniture suites and large commercial appliances requiring specialized van transport.</li>
  </ul>

  <h2>3. Delivery Timelines</h2>
  <ul>
    <li><strong>Intra-City & Onitsha Zone:</strong> 24 to 48 hours.</li>
    <li><strong>Regional Campus Delivery (South-East & South-South):</strong> 24 to 48 hours.</li>
    <li><strong>Nationwide Campus Terminals (Lagos, Abuja, West & North):</strong> 48 to 72 hours.</li>
  </ul>

  <h2>4. Campus Pickup Stations</h2>
  <p>In addition to doorstep delivery, Dovi coordinates with verified student campus ambassadors and central campus pickup points (e.g. Student Union buildings, commercial parks) where students can safely collect parcels between lectures.</p>

  <h2>5. Package Inspection Protocol</h2>
  <p>Upon receiving your package, you are entitled to inspect the contents. Once delivered, your <strong>48-hour Dovi Inspection Window</strong> commences, during which your payment remains safely protected in escrow.</p>
"""

with open('frontend/public/shipping.html', 'w', encoding='utf-8') as f:
    f.write(make_page('Shipping & Delivery Policy', 'Fulfillment', shipping_content))
print('Generated frontend/public/shipping.html')

# 5. RETURNS & REFUNDS POLICY
returns_content = """
  <h1>Returns, Refunds & Dispute Policy</h1>
  <p class="tagline">100% Escrow-backed buyer protection on every order.</p>

  <h2>1. The 48-Hour Inspection Guarantee</h2>
  <p>Every buyer on Dovi is protected by our centralized escrow system. From the exact timestamp a parcel is marked as delivered, buyers have <strong>48 hours</strong> to inspect their purchase and verify that it matches the description, functions properly, and arrived undamaged.</p>

  <h2>2. Eligible Reasons for Return & Full Refund</h2>
  <ul>
    <li>The item is defective, faulty, or does not power on.</li>
    <li>The item differs substantially from the specifications or photos displayed on Dovi.</li>
    <li>The wrong size, color, or model was dispatched.</li>
    <li>The parcel arrived physically broken or damaged during transit.</li>
    <li>Counterfeit or unverified goods reported within the inspection period.</li>
  </ul>

  <h2>3. How to Initiate a Return</h2>
  <ol>
    <li>Navigate to your <strong>Order History</strong> in your Dovi account.</li>
    <li>Select the specific order and click <strong>"Request Refund / Open Dispute"</strong>.</li>
    <li>Upload clear photos or a short video demonstrating the issue along with a brief description.</li>
    <li>Dovi's mediation team will review the claim within 12 hours.</li>
  </ol>

  <h2>4. Escrow Refund Disbursement</h2>
  <p>Because the vendor does not hold your funds during the inspection window, approved refunds are processed directly by Dovi. Funds are returned immediately to your Dovi wallet or original bank account within 24 to 48 hours of item return confirmation.</p>
"""

with open('frontend/public/returns.html', 'w', encoding='utf-8') as f:
    f.write(make_page('Returns & Refund Policy', 'Buyer Protection', returns_content))
print('Generated frontend/public/returns.html')

# 6. TERMS OF SERVICE
terms_content = """
  <h1>Terms and Conditions</h1>
  <p class="tagline">Official user terms governing access and transactions on DoviShop.</p>

  <h2>1. Introduction & Acceptance</h2>
  <p>These Terms and Conditions govern your access to and use of <strong>dovishop.com</strong>, operated by Dovi Technologies ("Dovi", "we", "us", or "our"). By registering, accessing, or placing orders on Dovi, you agree to be bound by these Terms.</p>

  <h2>2. The Marketplace Platform</h2>
  <p>Dovi operates a centralized online marketplace that connects verified commercial vendors with student and consumer buyers across Nigeria. Dovi provides payment processing, escrow protection, dispute mediation, and logistics consolidation services.</p>

  <h2>3. Escrow & Payment Security</h2>
  <p>All buyers agree that payments made for orders will be held in Dovi's escrow facility. Release of payment to vendors is contingent upon confirmed delivery and expiration of the 48-hour inspection period without unaddressed disputes.</p>

  <h2>4. User Responsibilities</h2>
  <ul>
    <li>Users must provide accurate, current identity, email, and campus delivery information.</li>
    <li>Users may not engage in fraudulent payment claims, unauthorized dispute openings, or platform circumvention.</li>
    <li>Vendors must ensure all listed products are authentic, accurately represented, and compliant with Nigerian commercial standards.</li>
  </ul>

  <h2>5. Limitation of Liability</h2>
  <p>Dovi resolves order disputes through fair mediation and escrow refund guarantees. Dovi is not liable for indirect, incidental, or consequential damages resulting from third-party vendor delays beyond our reasonable control.</p>
"""

with open('frontend/public/terms.html', 'w', encoding='utf-8') as f:
    f.write(make_page('Terms of Service', 'Legal', terms_content))
print('Generated frontend/public/terms.html')

# 7. PRIVACY POLICY
privacy_content = """
  <h1>Privacy Policy</h1>
  <p class="tagline">How Dovi protects and respects your personal data.</p>

  <h2>1. Information We Collect</h2>
  <p>When you create an account, purchase products, or interact with Dovi, we collect:</p>
  <ul>
    <li>Account details: Name, email address, phone number, and campus affiliation.</li>
    <li>Delivery information: Delivery address, hostel name, campus, state, and recipient contact.</li>
    <li>Transactional data: Order history, escrow transaction records, and communication logs.</li>
  </ul>

  <h2>2. How We Use Your Information</h2>
  <ul>
    <li>To process orders, verify payments, and route deliveries through our logistics network.</li>
    <li>To provide real-time transactional email notifications via Resend and live chat support via Smartsupp.</li>
    <li>To prevent fraudulent transactions and safeguard the campus marketplace community.</li>
  </ul>

  <h2>3. Data Protection & Sharing</h2>
  <p>We do not sell, rent, or trade your personal data. Delivery information is shared only with the assigned logistics carriers solely for parcel dispatch. All payment details are processed under PCI-DSS compliant encryption.</p>

  <h2>4. Your Data Rights</h2>
  <p>You have the right to access, update, or request deletion of your account and personal information at any time by contacting <a href="mailto:privacy@dovishop.com">privacy@dovishop.com</a> or <a href="mailto:support@dovishop.com">support@dovishop.com</a>.</p>
"""

with open('frontend/public/privacy.html', 'w', encoding='utf-8') as f:
    f.write(make_page('Privacy Policy', 'Data Protection', privacy_content))
print('Generated frontend/public/privacy.html')

