from django import forms

from models import SpeciesRecord

registered_models = {"SpeciesRecord": SpeciesRecord}

class ImportSpeciesRecordsForm(forms.Form):
    """
    Imports the uploaded file of data into the selected database.
    """
    MODEL_CHOICES = [("", "-- Select a model --")]
    MODEL_CHOICES.extend([(name, name) for name, model in registered_models.items()])
    DELIMITER_CHOICES = (("comma", "comma (,)"),
                         ("tab", "tab (\\t)"),
                         ("space", "space ( )"))
    DELIMITER_STRING_MAP = {"comma": ',',
                            "tab": '\t',
                            "space": ' '}
    file = forms.FileField(label="Select a data file:")
    model = forms.ChoiceField(choices=MODEL_CHOICES, required=False)
    overwrite = forms.BooleanField(label="Overwrite existing records", required=False)
    skip_duplicates = forms.BooleanField(
        required=False,
        label="Skip duplicates in the new data set"
    )
    delimiter = forms.ChoiceField(
        choices=DELIMITER_CHOICES,
        help_text="Optional delimiter for CSV records.",
        required=False,
    )

    def clean_delimiter(self):
        return self.DELIMITER_STRING_MAP[self.cleaned_data["delimiter"]]

    def import_data(self, database, file):
        """
        Parses the given file object as a CSV file and adds the contents to the
        given database using the first row as attribute names for each column.
        """
        reader = csv.reader(file, delimiter=self.cleaned_data["delimiter"])
        errors = []
        docs = []

        # Get all non-empty column names using the first row of the data.
        column_names = [column.strip()
                        for column in reader.next()
                        if column.strip()]

        for row in reader:
            column_range = xrange(min(len(column_names), len(row)))

            # Map row values to corresponding column names.
            doc = dict([(column_names[i], row[i])
                        for i in column_range
                        if len(row[i]) > 0])

            if self.cleaned_data["model"]:
                model = registered_models.get(self.cleaned_data["model"])
                try:
                    doc = model.coerce(doc)
                    doc = model(**doc)
                    # doc["type"] = self.cleaned_data["model"].lower()
                    docs.append(doc)
                except ValueError, e:
                    errors.append((doc, traceback.format_exc()))
            else:
                docs.append(doc)

        # Only try to save documents if there weren't any errors.
        if len(errors) == 0:
            # Check for existing documents with the same ids as the imported
            # documents.
            keys = [doc.get_id for doc in docs if getattr(doc, "get_id", None)]
            existing_docs = self.existing_docs(database, keys, docs)

            if len(existing_docs) > 0:
                if self.cleaned_data["overwrite"]:
                    # If the user approved document overwriting, update each
                    # document of imported data to the current revision of that
                    # document in the database.
                    docs = existing_docs
                else:
                    # If the user didn't approve document overwriting, return an
                    # error list for the conflicting documents.
                    errors = [(existing_doc, "Document already exists.")
                              for existing_doc in existing_docs]

            if len(errors) == 0:
                try:
                    database.bulk_save([getattr(doc, "_doc", None) or doc
                                        for doc in docs])
                except BulkSaveError, e:
                    if not self.cleaned_data["skip_duplicates"]:
                        # Show the difference between apparently duplicated
                        # records.
                        keys = set([error["id"] for error in e.errors])
                        docs_by_id = {}
                        for doc in docs:
                            doc_id = doc._doc["_id"]
                            if doc_id in keys:
                                docs_by_id.setdefault(doc_id, []).append(doc._doc)

                        for key in keys:
                            if key in docs_by_id:
                                errors.append((
                                    self.diff_docs(docs_by_id[key][0], docs_by_id[key][1]),
                                    "Duplicate document; differences between documents shown."
                                ))

        return errors

    def diff_docs(self, doc_a, doc_b):
        """
        Return a unified diff of the given docs' string representations.
        """
        return "\n".join(
            list(
                difflib.unified_diff(
                    pprint.pformat(doc_a).split("\n"),
                    pprint.pformat(doc_b).split("\n"),
                    lineterm=""
                )
            )
        )

    def existing_docs(self, database, ids, docs=None):
        existing_docs = database.documents(keys=ids)
        existing_docs = filter(lambda x: "error" not in x, existing_docs)

        # If no documents are given to manipulate, return the documents fetched
        # from the database. If documents are given and exist in the database,
        # update given documents with the revisions of the documents in the
        # database. Otherwise there is nothing to do.
        if docs is None:
            docs = existing_docs
        elif len(existing_docs) > 0:
            revisions_by_id = dict([(doc["id"], doc["value"]["rev"])
                                    for doc in existing_docs])
            for doc in docs:
                if "_id" in doc and doc["_id"] in revisions_by_id:
                    doc._doc["_rev"] = revisions_by_id[doc["_id"]]
        else:
            docs = []

        return docs
