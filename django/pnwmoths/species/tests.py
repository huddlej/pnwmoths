"""
Species application tests.
"""
import csv
import os

from django.test import TestCase

from forms import ImportSpeciesRecordsForm
from models import SpeciesRecord


class TestImportSpeciesRecordsForm(TestCase):
    fixtures = ["species.json",
                "collectors.json",
                "collections.json",
                "counties.json",
                "states.json"]

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
