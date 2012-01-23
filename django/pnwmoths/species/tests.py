"""
Species application tests.
"""
import csv
import os

from django import forms
from django.conf import settings
from django.test import TestCase

from forms import ImportSpeciesRecordsForm, LazyIntegerField, SpeciesRecordForm
from management.commands.sync_images import Command
from models import Species, SpeciesImage, SpeciesRecord


class TestSyncImages(TestCase):
    def setUp(self):
        self.command = Command()

    def test_get_binomial_for_file(self):
        # Test simple name.
        self.assertEqual(
            "Acronicta cyanescens",
            self.command.get_binomial_for_file(
                "moths/Acronicta cyanescens-A-D.jpg"
            )
        )

        # Test hyphenated name.
        self.assertEqual(
            "Autographa v-alba",
            self.command.get_binomial_for_file(
                "moths/Autographa v-alba-A-D.jpg"
            )
        )

    def test_get_species_by_filename(self):
        genus = "Acronicta"
        species = "cyanescens"
        filename = "moths/%s %s-A-D.jpg" % (genus, species)
        instance = Species.objects.create(genus=genus, species=species)
        instance_by_filename = self.command.get_species_by_filename(filename)
        self.assertEqual(instance, instance_by_filename)


class TestSpeciesImage(TestCase):
    def test_order_by_weight(self):
        species = Species.objects.create(
            genus="Fake",
            species="fakerton"
        )
        image_args = {
            "species": species,
            "image": "/fake/path/image.png",
        }

        # Make sure there are no images in the database.
        SpeciesImage.objects.all().delete()

        # Generate images with weights 3, 0, and -3.
        images = []
        for i in xrange(3, -4, -3):
            image_args["weight"] = i
            images.append(SpeciesImage.objects.create(**image_args))

        # Confirm images are sorted in the database as they are weighted.
        db_images = list(SpeciesImage.objects.all())
        images.reverse()
        self.assertEqual([image.id for image in images],
                         [image.id for image in db_images])


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
        # Example of a record exported from Django's admin interface with an
        # existing id.
        self.exported_record = {'collection': 'ODA',
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
        form = SpeciesRecordForm(self.exported_record)
        form.save()
        self.assertNotEqual(self.exported_record["id"], form.instance.pk)

        # Set the record id to the actual primary key and confirm that the
        # resulting instance is the same as the original.
        self.exported_record["id"] = form.instance.pk
        update_form = SpeciesRecordForm(self.exported_record)
        update_form.save()
        self.assertEqual(self.exported_record["id"], update_form.instance.pk)


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
        self.assertEqual(None, self.field.clean(value))


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
