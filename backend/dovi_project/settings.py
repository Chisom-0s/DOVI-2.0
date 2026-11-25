import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def _load_env():
    for p in [BASE_DIR / '.env', BASE_DIR.parent / '.env']:
        if p.exists():
            with open(p, 'r', encoding='utf-8') as ef:
                for line in ef:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

_load_env()

DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 't')

# Cryptographic Secret Key Configuration
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'dovi-insecure-dev-key-8f4c2b9a1e7d3c5b9f8a2e1d7c4b6a9e3d2c1b8a'
    else:
        # Use deployment revision or persistent machine secret
        SECRET_KEY = os.environ.get('RENDER_GIT_COMMIT') or 'dovi-prod-vault-92f7a81c3e4b5d6e7f8a9b0c1d2e3f4a'

_raw_hosts = os.environ.get('ALLOWED_HOSTS', '')
if _raw_hosts:
    ALLOWED_HOSTS = [h.strip() for h in _raw_hosts.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'dovishop.com',
        'www.dovishop.com',
        'admin.dovishop.com',
        'dovi-2-0-backend.onrender.com',
        '.onrender.com',
        '.vercel.app',
    ]
    if DEBUG:
        ALLOWED_HOSTS.append('*')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'corsheaders',

    # Dovi applications
    'emails.apps.EmailsConfig',
    'delivery.apps.DeliveryConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'dovi_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dovi_project.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        },
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DATA_UPLOAD_MAX_MEMORY_SIZE = 15 * 1024 * 1024  # 15MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 15 * 1024 * 1024  # 15MB
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================================
# Security & Protection Headers
# ============================================================================
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# ============================================================================
# CORS Access Whitelist
# ============================================================================
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'https://dovishop.com',
    'https://www.dovishop.com',
    'https://admin.dovishop.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
]
_extra_cors = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _extra_cors:
    for origin in _extra_cors.split(','):
        cleaned = origin.strip()
        if cleaned and cleaned not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(cleaned)

CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https:\/\/.*\.vercel\.app$',
    r'^https:\/\/.*\.onrender\.com$',
]

# ============================================================================
# REST Framework Configuration & Authentication
# ============================================================================
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'delivery.authentication.DoviJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'UNICODE_JSON': True,
}

# Standard UTF-8 Text Encoding
DEFAULT_CHARSET = 'utf-8'

# ============================================================================
# Resend Email Configuration
# ============================================================================
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
MAIL_FROM_ADDRESS = os.environ.get('MAIL_FROM_ADDRESS', 'hello@dovishop.com')
MAIL_FROM_NAME = os.environ.get('MAIL_FROM_NAME', 'Dovi')
MAIL_REPLY_TO = os.environ.get('MAIL_REPLY_TO', 'support@dovishop.com')
APP_URL = os.environ.get('APP_URL', 'https://dovishop.com')
RESEND_WEBHOOK_SECRET = os.environ.get('RESEND_WEBHOOK_SECRET', '')
