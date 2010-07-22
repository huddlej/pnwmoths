import os, sys
sys.path.append('/home/huddlej/pnwmoths/django')
os.environ['DJANGO_SETTINGS_MODULE'] = 'pnwmoths.settings'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()