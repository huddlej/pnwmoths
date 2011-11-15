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
    id = forms.IntegerField(required=False, widget=forms.HiddenInput)
    genus = forms.CharField(required=False)
    species = forms.CharField()
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
        if cleaned_data.get("species"):
            species = cleaned_data.get("species")

            # If genus is defined, it must have its own column. Otherwise, it's
            # probably part of the species name in the form of a binomial.
            if cleaned_data.get("genus"):
                genus = cleaned_data.get("genus")
            else:
                # Try splitting the species name no more than one time on
                # spaces.
                pieces = species.split(" ", 1)
                if len(pieces) >= 2:
                    # Unpack each piece into genus and species names.
                    genus, species = pieces
                else:
                    genus = None

            if genus and species:
                species_instance, created = Species.objects.get_or_create(
                    genus=genus,
                    species=species
                )
                cleaned_data["species"] = species_instance

        # If a Species instance doesn't exist for the given data, alert the
        # user.
        if not isinstance(cleaned_data.get("species"), Species):
            # Delete the species entry from cleaned data if it is defined.
            if cleaned_data.get("species"):
                del cleaned_data["species"]
            raise forms.ValidationError("Species isn't defined.")

        if cleaned_data.get("county"):
            county = cleaned_data.get("county")
            if cleaned_data.get("state"):
                # Check for state code in parentheses after the county name. For
                # example, "Skagit (WA)". Split the name on spaces and rejoin
                # without the last element.
                if "(" in county:
                    county = " ".join(county.split()[:-1])

                try:
                    cleaned_data["county"] = County.objects.get(
                        name=county,
                        state=cleaned_data.get("state")
                    )
                except County.DoesNotExist, e:
                    del self.cleaned_data["county"]
                    raise forms.ValidationError("County doesn't exist.")
            else:
                del cleaned_data["county"]

        return cleaned_data

    def save(self, commit=True):
        if self.is_valid():
            # Clean up fields that aren't in SpeciesRecords.
            del self.cleaned_data["city"]
            del self.cleaned_data["genus"]

            self.instance = SpeciesRecord(**self.cleaned_data)
            if commit:
                self.instance.save()
            else:
                return self.instance
        else:
            raise forms.ValidationError("Data for record didn't validate.")


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
