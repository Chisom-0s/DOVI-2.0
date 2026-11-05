# -*- coding: utf-8 -*-
"""
Generate complete index.html for DOVI with:
1. Full SEO metadata, Open Graph, Twitter Cards, Canonical link
2. Schema.org JSON-LD Structured Data (WebSite, OnlineStore, ItemList, FAQPage)
3. Rich, crawlable semantic HTML inside <div id="root"> so AI agents (Smartsupp Mira, Gemini, Googlebot, Bingbot)
   can immediately ingest all business information, catalog products, categories, FAQs, and policies without requiring JS.
"""
import json
import re

# Read seed products
with open('frontend/src/api/seedProducts.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('[')
end = text.rfind(']') + 1
products = json.loads(text[start:end])

def clean_desc(desc):
    if not desc:
        return ""
    # strip HTML comments like <!-- DOVI_SPECS: ... -->
    desc = re.sub(r'<!--.*?-->', '', desc, flags=re.DOTALL)
    return desc.strip()

categories = [
    {"name": "Fashion & Clothing", "slug": "fashion-clothing", "icon": "👗"},
    {"name": "Shoes & Footwear", "slug": "shoes-footwear", "icon": "👟"},
    {"name": "Phones, Tablets & Gadgets", "slug": "phones-tablets-gadgets", "icon": "📱"},
    {"name": "Computing & Accessories", "slug": "computing-accessories", "icon": "💻"},
    {"name": "Electronics & Appliances", "slug": "electronics-appliances", "icon": "⚡"},
    {"name": "Campus & Student Essentials", "slug": "campus-student-essentials", "icon": "🎒"},
    {"name": "Beauty, Health & Personal Care", "slug": "beauty-health-personal-care", "icon": "💄"},
    {"name": "Furniture & Home Decor", "slug": "furniture-home-decor", "icon": "🛋️"},
    {"name": "Groceries & Packaged Food", "slug": "groceries-packaged-food", "icon": "🛒"},
    {"name": "Sports, Fitness & Outdoors", "slug": "sports-fitness-outdoors", "icon": "⚽"},
    {"name": "Books, Stationery & Art", "slug": "books-stationery-art", "icon": "📚"},
    {"name": "Auto Parts & Accessories", "slug": "auto-parts-accessories", "icon": "🚗"}
]

# Build JSON-LD structured data
faq_items = [
    {
        "q": "What is Dovi?",
        "a": "Dovi (https://dovishop.com) is Nigeria's premier centralized student and campus marketplace, operating under the brand tagline 'Dovi — Shop Smart. Feel Good.' We connect verified vendors and student buyers with 100% escrow buyer protection, zero-interest Save2Own micro-installments, and fast campus fulfillment."
    },
    {
        "q": "How does Dovi Escrow Buyer Protection work?",
        "a": "When you pay for an order on Dovi, your payment is held securely in our centralized escrow account. The vendor only receives payment after the package arrives, is inspected at our hub or delivery point, and you have confirmed satisfaction within the 48-hour inspection period. If the item is defective or not as described, your payment is promptly refunded."
    },
    {
        "q": "What is Save2Own on Dovi?",
        "a": "Save2Own is Dovi's zero-interest micro-installment savings program designed for students. It allows you to lock in the price of essential items (such as laptops, smartphones, home electronics, and course equipment) and pay in flexible daily, weekly, or monthly installments. Once fully funded, the product is dispatched directly to your campus."
    },
    {
        "q": "How does shipping and campus delivery work?",
        "a": "Dovi operates a centralized fulfillment model with its primary consolidation hub in Onitsha, Anambra State. Small parcels and electronics arrive at campus delivery hubs within 24 to 72 hours, while standard regional parcels typically take 2 to 5 business days. Real-time tracking is provided for every order."
    },
    {
        "q": "What is the return and refund policy?",
        "a": "Buyers enjoy a 48-hour inspection window upon package receipt. If an item arrives damaged, defective, or incorrect, you can initiate a return through your Dovi dashboard or by emailing support@dovishop.com. Returned items are inspected at our hub, and approved refunds are credited back via your original payment method or Dovi wallet."
    },
    {
        "q": "How do I contact Dovi customer support?",
        "a": "You can reach Dovi Customer Care by email at hello@dovishop.com or support@dovishop.com, through our website live chat powered by Smartsupp at https://dovishop.com, or via our customer support hotline during business hours (Monday to Saturday, 8:00 AM – 8:00 PM WAT)."
    },
    {
        "q": "Can students and vendors sell their products on Dovi?",
        "a": "Yes! Dovi welcomes verified independent merchants, brand distributors, and student entrepreneurs. Vendors undergo identity and store verification, list products in accordance with our quality guidelines, and receive automated weekly payouts once deliveries are confirmed."
    }
]

schema_org = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": "https://dovishop.com/#website",
            "url": "https://dovishop.com/",
            "name": "Dovi",
            "description": "Dovi — Shop Smart. Feel Good. Nigeria's premier student-focused marketplace.",
            "publisher": {"@id": "https://dovishop.com/#organization"},
            "potentialAction": [
                {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://dovishop.com/products?search={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                }
            ]
        },
        {
            "@type": "Organization",
            "@id": "https://dovishop.com/#organization",
            "name": "Dovi Technologies",
            "alternateName": "Dovi",
            "url": "https://dovishop.com/",
            "logo": "https://dovishop.com/logo.jpg",
            "slogan": "Shop Smart. Feel Good.",
            "description": "Centralized student-focused marketplace in Nigeria offering electronics, gadgets, fashion, and home goods with escrow buyer protection and Save2Own micro-installments.",
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "telephone": "+234-800-3684-7467",
                    "contactType": "customer service",
                    "email": "support@dovishop.com",
                    "availableLanguage": ["English"]
                }
            ],
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Central Logistics Hub",
                "addressLocality": "Onitsha",
                "addressRegion": "Anambra",
                "addressCountry": "NG"
            }
        },
        {
            "@type": "OnlineStore",
            "@id": "https://dovishop.com/#store",
            "name": "Dovi Marketplace",
            "url": "https://dovishop.com/",
            "image": "https://dovishop.com/logo.jpg",
            "priceRange": "₦1,500 - ₦500,000",
            "currenciesAccepted": "NGN",
            "paymentAccepted": "Credit Card, Debit Card, Bank Transfer, Save2Own Installments",
            "parentOrganization": {"@id": "https://dovishop.com/#organization"}
        },
        {
            "@type": "FAQPage",
            "@id": "https://dovishop.com/#faq",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": item["q"],
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": item["a"]
                    }
                }
                for item in faq_items
            ]
        },
        {
            "@type": "ItemList",
            "@id": "https://dovishop.com/#featured-products",
            "name": "Featured Products on Dovi",
            "numberOfItems": len(products),
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": idx + 1,
                    "item": {
                        "@type": "Product",
                        "name": p["name"],
                        "url": f"https://dovishop.com/products/{p['id']}",
                        "image": p.get("primary_image_url") or "https://dovishop.com/logo.jpg",
                        "description": clean_desc(p.get("description", "")) or p["name"],
                        "offers": {
                            "@type": "Offer",
                            "priceCurrency": "NGN",
                            "price": p["base_price"],
                            "availability": "https://schema.org/InStock",
                            "seller": {
                                "@type": "Organization",
                                "name": p.get("vendor_name", "Dovi Official Store")
                            }
                        }
                    }
                }
                for idx, p in enumerate(products[:12])
            ]
        }
    ]
}

