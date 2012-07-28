import csv
import re
import logging

from django import forms
from models import Collection, Collector, County, Species, SpeciesRecord, State, SpeciesImage, PlateImage
from django.forms import ModelMultipleChoiceField, ModelForm
from django.contrib.admin.widgets import FilteredSelectMultiple

registered_models = {"SpeciesRecord": SpeciesRecord}

class PlateSpeciesChoiceField(ModelMultipleChoiceField):
    def label_from_instance(self, obj):
        # return noc id | genus species for plateimage display
        return "%s | %s" % (obj.noc_id, obj)

class PlateImageAdminForm(ModelForm):
    class Meta:
        model = PlateImage
    member_species = PlateSpeciesChoiceField(queryset=Species.objects.all().order_by('noc_id'), required=False, widget=FilteredSelectMultiple("Member Species", is_stacked=False))

"""
TODO: This needs refactoring.
"""

class LazyIntegerField(forms.IntegerField):
    widget = forms.TextInput(attrs={"size": "3"})

    def __init__(self, *args, **kwargs):
        self.clean_type = kwargs.get("field_type", None)
        if kwargs.get("field_type"):
            del kwargs["field_type"]

        super(LazyIntegerField, self).__init__(*args, **kwargs)
        self.required = False

    def clean(self, value):
        """
        Tries to find an integer in the given value. If the value is a string,
        uses a regular expression to pull the first integer value out.

        Returns None if an integer can't be found.
        """
        if isinstance(value, basestring):
            value = value.strip() or None
            clean_type = self.clean_type

            if value is not None:
                # First wildcard match is greedy to allow integer group to get
                # all integer-like values (takes negatives)
                match = re.match(r".*?(-?\d+).*", value)

                if clean_type == "male" or clean_type == "female":
                    if match:
                        # For males/females counts we check for indeterminate sexing
                        # and counts. A negative is assigned to unsexed counts.
                        if "[" in value:
                            value = "-" + match.groups()[0]
                        else:
                            value = match.groups()[0]
                    elif value.lower() == "[x]":
                        # No integer match, so we'll check for the unsexed/uncounted type
                        value = "-999999"
                    else:
                        value = None
                
                elif clean_type == "elevation":
                    elev = match.groups()[0]
                    if "-" in value:
                        e_avg = int(elev)
                        e_avg += int(re.match(r".*?(-?\d+).*", value[value.find("-")+1:]).groups()[0])
                        e_avg /= 2
                        elev = int(e_avg)

                    if "m" in value.lower() and match:
                        value = str(int(int(elev) * 3.2808399))
                    elif match:
                        value = elev
                    else:
                        value = None

                elif clean_type == "month":
                    if match:
                        value = match.groups()[0]
                    else:
                        # Try coercing months to an integer
                        value = value.replace(".", "")
                        month_dict = {'sep': 9, 'september': 9, 'december': 12, 'november': 11, 'feb': 2, 'aug': 8, 'jan': 1, 'apr': 4, 'oct': 10, 'mar': 3, 'march': 3, 'august': 8, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7, 'february': 2, 'october': 10, 'nov': 11, 'january': 1, 'april': 4, 'dec': 12}
                        value = month_dict.get(value.lower(), None)

                else:
                    if match:
                        value = match.groups()[0]
                    else:
                        value = None

        return super(LazyIntegerField, self).clean(value)


class LazyFloatField(forms.FloatField):
    def __init__(self, *args, **kwargs):
        super(LazyFloatField, self).__init__(*args, **kwargs)

    def clean(self, value):
        """
        Grabs the first float, ignoring stuff like N, W etc.
        """
        if isinstance(value, basestring):
            value = value.strip() or None

            if value is not None:
                if value.count(".") == 2 and "-" not in value[1:]:
                    # We have a 113.32.60 format (minutes format)
                    m = re.findall(r"[-+]?\d*.\d*.\d*", value)
                    val = m[0].split('.', 1)
                    dec = float(val[1]) / 60.0
                    if "s" in value.lower() or "w" in value.lower():
                        value = "-"
                    else:
                        value = ""
                    # [1:] removes the decimal from our converted minutes
                    value += str(val[0]) + str(dec)[1:]
                    
                # grab first float/integer
                match = re.findall(r"[-+]?\d*\.\d+|\d+", value)
                if match:
                    # Compute the average if in 37.342-358 format
                    if len(match) > 1:
                        f_avg = float(match[0])
                        # construct our new upper bound
                        inferred_num = match[0]
                        # doing some creative stripping here due to the variety
                        # of formats that have appeared for lat/lon ranges...
                        # e.g 45.234-256, 45.234-.266
                        inferred_num = inferred_num[:inferred_num.find(".")+1] + str(match[1].replace(".", "").replace("-", ""))
                        f_avg += float(inferred_num)
                        f_avg /= 2
                        # set to match for the next operations
                        match[0] = str(f_avg)

                    # S/W GPS values get a negative added
                    if "s" in value.lower() or "w" in value.lower():
                        value = "-" + match[0]
                    else:
                        value = match[0]
                else:
                    value = None

        return super(LazyFloatField, self).clean(value)


