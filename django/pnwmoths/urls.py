from django.conf.urls.defaults import (
    handler404,
    handler500,
    include,
    patterns,
    url
)
from django.contrib import admin

from species.views import import_species_records

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^accounts/login/$', 'django.contrib.auth.views.login', name="login"),
    url(r'^accounts/logout/$', 'django.contrib.auth.views.logout', name="logout"),
    url(r'^admin/species/speciesrecord/import/', import_species_records, name="speciesrecord_import"),
    url(r'^data/', include('pnwmoths.species.urls')),
    (r'^admin/import/', include('csvimporter.urls')),
    (r'^admin/', include(admin.site.urls)),
    url(r'^search/', include('haystack.urls'), name="search"),
    #url(r"^contact-us/", contact_us, name="contact-us"),
    url(r'^', include('cms.urls')),
)
