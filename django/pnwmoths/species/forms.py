import csv

from django import forms

from models import Collection, Collector, County, Species, SpeciesRecord, State

registered_models = {"SpeciesRecord": SpeciesRecord}


class SpeciesRecordForm(forms.ModelForm):
    genus = forms.CharField()
    species = forms.CharField(required=False)
    city = forms.CharField(required=False)
    collector = forms.CharField(required=False)
    collection = forms.CharField(required=False)
    county = forms.CharField(required=False)
    state = forms.CharField(required=False)
    notes = forms.CharField(required=False)

    class Meta:
        model = SpeciesRecord
        exclude = ("county",)

    def clean_collection(self):
        value = self.cleaned_data.get("collection") or None

        if value:
            try:
                value = Collection.objects.get(name=value)
            except Collection.DoesNotExist, e:
                raise forms.ValidationError(e.message)

        return value

    def clean_collector(self):
        value = self.cleaned_data.get("collector") or None

        if value:
            try:
                value = Collector.objects.get(name=value)
            except Collector.DoesNotExist, e:
                raise forms.ValidationError(e.message)

        return value

    def clean_state(self):
        value = self.cleaned_data.get("state") or None

        if value:
            try:
                value = State.objects.get(code=value)
            except State.DoesNotExist, e:
                raise forms.ValidationError(e.message)

        return value

    def clean(self):
        cleaned_data = self.cleaned_data

        try:
            species_instance = Species.objects.get(
                genus=cleaned_data.get("genus"),
                species=cleaned_data.get("species")
            )
            cleaned_data["species"] = species_instance
        except Species.DoesNotExist, e:
            del self.cleaned_data["species"]
            raise forms.ValidationError(e.message)

        if cleaned_data.get("county"):
            if cleaned_data.get("state"):
                try:
                    cleaned_data["county"] = County.objects.get(
                        name=cleaned_data.get("county"),
                        state=cleaned_data.get("state")
                    )
                except County.DoesNotExist, e:
                    del self.cleaned_data["county"]
                    raise forms.ValidationError("County doesn't exist.")
            else:
                del cleaned_data["county"]

        cleaned_data["locality"] = cleaned_data.get("city")

        return cleaned_data


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
