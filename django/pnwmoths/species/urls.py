from tastypie.api import Api

from django.conf.urls.defaults import include, patterns, url

from resources import CollectionResource, CountyResource, SpeciesResource, StateResource

data_api = Api(api_name="api")
data_api.register(CollectionResource())
data_api.register(CountyResource())
data_api.register(SpeciesResource())
data_api.register(StateResource())

urlpatterns = patterns('',
    url(r'', include(data_api.urls))
)
