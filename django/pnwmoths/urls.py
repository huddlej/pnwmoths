from django.conf.urls.defaults import include, patterns, url
from django.contrib import admin


admin.autodiscover()

urlpatterns = patterns('',
    (r'^cushion/', include('pnwmoths.cushion.urls')),
    (r'^admin/', include(admin.site.urls)),
    #url(r"^contact-us/", contact_us, name="contact-us"),
    url(r'^', include('cms.urls')),
)
