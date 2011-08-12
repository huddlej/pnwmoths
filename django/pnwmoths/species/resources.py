from tastypie import fields
from tastypie.resources import ModelResource

from models import County, Species, State


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
