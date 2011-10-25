import csv

from django import forms

from models import SpeciesRecord

registered_models = {"SpeciesRecord": SpeciesRecord}


class SpeciesRecordForm(forms.ModelForm):
    genus = forms.CharField()
    species = forms.CharField()
    city = forms.CharField()
    collector = forms.CharField()
    collection = forms.CharField()
    county = forms.CharField()
    state = forms.CharField()
    notes = forms.CharField()

    class Meta:
        model = SpeciesRecord


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

    def import_data(self, model, file, delimiter, overwrite=False, dry_run=True):
        """
        Parses the given file object as a CSV file and creates an instance of
        the given model for each row. The values of the first row define the
        attribute names for each column.
        """
        reader = csv.reader(file, delimiter=delimiter)
        errors = []
        results = []

        # Get all non-empty column names using the first row of the data.
        column_names = [column.strip()
                        for column in reader.next()
                        if column.strip()]
        column_range = xrange(len(column_names))

        for row in reader:
            # Map row values to corresponding column names.
            doc = dict([(column_names[i], row[i])
                        for i in column_range
                        if len(row[i]) > 0])

            try:
                coerced_doc = model.coerce(**doc)

                # If this is a dry run, create the model instances, but do not
                # save them.
                if dry_run:
                    instance = model(**coerced_doc)
                elif overwrite:
                    instance, created = model.objects.get_or_create(**coerced_doc)
                else:
                    instance = model.objects.create(**coerced_doc)

                results.append(instance)
            except ValueError, e:
                errors.append(doc)

        return results, errors
