# -*- coding: utf-8 -*-
import json
import os
import re

# Read seed products
with open('frontend/src/api/seedProducts.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('[')
end = text.rfind(']') + 1
products = json.loads(text[start:end])
print(f'Loaded {len(products)} products from seedProducts.ts')

# 1. GENERATE ROBOTS.TXT
robots_txt = """# DoviShop Robots.txt (https://dovishop.com)
# Centralized Student Marketplace: Dovi — Shop Smart. Feel Good.

User-agent: *
Allow: /
Allow: /products
Allow: /products/*
Allow: /categories/*
Allow: /about
Allow: /about.html
Allow: /faq
Allow: /faq.html
Allow: /contact
Allow: /contact.html
Allow: /shipping
Allow: /shipping.html
Allow: /returns
Allow: /returns.html
Allow: /terms
Allow: /terms.html
Allow: /privacy
Allow: /privacy.html
Allow: /sitemap.xml

# Protect private account areas, checkout, and admin routes
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /checkout/*
Disallow: /cart
Disallow: /orders/*
Disallow: /dashboard/
Disallow: /dashboard/*
Disallow: /vendor/
Disallow: /vendor/*
Disallow: /login
Disallow: /register
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /verify-email

# Allow legitimate search engines and AI knowledge crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: SmartsuppBot
Allow: /

User-agent: Mira
Allow: /

User-agent: SmartsuppMira
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://dovishop.com/sitemap.xml
Host: https://dovishop.com
"""

with open('frontend/public/robots.txt', 'w', encoding='utf-8', newline='\n') as f:
    f.write(robots_txt.strip() + '\n')
print('Generated frontend/public/robots.txt')

# 2. GENERATE SITEMAP.XML
categories = [
    'fashion-clothing',
    'shoes-footwear',
    'beauty-personal-care',
    'phones-electronics',
    'home-kitchen',
    'furniture-home-decor',
    'watches-accessories',
    'sports-fitness',
    'automotive-motor-accessories',
    'books-stationery',
    'baby-kids',
    'travel-bags',
]

sitemap_xml = ['<?xml version="1.0" encoding="UTF-8"?>']
sitemap_xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

# Core pages
sitemap_xml.append('  <!-- Core Marketplace Pages -->')
sitemap_xml.append('  <url>')
sitemap_xml.append('    <loc>https://dovishop.com/</loc>')
sitemap_xml.append('    <changefreq>daily</changefreq>')
sitemap_xml.append('    <priority>1.0</priority>')
sitemap_xml.append('  </url>')
sitemap_xml.append('  <url>')
sitemap_xml.append('    <loc>https://dovishop.com/products</loc>')
sitemap_xml.append('    <changefreq>daily</changefreq>')
sitemap_xml.append('    <priority>0.9</priority>')
sitemap_xml.append('  </url>')

# Informational Knowledge Pages
sitemap_xml.append('\n  <!-- Knowledge Source & Policy Pages -->')
info_pages = [
    ('about', '0.8', 'monthly'),
    ('faq', '0.8', 'weekly'),
    ('contact', '0.8', 'monthly'),
    ('shipping', '0.8', 'monthly'),
    ('returns', '0.8', 'monthly'),
    ('terms', '0.7', 'monthly'),
    ('privacy', '0.7', 'monthly'),
]
for slug, prio, freq in info_pages:
    sitemap_xml.append('  <url>')
    sitemap_xml.append(f'    <loc>https://dovishop.com/{slug}</loc>')
    sitemap_xml.append(f'    <changefreq>{freq}</changefreq>')
    sitemap_xml.append(f'    <priority>{prio}</priority>')
    sitemap_xml.append('  </url>')

# Category pages
sitemap_xml.append('\n  <!-- Product Category Pages -->')
for cat in categories:
    sitemap_xml.append('  <url>')
    sitemap_xml.append(f'    <loc>https://dovishop.com/categories/{cat}</loc>')
    sitemap_xml.append('    <changefreq>daily</changefreq>')
    sitemap_xml.append('    <priority>0.8</priority>')
    sitemap_xml.append('  </url>')

# Product detail pages
sitemap_xml.append('\n  <!-- Verified Catalog Products -->')
for p in products:
    pid = p['id']
    sitemap_xml.append('  <url>')
    sitemap_xml.append(f'    <loc>https://dovishop.com/products/{pid}</loc>')
    sitemap_xml.append('    <changefreq>weekly</changefreq>')
    sitemap_xml.append('    <priority>0.8</priority>')
    sitemap_xml.append('  </url>')

sitemap_xml.append('</urlset>')

with open('frontend/public/sitemap.xml', 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(sitemap_xml) + '\n')
print(f'Generated frontend/public/sitemap.xml with {2 + len(info_pages) + len(categories) + len(products)} URLs')
