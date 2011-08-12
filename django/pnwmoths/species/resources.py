from djangorestframework.resources import ModelResource

from models import Species


class SpeciesResource(ModelResource):
    model = Species
    fields = ("name",)
