from django.core.urlresolvers import resolve
from django.http import HttpRequest
import httplib
from tastypie import fields
from tastypie.resources import ModelResource

from models import Collection, County, Species, SpeciesRecord, State


def get_resource_by_url(url, data=None):
    if data is None:
        data = {}

    request = HttpRequest()
    request.method = "GET"
    request.GET.update(data)
    view, args, kwargs = resolve(url)
    kwargs["request"] = request

    response = view(*args, **kwargs)
    if response.status_code == httplib.OK:
        content = response.content
    else:
        content = ""

    return content


class StateResource(ModelResource):
    class Meta:
        queryset = State.objects.all()
        fields = ["code"]
        allowed_methods = ["get"]
        include_resource_uri = False

    def alter_list_data_to_serialize(self, request, data):
        """
        Convert final serialized states to codes.
        """
        return [bundle.data["code"] for bundle in data["objects"]]


class CountyResource(ModelResource):
    state = fields.CharField(attribute="state__code")

    class Meta:
        queryset = County.objects.all()
        fields = ["name", "state"]
        allowed_methods = ["get"]
        include_resource_uri = False

    def alter_list_data_to_serialize(self, request, data):
        """
        Convert final serialized states to codes.
        """
        return ["%(name)s (%(state)s)" % bundle.data
                for bundle in data["objects"]]


class CollectionResource(ModelResource):
    class Meta:
        queryset = Collection.objects.all()
        fields = ["name"]
        allowed_methods = ["get"]
        include_resource_uri = False

    def alter_list_data_to_serialize(self, request, data):
        """
        Convert final serialized states to codes.
        """
        return [bundle.data["name"] for bundle in data["objects"]]


class SpeciesResource(ModelResource):
    class Meta:
        queryset = Species.objects.all()
        fields = ["genus", "species"]
        allowed_methods = ["get"]
        include_resource_uri = False


class SpeciesRecordResource(ModelResource):
    collection = fields.CharField(attribute="collection__name")
    collector = fields.CharField(attribute="collector__name")
    county = fields.CharField(attribute="county__name")
    state = fields.CharField(attribute="state__code")

    class Meta:
        queryset = SpeciesRecord.objects.all()
        allowed_methods = ["get"]
        include_resource_uri = False

    def dehydrate(self, bundle):
        precision = SpeciesRecord.GPS_PRECISION
        bundle.data["precision"] = precision
        bundle.data["latitude"] = round(bundle.data["latitude"], precision)
        bundle.data["longitude"] = round(bundle.data["longitude"], precision)
        return bundle