# Generate product cards for static HTML fallback
product_cards_html = []
for p in products:
    price_formatted = f"₦{float(p['base_price']):,.2f}"
    img_url = p.get('primary_image_url') or '/logo.jpg'
    cat = p.get('category_name') or 'Marketplace'
    vendor = p.get('vendor_name') or 'Verified Vendor'
    desc = clean_desc(p.get('description', ''))[:110]
    if len(desc) == 110:
        desc += "..."
    product_cards_html.append(f"""
      <article class="static-product-card">
        <a href="/products/{p['id']}" class="product-link">
          <div class="product-img-wrap">
            <img src="{img_url}" alt="{p['name']}" loading="lazy" width="220" height="220" />
            <span class="badge-escrow">100% Escrow</span>
          </div>
          <div class="product-info">
            <span class="product-cat">{cat}</span>
            <h3 class="product-name">{p['name']}</h3>
            {f'<p class="product-desc">{desc}</p>' if desc else ''}
            <div class="product-price-row">
              <span class="product-price">{price_formatted}</span>
              <span class="vendor-tag">{vendor}</span>
            </div>
          </div>
        </a>
      </article>
    """)

categories_html = []
for c in categories:
    categories_html.append(f"""
      <a href="/categories/{c['slug']}" class="static-cat-pill">
        <span class="cat-icon">{c['icon']}</span>
        <span class="cat-name">{c['name']}</span>
      </a>
    """)

