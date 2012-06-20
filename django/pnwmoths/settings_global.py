# Django settings for pnwmoths project.
from db import DATABASE_PASSWORDS
import logging.config
import os


PROJECT_ROOT = os.path.dirname(os.path.realpath(__file__))

# Define gettext for translation in settings.py.
gettext = lambda s: s

DEBUG = False
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    ('John Huddleston', 'john.l.huddleston@gmail.com')
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'NAME': 'pnwmoths',
        'ENGINE': 'django.db.backends.mysql',
        'USER': 'pnwmoths',
        'PASSWORD': DATABASE_PASSWORDS.get("pnwmoths")
    }
}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Los Angeles'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = False

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = '/home/huddlej/pnwmoths/www/media/'

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = 'http://localhost/media/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/admin/'

# Use the file system backend for sessions.
SESSION_ENGINE = "django.contrib.sessions.backends.file"

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.request",
    "django.contrib.messages.context_processors.messages",
    "cms.context_processors.media"
)

MIDDLEWARE_CLASSES = (
    'django.middleware.gzip.GZipMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'cms.middleware.page.CurrentPageMiddleware',
    'cms.middleware.user.CurrentUserMiddleware',
    'cms.middleware.media.PlaceholderMediaMiddleware',
    'cms.middleware.toolbar.ToolbarMiddleware',
    'pnwmoths.middleware.LoginRequiredMiddleware',
)

ROOT_URLCONF = 'pnwmoths.urls'
LOGIN_URL = "/accounts/login/"
LOGIN_REDIRECT_URL = "/"

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(PROJECT_ROOT, 'templates')
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.admin',
    'cms',
    'cms.plugins.text',
    'cms.plugins.picture',
    'cms.plugins.link',
    'cms.plugins.file',
    'cms.plugins.snippet',
    'cms.plugins.googlemap',
    'csv_admin',
    'csvimporter',
    'haystack',
    'menus',
    'mptt',
    'publisher',
    'pnwmoths.cms_search',
    'pnwmoths.species',
    'sorl.thumbnail',
    'south',
    'reversion',
    'ajax_select',
)

CMS_TEMPLATES = (
    ('cms/base.html', gettext('default')),
    ('cms/stub.html', gettext('stub')),
    ('cms/home.html', gettext('home')),
    ('cms/browse.html', gettext('browse')),
    ('cms/factsheet.html', gettext('factsheet')),
)
CMS_SHOW_END_DATE = True
CMS_SHOW_START_DATE = True
LANGUAGES = (
        ('en', gettext('English')),
)

# django-haystack
HAYSTACK_XAPIAN_PATH = os.path.join(PROJECT_ROOT, "site_index")
HAYSTACK_SITECONF = "pnwmoths.search_sites"
HAYSTACK_SEARCH_ENGINE = "xapian"

FILE_UPLOAD_HANDLERS = ("django.core.files.uploadhandler.TemporaryFileUploadHandler",
                        "django.core.files.uploadhandler.MemoryFileUploadHandler")

# csvimporter
#
# Custom setting used to calculate excluded apps with a simpler definition.
CSVIMPORTER_INCLUDE = ["pnwmoths.species"]

# Actual csvimporter settings.
CSVIMPORTER_EXCLUDE = [app.split(".")[-1] for app in INSTALLED_APPS
                       if app not in CSVIMPORTER_INCLUDE]

CSVIMPORTER_DATA_TRANSFORMS = {
    "species.speciesrecord": "pnwmoths.species.views.transform_species_record"
}

# CSV admin settings
CSV_ADMIN_CONTENT_FORMS = {
    ("species", "speciesrecord"): "pnwmoths.species.forms.SpeciesRecordForm"
}
CSV_ADMIN_USE_TRANSACTIONS=False
CSV_ADMIN_TEMPLATE="admin/csv_admin/validate_form.html"


# django-ajax-selects
# define the lookup channels in use on the site
AJAX_LOOKUP_CHANNELS = {
    #   pass a dict with the model and the field to search against
    'SpeciesRecord'  : ('species.ajaxselect_lookups', 'SpeciesRecordLookup')
}
# magically include jqueryUI/js/css
AJAX_SELECT_BOOTSTRAP = True
AJAX_SELECT_INLINES = 'inline'

WYM_CLASSES = ",\n".join([
    "{'name': 'date', 'title': 'PARA: Date', 'expr': 'p'}",
    "{'name': 'hidden-note', 'title': 'PARA: Hidden note', 'expr': 'p[@class!=\"important\"]'}",
    "{'name': 'home_linespacing', 'title': 'PARA: Home LineSpacing', expr: 'p'}"
])

WYM_STYLES = ",\n".join([
    "{'name': '.hidden-note', 'css': 'color: #999; border: 2px solid #ccc;'}",
    "{'name': '.date', 'css': 'background-color: #ff9; border: 2px solid #ee9;'}",
    "{'name': '.home_linespacing', 'css': 'line-spacing: 2em;'}" 
])
