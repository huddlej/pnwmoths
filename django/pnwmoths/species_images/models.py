from couchdbkit.ext.django import schema
from cushion.models import CoercedUniqueDocument


class SpeciesImage(CoercedUniqueDocument):
    filename = schema.StringProperty()
    species = schema.StringProperty()
    type = "image"
