import requests

urls = [
    'http://dovishop.com',
    'http://www.dovishop.com',
    'https://dovishop.com',
    'https://www.dovishop.com',
    'https://dovishop.com/robots.txt',
    'https://dovishop.com/sitemap.xml',
    'https://www.dovishop.com/robots.txt',
    'https://www.dovishop.com/sitemap.xml',
]

user_agents = {
    'Default requests': 'python-requests/2.31.0',
    'Chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Googlebot': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Bingbot': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'SmartsuppBot': 'SmartsuppBot/1.0 (+https://www.smartsupp.com)',
    'SmartsuppMira': 'Mira/1.0 (Smartsupp AI crawler)',
    'GPTBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)',
}

print('=== 1. REDIRECT CHAINS & STATUS CODES ===')
for u in urls:
    try:
        r = requests.get(u, allow_redirects=False, timeout=10)
        loc = r.headers.get('Location', '')
        print(f'{u} -> {r.status_code} (Location: {loc})')
        if r.is_redirect:
            r_full = requests.get(u, timeout=10)
            history = [f'{h.url} ({h.status_code})' for h in r_full.history]
            print(f'   Chain: {" -> ".join(history + [f"{r_full.url} ({r_full.status_code})"])}')
    except Exception as e:
        print(f'{u} -> ERROR: {e}')

print('\n=== 2. USER AGENT TESTS (https://dovishop.com) ===')
target = 'https://dovishop.com'
for name, ua in user_agents.items():
    try:
        r = requests.get(target, headers={'User-Agent': ua}, timeout=10)
        print(f'{name}: Status {r.status_code}, Length {len(r.content)}, Server: {r.headers.get("Server")}, Content-Type: {r.headers.get("Content-Type")}')
        print(f'   Headers: x-vercel-id: {r.headers.get("x-vercel-id")}, cache: {r.headers.get("x-vercel-cache")}, robots: {r.headers.get("x-robots-tag")}')
    except Exception as e:
        print(f'{name} -> ERROR: {e}')

print('\n=== 3. HTML CONTENT ANALYSIS ===')
r = requests.get('https://dovishop.com', headers={'User-Agent': user_agents['Googlebot']})
print('Full HTML Length:', len(r.text))
print('HTML Head snippet:')
print(r.text[:800])
print('---')
print('HTML Body snippet:')
print(r.text[800:2000])

