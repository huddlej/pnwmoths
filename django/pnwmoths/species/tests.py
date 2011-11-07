"""
Species application tests.
"""
import csv
import os

from django import forms
from django.test import TestCase

from forms import ImportSpeciesRecordsForm, LazyIntegerField, SpeciesRecordForm
from models import SpeciesRecord


class TestImageSync(TestCase):
    def test_get_files(self):
        path = os.path.join(settings.MEDIA_ROOT, SpeciesImage.IMAGE_PATH)
        syncer = ImageSyncer()
        files = syncer.get_files(path)
        self.assertTrue(len(files) > 0)


class TestImportSpeciesRecordsForm(TestCase):
    def setUp(self):
        self.model = SpeciesRecord
        path, current_file = os.path.split(os.path.abspath(__file__))
        filename = os.path.join(path, "test_data.csv")
        self.file = open(filename, "r")
        self.delimiter = ","

    def tearDown(self):
        self.file.close()

    def test_import_data(self):
        """
        Tests import of CSV data into a given model.

        import_data(self, model, file, delimiter, overwrite=False, dry_run=True):
        """
        form = ImportSpeciesRecordsForm()
        results, errors = form.import_data(self.model, self.file, self.delimiter)
        self.assertEqual(0, len(errors))
        self.assertTrue(len(results) > 0)
        self.assertTrue(isinstance(results[0], model))


class TestSpeciesRecordForm(TestCase):
    def setUp(self):
        self.record = {'collection': 'ODA',
                       'collector': 'Harold Foster',
                       'county': None,
                       'date_added': '2011-11-07 01:28:32',
                       'date_modified': '2011-11-07 01:28:32',
                       'day': '30',
                       'elevation': '230',
                       'females': '0',
                       'id': '261998',
                       'latitude': '44.72',
                       'locality': 'Jefferson',
                       'longitude': -123.01000000000001,
                       'males': '1',
                       'month': '6',
                       'notes': '',
                       'species': 'Antheraea polyphemus',
                       'state': 'OR',
                       'year': '1960'}

    def test_update_records(self):
        """
        Confirms that saving a species record form with an id for an existing
        record updates the record instead of adding a new one.
        """
        # Create a new instance of this record.
        form = SpeciesRecordForm(self.record)
        form.save()
        self.assertNotEqual(self.record["id"], form.instance.pk)

        # Set the record id to the actual primary key and confirm that the
        # resulting instance is the same as the original.
        self.record["id"] = form.instance.pk
        update_form = SpeciesRecordForm(self.record)
        update_form.save()
        self.assertEqual(self.record["id"], update_form.instance.pk)


class TestLazyIntegerField(TestCase):
    def setUp(self):
        self.field = LazyIntegerField(required=False)

    def test_empty_string(self):
        self.assertEqual(None, self.field.clean(""))

    def test_whitespace_string(self):
        self.assertEqual(None, self.field.clean("  "))

    def test_integer_string(self):
        value = "1"
        self.assertEqual(int(value), self.field.clean(value))

    def test_nested_integer_string(self):
        integer = 123
        value = "[[%s]]" % integer
        self.assertEqual(integer, self.field.clean(value))

    def test_integer(self):
        value = 123
        self.assertEqual(value, self.field.clean(value))

    def test_non_integer(self):
        value = "[x]"
        self.assertRaises(forms.ValidationError, self.field.clean, value)


__test__ = {"doctest": """
>>> from django.template import Context
>>> from species.models import Species
>>> from species.templatetags.species_tags import SpeciesByNameNode
>>> species = Species.objects.create(genus="Acronicta", species="cyanescens")
>>> context = Context({"name": "Acronicta cyanescens"})
>>> node = SpeciesByNameNode("name", "species")
>>> node.render(context)
''
>>> context["species"]
<Species: Acronicta cyanescens>
"""}
