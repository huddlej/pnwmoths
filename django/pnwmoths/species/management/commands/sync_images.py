import logging
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from pnwmoths.species.models import Species, SpeciesImage
from bulkops import insert_many

logger = logging.getLogger("sync_media")


class Command(BaseCommand):
    """
    Sync images for the species application.

    For example: ./manage.py sync_images
    """
    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.species_cache = {}
        self.path = os.path.join(settings.MEDIA_ROOT, SpeciesImage.IMAGE_PATH)
        self.database = "pnwmoths"

    def handle(self, *args, **kwargs):
        """
        Sync images on the filesystem with the record of images in the database.

        Any images on the filesystem that don't exist in the database should have
        new database entries. Any images in the database that no longer exist on the
        filesystem should be deleted from the database.
        """
        root_path, base_path = os.path.split(self.path)
        files = self.get_files(self.path)
        files = [os.path.join(base_path, filename) for filename in files]

        # Delete image records that don't have files on the filesystem.
        docs = SpeciesImage.objects.exclude(image__in=files)
        logging.info("Deleting %i files from database", docs.count())
        docs.delete()

        # Update images in the database that have changed on the filesystem.
        files_in_db = set(SpeciesImage.objects.filter(image__in=files).value_list("image", flat=True))
        files = set(files)
        files_not_in_db = files - files_in_db

        # Create SpeciesImage instances for files that are in the filesystem but not
        # the database.
        objects = []
        for filename in files_not_in_db:
            kwargs = {
                "image": os.path.join(base_path, filename),
                "species": self.get_species_for_file(filename)
            }
            objects.append(SpeciesImage(**kwargs))

        # Save new records in one query.
        insert_many(objects, self.database)

    def get_species_for_file(self, filename):
        """
        Returns a Species instance for a given filename. Filenames usually look like
        this:

        Acronicta cyanescens-A-D.jpg

        >>> _get_species_for_file("Acronicta cyanescens-A-D.jpg")
        <Species: Acronicta cyanescens>
        """
        pieces = filename.split("-")
        binomial_name = pieces[0]

        if binomial_name in self.species_cache:
            logger.debug("hit cache: %s" % binomial_name)
            return self.species_cache[binomial_name]

        logger.debug("missed cache: %s" % binomial_name)
        genus, species = binomial_name.split()
        instance = Species.objects.get(genus=genus, species=species)
        self.species_cache[binomial_name] = instance

        return instance

    def get_files(self, path):
        """
        Returns a list of all files relative to the given path.
        """
        return os.listdir(path)