faq_html = []
for item in faq_items:
    faq_html.append(f"""
      <div class="static-faq-card">
        <h3 class="faq-question">{item['q']}</h3>
        <p class="faq-answer">{item['a']}</p>
      </div>
    """)

index_html_content = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dovi — Shop Smart. Feel Good. | Student Marketplace Nigeria</title>
    
    <!-- Canonical & Standard SEO -->
    <link rel="canonical" href="https://dovishop.com/" />
    <meta name="description" content="Dovi (https://dovishop.com) — Shop Smart. Feel Good. Nigeria's premier student-focused marketplace. Shop laptops, smartphones, fashion, electronics, and campus essentials with 100% Escrow Buyer Protection, Save2Own zero-interest micro-installments, and fast campus delivery." />
    <meta name="keywords" content="Dovi, Dovishop, student marketplace, Nigeria campus shopping, buy laptop student Nigeria, Save2Own, student installments, escrow protection, UNILAG, UNN, OAU, UNIZIK, campus delivery" />
    <meta name="author" content="Dovi Technologies" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <meta name="theme-color" content="#ff7a00" />
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:site_name" content="Dovi" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://dovishop.com/" />
    <meta property="og:title" content="Dovi — Shop Smart. Feel Good. | Student Marketplace Nigeria" />
    <meta property="og:description" content="Shop smarter with 100% Escrow Buyer Protection, Save2Own zero-interest micro-installments, and fast campus fulfillment across Nigeria." />
    <meta property="og:image" content="https://dovishop.com/logo.jpg" />
    <meta property="og:locale" content="en_NG" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@dovishop" />
    <meta name="twitter:title" content="Dovi — Shop Smart. Feel Good." />
    <meta name="twitter:description" content="Nigeria's premier student-focused marketplace with Escrow protection and Save2Own." />
    <meta name="twitter:image" content="https://dovishop.com/logo.jpg" />

    <!-- Favicon & PWA -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="192x192" href="/logo-192.png" />
    <link rel="apple-touch-icon" href="/logo-192.png" />
    <link rel="manifest" href="/manifest.json" />

    <!-- Performance & Preconnects -->
    <link rel="preconnect" href="https://dovi-2-0-backend.onrender.com" crossorigin />
    <link rel="dns-prefetch" href="https://dovi-2-0-backend.onrender.com" />
    <link rel="preconnect" href="https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev" crossorigin />
    <link rel="dns-prefetch" href="https://pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev" />
    <link rel="preconnect" href="https://www.smartsuppchat.com" crossorigin />
    <link rel="dns-prefetch" href="https://www.smartsuppchat.com" />

    <!-- Schema.org JSON-LD Structured Data for Crawlers & AI -->
    <script type="application/ld+json">
{json.dumps(schema_org, indent=2, ensure_ascii=False)}
    </script>

    <!-- Fallback Styling for Non-JS Crawlers & Pre-Hydration First Paint -->
    <style>
      :root {{
        --dovi-orange: #ff7a00;
        --dovi-orange-dark: #e56e00;
        --dovi-dark: #111827;
        --dovi-gray: #4b5563;
        --dovi-light-gray: #f3f4f6;
        --dovi-border: #e5e7eb;
      }}
      body {{
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: var(--dovi-dark);
        background-color: #fafafa;
        line-height: 1.5;
      }}
      .static-header {{
        background: #ffffff;
        border-bottom: 1px solid var(--dovi-border);
        padding: 0.85rem 1.25rem;
        position: sticky;
        top: 0;
        z-index: 50;
      }}
      .static-header-inner {{
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }}
      .static-logo {{
        display: flex;
        align-items: center;
        gap: 0.6rem;
        text-decoration: none;
        color: var(--dovi-dark);
        font-weight: 800;
        font-size: 1.35rem;
      }}
      .static-logo img {{
        width: 38px;
        height: 38px;
        border-radius: 8px;
        object-fit: cover;
      }}
      .static-nav {{
        display: flex;
        gap: 1.25rem;
        list-style: none;
        margin: 0;
        padding: 0;
        align-items: center;
      }}
      .static-nav a {{
        color: var(--dovi-gray);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
      }}
      .static-nav a:hover {{ color: var(--dovi-orange); }}
      .static-hero {{
        background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        border-bottom: 1px solid #fed7aa;
        padding: 3.5rem 1.5rem;
        text-align: center;
      }}
      .static-hero h1 {{
        font-size: clamp(1.8rem, 4vw, 2.75rem);
        font-weight: 800;
        color: #9a3412;
        margin-bottom: 0.75rem;
        line-height: 1.2;
      }}
      .static-hero p {{
        font-size: clamp(1rem, 2vw, 1.2rem);
        color: #7c2d12;
        max-width: 780px;
        margin: 0 auto 1.5rem;
      }}
      .static-hero-badges {{
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
      }}
      .static-badge {{
        background: #ffffff;
        color: #c2410c;
        border: 1px solid #fdba74;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }}
      .static-container {{
        max-width: 1200px;
        margin: 2.5rem auto;
        padding: 0 1.25rem;
      }}
      .static-section-title {{
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--dovi-dark);
        margin-bottom: 0.4rem;
      }}
      .static-section-sub {{
        color: var(--dovi-gray);
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
      }}
      .static-cat-grid {{
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 3rem;
      }}
      .static-cat-pill {{
        background: #ffffff;
        border: 1px solid var(--dovi-border);
        border-radius: 9999px;
        padding: 0.5rem 1rem;
        text-decoration: none;
        color: var(--dovi-dark);
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
      }}
      .static-product-grid {{
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1.25rem;
        margin-bottom: 3.5rem;
      }}
      .static-product-card {{
        background: #ffffff;
        border: 1px solid var(--dovi-border);
        border-radius: 12px;
        overflow: hidden;
        transition: transform 0.15s, box-shadow 0.15s;
      }}
      .product-link {{
        text-decoration: none;
        color: inherit;
        display: flex;
        flex-direction: column;
        height: 100%;
      }}
      .product-img-wrap {{
        position: relative;
        width: 100%;
        padding-top: 100%;
        background: #f9fafb;
      }}
      .product-img-wrap img {{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }}
      .badge-escrow {{
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(17, 24, 39, 0.85);
        color: #ffffff;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 4px;
      }}
      .product-info {{
        padding: 1rem;
        display: flex;
        flex-direction: column;
        flex: 1;
      }}
      .product-cat {{
        font-size: 0.75rem;
        color: var(--dovi-orange);
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }}
      .product-name {{
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--dovi-dark);
        margin: 0 0 0.5rem;
        line-height: 1.35;
      }}
      .product-desc {{
        font-size: 0.825rem;
        color: var(--dovi-gray);
        margin: 0 0 0.75rem;
        line-height: 1.4;
      }}
      .product-price-row {{
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }}
      .product-price {{
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--dovi-dark);
      }}
      .vendor-tag {{
        font-size: 0.75rem;
        color: #6b7280;
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
      }}
      .static-value-props {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3.5rem;
      }}
      .value-prop-card {{
        background: #ffffff;
        border: 1px solid var(--dovi-border);
        border-radius: 12px;
        padding: 1.75rem;
      }}
      .value-prop-card h3 {{
        color: #111827;
        font-size: 1.15rem;
        margin: 0.5rem 0;
      }}
      .value-prop-card p {{
        color: #4b5563;
        font-size: 0.9rem;
        margin: 0;
      }}
      .static-faq-grid {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.25rem;
        margin-bottom: 3.5rem;
      }}
      .static-faq-card {{
        background: #ffffff;
        border: 1px solid var(--dovi-border);
        border-radius: 10px;
        padding: 1.25rem;
      }}
      .faq-question {{
        font-size: 1rem;
        font-weight: 700;
        color: var(--dovi-dark);
        margin: 0 0 0.5rem;
      }}
      .faq-answer {{
        font-size: 0.875rem;
        color: var(--dovi-gray);
        margin: 0;
        line-height: 1.55;
      }}
      .static-footer {{
        background: #111827;
        color: #d1d5db;
        padding: 3rem 1.25rem 2rem;
        margin-top: 4rem;
      }}
      .static-footer-inner {{
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
      }}
      .footer-col h4 {{
        color: #ffffff;
        font-size: 1rem;
        margin: 0 0 1rem;
      }}
      .footer-col ul {{
        list-style: none;
        padding: 0;
        margin: 0;
      }}
      .footer-col li {{
        margin-bottom: 0.5rem;
      }}
      .footer-col a {{
        color: #9ca3af;
        text-decoration: none;
        font-size: 0.875rem;
      }}
      .footer-col a:hover {{ color: var(--dovi-orange); }}
      .footer-bottom {{
        max-width: 1200px;
        margin: 0 auto;
        padding-top: 1.5rem;
        border-top: 1px solid #374151;
        text-align: center;
        font-size: 0.825rem;
        color: #9ca3af;
      }}
    </style>
  </head>
  <body>
    <!-- 
      Crawlable Semantic HTML Root:
      Contains full business knowledge, verified products, categories, FAQs, and policies.
      Crawlable by Smartsupp Mira AI, Googlebot, Bingbot, and Gemini.
      Replaced seamlessly by React upon client-side application mount.
    -->
    <div id="root">
      <!-- Fallback Header -->
      <header class="static-header">
        <div class="static-header-inner">
          <a href="/" class="static-logo">
            <img src="/logo.jpg" alt="Dovi Marketplace Logo" width="38" height="38" />
            <span>DOVI</span>
          </a>
          <nav>
            <ul class="static-nav">
              <li><a href="/">Home</a></li>
              <li><a href="/products">All Products</a></li>
              <li><a href="/about">About Dovi</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/shipping">Shipping Policy</a></li>
              <li><a href="/returns">Returns Policy</a></li>
              <li><a href="/contact">Contact Support</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="static-hero">
        <h1>Dovi — Shop Smart. Feel Good.</h1>
        <p>The centralized campus marketplace built for Nigerian students. Shop authentic phones, laptops, electronics, fashion, and everyday essentials with 100% Escrow Buyer Protection, Save2Own zero-interest micro-installments, and fast campus fulfillment.</p>
        <div class="static-hero-badges">
          <span class="static-badge">🛡️ 100% Escrow Protection</span>
          <span class="static-badge">💰 Save2Own Zero-Interest Installments</span>
          <span class="static-badge">🚚 Fast Campus Delivery & Onitsha Hub</span>
          <span class="static-badge">✅ Verified Vendors & Students</span>
        </div>
      </section>

      <main class="static-container">
        <!-- Categories -->
        <section>
          <h2 class="static-section-title">Explore Official Marketplace Categories</h2>
          <p class="static-section-sub">Browse top-quality items curated across 12 official campus departments.</p>
          <div class="static-cat-grid">
            {''.join(categories_html)}
          </div>
        </section>

        <!-- Live Products Grid -->
        <section>
          <h2 class="static-section-title">Verified Marketplace Catalog</h2>
          <p class="static-section-sub">Shop brand new and verified quality products backed by 48-hour buyer inspection guarantees.</p>
          <div class="static-product-grid">
            {''.join(product_cards_html)}
          </div>
        </section>

        <!-- Why Choose Dovi (Knowledge Section) -->
        <section>
          <h2 class="static-section-title">The Dovi Difference</h2>
          <p class="static-section-sub">How our centralized marketplace infrastructure protects buyers and empowers merchants.</p>
          <div class="static-value-props">
            <div class="value-prop-card">
              <span style="font-size: 2rem;">🛡️</span>
              <h3>100% Escrow Buyer Protection</h3>
              <p>Your money is safe with Dovi. When you order, funds remain in escrow and are only released to the vendor after you inspect and accept your package within the 48-hour inspection period.</p>
            </div>
            <div class="value-prop-card">
              <span style="font-size: 2rem;">💰</span>
              <h3>Save2Own Micro-Installments</h3>
              <p>Achieve your gadget and campus goals without financial stress. Lock in guaranteed product prices and pay in flexible daily or weekly installments with 0% interest and 0 hidden fees.</p>
            </div>
            <div class="value-prop-card">
              <span style="font-size: 2rem;">🚚</span>
              <h3>Onitsha Hub & Campus Logistics</h3>
              <p>All items pass through our centralized Onitsha Logistics Hub for physical quality checks and multi-vendor parcel consolidation, reducing shipping fees and preventing fake goods.</p>
            </div>
          </div>
        </section>

        <!-- Frequently Asked Questions (Knowledge Ingestion for Mira AI) -->
        <section>
          <h2 class="static-section-title">Frequently Asked Questions</h2>
          <p class="static-section-sub">Instant answers to everything you need to know about shopping, delivery, and payments on Dovi.</p>
          <div class="static-faq-grid">
            {''.join(faq_html)}
          </div>
        </section>
      </main>

      <!-- Static Footer -->
      <footer class="static-footer">
        <div class="static-footer-inner">
          <div class="footer-col">
            <h4>Dovi Marketplace</h4>
            <p style="font-size: 0.875rem; color: #9ca3af; line-height: 1.6;">
              Dovi — Shop Smart. Feel Good.<br />
              Nigeria's premier student-focused centralized marketplace.<br />
              Operating from the Central Logistics Hub in Onitsha, Anambra State, Nigeria.
            </p>
          </div>
          <div class="footer-col">
            <h4>Customer Support</h4>
            <ul>
              <li><a href="/contact">Contact Support</a></li>
              <li><a href="/faq">Help Center & FAQ</a></li>
              <li><a href="/shipping">Shipping & Delivery Rates</a></li>
              <li><a href="/returns">Returns & Refunds (48-Hr)</a></li>
              <li>Email: <a href="mailto:hello@dovishop.com">hello@dovishop.com</a></li>
              <li>Support: <a href="mailto:support@dovishop.com">support@dovishop.com</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Legal & Trust</h4>
            <ul>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/about">About Dovi Technologies</a></li>
              <li>100% Escrow Guarantee</li>
              <li>Verified Vendor Program</li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Top Categories</h4>
            <ul>
              <li><a href="/categories/phones-tablets-gadgets">Phones & Gadgets</a></li>
              <li><a href="/categories/computing-accessories">Laptops & Computing</a></li>
              <li><a href="/categories/electronics-appliances">Electronics & Appliances</a></li>
              <li><a href="/categories/fashion-clothing">Fashion & Apparel</a></li>
              <li><a href="/categories/shoes-footwear">Shoes & Footwear</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 Dovi Technologies. A product of Malc Nexus Technologies Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>

    <!-- React Application Entry Point -->
    <script type="module" src="/src/main.tsx"></script>

    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {{
        window.addEventListener('load', () => {{
          navigator.serviceWorker.register('/sw.js')
            .then((reg) => {{
              console.log('Service Worker registered:', reg.scope);
              reg.update();
            }})
            .catch((err) => console.error('Service Worker registration failed:', err));
        }});
      }}
    </script>

    <!-- Smartsupp Live Chat script -->
    <script type="text/javascript">
      var _smartsupp = _smartsupp || {{}};
      _smartsupp.key = 'e9146c760832a54792657588a0c209aa694d26da';
      window.smartsupp||(function(d) {{
        var s,c,o=smartsupp=function(){{ o._.push(arguments)}};o._=[];
        s=d.getElementsByTagName('script')[0];c=d.createElement('script');
        c.type='text/javascript';c.charset='utf-8';c.async=true;
        c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
      }})(document);
    </script>
    <noscript>Powered by <a href="https://www.smartsupp.com" target="_blank" rel="noopener noreferrer">Smartsupp</a></noscript>
  </body>
</html>
"""

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(index_html_content.strip())

print(f"Generated frontend/index.html ({len(index_html_content)} bytes)")

