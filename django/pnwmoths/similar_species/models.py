from couchdbkit.ext.django import schema


class Similar(schema.Document):
    species = schema.StringProperty()
    similar_species = schema.StringProperty()

    class Meta:
        # CouchDBkit requires an app label to be associated with a schema
        # document.
        app_label = "cushion"
