from tastypie.api import Api

from django.conf.urls.defaults import include, patterns, url

from resources import CountyResource, SpeciesResource, StateResource

data_api = Api(api_name="api")
data_api.register(CountyResource())
data_api.register(SpeciesResource())
data_api.register(StateResource())

urlpatterns = patterns('',
    url(r'', include(data_api.urls))
#    url(r'^species/(?P<pk>[^/]+)/$', InstanceModelView.as_view(resource=SpeciesResource)),
)
