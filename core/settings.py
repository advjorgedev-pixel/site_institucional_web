from django.utils.translation import gettext_lazy as _
from pathlib import Path
import os
import environ


BASE_DIR = Path(__file__).resolve().parent.parent


environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

env = environ.Env(
    DEBUG=(bool, False)
)

DEBUG = env('DEBUG')

SECRET_KEY = env('SECRET_KEY')

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')



INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'axes',
    "django.contrib.sitemaps",
    'compressor',
    
    'institucional',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'axes.middleware.AxesMiddleware'
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]

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
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
        {
        'NAME': 'core.validators.UppercaseValidator',
    },
    {
        'NAME': 'core.validators.LowercaseValidator',
    },
    {
        'NAME': 'core.validators.SpecialCharacterValidator',
    },
    {
        'NAME': 'core.validators.NumberValidator',
    },
]


LANGUAGE_CODE = 'pt-br'

LANGUAGES = [
    ("pt-br", _("Português (Brasil)")),
    ("es", _("Español")),
]

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True

LOCALE_PATHS = [BASE_DIR / 'locale']

SESSION_COOKIE_AGE = env.int('SESSION_COOKIE_AGE')
SESSION_SAVE_EVERY_REQUEST = env.bool('SESSION_SAVE_EVERY_REQUEST') 
SESSION_EXPIRE_AT_BROWSER_CLOSE = env.bool('SESSION_EXPIRE_AT_BROWSER_CLOSE') 

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static/')

if DEBUG:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

WHITENOISE_MAX_AGE = 31536000

STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    "compressor.finders.CompressorFinder",
]

COMPRESS_ENABLED = not DEBUG
COMPRESS_OFFLINE = not DEBUG
COMPRESS_URL = STATIC_URL
COMPRESS_ROOT = STATIC_ROOT


AXES_FAILURE_LIMIT = env.int('AXES_FAILURE_LIMIT')
AXES_COOLOFF_TIME = env.int('AXES_COOLOFF_TIME')
AXES_LOCKOUT_TEMPLATE = '403.html'


MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
