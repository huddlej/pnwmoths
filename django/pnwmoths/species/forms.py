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
    model = forms.ChoiceField(choices=MODEL_CHOICES)
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
        model = self.cleaned_data["model"]
        #model = registered_models.get(self.cleaned_data["model"])
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

            try:
                coerced_doc = model.coerce(doc)
                if self.cleaned_data["overwrite"]:
                    instance, created = model.objects.get_or_create(**coerced_doc)
                else:
                    instance = model.objects.create(**coerced_doc)
            except ValueError, e:
                errors.append((coerced_doc, ))

        return errors
