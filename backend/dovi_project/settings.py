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

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dovi-production-resend-infrastucture-secret-key-2026')
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 't')
ALLOWED_HOSTS = ['*']

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

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# ============================================================================
# Resend Email Configuration
# ============================================================================
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
MAIL_FROM_ADDRESS = os.environ.get('MAIL_FROM_ADDRESS', 'hello@dovishops.com')
MAIL_FROM_NAME = os.environ.get('MAIL_FROM_NAME', 'Dovi')
MAIL_REPLY_TO = os.environ.get('MAIL_REPLY_TO', 'support@dovishops.com')
APP_URL = os.environ.get('APP_URL', 'https://dovishops.com')
RESEND_WEBHOOK_SECRET = os.environ.get('RESEND_WEBHOOK_SECRET', '')
