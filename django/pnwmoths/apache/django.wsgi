import os, sys
sys.path.append('/home/huddlej/django')
os.environ['DJANGO_SETTINGS_MODULE'] = 'kexp.settings'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()