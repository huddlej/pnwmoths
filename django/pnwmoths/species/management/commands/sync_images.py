import logging
import optparse
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
    option_list = BaseCommand.option_list + (
        optparse.make_option(
            "--dry-run",
            action="store_true",
            dest="dry_run",
            default=False,
            help="Run command printing output without making any changes"
        ),
    )

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.species_cache = {}
        self.path = os.path.join(settings.MEDIA_ROOT, SpeciesImage.IMAGE_PATH)
        self.database = "pnwmoths"

        # Remove trailing slash from path if it exists.
        if self.path.endswith(os.sep):
            self.path = self.path[:-1]

    def handle(self, *args, **options):
        """
        Sync images on the filesystem with the record of images in the database.

        Any images on the filesystem that don't exist in the database should have
        new database entries. Any images in the database that no longer exist on the
        filesystem should be deleted from the database.
        """
        print "Syncing path %s to database %s" % (self.path, self.database)
        if options["dry_run"]:
            print "Dry run"
        else:
            print "Real thing"

        root_path, base_path = os.path.split(self.path)
        files = self.get_files(self.path)
        files = [os.path.join(base_path, filename) for filename in files]

        # Delete image records that don't have files on the filesystem.
        docs = SpeciesImage.objects.exclude(image__in=files)
        logging.info("Deleting %i files from database", docs.count())

        if options["dry_run"]:
            print "Deleting %i files from database" % docs.count()
            print docs
        else:
            docs.delete()

        # Update images in the database that have changed on the filesystem.
        files_in_db = set(SpeciesImage.objects.filter(image__in=files).values_list("image", flat=True))
        files = set(files)
        files_not_in_db = files - files_in_db

        # Create SpeciesImage instances for files that are in the filesystem but not
        # the database.
        objects = []
        for filename in files_not_in_db:
            if filename.endswith(("medium", "thumbnail", "Thumbs.db")):
                continue

            kwargs = {
                "image": filename,
                "species": self.get_species_for_file(filename)
            }
            objects.append(SpeciesImage(**kwargs))

        if options["dry_run"]:
            print "Inserting %i objects into %s" % (len(objects), self.database)
            print objects
        else:
            # Save new records in one query.
            insert_many(objects, self.database)

    def get_species_for_file(self, filename):
        """
        Returns a Species instance for a given filename. Filenames usually look like
        this:

        moths/Acronicta cyanescens-A-D.jpg

        >>> get_species_for_file("moths/Acronicta cyanescens-A-D.jpg")
        <Species: Acronicta cyanescens>
        """
        path, filename = os.path.split(filename)
        pieces = filename.split("-")
        binomial_name = pieces[0]

        if binomial_name in self.species_cache:
            logger.debug("hit cache: %s" % binomial_name)
            return self.species_cache[binomial_name]

        logger.debug("missed cache: %s" % binomial_name)
        genus, species = binomial_name.split(" ", 1)
        instance, created = Species.objects.get_or_create(genus=genus, species=species)
        self.species_cache[binomial_name] = instance

        return instance

    def get_files(self, path):
        """
        Returns a list of all files relative to the given path.
        """
        return os.listdir(path)
