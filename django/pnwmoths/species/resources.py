from django.core.urlresolvers import resolve
from django.http import HttpRequest
import httplib
from tastypie import fields
from tastypie.resources import ModelResource

from models import County, Species, State


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


class CountyResource(ModelResource):
    state = fields.ForeignKey(StateResource, "state", full=True)

    class Meta:
        queryset = County.objects.all()
        allowed_methods = ["get"]


class SpeciesResource(ModelResource):
    class Meta:
        queryset = Species.objects.all()
        fields = ["genus", "species"]
        allowed_methods = ["get"]
