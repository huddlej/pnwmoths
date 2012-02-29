from django.core.urlresolvers import resolve
from django.http import HttpRequest
import httplib
from tastypie import fields
from tastypie.resources import ALL, ALL_WITH_RELATIONS, ModelResource
import itertools

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
        filtering = {"genus": ALL, "species": ALL}


class SpeciesRecordResource(ModelResource):
    collection = fields.CharField(attribute="collection__name", null=True)
    collector = fields.CharField(attribute="collector__name", null=True)
    county = fields.CharField(attribute="county", null=True)
    species = fields.ForeignKey(SpeciesResource, "species")
    state = fields.CharField(attribute="state__code", null=True)

    class Meta:
        queryset = SpeciesRecord.records.all()
        allowed_methods = ["get"]
        excludes = ["id"]
        include_resource_uri = False
        filtering = {"species": ALL_WITH_RELATIONS}

    def dehydrate(self, bundle):
        if isinstance(bundle.data['longitude'], float) and isinstance(bundle.data['latitude'], float):
            precision = SpeciesRecord.GPS_PRECISION
            bundle.data["precision"] = precision
            bundle.data["latitude"] = round(bundle.data["latitude"], precision)
            bundle.data["longitude"] = round(bundle.data["longitude"], precision)
        bundle.data["site_name"] = bundle.data["locality"]

        # Create a sortable date for javascript apps.
        if bundle.data["year"]:
            bundle.data["date"] = "/".join([
                str(bundle.data.get(field, 1))
                for field in ("year", "month", "day")
            ])

        return bundle

    def alter_list_data_to_serialize(self, request, data):
        """
        Convert final serialized states to codes.
        """
        return data["objects"]

class AllCoordsResource(ModelResource):
    """
        Resource accessed at /data/api/allcoords/?format=json
        This resource reduces the number of points by rounding every
        lat/lon pair to 1 decimal place and removing duplicates.
        
        Currently, this is being used to test an "all data points"
        map on the front page.
    """
    class Meta:
        queryset = SpeciesRecord.records.filter(latitude__isnull=False, longitude__isnull=False).values("latitude", "longitude").distinct()
        fields = ["latitude", "longitude"]
        allowed_methods = ["get"]
        include_resource_uri = False

    def alter_list_data_to_serialize(self, request, data):
        vals = list(self.Meta.queryset)
        for d in vals:
            for k in d.keys():
                try:
                    d[k] = "%.1f" % d[k]
                except(TypeError):
                    pass
        s = set([tuple(d.values()) for d in vals])
        data['objects'] = [dict({'latitude': float(e[0]), 'longitude': float(e[1])}) for e in s]
        return data
