import csv
import re

from django import forms

from models import Collection, Collector, County, Species, SpeciesRecord, State

registered_models = {"SpeciesRecord": SpeciesRecord}


class LazyIntegerField(forms.IntegerField):
    def clean(self, value):
        """
        Tries to find an integer in the given value. If the value is a string,
        uses a regular expression to pull the first integer value out.

        Returns None if value is an empty string.
        """
        if isinstance(value, basestring):
            value = value.strip() or None
            if value is not None:
                # First wildcard match is greedy to allow integer group to get
                # all integer-like values.
                match = re.match(r".*?(\d+).*", value)
                if match:
                    value = match.groups()[0]

        return super(LazyIntegerField, self).clean(value)


class SpeciesRecordForm(forms.ModelForm):
    genus = forms.CharField(required=False)
    species = forms.CharField()
    city = forms.CharField(required=False)
    collector = forms.CharField(required=False)
    collection = forms.CharField(required=False)
    county = forms.CharField(required=False)
    males = LazyIntegerField(required=False)
    females = LazyIntegerField(required=False)
    state = forms.CharField(required=False)
    notes = forms.CharField(required=False)

    class Meta:
        model = SpeciesRecord
        exclude = ("county",)

    def _get_instance_by_name(self, field_name, field_class, field_key,
                              create_missing=False):
        """
        Cleans an instance name and returns an instance or raises a
        ValidationError if one doesn't exist for the given name.
        """
        value = self.cleaned_data.get(field_name, "").strip()

        if value:
            try:
                kwargs = {field_key: value}
                if create_missing:
                    value, created = field_class.objects.get_or_create(**kwargs)
                else:
                    value = field_class.objects.get(**kwargs)
            except field_class.DoesNotExist, e:
                raise forms.ValidationError(e.message)
        else:
            value = None

        return value

    def clean_genus(self):
        return self.cleaned_data.get("genus", "").strip()

    def clean_collection(self):
        return self._get_instance_by_name("collection", Collection, "name")

    def clean_collector(self):
        return self._get_instance_by_name("collector", Collector, "name")

    def clean_state(self):
        return self._get_instance_by_name("state", State, "code")

    def clean(self):
        cleaned_data = self.cleaned_data

        # Species are created if they don't exist.
        if cleaned_data.get("genus") and cleaned_data.get("species"):
            species_instance, created = Species.objects.get_or_create(
                genus=cleaned_data.get("genus"),
                species=cleaned_data.get("species")
            )
            cleaned_data["species"] = species_instance

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
