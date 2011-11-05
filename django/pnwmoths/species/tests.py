"""
Species application tests.
"""
import csv
import os

from django import forms
from django.test import TestCase

from forms import ImportSpeciesRecordsForm, LazyIntegerField
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
