from django.conf.urls.defaults import (
    handler404,
    handler500,
    include,
    patterns,
    url
)
from django.http import HttpResponseRedirect
from django.contrib import admin

from species.views import import_species_records, photographic_plate_zoomify
from cms_search.views import FancyRedirectSearchView
from ajax_select import urls as ajax_select_urls

import admin_sentry

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^accounts/login/$', 'django.contrib.auth.views.login', name="login"),
    url(r'^accounts/logout/$', 'django.contrib.auth.views.logout', name="logout"),
    url(r'^admin/species/speciesrecord/import/', import_species_records, name="speciesrecord_import"),
    (r'^admin/import/', include('csvimporter.urls')),
    (r'^admin/lookups/', include(ajax_select_urls)),
    (r'^admin/', include(admin.site.urls)),
    url(r'^search/', FancyRedirectSearchView(), name="search"),
    (r'^identify/lucid_player/help/default.htm$', lambda x: HttpResponseRedirect('/explore-data/about-key/')),
    (r'^photographic-plates/(?P<plate_pk>\d+)/$', 'species.views.photographic_plate_zoomify'),
    (r'^admin_sentry/', include('admin_sentry.urls')),
    url(r'^', include('cms.urls')),
)
