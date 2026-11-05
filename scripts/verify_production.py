# -*- coding: utf-8 -*-
"""
Production Verification Script for DOVI Crawler Accessibility & Knowledge Source Retrieval
Using standard library urllib.request
"""
import urllib.request
import urllib.error

BASE_URL = "https://dovishop.com"

test_agents = {
    "SmartsuppMira": "Mozilla/5.0 (compatible; SmartsuppMira/1.0; +https://www.smartsupp.com)",
    "Googlebot": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Bingbot": "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "StandardBrowser": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

def fetch(url, user_agent=None):
    headers = {"User-Agent": user_agent or test_agents["StandardBrowser"]}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode('utf-8', errors='replace')
            return resp.status, resp.headers, content
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8', errors='replace')
        return e.code, e.headers, content
    except Exception as e:
        return 0, {}, str(e)

def verify():
    print("=" * 70)
    print("DOVI PRODUCTION VERIFICATION (https://dovishop.com)")
    print("=" * 70)
    
    # 1. Test robots.txt
    print("\n[1] Testing /robots.txt...")
    status, headers, text = fetch(f"{BASE_URL}/robots.txt")
    ctype = headers.get('Content-Type', '')
    print(f"Status Code: {status}")
    print(f"Content-Type: {ctype}")
    print(f"Length: {len(text)} bytes")
    is_text = "text/plain" in ctype
    has_mira = "SmartsuppMira" in text or "SmartsuppBot" in text
    has_sitemap = "sitemap.xml" in text
    print(f"-> Content-Type text/plain: {'PASS' if is_text else 'FAIL'}")
    print(f"-> Contains Smartsupp rules: {'PASS' if has_mira else 'FAIL'}")
    print(f"-> Points to sitemap.xml: {'PASS' if has_sitemap else 'FAIL'}")

    # 2. Test sitemap.xml
    print("\n[2] Testing /sitemap.xml...")
    status, headers, text = fetch(f"{BASE_URL}/sitemap.xml")
    ctype = headers.get('Content-Type', '')
    print(f"Status Code: {status}")
    print(f"Content-Type: {ctype}")
    print(f"Length: {len(text)} bytes")
    is_xml = "xml" in ctype
    has_urlset = "<urlset" in text
    has_pages = "/about" in text and "/products" in text
    print(f"-> Content-Type XML: {'PASS' if is_xml else 'FAIL'}")
    print(f"-> Valid urlset: {'PASS' if has_urlset else 'FAIL'}")
    print(f"-> Contains key URLs: {'PASS' if has_pages else 'FAIL'}")

    # 3. Test Homepage with various crawlers
    print("\n[3] Testing Homepage Content Ingestion by User-Agents...")
    for agent_name, ua in test_agents.items():
        status, headers, text = fetch(f"{BASE_URL}/", user_agent=ua)
        ctype = headers.get('Content-Type', '')
        has_tagline = "Shop Smart. Feel Good." in text
        has_schema = "application/ld+json" in text
        has_faq = "Frequently Asked Questions" in text or "Escrow" in text
        print(f"\nUser-Agent: {agent_name}")
        print(f"Status: {status} | Bytes: {len(text)} | Content-Type: {ctype}")
        print(f"-> Brand Tagline Found: {'YES' if has_tagline else 'NO'}")
        print(f"-> JSON-LD Structured Data: {'YES' if has_schema else 'NO'}")
        print(f"-> Knowledge & FAQ Text: {'YES' if has_faq else 'NO'}")

    # 4. Test Knowledge Pages
    knowledge_pages = ["/about", "/faq", "/contact", "/shipping", "/returns", "/terms", "/privacy"]
    print("\n[4] Testing Knowledge & Policy Pages...")
    for path in knowledge_pages:
        status, headers, text = fetch(f"{BASE_URL}{path}", user_agent=test_agents["SmartsuppMira"])
        ctype = headers.get('Content-Type', '')[:25]
        print(f"{path:12} -> HTTP {status} | {len(text)} bytes | {ctype}")

if __name__ == "__main__":
    verify()