class SpeciesRecordForm(forms.Form):
    attrs = {"size": "4"}
    filename = forms.CharField(required=False)
    id = forms.IntegerField(required=False, widget=forms.TextInput(attrs=attrs))
    # prepending the blank tuple keeps the form from validating with a bad csv record type
    record_type = forms.ChoiceField(required=True, choices=(('', '------'),)+SpeciesRecord.RECORD_TYPE_CHOICES)
    type_status = forms.CharField(required=False)
    genus = forms.CharField(required=False)
    species = forms.CharField()
    latitude = LazyFloatField(required=False, widget=forms.TextInput(attrs=attrs))
    longitude = LazyFloatField(required=False, widget=forms.TextInput(attrs=attrs))
    locality = forms.CharField(required=False)
    county = forms.CharField(required=False)
    state = forms.CharField(required=False, widget=forms.TextInput(attrs=attrs))
    elevation = LazyIntegerField(field_type="elevation")
    month = LazyIntegerField(field_type="month")
    day = LazyIntegerField()
    year = LazyIntegerField()
    collector = forms.CharField(required=False)
    collection = forms.CharField(required=False)
    males = LazyIntegerField(field_type="male")
    females = LazyIntegerField(field_type="female")
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={"rows": "5"})
    )
    csv_file = forms.CharField(required=True)

    def __init__(self, *args, **kwargs):
        super(SpeciesRecordForm, self).__init__(*args, **kwargs)
        self._parse_filename()
   
    def _parse_filename(self):
        """
        Checks for the existence of filename data and if its found,
        attempts to parse and replace species, genus data.
        """
        if 'filename' in self.data and 'species' not in self.data:
            SPECIES_RE = r"(\w+ [-\w]+)-\w-\w"
            filename_regex = re.compile(SPECIES_RE)
            match = filename_regex.findall(self.data['filename'])
            try:
                self.data['genus'], self.data['species'] = match[0].split(" ", 1)
            except IndexError:
                self.data['genus'] = self.data['filename']

    def _regex_filename(self, fn):
        # replace the first division between genus/species with a regex
        for illegal in " _-":
            if illegal in fn:
                return fn.replace(illegal, "(_| |-)", 1)

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

    def _get_model(self):
        return SpeciesRecord

    def clean_genus(self):
        return self.cleaned_data.get("genus", "").strip()

    def clean_collection(self):
        return self._get_instance_by_name("collection", Collection, "name",
                                          create_missing=True)

    def clean_collector(self):
        return self._get_instance_by_name("collector", Collector, "name",
                                          create_missing=True)

    def clean_state(self):
        return self._get_instance_by_name("state", State, "code")

    def clean(self):
        cleaned_data = super(SpeciesRecordForm, self).clean()

        # Check to see if the filename points to valid images
        if cleaned_data.get("filename"):
            fn = cleaned_data.get("filename")
            # generate our dorsal/ventral images
            pair_images = False

            # -label indicates a Dorsal/Ventral combo
            # otherwise we only look for a single image
            if "-label" in fn:
                fn_D = fn.replace("label", "D")
                fn_V = fn.replace("label", "V")

                fn_D = self._regex_filename(fn_D)
                fn_V = self._regex_filename(fn_V)
                pair_images = True
            else:
                fn = self._regex_filename(fn)

            try:
                # Check if the files exist that we're trying to link to
                if pair_images:
                    SpeciesImage.objects.get(image__iregex=fn_D)
                    SpeciesImage.objects.get(image__iregex=fn_V)
                else:
                    SpeciesImage.objects.get(image__iregex=fn)
            except SpeciesImage.DoesNotExist:
                # If they don't, or the names are too generic we throw a form error.
                del cleaned_data['filename']
                raise forms.ValidationError("Filename doesn't exist.")
            except SpeciesImage.MultipleObjectsReturned:
                del cleaned_data['filename']
                raise forms.ValidationError("Filename is too generic [identifies more than 2 images]")
            except:
                del cleaned_data['filename']
                raise forms.ValidationError("Filename problem...")

        # Check for reared terms in notes and move the day/year/month accordingly
        if cleaned_data.get("notes"):
            for term in SpeciesImage.REARED_TERMS:
                if term.lower() in cleaned_data['notes'].lower():
                    # If a reared term is present, we move our d/m/y into notes
                    months = {1: "January", 2: "February", 3: "March", 4: "April", 5: "May",6: "June",7: "July",8: "August",9: "September",10: "October",11: "November",12:"December"}

                    month = cleaned_data.get("month")
                    day = cleaned_data.get("day")
                    year = cleaned_data.get("year")

                    # Create our string to append to our notes
                    if month or day or year:
                        append_str = ";\n"
                    if month:
                        append_str += months[month]
                        if day:
                            append_str += " "
                    if day:
                        append_str += str(day)
                    if (day or month) and year:
                        append_str += ", "
                    if year:
                        append_str += str(year)

                    if month or day or year:
                        cleaned_data['notes'] += append_str

                    # Clear our dates
                    if cleaned_data.get("day"):
                        cleaned_data["day"] = None
                    if cleaned_data.get("month"):
                        cleaned_data["month"] = None
                    if cleaned_data.get("year"):
                        cleaned_data["year"] = None

                    break

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
                try:
                    species_instance = Species.objects.get(
                        genus=genus,
                        species=species
                    )
                    cleaned_data["species"] = species_instance
                except Exception:
                    if cleaned_data.get("genus"):
                        del self.cleaned_data["genus"]
                    if cleaned_data.get("species"):
                        del self.cleaned_data["species"]
                    raise forms.ValidationError("Species does not exist.")
            else:
                if cleaned_data.get("genus"):
                    del self.cleaned_data["genus"]
                if cleaned_data.get("species"):
                    del self.cleaned_data["species"]
                raise forms.ValidationError("Need a genus and species")

        if cleaned_data.get("county") is not None:
            county = cleaned_data.get("county").strip()
            if county and cleaned_data.get("state"):
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
                    raise forms.ValidationError("County '%s' doesn't exist." % county)
            else:
                del cleaned_data["county"]

        return cleaned_data

    def save(self, commit=True):
        if self.is_valid():
            # Clean up fields that aren't in SpeciesRecords.
            if "DELETE" in self.cleaned_data:
                del self.cleaned_data["DELETE"]
            if "genus" in self.cleaned_data:
                del self.cleaned_data["genus"]
            fn = self.cleaned_data.get("filename")
            if "filename" in self.cleaned_data:
                del self.cleaned_data["filename"]

            cls = self._get_model()
            self.instance = cls(**self.cleaned_data)
            if commit:
                self.instance.save()
                # changing image label fields is an additive process 
                if fn:
                    if "-label" in fn:
                        fn_D = fn.replace("label", "D")
                        fn_V = fn.replace("label", "V")
                        fn_D = self._regex_filename(fn_D)
                        fn_V = self._regex_filename(fn_V)

                        f_D = SpeciesImage.objects.get(image__iregex=fn_D)
                        f_V = SpeciesImage.objects.get(image__iregex=fn_V)

                        # delete the old label(s) because it would turn into a
                        # record on update
                        # Almost always we should be going into this first if statement
                        if f_D.record == f_V.record and f_D.record:
                            old = f_D.record.pk
                            f_D.record = None
                            f_V.record = None
                            f_D.save()
                            f_V.save()
                            SpeciesRecord.objects.get(pk=old).delete()
                        else:
                            if f_D.record:
                                old = f_D.record.pk
                                f_D.record = None
                                f_D.save()
                                SpeciesRecord.objects.get(pk=old).delete()
                            if f_V.record:
                                old = f_V.record.pk
                                f_V.record = None
                                f_V.save()
                                SpeciesRecord.objects.get(pk=old).delete()

                        f_D.record = self.instance
                        f_V.record = self.instance

                        f_D.save()
                        f_V.save()
                    else:
                        # Save a single image
                        fn = self._regex_filename(fn)
                        f = SpeciesImage.objects.get(image__iregex=fn)
                        if f.record:
                            old = f.record.pk
                            f.record = None
                            f.save()
                            SpeciesRecord.objects.get(pk=old).delete()
                        f.record = self.instance
                        f.save()

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
