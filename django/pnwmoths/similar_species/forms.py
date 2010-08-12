from couchdbkit.ext.django.forms import DocumentForm
from django import forms

from models import Similar


class SimilarForm(DocumentForm):
    class Meta:
        document = Similar


class BatchSimilarForm(forms.Form):
    """
    Allows a user to batch update similar species relationships for a given
    species.
    """
    similar_species = forms.CharField(widget=forms.Textarea())

    def prepare(self, database, view_path, get_data):
        """
        Prepares initial data for the form using all view documents.

        ``database``: CouchDB database instance
        ``view_path``: Joined design document name and view name
                       (e.g., "ddoc_name/viewname")
        ``get_data``: Dictionary of query parameters passed in the current
                      request
        """
        self.database = database

        if "key" in get_data:
            self.key = get_data.get("key")

            get_data["include_docs"] = True
            self.all_docs = list(self.database.view(
                view_path,
                **get_data
            ))
            similar_species = "\n".join(
                [doc["value"] for doc in self.all_docs
                 if isinstance(doc["value"], basestring)]
            )
            self.initial = {"similar_species": similar_species}

    def process(self):
        """
        Processes POSTed form data by updating all related documents.
        """
        # Delete all existing documents.
        docs = []
        for doc in self.all_docs:
            doc["doc"]["_deleted"] = True
            docs.append(doc["doc"])

        # Add documents for each row of the POST data.
        docs.extend([{"species": self.key, "similar_species": similar_species.strip()}
                     for similar_species in self.cleaned_data["similar_species"].split("\n")
                     if similar_species.strip()])

        self.database.bulk_save(docs)
        return docs
