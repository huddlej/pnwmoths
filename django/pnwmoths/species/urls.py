from django.conf.urls.defaults import patterns, url
from djangorestframework.views import ListOrCreateModelView, InstanceModelView

from resources import SpeciesResource


urlpatterns = patterns('',
    url(r'^species/$', ListOrCreateModelView.as_view(resource=SpeciesResource)),
    url(r'^species/(?P<pk>[^/]+)/$', InstanceModelView.as_view(resource=SpeciesResource)),
)
